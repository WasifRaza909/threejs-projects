import React from 'react'

const ImageCard = () => {
  return (
    <mesh position={[-2.5,2.5,0]}>
        <boxGeometry args={[1.5,1.5,0.1]}/>
        <meshStandardMaterial color={'blue'} side={2}/>
    </mesh>
  )
}

export default ImageCard