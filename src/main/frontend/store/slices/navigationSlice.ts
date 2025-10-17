import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

interface NavigationState {
  selectedProject: string | null;
  selectedCategoryResult: string | null;
}

const initialState: NavigationState = {
  selectedProject: null,
  selectedCategoryResult: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      state.selectedProject = action.payload;
      // Clear category result when project changes
      if (state.selectedProject !== action.payload) {
        state.selectedCategoryResult = null;
      }
    },
    setSelectedCategoryResult: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryResult = action.payload;
    },
    clearSelection: (state) => {
      state.selectedProject = null;
      state.selectedCategoryResult = null;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedCategoryResult,
  clearSelection,
} = navigationSlice.actions;

export const selectSelectedProject = (state: RootState) => state.navigation.selectedProject;
export const selectSelectedCategoryResult = (state: RootState) => state.navigation.selectedCategoryResult;

export default navigationSlice.reducer;
