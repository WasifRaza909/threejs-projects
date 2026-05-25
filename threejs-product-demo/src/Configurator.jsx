import React, { useEffect } from 'react';
import { useConfiguratorStore } from './store/useConfiguratorStore';
import { Viewer3D } from './components/Viewer3D';
import { UIOverlay } from './components/UIOverlay';

/**
 * Configurator Component
 * The main drop-in component that initializes the Zustand store
 * with a customizable JSON config and layouts the 3D viewer and overlay panels.
 * 
 * @param {Object} props
 * @param {Object} props.config - The JSON configuration object
 */
export default function Configurator({ config }) {
  const setConfig = useConfiguratorStore((state) => state.setConfig);
  const loadConfig = useConfiguratorStore((state) => state.loadConfig);

  // Initialize the Zustand store config on mount or when config changes
  useEffect(() => {
    if (config) {
      setConfig(config);
    } else {
      // If no config is passed as a prop, load from the public/config.json file
      loadConfig();
    }
  }, [config, setConfig, loadConfig]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAF6F0] flex flex-col md:flex-row">
      {/* 
        3D Viewer Canvas container:
        Fills the available space. On desktop, it sits between or behind UI elements.
        Using a dedicated container that adjusts based on screen size to ensure 
        the model is framed within the 'visible' area.
      */}
      <div className="flex-1 relative z-0 min-h-[45vh] md:min-h-full transition-all duration-500 ease-in-out">
        <Viewer3D />
      </div>

      {/* Configuration overlay UI (Header, Side panel, loading screen) */}
      <UIOverlay />
    </div>
  );
}
export { Configurator };
