"use client"

import React from 'react'
import { useGLTF } from '@react-three/drei'

export function BackgroundModel(props) {
    const { nodes, materials } = useGLTF('/starry_night_sky_hdri_background_photosphere.glb')
    return (
      <group {...props} dispose={null}>
        <group rotation={[-Math.PI / 2, 0, 0]} scale={177.063}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_4.geometry}
            material={materials.material}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </group>
      </group>
    )
}

