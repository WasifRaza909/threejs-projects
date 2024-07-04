import { Suspense, useState,useEffect,useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Loader  from '../components/Loader'
import Island from '../models/Island'
import Sky from '../models/Sky'
import Bird from '../models/Bird'
import Plane from '../models/Plane'
import { OrbitControls } from '@react-three/drei'
import HomeInfo from '../components/HomeInfo'
import sakura from '../assets/sakura.mp3'
import { soundoff, soundon } from '../assets/icons'

const Home = () => {
  const audioRef = useRef(new Audio(sakura))
  audioRef.current.volume = 0.4;
  audioRef.current.loop = true
  const [isRotating, setIsRotating] =  useState(false)
  const [currentStage, setCurrentStage] = useState(1);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);


  useEffect(() => {
    if(isPlayingMusic) {
      audioRef.current.play()
    }

    return () => {
      audioRef.current.pause()
    }
  },[isPlayingMusic])

  const adjustIslandForScreenSize = () => {
    let screenScale = null; let islandPosition = [0, -6.5, -43];

    let islandRotation = [0.1, 4.7, 0]
    if (window.innerWidth < 768) {
      islandScale = [0.9, 0.9, 0.9]
      islandPosition = [0, -6.5, -43]
    } else {
      screenScale = [1, 1, 1]
    }



    return [
      screenScale, islandPosition, islandRotation
    ]
  }
  const adjustPlaneForScreenSize = () => {
    let screenScale; 
    let screenPosition;

    if (window.innerWidth < 768) {
      screenScale = [1.5,1.5,1.5]
      screenPosition = [0, -1.5, -0]
    } else {
      screenScale = [3,3,3]
      screenPosition = [0, -4, -4]

    }



    return [
      screenScale, screenPosition
    ]
  }




  const [islandScale, islandPosition, islandRotation] = adjustIslandForScreenSize();
  const [planeScale, planePosition] = adjustPlaneForScreenSize();

  return (
    <section className='w-full h-screen relative'>
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center">
        {
          currentStage && <HomeInfo currentStage={currentStage}/>
        }
      </div>
      <Canvas className={`w-full h-screen bg-transparent ${isRotating ? 'cursor-grabbing' : 'cursor-grab'}`} camera={{ near: 0.1, far: 1000 }}>
        
        <Suspense fallback={<Loader />}>
          <directionalLight position={[1, 1, 1]} intensity={2} /> // directionalLight is like sun change
          <ambientLight intensity={0.5} /> // ambientLight change the light of all object same
          {/* <pointLight /> // pointLight Emits light in all directions from a single point...in our case we doesn't need it */}
          {/* <spotLight /> // The spotlight is similar to point light it also emits light from one direction but it's in cone shape so we have to add an angle...in our case we doesn't need it */}
          <hemisphereLight skyColor="#b1e1ff" groundColor="#000000" intensity={1} /> // It illuminates the scene with a gradient

          <Bird />
          <Sky isRotating={isRotating}/>
          <Island  setCurrentStage={setCurrentStage} isRotating={isRotating} setIsRotating={setIsRotating} position={islandPosition} scale={islandScale} rotation={islandRotation} />
          <Plane position={planePosition} scale={planeScale} isRotating={isRotating} rotation={[0,20,0]}/>

        </Suspense>
      </Canvas>

      <div className='absolute bottom-2 left-2'>
        <img src={isPlayingMusic ? soundon : soundoff} alt="sound" className='w-10 h-10 cursor-pointer object-contain' onClick={() => setIsPlayingMusic(!isPlayingMusic)} />
      </div>
    </section>
  )
}

export default Home