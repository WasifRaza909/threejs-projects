import { create } from 'zustand';

export const useConfiguratorStore = create((set, get) => ({
  // The current active configuration JSON
  config: null,
  
  // Mapping of configurable.id -> selected value (e.g. color hex code or texture id)
  selectedOptions: {},
  
  // Event state to trigger canvas snapshot downloads
  snapshotTrigger: 0,
  
  // State for loading progress (0 to 100) or status
  isLoading: true,
  loadingProgress: 0,
  hasLoadError: false,
  
  // Set configuration and initialize default options
  setConfig: (config) => {
    if (!config) return;
    
    // Initialize default options (first option for each configurable)
    const initialOptions = {};
    config.configurables.forEach(c => {
      // Use the first option as default, or we can check if a default is specified
      const defaultOption = c.default !== undefined 
        ? c.options.find(o => o.value === c.default || o.name === c.default) 
        : c.options[0];
        
      initialOptions[c.id] = defaultOption ? defaultOption.value : null;
    });

    set({ 
      config, 
      selectedOptions: initialOptions,
      isLoading: true,
      loadingProgress: 0,
      hasLoadError: false
    });
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
  setLoadError: (hasLoadError) => set({ hasLoadError, isLoading: false }),

  // Set dynamic configurables based on meshes found in the model
  setDynamicConfigurables: (meshes) => {
    const { config } = get();
    if (!config) return;

    // Filter out duplicates and empty names
    const uniqueMeshes = [...new Set(meshes)].filter(Boolean);

    const dynamicConfigurables = uniqueMeshes.map((meshName, index) => {
      // Clean up the name for the label: 
      // 1. Remove trailing numbers/suffixes like _0, .001, -2
      // 2. Add spaces between CamelCase
      // 3. Replace underscores/hyphens with spaces
      let cleanLabel = meshName
        .replace(/(_\d+|\.\d+|-\d+)$/, '') // Remove trailing _0, .001, etc.
        .replace(/([A-Z])/g, ' $1')        // Add space before capitals
        .replace(/[_-]/g, ' ')             // Replace underscores and hyphens
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

      // Fallback if cleaning leaves us with nothing or a generic "Mesh"
      if (!cleanLabel || cleanLabel.toLowerCase() === 'mesh') {
        cleanLabel = `Component ${index + 1}`;
      }

      return {
        id: `part_${index}_${meshName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        label: cleanLabel,
        meshName: meshName,
        type: "color",
        default: "#EAE6DF",
        options: [
          { name: "Oatmeal", value: "#EAE6DF" },
          { name: "Stark White", value: "#FFFFFF" },
          { name: "Charcoal", value: "#2C2C2C" },
          { name: "Viking Blue", value: "#344E5B" },
          { name: "Studio Brown", value: "#5A2611" },
          { name: "Natural Gum", value: "#9E7B56" },
          { name: "Stealth Black", value: "#1A1A1A" },
          { name: "Oxblood Red", value: "#5C201C" },
          { name: "Forest Green", value: "#243E36" }
        ]
      };
    });

    const newConfig = { ...config, configurables: dynamicConfigurables };
    
    const initialOptions = {};
    dynamicConfigurables.forEach(c => {
      initialOptions[c.id] = c.options[0].value;
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
    
    const defaultOptions = {};
    config.configurables.forEach(c => {
      const defaultOption = c.default !== undefined 
        ? c.options.find(o => o.value === c.default || o.name === c.default) 
        : c.options[0];
      defaultOptions[c.id] = defaultOption ? defaultOption.value : null;
    });
    
    set({ selectedOptions: defaultOptions });
  }
}));
