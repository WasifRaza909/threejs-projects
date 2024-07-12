"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Room from "@/components/Room";
import GUI from "lil-gui";
import Camera from "@/components/Camera";


const cameraPosition = [1, 1, 3];
const cameraRotation = [0, 0.502654824574367, 0];
export default function Home() {
  const cameraRef = useRef(null)
  const [mouseDown,setMouseDown] = useState(false)

  const [cameraSettings, setCameraSettings] = useState({
    position: { x: 1, y: 1, z: 3 },
    rotation: { x: 0, y: 0.502654824574367, z: 0 },
})


  useEffect(() => {
    const gui = new GUI();
    const cameraFolder = gui.addFolder("Camera Position");

      cameraFolder.add(cameraSettings.position, 'x', -50, 50).name("Position X");      ;
      cameraFolder.add(cameraSettings.position, 'y', -50, 50).name("Position Y");
      cameraFolder.add(cameraSettings.position, 'z', -50, 50).name("Position Z");

      const cameraRotationFolder = gui.addFolder("Camera Rotation");
      cameraRotationFolder.add(cameraSettings.rotation, "x", -Math.PI, Math.PI).name("Rotation X");
      cameraRotationFolder.add(cameraSettings.rotation, "y", -Math.PI, Math.PI).name("Rotation Y");
      cameraRotationFolder.add(cameraSettings.rotation, "z", -Math.PI, Math.PI).name("Rotation Z");

    return () => {
      gui.destroy();
    };
  }, []);

  
  return (
    <Canvas
      onMouseMove={(e) => {
        if (mouseDown) {
          const clientXRatio = e.clientX / window.innerWidth
          const clientYRatio = e.clientY / window.innerHeight
        }
      }}
      onMouseDown={() => {
        setMouseDown(true)
      }}

      onMouseUp={() => {
        setMouseDown(false)
      }}
    >
      <Camera cameraSettings={cameraSettings}/>
      <directionalLight />
      <pointLight />
      <ambientLight />
      <Room />

    </Canvas>
  );
}
