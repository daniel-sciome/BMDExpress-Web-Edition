import { configureStore, Middleware } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import categoryResultsReducer from './slices/categoryResultsSlice';
import navigationReducer from './slices/navigationSlice';
import renderStateReducer from './slices/renderStateSlice';
import filterReducer from './slices/filterSlice';
import prefilterReducer from './slices/prefilterSlice';
import visibilityReducer from './slices/visibilitySlice';
import categoryGroupsReducer from './slices/categoryGroupsSlice';
import uiStateReducer from './slices/uiStateSlice';
import chartConfigReducer from './slices/chartConfigSlice';
import reportReducer, { reportAutoSaveMiddleware } from './slices/reportSlice';
import { saveFilterGroups } from '../utils/filterGroupPersistence';

// Enable Immer support for Map and Set
enableMapSet();

// Middleware to save filter groups to localStorage when they change
const filterGroupPersistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Save filter groups after any filter action
  if (typeof action === 'object' && action !== null && 'type' in action && typeof action.type === 'string' && action.type.startsWith('filters/')) {
    const state = store.getState();
    saveFilterGroups(state.filters.groups);
  }

  return result;
};

export const store = configureStore({
  reducer: {
    categoryResults: categoryResultsReducer,
    navigation: navigationReducer,
    renderState: renderStateReducer,
    filters: filterReducer,
    prefilter: prefilterReducer,
    visibility: visibilityReducer,
    categoryGroups: categoryGroupsReducer,
    uiState: uiStateReducer,
    chartConfig: chartConfigReducer,
    report: reportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Set objects - Sets are not serializable but Immer supports them
        ignoredPaths: [
          'categoryResults.reactiveSelection.category.selectedIds',
          'categoryResults.reactiveSelection.cluster.selectedIds',
          'visibility.highlightedIds',
        ],
        ignoredActions: [
          // Reactive selection actions
          'categoryResults/setReactiveSelection',
          'categoryResults/toggleReactiveSelection',
          'categoryResults/clearReactiveSelection',
          // Async actions that clear Sets
          'categoryResults/load/pending',
          'categoryResults/load/fulfilled',
          'categoryResults/load/rejected',
          'categoryResults/loadParameters/pending',
          'categoryResults/loadParameters/fulfilled',
          'categoryResults/loadParameters/rejected',
          // Other actions
          'categoryResults/setAnalysisType',
          'categoryResults/setFilters',
          'navigation/setSelectedProject',
          'navigation/setSelectedCategoryResult',
          // Visibility actions (highlightedIds is a Set)
          'visibility/setVisibility',
          'visibility/setVisibilityBatch',
          'visibility/highlightCategories',
          'visibility/clearHighlights',
          'visibility/clearOverride',
          'visibility/clearAllOverrides',
          'visibility/loadDefaults/fulfilled',
        ],
      },
    }).concat(filterGroupPersistenceMiddleware, reportAutoSaveMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
