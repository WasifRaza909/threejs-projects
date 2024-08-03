import * as THREE from 'three';
import { OrbitControls, RGBELoader, Sky } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
// Gui init
const gui = new GUI();

// Get Canvas
const canvas = document.getElementById('webgl')

// Textures
const textureLoader = new THREE.TextureLoader()

// Floor
const floorAlphaTexture = textureLoader.load('/floor/alpha-1.png')
const floorARMTexture = textureLoader.load('/floor/snow_02_1k/snow_02_arm_1k.jpg')
const floorColorTexture = textureLoader.load('/floor/snow_02_1k/snow_02_diff_1k.jpg')
const floorDispTexture = textureLoader.load('/floor/snow_02_1k/snow_02_disp_1k.jpg')
const floorNormalTexture = textureLoader.load('/floor/snow_02_1k/snow_02_nor_gl_1k.jpg')
floorColorTexture.colorSpace = THREE.SRGBColorSpace

// Snow
const snowARMTexture = textureLoader.load('/snow/snow_floor_1k/snow_floor_arm_1k.jpg')
const snowColorTexture = textureLoader.load('/snow/snow_floor_1k/snow_floor_diff_1k.jpg')
const snowDispTexture = textureLoader.load('/snow/snow_floor_1k/snow_floor_disp_1k.jpg')
const snowNormalTexture = textureLoader.load('/snow/snow_floor_1k/snow_floor_nor_gl_1k.jpg')

snowColorTexture.colorSpace = THREE.SRGBColorSpace


// Bush
const bushColorTexture = textureLoader.load('/bush/white-spruce-tree-bark/white-spruce-tree-bark-albedo.png')
const bushAOTexture = textureLoader.load('/bush/white-spruce-tree-bark/white-spruce-tree-bark-ao.png')
const bushDispTexture = textureLoader.load('/bush/white-spruce-tree-bark/white-spruce-tree-bark-height.png')
const bushNormalTexture = textureLoader.load('/bush/white-spruce-tree-bark/white-spruce-tree-bark-normal-ogl.png')

bushColorTexture.colorSpace = THREE.SRGBColorSpace


// Walls
const wallARMTexture = textureLoader.load('/wall/rock_wall_10_1k/rock_wall_10_arm_1k.jpg')
const wallColorTexture = textureLoader.load('/wall/rock_wall_10_1k/rock_wall_10_diff_1k.jpg')
const wallDispTexture = textureLoader.load('/wall/rock_wall_10_1k/rock_wall_10_disp_1k.jpg')
const wallNormalTexture = textureLoader.load('/wall/rock_wall_10_1k/rock_wall_10_nor_gl_1k.jpg')

wallColorTexture.colorSpace = THREE.SRGBColorSpace

wallColorTexture.repeat.set(2,2)
wallARMTexture.repeat.set(2,2)
wallNormalTexture.repeat.set(2,2)

wallColorTexture.wrapS = THREE.RepeatWrapping
wallARMTexture.wrapS = THREE.RepeatWrapping
wallNormalTexture.wrapS = THREE.RepeatWrapping

wallColorTexture.wrapT = THREE.RepeatWrapping
wallARMTexture.wrapT = THREE.RepeatWrapping
wallNormalTexture.wrapT = THREE.RepeatWrapping

// Scene
const scene = new THREE.Scene();

// Size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 9.18
camera.position.y = 4.51
camera.position.z = 9.43
scene.add(camera)

const cameraPositionDebug = gui.addFolder('Camera Position')
cameraPositionDebug.add(camera.position, 'x', 0, 20, 0.01);
cameraPositionDebug.add(camera.position, 'y', 0, 20, 0.01);
cameraPositionDebug.add(camera.position, 'z', 0, 20, 0.01);


// Floor

const floorGeometry = new THREE.PlaneGeometry(40, 40, 64, 64);
const floorMaterial = new THREE.MeshStandardMaterial({ transparent: true, alphaMap: floorAlphaTexture, normalMap: floorNormalTexture, map: floorColorTexture, aoMap: floorARMTexture, roughnessMap: floorARMTexture, metalnessMap: floorARMTexture, displacementMap: floorDispTexture, displacementScale: 0.4, color: "#f9f9f9", displacementBias: 0.2 });




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

const wallsGeometry = new THREE.BoxGeometry(5, 3, 5, 500, 500)
const wallsMaterial = new THREE.MeshStandardMaterial({
  map: wallColorTexture,
  normalMap: wallNormalTexture,
  aoMap: wallARMTexture,
  metalnessMap: wallARMTexture,
  roughnessMap: wallARMTexture,
})



const walls = new THREE.Mesh(wallsGeometry, wallsMaterial)

walls.position.y = 1.5

house.add(walls)


// Roof
const roofGeometry = new THREE.ConeGeometry(4.5, 1.5, 40, 1);
const roofMaterial = new THREE.MeshStandardMaterial({ color: "yellow" })
const roof = new THREE.Mesh(roofGeometry, roofMaterial);

roof.position.y = 0.75 + 3
house.add(roof);


// Door
const doorGeometry = new THREE.PlaneGeometry(1.5, 2.5, 1)
const doorMaterial = new THREE.MeshStandardMaterial({ color: "red" })
const door = new THREE.Mesh(doorGeometry, doorMaterial)
door.position.y = 1
door.position.z = 2.51

house.add(door)

// Bushes
const bushGeometry = new THREE.SphereGeometry(0.4, 40)
const bushMaterial = new THREE.MeshStandardMaterial({ normalMap: bushNormalTexture, map: bushColorTexture, aoMap: bushAOTexture, displacementMap: bushDispTexture , displacementScale: 0.2, displacementBias: 0.2 })

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial)
const bush2 = new THREE.Mesh(bushGeometry, bushMaterial)
const bush3 = new THREE.Mesh(bushGeometry, bushMaterial)
const bush4 = new THREE.Mesh(bushGeometry, bushMaterial)

bush1.position.y = 0.5
bush1.position.z = 3
bush1.position.x = 1.3

bush2.position.y = 0.3
bush2.position.z = 2.8
bush2.position.x = 2

bush2.scale.set(0.6, 0.6, 0.6);

bush3.position.y = 0.5
bush3.position.z = 3
bush3.position.x = -1.3


bush4.position.y = 0.3
bush4.position.z = 2.8
bush4.position.x = -2

bush4.scale.set(0.6, 0.6, 0.6);


house.add(bush1, bush2, bush3,bush4)

// Snows
const snowGeometry = new THREE.SphereGeometry(0.5, 100);
const snowMaterial = new THREE.MeshStandardMaterial({ aoMap: snowARMTexture, metalnessMap: snowARMTexture, roughnessMap: snowARMTexture, normalMap: snowNormalTexture, map: snowColorTexture, displacementMap: snowDispTexture, displacementScale: 0.2, color: "#f9f9f9" })

const minRadius = 5;
const maxRadius = 9;
for (let i = 0; i < 150; i++) {
  const snow = new THREE.Mesh(snowGeometry, snowMaterial);
  scene.add(snow);
  const angle = Math.random() * Math.PI * 2;
  // Random angle for each snowflake
  const r = minRadius + (Math.random() * (maxRadius - minRadius));
  snow.position.y = 0.4
  // Convert polar coordinates (r, angle) to Cartesian coordinates (x, z)
  snow.position.x = r * Math.cos(angle);
  snow.position.z = r * Math.sin(angle);
  const scale = 0.1 + Math.random() * 0.4; // Adjust range as needed
  snow.scale.set(scale, scale, scale);
}

// Snow man
const snowMan = new THREE.Group()
scene.add(snowMan)

const snowManGeometry = new THREE.SphereGeometry(1, 24)
const snowManMaterial = new THREE.MeshStandardMaterial({ aoMap: snowARMTexture, metalnessMap: snowARMTexture, roughnessMap: snowARMTexture, normalMap: snowNormalTexture, map: snowColorTexture })

const biggestSnow = new THREE.Mesh(snowManGeometry, snowManMaterial)

const bigSnow = new THREE.Mesh(snowManGeometry, snowManMaterial.clone());
const smallSnow = new THREE.Mesh(snowManGeometry, snowManMaterial.clone());

bigSnow.scale.set(0.7, 0.7, 0.7)
smallSnow.scale.set(0.5, 0.5, 0.5)

biggestSnow.position.z = 5.4
biggestSnow.position.x = -5
biggestSnow.position.y = 1

bigSnow.position.z = 5.4;
bigSnow.position.x = -5
bigSnow.position.y = 2

smallSnow.position.z = 5.4;
smallSnow.position.x = -5
smallSnow.position.y = 2.8



snowMan.add(biggestSnow, bigSnow, smallSnow);

snowMan.position.z = 3

// Lights
const light = new THREE.AmbientLight(0xffffff, 4); // soft white light
scene.add(light);


// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true
controls.update()

// Renderer

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});

/**
 * Environment Map
 */
const rgbeLoader = new RGBELoader()
rgbeLoader.load('./kloppenheim_02_puresky_2k.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap
  scene.environment = environmentMap
})



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