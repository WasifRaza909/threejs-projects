import './App.css'
import RotatingCube from './RotatingCube'
import RotatingSphere from './RotatingSphere.tsx'
import RotatingPlane from './RotatingPlane.tsx'
import { OrbitControls, ScrollControls } from '@react-three/drei'
import Lights from './Lights.tsx'
import ImageCard from './3dImageGallery/ImageCard.tsx'
import ImageCards from './3dImageGallery/ImageCards.tsx'
import Particles from './Particles/Particles.tsx'
import HeroSection from './HeroSection/Scene.tsx'
import HeroContent from './HeroSection/HeroContent.tsx'
import Scene from './HeroSection/Scene.tsx'
import GradientEnvBackground from './EnvironmentBgs/GradientEnvBackground.tsx'
import LightBasedEnvBg from './EnvironmentBgs/LightBasedEnv/LightBasedEnvBg.tsx'
import FogDepthEnv from './EnvironmentBgs/FogDepthEnv/FogDepthEnv.tsx'
import Canvas from './Canvas/Canvas.tsx'

function App() {
  return (
    <div id="canvas">
      <Canvas>
        {/* <GradientEnvBackground /> */}
        {/* <LightBasedEnvBg /> */}
        <FogDepthEnv />
      </Canvas>
    </div>
  )
}

export default App
