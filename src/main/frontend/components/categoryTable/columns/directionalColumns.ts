/**
 * Category Results Table - Directional Analysis Columns
 *
 * This file contains column definitions for directional gene analysis,
 * including statistics for up-regulated genes, down-regulated genes,
 * and overall directional analysis.
 *
 * Uses a generic column generator to eliminate code duplication.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Configuration for directional column statistics
 */
interface DirectionalStatConfig {
  key: string;
  title: string;
  statType: 'Mean' | 'Median' | 'SD';
  bmdType: 'BMD' | 'BMDL' | 'BMDU';
}

/**
 * Standard statistics to display for directional analysis
 */
const DIRECTIONAL_STATS: DirectionalStatConfig[] = [
  { key: 'bmdMean', title: 'BMD Mean', statType: 'Mean', bmdType: 'BMD' },
  { key: 'bmdMedian', title: 'BMD Median', statType: 'Median', bmdType: 'BMD' },
  { key: 'bmdSD', title: 'BMD SD', statType: 'SD', bmdType: 'BMD' },
  { key: 'bmdlMean', title: 'BMDL Mean', statType: 'Mean', bmdType: 'BMDL' },
  { key: 'bmdlMedian', title: 'BMDL Median', statType: 'Median', bmdType: 'BMDL' },
  { key: 'bmdlSD', title: 'BMDL SD', statType: 'SD', bmdType: 'BMDL' },
  { key: 'bmduMean', title: 'BMDU Mean', statType: 'Mean', bmdType: 'BMDU' },
  { key: 'bmduMedian', title: 'BMDU Median', statType: 'Median', bmdType: 'BMDU' },
  { key: 'bmduSD', title: 'BMDU SD', statType: 'SD', bmdType: 'BMDU' },
];

/**
 * Generic function to create directional columns for Up or Down regulation
 *
 * Eliminates code duplication by generating columns based on direction parameter.
 *
 * @param direction - 'Up' or 'Down' regulation
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of directional column definitions
 */
function createDirectionalColumns(
  direction: 'Up' | 'Down',
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  const title = `${direction.toUpperCase()}-Regulated Genes`;
  const dataPrefix = `genes${direction}`;

  // Generate all column definitions based on configuration
  const allColumns: Record<string, any> = {};

  DIRECTIONAL_STATS.forEach(stat => {
    const dataIndex = `${dataPrefix}${stat.bmdType}${stat.statType}` as keyof CategoryAnalysisResultDto;

    allColumns[stat.key] = {
      title: stat.title,
      dataIndex,
      key: dataIndex,
      width: 55,
      align: 'center' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const aValue = a[dataIndex] as number | undefined;
        const bValue = b[dataIndex] as number | undefined;
        return (aValue || 0) - (bValue || 0);
      },
    };
  });

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title,
        children: Object.values(allColumns),
      },
    ];
  }

  // Filter columns based on visibility
  const visibleChildren = Object.entries(allColumns)
    .filter(([key]) => visibleColumns[key])
    .map(([, column]) => column);

  // Only return the group if at least one column is visible
  if (visibleChildren.length === 0) {
    return [];
  }

  return [
    {
      title,
      children: visibleChildren,
    },
  ];
}

/**
 * Get the up-regulated genes columns
 *
 * Displays BMD, BMDL, and BMDU statistics (mean, median, SD) specifically
 * for genes that are up-regulated in the category.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of up-regulated gene column definitions
 */
export function getDirectionalUpColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  return createDirectionalColumns('Up', visibleColumns);
}

/**
 * Get the down-regulated genes columns
 *
 * Displays BMD, BMDL, and BMDU statistics (mean, median, SD) specifically
 * for genes that are down-regulated in the category.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of down-regulated gene column definitions
 */
export function getDirectionalDownColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  return createDirectionalColumns('Down', visibleColumns);
}

/**
 * Get the directional analysis columns
 *
 * Displays overall directional statistics including:
 * - Overall direction (UP/DOWN/CONFLICT)
 * - Percentage of genes with UP regulation
 * - Percentage of genes with DOWN regulation
 * - Percentage of genes with conflicting directions
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of directional analysis column definitions
 */
export function getDirectionalAnalysisColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    overallDirection: {
      title: 'Overall Direction',
      dataIndex: 'overallDirection',
      key: 'overallDirection',
      width: 60,
      align: 'center',
      sorter: (a, b) => (a.overallDirection || '').localeCompare(b.overallDirection || ''),
    },
    percentUP: {
      title: '% UP',
      dataIndex: 'percentWithOverallDirectionUP',
      key: 'percentWithOverallDirectionUP',
      width: 45,
      align: 'center',
      render: (value: number) => formatNumber(value, 1),
      sorter: (a, b) => (a.percentWithOverallDirectionUP || 0) - (b.percentWithOverallDirectionUP || 0),
    },
    percentDOWN: {
      title: '% DOWN',
      dataIndex: 'percentWithOverallDirectionDOWN',
      key: 'percentWithOverallDirectionDOWN',
      width: 45,
      align: 'center',
      render: (value: number) => formatNumber(value, 1),
      sorter: (a, b) => (a.percentWithOverallDirectionDOWN || 0) - (b.percentWithOverallDirectionDOWN || 0),
    },
    percentConflict: {
      title: '% Conflict',
      dataIndex: 'percentWithOverallDirectionConflict',
      key: 'percentWithOverallDirectionConflict',
      width: 45,
      align: 'center',
      render: (value: number) => formatNumber(value, 1),
      sorter: (a, b) => (a.percentWithOverallDirectionConflict || 0) - (b.percentWithOverallDirectionConflict || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Directional Analysis',
        children: Object.values(allColumns),
      },
    ];
  }

  // Filter columns based on visibility
  const visibleChildren = Object.entries(allColumns)
    .filter(([key]) => visibleColumns[key])
    .map(([, column]) => column);

  // Only return the group if at least one column is visible
  if (visibleChildren.length === 0) {
    return [];
  }

  return [
    {
      title: 'Directional Analysis',
      children: visibleChildren,
    },
  ];
}
