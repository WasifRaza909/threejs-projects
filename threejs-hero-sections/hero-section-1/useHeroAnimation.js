import { useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Tunable parameters for the particle field and interaction physics.
 * Buyers customise the effect by editing these values only.
 */
const CONFIG = {
  particleCount: 4000,
  layerFar: 0.5, // fraction of particles in far layer
  layerMid: 0.3, // fraction in mid layer
  layerNear: 0.2, // fraction in near layer
  repulsionRadius: 2.2,
  repulsionForce: 0.06,
  returnSpeed: 0.03,
  tiltStrength: 0.08,
  rotationSpeed: 0.00015,
  colors: ['#c8d8f0', '#7eb8f7', '#a78bfa'],
  colorWeights: [0.7, 0.2, 0.1],
};

// Per-layer visual + physics ranges. Index 0 = far, 1 = mid, 2 = near.
const LAYERS = [
  { sizeMin: 0.9, sizeMax: 1.4, alphaMin: 0.3, alphaMax: 0.5, velMin: 0.0003, velMax: 0.0008, zMin: -4.0, zMax: -1.5 },
  { sizeMin: 1.6, sizeMax: 2.6, alphaMin: 0.5, alphaMax: 0.7, velMin: 0.0008, velMax: 0.0015, zMin: -1.5, zMax: 0.6 },
  { sizeMin: 3.2, sizeMax: 5.2, alphaMin: 0.7, alphaMax: 1.0, velMin: 0.0015, velMax: 0.003, zMin: 0.6, zMax: 2.2 },
];

const BOUND_XY = 8;
const BOUND_Z = 4;

/**
 * Soft radial sprite on an offscreen canvas, used as the point texture so each
 * particle renders as a round, soft-edged dot.
 * @returns {THREE.CanvasTexture}
 */
function createCircleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Radial glow sprite texture acting as the scene's "light source" at center.
 * @param {string} hex
 * @returns {THREE.CanvasTexture}
 */
function createGlowTexture(hex) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = new THREE.Color(hex);
  const r = Math.round(c.r * 255);
  const gC = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${gC},${b},0.15)`);
  grad.addColorStop(0.5, `rgba(${r},${gC},${b},0.06)`);
  grad.addColorStop(1, `rgba(${r},${gC},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Custom hook owning ALL Three.js + GSAP logic. HeroSection.jsx stays pure JSX.
 *
 * A custom ShaderMaterial (not PointsMaterial) drives the particles: PointsMaterial
 * applies a single uniform size to every point, so it cannot render the three
 * distinct depth layers. The shader reads per-particle size/colour/alpha attributes,
 * which is what gives the field its depth and premium feel.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLElement>} params.sectionRef
 * @param {React.RefObject<HTMLDivElement>} params.canvasRef
 * @param {React.RefObject<HTMLHeadingElement>} params.headlineRef
 * @param {React.RefObject<HTMLParagraphElement>} params.eyebrowRef
 * @param {React.RefObject<HTMLParagraphElement>} params.subRef
 * @param {React.RefObject<HTMLDivElement>} params.ctaRef
 * @param {React.RefObject<HTMLDivElement>} params.scrollRef
 * @param {React.RefObject<HTMLAnchorElement>} params.primaryBtnRef
 * @param {React.RefObject<HTMLAnchorElement>} params.secondaryBtnRef
 * @param {string} params.particleColor
 * @param {string} params.accentColor
 */
export function useHeroAnimation({
  sectionRef,
  canvasRef,
  headlineRef,
  eyebrowRef,
  subRef,
  ctaRef,
  scrollRef,
  primaryBtnRef,
  secondaryBtnRef,
  particleColor,
  accentColor,
}) {
  useEffect(() => {
    const mount = canvasRef.current;
    const section = sectionRef.current;
    if (!mount || !section) return;

    // Registered inside the effect (never module level) so SSR never touches
    // the browser-only ScrollTrigger plugin during server render.
    gsap.registerPlugin(ScrollTrigger);

    // Every GPU-backed object exposing .dispose() is tracked and freed on unmount.
    const disposables = [];

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    camera.position.z = 6;

    // tiltGroup: leans toward the mouse. spinGroup (child): slow continuous spin.
    // Splitting them keeps each rotation source from overwriting the other.
    const tiltGroup = new THREE.Group();
    const spinGroup = new THREE.Group();
    tiltGroup.add(spinGroup);
    scene.add(tiltGroup);

    // --- Particle buffers ---
    const count = CONFIG.particleCount;
    const farCount = Math.round(count * CONFIG.layerFar);
    const midCount = Math.round(count * CONFIG.layerMid);

    const positions = new Float32Array(count * 3); // live display positions
    const home = new Float32Array(count * 3); // drifting rest positions
    const drift = new Float32Array(count * 3); // per-particle drift velocity
    const vel = new Float32Array(count * 3); // repulsion momentum (decays)
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);

    const palette = [
      new THREE.Color(CONFIG.colors[0]),
      new THREE.Color(particleColor), // medium-blue slot honours the prop
      new THREE.Color(CONFIG.colors[2]),
    ];
    const w0 = CONFIG.colorWeights[0];
    const w1 = w0 + CONFIG.colorWeights[1];

    const rand = (min, max) => min + Math.random() * (max - min);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const layer = i < farCount ? LAYERS[0] : i < farCount + midCount ? LAYERS[1] : LAYERS[2];

      // Centre-biased spread: denser cluster in the middle, sparser at edges.
      const x = (Math.random() - 0.5) * 16 * (0.5 + Math.random() * 0.5);
      const y = (Math.random() - 0.5) * 16 * (0.5 + Math.random() * 0.5);
      const z = rand(layer.zMin, layer.zMax);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      home[i3] = x;
      home[i3 + 1] = y;
      home[i3 + 2] = z;

      // Unique drift direction, magnitude scaled to the layer.
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(layer.velMin, layer.velMax);
      drift[i3] = Math.cos(angle) * speed;
      drift[i3 + 1] = Math.sin(angle) * speed;
      drift[i3 + 2] = (Math.random() - 0.5) * speed * 0.6;

      // Weighted palette selection.
      const r = Math.random();
      const col = r < w0 ? palette[0] : r < w1 ? palette[1] : palette[2];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      sizes[i] = rand(layer.sizeMin, layer.sizeMax);
      alphas[i] = rand(layer.alphaMin, layer.alphaMax);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    disposables.push(geometry);

    const circleTexture = createCircleTexture();
    disposables.push(circleTexture);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: circleTexture },
        uSize: { value: 14.0 },
        uPixelRatio: { value: pixelRatio },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 aColor;
        uniform float uSize;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uSize * uPixelRatio / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float mask = texture2D(uTexture, gl_PointCoord).a;
          if (mask < 0.05) discard;
          float a = mask * vAlpha;
          gl_FragColor = vec4(vColor * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(material);

    const points = new THREE.Points(geometry, material);
    spinGroup.add(points);

    const positionAttr = geometry.getAttribute('position');

    // --- Central glow sprite (the scene's light source) ---
    const glowTexture = createGlowTexture(accentColor);
    disposables.push(glowTexture);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(glowMaterial);
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(6, 6, 1);
    scene.add(glow);

    // --- Portal: procedural "singularity" glow, the hero centrepiece ---
    // A square plane with a fragment shader that draws an elliptical event
    // horizon (bottom-weighted accretion hotspot), swirling fbm energy, a
    // central bloom, an additive halo and a horizontal lens streak. Additive
    // blending over the near-black background gives the hollow "black hole".
    const portalGeometry = new THREE.PlaneGeometry(1, 1);
    disposables.push(portalGeometry);

    const portalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorEdge: { value: new THREE.Color(accentColor) },
        uColorMid: { value: new THREE.Color('#a855f7') },
        uColorCore: { value: new THREE.Color('#f3ecff') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColorEdge;
        uniform vec3 uColorMid;
        uniform vec3 uColorCore;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
          return v;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          vec2 p = uv;
          p.y *= 1.55; // vertical squash -> ring seen at an angle

          float r = length(p);
          float ang = atan(p.y, p.x);

          // Event horizon ring, brighter along the bottom (accretion hotspot).
          // Gaussian falloffs use explicit squares: GLSL pow(x, 2.0) is
          // undefined for negative x, so squaring keeps it correct on every GPU.
          float ringR = 0.30;
          float ringW = 0.055;
          float rd = (r - ringR) / ringW;
          float ring = exp(-rd * rd);
          float hotspot = smoothstep(-0.35, 0.40, -uv.y);
          ring *= mix(0.16, 2.3, hotspot);

          // Swirling energy travelling around the ring.
          float swirl = fbm(vec2(ang * 2.5 + uTime * 0.55, r * 8.0 - uTime * 0.40));
          ring *= 0.55 + 0.85 * swirl;

          // Central bloom rising from just below centre.
          vec2 cp = uv; cp.y += 0.04;
          float cl = length(cp * vec2(1.15, 1.45)) / 0.17;
          float core = exp(-cl * cl) * 1.25;

          // Soft outer halo, weighted toward the hotspot.
          float halo = exp(-r * 3.2) * 0.55 * (0.7 + 0.5 * hotspot);

          // Horizontal lens streak through the brightest point.
          float sy = uv.y / 0.010;
          float sx = uv.x / 0.40;
          float streak = exp(-sy * sy) * exp(-sx * sx) * 1.1;

          // Faint sparkle dust along the far (top) arc.
          float ad = (r - ringR) / 0.02;
          float arc = exp(-ad * ad) * smoothstep(0.05, 0.9, uv.y);
          float dust = step(0.93, hash(floor(uv * 42.0 + vec2(0.0, floor(uTime * 2.0)))));
          arc *= dust * 1.8;

          float intensity = ring + core + halo + streak + arc;
          // Hollow the very centre so the "hole" reads as dark.
          intensity *= mix(0.30, 1.0, smoothstep(0.0, 0.14, r));
          intensity *= 0.92 + 0.08 * sin(uTime * 1.2); // gentle pulse
          intensity = max(intensity, 0.0);

          vec3 col = uColorEdge;
          col = mix(col, uColorMid, clamp(intensity * 0.9, 0.0, 1.0));
          col = mix(col, uColorCore, clamp(intensity - 0.9, 0.0, 1.0));

          gl_FragColor = vec4(col * intensity, intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(portalMaterial);

    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.scale.set(9.5, 9.5, 1);
    portal.position.set(0, -0.55, -0.5);
    scene.add(portal);

    // Drives the portal shader animation; performance.now()-based, no React state.
    const clock = new THREE.Clock();

    // --- Mouse tracking (plain locals, no React state -> no re-renders) ---
    const mouse = { x: 0, y: 0 };
    const handleMouse = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouse);

    // Reused scratch objects so the per-frame loop allocates nothing.
    const worldMouse = new THREE.Vector3();
    const localMouse = new THREE.Vector3();
    const dirVec = new THREE.Vector3();

    let animFrame = null;
    const R = CONFIG.repulsionRadius;
    const R2 = R * R;

    const animate = () => {
      animFrame = requestAnimationFrame(animate);

      // Keep world matrices current so worldToLocal maps the mouse into the
      // (tilted + spun) particle space accurately.
      tiltGroup.updateMatrixWorld(true);

      // Project the mouse onto the z = 0 plane in world space, then into local space.
      worldMouse.set(mouse.x, mouse.y, 0.5).unproject(camera);
      dirVec.copy(worldMouse).sub(camera.position).normalize();
      const dist = -camera.position.z / dirVec.z;
      worldMouse.copy(camera.position).add(dirVec.multiplyScalar(dist));
      localMouse.copy(worldMouse);
      points.worldToLocal(localMouse);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        // Drift the home (rest) position and wrap at the field boundary. Shifting
        // the live position by the same delta avoids a spring streak on wrap.
        home[i3] += drift[i3];
        home[i3 + 1] += drift[i3 + 1];
        home[i3 + 2] += drift[i3 + 2];
        if (home[i3] > BOUND_XY) { home[i3] -= BOUND_XY * 2; positions[i3] -= BOUND_XY * 2; }
        else if (home[i3] < -BOUND_XY) { home[i3] += BOUND_XY * 2; positions[i3] += BOUND_XY * 2; }
        if (home[i3 + 1] > BOUND_XY) { home[i3 + 1] -= BOUND_XY * 2; positions[i3 + 1] -= BOUND_XY * 2; }
        else if (home[i3 + 1] < -BOUND_XY) { home[i3 + 1] += BOUND_XY * 2; positions[i3 + 1] += BOUND_XY * 2; }
        if (home[i3 + 2] > BOUND_Z) { home[i3 + 2] -= BOUND_Z * 2; positions[i3 + 2] -= BOUND_Z * 2; }
        else if (home[i3 + 2] < -BOUND_Z) { home[i3 + 2] += BOUND_Z * 2; positions[i3 + 2] += BOUND_Z * 2; }

        // Mouse repulsion in the XY plane -> impulse into the momentum velocity.
        const dx = positions[i3] - localMouse.x;
        const dy = positions[i3 + 1] - localMouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const f = (CONFIG.repulsionForce * (R - d)) / R / d;
          vel[i3] += dx * f;
          vel[i3 + 1] += dy * f;
        }

        // Momentum decay gives the particles weight/inertia rather than a snap.
        vel[i3] *= 0.95;
        vel[i3 + 1] *= 0.95;
        vel[i3 + 2] *= 0.95;

        positions[i3] += vel[i3];
        positions[i3 + 1] += vel[i3 + 1];
        positions[i3 + 2] += vel[i3 + 2];

        // Spring back toward the (drifting) home position.
        positions[i3] += (home[i3] - positions[i3]) * CONFIG.returnSpeed;
        positions[i3 + 1] += (home[i3 + 1] - positions[i3 + 1]) * CONFIG.returnSpeed;
        positions[i3 + 2] += (home[i3 + 2] - positions[i3 + 2]) * CONFIG.returnSpeed;
      }
      positionAttr.needsUpdate = true;

      // Slow continuous spin + immersive tilt easing toward the mouse.
      spinGroup.rotation.y += CONFIG.rotationSpeed;
      tiltGroup.rotation.y += (mouse.x * CONFIG.tiltStrength - tiltGroup.rotation.y) * 0.02;
      tiltGroup.rotation.x += (mouse.y * -0.05 - tiltGroup.rotation.x) * 0.02;

      // Animate + lightly parallax the portal toward the cursor for depth.
      portalMaterial.uniforms.uTime.value = clock.getElapsedTime();
      portal.position.x += (mouse.x * 0.18 - portal.position.x) * 0.04;
      portal.position.y += (-0.55 + mouse.y * 0.12 - portal.position.y) * 0.04;

      renderer.render(scene, camera);
    };
    animate();

    // --- GSAP context: scopes every tween/ScrollTrigger so ctx.revert() kills
    // them all on unmount, preventing tweens stacking across re-mounts. ---
    const listeners = [];

    const ctx = gsap.context(() => {
      // Ensure characters start hidden below their clip box before animating.
      gsap.set('.char-animate', { y: '110%' });

      const tl = gsap.timeline();

      tl.to(section, { opacity: 1, duration: 0.3 }, 0.2)
        .fromTo(
          eyebrowRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          0.3
        )
        // Reveal the headline parent first, then cascade the characters in.
        .to(headlineRef.current, { opacity: 1, duration: 0.01 }, 0.5)
        .to(
          '.char-animate',
          { y: '0%', duration: 0.55, stagger: 0.028, ease: 'power4.out' },
          0.55
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
          1.4
        )
        .fromTo(
          ctaRef.current.children,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.4)' },
          1.8
        )
        .to(scrollRef.current, { opacity: 1, duration: 0.5 }, 2.1);

      // Scroll indicator infinite bounce.
      gsap.to(scrollRef.current, {
        y: 8,
        duration: 0.8,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Fade the indicator out once the page is scrolled ~100px.
      ScrollTrigger.create({
        start: 100,
        end: 'max',
        onEnter: () => gsap.to(scrollRef.current, { autoAlpha: 0, duration: 0.3, overwrite: 'auto' }),
        onLeaveBack: () => gsap.to(scrollRef.current, { autoAlpha: 1, duration: 0.3, overwrite: 'auto' }),
      });

      // Subtle canvas parallax for depth on scroll.
      gsap.to(mount, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 1 },
      });

      // --- Magnetic buttons (quickTo created once, reused per mousemove) ---
      const buttons = [
        { el: primaryBtnRef.current, primary: true },
        { el: secondaryBtnRef.current, primary: false },
      ].filter((b) => b.el);

      buttons.forEach(({ el, primary }) => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });

        const onMove = (e) => {
          const rect = el.getBoundingClientRect();
          const relX = e.clientX - rect.left - rect.width / 2;
          const relY = e.clientY - rect.top - rect.height / 2;
          xTo(gsap.utils.clamp(-10, 10, relX * 0.35));
          yTo(gsap.utils.clamp(-10, 10, relY * 0.35));
        };
        const onEnter = () => {
          if (primary) {
            gsap.to(el, { scale: 1.02, filter: 'brightness(1.12)', duration: 0.3, ease: 'power2.out' });
          } else {
            gsap.to(el, {
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'rgba(255,255,255,0.95)',
              duration: 0.3,
              ease: 'power2.out',
            });
          }
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
          if (primary) {
            gsap.to(el, { scale: 1, filter: 'brightness(1)', duration: 0.4, ease: 'power3.out' });
          } else {
            gsap.to(el, {
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              duration: 0.4,
              ease: 'power3.out',
            });
          }
        };

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        listeners.push({ el, onMove, onEnter, onLeave });
      });
    }, sectionRef);

    // --- Resize ---
    const handleResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const pr = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h);
      material.uniforms.uPixelRatio.value = pr;
    };
    window.addEventListener('resize', handleResize);

    // --- CLEANUP: fully resets so a StrictMode second mount behaves identically ---
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', handleResize);

      listeners.forEach(({ el, onMove, onEnter, onLeave }) => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });

      ctx.revert();

      disposables.forEach((d) => d.dispose?.());

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }

      scene.clear();
    };
  }, []); // empty deps — set up once on mount, fully tear down on unmount
}
