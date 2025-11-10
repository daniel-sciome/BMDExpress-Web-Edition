/**
 * Cluster Color Utilities
 *
 * Centralized management of cluster color assignments for consistent
 * coloring across all chart components.
 */

import { useMemo } from 'react';
import { umapDataService } from 'Frontend/data/umapDataService';

/**
 * Standard color palette for cluster visualization
 * Uses a perceptually distinct color set for up to 40 clusters
 */
export const CLUSTER_COLOR_PALETTE = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
  '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
  '#393b79', '#637939', '#8c6d31', '#843c39', '#7b4173',
  '#5254a3', '#8ca252', '#bd9e39', '#ad494a', '#a55194',
  '#6b6ecf', '#b5cf6b', '#e7ba52', '#d6616b', '#ce6dbd',
  '#9c9ede', '#cedb9c', '#e7cb94', '#e7969c', '#de9ed6'
] as const;

/**
 * Color for outlier cluster (cluster ID = -1)
 */
export const OUTLIER_COLOR = '#999999';

/**
 * Get color for a specific cluster ID
 *
 * @param clusterId - The cluster ID to get color for
 * @returns Hex color string
 */
export function getClusterColor(clusterId: number | string): string {
  if (clusterId === -1) {
    return OUTLIER_COLOR;
  }

  const clusterIds = umapDataService.getAllClusterIds();
  const index = clusterIds.indexOf(clusterId);

  if (index === -1) {
    // Cluster not found, return outlier color
    return OUTLIER_COLOR;
  }

  return CLUSTER_COLOR_PALETTE[index % CLUSTER_COLOR_PALETTE.length];
}

/**
 * React hook to get cluster color mapping (memoized)
 *
 * Returns a map of cluster ID -> color for all clusters in the dataset.
 * The mapping is memoized and will only be recalculated if cluster data changes.
 *
 * @returns Record mapping cluster IDs to color strings
 *
 * @example
 * const clusterColors = useClusterColors();
 * const color = clusterColors[categoryClusterId];
 */
export function useClusterColors(): Record<string | number, string> {
  return useMemo(() => {
    const clusters = umapDataService.getAllClusterIds();
    const colors: Record<string | number, string> = {};

    clusters.forEach((clusterId, index) => {
      if (clusterId === -1) {
        colors[clusterId] = OUTLIER_COLOR;
      } else {
        colors[clusterId] = CLUSTER_COLOR_PALETTE[index % CLUSTER_COLOR_PALETTE.length];
      }
    });

    return colors;
  }, []);
}

/**
 * Get a human-readable label for a cluster ID
 *
 * @param clusterId - The cluster ID
 * @returns Label string (e.g., "Cluster 0" or "Outliers")
 */
export function getClusterLabel(clusterId: number | string): string {
  return clusterId === -1 ? 'Outliers' : `Cluster ${clusterId}`;
}

/**
 * Get the cluster ID for a given category ID
 *
 * Looks up the category in the UMAP data service and returns its cluster assignment.
 * Returns -1 if the category is not found (treated as outlier).
 *
 * @param categoryId - The GO category ID to look up
 * @returns Cluster ID (number), or -1 for outliers/not found
 *
 * @example
 * const clusterId = getClusterIdForCategory('GO:0008150');
 * const color = getClusterColor(clusterId);
 */
export function getClusterIdForCategory(categoryId: string | undefined | null): number {
  if (!categoryId) {
    return -1;
  }

  const umapItem = umapDataService.getByGoId(categoryId);
  const clusterId = umapItem?.cluster_id;

  // Ensure we always return a number
  if (clusterId === undefined || clusterId === null) {
    return -1;
  }

  return typeof clusterId === 'string' ? parseInt(clusterId, 10) : clusterId;
}
