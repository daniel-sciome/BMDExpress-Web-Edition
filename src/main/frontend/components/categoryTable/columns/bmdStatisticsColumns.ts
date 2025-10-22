/**
 * Category Results Table - BMD Statistics Columns
 *
 * This file contains column definitions for BMD (Benchmark Dose) statistics,
 * including essential BMD columns, extended BMD statistics, and BMDL/BMDU columns.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

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
  return [
    {
      title: 'BMD Statistics (Extended)',
      children: [
        {
          title: 'Min',
          dataIndex: 'bmdMinimum',
          key: 'bmdMinimum',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMinimum || 0) - (b.bmdMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmdSD',
          key: 'bmdSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdSD || 0) - (b.bmdSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmdWMean',
          key: 'bmdWMean',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdWMean || 0) - (b.bmdWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmdWSD',
          key: 'bmdWSD',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdWSD || 0) - (b.bmdWSD || 0),
        },
      ],
    },
  ];
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
        {
          title: 'Min',
          dataIndex: 'bmdlMinimum',
          key: 'bmdlMinimum',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMinimum || 0) - (b.bmdlMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmdlSD',
          key: 'bmdlSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlSD || 0) - (b.bmdlSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmdlWMean',
          key: 'bmdlWMean',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlWMean || 0) - (b.bmdlWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmdlWSD',
          key: 'bmdlWSD',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlWSD || 0) - (b.bmdlWSD || 0),
        },
      ],
    },
  ];
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
        {
          title: 'Min',
          dataIndex: 'bmduMinimum',
          key: 'bmduMinimum',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMinimum || 0) - (b.bmduMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmduSD',
          key: 'bmduSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduSD || 0) - (b.bmduSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmduWMean',
          key: 'bmduWMean',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduWMean || 0) - (b.bmduWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmduWSD',
          key: 'bmduWSD',
          width: 60,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduWSD || 0) - (b.bmduWSD || 0),
        },
      ],
    },
  ];
}
