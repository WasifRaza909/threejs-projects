import * as THREE from 'three';
import './style.css'

// Scene
const scene = new THREE.Scene();

// Geometry
const geometry = new THREE.SphereGeometry( 3, 64, 64 ); 
// Material
const material = new THREE.MeshStandardMaterial( { color:"#00ff83" } ); 
// Mesh
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Light
const light = new THREE.PointLight(0xffffff, 100, 100)
light.position.set(0, 10, 10)
scene.add(light)

// Camera
const camera = new THREE.PerspectiveCamera( 45, sizes.width / sizes.height);
camera.position.z = 20
scene.add(camera)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setSize( sizes.width, sizes.height );
renderer.render(scene, camera);
