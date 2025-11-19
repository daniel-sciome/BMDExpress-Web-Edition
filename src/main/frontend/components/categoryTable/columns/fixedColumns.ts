/**
 * Category Results Table - Fixed Columns
 *
 * This file contains the fixed column definitions that are always visible
 * in the category results table (Cluster, Category ID, and Description).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { getClusterIdForCategory } from 'Frontend/components/charts/utils/clusterColors';

/**
 * Get the fixed columns (Cluster, Category ID, and Description)
 *
 * These columns are always visible and fixed to the left side of the table.
 * They provide the primary identification for each category row.
 *
 * @param viewMode - Current view mode ('simple' | 'power'). Cluster column only shown in power mode.
 * @returns Array of fixed column definitions
 */
export function getFixedColumns(viewMode: 'simple' | 'power' = 'power'): ColumnsType<CategoryAnalysisResultDto> {
  const columns: ColumnsType<CategoryAnalysisResultDto> = [];

  // Cluster column - only in power user mode
  if (viewMode === 'power') {
    columns.push({
      title: 'Cluster',
      dataIndex: 'categoryId',
      key: 'cluster',
      width: 50,
      fixed: 'left',
      render: (categoryId: string) => {
        const clusterId = getClusterIdForCategory(categoryId);
        return clusterId === -1 ? '-' : clusterId;
      },
      sorter: (a, b) => {
        const clusterA = getClusterIdForCategory(a.categoryId);
        const clusterB = getClusterIdForCategory(b.categoryId);
        return clusterA - clusterB;
      },
    });
  }

  // Category ID and Description - always visible
  columns.push(
    {
      title: 'Category ID',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 75,
      fixed: 'left',
      sorter: (a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''),
    },
    {
      title: 'Description',
      dataIndex: 'categoryDescription',
      key: 'categoryDescription',
      width: 125,
      ellipsis: true,
      fixed: 'left',
      sorter: (a, b) => (a.categoryDescription || '').localeCompare(b.categoryDescription || ''),
    }
  );

  return columns;
}
