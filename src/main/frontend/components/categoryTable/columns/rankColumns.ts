/**
 * Category Results Table - Rank Columns
 *
 * This file contains column definitions for BMD rank values.
 * Ranks are calculated on-the-fly based on filtered data.
 * Rank 1 = lowest value, Rank N = highest value.
 *
 * Uses a generic column generator to eliminate code duplication.
 */

import type { ColumnsType } from 'antd/es/table';
import type { CategoryAnalysisResultWithRank } from '../utils/rankCalculation';

/**
 * Configuration for a rank column group
 */
interface RankColumnConfig {
  /** Display title for the column group */
  title: string;
  /** Prefix for the rank property names (e.g., 'rankByBmd', 'rankByBmdl') */
  propertyPrefix: string;
}

/**
 * Configuration for individual rank columns within a group
 */
interface RankSubColumn {
  /** Display title for the column */
  title: string;
  /** Property suffix (e.g., 'Mean', 'Median', 'Minimum', 'WMean') */
  propertySuffix: string;
}

/**
 * Reusable sub-column definitions for all rank groups
 */
const RANK_SUB_COLUMNS: RankSubColumn[] = [
  { title: 'Mean', propertySuffix: 'Mean' },
  { title: 'Median', propertySuffix: 'Median' },
  { title: 'Min', propertySuffix: 'Minimum' },
  { title: 'W.Mean', propertySuffix: 'WMean' },
];

/**
 * Generic function to create rank columns for any BMD type
 *
 * This eliminates duplication by using configuration to generate
 * column definitions for BMD, BMDL, and BMDU ranks.
 *
 * @param config - Configuration specifying the title and property prefix
 * @returns Array of rank column definitions
 */
function createRankColumns(config: RankColumnConfig): ColumnsType<CategoryAnalysisResultWithRank> {
  return [
    {
      title: config.title,
      children: RANK_SUB_COLUMNS.map(subCol => {
        const dataIndex = `${config.propertyPrefix}${subCol.propertySuffix}` as keyof CategoryAnalysisResultWithRank;
        return {
          title: subCol.title,
          dataIndex,
          key: dataIndex,
          width: 50,
          align: 'center' as const,
          sorter: (a: CategoryAnalysisResultWithRank, b: CategoryAnalysisResultWithRank) => {
            const aValue = a[dataIndex] as number | undefined;
            const bValue = b[dataIndex] as number | undefined;
            return (aValue || Infinity) - (bValue || Infinity);
          },
        };
      }),
    },
  ];
}

/**
 * Get BMD rank columns
 *
 * Displays ranks for BMD Mean, Median, Minimum, and Weighted Mean.
 *
 * @returns Array of BMD rank column definitions
 */
export function getBMDRankColumns(): ColumnsType<CategoryAnalysisResultWithRank> {
  return createRankColumns({
    title: 'BMD Ranks',
    propertyPrefix: 'rankByBmd',
  });
}

/**
 * Get BMDL rank columns
 *
 * Displays ranks for BMDL Mean, Median, Minimum, and Weighted Mean.
 *
 * @returns Array of BMDL rank column definitions
 */
export function getBMDLRankColumns(): ColumnsType<CategoryAnalysisResultWithRank> {
  return createRankColumns({
    title: 'BMDL Ranks',
    propertyPrefix: 'rankByBmdl',
  });
}

/**
 * Get BMDU rank columns
 *
 * Displays ranks for BMDU Mean, Median, Minimum, and Weighted Mean.
 *
 * @returns Array of BMDU rank column definitions
 */
export function getBMDURankColumns(): ColumnsType<CategoryAnalysisResultWithRank> {
  return createRankColumns({
    title: 'BMDU Ranks',
    propertyPrefix: 'rankByBmdu',
  });
}
