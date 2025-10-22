/**
 * Category Results Table - Gene Count Columns
 *
 * This file contains column definitions for gene count statistics,
 * including genes that passed filters, total genes, and percentage.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Get the gene count columns
 *
 * Displays the number of genes that passed all filters, total gene count,
 * and the percentage of genes in the category.
 *
 * @returns Array of gene count column definitions
 */
export function getGeneCountsColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Gene Counts',
      children: [
        {
          title: 'Genes (Passed)',
          dataIndex: 'genesThatPassedAllFilters',
          key: 'genesThatPassedAllFilters',
          width: 55,
          align: 'right',
          sorter: (a, b) => (a.genesThatPassedAllFilters || 0) - (b.genesThatPassedAllFilters || 0),
        },
        {
          title: 'All Genes',
          dataIndex: 'geneAllCount',
          key: 'geneAllCount',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.geneAllCount || 0) - (b.geneAllCount || 0),
        },
        {
          title: '%',
          dataIndex: 'percentage',
          key: 'percentage',
          width: 40,
          align: 'right',
          render: (value: number) => formatNumber(value, 2),
          sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
        },
      ],
    },
  ];
}
