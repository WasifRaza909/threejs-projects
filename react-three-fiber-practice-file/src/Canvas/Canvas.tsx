import React from 'react'
import { Canvas as FiberCanvas } from '@react-three/fiber'
import { Fog } from 'three'

const Canvas = ({ children, ...props }: React.ComponentProps<typeof FiberCanvas>) => {
  
  return (
    <FiberCanvas onCreated={({scene}) => {
        scene.fog = new Fog('#0f1721', 5, 20)
    }} {...props} >
      {children}
    </FiberCanvas>
  )
}

export default Canvas