import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

const RotatingCube = () => {
  const meshRef = useRef<Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={[0,0.3,0]} castShadow receiveShadow>
        <boxGeometry args={[1.5,1.5,1.5]}/>
        <meshStandardMaterial color={'blue'}/>
      </mesh>
  )
}

export default RotatingCube