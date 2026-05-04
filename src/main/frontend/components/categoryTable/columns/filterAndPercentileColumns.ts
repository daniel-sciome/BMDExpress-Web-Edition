/**
 * Category Results Table - Filter Counts and Percentile Columns
 *
 * This file contains column definitions for filter counts (genes meeting various
 * filter criteria) and percentile values (BMD/BMDL/BMDU percentiles).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';
import { formatHeader } from '../utils/headerFormatting';

/**
 * Get the filter counts columns
 *
 * Displays counts of genes that meet various filtering criteria, including:
 * - R-squared thresholds
 * - BMD/BMDL ratio filters
 * - N-fold below criteria
 * - Pre-filter p-value thresholds
 * - Step function filters
 * - Adverse direction filters
 * - Z-score and fold change filters
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of filter count column definitions
 */
export function getFilterCountsColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    bmdLessEqualHighDose: {
      title: formatHeader('BMD ≤ High Dose'),
      dataIndex: 'genesWithBMDLessEqualHighDose',
      key: 'genesWithBMDLessEqualHighDose',
      width: 60,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDLessEqualHighDose || 0) - (b.genesWithBMDLessEqualHighDose || 0),
    },
    bmdPValueGreaterEqual: {
      title: formatHeader('BMD P-Value ≥'),
      dataIndex: 'genesWithBMDpValueGreaterEqualValue',
      key: 'genesWithBMDpValueGreaterEqualValue',
      width: 55,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDpValueGreaterEqualValue || 0) - (b.genesWithBMDpValueGreaterEqualValue || 0),
    },
    foldChangeAbove: {
      title: formatHeader('Fold Change ≥'),
      dataIndex: 'genesWithFoldChangeAboveValue',
      key: 'genesWithFoldChangeAboveValue',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesWithFoldChangeAboveValue || 0) - (b.genesWithFoldChangeAboveValue || 0),
    },
    rSquared: {
      title: formatHeader('R² ≥'),
      dataIndex: 'genesWithBMDRSquaredValueGreaterEqualValue',
      key: 'genesWithBMDRSquaredValueGreaterEqualValue',
      width: 45,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDRSquaredValueGreaterEqualValue || 0) - (b.genesWithBMDRSquaredValueGreaterEqualValue || 0),
    },
    bmdBmdlRatio: {
      title: formatHeader('BMD/BMDL <'),
      dataIndex: 'genesWithBMDBMDLRatioBelowValue',
      key: 'genesWithBMDBMDLRatioBelowValue',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDBMDLRatioBelowValue || 0) - (b.genesWithBMDBMDLRatioBelowValue || 0),
    },
    bmduBmdlRatio: {
      title: formatHeader('BMDU/BMDL <'),
      dataIndex: 'genesWithBMDUBMDLRatioBelowValue',
      key: 'genesWithBMDUBMDLRatioBelowValue',
      width: 55,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDUBMDLRatioBelowValue || 0) - (b.genesWithBMDUBMDLRatioBelowValue || 0),
    },
    bmduBmdRatio: {
      title: formatHeader('BMDU/BMD <'),
      dataIndex: 'genesWithBMDUBMDRatioBelowValue',
      key: 'genesWithBMDUBMDRatioBelowValue',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesWithBMDUBMDRatioBelowValue || 0) - (b.genesWithBMDUBMDRatioBelowValue || 0),
    },
    nFoldBelow: {
      title: formatHeader('N-Fold Below'),
      dataIndex: 'genesWithNFoldBelowLowPostiveDoseValue',
      key: 'genesWithNFoldBelowLowPostiveDoseValue',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesWithNFoldBelowLowPostiveDoseValue || 0) - (b.genesWithNFoldBelowLowPostiveDoseValue || 0),
    },
    prefilterPValue: {
      title: formatHeader('Pre-P ≥'),
      dataIndex: 'genesWithPrefilterPValueAboveValue',
      key: 'genesWithPrefilterPValueAboveValue',
      width: 45,
      align: 'center',
      sorter: (a, b) => (a.genesWithPrefilterPValueAboveValue || 0) - (b.genesWithPrefilterPValueAboveValue || 0),
    },
    prefilterAdjustedPValue: {
      title: formatHeader('Pre-Adj-P ≥'),
      dataIndex: 'genesWithPrefilterAdjustedPValueAboveValue',
      key: 'genesWithPrefilterAdjustedPValueAboveValue',
      width: 55,
      align: 'center',
      sorter: (a, b) => (a.genesWithPrefilterAdjustedPValueAboveValue || 0) - (b.genesWithPrefilterAdjustedPValueAboveValue || 0),
    },
    notStepFunction: {
      title: formatHeader('Not Step Fn'),
      dataIndex: 'genesNotStepFunction',
      key: 'genesNotStepFunction',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesNotStepFunction || 0) - (b.genesNotStepFunction || 0),
    },
    notStepFunctionBMDL: {
      title: formatHeader('Not Step (BMDL)'),
      dataIndex: 'genesNotStepFunctionWithBMDLower',
      key: 'genesNotStepFunctionWithBMDLower',
      width: 60,
      align: 'center',
      sorter: (a, b) => (a.genesNotStepFunctionWithBMDLower || 0) - (b.genesNotStepFunctionWithBMDLower || 0),
    },
    notAdverse: {
      title: formatHeader('Not Adverse'),
      dataIndex: 'genesNotAdverseDirection',
      key: 'genesNotAdverseDirection',
      width: 50,
      align: 'center',
      sorter: (a, b) => (a.genesNotAdverseDirection || 0) - (b.genesNotAdverseDirection || 0),
    },
    absZScore: {
      title: formatHeader('ABS Z-Score ≥'),
      dataIndex: 'genesWithABSZScoreAboveValue',
      key: 'genesWithABSZScoreAboveValue',
      width: 55,
      align: 'center',
      sorter: (a, b) => (a.genesWithABSZScoreAboveValue || 0) - (b.genesWithABSZScoreAboveValue || 0),
    },
    absModelFC: {
      title: formatHeader('ABS Model FC ≥'),
      dataIndex: 'genesWithABSModelFCAboveValue',
      key: 'genesWithABSModelFCAboveValue',
      width: 60,
      align: 'center',
      sorter: (a, b) => (a.genesWithABSModelFCAboveValue || 0) - (b.genesWithABSModelFCAboveValue || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: formatHeader('Filter Counts'),
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
      title: formatHeader('Filter Counts'),
      children: visibleChildren,
    },
  ];
}

/**
 * Get the percentile gene count columns
 *
 * Displays the total number of genes at the 5th and 10th percentile
 * thresholds for BMD, BMDL, and BMDU across all genes in the category.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @returns Array of percentile column definitions
 */
export function getPercentilesColumns(
  visibleColumns?: Record<string, boolean>
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    bmd5th: {
      title: formatHeader('BMD 5th Percentile Total Genes'),
      dataIndex: 'bmdFifthPercentileTotalGenes',
      key: 'bmdFifthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdFifthPercentileTotalGenes || 0) - (b.bmdFifthPercentileTotalGenes || 0),
    },
    bmd10th: {
      title: formatHeader('BMD 10th Percentile Total Genes'),
      dataIndex: 'bmdTenthPercentileTotalGenes',
      key: 'bmdTenthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdTenthPercentileTotalGenes || 0) - (b.bmdTenthPercentileTotalGenes || 0),
    },
    bmdl5th: {
      title: formatHeader('BMDL 5th Percentile Total Genes'),
      dataIndex: 'bmdlFifthPercentileTotalGenes',
      key: 'bmdlFifthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdlFifthPercentileTotalGenes || 0) - (b.bmdlFifthPercentileTotalGenes || 0),
    },
    bmdl10th: {
      title: formatHeader('BMDL 10th Percentile Total Genes'),
      dataIndex: 'bmdlTenthPercentileTotalGenes',
      key: 'bmdlTenthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdlTenthPercentileTotalGenes || 0) - (b.bmdlTenthPercentileTotalGenes || 0),
    },
    bmdu5th: {
      title: formatHeader('BMDU 5th Percentile Total Genes'),
      dataIndex: 'bmduFifthPercentileTotalGenes',
      key: 'bmduFifthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmduFifthPercentileTotalGenes || 0) - (b.bmduFifthPercentileTotalGenes || 0),
    },
    bmdu10th: {
      title: formatHeader('BMDU 10th Percentile Total Genes'),
      dataIndex: 'bmduTenthPercentileTotalGenes',
      key: 'bmduTenthPercentileTotalGenes',
      width: 120,
      align: 'center',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmduTenthPercentileTotalGenes || 0) - (b.bmduTenthPercentileTotalGenes || 0),
    },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: formatHeader('Percentile Values'),
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
      title: formatHeader('Percentile Values'),
      children: visibleChildren,
    },
  ];
}
