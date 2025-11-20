/**
 * Category Results Table - Fold Change Columns
 *
 * This file contains column definitions for fold change statistics,
 * including total, mean, median, max, min, and standard deviation.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Get the fold change statistics columns
 *
 * Displays raw fold change statistics (not model-based) including
 * total, mean, median, max, min, and standard deviation.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of fold change column definitions
 */
export function getFoldChangeColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    total: {
      title: 'Total',
      dataIndex: 'totalFoldChange',
      key: 'totalFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.totalFoldChange || 0) - (b.totalFoldChange || 0),
    },
    mean: {
      title: 'Mean',
      dataIndex: 'meanFoldChange',
      key: 'meanFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.meanFoldChange || 0) - (b.meanFoldChange || 0),
    },
    median: {
      title: 'Median',
      dataIndex: 'medianFoldChange',
      key: 'medianFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.medianFoldChange || 0) - (b.medianFoldChange || 0),
    },
    max: {
      title: 'Max',
      dataIndex: 'maxFoldChange',
      key: 'maxFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.maxFoldChange || 0) - (b.maxFoldChange || 0),
    },
    min: {
      title: 'Min',
      dataIndex: 'minFoldChange',
      key: 'minFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.minFoldChange || 0) - (b.minFoldChange || 0),
    },
    stdDev: {
      title: 'Std Dev',
      dataIndex: 'stdDevFoldChange',
      key: 'stdDevFoldChange',
      width: 50,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.stdDevFoldChange || 0) - (b.stdDevFoldChange || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Fold Change Statistics',
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
      title: 'Fold Change Statistics',
      children: visibleChildren,
    },
  ];
}
