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
 * @returns Array of Z-score column definitions
 */
export function getZScoresColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Z-Score Statistics',
      children: [
        {
          title: 'Min',
          dataIndex: 'minZScore',
          key: 'minZScore',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.minZScore || 0) - (b.minZScore || 0),
        },
        {
          title: 'Median',
          dataIndex: 'medianZScore',
          key: 'medianZScore',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.medianZScore || 0) - (b.medianZScore || 0),
        },
        {
          title: 'Max',
          dataIndex: 'maxZScore',
          key: 'maxZScore',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.maxZScore || 0) - (b.maxZScore || 0),
        },
        {
          title: 'Mean',
          dataIndex: 'meanZScore',
          key: 'meanZScore',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.meanZScore || 0) - (b.meanZScore || 0),
        },
      ],
    },
  ];
}

/**
 * Get the model fold change statistics columns
 *
 * Displays model-based fold change statistics including minimum, median,
 * maximum, and mean values across genes in the category.
 *
 * @returns Array of model fold change column definitions
 */
export function getModelFoldChangeColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Model Fold Change',
      children: [
        {
          title: 'Min',
          dataIndex: 'minModelFoldChange',
          key: 'minModelFoldChange',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.minModelFoldChange || 0) - (b.minModelFoldChange || 0),
        },
        {
          title: 'Median',
          dataIndex: 'medianModelFoldChange',
          key: 'medianModelFoldChange',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.medianModelFoldChange || 0) - (b.medianModelFoldChange || 0),
        },
        {
          title: 'Max',
          dataIndex: 'maxModelFoldChange',
          key: 'maxModelFoldChange',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.maxModelFoldChange || 0) - (b.maxModelFoldChange || 0),
        },
        {
          title: 'Mean',
          dataIndex: 'meanModelFoldChange',
          key: 'meanModelFoldChange',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.meanModelFoldChange || 0) - (b.meanModelFoldChange || 0),
        },
      ],
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
 * @returns Array of gene list column definitions
 */
export function getGeneListsColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Gene Lists',
      children: [
        {
          title: 'Genes',
          dataIndex: 'genes',
          key: 'genes',
          width: 100,
          ellipsis: true,
          sorter: (a, b) => (a.genes || '').localeCompare(b.genes || ''),
        },
        {
          title: 'Gene Symbols',
          dataIndex: 'geneSymbols',
          key: 'geneSymbols',
          width: 100,
          ellipsis: true,
          sorter: (a, b) => (a.geneSymbols || '').localeCompare(b.geneSymbols || ''),
        },
      ],
    },
  ];
}
