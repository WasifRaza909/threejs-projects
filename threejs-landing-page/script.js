import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// --- 3D ETHER CONFIGURATION ---
const TEXT_CONFIG = {
  content: 'ETHER',
  size: 7,
  height: 0.7,
  curveSegments: 24,
  bevelEnabled: true,
  bevelThickness: 0.4,
  bevelSize: 0.04,
  bevelOffset: 0,
  bevelSegments: 5,
  scaleX: 1.25,
  color: 0xffffff,
  metalness: 0.8,
  roughness: 0.1,
  reflectivity: 0.8,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1
};

const LIGHT_CONFIG = {
  ambient: { color: 0xffffff, intensity: 1 },
  main: { color: 0xffffff, intensity: 4, pos: { x: 8, y: 0, z: 5 } },
  TextLightShadeColor: { color: "darkblue", intensity: 20, pos: { x: -4, y: 0, z: -3 } },
};

// --- 3D ETHER TEXT ---
const container3d = document.getElementById('ether-3d-container');
const scene3d = new THREE.Scene();
const camera3d = new THREE.PerspectiveCamera(30, container3d.offsetWidth / container3d.offsetHeight, 0.1, 1000);
camera3d.position.z = 25;

gsap.set("#ether-3d-container", { opacity: 0 });

const renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer3d.setSize(container3d.offsetWidth, container3d.offsetHeight);
renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container3d.appendChild(renderer3d.domElement);

const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_bold.typeface.json', (font) => {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.55,
    roughness: 0.08,
    reflectivity: 1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  const geomOpts = {
    font,
    size: TEXT_CONFIG.size,
    height: TEXT_CONFIG.height,
    curveSegments: TEXT_CONFIG.curveSegments,
    bevelEnabled: TEXT_CONFIG.bevelEnabled,
    bevelThickness: TEXT_CONFIG.bevelThickness,
    bevelSize: TEXT_CONFIG.bevelSize,
    bevelOffset: TEXT_CONFIG.bevelOffset,
    bevelSegments: TEXT_CONFIG.bevelSegments,
  };

  // Build one mesh per letter
  const letters = TEXT_CONFIG.content.split('');
  const DROP_Y = 32;
  const SPACING = 1.4;

  // First pass — measure each letter's raw width
  const letterMeta = letters.map(char => {
    const geo = new TextGeometry(char, geomOpts);
    geo.computeBoundingBox();
    const rawW = geo.boundingBox.max.x - geo.boundingBox.min.x;
    geo.center();
    return { geo, rawW };
  });

  // Total visual width after scaleX and gaps
  const totalVisualW = letterMeta.reduce((s, m) => s + m.rawW * TEXT_CONFIG.scaleX, 0)
                     + SPACING * (letters.length - 1);
  let textFitW = totalVisualW;
  
  function fitCamera3d() {
    if (!container3d) return;
    const w = container3d.offsetWidth;
    const h = container3d.offsetHeight;
    const aspect = w / h;
    camera3d.aspect = aspect;
    if (textFitW > 0) {
      const vFOVrad = camera3d.fov * Math.PI / 180;
      const hFOVrad = 2 * Math.atan(Math.tan(vFOVrad / 2) * aspect);
      camera3d.position.z = Math.max(25, (textFitW / 2) / Math.tan(hFOVrad / 2) * 1.2);
    }
    camera3d.updateProjectionMatrix();
    renderer3d.setSize(w, h);
  }
  window.addEventListener('resize', fitCamera3d);
  fitCamera3d(); // fit camera to actual text width (handles mobile viewports)

  // Second pass — create & place meshes, park them above view
  const letterMeshes = [];
  let cursor = -totalVisualW / 2;
  letterMeta.forEach(({ geo, rawW }) => {
    const visualW = rawW * TEXT_CONFIG.scaleX;
    const mesh = new THREE.Mesh(geo, material);
    mesh.scale.x = TEXT_CONFIG.scaleX;
    mesh.position.x = cursor + visualW / 2;
    mesh.position.y = DROP_Y; // start above viewport
    scene3d.add(mesh);
    letterMeshes.push(mesh);
    cursor += visualW + SPACING;
  });

  // Use legacy lighting so intensity values behave as simple multipliers
  renderer3d.useLegacyLights = true;

  // Base: soft ambient keeps text white, not overpowering the spots
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene3d.add(ambientLight);

  // Moderate white front fill — base so text is never dark
  const baseLight = new THREE.DirectionalLight(0xffffff, 2);
  baseLight.position.set(0, 5, 20);
  scene3d.add(baseLight);

  // Sweeping colored spots — brighter blue tones so they show on white
  const makeSpot = (color, intensity, px, py, pz, angle, penumbra) => {
    const s = new THREE.SpotLight(color, intensity, 0, angle, penumbra, 1);
    s.position.set(px, py, pz);
    scene3d.add(s);
    scene3d.add(s.target);
    return s;
  };

  // Bright royal blue — fast sweep L→R
  const sViolet = makeSpot(0x1a56db, 2,  0, 20, 18, Math.PI / 6,  0.45);
  // Vivid navy blue — medium sweep R→L
  const sCyan   = makeSpot(0x1e40af, 2,  0, 18, 18, Math.PI / 6,  0.5 );
  // Sky blue — counter sweep for depth variation
  const sFill   = makeSpot(0x60a5fa, 2,  0, 22, 14, Math.PI / 7,  0.55);

  // Expose for theme switching
  window.text3dMaterial = material;
  window.text3dLights   = { sViolet, sCyan, sFill, ambientLight, baseLight };

  // Apply correct theme lighting on load (runs for both dark and light)
  if (window.updateCanvasTheme) {
    window.updateCanvasTheme(document.documentElement.getAttribute('data-theme') === 'light');
  }

  function animate3d() {
    requestAnimationFrame(animate3d);
    const t = Date.now() * 0.001;

    // Each target sweeps across the text face (z ≈ 0), slightly different
    // speed multipliers and phase offsets = overlapping, never in sync
    sViolet.target.position.set(Math.sin(t * 1.1)               * 24, Math.sin(t * 0.45) * 4, 0);
    sCyan.target.position.set  (Math.sin(t * 0.78 + Math.PI)    * 24, Math.cos(t * 0.38) * 3, 0);
    sFill.target.position.set  (Math.cos(t * 0.93 + 0.7)        * 22, Math.cos(t * 0.55) * 5, 0);

    sViolet.target.updateMatrixWorld();
    sCyan.target.updateMatrixWorld();
    sFill.target.updateMatrixWorld();

    renderer3d.render(scene3d, camera3d);
  }
  animate3d();

  // Expose drop trigger for playHeroTimeline
  window.startLetterDrop = () => {
    letterMeshes.forEach((mesh, i) => {
      const delay = i * 0.3;

      // Drop from above, decelerates smoothly into final position
      gsap.fromTo(mesh.position, { y: DROP_Y }, {
        y: 0,
        duration: 1.0,
        ease: 'power4.out',
        delay,
      });
    });
  };
});

// Configuration | Edit these values to customise the effect.
const CONFIG = {
  nodeCount: 120,
  connectionDistance: 3.5,
  minSpeed: 0.008,
  maxSpeed: 0.022,
  nodeColors: ['#ffffff', '#7eb8ff', '#a78bfa'],
  lineFarColor: '#334477',
  lineNearColor: '#7eb8ff',
  lineOpacity: 0.45,
  mouseAttractionRadius: 2.5,
  burstForce: 0.08,
};

const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
                .test(navigator.userAgent) || window.innerWidth < 768;

const THEMES = {
  space: {
    bg: 0x03050f,
    palette: CONFIG.nodeColors.map((color) => ({ color: new THREE.Color(color).getHex(), weight: 1 / CONFIG.nodeColors.length })),
    lineFar: new THREE.Color(CONFIG.lineFarColor).getHex(), lineClose: new THREE.Color(CONFIG.lineNearColor).getHex(),
  },
  matrix: {
    bg: 0x000a00,
    palette: [ { color: 0x00ff41, weight: 1.0 } ],
    lineFar: 0x003300, lineClose: 0x00ff41,
  },
  cyber: {
    bg: 0x000510,
    palette: [
      { color: 0x00ffff, weight: 0.5 },
      { color: 0xff00ff, weight: 0.5 },
    ],
    lineFar: 0x004444, lineClose: 0x00ffff,
  },
};

const THEME_TWEEN = 0.8;
let currentTheme = 'space';

function pickPaletteColor(theme) {
  const r = Math.random();
  let acc = 0;
  for (const entry of theme.palette) {
    acc += entry.weight;
    if (r <= acc) return entry.color;
  }
  return theme.palette[theme.palette.length - 1].color;
}

const canvas   = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
renderer.setClearColor(THEMES.space.bg, 1);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 9);

const sphereGeo = new THREE.SphereGeometry(0.045, 8, 8);

const baseTotal = 120;
const layerDefs = [
  { name: 'near', frac: 40 / baseTotal, zMin: -1, zMax:  1, sizeMul: 1.15, speedMul: 1.25 },
  { name: 'mid',  frac: 50 / baseTotal, zMin: -3, zMax: -1, sizeMul: 1.0,  speedMul: 1.0  },
  { name: 'far',  frac: 30 / baseTotal, zMin: -6, zMax: -3, sizeMul: 0.75, speedMul: 0.7  },
];

const nodes = [];

function randomDirection() {
  return new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    (Math.random() * 2 - 1) * 0.3
  ).normalize();
}

let built = 0;
for (const layer of layerDefs) {
  const layerCount = Math.round(CONFIG.nodeCount * layer.frac);
  for (let i = 0; i < layerCount && built < (IS_MOBILE ? Math.round(CONFIG.nodeCount * 0.5) : CONFIG.nodeCount); i++, built++) {
    const colorHex = pickPaletteColor(THEMES[currentTheme]);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex, transparent: true, opacity: 1,
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);

    mesh.position.set(
      Math.random() * 24 - 12,
      Math.random() * 14 - 7,
      layer.zMin + Math.random() * (layer.zMax - layer.zMin)
    );

    const speed = (CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed))
                  * layer.speedMul;

    mesh.userData = {
      layer:           layer.name,
      velocity:        randomDirection().multiplyScalar(speed),
      baseSpeed:       speed,
      originalOpacity: 0.5 + Math.random() * 0.5,
      pulseOffset:     Math.random() * Math.PI * 2,
      pulseSpeed:      0.8 + Math.random() * 1.2,
      size:            (0.03 + Math.random() * 0.05) * layer.sizeMul,
      isConnected:     false,
      curColor:        new THREE.Color(colorHex),
      fromColor:       new THREE.Color(colorHex),
      toColor:         new THREE.Color(colorHex),
    };

    nodes.push(mesh);
    scene.add(mesh);
  }
}

let cursorNode = null;
if (!IS_MOBILE) {
  cursorNode = new THREE.Mesh(
    sphereGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
  );
  cursorNode.scale.setScalar(0.12 / 0.045);
  cursorNode.renderOrder = 5;
  cursorNode.material.depthTest = false;
  scene.add(cursorNode);
}

const linePool = [];
for (let i = 0; i < 300; i++) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const mat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0 });
  const line = new THREE.Line(geo, mat);
  line.visible = false;
  line.frustumCulled = false;
  linePool.push(line);
  scene.add(line);
}

const lineFarColor   = new THREE.Color(THEMES.space.lineFar);
const lineCloseColor = new THREE.Color(THEMES.space.lineClose);
const lineTmpColor   = new THREE.Color();

const mouseNDC   = new THREE.Vector2(999, 999);
const mouseWorld = new THREE.Vector3();
let mouseInside  = false;
let burstQueued  = false;

function updateMouseWorld() {
  const v = new THREE.Vector3(mouseNDC.x, mouseNDC.y, 0.5);
  v.unproject(camera);
  const dir = v.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  mouseWorld.copy(camera.position).add(dir.multiplyScalar(distance));
}

let themeTween = null;

function setTheme(name) {
  if (!THEMES[name] || name === currentTheme) return;
  const from = THEMES[currentTheme];
  const to   = THEMES[name];
  currentTheme = name;

  for (const node of nodes) {
    node.userData.fromColor.copy(node.userData.curColor);
    node.userData.toColor.set(pickPaletteColor(to));
  }

  themeTween = {
    t: 0, dur: THEME_TWEEN,
    fromBg: new THREE.Color(from.bg),     toBg: new THREE.Color(to.bg),
    fromFar: new THREE.Color(from.lineFar),   toFar: new THREE.Color(to.lineFar),
    fromClose: new THREE.Color(from.lineClose), toClose: new THREE.Color(to.lineClose),
  };
}

const clock = new THREE.Clock();
let frameNo = 0;
const bgColor = new THREE.Color(THEMES.space.bg);

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  frameNo++;

  if (mouseInside) updateMouseWorld();

  if (themeTween) {
    themeTween.t += clock.getDelta ? Math.min(0.05, clock.getDelta()) : 0;
    const k = Math.min(1, themeTween.t / themeTween.dur);
    bgColor.copy(themeTween.fromBg).lerp(themeTween.toBg, k);
    renderer.setClearColor(bgColor, 1);
    lineFarColor.copy(themeTween.fromFar).lerp(themeTween.toFar, k);
    lineCloseColor.copy(themeTween.fromClose).lerp(themeTween.toClose, k);
    for (const node of nodes) {
      node.userData.curColor.copy(node.userData.fromColor).lerp(node.userData.toColor, k);
      node.material.color.copy(node.userData.curColor);
    }
    if (k >= 1) themeTween = null;
  }

  for (const node of nodes) {
    const ud = node.userData;

    if (burstQueued && mouseInside) {
      const d = node.position.distanceTo(mouseWorld);
      if (d < 3.5) {
        const force = node.position.clone().sub(mouseWorld).normalize()
                        .multiplyScalar(CONFIG.burstForce * (1 - d / 3.5));
        ud.velocity.add(force);
      }
    }

    if (mouseInside) {
      const d = node.position.distanceTo(mouseWorld);
      if (d < CONFIG.mouseAttractionRadius) {
        const force = mouseWorld.clone().sub(node.position).normalize()
                        .multiplyScalar(0.004 * (1 - d / CONFIG.mouseAttractionRadius));
        ud.velocity.add(force);
      }
    }

    ud.velocity.multiplyScalar(0.98);

    const sp = ud.velocity.length();
    if (sp < ud.baseSpeed * 0.6) {
      ud.velocity.normalize().multiplyScalar(ud.baseSpeed * 0.6);
    }

    node.position.add(ud.velocity);

    const p = node.position;
    if (p.x >  13) p.x = -13;  else if (p.x < -13) p.x = 13;
    if (p.y >   8) p.y =  -8;  else if (p.y <  -8) p.y =  8;
    if (p.z >   2) p.z =  -7;  else if (p.z <  -7) p.z =  2;

    if (frameNo % 120 === 0) {
      const speed = ud.velocity.length();
      ud.velocity.lerp(randomDirection().multiplyScalar(speed), 0.15);
    }

    const pulse = Math.sin(time * ud.pulseSpeed + ud.pulseOffset);
    let scale   = ud.size * (1.0 + pulse * 0.25);
    let opacity = ud.originalOpacity * (0.7 + pulse * 0.3);

    if (p.z > -1)      {  }
    else if (p.z > -3) { opacity *= 0.75; scale *= 0.85; }
    else               { opacity *= 0.45; scale *= 0.65; }

    node.scale.setScalar(scale / 0.045);
    node.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
  }
  burstQueued = false;

  if (cursorNode) {
    cursorNode.visible = mouseInside;
    if (mouseInside) cursorNode.position.copy(mouseWorld);
  }

  if (!IS_MOBILE || frameNo % 2 === 0) {
    rebuildConnections();
  }

  if (!IS_MOBILE) {
    camera.position.x = Math.sin(time * 0.08) * 0.6;
    camera.position.y = Math.cos(time * 0.06) * 0.35;
  }
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

const maxDist = () => CONFIG.connectionDistance;

function rebuildConnections() {
  let poolIdx = 0;
  const connDist = maxDist();

  for (const node of nodes) node.userData.isConnected = false;
  for (let i = 0; i < linePool.length; i++) linePool[i].visible = false;

  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      if (Math.abs(a.position.z - b.position.z) > 1.5) continue;
      const dist = a.position.distanceTo(b.position);
      if (dist >= connDist) continue;
      if (poolIdx >= linePool.length) break;
      const t = dist / connDist;
      drawPooledLine(poolIdx++, a.position, b.position, t, (1 - t) * CONFIG.lineOpacity);
      a.userData.isConnected = true;
      b.userData.isConnected = true;
    }
    if (poolIdx >= linePool.length) break;
  }

  if (cursorNode && cursorNode.visible) {
    for (let i = 0; i < nodes.length && poolIdx < linePool.length; i++) {
      const b = nodes[i];
      const dist = cursorNode.position.distanceTo(b.position);
      if (dist >= connDist) continue;
      const t = dist / connDist;
      drawPooledLine(poolIdx++, cursorNode.position, b.position, t,
                     Math.min(1, (1 - t) * CONFIG.lineOpacity * 1.8));
    }
  }
}

function drawPooledLine(idx, p1, p2, t, opacity) {
  const line = linePool[idx];
  const arr  = line.geometry.attributes.position.array;
  arr[0] = p1.x; arr[1] = p1.y; arr[2] = p1.z;
  arr[3] = p2.x; arr[4] = p2.y; arr[5] = p2.z;
  line.geometry.attributes.position.needsUpdate = true;
  lineTmpColor.copy(lineFarColor).lerp(lineCloseColor, 1 - t);
  line.material.color.copy(lineTmpColor);
  line.material.opacity = opacity;
  line.visible = true;
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Custom Cursor Logic
if (window.matchMedia('(pointer: fine)').matches) {
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = `${mouseX}px`;
    dot.style.top = `${mouseY}px`;
  });

  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const updateCursor = () => {
    ringX = lerp(ringX, mouseX, 0.15);
    ringY = lerp(ringY, mouseY, 0.15);
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(updateCursor);
  };
  updateCursor();

  // Hover effects
  const interactiveElements = 'a, button, .nav-hamburger, .social-icon, [role="button"], .timeline-point';
  const addHover = () => {
    ring.classList.add('cursor-hover');
    dot.classList.add('cursor-hover');
  };
  const removeHover = () => {
    ring.classList.remove('cursor-hover');
    dot.classList.remove('cursor-hover');
  };

  document.querySelectorAll(interactiveElements).forEach(el => {
    el.addEventListener('mouseenter', addHover);
    el.addEventListener('mouseleave', removeHover);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          const targets = node.matches(interactiveElements) ? [node] : node.querySelectorAll(interactiveElements);
          targets.forEach(t => {
            t.addEventListener('mouseenter', addHover);
            t.addEventListener('mouseleave', removeHover);
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Expose canvas theme updater so the regular script can call it
window.updateCanvasTheme = (isLight) => {
  if (isLight) {
    renderer.setClearColor(0xEDE9FF, 1);
    for (const node of nodes) {
      const lightColors = [0x6D28D9, 0x7C3AED, 0x8B5CF6];
      const c = lightColors[Math.floor(Math.random() * lightColors.length)];
      node.material.color.setHex(c);
      node.userData.curColor.setHex(c);
      node.userData.fromColor.setHex(c);
      node.userData.toColor.setHex(c);
    }
    lineFarColor.set(0xC4B5FD);
    lineCloseColor.set(0x7C3AED);
  } else {
    renderer.setClearColor(THEMES.space.bg, 1);
    for (const node of nodes) {
      const c = pickPaletteColor(THEMES.space);
      node.material.color.setHex(c);
      node.userData.curColor.setHex(c);
      node.userData.fromColor.setHex(c);
      node.userData.toColor.setHex(c);
    }
    lineFarColor.set(THEMES.space.lineFar);
    lineCloseColor.set(THEMES.space.lineClose);
  }

  const mat = window.text3dMaterial;
  const lts = window.text3dLights;
  if (!mat || !lts) return;

  const LIGHT_TEXT = {
    base:       0xA78BFA,
    metalness:  0.55,
    roughness:  0.18,
    ambient:    0xEDE9FE,
    ambientInt: 0.9,
    fillInt:    0.8,
    spot1Color: 0xC4B5FD,
    spot1Int:   4,
    spot2Color: 0x8B5CF6,
    spot2Int:   3,
    spot3Color: 0xEDE9FE,
    spot3Int:   2,
  };

  if (isLight) {
    mat.color.setHex(LIGHT_TEXT.base);
    mat.metalness   = LIGHT_TEXT.metalness;
    mat.roughness   = LIGHT_TEXT.roughness;
    mat.needsUpdate = true;
    lts.ambientLight.color.setHex(LIGHT_TEXT.ambient);
    lts.ambientLight.intensity = LIGHT_TEXT.ambientInt;
    lts.baseLight.intensity    = LIGHT_TEXT.fillInt;
    lts.sViolet.color.setHex(LIGHT_TEXT.spot1Color); lts.sViolet.intensity = LIGHT_TEXT.spot1Int;
    lts.sCyan.color.setHex(LIGHT_TEXT.spot2Color);   lts.sCyan.intensity   = LIGHT_TEXT.spot2Int;
    lts.sFill.color.setHex(LIGHT_TEXT.spot3Color);   lts.sFill.intensity   = LIGHT_TEXT.spot3Int;
  } else {
    const DARK_TEXT = {
      base:       0xffffff,
      metalness:  0.65,
      roughness:  0.06,
      ambient:    0x7C3AED,
      ambientInt: 0.2,
      fillInt:    1.5,
      spot1Color: 0x8B5CF6,
      spot1Int:   3,
      spot2Color: 0x6D28D9,
      spot2Int:   3,
      spot3Color: 0xC4B5FD,
      spot3Int:   2.5,
    };
    mat.color.setHex(DARK_TEXT.base);
    mat.metalness   = DARK_TEXT.metalness;
    mat.roughness   = DARK_TEXT.roughness;
    mat.needsUpdate = true;
    lts.ambientLight.color.setHex(DARK_TEXT.ambient);
    lts.ambientLight.intensity = DARK_TEXT.ambientInt;
    lts.baseLight.intensity    = DARK_TEXT.fillInt;
    lts.sViolet.color.setHex(DARK_TEXT.spot1Color); lts.sViolet.intensity = DARK_TEXT.spot1Int;
    lts.sCyan.color.setHex(DARK_TEXT.spot2Color);   lts.sCyan.intensity   = DARK_TEXT.spot2Int;
    lts.sFill.color.setHex(DARK_TEXT.spot3Color);   lts.sFill.intensity   = DARK_TEXT.spot3Int;
  }
};

// --- GSAP AND UI LOGIC ---
gsap.registerPlugin(ScrollTrigger);

window.lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

window.lenis.on('scroll', ScrollTrigger.update);

const navEl = document.querySelector('.nav');
window.lenis.on('scroll', ({ scroll, velocity }) => {
  if (scroll < 80) {
    navEl.classList.remove('nav--hidden');
    return;
  }
  if (velocity > 0.2) navEl.classList.add('nav--hidden');
  else if (velocity < -0.2) navEl.classList.remove('nav--hidden');
});

gsap.ticker.add((time) => {
  window.lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

const timelinePoints = document.querySelectorAll('.timeline-point');
const progressLine = document.querySelector('.timeline-progress');
const navLinks = document.querySelectorAll('.nav-links a');

let lastActiveIndex = -1;
let labelTimer = null;

const showActiveLabel = (index) => {
  if (labelTimer) clearTimeout(labelTimer);
  timelinePoints.forEach(p => p.classList.remove('label-visible'));
  const activePoint = timelinePoints[index];
  if (activePoint) {
    activePoint.classList.add('label-visible');
    labelTimer = setTimeout(() => {
      activePoint.classList.remove('label-visible');
    }, 2000);
  }
};

let updateTimelineUI = (index) => {
  if (index === -1) return;
  timelinePoints.forEach((p, i) => p.classList.toggle('active', i <= index));
  navLinks.forEach((link, i) => link.classList.toggle('active', i === index));
  const progressPercent = (index / (timelinePoints.length - 1)) * 100;
  gsap.to(progressLine, { 
    height: `${progressPercent}%`, 
    duration: 0.4, 
    ease: "power2.out",
    overwrite: true 
  });
  if (index !== lastActiveIndex) {
    lastActiveIndex = index;
    showActiveLabel(index);
  }
};

const hiwSection = document.querySelector('#howitworks');
const hiwWrapper = document.querySelector('.steps-list');
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  if (!hiwSection || !hiwWrapper) return;
  const hiwIndex = Array.from(timelinePoints).findIndex(p => p.dataset.section === 'howitworks');
  const hiwST = gsap.to(hiwWrapper, {
    x: () => -(hiwWrapper.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      id: 'hiw-pin',
      trigger: hiwSection,
      pin: true,
      scrub: 1,
      start: "top top",
      end: () => "+=" + (hiwWrapper.scrollWidth - window.innerWidth),
      invalidateOnRefresh: true,
      onToggle: self => {
        if (self.isActive) updateTimelineUI(hiwIndex);
      }
    }
  });
  return () => {
    hiwST.kill();
    gsap.set(hiwWrapper, { clearProps: "all" });
  };
});

mm.add("(max-width: 767px)", () => {
  if (hiwWrapper) gsap.set(hiwWrapper, { clearProps: 'all' });
});

const initParagraphReveals = () => {
  gsap.utils.toArray('p').forEach(el => {
    if (el.closest('#hero')) return;
    gsap.fromTo(el,
      { opacity: 0, y: 14 },
      {
        opacity: 1, y: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 94%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
};

const loaderPctEl = document.getElementById('loader-pct');
const loaderTl = gsap.timeline();
loaderTl
  .to(".loader-progress", {
    width: "100%", duration: 1.5, ease: "power2.inOut",
    onUpdate: function () {
      if (loaderPctEl) loaderPctEl.textContent = Math.round(this.progress() * 100) + '%';
    }
  })
  .to("#loader", { opacity: 0, duration: 0.5, onComplete: () => {
    document.getElementById('loader').style.display = 'none';
    playHeroTimeline();
  }});

function playHeroTimeline() {
  const heroTl = gsap.timeline({ defaults: { ease: "power2.out" } });
  heroTl
    .fromTo('.nav-logo',
      { opacity: 0, y: -18 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
    .fromTo('.nav-links li',
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 },
      '-=0.4'
    )
    .fromTo('.nav-cta',
      { opacity: 0, x: 18 },
      { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' },
      '-=0.38'
    )
    .fromTo("#hero-badge", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.2")
    .to("#ether-3d-container", { opacity: 1, duration: 0.3, onStart: () => { if (window.startLetterDrop) window.startLetterDrop(); } }, "-=1.8")
    .fromTo("#hero-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
    .fromTo("#hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
    .fromTo("#hero-actions", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4");
}

const ham = document.getElementById('nav-hamburger');
const drawer = document.getElementById('nav-drawer');
const drawerLinks = document.querySelectorAll('.drawer-link');
const drawerItems = document.querySelectorAll('.drawer-item');
const drawerCTA = document.querySelector('.drawer-bottom-cta');

window.isNavOpen = false;

window.toggleNav = () => {
  window.isNavOpen = !window.isNavOpen;
  ham.classList.toggle('open', window.isNavOpen);
  const tl = gsap.timeline();
  if (window.isNavOpen) {
    gsap.set(drawer, { visibility: 'visible', pointerEvents: 'all' });
    tl.to(drawer, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 0.8,
      ease: 'power4.inOut'
    })
    .to('.bg-shape', {
      opacity: 0.4, scale: 1, duration: 1, stagger: 0.1, ease: 'power2.out'
    }, '-=0.4')
    .fromTo(drawerLinks, 
      { y: 100, opacity: 0, rotateX: -45 }, 
      { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 
      '-=0.6'
    )
    .to(drawerCTA, { opacity: 1, y: 0, duration: 0.5 }, '-=0.4');
  } else {
    tl.to(drawerCTA, { opacity: 0, y: 20, duration: 0.3 })
    .to(drawerLinks, { 
      y: -100, opacity: 0, rotateX: 45, duration: 0.5, stagger: 0.03, ease: 'power3.in' 
    }, '-=0.2')
    .to(drawer, {
      clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
      duration: 0.6,
      ease: 'power4.inOut'
    }, '-=0.3')
    .set(drawer, { visibility: 'hidden', pointerEvents: 'none' });
  }
};

ham?.addEventListener('click', window.toggleNav);
document.getElementById('drawer-close-inside')?.addEventListener('click', window.toggleNav);

drawerLinks.forEach((link, i) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    window.toggleNav();
    if (targetElement) {
      setTimeout(() => {
        window.lenis.scrollTo(targetElement, { offset: 0, duration: 1.5 });
      }, 600);
    }
  });
});

const themeToggle = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

const applyTheme = (theme) => {
  if (theme === 'light') {
    htmlEl.setAttribute('data-theme', 'light');
  } else {
    htmlEl.removeAttribute('data-theme');
  }
  if (window.updateCanvasTheme) window.updateCanvasTheme(theme === 'light');
  localStorage.setItem('ether-theme', theme);
};

const savedTheme = localStorage.getItem('ether-theme') || 'dark';
if (savedTheme === 'light') {
  htmlEl.setAttribute('data-theme', 'light');
  window.addEventListener('load', () => {
    if (window.updateCanvasTheme) window.updateCanvasTheme(true);
  });
}

themeToggle?.addEventListener('click', () => {
  const isLight = htmlEl.getAttribute('data-theme') === 'light';
  applyTheme(isLight ? 'dark' : 'light');
});

const originalUpdateUI = updateTimelineUI;
updateTimelineUI = (index) => {
  originalUpdateUI(index);
  drawerLinks.forEach((link, i) => {
    link.classList.toggle('active', i === index);
  });
};

drawer.addEventListener('mousemove', (e) => {
  if (!window.isNavOpen) return;
  const { clientX, clientY } = e;
  const xPos = (clientX / window.innerWidth - 0.5) * 30;
  const yPos = (clientY / window.innerHeight - 0.5) * 30;
  gsap.to('.drawer-nav-container', {
    x: xPos,
    y: yPos,
    duration: 1,
    ease: 'power2.out'
  });
});

timelinePoints.forEach((point, index) => {
  const targetId = point.dataset.section;
  const targetElement = document.getElementById(targetId);
  if (targetElement && targetId !== 'howitworks') {
    ScrollTrigger.create({
      trigger: targetElement,
      start: "top 30%",
      end: "bottom center",
      onEnter: () => {
        const hiwActive = ScrollTrigger.getById('hiw-pin')?.isActive;
        if (!hiwActive) updateTimelineUI(index);
      },
      onEnterBack: () => {
        const hiwActive = ScrollTrigger.getById('hiw-pin')?.isActive;
        if (!hiwActive) updateTimelineUI(index);
      },
      invalidateOnRefresh: true
    });
  }
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.lenis.scrollTo(targetElement, { offset: 0, duration: 1.5 });
    }
  });
});

timelinePoints.forEach((point, index) => {
  point.addEventListener('click', () => {
    const targetId = point.dataset.section;
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.lenis.scrollTo(targetElement, { offset: 0, duration: 1.5 });
    }
  });
});

function splitTitleLines(el) {
  try {
    const words = el.innerText.trim().split(/\s+/);
    el.innerHTML = words
      .map(w => `<span style="display:inline-block;white-space:pre">${w} </span>`)
      .join('');
    const spans = Array.from(el.querySelectorAll('span'));
    const groups = [];
    let lastTop = null;
    spans.forEach((span, i) => {
      const top = span.getBoundingClientRect().top;
      if (lastTop === null || Math.abs(top - lastTop) > 8) {
        groups.push([]);
        lastTop = top;
      }
      groups[groups.length - 1].push(words[i]);
    });
    el.innerHTML = groups
      .map(lineWords =>
        `<div style="overflow:hidden;display:block">` +
          `<div class="t-line">${lineWords.join(' ')}</div>` +
        `</div>`
      )
      .join('');
    return Array.from(el.querySelectorAll('.t-line'));
  } catch (e) {
    console.error("Title splitting failed", e);
    return [];
  }
}

const STEP_THRESHOLDS = [0.02, 0.34, 0.67];
const stepTitleData = [];

function initScrollAnimations() {
  gsap.utils.toArray('.reveal-up').forEach(element => {
    gsap.fromTo(element, 
      { opacity: 0, y: 30 }, 
      { 
        opacity: 1, y: 0, 
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 94%",
          toggleActions: "play none none none"
        }
      }
    );
  });
  initParagraphReveals();
  gsap.utils.toArray('.section-title').forEach(title => {
    const lines = splitTitleLines(title);
    if (!lines.length) {
      gsap.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, scrollTrigger: { trigger: title, start: 'top 88%' }});
      return;
    }
    gsap.fromTo(lines,
      { y: '110%' },
      {
        y: '0%',
        duration: 0.85,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: title,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });
  gsap.utils.toArray('.step-title').forEach((title, i) => {
    const lines = splitTitleLines(title);
    if (lines.length) {
      gsap.set(lines, { y: '110%' });
      stepTitleData.push({ lines, done: false, threshold: STEP_THRESHOLDS[i] });
    }
  });
  const footerTrigger = { trigger: '.footer', start: 'top 86%', toggleActions: 'play none none none' };
  gsap.fromTo('.footer-brand-logo',
    { x: -32, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.85, ease: 'power3.out', scrollTrigger: footerTrigger }
  );
  gsap.fromTo('.footer-tagline',
    { y: 14, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', delay: 0.18, scrollTrigger: footerTrigger }
  );
  gsap.fromTo('.footer-col-title',
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.1, scrollTrigger: footerTrigger }
  );
  gsap.fromTo('.footer-links li',
    { x: -12, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.48, ease: 'power2.out', stagger: 0.038, delay: 0.28, scrollTrigger: footerTrigger }
  );
  gsap.fromTo('.footer-bottom',
    { y: 22, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer-bottom', start: 'top 95%', toggleActions: 'play none none none' }
    }
  );
  gsap.fromTo('.social-icon',
    { scale: 0.55, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(1.8)', stagger: 0.09, delay: 0.25,
      scrollTrigger: { trigger: '.footer-bottom', start: 'top 95%', toggleActions: 'play none none none' }
    }
  );
  ScrollTrigger.refresh();
  initNumberCounters();
}

function initNumberCounters() {
  gsap.utils.toArray('.hero-stat-num, .metric-num').forEach(el => {
    const targetStr = el.getAttribute('data-target');
    const target = parseFloat(targetStr);
    const decimals = targetStr.includes('.') ? targetStr.split('.')[1].length : 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: "play none none none"
      },
      onUpdate: () => {
        el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
      }
    });
  });
}

function startAll() {
  if (window.isInitialized) return;
  window.isInitialized = true;
  if (document.fonts) {
    Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 800))
    ]).then(initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}

document.addEventListener('DOMContentLoaded', startAll);
window.addEventListener('load', startAll);

setTimeout(() => {
  const loader = document.getElementById('loader');
  if (loader && loader.style.display !== 'none') {
    gsap.to("#loader", { opacity: 0, duration: 0.5, onComplete: () => {
      loader.style.display = 'none';
      playHeroTimeline();
      gsap.to('.reveal-up', { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 });
    }});
  }
}, 3500);

mm.add("(min-width: 768px)", () => {
  const titleListener = () => {
    if (!stepTitleData.length) return;
    const hiwST = ScrollTrigger.getById('hiw-pin');
    if (!hiwST) return;
    const p = hiwST.progress;
    stepTitleData.forEach(item => {
      if (!item.done && p >= item.threshold) {
        item.done = true;
        gsap.to(item.lines, { y: '0%', duration: 0.85, ease: 'power4.out', stagger: 0.1 });
      }
    });
  };
  window.lenis.on('scroll', titleListener);
  return () => window.lenis.off('scroll', titleListener);
});

mm.add("(max-width: 767px)", () => {
  const mobileTriggers = [];
  document.querySelectorAll('.step-title').forEach((el, i) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        if (stepTitleData[i] && !stepTitleData[i].done) {
          stepTitleData[i].done = true;
          gsap.to(stepTitleData[i].lines, { y: '0%', duration: 0.85, ease: 'power4.out', stagger: 0.1 });
        }
      }
    });
    mobileTriggers.push(st);
  });
  return () => mobileTriggers.forEach(st => st.kill());
});
