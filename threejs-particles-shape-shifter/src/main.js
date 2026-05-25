import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const count = 1000
const positions = new Float32Array(count * 3)

for (let i = 0; i < count * 3; i++){
    positions[i] = (Math.random() - 0.5) * 10
}

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 })
const points = new THREE.Points(geometry, material)
scene.add(points) 


const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update()
    renderer.render(scene, camera);
}

// Start the animation loop
animate();