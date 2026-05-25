import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui'; 
import grassTexture from './assets/textures/grass_texture.jpg';
import dayEnvMap from './assets/hdri/citrus_orchard_road_puresky_4k.exr?url';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-0.3, 10.7, -25);


const gui = new GUI();
// Camera Controls Folder
const cameraControllers = [];

const cameraFolder = gui.addFolder('Camera Positions');
['x', 'y', 'z'].forEach(axis => {
  cameraControllers.push(
    cameraFolder
      .add(camera.position, axis, -100, 100, 1)
      .name(`Camera ${axis.toUpperCase()}`).onChange(() => {
        camera.updateProjectionMatrix();
      })
  );
});

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement); 
controls.enableDamping = true;

// Update GUI when updating controls
controls.addEventListener('change', () => {
  cameraControllers.forEach(controller => controller.updateDisplay());
});

// Texture loader
const textureLoader = new THREE.TextureLoader();

// RGBe Loader
const exrLoader = new EXRLoader();

// Ambient Light
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

// Add a plane as a grass
const grassGeometry = new THREE.CircleGeometry(30, 100, 100);
const grassMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff,  side: THREE.DoubleSide});
const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial)

// Add texture
textureLoader.load(
  grassTexture, 
  (texture) => {
   texture.wrapS = THREE.MirroredRepeatWrapping;
texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(10, 10);
    texture.colorSpace = THREE.SRGBColorSpace;
    grassMaterial.map = texture;
    grassMaterial.needsUpdate = true;
  },
  undefined,
  (error) => {
    console.error('An error happened while loading the texture:', error);
  }
);

exrLoader.load(dayEnvMap, function (texture) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envTexture = pmremGenerator.fromEquirectangular(texture).texture;

    scene.background = envTexture;
    scene.environment = envTexture;

    texture.dispose();
    pmremGenerator.dispose();
});

grassMesh.rotation.x = Math.PI / 2;

scene.add(grassMesh)

// Create Sun
const sunGeometry = new THREE.SphereGeometry(10, 100, 100)
const sunMaterial = new THREE.MeshStandardMaterial({ color: "yellow",  side: THREE.DoubleSide});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial)

sunMesh.position.x = -65
sunMesh.position.y = 36
sunMesh.position.z = 100



scene.add(sunMesh)

const sunControllers = [];
const sunFolder = gui.addFolder('Sun Positions');

['x', 'y', 'z'].forEach(axis => {
  sunControllers.push( // Added to sunControllers, not cameraControllers
    sunFolder
      .add(sunMesh.position, axis, -100, 100, 1) // Fixed 'sun' to 'sunMesh'
      .name(`Sun ${axis.toUpperCase()}`)
  );
});


function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

animate();