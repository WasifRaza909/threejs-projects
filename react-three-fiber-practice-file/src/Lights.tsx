import { useHelper } from '@react-three/drei'
import React, { useRef } from 'react'
import { DirectionalLightHelper,  type PointLight } from 'three'

const Lights = () => {
  const lightRef = useRef<PointLight>(null!)

  // useHelper(lightRef, DirectionalLightHelper, 5)

  return (
    <>
      <ambientLight intensity={1}/>
      <directionalLight ref={lightRef} position={[3,3,3]} intensity={8}/>
        <pointLight  position={[0,1,-1]} intensity={25} color="#1e00ff"  />
    </>
  )
}

export default Lights