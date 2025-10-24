// umapIntegration.ts
// Redux selectors for joining category analysis data with UMAP coordinates
// Phase 2: UMAP Data Integration

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { umapDataService } from 'Frontend/data/umapDataService';
import type { CategoryWithUmap } from 'Frontend/types/categoryTypes';
import { selectFilteredData } from './categoryResultsSlice';

/**
 * Selector that enriches category results with UMAP coordinates
 *
 * Joins category analysis data with UMAP reference data by GO ID (categoryId).
 * Returns array of CategoryWithUmap objects with umap_x, umap_y, cluster_id, and hasUmapData.
 *
 * Performance: Memoized with createSelector - only recomputes when filtered data changes.
 * Uses O(1) lookup via umapDataService for efficient joins.
 */
export const selectCategoryDataWithUmap = createSelector(
  [selectFilteredData],
  (categories): CategoryWithUmap[] => {
    return categories.map(category => {
      const categoryId = category.categoryId;

      // Try to find UMAP data for this category
      const umapData = categoryId ? umapDataService.getByGoId(categoryId) : undefined;

      if (umapData) {
        // Category has UMAP coordinates
        return {
          ...category,
          umap_x: umapData.UMAP_1,
          umap_y: umapData.UMAP_2,
          cluster_id: umapData.cluster_id,
          hasUmapData: true,
        };
      } else {
        // Category does not have UMAP data
        return {
          ...category,
          umap_x: undefined,
          umap_y: undefined,
          cluster_id: undefined,
          hasUmapData: false,
        };
      }
    });
  }
);

/**
 * Selector that returns only categories that have UMAP data
 * Useful for filtering to GO BP terms that exist in UMAP reference
 */
export const selectCategoriesWithUmapOnly = createSelector(
  [selectCategoryDataWithUmap],
  (categories): CategoryWithUmap[] => {
    return categories.filter(cat => cat.hasUmapData);
  }
);

/**
 * Selector that returns statistics about UMAP coverage
 */
export const selectUmapCoverageStats = createSelector(
  [selectCategoryDataWithUmap],
  (categories) => {
    const total = categories.length;
    const withUmap = categories.filter(cat => cat.hasUmapData).length;
    const withoutUmap = total - withUmap;
    const coveragePercent = total > 0 ? Math.round((withUmap / total) * 100) : 0;

    return {
      total,
      withUmap,
      withoutUmap,
      coveragePercent,
    };
  }
);

/**
 * Selector that groups categories by UMAP cluster
 * Returns a Map of cluster_id -> CategoryWithUmap[]
 */
export const selectCategoriesByCluster = createSelector(
  [selectCategoriesWithUmapOnly],
  (categories): Map<number | string, CategoryWithUmap[]> => {
    const clusterMap = new Map<number | string, CategoryWithUmap[]>();

    categories.forEach(category => {
      if (category.cluster_id !== undefined) {
        const clusterId = category.cluster_id;
        if (!clusterMap.has(clusterId)) {
          clusterMap.set(clusterId, []);
        }
        clusterMap.get(clusterId)!.push(category);
      }
    });

    return clusterMap;
  }
);
