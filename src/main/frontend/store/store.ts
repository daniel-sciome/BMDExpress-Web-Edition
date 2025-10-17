import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import categoryResultsReducer from './slices/categoryResultsSlice';

// Enable Immer support for Map and Set
enableMapSet();

export const store = configureStore({
  reducer: {
    categoryResults: categoryResultsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Set in selectedCategoryIds - Sets are not serializable
        ignoredPaths: ['categoryResults.selectedCategoryIds'],
        ignoredActions: ['categoryResults/setSelectedCategoryIds', 'categoryResults/toggleCategorySelection'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
