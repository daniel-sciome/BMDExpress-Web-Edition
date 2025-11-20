/**
 * Category Results Table - Advanced Analysis Columns
 *
 * This file contains column definitions for advanced analysis metrics,
 * including Z-score statistics, model fold change statistics, and gene lists.
 *
 * Uses generic column generators to eliminate code duplication.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Configuration for statistics columns
 */
interface StatsConfig {
  key: string;
  title: string;
  suffix: string;
}

/**
 * Standard statistics to display (min, median, max, mean)
 */
const STANDARD_STATS: StatsConfig[] = [
  { key: 'min', title: 'Min', suffix: '' },
  { key: 'median', title: 'Median', suffix: '' },
  { key: 'max', title: 'Max', suffix: '' },
  { key: 'mean', title: 'Mean', suffix: '' },
];

/**
 * Generic function to create statistics columns
 *
 * Eliminates code duplication by generating columns based on field configuration.
 *
 * @param title - The column group title
 * @param fieldPrefix - The field name prefix (e.g., 'min', 'median')
 * @param fieldSuffix - The field name suffix (e.g., 'ZScore', 'ModelFoldChange')
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of statistics column definitions
 */
function createStatsColumns(
  title: string,
  fieldPrefix: string,
  fieldSuffix: string,
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Generate all column definitions
  const allColumns: Record<string, any> = {};

  STANDARD_STATS.forEach(stat => {
    const dataIndex = `${stat.key}${fieldSuffix}` as keyof CategoryAnalysisResultDto;

    allColumns[stat.key] = {
      title: stat.title,
      dataIndex,
      key: dataIndex,
      width: 50,
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
 * Get the Z-score statistics columns
 *
 * Displays Z-score statistics including minimum, median, maximum, and mean
 * values across genes in the category.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of Z-score column definitions
 */
export function getZScoresColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  return createStatsColumns('Z-Score Statistics', '', 'ZScore', visibleColumns);
}

/**
 * Get the model fold change statistics columns
 *
 * Displays model-based fold change statistics including minimum, median,
 * maximum, and mean values across genes in the category.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of model fold change column definitions
 */
export function getModelFoldChangeColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  return createStatsColumns('Model Fold Change', '', 'ModelFoldChange', visibleColumns);
}

/**
 * Get the gene lists columns
 *
 * Displays the actual gene identifiers and gene symbols for genes
 * in the category. These columns are typically truncated with ellipsis
 * due to potentially long lists.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of gene list column definitions
 */
export function getGeneListsColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    genes: {
      title: 'Genes',
      dataIndex: 'genes',
      key: 'genes',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => (a.genes || '').localeCompare(b.genes || ''),
    },
    geneSymbols: {
      title: 'Gene Symbols',
      dataIndex: 'geneSymbols',
      key: 'geneSymbols',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => (a.geneSymbols || '').localeCompare(b.geneSymbols || ''),
    },
    bmdList: {
      title: 'BMD List',
      dataIndex: 'bmdList',
      key: 'bmdList',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => (a.bmdList || '').localeCompare(b.bmdList || ''),
    },
    bmdlList: {
      title: 'BMDL List',
      dataIndex: 'bmdlList',
      key: 'bmdlList',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => (a.bmdlList || '').localeCompare(b.bmdlList || ''),
    },
    bmduList: {
      title: 'BMDU List',
      dataIndex: 'bmduList',
      key: 'bmduList',
      width: 100,
      ellipsis: true,
      sorter: (a, b) => (a.bmduList || '').localeCompare(b.bmduList || ''),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Gene Lists',
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
      title: 'Gene Lists',
      children: visibleChildren,
    },
  ];
}
