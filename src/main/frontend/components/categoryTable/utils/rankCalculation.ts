/**
 * Category Results Table - Rank Calculation Utility
 *
 * This file provides functionality to calculate rank order of categories
 * based on their BMD, BMDL, and BMDU values.
 *
 * For all rank types: Rank 1 = lowest value, Rank N = highest value
 */

import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Extended CategoryAnalysisResultDto with rank properties for all BMD types
 */
export interface CategoryAnalysisResultWithRank extends CategoryAnalysisResultDto {
  // BMD ranks
  rankByBmdMean?: number;
  rankByBmdMedian?: number;
  rankByBmdMinimum?: number;
  rankByBmdWMean?: number;

  // BMDL ranks
  rankByBmdlMean?: number;
  rankByBmdlMedian?: number;
  rankByBmdlMinimum?: number;
  rankByBmdlWMean?: number;

  // BMDU ranks
  rankByBmduMean?: number;
  rankByBmduMedian?: number;
  rankByBmduMinimum?: number;
  rankByBmduWMean?: number;
}

/**
 * Generic function to calculate ranks for a specific field
 *
 * @param data - Array of category analysis results
 * @param fieldGetter - Function to extract the value to rank by
 * @returns Map of categoryId to rank
 */
function calculateRanksForField(
  data: CategoryAnalysisResultDto[],
  fieldGetter: (item: CategoryAnalysisResultDto) => number | undefined
): Map<string, number> {
  // Filter items that have values for this field
  const withValues = data
    .map(item => ({
      categoryId: item.categoryId,
      value: fieldGetter(item),
    }))
    .filter(item => item.categoryId != null && item.value != null);

  // Sort by value (ascending: lowest value gets rank 1)
  const sorted = [...withValues].sort((a, b) => {
    const aValue = a.value || 0;
    const bValue = b.value || 0;
    return aValue - bValue;
  });

  // Create map of categoryId to rank
  const rankMap = new Map<string, number>();
  sorted.forEach((item, index) => {
    if (item.categoryId) {
      rankMap.set(item.categoryId, index + 1);
    }
  });

  return rankMap;
}

/**
 * Configuration for a single rank calculation
 */
interface RankFieldConfig {
  /** The property name in CategoryAnalysisResultWithRank where the rank will be stored */
  rankProperty: keyof CategoryAnalysisResultWithRank;
  /** Function to extract the source value from CategoryAnalysisResultDto */
  sourceField: (item: CategoryAnalysisResultDto) => number | undefined;
}

/**
 * Configuration for all rank calculations
 * This defines the mapping between source fields and rank properties.
 * Adding a new rank field only requires adding one entry to this array.
 */
const RANK_FIELD_CONFIGS: RankFieldConfig[] = [
  // BMD ranks
  { rankProperty: 'rankByBmdMean', sourceField: (item) => item.bmdMean },
  { rankProperty: 'rankByBmdMedian', sourceField: (item) => item.bmdMedian },
  { rankProperty: 'rankByBmdMinimum', sourceField: (item) => item.bmdMinimum },
  { rankProperty: 'rankByBmdWMean', sourceField: (item) => item.bmdWMean },
  // BMDL ranks
  { rankProperty: 'rankByBmdlMean', sourceField: (item) => item.bmdlMean },
  { rankProperty: 'rankByBmdlMedian', sourceField: (item) => item.bmdlMedian },
  { rankProperty: 'rankByBmdlMinimum', sourceField: (item) => item.bmdlMinimum },
  { rankProperty: 'rankByBmdlWMean', sourceField: (item) => item.bmdlWMean },
  // BMDU ranks
  { rankProperty: 'rankByBmduMean', sourceField: (item) => item.bmduMean },
  { rankProperty: 'rankByBmduMedian', sourceField: (item) => item.bmduMedian },
  { rankProperty: 'rankByBmduMinimum', sourceField: (item) => item.bmduMinimum },
  { rankProperty: 'rankByBmduWMean', sourceField: (item) => item.bmduWMean },
];

/**
 * Calculate ranks for all BMD types for the given data
 *
 * This function assigns ranks to each category for all BMD metrics:
 * - BMD: Mean, Median, Minimum, Weighted Mean
 * - BMDL: Mean, Median, Minimum, Weighted Mean
 * - BMDU: Mean, Median, Minimum, Weighted Mean
 *
 * All rankings are ascending (1 = lowest value, N = highest value)
 * Categories without a value for a specific metric receive no rank (undefined)
 *
 * Uses a configuration-driven approach to eliminate code duplication.
 *
 * @param data - Array of category analysis results
 * @returns Array of category analysis results with all rank properties added
 */
export function calculateAllBMDRanks(
  data: CategoryAnalysisResultDto[]
): CategoryAnalysisResultWithRank[] {
  // Calculate ranks for all configured fields
  const rankMaps = RANK_FIELD_CONFIGS.map(config => ({
    property: config.rankProperty,
    ranks: calculateRanksForField(data, config.sourceField),
  }));

  // Add all rank properties to each item
  return data.map(item => {
    const categoryId = item.categoryId || '';
    const result: CategoryAnalysisResultWithRank = { ...item };

    // Apply all rank values
    rankMaps.forEach(({ property, ranks }) => {
      // Type assertion: we know these properties are all optional number fields
      (result[property] as number | undefined) = ranks.get(categoryId);
    });

    return result;
  });
}
