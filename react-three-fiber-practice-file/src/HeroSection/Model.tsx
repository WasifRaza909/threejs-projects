import { Center, useGLTF } from '@react-three/drei'
import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

const Model = () => {
    const { scene } = useGLTF('/laptop.glb')
    const modelRef = useRef(null)

    
    useFrame((state) => {
      const t = state.clock.elapsedTime;
        if (!modelRef.current) return;
      modelRef.current.position.y = Math.sin(t) * 0.2;
      modelRef.current.rotation.y += 0.001;

      const mouse = state.mouse;

  modelRef.current.rotation.y = mouse.x * 0.5;
  modelRef.current.rotation.x = mouse.y * 0.2;
    });

    return (
        <Center>
        <primitive ref={modelRef} scale={1.1} object={scene} />
        </Center>
    )
}

export default Model