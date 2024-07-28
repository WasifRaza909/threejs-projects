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

const cameraPositionDebug  = gui.addFolder('Camera Position')
cameraPositionDebug.add( camera.position, 'x', 0, 20, 1 );
cameraPositionDebug.add( camera.position, 'y', 0, 20, 1 );
cameraPositionDebug.add( camera.position, 'z', 0, 20, 1 );


// Floor

const floorGeometry = new THREE.PlaneGeometry( 9, 9,100, 100);
const floorMaterial = new THREE.MeshBasicMaterial();

const floor = new THREE.Mesh( floorGeometry, floorMaterial );
scene.add( floor );

floor.rotation.x = -Math.PI  * 0.5

// Floor Rotation Debug

const floorRotationDebug = gui.addFolder('Floor Rotation')

floorRotationDebug.add( floor.rotation, 'x', 0, 10, 1 );
floorRotationDebug.add( floor.rotation, 'y', 0, 10, 1 );
floorRotationDebug.add( floor.rotation, 'z', 0, 10, 1 );

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
const roofGeometry = new THREE.PlaneGeometry(4, 5)
const roofMaterial = new THREE.MeshStandardMaterial({color: "yellow"})

const roof1 = new THREE.Mesh(roofGeometry, roofMaterial)
const roof2 = new THREE.Mesh(roofGeometry, roofMaterial)
roof1.position.x = 2
roof1.position.y = 2
roof2.position.x = 4
roof2.position.y = 4
house.add(roof1)
// roof1.rotation.x = Math.PI * 0.25
roof1.rotation.y = Math.PI * 0.5
roofMaterial.side = THREE.DoubleSide

// Roof Debug
// Floor Rotation Debug

const roofDebug = gui.addFolder('Roof')

roofDebug.add( roof1.rotation, 'x', -10, 20, 0.1 ).name('Roof Rotation X');
roofDebug.add( roof1.rotation, 'y', -10, 20, 0.1 ).name('Roof Rotation Y');
roofDebug.add( roof1.rotation, 'z', -10, 20, 0.1 ).name('Roof Rotation Z');

roofDebug.add( roof1.position, 'x', -10, 20, 0.1 );
roofDebug.add( roof1.position, 'y', -10, 20, 0.1 );
roofDebug.add( roof1.position, 'z', -10, 20, 0.1 );

// Lights
const light = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light );

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