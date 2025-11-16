import React, { useMemo, useState, useEffect } from 'react';
import { Table, Collapse, Checkbox, Popover, Button, Space, Tag } from 'antd';
import { SettingOutlined, CheckSquareOutlined, CloseSquareOutlined, SwapOutlined } from '@ant-design/icons';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectSortedData,
  setSelectedCategoryIds,
  selectAllCategories,
  clearSelection,
  invertSelection,
  selectIsAnythingSelected,
  selectSelectedCount
} from '../store/slices/categoryResultsSlice';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';

// Import utilities, types, and column visibility helpers
import {
  ColumnVisibility,
  DEFAULT_COLUMN_VISIBILITY,
  COLUMN_VISIBILITY_STORAGE_KEY,
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
  getBMDConfidenceColumns,
  getBMDLColumns,
  getBMDLConfidenceColumns,
  getBMDUColumns,
  getBMDUConfidenceColumns,
  getFilterCountsColumns,
  getPercentilesColumns,
  getDirectionalUpColumns,
  getDirectionalDownColumns,
  getDirectionalAnalysisColumns,
  getFoldChangeColumns,
  getZScoresColumns,
  getModelFoldChangeColumns,
  getGeneListsColumns,
} from './categoryTable/columns';

export default function CategoryResultsGrid() {
  const dispatch = useAppDispatch();
  const allData = useAppSelector(selectSortedData);
  const selectedCategoryIds = useAppSelector((state) => state.categoryResults.selectedCategoryIds);

  // Phase 7: Selection state from Phase 3 selectors
  const isAnythingSelected = useAppSelector(selectIsAnythingSelected);
  const selectedCount = useAppSelector(selectSelectedCount);

  // Debug logging
  useEffect(() => {
    console.log('[CategoryResultsGrid] Component mounted/updated with data:', {
      dataLength: allData.length,
      selectedCount: selectedCategoryIds.size,
      firstCategory: allData[0]?.categoryDescription || 'none',
      firstCategoryId: allData[0]?.categoryId || 'none',
      first5Categories: allData.slice(0, 5).map(c => ({
        id: c.categoryId,
        desc: c.categoryDescription?.substring(0, 40)
      }))
    });
    return () => {
      console.log('[CategoryResultsGrid] Component unmounting');
    };
  }, [allData.length, selectedCategoryIds.size]);

  // Filter toggle state - default OFF (show all rows like desktop)
  const [hideRowsWithoutBMD, setHideRowsWithoutBMD] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(50);

  // Remember column selection preference
  const [rememberColumnSelection, setRememberColumnSelection] = useState<boolean>(() => {
    const saved = localStorage.getItem('categoryTable_rememberColumns');
    return saved === 'true';
  });

  // Column visibility state - load from localStorage only if user wants to remember
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (rememberColumnSelection) {
      return loadColumnVisibility();
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  // Save visibility to localStorage only if user wants to remember
  useEffect(() => {
    if (rememberColumnSelection) {
      saveColumnVisibility(columnVisibility);
    }
  }, [columnVisibility, rememberColumnSelection]);

  // Save the "remember" preference itself
  useEffect(() => {
    localStorage.setItem('categoryTable_rememberColumns', String(rememberColumnSelection));
    // If user unchecks "remember", clear saved column settings and reset to defaults
    if (!rememberColumnSelection) {
      localStorage.removeItem(COLUMN_VISIBILITY_STORAGE_KEY);
      setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
    }
  }, [rememberColumnSelection]);

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

  // Phase 7: Bulk selection handlers (operate on filtered data only)
  const handleSelectAll = () => {
    // Get all visible category IDs (after Master Filter and hideRowsWithoutBMD)
    const visibleIds = data.map(cat => cat.categoryId).filter(Boolean) as string[];
    dispatch(selectAllCategories(visibleIds));
  };

  const handleClearSelection = () => {
    dispatch(clearSelection());
  };

  const handleInvertSelection = () => {
    // Invert within visible categories only
    const visibleIds = data.map(cat => cat.categoryId).filter(Boolean) as string[];
    dispatch(invertSelection(visibleIds));
  };

  // Row selection configuration
  const rowSelection: TableProps<CategoryAnalysisResultDto>['rowSelection'] = {
    type: 'checkbox',
    selectedRowKeys: selectedKeys,
    onChange: handleSelectionChange,
    preserveSelectedRowKeys: true,
    // Allow selection from the start - no restrictions
    getCheckboxProps: () => ({
      disabled: false,
    }),
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
    if (columnVisibility.bmdConfidence) {
      cols.push(...getBMDConfidenceColumns());
    }

    // BMDL stats
    if (columnVisibility.bmdlStats) {
      cols.push(...getBMDLColumns());
    }
    if (columnVisibility.bmdlConfidence) {
      cols.push(...getBMDLConfidenceColumns());
    }

    // BMDU stats
    if (columnVisibility.bmduStats) {
      cols.push(...getBMDUColumns());
    }
    if (columnVisibility.bmduConfidence) {
      cols.push(...getBMDUConfidenceColumns());
    }

    // Advanced column groups - pass individual column visibility
    // Show group if master toggle is on OR if any individual column is visible
    if (columnVisibility.filterCounts.all || Object.values(columnVisibility.filterCounts.columns).some(v => v)) {
      cols.push(...getFilterCountsColumns(
        columnVisibility.filterCounts.all ? undefined : columnVisibility.filterCounts.columns
      ));
    }
    if (columnVisibility.percentiles.all || Object.values(columnVisibility.percentiles.columns).some(v => v)) {
      cols.push(...getPercentilesColumns(
        columnVisibility.percentiles.all ? undefined : columnVisibility.percentiles.columns
      ));
    }
    if (columnVisibility.directionalUp.all || Object.values(columnVisibility.directionalUp.columns).some(v => v)) {
      cols.push(...getDirectionalUpColumns(
        columnVisibility.directionalUp.all ? undefined : columnVisibility.directionalUp.columns
      ));
    }
    if (columnVisibility.directionalDown.all || Object.values(columnVisibility.directionalDown.columns).some(v => v)) {
      cols.push(...getDirectionalDownColumns(
        columnVisibility.directionalDown.all ? undefined : columnVisibility.directionalDown.columns
      ));
    }
    if (columnVisibility.directionalAnalysis.all || Object.values(columnVisibility.directionalAnalysis.columns).some(v => v)) {
      cols.push(...getDirectionalAnalysisColumns(
        columnVisibility.directionalAnalysis.all ? undefined : columnVisibility.directionalAnalysis.columns
      ));
    }
    if (columnVisibility.foldChange.all || Object.values(columnVisibility.foldChange.columns).some(v => v)) {
      cols.push(...getFoldChangeColumns(
        columnVisibility.foldChange.all ? undefined : columnVisibility.foldChange.columns
      ));
    }
    if (columnVisibility.zScores.all || Object.values(columnVisibility.zScores.columns).some(v => v)) {
      cols.push(...getZScoresColumns(
        columnVisibility.zScores.all ? undefined : columnVisibility.zScores.columns
      ));
    }
    if (columnVisibility.modelFoldChange.all || Object.values(columnVisibility.modelFoldChange.columns).some(v => v)) {
      cols.push(...getModelFoldChangeColumns(
        columnVisibility.modelFoldChange.all ? undefined : columnVisibility.modelFoldChange.columns
      ));
    }
    if (columnVisibility.geneLists.all || Object.values(columnVisibility.geneLists.columns).some(v => v)) {
      cols.push(...getGeneListsColumns(
        columnVisibility.geneLists.all ? undefined : columnVisibility.geneLists.columns
      ));
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
      <div style={{ marginBottom: '16px' }}>
        <Checkbox
          checked={rememberColumnSelection}
          onChange={(e) => setRememberColumnSelection(e.target.checked)}
          style={{ marginBottom: '12px' }}
        >
          Remember Column Selection
        </Checkbox>
        <div style={{ display: 'flex', gap: '8px' }}>
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
          Gene Counts (4 columns)
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
          checked={columnVisibility.bmdConfidence}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdConfidence: e.target.checked });
          }}
        >
          BMD 95% Confidence Interval
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
          checked={columnVisibility.bmdlConfidence}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdlConfidence: e.target.checked });
          }}
        >
          BMDL 95% Confidence Interval
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
        <Checkbox
          checked={columnVisibility.bmduConfidence}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmduConfidence: e.target.checked });
          }}
        >
          BMDU 95% Confidence Interval
        </Checkbox>

        <div style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          Advanced Columns
        </div>
        <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', marginBottom: '8px' }}>
          Click group names to expand and select individual columns
        </div>

        {/* Filter Counts */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'filterCounts',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.filterCounts.all}
                  indeterminate={!columnVisibility.filterCounts.all && Object.values(columnVisibility.filterCounts.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      filterCounts: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.filterCounts.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Filter Counts (15 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    bmdLessEqualHighDose: 'BMD ≤ High Dose',
                    bmdPValueGreaterEqual: 'BMD P-Value ≥',
                    foldChangeAbove: 'Fold Change ≥',
                    rSquared: 'R² ≥',
                    bmdBmdlRatio: 'BMD/BMDL <',
                    bmduBmdlRatio: 'BMDU/BMDL <',
                    bmduBmdRatio: 'BMDU/BMD <',
                    nFoldBelow: 'N-Fold Below',
                    prefilterPValue: 'Pre-P ≥',
                    prefilterAdjustedPValue: 'Pre-Adj-P ≥',
                    notStepFunction: 'Not Step Fn',
                    notStepFunctionBMDL: 'Not Step (BMDL)',
                    notAdverse: 'Not Adverse',
                    absZScore: 'ABS Z-Score ≥',
                    absModelFC: 'ABS Model FC ≥',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.filterCounts.columns[key as keyof typeof columnVisibility.filterCounts.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          filterCounts: {
                            ...columnVisibility.filterCounts,
                            all: false,
                            columns: {
                              ...columnVisibility.filterCounts.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Percentiles */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'percentiles',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.percentiles.all}
                  indeterminate={!columnVisibility.percentiles.all && Object.values(columnVisibility.percentiles.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      percentiles: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.percentiles.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Percentile Values (6 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    bmd5th: 'BMD 5th %',
                    bmd10th: 'BMD 10th %',
                    bmdl5th: 'BMDL 5th %',
                    bmdl10th: 'BMDL 10th %',
                    bmdu5th: 'BMDU 5th %',
                    bmdu10th: 'BMDU 10th %',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.percentiles.columns[key as keyof typeof columnVisibility.percentiles.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          percentiles: {
                            ...columnVisibility.percentiles,
                            all: false,
                            columns: {
                              ...columnVisibility.percentiles.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Directional UP */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'directionalUp',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.directionalUp.all}
                  indeterminate={!columnVisibility.directionalUp.all && Object.values(columnVisibility.directionalUp.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      directionalUp: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.directionalUp.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Directional Stats - UP Genes (9 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    bmdMean: 'BMD Mean',
                    bmdMedian: 'BMD Median',
                    bmdSD: 'BMD SD',
                    bmdlMean: 'BMDL Mean',
                    bmdlMedian: 'BMDL Median',
                    bmdlSD: 'BMDL SD',
                    bmduMean: 'BMDU Mean',
                    bmduMedian: 'BMDU Median',
                    bmduSD: 'BMDU SD',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.directionalUp.columns[key as keyof typeof columnVisibility.directionalUp.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          directionalUp: {
                            ...columnVisibility.directionalUp,
                            all: false,
                            columns: {
                              ...columnVisibility.directionalUp.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Directional DOWN */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'directionalDown',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.directionalDown.all}
                  indeterminate={!columnVisibility.directionalDown.all && Object.values(columnVisibility.directionalDown.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      directionalDown: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.directionalDown.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Directional Stats - DOWN Genes (9 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    bmdMean: 'BMD Mean',
                    bmdMedian: 'BMD Median',
                    bmdSD: 'BMD SD',
                    bmdlMean: 'BMDL Mean',
                    bmdlMedian: 'BMDL Median',
                    bmdlSD: 'BMDL SD',
                    bmduMean: 'BMDU Mean',
                    bmduMedian: 'BMDU Median',
                    bmduSD: 'BMDU SD',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.directionalDown.columns[key as keyof typeof columnVisibility.directionalDown.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          directionalDown: {
                            ...columnVisibility.directionalDown,
                            all: false,
                            columns: {
                              ...columnVisibility.directionalDown.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Directional Analysis */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'directionalAnalysis',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.directionalAnalysis.all}
                  indeterminate={!columnVisibility.directionalAnalysis.all && Object.values(columnVisibility.directionalAnalysis.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      directionalAnalysis: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.directionalAnalysis.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Directional Analysis (4 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    overallDirection: 'Overall Direction',
                    percentUP: '% UP',
                    percentDOWN: '% DOWN',
                    percentConflict: '% Conflict',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.directionalAnalysis.columns[key as keyof typeof columnVisibility.directionalAnalysis.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          directionalAnalysis: {
                            ...columnVisibility.directionalAnalysis,
                            all: false,
                            columns: {
                              ...columnVisibility.directionalAnalysis.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Fold Change */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'foldChange',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.foldChange.all}
                  indeterminate={!columnVisibility.foldChange.all && Object.values(columnVisibility.foldChange.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      foldChange: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.foldChange.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Fold Change Statistics (6 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    total: 'Total',
                    mean: 'Mean',
                    median: 'Median',
                    max: 'Max',
                    min: 'Min',
                    stdDev: 'Std Dev',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.foldChange.columns[key as keyof typeof columnVisibility.foldChange.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          foldChange: {
                            ...columnVisibility.foldChange,
                            all: false,
                            columns: {
                              ...columnVisibility.foldChange.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Z-Scores */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'zScores',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.zScores.all}
                  indeterminate={!columnVisibility.zScores.all && Object.values(columnVisibility.zScores.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      zScores: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.zScores.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Z-Score Statistics (4 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    min: 'Min',
                    median: 'Median',
                    max: 'Max',
                    mean: 'Mean',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.zScores.columns[key as keyof typeof columnVisibility.zScores.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          zScores: {
                            ...columnVisibility.zScores,
                            all: false,
                            columns: {
                              ...columnVisibility.zScores.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Model Fold Change */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'modelFoldChange',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.modelFoldChange.all}
                  indeterminate={!columnVisibility.modelFoldChange.all && Object.values(columnVisibility.modelFoldChange.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      modelFoldChange: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.modelFoldChange.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Model Fold Change (4 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    min: 'Min',
                    median: 'Median',
                    max: 'Max',
                    mean: 'Mean',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.modelFoldChange.columns[key as keyof typeof columnVisibility.modelFoldChange.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          modelFoldChange: {
                            ...columnVisibility.modelFoldChange,
                            all: false,
                            columns: {
                              ...columnVisibility.modelFoldChange.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />

        {/* Gene Lists */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: '8px', background: '#fafafa' }}
          items={[{
            key: 'geneLists',
            label: (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={columnVisibility.geneLists.all}
                  indeterminate={!columnVisibility.geneLists.all && Object.values(columnVisibility.geneLists.columns).some(v => v)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setColumnVisibility({
                      ...columnVisibility,
                      geneLists: {
                        all: checked,
                        columns: Object.fromEntries(
                          Object.keys(columnVisibility.geneLists.columns).map(k => [k, false])
                        ) as any
                      }
                    });
                  }}
                >
                  Gene Lists (5 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    genes: 'Genes',
                    geneSymbols: 'Gene Symbols',
                    bmdList: 'BMD List',
                    bmdlList: 'BMDL List',
                    bmduList: 'BMDU List',
                  }).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      checked={columnVisibility.geneLists.columns[key as keyof typeof columnVisibility.geneLists.columns]}
                      onChange={(e) => {
                        setColumnVisibility({
                          ...columnVisibility,
                          geneLists: {
                            ...columnVisibility.geneLists,
                            all: false,
                            columns: {
                              ...columnVisibility.geneLists.columns,
                              [key]: e.target.checked
                            }
                          }
                        });
                      }}
                    >
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            )
          }]}
        />
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

          {/* Phase 7: Selection Counter */}
          {isAnythingSelected && (
            <Tag color="blue">
              Selected: {selectedCount} of {data.length}
            </Tag>
          )}

          {/* Phase 7: Bulk Selection Buttons */}
          <Space.Compact size="small">
            <Button
              icon={<CheckSquareOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAll();
              }}
              size="small"
              title="Select all visible categories"
            >
              Select All
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleInvertSelection();
              }}
              size="small"
              disabled={!isAnythingSelected}
              title="Invert selection"
            >
              Invert
            </Button>
            <Button
              icon={<CloseSquareOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              size="small"
              disabled={!isAnythingSelected}
              danger
              title="Clear selection"
            >
              Clear
            </Button>
          </Space.Compact>

          <Checkbox
            checked={hideRowsWithoutBMD}
            onChange={(e) => setHideRowsWithoutBMD(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
          >
            Hide rows without BMD
          </Checkbox>
          <Popover
            content={columnVisibilityContent}
            title="Select Columns for Display"
            trigger="click"
            placement="bottomLeft"
          >
            <Button
              icon={<SettingOutlined />}
              onClick={(e) => e.stopPropagation()}
              size="small"
            >
              Select Columns for Display
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
