import React, { useMemo, useState, useEffect } from 'react';
import { Table, Collapse, Checkbox, Popover, Button, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSortedData, setSelectedCategoryIds } from '../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

// Column visibility state interface
interface ColumnVisibility {
  geneCounts: boolean;
  fishersFull: boolean;
  bmdExtended: boolean;
  bmdlStats: boolean;
  bmduStats: boolean;
  filterCounts: boolean;
  percentiles: boolean;
  directionalUp: boolean;
  directionalDown: boolean;
  directionalAnalysis: boolean;
  zScores: boolean;
  modelFoldChange: boolean;
  geneLists: boolean;
}

export default function CategoryResultsGrid() {
  console.log('CategoryResultsGrid - widths reduced to 50%, scroll set to 1250');
  const dispatch = useAppDispatch();
  const allData = useAppSelector(selectSortedData);
  const selectedCategoryIds = useAppSelector((state) => state.categoryResults.selectedCategoryIds);

  // Filter toggle state - default OFF (show all rows like desktop)
  const [hideRowsWithoutBMD, setHideRowsWithoutBMD] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);

  // Column visibility state - smart defaults (only essential columns visible)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    // Default: only essential columns visible
    const defaults: ColumnVisibility = {
      geneCounts: true,
      fishersFull: false, // Only show Two-Tail P-Value initially
      bmdExtended: false, // Only show Mean & Median initially
      bmdlStats: false,
      bmduStats: false,
      filterCounts: false,
      percentiles: false,
      directionalUp: false,
      directionalDown: false,
      directionalAnalysis: false,
      zScores: false,
      modelFoldChange: false,
      geneLists: false,
    };

    // Try to load from localStorage
    const saved = localStorage.getItem('categoryTable_visibleColumns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all keys exist (in case we added new columns)
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved column visibility:', e);
        return defaults;
      }
    }

    return defaults;
  });

  // Save visibility to localStorage when it changes
  useEffect(() => {
    console.log('=== columnVisibility changed (useEffect) ===');
    console.log(JSON.stringify(columnVisibility, null, 2));
    localStorage.setItem('categoryTable_visibleColumns', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Apply filter based on toggle
  const data = useMemo(() => {
    if (!hideRowsWithoutBMD) {
      return allData;
    }
    // Hide rows where both bmdMean and bmdMedian are null
    return allData.filter(row =>
      row.bmdMean != null || row.bmdMedian != null
    );
  }, [allData, hideRowsWithoutBMD]);

  // Convert Set to array for Ant Design Table
  const selectedKeys = useMemo(() => {
    return Array.from(selectedCategoryIds);
  }, [selectedCategoryIds]);

  // Handle selection change
  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    const categoryIds = selectedRowKeys.map(key => String(key));
    dispatch(setSelectedCategoryIds(categoryIds));
  };

  // Row selection configuration
  const rowSelection: TableProps<CategoryAnalysisResultDto>['rowSelection'] = {
    selectedRowKeys: selectedKeys,
    onChange: handleSelectionChange,
    preserveSelectedRowKeys: true,
  };

  // Format numbers
  const formatNumber = (value: any, decimals: number = 3): string => {
    if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
      return '-';
    }
    return value.toFixed(decimals);
  };

  const formatPValue = (value: any): string => {
    if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) {
      return '-';
    }
    if (value < 0.001) return value.toExponential(2);
    return value.toFixed(4);
  };

  // Define all column groups as functions for conditional rendering
  const getFixedColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
    {
      title: 'Category ID',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 75,
      fixed: 'left',
      sorter: (a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''),
    },
    {
      title: 'Description',
      dataIndex: 'categoryDescription',
      key: 'categoryDescription',
      width: 125,
      ellipsis: true,
      fixed: 'left',
      sorter: (a, b) => (a.categoryDescription || '').localeCompare(b.categoryDescription || ''),
    },
  ];

  const getGeneCountsColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getFishersEssentialColumn = (): ColumnsType<CategoryAnalysisResultDto> => [
    {
      title: "Fisher's Test",
      children: [
        {
          title: 'Two-Tail P',
          dataIndex: 'fishersExactTwoTailPValue',
          key: 'fishersExactTwoTailPValue',
          width: 55,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactTwoTailPValue || 0) - (b.fishersExactTwoTailPValue || 0),
        },
      ],
    },
  ];

  const getFishersFullColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
    {
      title: "Fisher's Exact Test (Full)",
      children: [
        {
          title: 'A',
          dataIndex: 'fishersA',
          key: 'fishersA',
          width: 40,
          align: 'right',
          sorter: (a, b) => (a.fishersA || 0) - (b.fishersA || 0),
        },
        {
          title: 'B',
          dataIndex: 'fishersB',
          key: 'fishersB',
          width: 40,
          align: 'right',
          sorter: (a, b) => (a.fishersB || 0) - (b.fishersB || 0),
        },
        {
          title: 'C',
          dataIndex: 'fishersC',
          key: 'fishersC',
          width: 40,
          align: 'right',
          sorter: (a, b) => (a.fishersC || 0) - (b.fishersC || 0),
        },
        {
          title: 'D',
          dataIndex: 'fishersD',
          key: 'fishersD',
          width: 40,
          align: 'right',
          sorter: (a, b) => (a.fishersD || 0) - (b.fishersD || 0),
        },
        {
          title: 'Left P',
          dataIndex: 'fishersExactLeftPValue',
          key: 'fishersExactLeftPValue',
          width: 55,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactLeftPValue || 0) - (b.fishersExactLeftPValue || 0),
        },
        {
          title: 'Right P',
          dataIndex: 'fishersExactRightPValue',
          key: 'fishersExactRightPValue',
          width: 55,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactRightPValue || 0) - (b.fishersExactRightPValue || 0),
        },
      ],
    },
  ];

  const getBMDEssentialColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getBMDExtendedColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getBMDLColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getBMDUColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getFilterCountsColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
    {
      title: 'Filter Counts',
      children: [
        {
          title: 'R² ≥',
          dataIndex: 'genesWithBMDRSquaredValueGreaterEqualValue',
          key: 'genesWithBMDRSquaredValueGreaterEqualValue',
          width: 45,
          align: 'right',
          sorter: (a, b) => (a.genesWithBMDRSquaredValueGreaterEqualValue || 0) - (b.genesWithBMDRSquaredValueGreaterEqualValue || 0),
        },
        {
          title: 'BMD/BMDL <',
          dataIndex: 'genesWithBMDBMDLRatioBelowValue',
          key: 'genesWithBMDBMDLRatioBelowValue',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.genesWithBMDBMDLRatioBelowValue || 0) - (b.genesWithBMDBMDLRatioBelowValue || 0),
        },
        {
          title: 'BMDU/BMDL <',
          dataIndex: 'genesWithBMDUBMDLRatioBelowValue',
          key: 'genesWithBMDUBMDLRatioBelowValue',
          width: 55,
          align: 'right',
          sorter: (a, b) => (a.genesWithBMDUBMDLRatioBelowValue || 0) - (b.genesWithBMDUBMDLRatioBelowValue || 0),
        },
        {
          title: 'BMDU/BMD <',
          dataIndex: 'genesWithBMDUBMDRatioBelowValue',
          key: 'genesWithBMDUBMDRatioBelowValue',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.genesWithBMDUBMDRatioBelowValue || 0) - (b.genesWithBMDUBMDRatioBelowValue || 0),
        },
        {
          title: 'N-Fold Below',
          dataIndex: 'genesWithNFoldBelowLowPostiveDoseValue',
          key: 'genesWithNFoldBelowLowPostiveDoseValue',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.genesWithNFoldBelowLowPostiveDoseValue || 0) - (b.genesWithNFoldBelowLowPostiveDoseValue || 0),
        },
        {
          title: 'Pre-P ≥',
          dataIndex: 'genesWithPrefilterPValueAboveValue',
          key: 'genesWithPrefilterPValueAboveValue',
          width: 45,
          align: 'right',
          sorter: (a, b) => (a.genesWithPrefilterPValueAboveValue || 0) - (b.genesWithPrefilterPValueAboveValue || 0),
        },
        {
          title: 'Pre-Adj-P ≥',
          dataIndex: 'genesWithPrefilterAdjustedPValueAboveValue',
          key: 'genesWithPrefilterAdjustedPValueAboveValue',
          width: 55,
          align: 'right',
          sorter: (a, b) => (a.genesWithPrefilterAdjustedPValueAboveValue || 0) - (b.genesWithPrefilterAdjustedPValueAboveValue || 0),
        },
        {
          title: 'Not Step Fn',
          dataIndex: 'genesNotStepFunction',
          key: 'genesNotStepFunction',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.genesNotStepFunction || 0) - (b.genesNotStepFunction || 0),
        },
        {
          title: 'Not Step (BMDL)',
          dataIndex: 'genesNotStepFunctionWithBMDLower',
          key: 'genesNotStepFunctionWithBMDLower',
          width: 60,
          align: 'right',
          sorter: (a, b) => (a.genesNotStepFunctionWithBMDLower || 0) - (b.genesNotStepFunctionWithBMDLower || 0),
        },
        {
          title: 'Not Adverse',
          dataIndex: 'genesNotAdverseDirection',
          key: 'genesNotAdverseDirection',
          width: 50,
          align: 'right',
          sorter: (a, b) => (a.genesNotAdverseDirection || 0) - (b.genesNotAdverseDirection || 0),
        },
        {
          title: 'ABS Z-Score ≥',
          dataIndex: 'genesWithABSZScoreAboveValue',
          key: 'genesWithABSZScoreAboveValue',
          width: 55,
          align: 'right',
          sorter: (a, b) => (a.genesWithABSZScoreAboveValue || 0) - (b.genesWithABSZScoreAboveValue || 0),
        },
        {
          title: 'ABS Model FC ≥',
          dataIndex: 'genesWithABSModelFCAboveValue',
          key: 'genesWithABSModelFCAboveValue',
          width: 60,
          align: 'right',
          sorter: (a, b) => (a.genesWithABSModelFCAboveValue || 0) - (b.genesWithABSModelFCAboveValue || 0),
        },
      ],
    },
  ];

  const getPercentilesColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
    {
      title: 'Percentile Values',
      children: [
        {
          title: 'BMD 5th %',
          dataIndex: 'bmdFifthPercentileTotalGenes',
          key: 'bmdFifthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdFifthPercentileTotalGenes || 0) - (b.bmdFifthPercentileTotalGenes || 0),
        },
        {
          title: 'BMD 10th %',
          dataIndex: 'bmdTenthPercentileTotalGenes',
          key: 'bmdTenthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdTenthPercentileTotalGenes || 0) - (b.bmdTenthPercentileTotalGenes || 0),
        },
        {
          title: 'BMDL 5th %',
          dataIndex: 'bmdlFifthPercentileTotalGenes',
          key: 'bmdlFifthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlFifthPercentileTotalGenes || 0) - (b.bmdlFifthPercentileTotalGenes || 0),
        },
        {
          title: 'BMDL 10th %',
          dataIndex: 'bmdlTenthPercentileTotalGenes',
          key: 'bmdlTenthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlTenthPercentileTotalGenes || 0) - (b.bmdlTenthPercentileTotalGenes || 0),
        },
        {
          title: 'BMDU 5th %',
          dataIndex: 'bmduFifthPercentileTotalGenes',
          key: 'bmduFifthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduFifthPercentileTotalGenes || 0) - (b.bmduFifthPercentileTotalGenes || 0),
        },
        {
          title: 'BMDU 10th %',
          dataIndex: 'bmduTenthPercentileTotalGenes',
          key: 'bmduTenthPercentileTotalGenes',
          width: 50,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduTenthPercentileTotalGenes || 0) - (b.bmduTenthPercentileTotalGenes || 0),
        },
      ],
    },
  ];

  const getDirectionalUpColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getDirectionalDownColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getDirectionalAnalysisColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getZScoresColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getModelFoldChangeColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  const getGeneListsColumns = (): ColumnsType<CategoryAnalysisResultDto> => [
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

  // Build columns dynamically based on visibility state
  const columns: ColumnsType<CategoryAnalysisResultDto> = useMemo(() => {
    console.log('=== Building columns (useMemo) ===');
    console.log('columnVisibility:', JSON.stringify(columnVisibility, null, 2));
    const cols: ColumnsType<CategoryAnalysisResultDto> = [];

    // Always show fixed columns
    cols.push(...getFixedColumns());

    // Conditionally add column groups based on visibility
    if (columnVisibility.geneCounts) {
      cols.push(...getGeneCountsColumns());
    }

    // Fisher's Test - show full columns when checked
    if (columnVisibility.fishersFull) {
      cols.push(...getFishersFullColumns());
    }

    // BMD Stats - show extended columns when checked
    if (columnVisibility.bmdExtended) {
      cols.push(...getBMDExtendedColumns());
    }

    // BMDL and BMDU stats
    if (columnVisibility.bmdlStats) {
      cols.push(...getBMDLColumns());
    }
    if (columnVisibility.bmduStats) {
      cols.push(...getBMDUColumns());
    }

    // Advanced column groups
    if (columnVisibility.filterCounts) {
      cols.push(...getFilterCountsColumns());
    }
    if (columnVisibility.percentiles) {
      cols.push(...getPercentilesColumns());
    }
    if (columnVisibility.directionalUp) {
      cols.push(...getDirectionalUpColumns());
    }
    if (columnVisibility.directionalDown) {
      cols.push(...getDirectionalDownColumns());
    }
    if (columnVisibility.directionalAnalysis) {
      cols.push(...getDirectionalAnalysisColumns());
    }
    if (columnVisibility.zScores) {
      cols.push(...getZScoresColumns());
    }
    if (columnVisibility.modelFoldChange) {
      cols.push(...getModelFoldChangeColumns());
    }
    if (columnVisibility.geneLists) {
      cols.push(...getGeneListsColumns());
    }

    console.log('=== Columns built ===');
    console.log('Total column groups:', cols.length);
    return cols;
  }, [columnVisibility]);

  // Custom row styles based on selection
  const getRowClassName = (record: CategoryAnalysisResultDto) => {
    // If there are selections and this row is not selected, dim it
    if (selectedCategoryIds.size > 0 && !selectedCategoryIds.has(record.categoryId || '')) {
      return 'dimmed-row';
    }
    return '';
  };

  // Column visibility popover content
  const columnVisibilityContent = (
    <div style={{ width: '400px', maxHeight: '500px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Button
          size="small"
          onClick={() => setColumnVisibility({
            geneCounts: true,
            fishersFull: true,
            bmdExtended: true,
            bmdlStats: true,
            bmduStats: true,
            filterCounts: true,
            percentiles: true,
            directionalUp: true,
            directionalDown: true,
            directionalAnalysis: true,
            zScores: true,
            modelFoldChange: true,
            geneLists: true,
          })}
        >
          Show All
        </Button>
        <Button
          size="small"
          onClick={() => setColumnVisibility({
            geneCounts: true,
            fishersFull: false,
            bmdExtended: false,
            bmdlStats: false,
            bmduStats: false,
            filterCounts: false,
            percentiles: false,
            directionalUp: false,
            directionalDown: false,
            directionalAnalysis: false,
            zScores: false,
            modelFoldChange: false,
            geneLists: false,
          })}
        >
          Reset to Defaults
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          Essential Columns
        </div>
        <Checkbox
          checked={columnVisibility.geneCounts}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, geneCounts: e.target.checked });
          }}
        >
          Gene Counts (Passed, All, %)
        </Checkbox>

        <div style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          Statistics Columns
        </div>
        <Checkbox
          checked={columnVisibility.fishersFull}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, fishersFull: e.target.checked });
          }}
        >
          Fisher's Test - Full (A, B, C, D, Left P, Right P)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.bmdExtended}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdExtended: e.target.checked });
          }}
        >
          BMD Statistics - Extended (Min, SD, Weighted)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.bmdlStats}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdlStats: e.target.checked });
          }}
        >
          BMDL Statistics
        </Checkbox>
        <Checkbox
          checked={columnVisibility.bmduStats}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmduStats: e.target.checked });
          }}
        >
          BMDU Statistics
        </Checkbox>

        <div style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          Advanced Columns
        </div>
        <Checkbox
          checked={columnVisibility.filterCounts}
          onChange={(e) => {
            e.stopPropagation();
            console.log('=== Filter Counts checkbox onChange ===');
            console.log('e.target.checked:', e.target.checked);
            console.log('columnVisibility.filterCounts (current):', columnVisibility.filterCounts);
            console.log('Full current state:', JSON.stringify(columnVisibility, null, 2));
            const newState = { ...columnVisibility, filterCounts: e.target.checked };
            console.log('New state:', JSON.stringify(newState, null, 2));
            setColumnVisibility(newState);
          }}
        >
          Filter Counts (12 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.percentiles}
          onChange={(e) => {
            e.stopPropagation();
            console.log('=== Percentiles checkbox onChange ===');
            console.log('e.target.checked:', e.target.checked);
            setColumnVisibility({ ...columnVisibility, percentiles: e.target.checked });
          }}
        >
          Percentile Values (6 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.directionalUp}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, directionalUp: e.target.checked });
          }}
        >
          Directional Stats - UP Genes (9 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.directionalDown}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, directionalDown: e.target.checked });
          }}
        >
          Directional Stats - DOWN Genes (9 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.directionalAnalysis}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, directionalAnalysis: e.target.checked });
          }}
        >
          Directional Analysis (4 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.zScores}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, zScores: e.target.checked });
          }}
        >
          Z-Score Statistics (4 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.modelFoldChange}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, modelFoldChange: e.target.checked });
          }}
        >
          Model Fold Change (4 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.geneLists}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, geneLists: e.target.checked });
          }}
        >
          Gene Lists (2 columns)
        </Checkbox>
      </Space>
    </div>
  );

  // Collapse items configuration
  const collapseItems = [
    {
      key: '1',
      label: (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span>Category Results ({data.length} categories{hideRowsWithoutBMD ? ` / ${allData.length} total` : ''})</span>
          <Checkbox
            checked={hideRowsWithoutBMD}
            onChange={(e) => setHideRowsWithoutBMD(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          >
            Hide rows without BMD
          </Checkbox>
          <Popover
            content={columnVisibilityContent}
            title="Configure Table Columns"
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              icon={<SettingOutlined />}
              onClick={(e) => e.stopPropagation()}
              size="small"
            >
              Configure Columns
            </Button>
          </Popover>
        </div>
      ),
      children: (
        <Table<CategoryAnalysisResultDto>
          columns={columns}
          dataSource={data}
          rowKey="categoryId"
          rowSelection={rowSelection}
          rowClassName={getRowClassName}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['2', '5', '10', '25', '50', '100', '200'],
            onShowSizeChange: (current, size) => setPageSize(size),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
          }}
          scroll={{ x: 1250 }}
          tableLayout="fixed"
          size="small"
        />
      ),
    },
  ];

  return (
    <>
      <style>
        {`
          .dimmed-row {
            opacity: 0.3;
          }
          .dimmed-row:hover {
            opacity: 0.6;
          }
        `}
      </style>
      <Collapse
        defaultActiveKey={['1']}
        items={collapseItems}
        style={{ height: '100%' }}
      />
    </>
  );
}
