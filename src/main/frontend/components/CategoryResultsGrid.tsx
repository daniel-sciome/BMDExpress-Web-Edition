import React, { useMemo, useState } from 'react';
import { Table, Collapse, Checkbox } from 'antd';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSortedData, setSelectedCategoryIds } from '../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function CategoryResultsGrid() {
  const dispatch = useAppDispatch();
  const allData = useAppSelector(selectSortedData);
  const selectedCategoryIds = useAppSelector((state) => state.categoryResults.selectedCategoryIds);

  // Filter toggle state - default OFF (show all rows like desktop)
  const [hideRowsWithoutBMD, setHideRowsWithoutBMD] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);

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

  // Table columns with Priority 1 fields
  const columns: ColumnsType<CategoryAnalysisResultDto> = [
    // Fixed left columns
    {
      title: 'Category ID',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 150,
      fixed: 'left',
      sorter: (a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''),
    },
    {
      title: 'Description',
      dataIndex: 'categoryDescription',
      key: 'categoryDescription',
      width: 250,
      ellipsis: true,
      fixed: 'left',
      sorter: (a, b) => (a.categoryDescription || '').localeCompare(b.categoryDescription || ''),
    },

    // Gene Counts Group
    {
      title: 'Gene Counts',
      children: [
        {
          title: 'Genes (Passed)',
          dataIndex: 'genesThatPassedAllFilters',
          key: 'genesThatPassedAllFilters',
          width: 110,
          align: 'right',
          sorter: (a, b) => (a.genesThatPassedAllFilters || 0) - (b.genesThatPassedAllFilters || 0),
        },
        {
          title: 'All Genes',
          dataIndex: 'geneAllCount',
          key: 'geneAllCount',
          width: 100,
          align: 'right',
          sorter: (a, b) => (a.geneAllCount || 0) - (b.geneAllCount || 0),
        },
        {
          title: '%',
          dataIndex: 'percentage',
          key: 'percentage',
          width: 80,
          align: 'right',
          render: (value: number) => formatNumber(value, 2),
          sorter: (a, b) => (a.percentage || 0) - (b.percentage || 0),
        },
      ],
    },

    // Fisher's Exact Test Group
    {
      title: "Fisher's Exact Test",
      children: [
        {
          title: 'A',
          dataIndex: 'fishersA',
          key: 'fishersA',
          width: 80,
          align: 'right',
          sorter: (a, b) => (a.fishersA || 0) - (b.fishersA || 0),
        },
        {
          title: 'B',
          dataIndex: 'fishersB',
          key: 'fishersB',
          width: 80,
          align: 'right',
          sorter: (a, b) => (a.fishersB || 0) - (b.fishersB || 0),
        },
        {
          title: 'C',
          dataIndex: 'fishersC',
          key: 'fishersC',
          width: 80,
          align: 'right',
          sorter: (a, b) => (a.fishersC || 0) - (b.fishersC || 0),
        },
        {
          title: 'D',
          dataIndex: 'fishersD',
          key: 'fishersD',
          width: 80,
          align: 'right',
          sorter: (a, b) => (a.fishersD || 0) - (b.fishersD || 0),
        },
        {
          title: 'Left P',
          dataIndex: 'fishersExactLeftPValue',
          key: 'fishersExactLeftPValue',
          width: 110,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactLeftPValue || 0) - (b.fishersExactLeftPValue || 0),
        },
        {
          title: 'Right P',
          dataIndex: 'fishersExactRightPValue',
          key: 'fishersExactRightPValue',
          width: 110,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactRightPValue || 0) - (b.fishersExactRightPValue || 0),
        },
        {
          title: 'Two-Tail P',
          dataIndex: 'fishersExactTwoTailPValue',
          key: 'fishersExactTwoTailPValue',
          width: 110,
          align: 'right',
          render: (value: number) => formatPValue(value),
          sorter: (a, b) => (a.fishersExactTwoTailPValue || 0) - (b.fishersExactTwoTailPValue || 0),
        },
      ],
    },

    // BMD Statistics Group
    {
      title: 'BMD Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmdMean',
          key: 'bmdMean',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMean || 0) - (b.bmdMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmdMedian',
          key: 'bmdMedian',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMedian || 0) - (b.bmdMedian || 0),
        },
        {
          title: 'Min',
          dataIndex: 'bmdMinimum',
          key: 'bmdMinimum',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdMinimum || 0) - (b.bmdMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmdSD',
          key: 'bmdSD',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdSD || 0) - (b.bmdSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmdWMean',
          key: 'bmdWMean',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdWMean || 0) - (b.bmdWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmdWSD',
          key: 'bmdWSD',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdWSD || 0) - (b.bmdWSD || 0),
        },
      ],
    },

    // BMDL Statistics Group
    {
      title: 'BMDL Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmdlMean',
          key: 'bmdlMean',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMean || 0) - (b.bmdlMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmdlMedian',
          key: 'bmdlMedian',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMedian || 0) - (b.bmdlMedian || 0),
        },
        {
          title: 'Min',
          dataIndex: 'bmdlMinimum',
          key: 'bmdlMinimum',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlMinimum || 0) - (b.bmdlMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmdlSD',
          key: 'bmdlSD',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlSD || 0) - (b.bmdlSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmdlWMean',
          key: 'bmdlWMean',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlWMean || 0) - (b.bmdlWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmdlWSD',
          key: 'bmdlWSD',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmdlWSD || 0) - (b.bmdlWSD || 0),
        },
      ],
    },

    // BMDU Statistics Group
    {
      title: 'BMDU Statistics',
      children: [
        {
          title: 'Mean',
          dataIndex: 'bmduMean',
          key: 'bmduMean',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMean || 0) - (b.bmduMean || 0),
        },
        {
          title: 'Median',
          dataIndex: 'bmduMedian',
          key: 'bmduMedian',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMedian || 0) - (b.bmduMedian || 0),
        },
        {
          title: 'Min',
          dataIndex: 'bmduMinimum',
          key: 'bmduMinimum',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduMinimum || 0) - (b.bmduMinimum || 0),
        },
        {
          title: 'SD',
          dataIndex: 'bmduSD',
          key: 'bmduSD',
          width: 110,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduSD || 0) - (b.bmduSD || 0),
        },
        {
          title: 'Weighted Mean',
          dataIndex: 'bmduWMean',
          key: 'bmduWMean',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduWMean || 0) - (b.bmduWMean || 0),
        },
        {
          title: 'Weighted SD',
          dataIndex: 'bmduWSD',
          key: 'bmduWSD',
          width: 120,
          align: 'right',
          render: (value: number) => formatNumber(value),
          sorter: (a, b) => (a.bmduWSD || 0) - (b.bmduWSD || 0),
        },
      ],
    },
  ];

  // Custom row styles based on selection
  const getRowClassName = (record: CategoryAnalysisResultDto) => {
    // If there are selections and this row is not selected, dim it
    if (selectedCategoryIds.size > 0 && !selectedCategoryIds.has(record.categoryId || '')) {
      return 'dimmed-row';
    }
    return '';
  };

  // Collapse items configuration
  const collapseItems = [
    {
      key: '1',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Category Results ({data.length} categories{hideRowsWithoutBMD ? ` / ${allData.length} total` : ''})</span>
          <Checkbox
            checked={hideRowsWithoutBMD}
            onChange={(e) => setHideRowsWithoutBMD(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          >
            Hide rows without BMD
          </Checkbox>
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
          scroll={{ x: 2500 }}
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
