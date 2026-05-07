import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import starBackground from '@public/assets/Environments/8k_stars_milky_way.jpg'

const canvas = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()

// ✅ Load 8K JPEG Background
const textureLoader = new THREE.TextureLoader()
textureLoader.load(starBackground, (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  
  scene.background = texture
  scene.environment = texture
})

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.MeshStandardMaterial({
  metalness: 1,
  roughness: 0
})

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

function animate() {
  requestAnimationFrame(animate)
  
  controls.update()
  
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})