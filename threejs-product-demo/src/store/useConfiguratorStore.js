import { create } from 'zustand';

const fallbackConfigurables = [
  {
    id: "mesh",
    label: "Seat Cushion",
    meshName: "mesh",
    type: "color",
    options: [
      { name: "Oatmeal", value: "#EAE6DF" },
      { name: "Charcoal", value: "#2C2C2C" },
      { name: "Viking Blue", value: "#344E5B" },
      { name: "Studio Brown", value: "#5A2611" }
    ]
  },
  {
    id: "sole",
    label: "Wooden Legs",
    meshName: "sole",
    type: "color",
    options: [
      { name: "Natural Gum", value: "#9E7B56" },
      { name: "Stark White", value: "#FFFFFF" },
      { name: "Stealth Black", value: "#1A1A1A" }
    ]
  },
  {
    id: "laces",
    label: "Accent Piping",
    meshName: "laces",
    type: "color",
    options: [
      { name: "Oatmeal", value: "#EAE6DF" },
      { name: "Stark White", value: "#FFFFFF" },
      { name: "Gold Leaf", value: "#D4AF37" }
    ]
  },
  {
    id: "inner",
    label: "Back Support",
    meshName: "inner",
    type: "color",
    options: [
      { name: "Oatmeal", value: "#EAE6DF" },
      { name: "Stark White", value: "#FFFFFF" },
      { name: "Charcoal", value: "#2C2C2C" }
    ]
  },
  {
    id: "band",
    label: "Frame Structure",
    meshName: "band",
    type: "color",
    options: [
      { name: "Studio Brown", value: "#5A2611" },
      { name: "Natural Gum", value: "#9E7B56" },
      { name: "Stealth Black", value: "#1A1A1A" }
    ]
  },
  {
    id: "caps",
    label: "Metallic Caps",
    meshName: "caps",
    type: "color",
    options: [
      { name: "Stealth Black", value: "#1A1A1A" },
      { name: "Polished Silver", value: "#E0E0E0" },
      { name: "Gold Leaf", value: "#D4AF37" }
    ]
  }
];

const getDefaultOptions = (configurables = []) => {
  const defaultOptions = {};

  configurables.forEach(c => {
    const defaultOption = c.default !== undefined
      ? c.options.find(o => o.value === c.default || o.name === c.default)
      : c.options[0];

    defaultOptions[c.id] = defaultOption ? defaultOption.value : null;
  });

  return defaultOptions;
};

const createFallbackConfig = (baseConfig = {}) => ({
  ...baseConfig,
  productName: "The Bauhaus Armchair",
  price: "$395.00",
  description: "A luxury modular lounge chair. High-performance materials and refined aesthetics.",
  environment: baseConfig.environment || "city",
  isDynamic: false,
  configurables: fallbackConfigurables
});

/**
 * useConfiguratorStore
 * Central state management for the 3D configurator.
 * Handles loading configuration, dynamic part discovery, and selection state.
 */
export const useConfiguratorStore = create((set, get) => ({
  // The current active configuration JSON
  config: null,
  
  // Mapping of configurable.id -> selected value (e.g. color hex code)
  selectedOptions: {},
  
  // Event state to trigger canvas snapshot downloads
  snapshotTrigger: 0,
  
  // State for loading progress (0 to 100) or status
  isLoading: true,
  loadingProgress: 0,
  hasLoadError: false,
  modelCenter: [0, 0, 0],
  
  // Set configuration and initialize default options
  setConfig: (config) => {
    if (!config) return;
    console.log("Store: Setting new configuration", config);
    
    const configurables = config.configurables || [];
    const initialOptions = getDefaultOptions(configurables);

    set({ 
      config, 
      selectedOptions: initialOptions,
      isLoading: true, // Remain in loading state while assets/scan complete
      loadingProgress: 0,
      hasLoadError: false,
      modelCenter: [0, 0, 0]
    });
  },

  // Set the model center for OrbitControls
  setModelCenter: (center) => set({ modelCenter: center }),

  // Load configuration from an external JSON file
  loadConfig: async (url = '/config.json') => {
    console.log(`Store: Loading config from ${url}`);
    set({ isLoading: true, hasLoadError: false });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load config: ${response.statusText}`);
      const configData = await response.json();
      get().setConfig(configData);
    } catch (error) {
      console.error("Store: Error loading configuration:", error);
      
      const fallbackConfig = createFallbackConfig();
      
      get().setConfig(fallbackConfig);
      set({ hasLoadError: true, isLoading: false });
    }
  },

  // Set the selected value for a specific configurable option
  setOption: (id, value) => {
    set((state) => ({
      selectedOptions: {
        ...state.selectedOptions,
        [id]: value
      }
    }));
  },

  // Trigger a canvas snapshot download
  triggerSnapshot: () => {
    set((state) => ({ snapshotTrigger: state.snapshotTrigger + 1 }));
  },

  // Update GLTF loading state
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setLoadError: (hasLoadError) => {
    if (hasLoadError) {
      const { config } = get();
      // If we have an error and no configurables, ensure we show the full fallback
      if (config && (!config.configurables || config.configurables.length === 0)) {
        const fallbackConfig = createFallbackConfig(config);
        set({
          config: fallbackConfig,
          selectedOptions: getDefaultOptions(fallbackConfig.configurables),
          hasLoadError: true,
          isLoading: false
        });
        return;
      }
    }
    set({ hasLoadError, isLoading: false });
  },

  // Set dynamic configurables based on meshes found in the model
  setDynamicConfigurables: (parts) => {
    const { config } = get();
    if (!config) return;

    console.log(`Store: Mapping ${parts.length} discovered parts to UI`);
    
    const dynamicConfigurables = parts.map((part, index) => {
      const partInfo = typeof part === 'string' ? { id: part, meshName: part } : part;
      const meshName = partInfo.meshName || partInfo.id || `part-${index + 1}`;
      const defaultColor = partInfo.default || "#EAE6DF";

      // Create a pretty label from the technical mesh name
      let cleanLabel = partInfo.label || meshName
        .replace(/(_\d+|\.\d+|-\d+)$/, '') // Strip trailing indices for the label base
        .replace(/^(mesh|node|primitive|obj|group|part|scene)[_-]/i, '') // Strip prefixes
        .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
        .replace(/[_-]/g, ' ')             // Underscores/hyphens to spaces
        .replace(/\s+/g, ' ')              // Collapse spaces
        .trim();
      
      // Ensure we have a valid label, fallback to generic component name
      if (!cleanLabel || cleanLabel.length < 2 || cleanLabel.toLowerCase() === 'mesh') {
        cleanLabel = `Component ${index + 1}`;
      } else {
        // Capitalize first letter
        cleanLabel = cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1);
      }

      // If there's a suffix in the original name, we keep it in the label to ensure clarity
      const suffixMatch = meshName.match(/(_\d+|\.\d+|-\d+)$/);
      if (suffixMatch && suffixMatch[0].length > 1) {
        const suffix = suffixMatch[0].replace(/^[._-]/, '');
        if (!isNaN(suffix)) {
          cleanLabel = `${cleanLabel} ${suffix}`;
        }
      }

      const baseOptions = [
        { name: "Original", value: defaultColor },
        { name: "Oatmeal", value: "#EAE6DF" },
        { name: "Stark White", value: "#FFFFFF" },
        { name: "Charcoal", value: "#2C2C2C" },
        { name: "Viking Blue", value: "#344E5B" },
        { name: "Studio Brown", value: "#5A2611" },
        { name: "Natural Gum", value: "#9E7B56" },
        { name: "Stealth Black", value: "#1A1A1A" },
        { name: "Oxblood Red", value: "#5C201C" },
        { name: "Forest Green", value: "#243E36" },
        { name: "Slate Grey", value: "#708090" },
        { name: "Desert Sand", value: "#EDC9AF" },
        { name: "Navy Blue", value: "#1B2F4A" }
      ];

      const uniqueOptions = baseOptions.filter((option, optionIndex, options) => (
        options.findIndex((candidate) => candidate.value.toLowerCase() === option.value.toLowerCase()) === optionIndex
      ));

      return {
        id: partInfo.id || meshName, // This is our unique link back to the 3D object
        label: cleanLabel,
        meshName: meshName,
        targetId: partInfo.id || meshName,
        nodePath: partInfo.nodePath,
        materialName: partInfo.materialName,
        type: "color",
        default: defaultColor,
        options: uniqueOptions
      };
    });

    console.log(`Store: Final configuration contains ${dynamicConfigurables.length} sections`);

    const newConfig = { 
      ...config, 
      configurables: dynamicConfigurables 
    };
    
    const initialOptions = {};
    dynamicConfigurables.forEach(c => {
      initialOptions[c.id] = c.default;
    });

    set({ 
      config: newConfig, 
      selectedOptions: initialOptions,
      isLoading: false
    });
  },

  // Reset configuration options to default
  resetOptions: () => {
    const { config } = get();
    if (!config) return;
    
    const defaultOptions = getDefaultOptions(config.configurables);
    
    set({ selectedOptions: defaultOptions });
  }
}));
