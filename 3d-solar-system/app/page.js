"use client"

import Image from "next/image";
import styles from "./page.module.css";
import { BackgroundModel } from "@/models/BackgroundModel";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SunModel } from "@/models/SunModel";

export default function Home() {
  return (
    <main>
      <Canvas>
          <BackgroundModel/>
          <ambientLight/>
          <directionalLight/>
          <pointLight position={[10, 10, 10]}/>
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow/>
          <SunModel/>
          <OrbitControls/>
      </Canvas>
    </main>
  );
}
