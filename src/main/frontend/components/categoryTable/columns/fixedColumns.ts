/**
 * Category Results Table - Fixed Columns
 *
 * This file contains the fixed column definitions that are always visible
 * in the category results table (Cluster, Category ID, and Description).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { umapDataService } from 'Frontend/data/umapDataService';

/**
 * Get the fixed columns (Cluster, Category ID, and Description)
 *
 * These columns are always visible and fixed to the left side of the table.
 * They provide the primary identification for each category row.
 *
 * @returns Array of fixed column definitions
 */
export function getFixedColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Cluster',
      dataIndex: 'categoryId',
      key: 'cluster',
      width: 50,
      fixed: 'left',
      render: (categoryId: string) => {
        const umapData = umapDataService.getByGoId(categoryId);
        return umapData?.cluster_id ?? '-';
      },
      sorter: (a, b) => {
        const clusterA = Number(umapDataService.getByGoId(a.categoryId || '')?.cluster_id ?? -999);
        const clusterB = Number(umapDataService.getByGoId(b.categoryId || '')?.cluster_id ?? -999);
        return clusterA - clusterB;
      },
    },
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
    },
  ];
}
