/**
 * Category Results Table - BMD Statistics Columns
 *
 * This file contains column definitions for BMD (Benchmark Dose) statistics,
 * including essential BMD columns, extended BMD statistics, and BMDL/BMDU columns.
 *
 * Uses generic column generators to eliminate code duplication across BMD types.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Configuration for a statistics column
 */
interface StatColumnConfig {
  key: string;
  title: string;
  suffix: string;
  width?: number;
}

/**
 * Configuration for extended statistics columns
 */
const EXTENDED_STATS: StatColumnConfig[] = [
  { key: 'min', title: 'Min', suffix: 'Minimum', width: 55 },
  { key: 'sd', title: 'SD', suffix: 'SD', width: 55 },
  { key: 'wmean', title: 'Weighted Mean', suffix: 'WMean', width: 60 },
  { key: 'wsd', title: 'Weighted SD', suffix: 'WSD', width: 60 },
];

/**
 * Configuration for confidence interval columns
 */
const CONFIDENCE_STATS: StatColumnConfig[] = [
  { key: 'lower', title: 'Lower', suffix: 'Lower95', width: 55 },
  { key: 'upper', title: 'Upper', suffix: 'Upper95', width: 55 },
];

/**
 * Generic function to create extended statistics columns for any BMD type
 *
 * Eliminates code duplication by generating columns based on prefix parameter.
 *
 * @param prefix - The field prefix ('bmd', 'bmdl', or 'bmdu')
 * @param title - The column group title
 * @returns Array of extended statistics column definitions
 */
function createExtendedStatsColumns(
  prefix: 'bmd' | 'bmdl' | 'bmdu',
  title: string
): ColumnsType<CategoryAnalysisResultDto> {
  const children = EXTENDED_STATS.map(stat => {
    const dataIndex = `${prefix}${stat.suffix}` as keyof CategoryAnalysisResultDto;

    return {
      title: stat.title,
      dataIndex,
      key: dataIndex,
      width: stat.width,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const aValue = a[dataIndex] as number | undefined;
        const bValue = b[dataIndex] as number | undefined;
        return (aValue || 0) - (bValue || 0);
      },
    };
  });

  return [{ title, children }];
}

/**
 * Generic function to create confidence interval columns for any BMD type
 *
 * Eliminates code duplication by generating columns based on prefix parameter.
 *
 * @param prefix - The field prefix ('bmd', 'bmdl', or 'bmdu')
 * @param title - The column group title
 * @returns Array of confidence interval column definitions
 */
function createConfidenceColumns(
  prefix: 'bmd' | 'bmdl' | 'bmdu',
  title: string
): ColumnsType<CategoryAnalysisResultDto> {
  const children = CONFIDENCE_STATS.map(stat => {
    const dataIndex = `${prefix}${stat.suffix}` as keyof CategoryAnalysisResultDto;

    return {
      title: stat.title,
      dataIndex,
      key: dataIndex,
      width: stat.width,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: CategoryAnalysisResultDto, b: CategoryAnalysisResultDto) => {
        const aValue = a[dataIndex] as number | undefined;
        const bValue = b[dataIndex] as number | undefined;
        return (aValue || 0) - (bValue || 0);
      },
    };
  });

  return [{ title, children }];
}

/**
 * Get the essential BMD statistics columns (Mean and Median)
 *
 * These are the most commonly used BMD statistics for initial analysis.
 *
 * @returns Array of essential BMD column definitions
 */
export function getBMDEssentialColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'BMD Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmdMean',
          key: 'bmdMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMean || 0) - (b.bmdMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmdMedian',
          key: 'bmdMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMedian || 0) - (b.bmdMedian || 0),
        },
      ],
    },
  ];
}

/**
 * Get the extended BMD statistics columns
 *
 * Displays additional BMD statistics including minimum, standard deviation,
 * weighted mean, and weighted standard deviation.
 *
 * @returns Array of extended BMD column definitions
 */
export function getBMDExtendedColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return createExtendedStatsColumns('bmd', 'BMD Statistics (Extended)');
}

/**
 * Get the BMD confidence interval columns
 *
 * Displays BMD 95% confidence interval bounds (lower and upper).
 *
 * @returns Array of BMD confidence interval column definitions
 */
export function getBMDConfidenceColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return createConfidenceColumns('bmd', 'BMD 95% CI');
}

/**
 * Get the BMDL (BMD Lower bound) statistics columns
 *
 * BMDL represents the lower confidence limit on the BMD.
 * Displays mean, median, minimum, SD, weighted mean, and weighted SD.
 *
 * @returns Array of BMDL column definitions
 */
export function getBMDLColumns(): ColumnsType<CategoryAnalysisResultDto> {
  const extendedChildren = createExtendedStatsColumns('bmdl', '')[0];
  const extendedCols = 'children' in extendedChildren ? extendedChildren.children : [];

  return [
    {
      title: 'BMDL Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmdlMean',
          key: 'bmdlMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMean || 0) - (b.bmdlMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmdlMedian',
          key: 'bmdlMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMedian || 0) - (b.bmdlMedian || 0),
        },
        ...(extendedCols || []),
      ],
    },
  ];
}

/**
 * Get the BMDL confidence interval columns
 *
 * Displays BMDL 95% confidence interval bounds (lower and upper).
 *
 * @returns Array of BMDL confidence interval column definitions
 */
export function getBMDLConfidenceColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return createConfidenceColumns('bmdl', 'BMDL 95% CI');
}

/**
 * Get the BMDU (BMD Upper bound) statistics columns
 *
 * BMDU represents the upper confidence limit on the BMD.
 * Displays mean, median, minimum, SD, weighted mean, and weighted SD.
 *
 * @returns Array of BMDU column definitions
 */
export function getBMDUColumns(): ColumnsType<CategoryAnalysisResultDto> {
  const extendedChildren = createExtendedStatsColumns('bmdu', '')[0];
  const extendedCols = 'children' in extendedChildren ? extendedChildren.children : [];

  return [
    {
      title: 'BMDU Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmduMean',
          key: 'bmduMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMean || 0) - (b.bmduMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmduMedian',
          key: 'bmduMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMedian || 0) - (b.bmduMedian || 0),
        },
        ...(extendedCols || []),
      ],
    },
  ];
}

/**
 * Get the BMDU confidence interval columns
 *
 * Displays BMDU 95% confidence interval bounds (lower and upper).
 *
 * @returns Array of BMDU confidence interval column definitions
 */
export function getBMDUConfidenceColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return createConfidenceColumns('bmdu', 'BMDU 95% CI');
}
