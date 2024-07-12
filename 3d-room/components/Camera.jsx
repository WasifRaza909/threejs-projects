"use client"

import { useFrame, useThree } from '@react-three/fiber';

const Camera = ({ cameraSettings }) => {
const { camera } = useThree()

    useFrame(() => {
            camera.position.set(cameraSettings.position.x, cameraSettings.position.y, cameraSettings.position.z);
            camera.rotation.set(cameraSettings.rotation.x, cameraSettings.rotation.y, cameraSettings.rotation.z);
    }, []);

    return null

};

export default Camera;