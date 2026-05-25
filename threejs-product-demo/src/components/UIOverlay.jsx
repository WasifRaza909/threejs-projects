import React, { useState } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { Camera, RotateCcw, Sparkles, ChevronDown, Check } from 'lucide-react';

/**
 * UIOverlay Component
 * A luxury, minimalist configuration panel that floats over the 3D canvas.
 * Adapts responsively from a desktop floating sidebar to a mobile bottom sheet.
 */
export function UIOverlay() {
  const config = useConfiguratorStore((state) => state.config);
  const selectedOptions = useConfiguratorStore((state) => state.selectedOptions);
  const setOption = useConfiguratorStore((state) => state.setOption);
  const triggerSnapshot = useConfiguratorStore((state) => state.triggerSnapshot);
  const resetOptions = useConfiguratorStore((state) => state.resetOptions);
  const isLoading = useConfiguratorStore((state) => state.isLoading);
  const loadingProgress = useConfiguratorStore((state) => state.loadingProgress);
  const hasLoadError = useConfiguratorStore((state) => state.hasLoadError);

  // Keep track of active tab/section for mobile layout
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  if (!config) return null;

  const configurables = config.configurables || [];

  // Resolve dynamic values depending on model loading status (standard shoe vs fallback armchair)
  const productName = hasLoadError ? "The Bauhaus Armchair" : (config.productName || "Customizer MVP");
  const price = hasLoadError ? "$395.00" : (config.price || "$249.00");
  const description = hasLoadError 
    ? "An offline sandbox demo showcasing a modular Bauhaus lounge chair. Color and material customization are fully active." 
    : (config.description || "Handcrafted premium essentials tailored precisely to your style. Designed with high-performance materials and refined aesthetics.");

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col md:flex-row justify-between p-4 md:p-6 lg:p-8 select-none z-10 font-sans overflow-hidden">
      
      {/* Brand Header & Description (Top Left) */}
      <div className="pointer-events-auto flex flex-col items-start bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-premium border border-stone-200/50 w-full md:w-[320px] lg:w-[380px] mb-4 md:mb-0 self-start transition-all duration-300 hover:shadow-premium-hover shrink-0">
        <div className="flex items-center gap-2 mb-1.5 md:mb-2">
          <span className="text-[9px] md:text-[10px] tracking-[0.2em] font-bold text-stone-500 uppercase">
            {hasLoadError ? "SANDBOX MODE" : "STUDIO LINE"}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${hasLoadError ? 'bg-amber-600 animate-pulse' : 'bg-[#5A2611]'}`}></span>
        </div>
        <h1 className="text-lg md:text-2xl lg:text-3xl font-light text-stone-900 tracking-tight mb-0.5 md:mb-1">
          {productName}
        </h1>
        <p className="text-xs md:text-sm font-semibold text-[#5A2611] mb-1.5 md:mb-3">
          {price}
        </p>
        <p className="hidden md:block text-xs text-stone-500 leading-relaxed font-light">
          {description}
        </p>
        {hasLoadError && (
          <p className="text-[10px] text-amber-700 mt-2 font-medium">
            Note: Remote assets failed to load (CORS/Network). Running in local fallback mode.
          </p>
        )}
      </div>

      {/* Floating Configuration Panel (Desktop Right Sidebar / Mobile Bottom Sheet) */}
      <div className={`pointer-events-auto flex flex-col bg-white w-full md:w-[320px] lg:w-[360px] xl:w-[400px] transition-all duration-500 ease-in-out ${isPanelOpen ? 'translate-y-0 opacity-100' : 'translate-y-[calc(100%-52px)] md:translate-y-0 md:opacity-100'} max-h-[50vh] md:max-h-[85vh] mt-auto md:mt-0 rounded-t-3xl md:rounded-3xl shadow-premium border border-stone-200/40 overflow-hidden shrink-0`}>
        
        {/* Panel Header / Mobile Toggle */}
        <div 
          className="px-6 py-4 md:py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 cursor-pointer md:cursor-default"
          onClick={() => window.innerWidth < 768 && setIsPanelOpen(!isPanelOpen)}
        >
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-stone-900 uppercase">
              Configure
            </h2>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Select parts and materials
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetOptions();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 text-xs font-medium transition-all duration-200"
              title="Reset options to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset</span>
            </button>
            <div className="md:hidden">
              <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isPanelOpen ? '' : 'rotate-180'}`} />
            </div>
          </div>
        </div>

        {/* Configuration Options (Scrollable area) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin scrollbar-thumb-stone-200">
          {configurables.length === 0 && !isLoading && (
            <div className="text-center py-10">
              <Sparkles className="w-8 h-8 text-stone-200 mx-auto mb-3" />
              <p className="text-xs text-stone-400">Scanning model for configurable parts...</p>
            </div>
          )}

          {configurables.map((configurable) => {
            const selectedVal = selectedOptions[configurable.id];
            const currentOptionObj = configurable.options?.find(
              (o) => o.value === selectedVal
            );

            return (
              <div key={configurable.id} className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-semibold text-stone-800 tracking-wide">
                    {configurable.label}
                  </label>
                  <span className="text-[10.5px] font-medium text-stone-400">
                    {currentOptionObj ? currentOptionObj.name : "None"}
                  </span>
                </div>

                {/* Swatches Container */}
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {configurable.options?.map((option) => {
                    const isSelected = selectedVal === option.value;
                    const isColorType = configurable.type !== 'material' || option.value?.startsWith('#');

                    return (
                      <button
                        key={option.value}
                        onClick={() => setOption(configurable.id, option.value)}
                        className={`group relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                          isSelected
                            ? 'border-[#5A2611] scale-110 shadow-md ring-2 ring-[#5A2611]/10'
                            : 'border-stone-200 hover:border-stone-400 hover:scale-105'
                        }`}
                        title={option.name}
                      >
                        {/* Swatch visual circle */}
                        <span
                          className="w-6 h-6 rounded-full border border-stone-100/30 flex items-center justify-center transition-transform duration-200 group-hover:scale-95"
                          style={{
                            backgroundColor: isColorType ? option.value : '#cccccc',
                            backgroundImage: option.thumbnailUrl ? `url(${option.thumbnailUrl})` : 'none',
                            backgroundSize: 'cover',
                          }}
                        >
                          {isSelected && (
                            <Check 
                              className={`w-3.5 h-3.5 ${
                                // Contrast check for checkmark icon color
                                option.value === '#FDFBF7' || option.value === '#FAF6F0' || option.value === '#ffffff'
                                  ? 'text-stone-900'
                                  : 'text-white'
                              }`} 
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 border-t border-stone-100 bg-stone-50/20">
          <button
            onClick={triggerSnapshot}
            className="flex items-center justify-center gap-2 w-full py-3.5 md:py-4.5 bg-[#5A2611] hover:bg-[#411C0C] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-premium active:scale-98 pointer-events-auto h-11 md:h-12"
          >
            <Camera className="w-4 h-4" />
            <span>Take Snapshot</span>
          </button>
          
          <div className="mt-3 text-center">
            <span className="text-[9px] font-medium text-stone-400 tracking-wider uppercase">
              Designed & Built with Studio Configurator
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
