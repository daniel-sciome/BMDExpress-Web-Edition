/**
 * Category Results Table - Primary Filter Columns
 *
 * This file defines "Primary Filter Columns" - the default set of columns shown
 * for each analysis type. These are the most important columns for initial filtering
 * and analysis, and they vary based on whether the category type is single-gene
 * or multi-gene.
 *
 * - Multi-gene categories (GO, pathways, defined): Show gene counts and percentages
 * - Single-gene analysis (GENE): Show essential BMD statistics
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';
import type { PaddingMap } from '../utils/numberPadding';
import { formatHeader } from '../utils/headerFormatting';

// Re-export AnalysisType for backward compatibility
export type { AnalysisType } from '../../../types/filterTypes';

/**
 * Get primary filter columns for multi-gene categories
 *
 * These columns show gene counts and percentages, which are meaningful
 * when a category contains multiple genes.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @param paddingMap - Optional padding map for aligning decimal points
 * @returns Array of gene count column definitions
 */
function getMultiGenePrimaryColumns(
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    genesPassed: {
      title: formatHeader('Genes (Passed)'),
      dataIndex: 'genesThatPassedAllFilters',
      key: 'genesThatPassedAllFilters',
      width: 55,
      align: 'center' as const,
      render: (value: number) => paddingMap ? formatNumber(value, 0, paddingMap['genesThatPassedAllFilters']) : value,
      sorter: (a, b) => (a.genesThatPassedAllFilters || 0) - (b.genesThatPassedAllFilters || 0),
    },
    allGenes: {
      title: formatHeader('All Genes'),
      dataIndex: 'geneAllCount',
      key: 'geneAllCount',
      width: 50,
      align: 'center' as const,
      render: (value: number) => paddingMap ? formatNumber(value, 0, paddingMap['geneAllCount']) : value,
      sorter: (a, b) => (a.geneAllCount || 0) - (b.geneAllCount || 0),
    },
    percentage: {
      title: formatHeader('Percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      width: 70,
      align: 'center' as const,
      render: (value: number) => formatNumber(value, 2, paddingMap?.['percentage']),
      sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: formatHeader('Primary Filter Columns'),
        align: 'center' as const,
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
      title: formatHeader('Primary Filter Columns'),
      align: 'center' as const,
      children: visibleChildren,
    },
  ];
}

/**
 * Get primary filter columns for single-gene analysis (GENE type)
 *
 * These columns show essential BMD statistics (Mean and Median), which are
 * the most important metrics for individual gene dose-response analysis.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @param paddingMap - Optional padding map for aligning decimal points
 * @returns Array of BMD statistics column definitions
 */
function getSingleGenePrimaryColumns(
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    bmdMean: {
      title: formatHeader('BMD Mean'),
      dataIndex: 'bmdMean',
      key: 'bmdMean',
      width: 55,
      align: 'center' as const,
      render: (value: number) => formatNumber(value, 2, paddingMap?.['bmdMean']),
      sorter: (a, b) => (a.bmdMean || 0) - (b.bmdMean || 0),
    },
    bmdMedian: {
      title: formatHeader('BMD Median'),
      dataIndex: 'bmdMedian',
      key: 'bmdMedian',
      width: 55,
      align: 'center' as const,
      render: (value: number) => formatNumber(value, 2, paddingMap?.['bmdMedian']),
      sorter: (a, b) => (a.bmdMedian || 0) - (b.bmdMedian || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: formatHeader('Primary Filter Columns'),
        align: 'center' as const,
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
      title: formatHeader('Primary Filter Columns'),
      align: 'center' as const,
      children: visibleChildren,
    },
  ];
}

/**
 * Get primary filter columns based on analysis type
 *
 * Primary filter columns are the default set of columns shown for each analysis type.
 * - For multi-gene categories (GO, pathways, defined): Show gene counts and percentages
 * - For single-gene analysis (GENE): Show essential BMD statistics (Mean, Median)
 *
 * @param analysisType - The type of category analysis
 * @param visibleColumns - Record of which individual columns to show
 * @param paddingMap - Optional padding map for aligning decimal points
 * @returns Array of primary filter column definitions
 */
export function getPrimaryFilterColumns(
  analysisType: string | null,
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto> {
  if (!analysisType) {
    // Default to multi-gene columns if type is unknown
    return getMultiGenePrimaryColumns(visibleColumns, paddingMap);
  }

  const type = analysisType.toUpperCase();

  // GENE analysis - show BMD statistics
  if (type === 'GENE') {
    return getSingleGenePrimaryColumns(visibleColumns, paddingMap);
  }

  // All other types (GO, pathways, defined sets) - show gene counts
  if (
    type === 'GO_BP' ||
    type === 'GO_CC' ||
    type === 'GO_MF' ||
    type === 'REACTOME' ||
    type === 'KEGG' ||
    type === 'BIOPLANET' ||
    type === 'DEFINED' ||
    type.startsWith('GO_')
  ) {
    return getMultiGenePrimaryColumns(visibleColumns, paddingMap);
  }

  // Unknown type - default to multi-gene columns
  return getMultiGenePrimaryColumns(visibleColumns, paddingMap);
}

/**
 * Get the list of column keys for primary filters based on analysis type
 *
 * This is useful for the column visibility system to know which columns
 * are part of the primary filter set.
 *
 * @param analysisType - The type of category analysis
 * @returns Array of column keys that are primary filters for this type
 */
export function getPrimaryFilterColumnKeys(analysisType: string | null): string[] {
  if (!analysisType) {
    return ['genesPassed', 'allGenes', 'percentage'];
  }

  const type = analysisType.toUpperCase();

  if (type === 'GENE') {
    return ['bmdMean', 'bmdMedian'];
  }

  if (
    type === 'GO_BP' ||
    type === 'GO_CC' ||
    type === 'GO_MF' ||
    type === 'REACTOME' ||
    type === 'KEGG' ||
    type === 'BIOPLANET' ||
    type === 'DEFINED' ||
    type.startsWith('GO_')
  ) {
    return ['genesPassed', 'allGenes', 'percentage'];
  }

  return ['genesPassed', 'allGenes', 'percentage'];
}
