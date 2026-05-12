import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import starBackground from '@public/assets/Environments/8k_stars_milky_way.jpg'
import sunTexture from '@public/assets/Textures/sun.jpg'
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

const scene = new THREE.Scene()


const textureLoader = new THREE.TextureLoader()
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
gui.add(settings, 'x', 0,100).step(0.02).name('Camera X').onChange(value => {
  camera.position.x = value;
});
gui.add(settings, 'y', 0,100).step(0.02).name('Camera Y').onChange(value => {
  camera.position.y = value;
});
gui.add(settings, 'z', 0,100).step(0.02).name('Camera Z').onChange(value => {
  camera.position.z = value;
});

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

controls.addEventListener('change', () => {
  settings.x = camera.position.x;
  settings.y = camera.position.y;
  settings.z = camera.position.z;
  gui.updateDisplay();
})

const geometry = new THREE.SphereGeometry(5, 32, 32);
const material = new THREE.MeshStandardMaterial({
map: null,
  emissive: 0xffffff,
})

const sunTextureLoader = new THREE.TextureLoader()
sunTextureLoader.load(sunTexture, (texture) => {
  material.map = texture
  texture.colorSpace = THREE.SRGBColorSpace
  material.needsUpdate = true
  material.emissiveMap = texture
})

const sun = new THREE.Mesh(geometry, material)
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

const orbitData = [
  { name: 'mercury', radius: 10, size: 0.5, color: '#b5b5b5' },
  { name: 'venus', radius: 15, size: 0.9, color: '#e3c07b' },
  { name: 'earth', radius: 20, size: 1, color: '#4aa3ff' },
  { name: 'mars', radius: 26, size: 0.7, color: '#d46a4c' },
  { name: 'jupiter', radius: 40, size: 4.5, color: '#d2b48c' }, 
  { name: 'saturn', radius: 60, size: 3.8, color: '#e8d59a' },
  { name: 'uranus', radius: 80, size: 2.2, color: '#7ad0e6' },
  { name: 'neptune', radius: 95, size: 2.1, color: '#3b5bdb' },
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

orbitData.forEach((planet) => {
  const geometry = new THREE.RingGeometry(planet.radius - 0.05, planet.radius + 0.05, 128)
  
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    side: THREE.DoubleSide
  })
  
  material.opacity = 0.4
  material.color = new THREE.Color(planet.color).multiplyScalar(0.8)
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI / 2

  const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32)
  const planetTexture = textureLoader.load(`assets/Textures/${planet.name}.jpg`)
  const planetMaterial = new THREE.MeshStandardMaterial({
    map: planetTexture,
  })

  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial)
  planetMesh.position.x = planet.radius
  if (planet.name === 'saturn') {
    createRing(planetMesh, planet.size * 1.4, planet.size * 2.2, '#e8d59a');
  }

  if (planet.name === 'uranus') {
    createRing(planetMesh, planet.size * 1.5, planet.size * 1.6, '#7ad0e6');
  }
  planetMeshes.push({
    mesh: planetMesh,
    radius: planet.radius,
    speed: Math.random() * 0.001 + 0.00001, 
    angle: Math.random() * Math.PI * 2    
  })

  scene.add(planetMesh)
  scene.add(ring)
  orbitRings.push(ring)
})

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4) 
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 4, 200) 
pointLight.position.set(0, 0, 0)
scene.add(pointLight)

function animate() {
  requestAnimationFrame(animate)

  planetMeshes.forEach((p) => {
    p.angle += p.speed
    
    p.mesh.position.x = Math.cos(p.angle) * p.radius
    p.mesh.position.z = Math.sin(p.angle) * p.radius
    
    p.mesh.rotation.y += 0.01
  })
  controls.update()
  
  renderer.render(scene, camera)
}
animate()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})