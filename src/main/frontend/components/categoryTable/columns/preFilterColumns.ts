/**
 * Category Results Table - Pre-Filter Columns
 *
 * This file contains column definitions for pre-filter statistics, which show
 * the count of genes that passed various statistical pre-filtering tests before
 * BMD analysis. Pre-filters include:
 * - ANOVA (Analysis of Variance)
 * - Williams Trend Test (future)
 * - Curve Fit (future)
 * - Other statistical tests (future)
 *
 * Individual columns can be toggled via the visibleColumns parameter.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';
import type { PaddingMap } from '../utils/numberPadding';
import { formatHeader } from '../utils/headerFormatting';

/**
 * Get the pre-filter columns
 *
 * Displays the count of genes that passed various statistical pre-filtering tests.
 * Currently includes ANOVA; structured to accommodate Williams, Curve Fit, etc. in the future.
 * Individual columns can be toggled via the visibleColumns parameter.
 *
 * @param visibleColumns - Record of which individual columns to show
 * @param paddingMap - Optional padding map for aligning decimal points
 * @returns Array of pre-filter column definitions
 */
export function getPreFilterColumns(
  visibleColumns?: Record<string, boolean>,
  paddingMap?: PaddingMap
): ColumnsType<CategoryAnalysisResultDto> {
  // Map of column keys to their definitions
  const allColumns: Record<string, any> = {
    anova: {
      title: formatHeader('ANOVA'),
      dataIndex: 'geneCountSignificantANOVA',
      key: 'geneCountSignificantANOVA',
      width: 60,
      align: 'center' as const,
      render: (value: number) => paddingMap ? formatNumber(value, 0, paddingMap['geneCountSignificantANOVA']) : value,
      sorter: (a, b) => (a.geneCountSignificantANOVA || 0) - (b.geneCountSignificantANOVA || 0),
    },
    // Future pre-filter columns can be added here:
    // williams: {
    //   title: formatHeader('Williams'),
    //   dataIndex: 'geneCountSignificantWilliams',
    //   key: 'geneCountSignificantWilliams',
    //   width: 60,
    //   align: 'center' as const,
    //   render: (value: number) => formatNumber(value, 0),
    //   sorter: (a, b) => (a.geneCountSignificantWilliams || 0) - (b.geneCountSignificantWilliams || 0),
    // },
    // curveFit: {
    //   title: formatHeader('Curve Fit'),
    //   dataIndex: 'geneCountSignificantCurveFit',
    //   key: 'geneCountSignificantCurveFit',
    //   width: 60,
    //   align: 'center' as const,
    //   render: (value: number) => formatNumber(value, 0),
    //   sorter: (a, b) => (a.geneCountSignificantCurveFit || 0) - (b.geneCountSignificantCurveFit || 0),
    // },
  };

  // If no visibility specified, show all columns
  if (!visibleColumns) {
    return [
      {
        title: formatHeader('Pre-Filters'),
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
      title: formatHeader('Pre-Filters'),
      align: 'center' as const,
      children: visibleChildren,
    },
  ];
}
