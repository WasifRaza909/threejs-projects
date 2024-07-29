import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';

// Gui init
const gui = new GUI();

// Get Canvas
const canvas = document.getElementById('webgl')

// Scene
const scene = new THREE.Scene();

// Size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 6
camera.position.y = 4
camera.position.z = 7
scene.add(camera)

const cameraPositionDebug = gui.addFolder('Camera Position')
cameraPositionDebug.add(camera.position, 'x', 0, 20, 1);
cameraPositionDebug.add(camera.position, 'y', 0, 20, 1);
cameraPositionDebug.add(camera.position, 'z', 0, 20, 1);


// Floor

const floorGeometry = new THREE.PlaneGeometry(14, 14, 100, 100);
const floorMaterial = new THREE.MeshBasicMaterial();

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
scene.add(floor);

floor.rotation.x = -Math.PI * 0.5

// Floor Rotation Debug

const floorRotationDebug = gui.addFolder('Floor Rotation')

floorRotationDebug.add(floor.rotation, 'x', 0, 10, 1);
floorRotationDebug.add(floor.rotation, 'y', 0, 10, 1);
floorRotationDebug.add(floor.rotation, 'z', 0, 10, 1);

// House Container

const house = new THREE.Group()
scene.add(house)

// Walls

const wallsGeometry = new THREE.BoxGeometry(4, 2.5, 4)
const wallsMaterial = new THREE.MeshStandardMaterial()

const walls = new THREE.Mesh(wallsGeometry, wallsMaterial)
wallsMaterial.color = new THREE.Color("#ffffff")

walls.position.y = 1.25

house.add(walls)


// Roof
const roofGeometry = new THREE.ConeGeometry(3.5, 1.5, 27, 1);
const roofMaterial = new THREE.MeshStandardMaterial({ color: "yellow" })
const roof = new THREE.Mesh(roofGeometry, roofMaterial);

roof.position.y = 0.75 + 2.5
house.add(roof);


// Door
const doorGeometry = new THREE.PlaneGeometry(1.5, 2, 1)
const doorMaterial = new THREE.MeshStandardMaterial({color: "red"})
const door= new THREE.Mesh(doorGeometry, doorMaterial)
door.position.y = 1
door.position.z = 2.01

house.add(door)

// Snow
const snowGeometry = new THREE.SphereGeometry( 0.5, 24 ); 
const snowMaterial = new THREE.MeshStandardMaterial({color : "green"})

const minRadius = 4;
const maxRadius = 6;
for(let i = 0; i < 40; i++) {
  const snow = new THREE.Mesh(snowGeometry, snowMaterial);
  scene.add(snow);
  const angle = Math.random() * Math.PI * 2;
  // Random angle for each snowflake
  const r = minRadius + (Math.random() * (maxRadius - minRadius));
  snow.position.y = 0.2
  // Convert polar coordinates (r, angle) to Cartesian coordinates (x, z)
  snow.position.x = r * Math.cos(angle);
  snow.position.z = r * Math.sin(angle);
  const scale = 0.2 + Math.random() * 1; // Adjust range as needed
  snow.scale.set(scale, scale, scale);
}
// Lights
const light = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(light);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true
controls.update()

// Renderer

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.render(scene, camera)

// Resize
window.addEventListener('resize', () => {
  // Update Sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix()

  // Update Renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// Animate
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick)
}

tick()