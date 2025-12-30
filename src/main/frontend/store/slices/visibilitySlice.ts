import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DefaultsService } from 'Frontend/generated/endpoints';
import type { RootState } from '../store';
import type {
  VisibilityState,
  SizeState,
  VisibilityDefaults,
  VisibilityOverride,
  VisibilitySliceState,
  DisplayMode,
} from '../../types/visibilityTypes';

/**
 * Initial defaults before loading from backend.
 * These are overwritten once loadVisibilityDefaults completes.
 */
const fallbackDefaults: VisibilityDefaults = {
  visibility: 'normal',
  size: 'medium',
  nonSelectedVisibility: 'dimmed',
};

/**
 * Initial state for visibility slice.
 */
const initialState: VisibilitySliceState = {
  defaults: fallbackDefaults,
  overrides: {},
  highlightedIds: new Set<string>(),
  displayMode: 'dim',
  initialized: false,
};

/**
 * Async thunk to load visibility defaults from the backend.
 * Called during app initialization to get configured values from application.yml.
 */
export const loadVisibilityDefaults = createAsyncThunk(
  'visibility/loadDefaults',
  async () => {
    console.log('[visibility] Loading defaults from backend');
    const dto = await DefaultsService.getVisibilityDefaults();
    console.log('[visibility] Received defaults:', dto);
    return dto;
  }
);

/**
 * Visibility slice for managing per-category visual state.
 *
 * Architecture:
 * - Defaults apply to all categories unless overridden
 * - Overrides are stored sparsely (only non-default values)
 * - highlightedIds is a derived Set for quick access (computed from overrides)
 */
const visibilitySlice = createSlice({
  name: 'visibility',
  initialState,

  reducers: {
    /**
     * Set visibility state for a single category.
     * Stores as override if different from default; removes override if matches default.
     */
    setVisibility: (
      state,
      action: PayloadAction<{ categoryId: string; visibility: VisibilityState }>
    ) => {
      const { categoryId, visibility } = action.payload;

      if (visibility === state.defaults.visibility) {
        // Matches default - remove visibility from override if present
        if (state.overrides[categoryId]) {
          const { visibility: _, ...rest } = state.overrides[categoryId];
          if (Object.keys(rest).length === 0) {
            delete state.overrides[categoryId];
          } else {
            state.overrides[categoryId] = rest;
          }
        }
      } else {
        // Different from default - store as override
        state.overrides[categoryId] = {
          ...state.overrides[categoryId],
          visibility,
        };
      }

      // Update highlightedIds
      updateHighlightedIds(state);
    },

    /**
     * Set size state for a single category.
     */
    setSize: (
      state,
      action: PayloadAction<{ categoryId: string; size: SizeState }>
    ) => {
      const { categoryId, size } = action.payload;

      if (size === state.defaults.size) {
        // Matches default - remove size from override if present
        if (state.overrides[categoryId]) {
          const { size: _, ...rest } = state.overrides[categoryId];
          if (Object.keys(rest).length === 0) {
            delete state.overrides[categoryId];
          } else {
            state.overrides[categoryId] = rest;
          }
        }
      } else {
        // Different from default - store as override
        state.overrides[categoryId] = {
          ...state.overrides[categoryId],
          size,
        };
      }
    },

    /**
     * Set custom color for a single category.
     * Pass undefined to remove custom color.
     */
    setColor: (
      state,
      action: PayloadAction<{ categoryId: string; color: string | undefined }>
    ) => {
      const { categoryId, color } = action.payload;

      if (!color) {
        // Remove color from override
        if (state.overrides[categoryId]) {
          const { color: _, ...rest } = state.overrides[categoryId];
          if (Object.keys(rest).length === 0) {
            delete state.overrides[categoryId];
          } else {
            state.overrides[categoryId] = rest;
          }
        }
      } else {
        // Store color as override
        state.overrides[categoryId] = {
          ...state.overrides[categoryId],
          color,
        };
      }
    },

    /**
     * Toggle pinned state for a single category.
     */
    togglePinned: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const currentPinned = state.overrides[categoryId]?.pinned ?? false;

      if (!currentPinned) {
        // Pin the category
        state.overrides[categoryId] = {
          ...state.overrides[categoryId],
          pinned: true,
        };
      } else {
        // Unpin - remove pinned from override
        if (state.overrides[categoryId]) {
          const { pinned: _, ...rest } = state.overrides[categoryId];
          if (Object.keys(rest).length === 0) {
            delete state.overrides[categoryId];
          } else {
            state.overrides[categoryId] = rest;
          }
        }
      }
    },

    /**
     * Set visibility for multiple categories at once (batch update).
     */
    setVisibilityBatch: (
      state,
      action: PayloadAction<{ categoryIds: string[]; visibility: VisibilityState }>
    ) => {
      const { categoryIds, visibility } = action.payload;

      categoryIds.forEach(categoryId => {
        if (visibility === state.defaults.visibility) {
          // Matches default - remove from override
          if (state.overrides[categoryId]) {
            const { visibility: _, ...rest } = state.overrides[categoryId];
            if (Object.keys(rest).length === 0) {
              delete state.overrides[categoryId];
            } else {
              state.overrides[categoryId] = rest;
            }
          }
        } else {
          // Store as override
          state.overrides[categoryId] = {
            ...state.overrides[categoryId],
            visibility,
          };
        }
      });

      // Update highlightedIds
      updateHighlightedIds(state);
    },

    /**
     * Highlight specific categories (set to 'highlighted', dim others).
     * This is the main action for click-to-highlight behavior.
     */
    highlightCategories: (
      state,
      action: PayloadAction<{ categoryIds: string[]; exclusive?: boolean }>
    ) => {
      const { categoryIds, exclusive = true } = action.payload;

      if (exclusive) {
        // Clear existing highlights first
        Object.keys(state.overrides).forEach(id => {
          if (state.overrides[id]?.visibility === 'highlighted') {
            const { visibility: _, ...rest } = state.overrides[id];
            if (Object.keys(rest).length === 0) {
              delete state.overrides[id];
            } else {
              state.overrides[id] = rest;
            }
          }
        });
      }

      // Set new highlights
      categoryIds.forEach(categoryId => {
        state.overrides[categoryId] = {
          ...state.overrides[categoryId],
          visibility: 'highlighted',
        };
      });

      // Update highlightedIds
      updateHighlightedIds(state);
    },

    /**
     * Clear all highlights (return all to default visibility).
     */
    clearHighlights: (state) => {
      Object.keys(state.overrides).forEach(id => {
        if (state.overrides[id]?.visibility) {
          const { visibility: _, ...rest } = state.overrides[id];
          if (Object.keys(rest).length === 0) {
            delete state.overrides[id];
          } else {
            state.overrides[id] = rest;
          }
        }
      });

      state.highlightedIds = new Set();
    },

    /**
     * Clear all overrides for a specific category.
     */
    clearOverride: (state, action: PayloadAction<string>) => {
      delete state.overrides[action.payload];
      state.highlightedIds.delete(action.payload);
    },

    /**
     * Clear all overrides (reset to defaults).
     */
    clearAllOverrides: (state) => {
      state.overrides = {};
      state.highlightedIds = new Set();
    },

    /**
     * Set display mode (how non-selected items are displayed).
     */
    setDisplayMode: (state, action: PayloadAction<DisplayMode>) => {
      state.displayMode = action.payload;
    },

    /**
     * Set defaults directly (for testing or manual override).
     */
    setDefaults: (state, action: PayloadAction<Partial<VisibilityDefaults>>) => {
      state.defaults = { ...state.defaults, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadVisibilityDefaults.fulfilled, (state, action) => {
        const dto = action.payload;
        if (dto) {
          state.defaults = {
            visibility: (dto.defaultState as VisibilityState) || 'normal',
            size: (dto.defaultSize as SizeState) || 'medium',
            nonSelectedVisibility: (dto.nonSelected as VisibilityState) || 'dimmed',
          };
        }
        state.initialized = true;
        console.log('[visibility] Defaults initialized:', state.defaults);
      })
      .addCase(loadVisibilityDefaults.rejected, (state, action) => {
        console.error('[visibility] Failed to load defaults:', action.error);
        // Keep fallback defaults, mark as initialized so app can proceed
        state.initialized = true;
      });
  },
});

/**
 * Helper function to update highlightedIds Set from overrides.
 * Called after any visibility change.
 */
function updateHighlightedIds(state: VisibilitySliceState): void {
  const newHighlightedIds = new Set<string>();
  Object.entries(state.overrides).forEach(([id, override]) => {
    if (override.visibility === 'highlighted') {
      newHighlightedIds.add(id);
    }
  });
  state.highlightedIds = newHighlightedIds;
}

// Export actions
export const {
  setVisibility,
  setSize,
  setColor,
  togglePinned,
  setVisibilityBatch,
  highlightCategories,
  clearHighlights,
  clearOverride,
  clearAllOverrides,
  setDisplayMode,
  setDefaults,
} = visibilitySlice.actions;

// Export reducer
export default visibilitySlice.reducer;

// Base selectors
export const selectVisibilityState = (state: RootState) => state.visibility;
export const selectVisibilityDefaults = (state: RootState) => state.visibility.defaults;
export const selectVisibilityOverrides = (state: RootState) => state.visibility.overrides;
export const selectHighlightedIds = (state: RootState) => state.visibility.highlightedIds;
export const selectDisplayMode = (state: RootState) => state.visibility.displayMode;
export const selectVisibilityInitialized = (state: RootState) => state.visibility.initialized;

/**
 * Get the effective visibility for a category (override or default).
 */
export const selectCategoryVisibility = (categoryId: string) => (state: RootState): VisibilityState => {
  const override = state.visibility.overrides[categoryId];
  return override?.visibility ?? state.visibility.defaults.visibility;
};

/**
 * Get the effective size for a category (override or default).
 */
export const selectCategorySize = (categoryId: string) => (state: RootState): SizeState => {
  const override = state.visibility.overrides[categoryId];
  return override?.size ?? state.visibility.defaults.size;
};

/**
 * Check if a category is pinned.
 */
export const selectCategoryPinned = (categoryId: string) => (state: RootState): boolean => {
  return state.visibility.overrides[categoryId]?.pinned ?? false;
};

/**
 * Get custom color for a category (undefined if no custom color).
 */
export const selectCategoryColor = (categoryId: string) => (state: RootState): string | undefined => {
  return state.visibility.overrides[categoryId]?.color;
};
