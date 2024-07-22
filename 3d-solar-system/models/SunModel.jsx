import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function SunModel(props) {
  const { nodes, materials } = useGLTF('/sun.glb')
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials['Scene_-_Root']}
        scale={2.633}
      />
    </group>
  )
}
