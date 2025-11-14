/**
 * Render State Slice
 *
 * Manages visualization state for categories and category sets.
 * This is separate from the business domain data and focuses on
 * presentation concerns like highlighting, filtering, and grouping.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import {
  CategoryRenderState,
  CategorySet,
  CategorySetType,
  RenderState,
} from '../../types/renderState';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

const initialState: RenderState = {
  categories: {
    byId: {},
    allIds: [],
  },
  categorySets: {
    byId: {},
    allIds: [],
    byType: {
      [CategorySetType.CLUSTER]: [],
      [CategorySetType.CUSTOM]: [],
      [CategorySetType.MASTER_FILTER]: [],
    },
  },
};

export const renderStateSlice = createSlice({
  name: 'renderState',
  initialState,
  reducers: {
    /**
     * Initialize render state from category data
     */
    initializeCategories: (state, action: PayloadAction<CategoryAnalysisResultDto[]>) => {
      const categories = action.payload;

      state.categories.byId = {};
      state.categories.allIds = [];

      categories.forEach(cat => {
        if (!cat.categoryId) return;

        const renderState: CategoryRenderState = {
          categoryId: cat.categoryId,
          category: cat,
          setIds: [],
          highlighted: false,
          filtered: true, // Initially passes all filters
          reactive: true, // Initially participates in reactivity
        };

        state.categories.byId[cat.categoryId] = renderState;
        state.categories.allIds.push(cat.categoryId);
      });
    },

    /**
     * Add or update a category set
     */
    upsertCategorySet: (state, action: PayloadAction<CategorySet>) => {
      const set = action.payload;

      // Add to byId
      state.categorySets.byId[set.setId] = set;

      // Add to allIds if new
      if (!state.categorySets.allIds.includes(set.setId)) {
        state.categorySets.allIds.push(set.setId);
      }

      // Add to byType
      const typeArray = state.categorySets.byType[set.type];
      if (!typeArray.includes(set.setId)) {
        typeArray.push(set.setId);
      }

      // Update category setIds
      set.categoryIds.forEach(catId => {
        const category = state.categories.byId[catId];
        if (category && !category.setIds.includes(set.setId)) {
          category.setIds.push(set.setId);
        }
      });
    },

    /**
     * Remove a category set
     */
    removeCategorySet: (state, action: PayloadAction<string>) => {
      const setId = action.payload;
      const set = state.categorySets.byId[setId];

      if (!set) return;

      // Remove from categories
      set.categoryIds.forEach(catId => {
        const category = state.categories.byId[catId];
        if (category) {
          category.setIds = category.setIds.filter(id => id !== setId);
        }
      });

      // Remove from byType
      const typeArray = state.categorySets.byType[set.type];
      const typeIndex = typeArray.indexOf(setId);
      if (typeIndex !== -1) {
        typeArray.splice(typeIndex, 1);
      }

      // Remove from allIds
      const allIndex = state.categorySets.allIds.indexOf(setId);
      if (allIndex !== -1) {
        state.categorySets.allIds.splice(allIndex, 1);
      }

      // Remove from byId
      delete state.categorySets.byId[setId];
    },

    /**
     * Highlight specific categories
     */
    highlightCategories: (state, action: PayloadAction<{ categoryIds: string[]; replace?: boolean }>) => {
      const { categoryIds, replace = true } = action.payload;

      // Clear existing highlights if replacing
      if (replace) {
        Object.values(state.categories.byId).forEach(cat => {
          cat.highlighted = false;
        });
        Object.values(state.categorySets.byId).forEach(set => {
          set.highlighted = false;
        });
      }

      // Set new highlights
      categoryIds.forEach(catId => {
        const category = state.categories.byId[catId];
        if (category) {
          category.highlighted = true;

          // Also highlight any sets this category belongs to
          category.setIds.forEach(setId => {
            const set = state.categorySets.byId[setId];
            if (set) {
              set.highlighted = true;
            }
          });
        }
      });
    },

    /**
     * Highlight a category set (and all its categories)
     */
    highlightCategorySet: (state, action: PayloadAction<{ setId: string; replace?: boolean }>) => {
      const { setId, replace = true } = action.payload;
      const set = state.categorySets.byId[setId];

      if (!set) return;

      // Clear existing highlights if replacing
      if (replace) {
        Object.values(state.categories.byId).forEach(cat => {
          cat.highlighted = false;
        });
        Object.values(state.categorySets.byId).forEach(s => {
          s.highlighted = false;
        });
      }

      // Highlight the set
      set.highlighted = true;

      // Highlight all categories in the set
      set.categoryIds.forEach(catId => {
        const category = state.categories.byId[catId];
        if (category) {
          category.highlighted = true;
        }
      });
    },

    /**
     * Clear all highlights
     */
    clearHighlights: (state) => {
      Object.values(state.categories.byId).forEach(cat => {
        cat.highlighted = false;
      });
      Object.values(state.categorySets.byId).forEach(set => {
        set.highlighted = false;
      });
    },

    /**
     * Update filtered status for categories
     */
    updateFilteredStatus: (state, action: PayloadAction<{ categoryId: string; filtered: boolean }[]>) => {
      action.payload.forEach(({ categoryId, filtered }) => {
        const category = state.categories.byId[categoryId];
        if (category) {
          category.filtered = filtered;
        }
      });
    },

    /**
     * Set reactive status for categories
     */
    setReactiveStatus: (state, action: PayloadAction<{ categoryIds: string[]; reactive: boolean }>) => {
      const { categoryIds, reactive } = action.payload;
      categoryIds.forEach(catId => {
        const category = state.categories.byId[catId];
        if (category) {
          category.reactive = reactive;
        }
      });
    },
  },
});

export const {
  initializeCategories,
  upsertCategorySet,
  removeCategorySet,
  highlightCategories,
  highlightCategorySet,
  clearHighlights,
  updateFilteredStatus,
  setReactiveStatus,
} = renderStateSlice.actions;

// Selectors
export const selectRenderState = (state: RootState) => state.renderState;

export const selectAllCategories = (state: RootState) =>
  state.renderState.categories.allIds.map(id => state.renderState.categories.byId[id]);

export const selectHighlightedCategories = (state: RootState) =>
  selectAllCategories(state).filter(cat => cat.highlighted);

export const selectFilteredCategories = (state: RootState) =>
  selectAllCategories(state).filter(cat => cat.filtered);

export const selectDisplayCategories = (state: RootState) =>
  selectAllCategories(state).filter(cat => cat.filtered && cat.reactive);

export const selectCategorySet = (setId: string) => (state: RootState) =>
  state.renderState.categorySets.byId[setId];

export const selectCategorySetsByType = (type: CategorySetType) => (state: RootState) =>
  state.renderState.categorySets.byType[type].map(id => state.renderState.categorySets.byId[id]);

export const selectHighlightedCategorySets = (state: RootState) =>
  state.renderState.categorySets.allIds
    .map(id => state.renderState.categorySets.byId[id])
    .filter(set => set.highlighted);

export const selectHasAnyHighlights = (state: RootState) =>
  selectHighlightedCategories(state).length > 0;

export default renderStateSlice.reducer;
