/**
 * Chart Configuration Slice
 *
 * Manages chart configurations including:
 * - Preset charts (built-in, non-deletable)
 * - User-created custom charts
 * - Visibility and ordering
 *
 * Persists to localStorage with stubbed server sync.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  ChartConfiguration,
  ChartConfigurationGroup,
  ChartConfigState,
  ChartConfigurationInput,
  ChartOptions,
  ChartKey,
} from 'Frontend/types/chartConfiguration';
import { CHART_CONFIG_VERSION } from 'Frontend/types/chartConfiguration';
import type { ChartAppearance, SavedTheme } from 'Frontend/types/chartAppearance';
import { DEFAULT_CHART_APPEARANCE } from 'Frontend/types/chartAppearance';

// ==================== LocalStorage Keys ====================
const STORAGE_KEY = 'bmdexpress-chart-configs';
const APPEARANCE_STORAGE_KEY = 'bmdexpress-chart-appearance';
const THEMES_STORAGE_KEY = 'bmdexpress-chart-themes';

function loadAppearanceFromStorage(): ChartAppearance {
  try {
    const saved = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChartAppearance;
      if (parsed.version === DEFAULT_CHART_APPEARANCE.version) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[chartConfig] Failed to load appearance from localStorage:', error);
  }
  return DEFAULT_CHART_APPEARANCE;
}

function saveAppearanceToStorage(appearance: ChartAppearance): void {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch (error) {
    console.error('[chartConfig] Failed to save appearance to localStorage:', error);
  }
}

function loadThemesFromStorage(): SavedTheme[] {
  try {
    const saved = localStorage.getItem(THEMES_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as SavedTheme[];
    }
  } catch (error) {
    console.error('[chartConfig] Failed to load themes from localStorage:', error);
  }
  return [];
}

function saveThemesToStorage(themes: SavedTheme[]): void {
  try {
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error('[chartConfig] Failed to save themes to localStorage:', error);
  }
}

// ==================== Preset Configurations ====================

/**
 * Built-in preset chart configurations.
 * These match the current hardcoded charts in CategoryResultsView.
 */
export const PRESET_CONFIGURATIONS: ChartConfiguration[] = [
  // Bubble Chart
  {
    id: 'bubble-chart',
    name: 'Bubble Chart',
    chartType: 'bubble',
    keys: {
      x: { field: 'bmdMedian', transform: 'none' },
      y: { field: 'fishersExactTwoTailPValue', transform: 'negLog10' },
      size: { field: 'percentage' },
    },
    options: {
      xLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 10,
    groupId: 'default-charts',
  },

  // Range Plot (BMD/BMDL/BMDU confidence intervals)
  {
    id: 'range-plot',
    name: 'Range Plot',
    chartType: 'range',
    keys: {
      x: { field: 'bmdMedian' },
    },
    options: {
      xLogScale: true,
      topN: 20,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 20,
    groupId: 'default-charts',
  },

  // Violin Plot Per Category
  {
    id: 'violin-per-category',
    name: 'Violin Plot Per Category',
    chartType: 'violin',
    keys: {
      x: { field: 'bmdMedian' },
    },
    options: {
      xLogScale: true,
      topN: 10,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 30,
    groupId: 'default-charts',
  },

  // BMD vs BMDL Scatter
  {
    id: 'bmd-vs-bmdl-scatter',
    name: 'BMD vs BMDL Scatter',
    chartType: 'scatter',
    keys: {
      x: { field: 'bmdMedian' },
      y: { field: 'bmdlMedian' },
    },
    options: {
      xLogScale: true,
      yLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 40,
    groupId: 'default-charts',
  },

  // BMD Accumulation (BMD)
  {
    id: 'accumulation-bmd',
    name: 'BMD Accumulation',
    chartType: 'accumulation',
    keys: {
      x: { field: 'bmdMedian' },
    },
    options: {
      xLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 50,
    groupId: 'accumulation-charts',
  },

  // BMDL Accumulation
  {
    id: 'accumulation-bmdl',
    name: 'BMDL Accumulation',
    chartType: 'accumulation',
    keys: {
      x: { field: 'bmdlMedian' },
    },
    options: {
      xLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 51,
    groupId: 'accumulation-charts',
  },

  // BMDU Accumulation
  {
    id: 'accumulation-bmdu',
    name: 'BMDU Accumulation',
    chartType: 'accumulation',
    keys: {
      x: { field: 'bmduMedian' },
    },
    options: {
      xLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 52,
    groupId: 'accumulation-charts',
  },

  // BMD Histograms
  {
    id: 'bmd-histograms',
    name: 'BMD Histograms',
    chartType: 'histogram',
    keys: {
      x: { field: 'bmdMedian' },
    },
    options: {
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 60,
    groupId: 'default-charts',
  },

  // Bar Charts (Gene Counts)
  {
    id: 'bar-charts',
    name: 'Gene Count Bar Charts',
    chartType: 'bar',
    keys: {
      x: { field: 'categoryDescription' },
      y: { field: 'genesThatPassedAllFilters' },
    },
    options: {
      topN: 20,
    },
    isPreset: true,
    isVisible: true,
    order: 70,
    groupId: 'default-charts',
  },

  // Best Models Pie Chart
  {
    id: 'best-models-pie',
    name: 'Best Models Distribution',
    chartType: 'bar', // Actually a pie chart but simplified for now
    keys: {},
    options: {},
    isPreset: true,
    isVisible: true,
    order: 80,
    groupId: 'default-charts',
  },

  // UMAP Scatter
  {
    id: 'umap-scatter',
    name: 'UMAP Scatter',
    chartType: 'scatter',
    keys: {
      x: { field: 'umap_x' },
      y: { field: 'umap_y' },
    },
    options: {},
    isPreset: true,
    isVisible: true,
    order: 5,
    groupId: 'umap-charts',
  },

  // Cluster Scatter
  {
    id: 'cluster-scatter',
    name: 'Cluster Scatter',
    chartType: 'scatter',
    keys: {
      x: { field: 'bmdMedian' },
      y: { field: 'fishersExactTwoTailPValue', transform: 'negLog10' },
    },
    options: {
      xLogScale: true,
      bmdStat: 'median',
    },
    isPreset: true,
    isVisible: true,
    order: 6,
    groupId: 'cluster-charts',
  },

  // Cluster Heatmap
  {
    id: 'cluster-heatmap',
    name: 'Cluster Heatmap',
    chartType: 'heatmap',
    keys: {},
    options: {
      topN: 30,
    },
    isPreset: true,
    isVisible: true,
    order: 7,
    groupId: 'cluster-charts',
  },

  // Dose Response Plots (Curve Overlay)
  {
    id: 'curve-overlay',
    name: 'Dose Response Plots',
    chartType: 'curve-overlay',
    keys: {},
    options: {},
    isPreset: true,
    isVisible: true,
    order: 90,
    groupId: 'default-charts',
  },

  // Venn Diagram
  {
    id: 'venn-diagram',
    name: 'Venn Diagram',
    chartType: 'venn',
    keys: {},
    options: {},
    isPreset: true,
    isVisible: false, // Hidden by default
    order: 100,
    groupId: 'default-charts',
  },
];

/**
 * Built-in chart groups.
 */
export const PRESET_GROUPS: ChartConfigurationGroup[] = [
  {
    id: 'umap-charts',
    name: 'UMAP Analysis',
    order: 1,
    isCollapsed: false,
  },
  {
    id: 'cluster-charts',
    name: 'Cluster Analysis',
    order: 2,
    isCollapsed: false,
  },
  {
    id: 'default-charts',
    name: 'Default Charts',
    order: 3,
    isCollapsed: false,
  },
  {
    id: 'accumulation-charts',
    name: 'Accumulation Plots (cumulative distribution)',
    order: 4,
    isCollapsed: false,
  },
  {
    id: 'custom-charts',
    name: 'Custom Charts',
    order: 10,
    isCollapsed: false,
  },
];

// ==================== Storage Functions ====================

function loadFromStorage(): ChartConfigState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChartConfigState;
      // Version check for future migrations
      if (parsed.version === CHART_CONFIG_VERSION) {
        return parsed;
      }
      // TODO: Handle migrations for older versions
      console.warn('[chartConfig] Version mismatch, using defaults');
    }
  } catch (error) {
    console.error('[chartConfig] Failed to load from localStorage:', error);
  }
  return null;
}

function saveToStorage(state: ChartConfigState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[chartConfig] Failed to save to localStorage:', error);
  }
}

function mergeWithPresets(saved: ChartConfigState | null): ChartConfigState {
  if (!saved) {
    return {
      configurations: [...PRESET_CONFIGURATIONS],
      groups: [...PRESET_GROUPS],
      lastModified: Date.now(),
      version: CHART_CONFIG_VERSION,
      globalAppearance: loadAppearanceFromStorage(),
      savedThemes: loadThemesFromStorage(),
    };
  }

  // Merge saved user configs with presets (presets take precedence for structure)
  const mergedConfigs: ChartConfiguration[] = [];

  // Add all presets (may have updated structure)
  PRESET_CONFIGURATIONS.forEach(preset => {
    // Check if user has customized this preset
    const userVersion = saved.configurations.find(c => c.id === preset.id);
    if (userVersion) {
      // Preserve user's visibility and options, but use preset's structure
      mergedConfigs.push({
        ...preset,
        isVisible: userVersion.isVisible,
        options: { ...preset.options, ...userVersion.options },
        keys: userVersion.keys || preset.keys,
      });
    } else {
      mergedConfigs.push(preset);
    }
  });

  // Add user-created configs
  saved.configurations
    .filter(c => !c.isPreset)
    .forEach(config => {
      mergedConfigs.push(config);
    });

  // Merge groups
  const mergedGroups: ChartConfigurationGroup[] = [...PRESET_GROUPS];
  saved.groups
    .filter(g => !PRESET_GROUPS.find(pg => pg.id === g.id))
    .forEach(group => {
      mergedGroups.push(group);
    });

  return {
    configurations: mergedConfigs,
    groups: mergedGroups,
    lastModified: saved.lastModified,
    version: CHART_CONFIG_VERSION,
    globalAppearance: loadAppearanceFromStorage(),
    savedThemes: loadThemesFromStorage(),
  };
}

// ==================== Initial State ====================

const savedState = loadFromStorage();
const initialState: ChartConfigState = mergeWithPresets(savedState);

// ==================== Async Thunks ====================

/**
 * Stubbed server sync - to be implemented when backend is ready.
 */
export const syncToServer = createAsyncThunk(
  'chartConfig/syncToServer',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const configState = state.chartConfig;

    // TODO: Implement server sync when backend is ready
    console.log('[chartConfig] Server sync stubbed', {
      userConfigs: configState.configurations.filter(c => !c.isPreset).length,
      lastModified: configState.lastModified,
    });

    return configState;
  }
);

/**
 * Load configurations from server - stubbed.
 */
export const loadFromServer = createAsyncThunk(
  'chartConfig/loadFromServer',
  async () => {
    // TODO: Implement server load when backend is ready
    console.log('[chartConfig] Server load stubbed');
    return null;
  }
);

// ==================== Slice ====================

const chartConfigSlice = createSlice({
  name: 'chartConfig',
  initialState,
  reducers: {
    /**
     * Add or update a chart configuration.
     */
    saveConfiguration: (state, action: PayloadAction<ChartConfigurationInput>) => {
      const input = action.payload;
      const id = input.id || `custom-${Date.now()}`;
      const order = input.order ?? Math.max(...state.configurations.map(c => c.order), 0) + 10;

      const config: ChartConfiguration = {
        ...input,
        id,
        order,
        isPreset: input.isPreset ?? false,
      };

      const existingIndex = state.configurations.findIndex(c => c.id === id);
      if (existingIndex >= 0) {
        state.configurations[existingIndex] = config;
      } else {
        state.configurations.push(config);
      }

      state.lastModified = Date.now();
      saveToStorage(state);
    },

    /**
     * Delete a user-created configuration.
     * Preset configurations cannot be deleted, only hidden.
     */
    deleteConfiguration: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const config = state.configurations.find(c => c.id === id);

      if (config && !config.isPreset) {
        state.configurations = state.configurations.filter(c => c.id !== id);
        state.lastModified = Date.now();
        saveToStorage(state);
      } else if (config?.isPreset) {
        console.warn('[chartConfig] Cannot delete preset configuration:', id);
      }
    },

    /**
     * Set visibility for a configuration.
     */
    setConfigVisibility: (state, action: PayloadAction<{ id: string; isVisible: boolean }>) => {
      const { id, isVisible } = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.isVisible = isVisible;
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Toggle visibility for a configuration.
     */
    toggleConfigVisibility: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.isVisible = !config.isVisible;
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Update chart options for a configuration.
     */
    updateConfigOptions: (state, action: PayloadAction<{ id: string; options: Partial<ChartOptions> }>) => {
      const { id, options } = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.options = { ...config.options, ...options };
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Update chart keys for a configuration.
     */
    updateConfigKeys: (state, action: PayloadAction<{ id: string; keys: Partial<{ x?: ChartKey; y?: ChartKey; size?: ChartKey; color?: ChartKey }> }>) => {
      const { id, keys } = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.keys = { ...config.keys, ...keys };
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Reorder configurations.
     */
    reorderConfigurations: (state, action: PayloadAction<{ id: string; newOrder: number }>) => {
      const { id, newOrder } = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.order = newOrder;
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Add a new chart group.
     */
    addGroup: (state, action: PayloadAction<Omit<ChartConfigurationGroup, 'order'>>) => {
      const order = Math.max(...state.groups.map(g => g.order), 0) + 1;
      state.groups.push({ ...action.payload, order });
      state.lastModified = Date.now();
      saveToStorage(state);
    },

    /**
     * Toggle group collapsed state.
     */
    toggleGroupCollapse: (state, action: PayloadAction<string>) => {
      const group = state.groups.find(g => g.id === action.payload);
      if (group) {
        group.isCollapsed = !group.isCollapsed;
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Reset to default presets (remove all user configs).
     */
    resetToDefaults: (state) => {
      state.configurations = [...PRESET_CONFIGURATIONS];
      state.groups = [...PRESET_GROUPS];
      state.lastModified = Date.now();
      saveToStorage(state);
    },

    /**
     * Duplicate a configuration (creates a user copy).
     */
    duplicateConfiguration: (state, action: PayloadAction<string>) => {
      const source = state.configurations.find(c => c.id === action.payload);
      if (source) {
        const newId = `custom-${Date.now()}`;
        const newConfig: ChartConfiguration = {
          ...source,
          id: newId,
          name: `${source.name} (Copy)`,
          isPreset: false,
          order: source.order + 1,
          groupId: 'custom-charts',
        };
        state.configurations.push(newConfig);
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    // ==================== Appearance Reducers ====================

    /**
     * Replace the entire global appearance.
     */
    setGlobalAppearance: (state, action: PayloadAction<ChartAppearance>) => {
      state.globalAppearance = action.payload;
      state.lastModified = Date.now();
      saveAppearanceToStorage(action.payload);
    },

    /**
     * Partially update the global appearance (deep merge).
     */
    updateGlobalAppearance: (state, action: PayloadAction<Partial<ChartAppearance>>) => {
      const updated = { ...state.globalAppearance };
      const overrides = action.payload;

      // Shallow merge top-level, deep merge nested objects
      for (const key of Object.keys(overrides) as Array<keyof ChartAppearance>) {
        const val = overrides[key];
        if (val !== undefined) {
          const existing = updated[key];
          if (
            typeof val === 'object' &&
            val !== null &&
            !Array.isArray(val) &&
            typeof existing === 'object' &&
            existing !== null &&
            !Array.isArray(existing)
          ) {
            (updated as any)[key] = { ...existing, ...val };
          } else {
            (updated as any)[key] = val;
          }
        }
      }

      state.globalAppearance = updated;
      state.lastModified = Date.now();
      saveAppearanceToStorage(updated);
    },

    /**
     * Update per-chart appearance overrides.
     */
    updateChartAppearance: (state, action: PayloadAction<{ id: string; appearance: Partial<ChartAppearance> | undefined }>) => {
      const { id, appearance } = action.payload;
      const config = state.configurations.find(c => c.id === id);
      if (config) {
        config.appearance = appearance;
        state.lastModified = Date.now();
        saveToStorage(state);
      }
    },

    /**
     * Save a named theme.
     */
    saveTheme: (state, action: PayloadAction<SavedTheme>) => {
      const existingIndex = state.savedThemes.findIndex(t => t.id === action.payload.id);
      if (existingIndex >= 0) {
        state.savedThemes[existingIndex] = action.payload;
      } else {
        state.savedThemes.push(action.payload);
      }
      state.lastModified = Date.now();
      saveThemesToStorage(state.savedThemes as SavedTheme[]);
    },

    /**
     * Delete a saved theme.
     */
    deleteTheme: (state, action: PayloadAction<string>) => {
      state.savedThemes = state.savedThemes.filter(t => t.id !== action.payload);
      state.lastModified = Date.now();
      saveThemesToStorage(state.savedThemes as SavedTheme[]);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncToServer.fulfilled, (state, action) => {
        // Server sync successful - no state change needed
        console.log('[chartConfig] Server sync completed');
      })
      .addCase(loadFromServer.fulfilled, (state, action) => {
        // Merge server data with local if provided
        if (action.payload) {
          // TODO: Implement server merge logic
          console.log('[chartConfig] Server data received');
        }
      });
  },
});

// ==================== Actions ====================

export const {
  saveConfiguration,
  deleteConfiguration,
  setConfigVisibility,
  toggleConfigVisibility,
  updateConfigOptions,
  updateConfigKeys,
  reorderConfigurations,
  addGroup,
  toggleGroupCollapse,
  resetToDefaults,
  duplicateConfiguration,
  setGlobalAppearance,
  updateGlobalAppearance,
  updateChartAppearance,
  saveTheme,
  deleteTheme,
} = chartConfigSlice.actions;

// ==================== Selectors ====================

/** Get all configurations */
export const selectAllConfigurations = (state: RootState) =>
  state.chartConfig.configurations;

/** Get visible configurations */
export const selectVisibleConfigurations = (state: RootState) =>
  state.chartConfig.configurations.filter(c => c.isVisible);

/** Get configurations by group */
export const selectConfigurationsByGroup = (groupId: string) => (state: RootState) =>
  state.chartConfig.configurations
    .filter(c => c.groupId === groupId)
    .sort((a, b) => a.order - b.order);

/** Get a single configuration by ID */
export const selectConfigurationById = (id: string) => (state: RootState) =>
  state.chartConfig.configurations.find(c => c.id === id);

/** Get all groups */
export const selectAllGroups = (state: RootState) =>
  state.chartConfig.groups;

/** Get groups sorted by order */
export const selectSortedGroups = (state: RootState) =>
  [...state.chartConfig.groups].sort((a, b) => a.order - b.order);

/** Get user-created configurations */
export const selectUserConfigurations = (state: RootState) =>
  state.chartConfig.configurations.filter(c => !c.isPreset);

/** Get preset configurations */
export const selectPresetConfigurations = (state: RootState) =>
  state.chartConfig.configurations.filter(c => c.isPreset);

/** Get global chart appearance */
export const selectGlobalAppearance = (state: RootState) =>
  state.chartConfig.globalAppearance;

/** Get saved themes */
export const selectSavedThemes = (state: RootState) =>
  state.chartConfig.savedThemes;

/** Get per-chart appearance for a given chart ID */
export const selectChartAppearance = (id: string) => (state: RootState) =>
  state.chartConfig.configurations.find(c => c.id === id)?.appearance;

export default chartConfigSlice.reducer;
