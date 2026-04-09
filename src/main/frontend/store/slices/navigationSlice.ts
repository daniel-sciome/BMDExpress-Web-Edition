/**
 * navigationSlice.ts — Tracks which project, analysis type, and category results
 * are currently selected in the UI.
 *
 * Supports multi-selection of category results via ctrl+click on dataset chips.
 * When multiple results are selected, the visualizations show data from all of them.
 * A plain click replaces the selection with a single result (existing behavior).
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface NavigationState {
  selectedProject: string | null;
  selectedAnalysisType: string | null;
  // Array of selected category result fullNames — supports multi-selection.
  // Empty array means no result is selected.
  selectedCategoryResults: string[];
}

const initialState: NavigationState = {
  selectedProject: null,
  selectedAnalysisType: null,
  selectedCategoryResults: [],
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      // Clear type and results when project changes
      if (state.selectedProject !== action.payload) {
        state.selectedAnalysisType = null;
        state.selectedCategoryResults = [];
      }
      state.selectedProject = action.payload;
    },

    setSelectedAnalysisType: (state, action: PayloadAction<string | null>) => {
      state.selectedAnalysisType = action.payload;
      // Clear individual results when setting a non-null type (mutual exclusivity)
      if (action.payload !== null) {
        state.selectedCategoryResults = [];
      }
    },

    // Single-select: replace the selection with one result (plain click)
    setSelectedCategoryResult: (state, action: PayloadAction<string | null>) => {
      if (action.payload !== null) {
        state.selectedCategoryResults = [action.payload];
        state.selectedAnalysisType = null;
      } else {
        state.selectedCategoryResults = [];
      }
    },

    // Multi-select: toggle a result in/out of the selection (ctrl+click)
    toggleSelectedCategoryResult: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      const index = state.selectedCategoryResults.indexOf(name);
      if (index >= 0) {
        // Remove from selection
        state.selectedCategoryResults.splice(index, 1);
      } else {
        // Add to selection
        state.selectedCategoryResults.push(name);
      }
      // Clear analysis type when results are explicitly selected
      if (state.selectedCategoryResults.length > 0) {
        state.selectedAnalysisType = null;
      }
    },

    clearSelection: (state) => {
      state.selectedProject = null;
      state.selectedAnalysisType = null;
      state.selectedCategoryResults = [];
    },
  },
});

export const {
  setSelectedProject,
  setSelectedAnalysisType,
  setSelectedCategoryResult,
  toggleSelectedCategoryResult,
  clearSelection,
} = navigationSlice.actions;

export const selectSelectedProject = (state: RootState) => state.navigation.selectedProject;
export const selectSelectedAnalysisType = (state: RootState) => state.navigation.selectedAnalysisType;

// For backward compatibility: returns the first selected result, or null
export const selectSelectedCategoryResult = (state: RootState) =>
  state.navigation.selectedCategoryResults.length > 0
    ? state.navigation.selectedCategoryResults[0]
    : null;

// The full array of selected results
export const selectSelectedCategoryResults = (state: RootState) =>
  state.navigation.selectedCategoryResults;

export default navigationSlice.reducer;
