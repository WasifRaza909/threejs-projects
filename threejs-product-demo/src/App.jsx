import React from 'react';
import { Configurator } from './Configurator';

// Example JSON Configuration Object mapping out a premium shoe model customization
const shoeProductConfig = {
  productName: "Dynamic 3D Customizer",
  price: "$0.00",
  description: "This model is being parsed dynamically. Every detectable mesh part is listed in the configuration panel below for real-time material testing.",
  // Use the user-provided Flamingo URL or any other GLTF/GLB link
  modelUrl: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb",
  isDynamic: true,
  environment: "city",
  camera: {
    position: [1, 1, 2],
    minDistance: 0.5,
    maxDistance: 10
  },
  configurables: [] // This will be populated dynamically
};

export default function App() {
  return (
    <div className="w-screen h-screen">
      <Configurator config={shoeProductConfig} />
    </div>
  );
}
