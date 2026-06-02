import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

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
document.body.appendChild(renderer.domElement);

// Controls
new OrbitControls(camera, renderer.domElement);

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
const exrLoader = new EXRLoader();

let character;
let mixer;

let idleAction;
let runAction;
let jogForwardAction;
let jogBackwardAction;
let jogLeftAction;
let jogRightAction;
let currentAction;

const keys = {
  w: false,
  s: false,
  a: false,
  d: false,
  shift: false
};

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

// Load HDRI for realistic lighting and reflections
exrLoader.load('/models/HDRIs/sky.exr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Load Character
loader.load('/models/character.fbx', (fbx) => {
  character = fbx;

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

    playAction(idleAction);
  });

  loader.load('/models/soccer-actions/jog forward.fbx', (jogForwardAnim) => {
    const clip = jogForwardAnim.animations[0];

    clip.tracks = clip.tracks.filter(track =>
      !track.name.endsWith('.position')
    );

    jogForwardAction = mixer.clipAction(clip);
  });

   loader.load('/models/soccer-actions/jog backward.fbx', (jogBackwardAnim) => {
    const clip = jogBackwardAnim.animations[0];

    clip.tracks = clip.tracks.filter(track =>
      !track.name.endsWith('.position')
    );

    jogBackwardAction = mixer.clipAction(clip);
  });

  loader.load('/models/soccer-actions/jog strafe left.fbx', (jogLeftAnim) => {
    const clip = jogLeftAnim.animations[0];

    clip.tracks = clip.tracks.filter(track =>
      !track.name.endsWith('.position')
    );

    jogLeftAction = mixer.clipAction(clip);
  });

  loader.load('/models/soccer-actions/jog strafe right.fbx', (jogRightAnim) => {
    const clip = jogRightAnim.animations[0];

    clip.tracks = clip.tracks.filter(track =>
      !track.name.endsWith('.position')
    );

    jogRightAction = mixer.clipAction(clip);
  });

  loader.load('/models/standard run.fbx', (runAnim) => {

  const clip = runAnim.animations[0];

  clip.tracks = clip.tracks.filter(track =>
    !track.name.endsWith('.position')
  );

  runAction = mixer.clipAction(clip);
});
});



const clock = new THREE.Clock();

function animate() {

  requestAnimationFrame(animate);

  const delta = clock.getDelta();

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

  if (event.code === 'KeyW') {

    if (!keys.w) {
      keys.w = true;

      playAction(
        keys.shift ? runAction : jogForwardAction
      );
    }
  }

   if (event.code === 'KeyS') {

    if (!keys.w) {
      keys.s = true;

      playAction(
        keys.shift ? runAction : jogBackwardAction
      );
    }
  }

  if (event.code === 'KeyA') {

    if (!keys.w) {
      keys.a = true;

      playAction(
        keys.shift ? runAction : jogLeftAction
      );
    }
  }

  if (event.code === 'KeyD') {

    if (!keys.w) {
      keys.d = true;

      playAction(
        keys.shift ? runAction : jogRightAction
      );
    }
  }

  if (event.code === 'ShiftLeft') {

    keys.shift = true;

    if (keys.w) {
      playAction(runAction);
    }
  }
});

window.addEventListener('keyup', (event) => {

  if (event.code === 'KeyW') {

    keys.w = false;

    playAction(idleAction);
  }

  if (event.code === 'KeyS') {
    keys.s = false;

    playAction(idleAction);
  }

  if (event.code === 'KeyA') {
    keys.a = false;

    playAction(idleAction);
  }

  if (event.code === 'KeyD') {
    keys.d = false;

    playAction(idleAction);
  }



  if (event.code === 'ShiftLeft') {

    keys.shift = false;

    if (keys.w) {
      playAction(jogForwardAction);
    }
  }
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