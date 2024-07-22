import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { DragControls, OrbitControls } from 'three/examples/jsm/Addons.js';

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Textures
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('textures/matcaps/8.png')
matcapTexture.colorSpace = THREE.SRGBColorSpace

const cubes = [];


// Fonts 
const fontLoader = new FontLoader()
fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) => {
        const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })
        const textGeometry = new TextGeometry('Wasif Raza', {
            font: font,
            size: 0.5,
            depth: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5,
            
        })

        textGeometry.center()

        const text = new THREE.Mesh(textGeometry, textMaterial)

        scene.add(text)

        const geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
        const material = new THREE.MeshMatcapMaterial( {matcap: matcapTexture} ); 
        for(let i = 0; i < 1000; i++){
            const cube = new THREE.Mesh( geometry, material );
         
            cube.position.x = (Math.random()  - 0.5) * 50
            cube.position.y = (Math.random()  - 0.5) * 50
            cube.position.z = (Math.random()  - 0.5) * 50

            const scale = Math.random()
            cube.scale.set(scale,scale,scale)

            scene.add( cube );
            cubes.push(cube);
        }


    }
)



// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Resize
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update Camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.render(scene, camera)
})

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)


// Controls
const controls = new OrbitControls(camera, canvas)
const dragControls = new DragControls(cubes, camera, canvas)
controls.enableDamping = true

dragControls.addEventListener('dragstart', function () {
    controls.enabled = false;
});

// Re-enable OrbitControls when dragging ends
dragControls.addEventListener('dragend', function () {
    controls.enabled = true;
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()