import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import gsap from 'gsap'
const gui = new GUI();

// Constants
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Create a scene
const scene = new THREE.Scene()

// Create a camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)

camera.position.z = 0.2
scene.add(camera)

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight({ color: "#ffffff", intensity: 2 })
const directionalLight = new THREE.DirectionalLight({ color: "#ffffff", intensity: 1 })

directionalLight.position.set(0, 0.8, 1);


const pointLight = new THREE.PointLight(0xffffff, 1, 100)
pointLight.position.set(0, 0.1, 0.1);

scene.add(ambientLight)
scene.add(pointLight)
scene.add(directionalLight)

// Loader
const loader = new GLTFLoader();

let glass;
loader.load('./assets/apple-watch.glb', (gltf) => {
    glass = gltf.scene;
    glass.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.color.set('#00ff'); // Set to red or any desired color
        }
    });

    glass.scale.set(1.5, 1.5, 1.5)
    glass.position.set(0.1, 0,0)
    scene.add(glass)
    gsap.fromTo(glass.scale, {
        x: 5,
        y: 5,
        z: 5,
    }, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
    })
    gsap.fromTo(glass.position, {
        x: 0,
      
    }, {
        x: 0.2,
      
    })

})

// Create a renderer
const canvas = document.getElementById('canvas')

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
renderer.setSize(sizes.width, sizes.height)

renderer.render(scene, camera)

/**
 * Controls
 */
// const controls = new OrbitControls(camera, renderer.domElement);

const tick = () => {
    renderer.render(scene, camera)
    requestAnimationFrame(tick)
    controls.update()

}

tick()