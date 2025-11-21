/**
 * Category Results Table - Fisher's Exact Test Columns
 *
 * This file contains column definitions for Fisher's Exact Test statistics,
 * including both essential (two-tail p-value) and full (A, B, C, D, left/right p-values).
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatPValue } from '../utils/formatters';
import { formatHeader } from '../utils/headerFormatting';

/**
 * Get the essential Fisher's Exact Test column (Two-Tail P-Value only)
 *
 * This column shows the two-tailed p-value from Fisher's exact test,
 * which is typically the most relevant statistic for category enrichment.
 *
 * @returns Array containing the essential Fisher's test column
 */
export function getFishersEssentialColumn(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: formatHeader("Fisher's Test"),
      align: 'center',
      children: [
        {
          title: formatHeader('Two-Tail P'),
          dataIndex: 'fishersExactTwoTailPValue',
          key: 'fishersExactTwoTailPValue',
          width: 55,
          align: 'center',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactTwoTailPValue || 0) - (b.fishersExactTwoTailPValue || 0),
        },
      ],
    },
  ];
}

/**
 * Get the full Fisher's Exact Test columns
 *
 * Displays all Fisher's exact test statistics including:
 * - A, B, C, D: Contingency table values
 * - Left P-Value: One-tailed test (left side)
 * - Right P-Value: One-tailed test (right side)
 *
 * @returns Array of full Fisher's test column definitions
 */
export function getFishersFullColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: formatHeader("Fisher's Exact Test (Full)"),
      align: 'center',
      children: [
        {
          title: formatHeader('A'),
          dataIndex: 'fishersA',
          key: 'fishersA',
          width: 40,
          align: 'center',
          sorter: (a, b) => (a.fishersA || 0) - (b.fishersA || 0),
        },
        {
          title: formatHeader('B'),
          dataIndex: 'fishersB',
          key: 'fishersB',
          width: 40,
          align: 'center',
          sorter: (a, b) => (a.fishersB || 0) - (b.fishersB || 0),
        },
        {
          title: formatHeader('C'),
          dataIndex: 'fishersC',
          key: 'fishersC',
          width: 40,
          align: 'center',
          sorter: (a, b) => (a.fishersC || 0) - (b.fishersC || 0),
        },
        {
          title: formatHeader('D'),
          dataIndex: 'fishersD',
          key: 'fishersD',
          width: 40,
          align: 'center',
          sorter: (a, b) => (a.fishersD || 0) - (b.fishersD || 0),
        },
        {
          title: formatHeader('Left P'),
          dataIndex: 'fishersExactLeftPValue',
          key: 'fishersExactLeftPValue',
          width: 55,
          align: 'center',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactLeftPValue || 0) - (b.fishersExactLeftPValue || 0),
        },
        {
          title: formatHeader('Right P'),
          dataIndex: 'fishersExactRightPValue',
          key: 'fishersExactRightPValue',
          width: 55,
          align: 'center',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactRightPValue || 0) - (b.fishersExactRightPValue || 0),
        },
      ],
    },
  ];
}
