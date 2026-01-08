/**
 * Utilities for initializing render state from category data
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { CategorySet, CategorySetType } from '../../types/renderState';
import { umapDataService } from '../../data/umapDataService';
import { getClusterColor, CLUSTER_COLOR_PALETTE } from '../../components/charts/utils/clusterColors';

// Cluster ID constants (must match categoryResultsSlice)
const CLUSTER_UNCLASSIFIED = -1;  // In UMAP reference but not assigned to a cluster
const CLUSTER_NOT_IN_REF = -2;    // Not in UMAP reference data

// Color for categories not in the UMAP reference data
const NOT_IN_REF_COLOR = '#fa8c16'; // Orange/warning color

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

    let clusterId: number;
    if (!umapData) {
      // Not in UMAP reference data
      clusterId = CLUSTER_NOT_IN_REF;
    } else {
      // In reference - use cluster_id or mark as unclassified
      const rawClusterId = umapData.cluster_id;
      clusterId = typeof rawClusterId === 'number'
        ? rawClusterId
        : (rawClusterId !== undefined ? parseInt(String(rawClusterId), 10) : CLUSTER_UNCLASSIFIED);
    }

    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, []);
    }
    clusterMap.get(clusterId)!.push(cat.categoryId);
  });

  // Create CategorySet for each cluster
  const sets: CategorySet[] = [];

  clusterMap.forEach((categoryIds, clusterId) => {
    let label: string;
    let color: string;

    if (clusterId === CLUSTER_NOT_IN_REF) {
      label = 'Not in Semantic Space';
      color = NOT_IN_REF_COLOR;
    } else if (clusterId === CLUSTER_UNCLASSIFIED) {
      label = 'Unclassified';
      color = getClusterColor(clusterId); // Uses OUTLIER_COLOR from clusterColors.ts
    } else {
      label = `Cluster ${clusterId}`;
      // Use getClusterColor() for consistent colors with charts
      color = getClusterColor(clusterId);
    }

    const set: CategorySet = {
      setId: `cluster-${clusterId}`,
      type: CategorySetType.CLUSTER,
      label,
      categoryIds,
      color,
      visible: true,
      metadata: {
        clusterId: typeof clusterId === 'number' ? clusterId : parseInt(String(clusterId), 10),
      },
    };

    sets.push(set);
  });

  // Sort by cluster ID: normal clusters first (0+), then unclassified (-1), then not-in-ref (-2)
  sets.sort((a, b) => {
    const aId = a.metadata.clusterId ?? CLUSTER_UNCLASSIFIED;
    const bId = b.metadata.clusterId ?? CLUSTER_UNCLASSIFIED;
    // Put negative IDs last, with -2 after -1
    if (aId >= 0 && bId >= 0) return aId - bId;
    if (aId >= 0) return -1;  // a is normal, goes first
    if (bId >= 0) return 1;   // b is normal, goes first
    // Both negative: -1 before -2
    return bId - aId;
  });

  const actualClusterCount = sets.filter(s => s.metadata.clusterId >= 0).length;
  const notInRefCount = clusterMap.has(CLUSTER_NOT_IN_REF) ? clusterMap.get(CLUSTER_NOT_IN_REF)!.length : 0;
  const unclassifiedCount = clusterMap.has(CLUSTER_UNCLASSIFIED) ? clusterMap.get(CLUSTER_UNCLASSIFIED)!.length : 0;
  console.log(`[initializeRenderState] Created ${sets.length} cluster sets (${actualClusterCount} clusters, ${unclassifiedCount} unclassified, ${notInRefCount} not in reference)`);

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
export function createPrimaryFilterSet(
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

  // Create CategorySet for each group using shared color palette
  const sets: CategorySet[] = [];
  let colorIndex = 0;

  groupMap.forEach((categoryIds, groupId) => {
    const set: CategorySet = {
      setId: `${type}-${groupId}`,
      type,
      label: labelFn(groupId),
      categoryIds,
      color: CLUSTER_COLOR_PALETTE[colorIndex % CLUSTER_COLOR_PALETTE.length],
      visible: true,
      metadata: {},
    };

    sets.push(set);
    colorIndex++;
  });

  return sets;
}
