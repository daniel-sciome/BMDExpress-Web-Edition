import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type {
  VisibilityState,
  SizeState,
  CategoryVisualState,
  VisualStyleMapping,
} from '../../types/visibilityTypes';
import { getOpacityForVisibility, getScaleForSize } from '../../types/visibilityTypes';

/**
 * Advanced memoized selectors for visibility state.
 * These selectors combine visibility state with category data for efficient rendering.
 */

// Base selectors (re-exported from visibilitySlice for convenience)
export const selectVisibilityDefaults = (state: RootState) => state.visibility.defaults;
export const selectVisibilityOverrides = (state: RootState) => state.visibility.overrides;
export const selectHighlightedIds = (state: RootState) => state.visibility.highlightedIds;
export const selectDisplayMode = (state: RootState) => state.visibility.displayMode;

// Base selector for category data
const selectCategoryData = (state: RootState) => state.categoryResults.data;

/**
 * Get the count of highlighted categories.
 */
export const selectHighlightedCount = createSelector(
  [selectHighlightedIds],
  (highlightedIds) => highlightedIds.size
);

/**
 * Check if any categories are highlighted.
 */
export const selectHasHighlights = createSelector(
  [selectHighlightedIds],
  (highlightedIds) => highlightedIds.size > 0
);

/**
 * Get all pinned category IDs.
 */
export const selectPinnedIds = createSelector(
  [selectVisibilityOverrides],
  (overrides) => {
    const pinnedIds = new Set<string>();
    for (const [id, override] of Object.entries(overrides)) {
      if (override.pinned) {
        pinnedIds.add(id);
      }
    }
    return pinnedIds;
  }
);

/**
 * Get count of pinned categories.
 */
export const selectPinnedCount = createSelector(
  [selectPinnedIds],
  (pinnedIds) => pinnedIds.size
);

/**
 * Get the effective visibility state for a specific category.
 * This is a selector factory - call with categoryId to get a selector.
 */
export const makeSelectCategoryVisibility = (categoryId: string) =>
  createSelector(
    [selectVisibilityDefaults, selectVisibilityOverrides],
    (defaults, overrides): VisibilityState => {
      return overrides[categoryId]?.visibility ?? defaults.visibility;
    }
  );

/**
 * Get the effective size state for a specific category.
 */
export const makeSelectCategorySize = (categoryId: string) =>
  createSelector(
    [selectVisibilityDefaults, selectVisibilityOverrides],
    (defaults, overrides): SizeState => {
      return overrides[categoryId]?.size ?? defaults.size;
    }
  );

/**
 * Get the complete visual state for a category.
 */
export const makeSelectCategoryVisualState = (categoryId: string) =>
  createSelector(
    [selectVisibilityDefaults, selectVisibilityOverrides],
    (defaults, overrides): CategoryVisualState => {
      const override = overrides[categoryId] || {};
      return {
        categoryId,
        visibility: override.visibility ?? defaults.visibility,
        size: override.size ?? defaults.size,
        color: override.color,
        pinned: override.pinned ?? false,
      };
    }
  );

/**
 * Get CSS style mapping for a visibility state.
 */
export function getVisualStyleMapping(
  visibility: VisibilityState,
  size: SizeState,
  color?: string
): VisualStyleMapping {
  const opacity = getOpacityForVisibility(visibility);
  const scale = getScaleForSize(size);

  return {
    opacity,
    strokeWidth: visibility === 'highlighted' ? 2 : 1,
    strokeColor: visibility === 'highlighted' ? '#000' : 'transparent',
    fillOpacity: opacity * 0.8,
    scale,
    display: visibility === 'hidden' ? 'none' : 'block',
  };
}

/**
 * Get visual states for all categories in the current data.
 * Returns a Map of categoryId -> CategoryVisualState for efficient lookups.
 */
export const selectAllCategoryVisualStates = createSelector(
  [selectCategoryData, selectVisibilityDefaults, selectVisibilityOverrides],
  (data, defaults, overrides): Map<string, CategoryVisualState> => {
    const result = new Map<string, CategoryVisualState>();

    for (const category of data) {
      const categoryId = category.categoryId;
      if (!categoryId) continue;

      const override = overrides[categoryId] || {};
      result.set(categoryId, {
        categoryId,
        visibility: override.visibility ?? defaults.visibility,
        size: override.size ?? defaults.size,
        color: override.color,
        pinned: override.pinned ?? false,
      });
    }

    return result;
  }
);

/**
 * Get categories sorted by visibility priority.
 * Order: hidden -> dimmed -> normal -> highlighted
 * This ensures highlighted items render on top in charts.
 */
export const selectCategoriesByVisibilityOrder = createSelector(
  [selectCategoryData, selectAllCategoryVisualStates],
  (data, visualStates): CategoryAnalysisResultDto[] => {
    const visibilityOrder: Record<VisibilityState, number> = {
      hidden: 0,
      dimmed: 1,
      normal: 2,
      highlighted: 3,
    };

    return [...data].sort((a, b) => {
      const aState = visualStates.get(a.categoryId || '');
      const bState = visualStates.get(b.categoryId || '');
      const aOrder = visibilityOrder[aState?.visibility ?? 'normal'];
      const bOrder = visibilityOrder[bState?.visibility ?? 'normal'];
      return aOrder - bOrder;
    });
  }
);

/**
 * Get only visible categories (not hidden).
 */
export const selectVisibleCategories = createSelector(
  [selectCategoryData, selectAllCategoryVisualStates],
  (data, visualStates): CategoryAnalysisResultDto[] => {
    return data.filter(category => {
      const state = visualStates.get(category.categoryId || '');
      return state?.visibility !== 'hidden';
    });
  }
);

/**
 * Get only highlighted categories.
 */
export const selectHighlightedCategories = createSelector(
  [selectCategoryData, selectHighlightedIds],
  (data, highlightedIds): CategoryAnalysisResultDto[] => {
    return data.filter(category => highlightedIds.has(category.categoryId || ''));
  }
);

/**
 * Get categories with custom colors.
 */
export const selectCategoriesWithCustomColors = createSelector(
  [selectCategoryData, selectVisibilityOverrides],
  (data, overrides): CategoryAnalysisResultDto[] => {
    return data.filter(category => {
      const override = overrides[category.categoryId || ''];
      return override?.color !== undefined;
    });
  }
);

/**
 * Create a lookup function for category visibility.
 * More efficient for repeated lookups than individual selectors.
 */
export const selectVisibilityLookup = createSelector(
  [selectVisibilityDefaults, selectVisibilityOverrides],
  (defaults, overrides) => {
    return (categoryId: string): VisibilityState => {
      return overrides[categoryId]?.visibility ?? defaults.visibility;
    };
  }
);

/**
 * Create a lookup function for category visual state.
 */
export const selectVisualStateLookup = createSelector(
  [selectVisibilityDefaults, selectVisibilityOverrides],
  (defaults, overrides) => {
    return (categoryId: string): CategoryVisualState => {
      const override = overrides[categoryId] || {};
      return {
        categoryId,
        visibility: override.visibility ?? defaults.visibility,
        size: override.size ?? defaults.size,
        color: override.color,
        pinned: override.pinned ?? false,
      };
    };
  }
);

/**
 * Get statistics about current visibility state.
 */
export const selectVisibilityStats = createSelector(
  [selectCategoryData, selectAllCategoryVisualStates],
  (data, visualStates) => {
    const stats = {
      total: data.length,
      highlighted: 0,
      normal: 0,
      dimmed: 0,
      hidden: 0,
      pinned: 0,
      withCustomColor: 0,
    };

    for (const category of data) {
      const state = visualStates.get(category.categoryId || '');
      if (!state) continue;

      switch (state.visibility) {
        case 'highlighted':
          stats.highlighted++;
          break;
        case 'normal':
          stats.normal++;
          break;
        case 'dimmed':
          stats.dimmed++;
          break;
        case 'hidden':
          stats.hidden++;
          break;
      }

      if (state.pinned) stats.pinned++;
      if (state.color) stats.withCustomColor++;
    }

    return stats;
  }
);
