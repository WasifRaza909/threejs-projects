import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import starBackground from '@public/assets/Environments/8k_stars_milky_way.jpg'
import sunTexture from '@public/assets/Textures/sun.jpg'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui';

const gui = new dat.GUI();
const canvas = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace

const settings = {
  isVisible: true,
  label: "Camera",
  reset: function() { console.log("Resetting..."); },
  x: 0,
  y: 0,
  z: 5
};
let focusedPlanet = null;
const scene = new THREE.Scene()

const loaderEl    = document.getElementById('loader');
const barFill     = document.getElementById('loader-bar-fill');
const percentEl   = document.getElementById('loader-percent');
const filenameEl  = document.getElementById('loader-filename');

let currentProgress = 0;
let loaderRAF = null;

const fakeStages = [
  { target: 15,  label: 'Igniting the Sun...' },
  { target: 30,  label: 'Placing Mercury & Venus...' },
  { target: 45,  label: 'Loading Earth & Mars...' },
  { target: 60,  label: 'Assembling Jupiter...' },
  { target: 72,  label: 'Crafting Saturn\'s rings...' },
  { target: 83,  label: 'Spinning Uranus & Neptune...' },
  { target: 93,  label: 'Scattering starfields...' },
  { target: 100, label: 'Launching into orbit...' },
];

let stageIndex = 0;

function animateLoader() {
  const stage = fakeStages[stageIndex];
  currentProgress += (stage.target - currentProgress) * 0.1;

  barFill.style.width   = `${currentProgress}%`;
  percentEl.textContent = `${Math.round(currentProgress)}%`;
  filenameEl.textContent = stage.label;

  // close enough to target → advance to next stage
  if (Math.abs(stage.target - currentProgress) < 0.5) {
    currentProgress = stage.target;
    if (stageIndex < fakeStages.length - 1) {
      stageIndex++;
    } else {
      // reached 100 — fade out
      cancelAnimationFrame(loaderRAF);
      setTimeout(() => {
        loaderEl.style.opacity = '0';
        setTimeout(() => loaderEl.style.display = 'none', 800);
      }, 500);
      return;
    }
  }

  loaderRAF = requestAnimationFrame(animateLoader);
}

animateLoader();

// keep manager in case you still want onError tracking
const loadingManager = new THREE.LoadingManager();
loadingManager.onError = (url) => {
  filenameEl.textContent = `Failed: ${url.split('/').pop()}`;
  filenameEl.style.color  = '#ff4444';
};

const textureLoader = new THREE.TextureLoader(loadingManager)
textureLoader.load(starBackground, (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  scene.background = texture
  scene.environment = texture
})

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.x = 12.62
camera.position.y = 4.52
camera.position.z = -5.99

settings.x = camera.position.x;
settings.y = camera.position.y;
settings.z = camera.position.z;

gui.add(settings, 'label').name('Camera Label');
gui.add(settings, 'reset').name('Reset Settings');
gui.add(settings, 'x', 0, 100).step(0.02).name('Camera X').onChange(value => {
  camera.position.x = value;
});
gui.add(settings, 'y', 0, 100).step(0.02).name('Camera Y').onChange(value => {
  camera.position.y = value;
});
gui.add(settings, 'z', 0, 100).step(0.02).name('Camera Z').onChange(value => {
  camera.position.z = value;
});

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

let isDragging = false;
controls.addEventListener('start', () => {
  isDragging = true;
  focusedPlanet = null;
  document.body.style.cursor = 'grabbing';
})

controls.addEventListener('end', () => {
  isDragging = false;
  document.body.style.cursor = 'default';
})

controls.addEventListener('change', () => {
  settings.x = camera.position.x;
  settings.y = camera.position.y;
  settings.z = camera.position.z;
  gui.updateDisplay();
})

// ── Sun ────────────────────────────────────────────────────────────────────
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
  map: null,
  emissive: 0xffffff,
})

textureLoader.load(sunTexture, (texture) => {
  sunMaterial.map = texture
  texture.colorSpace = THREE.SRGBColorSpace
  sunMaterial.needsUpdate = true
  sunMaterial.emissiveMap = texture
})

const sun = new THREE.Mesh(sunGeometry, sunMaterial)
scene.add(sun)

const glowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff7700,
  transparent: true,
  opacity: 0.3,
  blending: THREE.AdditiveBlending
});
const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(sunGlow);

// ── Planet data ─────────────────────────────────────────────────────────────
const orbitData = [
  { name: 'mercury', radius: 10, size: 0.5, color: '#b5b5b5', tilt: 0  },
  { name: 'venus',   radius: 15, size: 0.9, color: '#e3c07b', tilt: 0 },
  { name: 'earth',   radius: 20, size: 1,   color: '#4aa3ff', tilt: 23.5  },
  { name: 'mars',    radius: 26, size: 0.7, color: '#d46a4c', tilt: 0  },
  { name: 'jupiter', radius: 40, size: 4.5, color: '#d2b48c', tilt: 0   },
  { name: 'saturn',  radius: 60, size: 3.8, color: '#e8d59a', tilt: 26.7  },
  { name: 'uranus',  radius: 80, size: 2.2, color: '#7ad0e6', tilt: 20  },
  { name: 'neptune', radius: 95, size: 2.1, color: '#3b5bdb', tilt: 28.3  },
]

const orbitRings = []
const planetMeshes = []

function createRing(parent, inner, outer, color) {
  const ringGeo = new THREE.RingGeometry(inner, outer, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  parent.add(ringMesh);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

orbitData.forEach((planet) => {
  const orbitGeo = new THREE.RingGeometry(planet.radius - 0.05, planet.radius + 0.05, 128)
  const orbitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.4,
    color: new THREE.Color(planet.color).multiplyScalar(0.8)
  })
  const orbitRing = new THREE.Mesh(orbitGeo, orbitMat)
  orbitRing.rotation.x = Math.PI / 2
  scene.add(orbitRing)
  orbitRings.push(orbitRing)

  const tiltGroup = new THREE.Group()
  tiltGroup.rotation.z = THREE.MathUtils.degToRad(planet.tilt || 0)

  const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32)
  const planetTexture = textureLoader.load(`assets/Textures/${planet.name}.jpg`)
  const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture })
  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial)

  // Rings are children of planetMesh → inherit tilt automatically
  if (planet.name === 'saturn') {
    createRing(planetMesh, planet.size * 1.4, planet.size * 2.2, '#e8d59a')
  }
  if (planet.name === 'uranus') {
    createRing(planetMesh, planet.size * 1.5, planet.size * 1.6, '#7ad0e6')
  }

  tiltGroup.add(planetMesh)
  scene.add(tiltGroup)

  const startAngle = Math.random() * Math.PI * 2

 planetMeshes.push({
  tiltGroup,
  mesh: planetMesh,
  radius: planet.radius,
  speed: Math.random() * 0.001 + 0.00001,
  angle: startAngle,
  spinSpeed: 0.005,
  size: planet.size, // <--- Add this line!
})
})

// ── Lighting ────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 2, 200)
pointLight.position.set(0, 0, 0)
scene.add(pointLight)

// ── Animation loop ───────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  if (!isDragging) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
  }

  if (!focusedPlanet) {
    planetMeshes.forEach((p) => {
      p.angle += p.speed;
      p.tiltGroup.position.x = Math.cos(p.angle) * p.radius;
      p.tiltGroup.position.z = Math.sin(p.angle) * p.radius;
      p.mesh.rotation.y += p.spinSpeed;
    });
  } else {
    focusedPlanet.mesh.rotation.y += focusedPlanet.spinSpeed;

    const worldPosition = new THREE.Vector3();
    focusedPlanet.mesh.getWorldPosition(worldPosition);

    controls.target.lerp(worldPosition, 0.05);

    const zoomDistance = focusedPlanet.size * 4;
    const currentCameraPos = camera.position.clone();
    const direction = new THREE.Vector3().subVectors(currentCameraPos, worldPosition).normalize();
    const targetCameraPos = worldPosition.clone().add(direction.multiplyScalar(zoomDistance));

    camera.position.lerp(targetCameraPos, 0.05);

    const distanceToTarget = camera.position.distanceTo(targetCameraPos);
    if (distanceToTarget < 0.1) {
        focusedPlanet = null; 
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate()

// ── Window resize ────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const meshesToTarget = [...planetMeshes.map(p => p.mesh), sun];
  const intersects = raycaster.intersectObjects(meshesToTarget);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit === sun) {
      focusedPlanet = { mesh: sun, size: 5, spinSpeed: 0.002 };
    } else {
      focusedPlanet = planetMeshes.find(p => p.mesh === hit);
    }
  } else {
    focusedPlanet = null;
  }
});
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});
