/**
 * datasetSelectionSlice.ts — Manages which category analysis datasets are enabled.
 *
 * When a project has multiple category analyses of the same type (e.g., multiple
 * GO_BP results from different experiments), this slice tracks which ones the user
 * has checked/unchecked in the sidebar. Unchecked datasets are hidden from the
 * visualizations, acting as a visibility filter alongside the dim/hide/all toggle.
 *
 * State shape:
 *   annotations: all AnalysisAnnotationDto objects for the current project
 *   enabledDatasets: Set of fullName strings for datasets the user has checked
 *   loading: whether annotations are being fetched
 *
 * The annotations are loaded when a project is selected. By default, all datasets
 * are enabled. The user can uncheck individual datasets in the sidebar to hide them.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import type { RootState } from '../store';

// --- State shape ---

interface DatasetSelectionState {
  // All category analysis annotations for the selected project
  annotations: AnalysisAnnotationDto[];
  // Set of fullName strings for datasets the user has enabled (checked)
  enabledDatasets: Set<string>;
  // Loading state
  loading: boolean;
}

const initialState: DatasetSelectionState = {
  annotations: [],
  enabledDatasets: new Set<string>(),
  loading: false,
};

// --- Async thunk to load annotations when project changes ---

export const loadDatasetAnnotations = createAsyncThunk(
  'datasetSelection/loadAnnotations',
  async (projectId: string) => {
    const annotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
    // Filter out undefined entries from the Hilla endpoint
    return (annotations || []).filter((a): a is AnalysisAnnotationDto => a !== undefined);
  }
);

// --- Slice ---

const datasetSelectionSlice = createSlice({
  name: 'datasetSelection',
  initialState,
  reducers: {
    // Toggle a single dataset on/off by its fullName
    toggleDataset: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      if (state.enabledDatasets.has(name)) {
        state.enabledDatasets.delete(name);
      } else {
        state.enabledDatasets.add(name);
      }
    },

    // Enable all datasets of a given analysis type (e.g., all GO_BP)
    enableAllOfType: (state, action: PayloadAction<string>) => {
      const type = action.payload;
      for (const ann of state.annotations) {
        if (ann.analysisType === type && ann.fullName) {
          state.enabledDatasets.add(ann.fullName);
        }
      }
    },

    // Disable all datasets of a given analysis type
    disableAllOfType: (state, action: PayloadAction<string>) => {
      const type = action.payload;
      for (const ann of state.annotations) {
        if (ann.analysisType === type && ann.fullName) {
          state.enabledDatasets.delete(ann.fullName);
        }
      }
    },

    // Clear all state (e.g., when project is deselected)
    clearDatasetSelection: (state) => {
      state.annotations = [];
      state.enabledDatasets = new Set<string>();
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadDatasetAnnotations.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadDatasetAnnotations.fulfilled, (state, action) => {
        state.annotations = action.payload;
        // Default: all datasets enabled
        state.enabledDatasets = new Set(
          action.payload
            .map(a => a.fullName)
            .filter((name): name is string => name !== undefined)
        );
        state.loading = false;
      })
      .addCase(loadDatasetAnnotations.rejected, (state) => {
        state.annotations = [];
        state.enabledDatasets = new Set<string>();
        state.loading = false;
      });
  },
});

export const {
  toggleDataset,
  enableAllOfType,
  disableAllOfType,
  clearDatasetSelection,
} = datasetSelectionSlice.actions;

// --- Selectors ---

// All annotations for the current project
export const selectAnnotations = (state: RootState) => state.datasetSelection.annotations;

// The set of enabled dataset fullNames
export const selectEnabledDatasets = (state: RootState) => state.datasetSelection.enabledDatasets;

// Whether annotations are loading
export const selectDatasetSelectionLoading = (state: RootState) => state.datasetSelection.loading;

// Annotations grouped by analysis type, for rendering in the sidebar
export const selectAnnotationsByType = (state: RootState): Record<string, AnalysisAnnotationDto[]> => {
  const grouped: Record<string, AnalysisAnnotationDto[]> = {};
  for (const ann of state.datasetSelection.annotations) {
    const type = ann.analysisType || 'Other';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(ann);
  }
  return grouped;
};

export default datasetSelectionSlice.reducer;
