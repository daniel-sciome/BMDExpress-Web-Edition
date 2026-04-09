/**
 * useClusterTypeSplit Hook
 *
 * Provides data split by cluster type for histograms:
 * - Clustered: categories with clusterId >= 0 (assigned to numbered clusters)
 * - Unclassified: categories with clusterId = -1 (in UMAP reference but not clustered)
 * - Not in Reference: categories with clusterId = -2 (not in UMAP reference)
 *
 * Used by MeanHistograms and MedianHistograms to show stacked bars by cluster type.
 */

import { useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectSortedDataWithFocus } from '../../../store/slices/categoryResultsSlice';
import type { CategoryWithFocus } from '../../../types/categoryTypes';
import { useDatasetContext, type CategoryDataRow } from '../../../context/DatasetContext';

// Cluster ID constants
export const CLUSTER_NOT_IN_REF = -2;
export const CLUSTER_UNCLASSIFIED = -1;

/**
 * Colors for each cluster type in histograms
 */
export const CLUSTER_TYPE_COLORS = {
  clustered: '#52c41a',      // Green - in a cluster
  unclassified: '#faad14',   // Orange/Yellow - unclassified
  notInReference: '#8c8c8c', // Gray - not in reference
} as const;

/**
 * Labels for each cluster type
 */
export const CLUSTER_TYPE_LABELS = {
  clustered: 'Clustered',
  unclassified: 'Unclassified',
  notInReference: 'Not in Reference',
} as const;

/**
 * Result returned by the useClusterTypeSplit hook
 */
export interface ClusterTypeSplitResult {
  /** All data with inFocus and clusterId */
  allData: CategoryWithFocus[];
  /** Categories in numbered clusters (clusterId >= 0) */
  clustered: CategoryWithFocus[];
  /** Categories unclassified (clusterId = -1) */
  unclassified: CategoryWithFocus[];
  /** Categories not in reference (clusterId = -2) */
  notInReference: CategoryWithFocus[];
  /** Colors for each type */
  colors: typeof CLUSTER_TYPE_COLORS;
  /** Labels for each type */
  labels: typeof CLUSTER_TYPE_LABELS;
  /** Total count */
  totalCount: number;
  /** Counts by type */
  counts: {
    clustered: number;
    unclassified: number;
    notInReference: number;
  };
}

/**
 * Hook that splits category data by cluster type.
 *
 * Usage:
 * ```tsx
 * const { clustered, unclassified, notInReference, colors } = useClusterTypeSplit();
 *
 * // Create stacked histogram traces
 * const traces = [
 *   { x: clustered.map(c => c.bmdMean), name: 'Clustered', marker: { color: colors.clustered } },
 *   { x: unclassified.map(c => c.bmdMean), name: 'Unclassified', marker: { color: colors.unclassified } },
 *   { x: notInReference.map(c => c.bmdMean), name: 'Not in Reference', marker: { color: colors.notInReference } },
 * ];
 * ```
 */
export function useClusterTypeSplit(): ClusterTypeSplitResult {
  // Use DatasetContext data if available, otherwise fall back to Redux.
  // Both sources provide data with clusterId — context via CategoryDataRow,
  // Redux via CategoryAnalysisResultWithCluster & CategoryWithFocus.
  const datasetCtx = useDatasetContext();
  const reduxData = useAppSelector(selectSortedDataWithFocus);
  const allData: CategoryDataRow[] = datasetCtx ? datasetCtx.data : reduxData;

  const split = useMemo(() => {
    const clustered: CategoryWithFocus[] = [];
    const unclassified: CategoryWithFocus[] = [];
    const notInReference: CategoryWithFocus[] = [];

    allData.forEach(category => {
      const clusterId = category.clusterId;

      if (clusterId === undefined || clusterId === CLUSTER_NOT_IN_REF) {
        notInReference.push(category);
      } else if (clusterId === CLUSTER_UNCLASSIFIED) {
        unclassified.push(category);
      } else {
        // clusterId >= 0 means assigned to a numbered cluster
        clustered.push(category);
      }
    });

    return { clustered, unclassified, notInReference };
  }, [allData]);

  return useMemo(
    () => ({
      allData,
      ...split,
      colors: CLUSTER_TYPE_COLORS,
      labels: CLUSTER_TYPE_LABELS,
      totalCount: allData.length,
      counts: {
        clustered: split.clustered.length,
        unclassified: split.unclassified.length,
        notInReference: split.notInReference.length,
      },
    }),
    [allData, split]
  );
}

export default useClusterTypeSplit;
