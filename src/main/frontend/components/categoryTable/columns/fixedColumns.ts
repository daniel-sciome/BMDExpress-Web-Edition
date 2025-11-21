/**
 * Category Results Table - Fixed Columns
 *
 * This file contains the fixed column definitions that are always visible
 * in the category results table (Cluster, Category ID, and Description).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { getClusterIdForCategory } from 'Frontend/components/charts/utils/clusterColors';
import { getCategoryColumnLabels, type AnalysisInfo } from '../utils/categoryLabels';
import { formatHeader } from '../utils/headerFormatting';

/**
 * Get the fixed columns (Cluster, Category ID, and Description)
 *
 * These columns are always visible and fixed to the left side of the table.
 * They provide the primary identification for each category row.
 * Column labels are dynamically determined based on the analysis type.
 *
 * @param viewMode - Current view mode ('simple' | 'power'). Cluster column only shown in power mode.
 * @param analysisInfo - Information about the analysis type and parameters for dynamic labeling
 * @returns Array of fixed column definitions
 */
export function getFixedColumns(
  viewMode: 'simple' | 'power' = 'power',
  analysisInfo?: AnalysisInfo
): ColumnsType<CategoryAnalysisResultDto> {
  // Get dynamic labels based on analysis type
  const labels = analysisInfo
    ? getCategoryColumnLabels(analysisInfo)
    : { categoryIdLabel: 'Category ID', descriptionLabel: 'Description' };

  // Build child columns array
  const children: any[] = [];

  // Cluster column - only in power user mode
  if (viewMode === 'power') {
    children.push({
      title: formatHeader('Cluster'),
      dataIndex: 'categoryId',
      key: 'cluster',
      width: 50,
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

  // Category ID and Description - always visible, with dynamic labels
  children.push(
    {
      title: formatHeader(labels.categoryIdLabel),
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 75,
      sorter: (a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''),
    },
    {
      title: formatHeader(labels.descriptionLabel),
      dataIndex: 'categoryDescription',
      key: 'categoryDescription',
      width: 125,
      ellipsis: true,
      sorter: (a, b) => (a.categoryDescription || '').localeCompare(b.categoryDescription || ''),
    }
  );

  // Return single parent header spanning all children
  return [
    {
      title: formatHeader('Identifiers/Descriptions'),
      align: 'center' as const,
      fixed: 'left',
      children,
    },
  ];
}
