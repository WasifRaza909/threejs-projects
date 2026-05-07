const FogDepthEnv = () => {
  return (
    <>
      <color attach="background" args={['#0f172a']} />
      <fog attach="fog" args={['#0f172a', 4, 18]} />

      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <mesh position={[0, 0, -2]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>

      <mesh position={[0, 0, -8]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      <mesh position={[0, 0, -14]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
      <OrbitControls />
    </>
  )
}

export default FogDepthEnv
