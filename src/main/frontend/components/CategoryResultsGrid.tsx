import React, { useMemo, useState, useEffect } from 'react';
import { Table, Collapse, Checkbox, Popover, Button, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSortedData, setSelectedCategoryIds } from '../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

// Import utilities, types, and column visibility helpers
import {
  ColumnVisibility,
  loadColumnVisibility,
  saveColumnVisibility,
  showAllColumns,
  resetColumnVisibility,
} from './categoryTable/utils';

// Import all column definition functions
import {
  getFixedColumns,
  getGeneCountsColumns,
  getFishersEssentialColumn,
  getFishersFullColumns,
  getBMDEssentialColumns,
  getBMDExtendedColumns,
  getBMDLColumns,
  getBMDUColumns,
  getFilterCountsColumns,
  getPercentilesColumns,
  getDirectionalUpColumns,
  getDirectionalDownColumns,
  getDirectionalAnalysisColumns,
  getZScoresColumns,
  getModelFoldChangeColumns,
  getGeneListsColumns,
} from './categoryTable/columns';

export default function CategoryResultsGrid() {
  const dispatch = useAppDispatch();
  const allData = useAppSelector(selectSortedData);
  const selectedCategoryIds = useAppSelector((state) => state.categoryResults.selectedCategoryIds);

  // Filter toggle state - default OFF (show all rows like desktop)
  const [hideRowsWithoutBMD, setHideRowsWithoutBMD] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);

  // Column visibility state - smart defaults (only essential columns visible)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    return loadColumnVisibility();
  });

  // Save visibility to localStorage when it changes
  useEffect(() => {
    saveColumnVisibility(columnVisibility);
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

  // Build columns dynamically based on visibility state
  const columns: ColumnsType<CategoryAnalysisResultDto> = useMemo(() => {
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
          onClick={() => setColumnVisibility(showAllColumns())}
        >
          Show All
        </Button>
        <Button
          size="small"
          onClick={() => setColumnVisibility(resetColumnVisibility())}
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
            setColumnVisibility({ ...columnVisibility, filterCounts: e.target.checked });
          }}
        >
          Filter Counts (12 columns)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.percentiles}
          onChange={(e) => {
            e.stopPropagation();
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
