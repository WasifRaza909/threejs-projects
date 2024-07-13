"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";

const Camera = ({ cameraSettings }) => {
  const { camera } = useThree();

  useEffect(() => {
    gsap.to(camera.position, {
      x: cameraSettings.position.x,
      y: cameraSettings.position.y,
      z: cameraSettings.position.z,
      duration: 1, // Adjust the duration as needed
    });

    gsap.to(camera.rotation, {
      x: cameraSettings.rotation.x,
      y: cameraSettings.rotation.y,
      z: cameraSettings.rotation.z,
      duration: 1, // Adjust the duration as needed
    });
  }, [cameraSettings]);

  useFrame(() => {
    camera.updateProjectionMatrix();
  });

  return null;
};

export default Camera;