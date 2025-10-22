/**
 * Category Results Table - Directional Analysis Columns
 *
 * This file contains column definitions for directional gene analysis,
 * including statistics for up-regulated genes, down-regulated genes,
 * and overall directional analysis.
 */

import type { ColumnsType } from 'antd/es/table';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import { formatNumber } from '../utils/formatters';

/**
 * Get the up-regulated genes columns
 *
 * Displays BMD, BMDL, and BMDU statistics (mean, median, SD) specifically
 * for genes that are up-regulated in the category.
 *
 * @returns Array of up-regulated gene column definitions
 */
export function getDirectionalUpColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'UP-Regulated Genes',
      children: [
        {
          title: 'BMD Mean',
          dataIndex: 'genesUpBMDMean',
          key: 'genesUpBMDMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDMean || 0) - (b.genesUpBMDMean || 0),
        },
        {
          title: 'BMD Median',
          dataIndex: 'genesUpBMDMedian',
          key: 'genesUpBMDMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDMedian || 0) - (b.genesUpBMDMedian || 0),
        },
        {
          title: 'BMD SD',
          dataIndex: 'genesUpBMDSD',
          key: 'genesUpBMDSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDSD || 0) - (b.genesUpBMDSD || 0),
        },
        {
          title: 'BMDL Mean',
          dataIndex: 'genesUpBMDLMean',
          key: 'genesUpBMDLMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDLMean || 0) - (b.genesUpBMDLMean || 0),
        },
        {
          title: 'BMDL Median',
          dataIndex: 'genesUpBMDLMedian',
          key: 'genesUpBMDLMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDLMedian || 0) - (b.genesUpBMDLMedian || 0),
        },
        {
          title: 'BMDL SD',
          dataIndex: 'genesUpBMDLSD',
          key: 'genesUpBMDLSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDLSD || 0) - (b.genesUpBMDLSD || 0),
        },
        {
          title: 'BMDU Mean',
          dataIndex: 'genesUpBMDUMean',
          key: 'genesUpBMDUMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDUMean || 0) - (b.genesUpBMDUMean || 0),
        },
        {
          title: 'BMDU Median',
          dataIndex: 'genesUpBMDUMedian',
          key: 'genesUpBMDUMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDUMedian || 0) - (b.genesUpBMDUMedian || 0),
        },
        {
          title: 'BMDU SD',
          dataIndex: 'genesUpBMDUSD',
          key: 'genesUpBMDUSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesUpBMDUSD || 0) - (b.genesUpBMDUSD || 0),
        },
      ],
    },
  ];
}

/**
 * Get the down-regulated genes columns
 *
 * Displays BMD, BMDL, and BMDU statistics (mean, median, SD) specifically
 * for genes that are down-regulated in the category.
 *
 * @returns Array of down-regulated gene column definitions
 */
export function getDirectionalDownColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'DOWN-Regulated Genes',
      children: [
        {
          title: 'BMD Mean',
          dataIndex: 'genesDownBMDMean',
          key: 'genesDownBMDMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDMean || 0) - (b.genesDownBMDMean || 0),
        },
        {
          title: 'BMD Median',
          dataIndex: 'genesDownBMDMedian',
          key: 'genesDownBMDMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDMedian || 0) - (b.genesDownBMDMedian || 0),
        },
        {
          title: 'BMD SD',
          dataIndex: 'genesDownBMDSD',
          key: 'genesDownBMDSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDSD || 0) - (b.genesDownBMDSD || 0),
        },
        {
          title: 'BMDL Mean',
          dataIndex: 'genesDownBMDLMean',
          key: 'genesDownBMDLMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDLMean || 0) - (b.genesDownBMDLMean || 0),
        },
        {
          title: 'BMDL Median',
          dataIndex: 'genesDownBMDLMedian',
          key: 'genesDownBMDLMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDLMedian || 0) - (b.genesDownBMDLMedian || 0),
        },
        {
          title: 'BMDL SD',
          dataIndex: 'genesDownBMDLSD',
          key: 'genesDownBMDLSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDLSD || 0) - (b.genesDownBMDLSD || 0),
        },
        {
          title: 'BMDU Mean',
          dataIndex: 'genesDownBMDUMean',
          key: 'genesDownBMDUMean',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDUMean || 0) - (b.genesDownBMDUMean || 0),
        },
        {
          title: 'BMDU Median',
          dataIndex: 'genesDownBMDUMedian',
          key: 'genesDownBMDUMedian',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDUMedian || 0) - (b.genesDownBMDUMedian || 0),
        },
        {
          title: 'BMDU SD',
          dataIndex: 'genesDownBMDUSD',
          key: 'genesDownBMDUSD',
          width: 55,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.genesDownBMDUSD || 0) - (b.genesDownBMDUSD || 0),
        },
      ],
    },
  ];
}

/**
 * Get the directional analysis columns
 *
 * Displays overall directional statistics including:
 * - Overall direction (UP/DOWN/CONFLICT)
 * - Percentage of genes with UP regulation
 * - Percentage of genes with DOWN regulation
 * - Percentage of genes with conflicting directions
 *
 * @returns Array of directional analysis column definitions
 */
export function getDirectionalAnalysisColumns(): ColumnsType<CategoryAnalysisResultDto> {
  return [
    {
      title: 'Directional Analysis',
      children: [
        {
          title: 'Overall Direction',
          dataIndex: 'overallDirection',
          key: 'overallDirection',
          width: 60,
          align: 'center',
          sorter: (a, b) => (a.overallDirection || '').localeCompare(b.overallDirection || ''),
        },
        {
          title: '% UP',
          dataIndex: 'percentWithOverallDirectionUP',
          key: 'percentWithOverallDirectionUP',
          width: 45,
          align: 'right',
          render: (value: number) => formatNumber(value, 1),
          sorter: (a, b) => (a.percentWithOverallDirectionUP || 0) - (b.percentWithOverallDirectionUP || 0),
        },
        {
          title: '% DOWN',
          dataIndex: 'percentWithOverallDirectionDOWN',
          key: 'percentWithOverallDirectionDOWN',
          width: 45,
          align: 'right',
          render: (value: number) => formatNumber(value, 1),
          sorter: (a, b) => (a.percentWithOverallDirectionDOWN || 0) - (b.percentWithOverallDirectionDOWN || 0),
        },
        {
          title: '% Conflict',
          dataIndex: 'percentWithOverallDirectionConflict',
          key: 'percentWithOverallDirectionConflict',
          width: 45,
          align: 'right',
          render: (value: number) => formatNumber(value, 1),
          sorter: (a, b) => (a.percentWithOverallDirectionConflict || 0) - (b.percentWithOverallDirectionConflict || 0),
        },
      ],
    },
  ];
}
