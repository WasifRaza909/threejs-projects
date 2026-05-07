import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react'
import { AdditiveBlending } from 'three';
import { BufferAttribute, MathUtils } from 'three';

const Particles = () => {
    const meshRef = useRef(null)
    const count = 100

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return arr;
  }, [count]);

    useFrame(() => {
    meshRef.current.rotation.y += 0.0005;
    meshRef.current.rotation.x += 0.0002;
  });

  return (
    <points ref={meshRef}>
        <bufferGeometry>
             <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        </bufferGeometry>
       <pointsMaterial
        size={0.08}
        color="#00ffff"
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

export default Particles