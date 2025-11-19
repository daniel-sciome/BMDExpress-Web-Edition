/**
 * Category Results Table - Gene Count Columns
 *
 * This file contains column definitions for gene count statistics,
 * including genes that passed filters, total genes, significant ANOVA, and percentage.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Get the gene count columns
 *
 * Displays the number of genes that passed all filters, total gene count,
 * and the percentage of genes in the category.
 * Individual columns can be toggled via the visibleColumns parameter.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of gene count column definitions
 */
export function getGeneCountsColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    genesPassed: {
      title: 'Genes (Passed)',
      dataIndex: 'genesThatPassedAllFilters',
      key: 'genesThatPassedAllFilters',
      width: 55,
      align: 'right' as const,
      sorter: (a, b) => (a.genesThatPassedAllFilters || 0) - (b.genesThatPassedAllFilters || 0),
    },
    allGenes: {
      title: 'All Genes',
      dataIndex: 'geneAllCount',
      key: 'geneAllCount',
      width: 50,
      align: 'right' as const,
      sorter: (a, b) => (a.geneAllCount || 0) - (b.geneAllCount || 0),
    },
    percentage: {
      title: '%',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 40,
      align: 'right' as const,
      render: (value: number) => formatNumber(value, 2),
      sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: 'Gene Counts',
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
      title: 'Gene Counts',
      children: visibleChildren,
    },
  ];
}

/**
 * Get the significant ANOVA count column
 *
 * Displays the count of genes with significant ANOVA results.
 * This is a statistics column that shows analytical significance.
 *
 * @returns Array containing the significant ANOVA column definition
 */
export function getSignificantANOVAColumn(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Significant ANOVA',
      dataIndex: 'geneCountSignificantANOVA',
      key: 'geneCountSignificantANOVA',
      width: 60,
      align: 'right',
      sorter: (a, b) => (a.geneCountSignificantANOVA || 0) - (b.geneCountSignificantANOVA || 0),
    },
  ];
}
