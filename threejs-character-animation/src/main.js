import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';

// ============================================================
//  LOADER MANAGEMENT
// ============================================================
const loaderEl        = document.getElementById('loader');
const progressFillEl  = document.getElementById('progress-fill');
const progressPctEl   = document.getElementById('progress-pct');
const progressStatusEl = document.getElementById('progress-status');

// 13 assets: sky.exr · soccer-goal.glb · character.fbx · 10 animations
const TOTAL_ASSETS = 13;
let assetsLoaded   = 0;
let fakeProgress   = 0;
let loaderFinished = false;

const fakeProgressTimer = setInterval(() => {
  if (fakeProgress < 88 && !loaderFinished) {
    fakeProgress += (88 - fakeProgress) * 0.022 + 0.18;
    _renderProgress(fakeProgress);
  }
}, 55);

function _renderProgress(pct) {
  const real    = (assetsLoaded / TOTAL_ASSETS) * 100;
  const display = Math.min(Math.max(fakeProgress, real), loaderFinished ? 100 : 99.4);
  progressFillEl.style.width = display + '%';
  progressPctEl.textContent  = Math.floor(display) + '%';
}

function onAssetLoaded(statusText) {
  assetsLoaded++;
  progressStatusEl.textContent = statusText;
  _renderProgress(fakeProgress);

  if (assetsLoaded >= TOTAL_ASSETS) {
    loaderFinished = true;
    clearInterval(fakeProgressTimer);
    progressFillEl.style.width = '100%';
    progressPctEl.textContent  = '100%';
    progressStatusEl.textContent = 'Match starting!';

    setTimeout(() => {
      loaderEl.classList.add('fade-out');
    }, 700);
  }
}
// ============================================================

await RAPIER.init();
const gravity = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 3, 8);

const cameraOffset = new THREE.Vector3(
  0,
  4,
  8
);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

// Controls
// new OrbitControls(camera, renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// White chalk lines on a transparent canvas — overlaid on top of the grass plane
function createPitchLinesTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const scale = canvas.width / 60; // pixels per world unit (equal on both axes)

  // Leave background transparent so the grass texture shows through
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = (x) => (x + 30) * scale;
  const cy = (z) => (z + 60) * scale;

  function sRect(x, z, w, h) {
    ctx.beginPath();
    ctx.rect(cx(x), cy(z), w * scale, h * scale);
    ctx.stroke();
  }
  function sLine(x1, z1, x2, z2) {
    ctx.beginPath();
    ctx.moveTo(cx(x1), cy(z1));
    ctx.lineTo(cx(x2), cy(z2));
    ctx.stroke();
  }
  function sArc(x, z, r, a0, a1) {
    ctx.beginPath();
    ctx.arc(cx(x), cy(z), r * scale, a0, a1);
    ctx.stroke();
  }
  function fDot(x, z) {
    ctx.beginPath();
    ctx.arc(cx(x), cy(z), 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const PEN_W = 36, PEN_D = 19;
  const GOAL_W = 16, GOAL_D = 6;
  const PEN_DIST = 13;
  const ARC_R = 10;
  const arcAngle = Math.asin((PEN_D - PEN_DIST) / ARC_R);

  sRect(-30, -60, 60, 120);
  sLine(-30, 0, 30, 0);
  sArc(0, 0, ARC_R, 0, Math.PI * 2);
  fDot(0, 0);

  sRect(-PEN_W / 2, -60, PEN_W, PEN_D);
  sRect(-GOAL_W / 2, -60, GOAL_W, GOAL_D);
  fDot(0, -60 + PEN_DIST);
  sArc(0, -60 + PEN_DIST, ARC_R, arcAngle, Math.PI - arcAngle);

  sRect(-PEN_W / 2, 60 - PEN_D, PEN_W, PEN_D);
  sRect(-GOAL_W / 2, 60 - GOAL_D, GOAL_W, GOAL_D);
  fDot(0, 60 - PEN_DIST);
  sArc(0, 60 - PEN_DIST, ARC_R, Math.PI + arcAngle, 2 * Math.PI - arcAngle);

  sArc(-30, -60, 1, 0, Math.PI / 2);
  sArc(30, -60, 1, Math.PI / 2, Math.PI);
  sArc(-30, 60, 1, -Math.PI / 2, 0);
  sArc(30, 60, 1, Math.PI, Math.PI * 3 / 2);

  return new THREE.CanvasTexture(canvas);
}

// Ground — add your grass texture here via `map: grassTexture`
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 120),
  new THREE.MeshStandardMaterial({
    color: "#004126",
  })
);

// Pitch line overlay — transparent plane floating just above the grass
const pitchLines = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 120),
  new THREE.MeshBasicMaterial({
    map: createPitchLinesTexture(),
    transparent: true,
    depthWrite: false,
  })
);
pitchLines.rotation.x = -Math.PI / 2;
pitchLines.position.y = 0.01;
scene.add(pitchLines);

plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Movement bounds (keep the character on the plane)
const PLANE_WIDTH = 60;
const PLANE_LENGTH = 120;
const BOUND_MARGIN = 1; // keep the body from hanging over the edge
const bounds = {
  minX: -PLANE_WIDTH / 2 + BOUND_MARGIN,
  maxX: PLANE_WIDTH / 2 - BOUND_MARGIN,
  minZ: -PLANE_LENGTH / 2 + BOUND_MARGIN,
  maxZ: PLANE_LENGTH / 2 - BOUND_MARGIN,
};

const loader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const exrLoader = new EXRLoader();

// Goal dimensions
const goalHeight = 2.5;
const goalWidth = 8.5; 
const goalDepth = 3;

// Soccer Goals
gltfLoader.load('/models/GLB/soccer-goal.glb', (gltf) => {
  onAssetLoaded('Stadium loaded...');
  const goalModel = gltf.scene;

  // Adjust goal scale and appearance
  goalModel.scale.setScalar(1.5);
  goalModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const goal1 = goalModel;
  goal1.position.set(0, 0, -60 + goalDepth);
  scene.add(goal1);

  const goal2 = goalModel.clone();
  goal2.position.set(0, 0, 60 - goalDepth);
  goal2.rotation.y = Math.PI;
  scene.add(goal2);

  // Physics for goals (Posts and Crossbar)
  const postRadius = 0.15;

  function createGoalColliders(zPos, isRotated) {
    const zSign = isRotated ? -1 : 1;
    
    // Left Post
    const leftPostDesc = RAPIER.ColliderDesc.capsule(goalHeight / 2, postRadius);
    world.createCollider(leftPostDesc).setTranslation({ 
      x: -goalWidth / 2, 
      y: goalHeight / 2, 
      z: zPos 
    });

    // Right Post
    const rightPostDesc = RAPIER.ColliderDesc.capsule(goalHeight / 2, postRadius);
    world.createCollider(rightPostDesc).setTranslation({ 
      x: goalWidth / 2, 
      y: goalHeight / 2, 
      z: zPos 
    });

    // Crossbar
    const crossbarDesc = RAPIER.ColliderDesc.capsule(goalWidth / 2, postRadius);
    const crossbarRotation = { w: 0.707, x: 0, y: 0, z: 0.707 }; // Rotate 90 deg around Z
    const crossbarCollider = world.createCollider(crossbarDesc);
    crossbarCollider.setTranslation({ x: 0, y: goalHeight, z: zPos });
    crossbarCollider.setRotation(crossbarRotation);
      
    // Back support/Net (simplified as a box collider for the back part)
    const backWallDesc = RAPIER.ColliderDesc.cuboid(goalWidth / 2, goalHeight / 2, 0.1);
    world.createCollider(backWallDesc).setTranslation({ 
      x: 0, 
      y: goalHeight / 2, 
      z: zPos - (goalDepth * zSign) 
    });
  }

  createGoalColliders(-60 + goalDepth, false);
  createGoalColliders(60 - goalDepth, true);
});

// Physics Floor
const floorColliderDesc = RAPIER.ColliderDesc.cuboid(30, 0.1, 60)
  .setFriction(1.0); // High friction for grass
world.createCollider(floorColliderDesc);

// Physics Walls (Invisible)
const wallHeight = 2;
const wallThickness = 0.5;

// Left & Right walls
const sideWallDesc = RAPIER.ColliderDesc.cuboid(wallThickness, wallHeight, 60);
world.createCollider(sideWallDesc).setTranslation({ x: -30 - wallThickness, y: wallHeight, z: 0 });
world.createCollider(sideWallDesc).setTranslation({ x: 30 + wallThickness, y: wallHeight, z: 0 });

// Front & Back walls
const endWallDesc = RAPIER.ColliderDesc.cuboid(30, wallHeight, wallThickness);
world.createCollider(endWallDesc).setTranslation({ x: 0, y: wallHeight, z: -60 - wallThickness });
world.createCollider(endWallDesc).setTranslation({ x: 0, y: wallHeight, z: 60 + wallThickness });

// Football
let football;
let footballBody;
const ballRadius = 0.2;
const textureLoader = new THREE.TextureLoader();
const ballTexture = textureLoader.load('/models/textures/football-texture.jpg');

// Ensure correct color space and sharp mapping
ballTexture.colorSpace = THREE.SRGBColorSpace;
ballTexture.anisotropy = 16;
ballTexture.wrapS = THREE.ClampToEdgeWrapping;
ballTexture.wrapT = THREE.ClampToEdgeWrapping;

const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 32); 
const ballMaterial = new THREE.MeshStandardMaterial({ 
  map: ballTexture,
  roughnessMap: ballTexture, // Use texture to vary shine
  roughness: 0.9, 
  metalness: 0.0,
});
football = new THREE.Mesh(ballGeometry, ballMaterial);
football.castShadow = true;
football.receiveShadow = true;
scene.add(football);

// Football Physics
const ballRigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0, 5, -1.5) // Start a bit higher to see it fall
  .setLinearDamping(0.8) // Air/Ground resistance
  .setAngularDamping(0.8) // Rolling resistance
  .setCanSleep(true); // Allow it to rest
footballBody = world.createRigidBody(ballRigidBodyDesc);

const ballColliderDesc = RAPIER.ColliderDesc.ball(ballRadius)
  .setRestitution(0.5) // Slightly less bouncy
  .setFriction(1.0); 
world.createCollider(ballColliderDesc, footballBody);

// Character Physics
let characterBody;
const charBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
characterBody = world.createRigidBody(charBodyDesc);
const charColliderDesc = RAPIER.ColliderDesc.capsule(0.6, 0.3); // 1.8m total height
world.createCollider(charColliderDesc, characterBody);

let mixer;
let character;
let idleAction;
let runAction;
let jogForwardAction;
let jogForwardLeftAction;
let jogForwardRightAction;
let jogBackwardAction;
let jogBackwardLeftAction;
let jogBackwardRightAction;
let jogLeftAction;
let jogRightAction;
let currentAction;

const keys = {
  w: false,
  s: false,
  a: false,
  d: false,
  f: false,
  shift: false
};

let kickAction;
let isKicking = false;

function updateAnimation() {
  if (!character || isKicking) return;

  let actionToPlay = idleAction;

  if (keys.w && keys.a) {
    actionToPlay = jogForwardLeftAction;
  } else if (keys.w && keys.d) {
    actionToPlay = jogForwardRightAction;
  } else if (keys.s && keys.a) {
    actionToPlay = jogBackwardLeftAction;
  } else if (keys.s && keys.d) {
    actionToPlay = jogBackwardRightAction;
  } else if (keys.w) {
    actionToPlay = keys.shift ? runAction : jogForwardAction;
  } else if (keys.s) {
    actionToPlay = jogBackwardAction;
  } else if (keys.a) {
    actionToPlay = jogLeftAction;
  } else if (keys.d) {
    actionToPlay = jogRightAction;
  }

  playAction(actionToPlay);
}

function playAction(action) {
  if (!action) return;

  if (currentAction === action) return;

  if (currentAction) {
    currentAction.fadeOut(0.2);
  }

  action
    .reset()
    .fadeIn(0.2)
    .play();

  currentAction = action;
}

function kick() {
  if (!kickAction || isKicking) return;

  isKicking = true;
  playAction(kickAction);

  // Apply kick force after a small delay (to sync with animation)
  setTimeout(() => {
    if (character && footballBody) {
      const charPos = character.position;
      const ballPos = footballBody.translation();
      
      const dist = charPos.distanceTo(new THREE.Vector3(ballPos.x, charPos.y, ballPos.z));
      
      if (dist < 1.5) {
        // Direction from character to ball
        const direction = new THREE.Vector3(
          ballPos.x - charPos.x,
          0.5, // Lift the ball slightly
          ballPos.z - charPos.z
        ).normalize();

        const force = 15;
        footballBody.applyImpulse({ 
          x: direction.x * force, 
          y: direction.y * force, 
          z: direction.z * force 
        }, true);
      }
    }
  }, 300);

  // Return to normal after animation
  setTimeout(() => {
    isKicking = false;
    updateAnimation();
  }, 1000);
}

// Load HDRI for realistic lighting and reflections
exrLoader.load('/models/HDRIs/sky.exr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.background = texture;
  onAssetLoaded('Stadium lighting ready...');
});

// Load Character
loader.load('/models/character.fbx', (fbx) => {
  character = fbx;
  onAssetLoaded('Player model loaded...');

  character.scale.setScalar(0.01);

  character.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  character.rotation.y = Math.PI;
  scene.add(character);

  mixer = new THREE.AnimationMixer(character);

  // Load Idle Animation
  loader.load('/models/idle.fbx', (idleAnim) => {
    idleAction = mixer.clipAction(idleAnim.animations[0]);
    onAssetLoaded('Idle stance ready...');
    playAction(idleAction);
  });

  loader.load('/models/soccer-actions/jog forward.fbx', (jogForwardAnim) => {
    const clip = jogForwardAnim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogForwardAction = mixer.clipAction(clip);
    onAssetLoaded('Forward jog loaded...');
  });

  loader.load('/models/soccer-actions/jog forward diagonal (2).fbx', (anim) => {
    const clip = anim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogForwardLeftAction = mixer.clipAction(clip);
    onAssetLoaded('Diagonal moves loaded...');
  });

  loader.load('/models/soccer-actions/jog forward diagonal.fbx', (anim) => {
    const clip = anim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogForwardRightAction = mixer.clipAction(clip);
    onAssetLoaded('More diagonal moves...');
  });

  loader.load('/models/soccer-actions/jog backward diagonal (2).fbx', (anim) => {
    const clip = anim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogBackwardLeftAction = mixer.clipAction(clip);
    onAssetLoaded('Backwards training...');
  });

  loader.load('/models/soccer-actions/jog backward diagonal.fbx', (anim) => {
    const clip = anim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogBackwardRightAction = mixer.clipAction(clip);
    onAssetLoaded('Backward diagonals...');
  });

  loader.load('/models/soccer-actions/jog backward.fbx', (jogBackwardAnim) => {
    const clip = jogBackwardAnim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogBackwardAction = mixer.clipAction(clip);
    onAssetLoaded('Reverse jog loaded...');
  });

  loader.load('/models/soccer-actions/jog strafe left.fbx', (jogLeftAnim) => {
    const clip = jogLeftAnim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogLeftAction = mixer.clipAction(clip);
    onAssetLoaded('Left strafe loaded...');
  });

  loader.load('/models/soccer-actions/jog strafe right.fbx', (jogRightAnim) => {
    const clip = jogRightAnim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    jogRightAction = mixer.clipAction(clip);
    onAssetLoaded('Right strafe loaded...');
  });

  loader.load('/models/standard run.fbx', (runAnim) => {
    const clip = runAnim.animations[0];
    clip.tracks = clip.tracks.filter(track => !track.name.endsWith('.position'));
    runAction = mixer.clipAction(clip);
    onAssetLoaded('Sprint animation ready...');
  });
});



const clock = new THREE.Clock();

function animate() {

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (character && characterBody) {
    characterBody.setNextKinematicTranslation({
      x: character.position.x,
      y: character.position.y + 0.9,
      z: character.position.z
    });
  }

  // Step physics
  world.step();

  if (football && footballBody) {
    const pos = footballBody.translation();
    const rot = footballBody.rotation();
    football.position.set(pos.x, pos.y, pos.z);
    football.quaternion.set(rot.x, rot.y, rot.z, rot.w);

    // Goal Detection
    const inXRange = Math.abs(pos.x) < goalWidth / 2;
    const inYRange = pos.y < goalHeight;
    
    // Check Goal 1 (z < -60)
    if (inXRange && inYRange && pos.z < -60 && pos.z > -60 - goalDepth) {
      console.log('GOAL! Team A scores!');
    }
    
    // Check Goal 2 (z > 60)
    if (inXRange && inYRange && pos.z > 60 && pos.z < 60 + goalDepth) {
      console.log('GOAL! Team B scores!');
    }
  }

  if (mixer) {
    mixer.update(delta);
  }

  if (character) {
    const speed = keys.shift ? 6 : 3;
    if (keys.w) {
      character.position.z -= speed * delta;
    }

    if (keys.s) {
      character.position.z += speed * delta;
    }

    if (keys.a) {
      character.position.x -= speed * delta;
    }

    if (keys.d) {
      character.position.x += speed * delta;
    }

    // Keep the character within the plane
    character.position.x = THREE.MathUtils.clamp(
      character.position.x,
      bounds.minX,
      bounds.maxX
    );
    character.position.z = THREE.MathUtils.clamp(
      character.position.z,
      bounds.minZ,
      bounds.maxZ
    );

    // Camera Follow
    const desiredCameraPos = character.position.clone();

    desiredCameraPos.add(cameraOffset);

    camera.position.lerp(
      desiredCameraPos,
      0.08
    );

    camera.lookAt(
      character.position.x,
      character.position.y + 1.5,
      character.position.z
    );
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW') keys.w = true;
  if (event.code === 'KeyS') keys.s = true;
  if (event.code === 'KeyA') keys.a = true;
  if (event.code === 'KeyD') keys.d = true;
  if (event.code === 'ShiftLeft') keys.shift = true;

  updateAnimation();
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW') keys.w = false;
  if (event.code === 'KeyS') keys.s = false;
  if (event.code === 'KeyA') keys.a = false;
  if (event.code === 'KeyD') keys.d = false;
  if (event.code === 'ShiftLeft') keys.shift = false;

  updateAnimation();
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});