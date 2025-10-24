import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import categoryResultsReducer from './slices/categoryResultsSlice';
import navigationReducer from './slices/navigationSlice';

// Enable Immer support for Map and Set
enableMapSet();

export const store = configureStore({
  reducer: {
    categoryResults: categoryResultsReducer,
    navigation: navigationReducer,
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
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
