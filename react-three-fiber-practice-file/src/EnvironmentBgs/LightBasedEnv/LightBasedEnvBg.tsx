import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { PointLight } from 'three'
import { DirectionalLight } from 'three'

const SCALE_X = 15
const SCALE_Y = 10

const LightBasedEnvBg = () => {
  const directionalLightRef = useRef<DirectionalLight>(null!)
  const pointLightRef = useRef<PointLight>(null!)
  const pointLightRef2 = useRef<PointLight>(null!)

  useFrame(({ mouse }) => {
    const targetX = mouse.x * SCALE_X
    const targetY = mouse.y * SCALE_Y

    // alpha = 1 → instant snap; lower = smoother trail (0.15 ≈ 9 frames lag at 60fps)
    const alpha = 0.15

    if (pointLightRef2.current) {
      const p = pointLightRef2.current.position
      p.x += (targetX - p.x) * alpha
      p.y += (targetY - p.y) * alpha
    }

    if (pointLightRef.current) {
      const p = pointLightRef.current.position
      p.x += (-targetX - p.x) * alpha
      p.y += (targetY - p.y) * alpha
    }
  })

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#004e58" />
      </mesh>

      <ambientLight intensity={0.2} />

      {/* Directional Light */}
      <directionalLight
        ref={directionalLightRef}
        position={[5, 5, 5]}
        intensity={0.5}
        castShadow={false}
      />

      {/* Point Lights */}
      <pointLight ref={pointLightRef} position={[0, 0, -3]} intensity={100} color="#00bfd8" decay={3} />
      <pointLight ref={pointLightRef2} position={[0, 0, -3]} intensity={100} color="#6beeff" decay={3} />

      <OrbitControls />
    </group>
  )
}

export default LightBasedEnvBg
