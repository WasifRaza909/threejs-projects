import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
// const gui = new GUI();

// Constants
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const defaultColorModel = "#a30000";
let modelLoaded = false;

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
// const watchTweaks = gui.addFolder("Awesome Cube");

// Loader
const loader = new GLTFLoader();

let glass;
loader.load("./assets/apple-watch.glb", (gltf) => {
  glass = gltf.scene;
  modelLoaded = true;
  const loadingBarTl = gsap.timeline({
    onUpdate: () => {
      // Check the current progress of the loading bar animation
      loadingProgressPercentage = Math.round(
        Math.min(100, (loadingBarTl.progress() / 1) * 100)
      ); // Get the progress (0 to 1)
      loaderPercentage.textContent = `${loadingProgressPercentage}%`;
    },
  });

  loadingBarTl.to(
    ".js-loader-bottom-bar",
    {
      width: "100%",
    }
  ).to('.js-loader',{
    height: 0,
  })
  
  ;
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
      x: 0.16,
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
      x: 0.938,
      y: -0.956,
      z: 0.65,
      duration: 2,
    },"<"
  );

  //   watchTweaks
  //     .add(glass.position, "y")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("position Y");
  //   watchTweaks
  //     .add(glass.position, "x")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("position x");
  //   watchTweaks
  //     .add(glass.position, "z")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("position z");

  //     watchTweaks
  //     .add(glass.rotation, "y")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("rotation Y");
  //   watchTweaks
  //     .add(glass.rotation, "x")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("rotation x");
  //   watchTweaks
  //     .add(glass.rotation, "z")
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name("rotation z");

  //     watchTweaks.add({ scale: glass.scale.x }, 'scale')
  //     .min(-3)
  //     .max(3)
  //     .step(0.001)
  //     .name('scale')
  //     .onChange(value => {
  //         glass.scale.set(value, value, value);
  //     });
});

// Create a renderer
const canvas = document.getElementById("canvas");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(sizes.width, sizes.height);

renderer.render(scene, camera);

/**
 * Controls
 */
// const controls = new OrbitControls(camera, renderer.domElement);

const tick = () => {
  renderer.render(scene, camera);
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
  const loadingBarTl = gsap.timeline({
    onUpdate: () => {
      // Check the current progress of the loading bar animation
      loadingProgressPercentage = Math.round(
        Math.min(90, (loadingBarTl.progress() / 1) * 100)
      ); // Get the progress (0 to 1)
      loaderPercentage.textContent = `${loadingProgressPercentage}%`;
    },
  });

  loadingBarTl.fromTo(
    ".js-loader-bottom-bar",
    {
      width: "0%",
    },
    {
      width: "90%",
    }
  );
});
