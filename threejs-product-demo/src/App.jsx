import React from 'react';
import { Configurator } from './Configurator';

export default function App() {
  return (
    <div className="w-screen h-screen">
      {/* Configuration is loaded automatically from /public/config.json */}
      <Configurator />
    </div>
  );
}
