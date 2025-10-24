// selectionBridge.ts
// Utilities to translate between category and cluster selections
// Phase 4: Chart Reactivity Infrastructure

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { selectCategoryDataWithUmap } from './umapIntegration';

/**
 * Selector that returns all category IDs in the selected clusters
 *
 * When clusters are selected, this returns which categories should be highlighted.
 * Enables cluster → category reactivity.
 *
 * @example
 * // User clicks cluster 5 in UMAP
 * // This selector returns all categoryIds in cluster 5
 * const categoryIds = useAppSelector(selectCategoriesInClusters);
 */
export const selectCategoriesInClusters = createSelector(
  [
    (state: RootState) => state.categoryResults.reactiveSelection.cluster.selectedIds,
    selectCategoryDataWithUmap,
  ],
  (clusterIds, categoriesWithUmap) => {
    if (clusterIds.size === 0) return [];

    // Return all categories in the selected clusters
    return categoriesWithUmap
      .filter((cat) => cat.cluster_id !== undefined && clusterIds.has(cat.cluster_id))
      .map((cat) => cat.categoryId)
      .filter(Boolean) as string[];
  }
);

/**
 * Selector that returns cluster IDs containing any selected categories
 *
 * When categories are selected, this returns which clusters should be highlighted.
 * Enables category → cluster reactivity.
 *
 * @example
 * // User selects some categories in table
 * // This selector returns which clusters contain those categories
 * const clusterIds = useAppSelector(selectClustersOfCategories);
 */
export const selectClustersOfCategories = createSelector(
  [
    (state: RootState) => state.categoryResults.reactiveSelection.category.selectedIds,
    selectCategoryDataWithUmap,
  ],
  (categoryIds, categoriesWithUmap) => {
    if (categoryIds.size === 0) return new Set<number | string>();

    // Return clusters containing any selected categories
    const clusters = new Set<number | string>();
    categoriesWithUmap.forEach((cat) => {
      if (
        cat.categoryId &&
        categoryIds.has(cat.categoryId) &&
        cat.cluster_id !== undefined
      ) {
        clusters.add(cat.cluster_id);
      }
    });

    return clusters;
  }
);

/**
 * Check if a category ID should be highlighted based on cluster selection
 *
 * @param categoryId - Category ID to check
 * @param selectedClusterIds - Currently selected cluster IDs
 * @param categoryData - Category data with UMAP info
 * @returns true if category is in a selected cluster
 */
export function isCategoryInSelectedCluster(
  categoryId: string,
  selectedClusterIds: Set<number | string>,
  categoryData: Array<{ categoryId?: string; cluster_id?: number | string }>
): boolean {
  if (selectedClusterIds.size === 0) return false;

  const category = categoryData.find((cat) => cat.categoryId === categoryId);
  if (!category || category.cluster_id === undefined) return false;

  return selectedClusterIds.has(category.cluster_id);
}

/**
 * Check if a cluster should be highlighted based on category selection
 *
 * @param clusterId - Cluster ID to check
 * @param selectedCategoryIds - Currently selected category IDs
 * @param categoryData - Category data with UMAP info
 * @returns true if any selected category is in this cluster
 */
export function isClusterContainingSelectedCategory(
  clusterId: number | string,
  selectedCategoryIds: Set<string>,
  categoryData: Array<{ categoryId?: string; cluster_id?: number | string }>
): boolean {
  if (selectedCategoryIds.size === 0) return false;

  return categoryData.some(
    (cat) =>
      cat.cluster_id === clusterId &&
      cat.categoryId &&
      selectedCategoryIds.has(cat.categoryId)
  );
}

/**
 * Get combined selection state for a category
 * Returns true if selected by either category or cluster selection
 *
 * @param categoryId - Category ID to check
 * @param categorySelectedIds - Direct category selections
 * @param clusterSelectedIds - Cluster selections
 * @param categoryData - Category data with UMAP info
 * @returns true if category should be highlighted
 */
export function isCategorySelected(
  categoryId: string,
  categorySelectedIds: Set<string>,
  clusterSelectedIds: Set<number | string>,
  categoryData: Array<{ categoryId?: string; cluster_id?: number | string }>
): boolean {
  // Direct category selection
  if (categorySelectedIds.has(categoryId)) return true;

  // Indirect via cluster selection
  return isCategoryInSelectedCluster(categoryId, clusterSelectedIds, categoryData);
}
