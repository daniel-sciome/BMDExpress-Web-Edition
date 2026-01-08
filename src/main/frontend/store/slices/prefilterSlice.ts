import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import * as PrefilterService from '../../generated/PrefilterService';
import type PrefilterInput from '../../generated/com/sciome/dto/prefilter/PrefilterInput';
import type PrefilterResult from '../../generated/com/sciome/dto/prefilter/PrefilterResult';
import type PrefilterResults from '../../generated/com/sciome/dto/prefilter/PrefilterResults';
import type OneWayANOVAInput from '../../generated/com/sciome/dto/prefilter/OneWayANOVAInput';
import type WilliamsTrendInput from '../../generated/com/sciome/dto/prefilter/WilliamsTrendInput';
import type OriogenInput from '../../generated/com/sciome/dto/prefilter/OriogenInput';
import type CurveFitPrefilterInput from '../../generated/com/sciome/dto/prefilter/CurveFitPrefilterInput';

// Re-export types for convenience
export type {
  PrefilterInput,
  PrefilterResult,
  PrefilterResults,
  OneWayANOVAInput,
  WilliamsTrendInput,
  OriogenInput,
  CurveFitPrefilterInput,
};

// ========================================
// STATE INTERFACE
// ========================================

interface PrefilterState {
  // Results storage
  prefilterResultsById: Record<string, PrefilterResults | undefined>;
  prefilterResultsIds: string[];
  selectedPrefilterResultsId: string | null;

  // UI state
  isRunning: boolean;
  progress: number; // 0-100
  statusMessage: string;
  error: string | null;

  // Config persistence (last used configurations)
  lastAnovaConfig: OneWayANOVAInput | null;
  lastWilliamsConfig: WilliamsTrendInput | null;
  lastOriogenConfig: OriogenInput | null;
  lastCurveFitConfig: CurveFitPrefilterInput | null;
}

// ========================================
// INITIAL STATE
// ========================================

const initialState: PrefilterState = {
  prefilterResultsById: {},
  prefilterResultsIds: [],
  selectedPrefilterResultsId: null,
  isRunning: false,
  progress: 0,
  statusMessage: '',
  error: null,
  lastAnovaConfig: null,
  lastWilliamsConfig: null,
  lastOriogenConfig: null,
  lastCurveFitConfig: null,
};

// ========================================
// ASYNC THUNKS
// ========================================

export const runOneWayANOVA = createAsyncThunk(
  'prefilter/runOneWayANOVA',
  async (input: OneWayANOVAInput, { dispatch, rejectWithValue }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));
    dispatch(setStatusMessage('Starting One-Way ANOVA analysis...'));

    try {
      const results = await PrefilterService.oneWayANOVA(input);
      if (!results) {
        throw new Error('No results returned from service');
      }
      dispatch(setProgress(100));
      dispatch(setStatusMessage('Analysis complete!'));
      return results;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runWilliamsTrend = createAsyncThunk(
  'prefilter/runWilliamsTrend',
  async (input: WilliamsTrendInput, { dispatch, rejectWithValue }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));
    dispatch(setStatusMessage('Starting Williams Trend Test analysis...'));

    try {
      const results = await PrefilterService.williamsTrend(input);
      if (!results) {
        throw new Error('No results returned from service');
      }
      dispatch(setProgress(100));
      dispatch(setStatusMessage('Analysis complete!'));
      return results;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runOriogen = createAsyncThunk(
  'prefilter/runOriogen',
  async (input: OriogenInput, { dispatch, rejectWithValue }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));
    dispatch(setStatusMessage('Starting Oriogen analysis...'));

    try {
      const results = await PrefilterService.oriogen(input);
      if (!results) {
        throw new Error('No results returned from service');
      }
      dispatch(setProgress(100));
      dispatch(setStatusMessage('Analysis complete!'));
      return results;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const runCurveFitPrefilter = createAsyncThunk(
  'prefilter/runCurveFitPrefilter',
  async (input: CurveFitPrefilterInput, { dispatch, rejectWithValue }) => {
    dispatch(setIsRunning(true));
    dispatch(setProgress(0));
    dispatch(setStatusMessage('Starting Curve Fit Prefilter analysis...'));

    try {
      const results = await PrefilterService.curveFitPrefilter(input);
      if (!results) {
        throw new Error('No results returned from service');
      }
      dispatch(setProgress(100));
      dispatch(setStatusMessage('Analysis complete!'));
      return results;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      dispatch(setIsRunning(false));
    }
  }
);

export const loadAllPrefilterResults = createAsyncThunk(
  'prefilter/loadAll',
  async () => {
    const results = await PrefilterService.getAllPrefilterResults();
    return results?.filter((r): r is PrefilterResults => r !== undefined) || [];
  }
);

export const deletePrefilterResultsAction = createAsyncThunk(
  'prefilter/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await PrefilterService.deletePrefilterResults(id);
      if (!success) {
        throw new Error('Failed to delete prefilter results');
      }
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// ========================================
// SLICE
// ========================================

const prefilterSlice = createSlice({
  name: 'prefilter',
  initialState,
  reducers: {
    setIsRunning(state, action: PayloadAction<boolean>) {
      state.isRunning = action.payload;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    setStatusMessage(state, action: PayloadAction<string>) {
      state.statusMessage = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setSelectedPrefilterResultsId(state, action: PayloadAction<string | null>) {
      state.selectedPrefilterResultsId = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // One-Way ANOVA
    builder.addCase(runOneWayANOVA.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      if (!state.prefilterResultsIds.includes(results.id)) {
        state.prefilterResultsIds.push(results.id);
      }
      state.selectedPrefilterResultsId = results.id;
      state.lastAnovaConfig = action.meta.arg;
    });
    builder.addCase(runOneWayANOVA.rejected, (state, action) => {
      state.error = action.error.message || 'One-Way ANOVA analysis failed';
    });

    // Williams Trend
    builder.addCase(runWilliamsTrend.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      if (!state.prefilterResultsIds.includes(results.id)) {
        state.prefilterResultsIds.push(results.id);
      }
      state.selectedPrefilterResultsId = results.id;
      state.lastWilliamsConfig = action.meta.arg;
    });
    builder.addCase(runWilliamsTrend.rejected, (state, action) => {
      state.error = action.error.message || 'Williams Trend Test analysis failed';
    });

    // Oriogen
    builder.addCase(runOriogen.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      if (!state.prefilterResultsIds.includes(results.id)) {
        state.prefilterResultsIds.push(results.id);
      }
      state.selectedPrefilterResultsId = results.id;
      state.lastOriogenConfig = action.meta.arg;
    });
    builder.addCase(runOriogen.rejected, (state, action) => {
      state.error = action.error.message || 'Oriogen analysis failed';
    });

    // Curve Fit Prefilter
    builder.addCase(runCurveFitPrefilter.fulfilled, (state, action) => {
      const results = action.payload;
      state.prefilterResultsById[results.id] = results;
      if (!state.prefilterResultsIds.includes(results.id)) {
        state.prefilterResultsIds.push(results.id);
      }
      state.selectedPrefilterResultsId = results.id;
      state.lastCurveFitConfig = action.meta.arg;
    });
    builder.addCase(runCurveFitPrefilter.rejected, (state, action) => {
      state.error = action.error.message || 'Curve Fit Prefilter analysis failed';
    });

    // Load all results
    builder.addCase(loadAllPrefilterResults.fulfilled, (state, action) => {
      action.payload.forEach(results => {
        state.prefilterResultsById[results.id] = results;
        if (!state.prefilterResultsIds.includes(results.id)) {
          state.prefilterResultsIds.push(results.id);
        }
      });
    });

    // Delete results
    builder.addCase(deletePrefilterResultsAction.fulfilled, (state, action) => {
      const id = action.payload;
      delete state.prefilterResultsById[id];
      state.prefilterResultsIds = state.prefilterResultsIds.filter(i => i !== id);
      if (state.selectedPrefilterResultsId === id) {
        state.selectedPrefilterResultsId = null;
      }
    });
    builder.addCase(deletePrefilterResultsAction.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to delete prefilter results';
    });
  },
});

// ========================================
// ACTIONS
// ========================================

export const {
  setIsRunning,
  setProgress,
  setStatusMessage,
  setError,
  setSelectedPrefilterResultsId,
  clearError,
} = prefilterSlice.actions;

// ========================================
// SELECTORS
// ========================================

// Base selectors for memoization
const selectPrefilterResultsIds = (state: RootState) => state.prefilter.prefilterResultsIds;
const selectPrefilterResultsByIdMap = (state: RootState) => state.prefilter.prefilterResultsById;

// Memoized selector to prevent unnecessary re-renders
export const selectAllPrefilterResults = createSelector(
  [selectPrefilterResultsIds, selectPrefilterResultsByIdMap],
  (ids, byId) => ids
    .map(id => byId[id])
    .filter((result): result is PrefilterResults => result !== undefined)
);

export const selectSelectedPrefilterResults = (state: RootState): PrefilterResults | null => {
  const id = state.prefilter.selectedPrefilterResultsId;
  return id ? (state.prefilter.prefilterResultsById[id] || null) : null;
};

export const selectPrefilterResultsById = (state: RootState, id: string): PrefilterResults | undefined =>
  state.prefilter.prefilterResultsById[id];

export const selectIsRunning = (state: RootState): boolean =>
  state.prefilter.isRunning;

export const selectProgress = (state: RootState): number =>
  state.prefilter.progress;

export const selectStatusMessage = (state: RootState): string =>
  state.prefilter.statusMessage;

export const selectError = (state: RootState): string | null =>
  state.prefilter.error;

export const selectLastAnovaConfig = (state: RootState): OneWayANOVAInput | null =>
  state.prefilter.lastAnovaConfig;

export const selectLastWilliamsConfig = (state: RootState): WilliamsTrendInput | null =>
  state.prefilter.lastWilliamsConfig;

export const selectLastOriogenConfig = (state: RootState): OriogenInput | null =>
  state.prefilter.lastOriogenConfig;

export const selectLastCurveFitConfig = (state: RootState): CurveFitPrefilterInput | null =>
  state.prefilter.lastCurveFitConfig;

// ========================================
// REDUCER
// ========================================

export default prefilterSlice.reducer;
