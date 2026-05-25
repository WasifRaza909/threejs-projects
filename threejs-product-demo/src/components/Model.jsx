import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import * as THREE from 'three';

/**
 * Model Component
 * Loads and renders a GLTF/GLB model with robust error handling.
 */
export function Model({ url, configurables }) {
  const setLoading = useConfiguratorStore((state) => state.setLoading);
  const setLoadError = useConfiguratorStore((state) => state.setLoadError);
  const setDynamicConfigurables = useConfiguratorStore((state) => state.setDynamicConfigurables);
  const config = useConfiguratorStore((state) => state.config);
  
  // Use useGLTF to load the model. Suspension and errors are handled by 
  // the parent Suspense and ErrorBoundary components.
  const { scene } = useGLTF(url);

  // Select active options from our Zustand store
  const selectedOptions = useConfiguratorStore((state) => state.selectedOptions);

  // Notify the store that the model has successfully loaded
  useEffect(() => {
    if (scene) {
      setLoading(false);

      // If dynamic config is enabled and we haven't populated configurables yet, extract meshes and update store
      if (config?.isDynamic && (!configurables || configurables.length === 0)) {
        const meshes = [];
        scene.traverse((child) => {
          if (child.isMesh && child.name && !meshes.includes(child.name)) {
            meshes.push(child.name);
          }
        });
        
        // Only update if we found meshes
        if (meshes.length > 0) {
          setDynamicConfigurables(meshes);
        }
      }
    }
  }, [scene, setLoading, config?.isDynamic, setDynamicConfigurables]);

  // Apply customizations to the meshes
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child.isMesh) {
        // Enable premium shadow map behaviors for all meshes
        child.castShadow = true;
        child.receiveShadow = true;

        // Find if this specific mesh is designated as configurable in our configuration JSON
        const configurable = configurables.find(
          (c) => 
            child.name.toLowerCase() === c.meshName.toLowerCase() ||
            child.name.toLowerCase().includes(c.meshName.toLowerCase()) ||
            c.meshName.toLowerCase().includes(child.name.toLowerCase())
        );

        if (configurable) {
          const selectedColor = selectedOptions[configurable.id];
          
          if (selectedColor && child.material) {
            // Clone the material to ensure color changes only affect this specific mesh instance
            child.material = child.material.clone();
            
            // Set the new color using Three's Color class
            child.material.color = new THREE.Color(selectedColor);
            
            // Apply customized realistic physical properties
            // If they are specified in the config, use them; otherwise apply realistic defaults
            child.material.roughness = configurable.roughness !== undefined ? configurable.roughness : 0.3;
            child.material.metalness = configurable.metalness !== undefined ? configurable.metalness : 0.15;
            
            // Ensure material is clean and double-sided for premium look
            child.material.side = THREE.DoubleSide;
            
            // If the color option dictates texture or transparency, we can customize here
            if (configurable.type === 'material') {
              // Custom material properties (e.g. leather, fabric, metal)
              const selectedOptDetails = configurable.options.find(o => o.value === selectedColor);
              if (selectedOptDetails) {
                child.material.roughness = selectedOptDetails.roughness !== undefined ? selectedOptDetails.roughness : child.material.roughness;
                child.material.metalness = selectedOptDetails.metalness !== undefined ? selectedOptDetails.metalness : child.material.metalness;
                child.material.clearcoat = selectedOptDetails.clearcoat !== undefined ? selectedOptDetails.clearcoat : 0.0;
                child.material.clearcoatRoughness = selectedOptDetails.clearcoatRoughness !== undefined ? selectedOptDetails.clearcoatRoughness : 0.0;
              }
            }
          }
        } else {
          // If the mesh is not configurable, still clone its material to prevent reference sharing issues,
          // and apply standard shadows.
          if (child.material) {
            child.material = child.material.clone();
          }
        }
      }
    });
  }, [scene, selectedOptions, configurables]);

  // Render the Three.js scene object using primitive
  return (
    <group dispose={null} name="product-model">
      <primitive object={scene} />
    </group>
  );
}

/**
 * ProceduralModel Component
 * Renders a stylized, premium modern armchair using primitive geometries.
 * Used as a self-contained fallback when the external GLTF model fails to download.
 * Maps configuration IDs directly to furniture parts to demonstrate material swapping.
 */
export function ProceduralModel({ configurables }) {
  const selectedOptions = useConfiguratorStore((state) => state.selectedOptions);
  
  // Helper to resolve colors and physical properties for primitive meshes
  const getMaterialProps = (id, fallbackColor) => {
    const selectedColor = selectedOptions[id] || fallbackColor;
    const configurable = configurables.find(c => c.id === id);
    
    let roughness = 0.45;
    let metalness = 0.1;
    let clearcoat = 0.0;
    let clearcoatRoughness = 0.0;
    
    if (configurable) {
      // Find matching option details to apply metallic/roughness values
      const optionDetails = configurable.options.find(o => o.value === selectedColor);
      if (optionDetails) {
        if (optionDetails.roughness !== undefined) roughness = optionDetails.roughness;
        if (optionDetails.metalness !== undefined) metalness = optionDetails.metalness;
        if (optionDetails.clearcoat !== undefined) clearcoat = optionDetails.clearcoat;
        if (optionDetails.clearcoatRoughness !== undefined) clearcoatRoughness = optionDetails.clearcoatRoughness;
      }
    }
    
    return {
      color: new THREE.Color(selectedColor),
      roughness,
      metalness,
      clearcoat,
      clearcoatRoughness,
    };
  };

  // Resolve materials from current Zustand selection
  const meshMaterial = getMaterialProps('mesh', '#EAE6DF'); // Seat cushion
  const soleMaterial = getMaterialProps('sole', '#FDFBF7'); // Wooden/metal base legs
  const lacesMaterial = getMaterialProps('laces', '#FDFBF7'); // Accent piping
  const innerMaterial = getMaterialProps('inner', '#FDFBF7'); // Inner back support
  const bandMaterial = getMaterialProps('band', '#5A2611'); // Structure frame
  const capsMaterial = getMaterialProps('caps', '#1A1A1A'); // Metallic tips

  return (
    <group position={[0, 0, 0]} name="product-model">
      {/* 1. SEAT CUSHION (Main upper mapping) */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.16, 1.1]} />
        <meshStandardMaterial 
          {...meshMaterial} 
          roughness={meshMaterial.roughness} 
        />
      </mesh>

      {/* 2. INNER BACKREST CUSHION (Inner lining mapping) */}
      <mesh position={[0, 0.45, -0.45]} rotation={[0.12, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.72, 0.16]} />
        <meshStandardMaterial {...innerMaterial} />
      </mesh>

      {/* 3. STRUCTURAL SUPPORT ARMREST & SHELL (Heel band mapping) */}
      <group position={[0, 0.2, -0.52]} rotation={[0.12, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.14, 0.6, 0.04]} />
          <meshStandardMaterial {...bandMaterial} />
        </mesh>
      </group>

      {/* 4. SEAT PIPING / ACCENT TRIM (Laces mapping) */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.02, 1.12]} />
        <meshStandardMaterial {...lacesMaterial} />
      </mesh>

      {/* 5. LEGS / BASE (Sole mapping) */}
      {/* Front Left Leg */}
      <group position={[-0.45, -0.45, 0.45]} rotation={[0.08, 0, -0.08]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.015, 0.65]} />
          <meshStandardMaterial {...soleMaterial} />
        </mesh>
        {/* Foot Cap (Metallic caps mapping) */}
        <mesh position={[0, -0.325, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.04]} />
          <meshStandardMaterial {...capsMaterial} />
        </mesh>
      </group>

      {/* Front Right Leg */}
      <group position={[0.45, -0.45, 0.45]} rotation={[0.08, 0, 0.08]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.015, 0.65]} />
          <meshStandardMaterial {...soleMaterial} />
        </mesh>
        <mesh position={[0, -0.325, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.04]} />
          <meshStandardMaterial {...capsMaterial} />
        </mesh>
      </group>

      {/* Back Left Leg */}
      <group position={[-0.45, -0.45, -0.45]} rotation={[-0.1, 0, -0.08]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.015, 0.65]} />
          <meshStandardMaterial {...soleMaterial} />
        </mesh>
        <mesh position={[0, -0.325, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.04]} />
          <meshStandardMaterial {...capsMaterial} />
        </mesh>
      </group>

      {/* Back Right Leg */}
      <group position={[0.45, -0.45, -0.45]} rotation={[-0.1, 0, 0.08]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.015, 0.65]} />
          <meshStandardMaterial {...soleMaterial} />
        </mesh>
        <mesh position={[0, -0.325, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.04]} />
          <meshStandardMaterial {...capsMaterial} />
        </mesh>
      </group>

      {/* Luxury center button on backrest (Caps mapping) */}
      <mesh position={[0, 0.45, -0.36]} rotation={[1.57, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.03]} />
        <meshStandardMaterial {...capsMaterial} />
      </mesh>
    </group>
  );
}


// Preload standard models to speed up initial transition times
// E.g. useGLTF.preload(defaultUrl)
