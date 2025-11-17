import { configureStore, Middleware } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import categoryResultsReducer from './slices/categoryResultsSlice';
import navigationReducer from './slices/navigationSlice';
import renderStateReducer from './slices/renderStateSlice';
import filterReducer from './slices/filterSlice';
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Set objects - Sets are not serializable but Immer supports them
        ignoredPaths: [
          'categoryResults.selectedCategoryIds',
          'categoryResults.selectedUmapGoIds',
          'categoryResults.reactiveSelection.category.selectedIds',
          'categoryResults.reactiveSelection.cluster.selectedIds',
        ],
        ignoredActions: [
          // Legacy selection actions
          'categoryResults/setSelectedCategoryIds',
          'categoryResults/toggleCategorySelection',
          'categoryResults/clearSelection',
          'categoryResults/toggleMultipleCategoryIds',
          'categoryResults/selectAllCategories',
          'categoryResults/invertSelection',
          // Reactive selection actions
          'categoryResults/setReactiveSelection',
          'categoryResults/toggleReactiveSelection',
          'categoryResults/clearReactiveSelection',
          // UMAP selection actions
          'categoryResults/setSelectedUmapGoIds',
          'categoryResults/toggleUmapGoIdSelection',
          'categoryResults/clearUmapSelection',
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
        ],
      },
    }).concat(filterGroupPersistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
