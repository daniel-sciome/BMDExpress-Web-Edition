import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface NavigationState {
  selectedProject: string | null;
  selectedAnalysisType: string | null;
  selectedCategoryResult: string | null;
}

const initialState: NavigationState = {
  selectedProject: null,
  selectedAnalysisType: null,
  selectedCategoryResult: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      state.selectedProject = action.payload;
      // Clear both type and result when project changes
      if (state.selectedProject !== action.payload) {
        state.selectedAnalysisType = null;
        state.selectedCategoryResult = null;
      }
    },
    setSelectedAnalysisType: (state, action: PayloadAction<string | null>) => {
      state.selectedAnalysisType = action.payload;
      // Clear individual result when setting a non-null type (mutual exclusivity)
      if (action.payload !== null) {
        state.selectedCategoryResult = null;
      }
    },
    setSelectedCategoryResult: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryResult = action.payload;
      // Clear analysis type when individual result selected
      if (action.payload !== null) {
        state.selectedAnalysisType = null;
      }
    },
    clearSelection: (state) => {
      state.selectedProject = null;
      state.selectedAnalysisType = null;
      state.selectedCategoryResult = null;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedAnalysisType,
  setSelectedCategoryResult,
  clearSelection,
} = navigationSlice.actions;

export const selectSelectedProject = (state: RootState) => state.navigation.selectedProject;
export const selectSelectedAnalysisType = (state: RootState) => state.navigation.selectedAnalysisType;
export const selectSelectedCategoryResult = (state: RootState) => state.navigation.selectedCategoryResult;

export default navigationSlice.reducer;
