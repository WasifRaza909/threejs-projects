import React, { useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import * as THREE from 'three';

const GENERIC_NAMES = new Set(['mesh', 'object', 'node', 'primitive', 'scene']);

const getMaterialList = (material) => {
  if (!material) return [];
  return Array.isArray(material) ? material.filter(Boolean) : [material];
};

const isPaintableMesh = (node) => {
  return (node.isMesh || node.isSkinnedMesh || node.type === 'Mesh' || node.type === 'SkinnedMesh') && getMaterialList(node.material).length > 0;
};

const normalizeName = (name) => (name || '').trim();

const getNodePath = (node, scene) => {
  const parts = [];
  let current = node;

  while (current && current !== scene) {
    const name = normalizeName(current.name);
    if (name) parts.unshift(name);
    current = current.parent;
  }

  return parts.join('/');
};

const makePartLabel = (rawName, index) => {
  let cleanLabel = rawName
    .replace(/(_\d+|\.\d+|-\d+)$/, '')
    .replace(/^(mesh|node|primitive|obj|group|part|scene)[_-]/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_./-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanLabel || cleanLabel.length < 2 || GENERIC_NAMES.has(cleanLabel.toLowerCase())) {
    cleanLabel = `Component ${index + 1}`;
  }

  return cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
};

const cloneMaterialsOnce = (node) => {
  if (node.userData.configuratorMaterialsCloned) return;

  if (Array.isArray(node.material)) {
    node.material = node.material.map((material) => material?.clone?.() || material);
  } else if (node.material?.clone) {
    node.material = node.material.clone();
  }

  node.userData.configuratorMaterialsCloned = true;
};

const applyColorToMaterial = (material, color, configurable, selectedOption) => {
  if (!material) return;

  if (material.color) {
    material.color.set(color);
  }

  material.roughness = selectedOption?.roughness ?? configurable.roughness ?? material.roughness ?? 0.3;
  material.metalness = selectedOption?.metalness ?? configurable.metalness ?? material.metalness ?? 0.15;

  if ('clearcoat' in material) {
    material.clearcoat = selectedOption?.clearcoat ?? configurable.clearcoat ?? material.clearcoat ?? 0;
  }

  if ('clearcoatRoughness' in material) {
    material.clearcoatRoughness = selectedOption?.clearcoatRoughness ?? configurable.clearcoatRoughness ?? material.clearcoatRoughness ?? 0;
  }

  material.side = THREE.DoubleSide;
  material.needsUpdate = true;
};

const getObjectCenter = (object) => {
  if (!object) return null;

  object.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;

  const center = new THREE.Vector3();
  box.getCenter(center);
  return [center.x, center.y, center.z];
};

/**
 * Model Component
 * Loads and renders a GLTF/GLB model with robust error handling.
 */
export function Model({ url, configurables }) {
  const setLoading = useConfiguratorStore((state) => state.setLoading);
  const setLoadError = useConfiguratorStore((state) => state.setLoadError);
  const setLoadingProgress = useConfiguratorStore((state) => state.setLoadingProgress);
  const setDynamicConfigurables = useConfiguratorStore((state) => state.setDynamicConfigurables);
  const setModelCenter = useConfiguratorStore((state) => state.setModelCenter);
  const config = useConfiguratorStore((state) => state.config);
  const size = useThree((state) => state.size);
  const initializedRef = React.useRef(false);
  const groupRef = React.useRef(null);
  
  // Use useGLTF to load the model. Suspension and errors are handled by 
  // the parent Suspense and ErrorBoundary components.
  const { scene } = useGLTF(url);

  // Reset initialization ref if the URL changes
  useEffect(() => {
    initializedRef.current = false;
  }, [url]);

  // Select active options from our Zustand store
  const selectedOptions = useConfiguratorStore((state) => state.selectedOptions);

  // Notify the store that the model has successfully loaded
  useEffect(() => {
    if (scene) {
      console.log("Model: Scene loaded, initializing discovery...", { name: scene.name });
      setLoadingProgress(96);

      const shouldDiscoverParts = config?.isDynamic || !configurables || configurables.length === 0;

      // Dynamic discovery logic
      if (shouldDiscoverParts && !initializedRef.current) {
        const discoveredParts = [];
        const usedIds = new Set();

        // Force an update of the scene's world matrices to ensure all data is ready
        scene.updateMatrixWorld(true);

        scene.traverse((node) => {
          if (!isPaintableMesh(node)) return;

          const index = discoveredParts.length;
          const materials = getMaterialList(node.material);
          const nodePath = getNodePath(node, scene);
          const meshName = normalizeName(node.name);
          const parentName = normalizeName(node.parent?.name);
          const materialName = normalizeName(materials[0]?.name);
          const rawName = meshName || materialName || parentName || `Component ${index + 1}`;
          let partId = nodePath || rawName || `part-${index + 1}`;

          if (GENERIC_NAMES.has(partId.toLowerCase())) {
            partId = `${partId}-${index + 1}`;
          }

          let uniqueId = partId;
          let suffix = 2;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${partId}-${suffix}`;
            suffix += 1;
          }

          usedIds.add(uniqueId);
          node.userData.configuratorPartId = uniqueId;
          node.userData.configuratorPartName = rawName;
          cloneMaterialsOnce(node);

          const firstColor = getMaterialList(node.material).find((material) => material?.color)?.color;
          const defaultColor = firstColor ? `#${firstColor.getHexString().toUpperCase()}` : '#EAE6DF';

          console.log(`Model: Discovered part ${index + 1}: "${uniqueId}" (Type: ${node.type})`);
          discoveredParts.push({
            id: uniqueId,
            meshName: meshName || uniqueId,
            label: makePartLabel(rawName, index),
            default: defaultColor,
            materialName,
            nodePath,
          });
        });

        console.log(`Model: Discovery complete. Found ${discoveredParts.length} parts.`);

        if (discoveredParts.length > 0) {
          initializedRef.current = true;
          setDynamicConfigurables(discoveredParts);
        } else {
          console.warn("Model: No customizeable parts found in the scene.");
          setLoadingProgress(100);
          setLoading(false);
        }
      } else if (!shouldDiscoverParts) {
        setLoadingProgress(100);
        setLoading(false);
      }
    }
  }, [scene, setLoading, setLoadingProgress, config?.isDynamic, configurables, setDynamicConfigurables]);

  useLayoutEffect(() => {
    let secondFrameId;
    const frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        const center = getObjectCenter(groupRef.current || scene);
        if (center) {
          setModelCenter(center);
        }
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(secondFrameId);
    };
  }, [scene, setModelCenter, size.width, size.height]);

  useEffect(() => {
    const handleResize = () => {
      const center = getObjectCenter(groupRef.current || scene);
      if (center) {
        setModelCenter(center);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scene, setModelCenter]);

  // Apply customizations to the meshes
  useEffect(() => {
    if (!scene || !configurables || configurables.length === 0) return;
    
    console.log("Applying customizations to meshes...", selectedOptions);
    
    scene.traverse((child) => {
      if (isPaintableMesh(child)) {
        // Enable premium shadow map behaviors for all meshes
        child.castShadow = true;
        child.receiveShadow = true;
        cloneMaterialsOnce(child);

        // Find if this specific mesh is designated as configurable
        const configurable = configurables.find(
          (c) => 
            child.userData.configuratorPartId === c.id ||
            child.userData.configuratorPartId === c.targetId ||
            child.name === c.id || 
            child.name === c.meshName ||
            (child.name && c.meshName && child.name.toLowerCase() === c.meshName.toLowerCase())
        );

        if (configurable) {
          const selectedColor = selectedOptions[configurable.id];
          
          if (selectedColor && child.material) {
            const selectedOptDetails = configurable.options?.find(o => o.value === selectedColor);
            getMaterialList(child.material).forEach((material) => {
              applyColorToMaterial(material, selectedColor, configurable, selectedOptDetails);
            });
          }
        }
      }
    });
  }, [scene, selectedOptions, configurables]);

  // Render the Three.js scene object using primitive
  return (
    <group ref={groupRef} dispose={null} name="product-model">
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
  const setModelCenter = useConfiguratorStore((state) => state.setModelCenter);
  const setLoadingProgress = useConfiguratorStore((state) => state.setLoadingProgress);
  const ensureFallbackConfig = useConfiguratorStore((state) => state.ensureFallbackConfig);
  const size = useThree((state) => state.size);
  const groupRef = React.useRef(null);

  useEffect(() => {
    setLoadingProgress(100);

    if (!configurables || configurables.length === 0) {
      ensureFallbackConfig();
    }
  }, [configurables, ensureFallbackConfig, setLoadingProgress]);

  useLayoutEffect(() => {
    let secondFrameId;
    const frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        const center = getObjectCenter(groupRef.current);
        if (center) {
          setModelCenter(center);
        }
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(secondFrameId);
    };
  }, [setModelCenter, size.width, size.height]);

  useEffect(() => {
    const handleResize = () => {
      const center = getObjectCenter(groupRef.current);
      if (center) {
        setModelCenter(center);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setModelCenter]);
  
  // Helper to resolve colors and physical properties for primitive meshes
  const getMaterialProps = (id, fallbackColor) => {
    const selectedColor = selectedOptions[id] || fallbackColor;
    const configurable = configurables?.find(c => c.id === id);
    
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
    <group ref={groupRef} position={[0, 0, 0]} name="product-model">
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
