/**
 * Category Results Table - Fixed Columns
 *
 * This file contains the fixed column definitions that are always visible
 * in the category results table (Category ID and Description).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

/**
 * Get the fixed columns (Category ID and Description)
 *
 * These columns are always visible and fixed to the left side of the table.
 * They provide the primary identification for each category row.
 *
 * @returns Array of fixed column definitions
 */
export function getFixedColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
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
