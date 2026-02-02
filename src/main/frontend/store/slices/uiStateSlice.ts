/**
 * UI State Slice
 *
 * Manages persistent UI state that should survive component remounts,
 * such as which charts are visible and which sections are expanded.
 * State is persisted to localStorage for cross-session persistence.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// localStorage keys
const VISIBLE_CHARTS_STORAGE_KEY = 'bmdexpress_visible_charts';
const OPEN_COLLAPSES_STORAGE_KEY = 'bmdexpress_open_collapses';

// Default expanded collapses (table always expanded)
const DEFAULT_OPEN_COLLAPSES = [
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6',
  'chart-7', 'chart-8', 'chart-9', 'chart-10', 'chart-11', 'chart-12',
  'chart-14', 'chart-15', 'category-results-table'
];

// Load visible charts from localStorage
function loadVisibleChartsFromStorage(): string[] {
  try {
    const saved = localStorage.getItem(VISIBLE_CHARTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[uiState] Failed to load visible charts from localStorage:', error);
  }
  return [];
}

// Load open collapses from localStorage
function loadOpenCollapsesFromStorage(): string[] {
  try {
    const saved = localStorage.getItem(OPEN_COLLAPSES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('[uiState] Failed to load open collapses from localStorage:', error);
  }
  return DEFAULT_OPEN_COLLAPSES;
}

// Save visible charts to localStorage
function saveVisibleChartsToStorage(charts: string[]): void {
  try {
    localStorage.setItem(VISIBLE_CHARTS_STORAGE_KEY, JSON.stringify(charts));
  } catch (error) {
    console.error('[uiState] Failed to save visible charts to localStorage:', error);
  }
}

// Save open collapses to localStorage
function saveOpenCollapsesToStorage(collapses: string[]): void {
  try {
    localStorage.setItem(OPEN_COLLAPSES_STORAGE_KEY, JSON.stringify(collapses));
  } catch (error) {
    console.error('[uiState] Failed to save open collapses to localStorage:', error);
  }
}

interface UiState {
  /** Chart IDs that are selected for display */
  visibleCharts: string[];
  /** Collapse keys that are currently expanded */
  openChartCollapses: string[];
}

const initialState: UiState = {
  visibleCharts: loadVisibleChartsFromStorage(),
  openChartCollapses: loadOpenCollapsesFromStorage(),
};

const uiStateSlice = createSlice({
  name: 'uiState',
  initialState,
  reducers: {
    /** Set the complete list of visible charts */
    setVisibleCharts: (state, action: PayloadAction<string[]>) => {
      state.visibleCharts = action.payload;
      saveVisibleChartsToStorage(action.payload);
    },

    /** Toggle a single chart's visibility */
    toggleChart: (state, action: PayloadAction<string>) => {
      const chartId = action.payload;
      const index = state.visibleCharts.indexOf(chartId);
      if (index === -1) {
        state.visibleCharts.push(chartId);
      } else {
        state.visibleCharts.splice(index, 1);
      }
      saveVisibleChartsToStorage(state.visibleCharts);
    },

    /** Set the complete list of open collapses */
    setOpenCollapses: (state, action: PayloadAction<string[]>) => {
      state.openChartCollapses = action.payload;
      saveOpenCollapsesToStorage(action.payload);
    },

    /** Toggle a single collapse's expanded state */
    toggleCollapse: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      const index = state.openChartCollapses.indexOf(key);
      if (index === -1) {
        state.openChartCollapses.push(key);
      } else {
        state.openChartCollapses.splice(index, 1);
      }
      saveOpenCollapsesToStorage(state.openChartCollapses);
    },

    /** Add a collapse to the open list (if not already open) */
    openCollapse: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (!state.openChartCollapses.includes(key)) {
        state.openChartCollapses.push(key);
        saveOpenCollapsesToStorage(state.openChartCollapses);
      }
    },

    /** Collapse all chart sections */
    collapseAll: (state) => {
      state.openChartCollapses = [];
      saveOpenCollapsesToStorage([]);
    },

    /** Reset to default state */
    resetUiState: (state) => {
      state.visibleCharts = [];
      state.openChartCollapses = DEFAULT_OPEN_COLLAPSES;
      saveVisibleChartsToStorage([]);
      saveOpenCollapsesToStorage(DEFAULT_OPEN_COLLAPSES);
    },
  },
});

export const {
  setVisibleCharts,
  toggleChart,
  setOpenCollapses,
  toggleCollapse,
  openCollapse,
  collapseAll,
  resetUiState,
} = uiStateSlice.actions;

// Selectors
export const selectVisibleCharts = (state: RootState) => state.uiState.visibleCharts;
export const selectOpenCollapses = (state: RootState) => state.uiState.openChartCollapses;

export default uiStateSlice.reducer;
