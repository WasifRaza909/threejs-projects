import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
const gui = new GUI();
gui.hide()

// Constants

const windowWidth = document.documentElement.getBoundingClientRect().width;
const windowHeight = document.documentElement.getBoundingClientRect().height;
const sizes = {
  width: windowWidth,
  height: windowHeight,
};
const defaultColorModel = "#a30000";
let loadingAnimationComplete = false;
let isMouseDown = false;
let mouse = {
  x: 0,
  y: 0,
}

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);

camera.position.z = 0.2;
scene.add(camera);

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight({ color: "#ffffff", intensity: 2 });
const directionalLight = new THREE.DirectionalLight({
  color: "#ffffff",
  intensity: 1,
});

directionalLight.position.set(0, 0.8, 1);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0.1, 0.1);

scene.add(ambientLight);
scene.add(pointLight);
scene.add(directionalLight);

/**
 * GUI
 */
const watchTweaks = gui.addFolder("Awesome Cube");

// Loader
const loader = new GLTFLoader();

let glass;
loader.load("../apple-watch.glb", (gltf) => {
  glass = gltf.scene;
  const loadingBarTl = gsap.timeline();

  loadingBarTl.fromTo(
    ".js-loader-bottom-bar",
    {
      width: "99%",
    },
    {
      width: "100%",
      delay: 0.6,
            onUpdate: (e) => {
        loadingProgressPercentage = Math.round(
          Math.min(100, (loadingBarTl.progress() / 1) * 100)
        );
        loaderPercentage.textContent = `100%`;
      },
    }
  ).to('.js-loader',{
    height: 0,
    onComplete:() => {
      loadingAnimationComplete = true;
    } 
  })

  glass.traverse((child) => {
    if (child.isMesh && child.material) {
      if (
        child.name.includes("Object_4") ||
        child.name.includes("Object_7") ||
        child.name.includes("Object_9")
      ) {
        // Use the name of the part to target
        child.material.color.set(defaultColorModel); // Set to red or any desired color
      }
    }
  });

  glass.scale.set(1.5, 1.5, 1.5);
  glass.position.set(0.1, 0, 0);
  scene.add(glass);
  loadingBarTl.fromTo(
    glass.scale,
    {
      x: 6,
      y: 6,
      z: 6,
    },
    {
      x: 1.9,
      y: 1.9,
      z: 1.9,
      duration: 2,
    },"-=0.2"
  );
  loadingBarTl.fromTo(
    glass.position,
    {
      x: -1,
    },
    {
      x: 0.14,
      y: -0.015,
      duration: 2,
    },"<"
  );

  loadingBarTl.fromTo(
    glass.rotation,
    {
      x: 0,
    },
    {
      // x: 0.938,
      y: -0.91,
      // z: 0.65,
      duration: 2,
    },"<"
  );
  loadingBarTl.fromTo(
    '.js-logo, .js-nav-links',
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 0.4,
    }
  ).fromTo(
    '.js-banner-content-sub-heading, .js-banner-content-description',
    {
      x: '-40%',
      opacity: 0,
    },
    {
      x: '0%',
      opacity: 1,
      duration: 0.4,
    }
  ).fromTo(
    '.js-shop-now-btn',
    {
      y: '100%',
      opacity:0,
    },
    {
      y: '0%',
      opacity:1,
      duration: 0.4,
    },'<'

  ).fromTo(
    '.js-banner-heading-span',
    {
      y: '100%',
    },
    {
      y: '0%',
      duration: 0.8,
    },"-=0.4"
  )

    watchTweaks
      .add(glass.position, "y")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("position Y");
    watchTweaks
      .add(glass.position, "x")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("position x");
    watchTweaks
      .add(glass.position, "z")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("position z");

      watchTweaks
      .add(glass.rotation, "y")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("rotation Y");
    watchTweaks
      .add(glass.rotation, "x")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("rotation x");
    watchTweaks
      .add(glass.rotation, "z")
      .min(-3)
      .max(3)
      .step(0.001)
      .name("rotation z");

      watchTweaks.add({ scale: glass.scale.x }, 'scale')
      .min(-3)
      .max(3)
      .step(0.001)
      .name('scale')
      .onChange(value => {
          glass.scale.set(value, value, value);
      });
});

// Create a renderer
const canvas = document.getElementById("canvas");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(sizes.width, sizes.height);
console.log(window.innerWidth, sizes.height);
renderer.render(scene, camera);

/**
 * Controls
 */
// const controls = new OrbitControls(camera, renderer.domElement);

const tick = () => {
  renderer.render(scene, camera);
  if(loadingAnimationComplete){
    // 
    // glass.rotation.x += 0.01;
    glass.rotation.y += 0.01;
    // glass.rotation.z += 0.01;
  }
  requestAnimationFrame(tick);
};

tick();

/**
 * Slider Indicator click
 */

const sliderIndicators = document.querySelectorAll(".js-slider-indicator");
const mainWrapper = document.querySelector(".main-wrapper");
let originalColor;
sliderIndicators.forEach((sliderIndicator) => {
  sliderIndicator.addEventListener("click", (e) => {
    sliderIndicators.forEach((activeSliderIndicator) => {
      activeSliderIndicator.classList.remove("active");
    });

    e.currentTarget.classList.add("active");

    mainWrapper.classList.remove(
      ...Array.from(mainWrapper.classList).filter((cls) =>
        cls.startsWith("color-")
      )
    );

    const dataColor = e.currentTarget.getAttribute("data-color");

    if (dataColor) {
      mainWrapper.classList.add(`color-${dataColor}`);

      // 4 is the rotator
      // 7 is the frame of clock
      // 9 is the belt

      if (glass) {
        glass.traverse((child) => {
          if (child.isMesh && child.material) {
            originalColor = child.material.color.clone();

            if (
              child.name.includes("Object_4") ||
              child.name.includes("Object_7") ||
              child.name.includes("Object_9")
            ) {
              // Use the name of the part to target
              if (dataColor === "red") {
                child.material.color.set("#a30000"); // Set to red or any desired color
              } else if (dataColor === "purple") {
                child.material.color.set("#800080");
              } else if (dataColor === "blue") {
                child.material.color.set("#003149");
              }
            }
          }
        });
      }
    }
  });
});
const loaderPercentage = document.querySelector(".js-loader-percentage");
let loadingProgressPercentage;
window.addEventListener("load", () => {
  const loadLoadingBarTl = gsap.timeline({
    onUpdate: () => {
      // Check the current progress of the loading bar animation
      loadingProgressPercentage = Math.round(
        Math.min(99, (loadLoadingBarTl.progress() / 1) * 100)
      ); // Get the progress (0 to 1)
      loaderPercentage.textContent = `${loadingProgressPercentage}%`;
    },
  });

  loadLoadingBarTl.fromTo(
    ".js-loader-bottom-bar",
    {
      width: "0%",
    },
    {
      width: "99%",
      duration: 0.5,
    }
  );
});

window.addEventListener('mousedown', (e) => {
  isMouseDown= true;
  mouse = { x: e.clientX, y: e.clientY };
})


window.addEventListener('resize', (e) => {
  window.location.reload()
})

window.addEventListener('mouseup', () => {
  isMouseDown= false

})
window.addEventListener('mousemove', (e) => {
  if(isMouseDown && glass){
    if(e.clientX > window.innerWidth * 0.62) {
      const deltaX = e.clientX - mouse.x;
  
      // Update glass rotation based on mouse movement
      glass.rotation.y += deltaX * 0.005; // Adjust rotation speed
  
      // Update the previous mouse position
      mouse = { x: e.clientX, y: e.clientY };
    }
  }
})

