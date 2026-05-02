/**
 * Category Results Table - Fixed Columns
 *
 * This file contains the fixed column definitions that are always visible
 * in the category results table (Cluster, Category ID, and Description).
 */

import React from 'react';
import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { getCategoryColumnLabels, type AnalysisInfo } from '../utils/categoryLabels';
import { formatHeader } from '../utils/headerFormatting';

// Extended type that includes the enriched clusterId field
interface CategoryWithCluster extends CategoryAnalysisResultDto {
  clusterId?: number;
}

/**
 * Get the fixed columns (Cluster, Category ID, and Description)
 *
 * These columns are always visible and fixed to the left side of the table.
 * They provide the primary identification for each category row.
 * Column labels are dynamically determined based on the analysis type.
 *
 * @param viewMode - Current view mode ('simple' | 'power'). Currently unused - cluster always shown.
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

  // Cluster column - always visible since we sort by cluster by default
  // Uses the enriched clusterId field from CategoryAnalysisResultWithCluster
  children.push({
    title: formatHeader('Cluster'),
    dataIndex: 'clusterId',
    key: 'clusterId',
    width: 40,
    align: 'center' as const,
    render: (clusterId: number | undefined) => {
      // -2 = not in reference, -1 = unclassified, 0+ = cluster number
      if (clusterId === undefined || clusterId === -2) return 'NA';
      if (clusterId === -1) return '-1';
      return clusterId;
    },
    // Note: Actual sorting is handled by Redux (setSortColumn)
    // This sorter is for local fallback only
    sorter: (a: CategoryWithCluster, b: CategoryWithCluster) => {
      const clusterA = a.clusterId ?? -999;
      const clusterB = b.clusterId ?? -999;
      return clusterA - clusterB;
    },
  });

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
