import React, { useMemo } from 'react';
import { Table, Collapse } from 'antd';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSortedData, setSelectedCategoryIds } from '../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

export default function CategoryResultsGrid() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectSortedData);
  const selectedCategoryIds = useAppSelector((state) => state.categoryResults.selectedCategoryIds);

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

  // Table columns
  const columns: ColumnsType<CategoryAnalysisResultDto> = [
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
      ellipsis: true,
      sorter: (a, b) => (a.categoryDescription || '').localeCompare(b.categoryDescription || ''),
    },
    {
      title: 'Genes',
      dataIndex: 'genesThatPassedAllFilters',
      key: 'genesThatPassedAllFilters',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.genesThatPassedAllFilters || 0) - (b.genesThatPassedAllFilters || 0),
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
    {
      title: 'Fisher P-Value',
      dataIndex: 'fishersExactTwoTailPValue',
      key: 'fishersExactTwoTailPValue',
      width: 130,
      align: 'right',
      render: (value: number) => formatPValue(value),
      sorter: (a, b) => (a.fishersExactTwoTailPValue || 0) - (b.fishersExactTwoTailPValue || 0),
    },
    {
      title: 'BMD Mean',
      dataIndex: 'bmdMean',
      key: 'bmdMean',
      width: 110,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdMean || 0) - (b.bmdMean || 0),
    },
    {
      title: 'BMDL Mean',
      dataIndex: 'bmdlMean',
      key: 'bmdlMean',
      width: 110,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdlMean || 0) - (b.bmdlMean || 0),
    },
    {
      title: 'BMDU Mean',
      dataIndex: 'bmduMean',
      key: 'bmduMean',
      width: 110,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmduMean || 0) - (b.bmduMean || 0),
    },
    {
      title: 'BMD Median',
      dataIndex: 'bmdMedian',
      key: 'bmdMedian',
      width: 110,
      align: 'right',
      render: (value: number) => formatNumber(value),
      sorter: (a, b) => (a.bmdMedian || 0) - (b.bmdMedian || 0),
    },
    {
      title: 'All Genes',
      dataIndex: 'geneAllCount',
      key: 'geneAllCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.geneAllCount || 0) - (b.geneAllCount || 0),
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
      label: `Category Results (${data.length} categories)`,
      children: (
        <Table<CategoryAnalysisResultDto>
          columns={columns}
          dataSource={data}
          rowKey="categoryId"
          rowSelection={rowSelection}
          rowClassName={getRowClassName}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
          }}
          scroll={{ x: 1200, y: 400 }}
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
