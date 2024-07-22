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
  const [initialMousePositions,setInitialMousePositions] = useState({
    x: 0,
    y:0
  })
  const [cameraSettings, setCameraSettings] = useState({
    position: { x: 1, y: 1, z: 3 },
    rotation: { x: 0, y: 0.502654824574367, z: 0 },
})


  useEffect(() => {
    const gui = new GUI();
    const cameraFolder = gui.addFolder("Camera Position");

      cameraFolder.add(cameraSettings.position, 'x', -50, 50).name("Position X").onChange((value) => {
        setCameraSettings({...cameraSettings, position : {...cameraSettings.position, x: value} })

      });      ;
      cameraFolder.add(cameraSettings.position, 'y', -50, 50).name("Position Y").onChange((value) => {
        setCameraSettings({...cameraSettings, position : {...cameraSettings.position, y: value} })

      });
      cameraFolder.add(cameraSettings.position, 'z', -50, 50).name("Position Z").onChange((value) => {
        setCameraSettings({...cameraSettings, position : {...cameraSettings.position, z: value} })

      });

      const cameraRotationFolder = gui.addFolder("Camera Rotation");
      cameraRotationFolder.add(cameraSettings.rotation, "x", -Math.PI, Math.PI).name("Rotation X").onChange((value) => {
        setCameraSettings({...cameraSettings, rotation : {...cameraSettings.rotation, x: value} })

      });
      cameraRotationFolder.add(cameraSettings.rotation, "y", -Math.PI, Math.PI).name("Rotation Y").onChange((value) => {
        setCameraSettings({...cameraSettings, rotation : {...cameraSettings.rotation, y: value} })

      });
      cameraRotationFolder.add(cameraSettings.rotation, "z", -Math.PI, Math.PI).name("Rotation Z").onChange((value) => {
        setCameraSettings({...cameraSettings, rotation : {...cameraSettings.rotation, z: value} })

      });

    return () => {
      gui.destroy();
    };
  }, []);

  
  return (
    <Canvas
    onMouseMove={(e) => {
      if (mouseDown) {
        const clientXRatio = e.clientX / window.innerWidth;
        const clientYRatio = e.clientY / window.innerHeight;
        const deltaX = (clientXRatio - initialMousePositions.x) / 0.8;
    
        let newYRotation = cameraSettings.rotation.y + deltaX;
        newYRotation = Math.max(0.5, Math.min(1.3, newYRotation));
    
        setCameraSettings({
          ...cameraSettings,
          rotation: {
            ...cameraSettings.rotation,
            y: newYRotation
          }
        });
      }
    }}
      onMouseDown={(e) => {
        const initalMousePositionX = e.clientX/ window.innerWidth
        const initalMousePositionY = e.clientY/ window.innerHeight
        setInitialMousePositions({y: initalMousePositionY, x: initalMousePositionX})
        setMouseDown(true)
        
      }}

      onMouseUp={(e) => {

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
