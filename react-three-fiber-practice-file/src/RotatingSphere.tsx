const RotatingSphere = () => {
  return (
    <mesh position={[0,-2, 0]}>
        <sphereGeometry args={[1, 80, 80]}/>
        <meshStandardMaterial color="blue"/>
    </mesh>
  )
}

export default RotatingSphere