/**
 * Utilities for initializing render state from category data
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { CategorySet, CategorySetType } from '../../types/renderState';
import { umapDataService } from '../../data/umapDataService';

/**
 * Generate a color palette for N clusters using HSL
 * This ensures good color separation regardless of cluster count
 */
function generateClusterColors(clusterCount: number): Record<number | string, string> {
  const colors: Record<number | string, string> = {};

  // Outliers always get gray
  colors[-1] = '#999999';

  // Generate colors with evenly spaced hue values
  for (let i = 0; i < clusterCount; i++) {
    const hue = (i * 360) / clusterCount;
    const saturation = 70 + (i % 3) * 10; // Vary saturation slightly for distinction
    const lightness = 45 + (i % 2) * 10;   // Vary lightness slightly
    colors[i] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  return colors;
}

/**
 * Create CategorySets for all clusters found in the category data
 *
 * @param categories - The category analysis results
 * @returns Array of CategorySet objects representing clusters
 */
export function createClusterSets(categories: CategoryAnalysisResultDto[]): CategorySet[] {
  // Group categories by cluster
  const clusterMap = new Map<number | string, string[]>();

  categories.forEach(cat => {
    if (!cat.categoryId) return;

    const umapData = umapDataService.getByGoId(cat.categoryId);
    const clusterId = umapData?.cluster_id ?? -1;

    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }
    clusterMap.get(clusterId)!.push(cat.categoryId);
  });

  // Count non-outlier clusters
  const nonOutlierClusters = Array.from(clusterMap.keys()).filter(id => id !== -1);
  const clusterCount = nonOutlierClusters.length;

  // Generate dynamic color palette
  const colorPalette = generateClusterColors(clusterCount);

  // Create CategorySet for each cluster
  const sets: CategorySet[] = [];

  clusterMap.forEach((categoryIds, clusterId) => {
    const label = clusterId === -1 ? 'Cluster Outliers' : `Cluster ${clusterId}`;

    const set: CategorySet = {
      setId: `cluster-${clusterId}`,
      type: CategorySetType.CLUSTER,
      label,
      categoryIds,
      color: colorPalette[clusterId] || '#cccccc',
      highlighted: false,
      visible: true,
      metadata: {
        clusterId: typeof clusterId === 'number' ? clusterId : parseInt(String(clusterId), 10),
      },
    };

    sets.push(set);
  });

  // Sort by cluster ID (outliers last)
  sets.sort((a, b) => {
    const aId = a.metadata.clusterId ?? -1;
    const bId = b.metadata.clusterId ?? -1;
    if (aId === -1) return 1;
    if (bId === -1) return -1;
    return aId - bId;
  });

  console.log(`[initializeRenderState] Created ${sets.length} cluster sets (${clusterCount} clusters + ${clusterMap.has(-1) ? 1 : 0} outliers)`);

  return sets;
}

/**
 * Create a master filter CategorySet
 *
 * This set contains all categories that pass the current filter criteria.
 *
 * @param categories - All category analysis results
 * @param filterCriteria - The filter criteria to apply
 * @returns A MASTER_FILTER type CategorySet
 */
export function createMasterFilterSet(
  categories: CategoryAnalysisResultDto[],
  filterCriteria: {
    minBmd?: number;
    maxBmd?: number;
    minPValue?: number;
    maxPValue?: number;
  }
): CategorySet {
  // Filter categories based on criteria
  const filteredCategoryIds = categories
    .filter(cat => {
      if (!cat.categoryId) return false;

      // Apply BMD filter
      if (filterCriteria.minBmd !== undefined && (cat.bmdMedian ?? 0) < filterCriteria.minBmd) {
        return false;
      }
      if (filterCriteria.maxBmd !== undefined && (cat.bmdMedian ?? Infinity) > filterCriteria.maxBmd) {
        return false;
      }

      // Apply p-value filter
      if (filterCriteria.minPValue !== undefined && (cat.fishersExactTwoTailPValue ?? 1) < filterCriteria.minPValue) {
        return false;
      }
      if (filterCriteria.maxPValue !== undefined && (cat.fishersExactTwoTailPValue ?? 0) > filterCriteria.maxPValue) {
        return false;
      }

      return true;
    })
    .map(cat => cat.categoryId!);

  const set: CategorySet = {
    setId: 'master-filter',
    type: CategorySetType.MASTER_FILTER,
    label: 'Filtered Categories',
    categoryIds: filteredCategoryIds,
    color: undefined, // Master filter doesn't have a specific color
    highlighted: false,
    visible: true,
    metadata: {
      filterCriteria,
    },
  };

  console.log(`[initializeRenderState] Created master filter set with ${filteredCategoryIds.length}/${categories.length} categories`);

  return set;
}

/**
 * Create CategorySets from a custom grouping scheme
 *
 * This allows for future expansion to support user-defined groupings.
 *
 * @param categories - The category analysis results
 * @param groupingFn - Function that assigns a group ID to each category
 * @param type - The type of CategorySet to create
 * @param labelFn - Function to generate label from group ID
 * @returns Array of CategorySet objects
 */
export function createCustomCategorySets(
  categories: CategoryAnalysisResultDto[],
  groupingFn: (cat: CategoryAnalysisResultDto) => string | number,
  type: CategorySetType,
  labelFn: (groupId: string | number) => string
): CategorySet[] {
  // Group categories by the grouping function
  const groupMap = new Map<string | number, string[]>();

  categories.forEach(cat => {
    if (!cat.categoryId) return;

    const groupId = groupingFn(cat);
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId)!.push(cat.categoryId);
  });

  // Generate colors dynamically
  const groupCount = groupMap.size;
  const colorPalette = generateClusterColors(groupCount);

  // Create CategorySet for each group
  const sets: CategorySet[] = [];
  let colorIndex = 0;

  groupMap.forEach((categoryIds, groupId) => {
    const set: CategorySet = {
      setId: `${type}-${groupId}`,
      type,
      label: labelFn(groupId),
      categoryIds,
      color: colorPalette[colorIndex++] || '#cccccc',
      highlighted: false,
      visible: true,
      metadata: {},
    };

    sets.push(set);
  });

  return sets;
}
