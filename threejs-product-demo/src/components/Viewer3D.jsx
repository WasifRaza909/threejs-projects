import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Bounds, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { Model, ProceduralModel } from './Model';
import { useConfiguratorStore } from '../store/useConfiguratorStore';

/**
 * ModelErrorBoundary Component
 * Catches 3D load errors (such as network fetch failures) inside the Canvas
 * and triggers the rendering of a local procedural model so the app doesn't crash.
 */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("GLTF Asset failed to load. Falling back to offline procedural model.", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * LoaderHtml Component
 * Custom loader using Drei's <Html> helper to display loading progress
 * as a luxury minimalist loader inside the R3F canvas.
 */
function LoaderHtml() {
  const { progress } = useProgress();
  const setLoadingProgress = useConfiguratorStore((state) => state.setLoadingProgress);

  // Sync loading progress with global Zustand store
  useEffect(() => {
    setLoadingProgress(Math.round(progress));
  }, [progress, setLoadingProgress]);

  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md rounded-xl shadow-premium border border-stone-200/50 min-w-[150px] transition-all duration-300">
        <div className="relative flex items-center justify-center">
          {/* Animated luxury spinner */}
          <div className="w-12 h-12 border-[3px] border-stone-200 border-t-[#5A2611] rounded-full animate-spin"></div>
          <div className="absolute text-[10px] font-bold text-stone-700">
            {Math.round(progress)}%
          </div>
        </div>
        <span className="mt-4 text-[10px] font-semibold text-stone-500 tracking-widest uppercase">
          Loading Model
        </span>
      </div>
    </Html>
  );
}

/**
 * SnapshotHandler Component
 * Sub-component inside the Canvas to hook into the R3F state.
 * Triggers a web download of the canvas when the user clicks "Take Snapshot".
 */
function SnapshotHandler() {
  const { gl, scene, camera } = useThree();
  const snapshotTrigger = useConfiguratorStore((state) => state.snapshotTrigger);

  useEffect(() => {
    if (snapshotTrigger === 0) return;

    // Force a render of the scene right before taking the snapshot
    // to ensure it captures the exact current frame
    gl.render(scene, camera);
    
    // Retrieve the base64-encoded image from the webgl canvas
    const dataUrl = gl.domElement.toDataURL('image/png');
    
    // Trigger download
    const link = document.createElement('a');
    link.download = `custom-product-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [snapshotTrigger, gl, scene, camera]);

  return null;
}

/**
 * CanvasErrorBoundary Component
 * Catches fatal WebGL errors and provides a graceful fallback UI.
 */
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 p-8 text-center">
          <div className="p-6 bg-white rounded-2xl shadow-premium border border-stone-200 max-w-sm">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">3D Viewport Unavailable</h2>
            <p className="text-sm text-stone-500 mb-4">
              Your browser encountered an issue with the 3D renderer. This can happen due to GPU memory limits or CORS restrictions.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#5A2611] text-white rounded-lg text-sm font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * SafeEnvironment Component
 * Attempts to load an environment map but fails silently if CORS/Network errors occur,
 * falling back to a clean background color and standard lights.
 */
function SafeEnvironment({ preset }) {
  const [failed, setFailed] = useState(false);

  // If we already know it failed, don't even try to render the Environment component
  // to avoid library-level uncaught errors
  if (failed) return null;

  return (
    <Environment 
      preset={preset || "city"} 
      onError={() => {
        console.warn("Environment load blocked by CORS or Network. Falling back to studio lights.");
        setFailed(true);
      }}
    />
  );
}

/**
 * Viewer3D Component
 * Sets up the React Three Fiber Canvas with lighting, environment,
 * shadows, bounds centering, camera controls, and the loaded model.
 */
export function Viewer3D() {
  const config = useConfiguratorStore((state) => state.config);
  const setLoadError = useConfiguratorStore((state) => state.setLoadError);

  if (!config) return null;

  const cameraSettings = config.camera || {};
  const defaultPosition = cameraSettings.position || [0, 0, 2.5];
  const minDistance = cameraSettings.minDistance || 1.2;
  const maxDistance = cameraSettings.maxDistance || 5;

  return (
    <CanvasErrorBoundary>
      <div className="w-full h-full relative outline-none bg-gradient-to-b from-[#FAF8F5] to-[#EFEBE4]">
        <Canvas
          shadows
          // preserveDrawingBuffer is required to capture the canvas state for snapshots
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
          camera={{ position: defaultPosition, fov: 45 }}
          className="w-full h-full"
        >
          {/* Base Background Color in case of transparency issues */}
          <color attach="background" args={["#FAF8F5"]} />

          {/* Soft Ambient Light for base illumination */}
          <ambientLight intensity={0.65} />

          {/* Studio spotlight for premium reflections and highlight casting */}
          <spotLight 
            position={[10, 15, 10]} 
            angle={0.25} 
            penumbra={1} 
            intensity={2.0} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />

          {/* Rim lighting to accentuate the edges */}
          <directionalLight 
            position={[-10, 10, -5]} 
            intensity={0.8} 
          />

          {/* Fill lighting from the front-bottom */}
          <directionalLight 
            position={[0, -5, 5]} 
            intensity={0.5} 
          />

          {/* Realistic image-based reflection lighting via Environment */}
          <Suspense fallback={null}>
            <SafeEnvironment preset={config.environment} />
          </Suspense>

          {/* Suspense handles the loading of the GLTF model */}
          <Suspense fallback={<LoaderHtml />}>

            <ModelErrorBoundary 
              onError={() => setLoadError(true)}
              fallback={
                <Bounds fit clip observe margin={1.2}>
                  <Center>
                    <ProceduralModel configurables={config.configurables} />
                  </Center>
                </Bounds>
              }
            >
              {/* Bounds automatically fits the camera to frame the loaded model regardless of its size */}
              <Bounds fit clip observe margin={1.15}>
                <Center>
                  <Model url={config.modelUrl} configurables={config.configurables} />
                </Center>
              </Bounds>
            </ModelErrorBoundary>
          </Suspense>

          {/* Soft, photorealistic floor shadows */}
          <ContactShadows 
            position={[0, -0.65, 0]} 
            opacity={0.45} 
            scale={8} 
            blur={2.5} 
            far={1.2} 
          />

          {/* Orbit Controls with smooth damping. Panning disabled to keep target centered */}
          <OrbitControls 
            enableDamping 
            dampingFactor={0.06}
            enablePan={false}
            minDistance={minDistance}
            maxDistance={maxDistance}
            makeDefault
          />

          {/* Handles snapshot requests from the UI */}
          <SnapshotHandler />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
