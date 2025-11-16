/**
 * Category Results Table - Advanced Analysis Columns
 *
 * This file contains column definitions for advanced analysis metrics,
 * including Z-score statistics, model fold change statistics, and gene lists.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

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
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    min: {
      title: 'Min',
      dataIndex: 'minZScore',
      key: 'minZScore',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.minZScore || 0) - (b.minZScore || 0),
    },
    median: {
      title: 'Median',
      dataIndex: 'medianZScore',
      key: 'medianZScore',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.medianZScore || 0) - (b.medianZScore || 0),
    },
    max: {
      title: 'Max',
      dataIndex: 'maxZScore',
      key: 'maxZScore',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.maxZScore || 0) - (b.maxZScore || 0),
    },
    mean: {
      title: 'Mean',
      dataIndex: 'meanZScore',
      key: 'meanZScore',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.meanZScore || 0) - (b.meanZScore || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Z-Score Statistics',
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
      title: 'Z-Score Statistics',
      children: visibleChildren,
    },
  ];
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
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    min: {
      title: 'Min',
      dataIndex: 'minModelFoldChange',
      key: 'minModelFoldChange',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.minModelFoldChange || 0) - (b.minModelFoldChange || 0),
    },
    median: {
      title: 'Median',
      dataIndex: 'medianModelFoldChange',
      key: 'medianModelFoldChange',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.medianModelFoldChange || 0) - (b.medianModelFoldChange || 0),
    },
    max: {
      title: 'Max',
      dataIndex: 'maxModelFoldChange',
      key: 'maxModelFoldChange',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.maxModelFoldChange || 0) - (b.maxModelFoldChange || 0),
    },
    mean: {
      title: 'Mean',
      dataIndex: 'meanModelFoldChange',
      key: 'meanModelFoldChange',
      width: 50,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.meanModelFoldChange || 0) - (b.meanModelFoldChange || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Model Fold Change',
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
      title: 'Model Fold Change',
      children: visibleChildren,
    },
  ];
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
