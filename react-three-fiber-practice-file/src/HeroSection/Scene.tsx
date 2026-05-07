import { OrbitControls  } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Lights from '../Lights'
import Model from './Model'

const Scene = () => {



   return <div className='scene'>

    <Canvas>
        <Lights />
        <Model />
        {/* <Particles /> */}
        {/* <ScrollControls pages={4} damping={0.1}> */}
        {/* <ImageCards /> */}
        {/* </ScrollControls> */}
        {/* <RotatingCube /> */}
        {/* Ground plane to receive shadow */}
        {/* <mesh receiveShadow rotation={[-Math.PI / 2,0 ,0]} position={[0, -1, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#e71313" />
        </mesh> */}
        {/* <RotatingSphere /> */}
        {/* <RotatingPlane /> */}
        {/* <OrbitControls  /> */}
      </Canvas>
      </div>
}

export default Scene