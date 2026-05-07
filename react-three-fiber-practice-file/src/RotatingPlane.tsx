import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'

const RotatingPlane = () => {
    const meshRef = useRef<Mesh>(null)


useFrame(() => {
        if (meshRef.current) {
          meshRef.current.rotation.y += 0.01
          meshRef.current.rotation.x += 0.01
        }
})

  return (
    <mesh ref={meshRef} position={[0,2.5,0]}  rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[1,1, 0.25]}/>
        <meshStandardMaterial color="blue" side={2}/>
    </mesh>
  )
}

export default RotatingPlane