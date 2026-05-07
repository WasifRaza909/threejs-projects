import { OrbitControls, shaderMaterial, useTexture } from '@react-three/drei'
import { ShaderMaterial } from 'three'
import { extend, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Mesh } from 'three'

const GradientEnvBackground = () => {
  const materialRef = useRef()

  const GradientMaterial = useMemo(() => {
    const mat = shaderMaterial(
      { uTime: 0 },

      `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,

      `
      uniform float uTime;
      varying vec2 vUv;

      void main() {

        vec3 color1 = vec3(0.1, 0.2, 0.8);
        vec3 color2 = vec3(0.9, 0.3, 0.6);

        float wave = sin(vUv.y * 3.0 + uTime * 0.5) * 0.5 + 0.5;

        vec3 color = mix(color1, color2, wave);

        gl_FragColor = vec4(color, 1.0);
      }
      `
    )

    return mat
  }, [])

  extend({ GradientMaterial })

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime()
    }
  })

  return (
    <>
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[50, 50]} />

        {/* 👇 shader material */}
        <gradientMaterial ref={materialRef} />
      </mesh>

      <OrbitControls />
    </>
  )
}

export default GradientEnvBackground