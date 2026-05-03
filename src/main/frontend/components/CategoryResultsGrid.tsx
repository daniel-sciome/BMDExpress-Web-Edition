import React, { useMemo, useState, useEffect } from 'react';
import { Table, Collapse, Checkbox, Popover, Button, Space, Tag, Select } from 'antd';
import { SettingOutlined, CheckSquareOutlined, CloseSquareOutlined, SwapOutlined } from '@ant-design/icons';
import type { TableProps, ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSortedDataWithFocus, setSortColumn } from '../store/slices/categoryResultsSlice';
import { selectDisplayMode } from '../store/slices/visibilitySlice';
import { useReactiveState } from './charts/hooks/useReactiveState';
import { getRowClassNameByFocus } from './charts/utils/displayModeStyles';
import { useDatasetContext } from '../context/DatasetContext';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type { CategoryWithFocus } from '../types/categoryTypes';

// Import utilities, types, and column visibility helpers
import {
  ColumnVisibility,
  DEFAULT_COLUMN_VISIBILITY,
  COLUMN_VISIBILITY_STORAGE_KEY,
  loadColumnVisibility,
  saveColumnVisibility,
  showAllColumns,
  resetColumnVisibility,
  calculateAllBMDRanks,
  CategoryAnalysisResultWithRank,
} from './categoryTable/utils';

// Import number padding utilities
import {
  calculatePaddingMap,
  NUMERIC_FIELDS,
  type PaddingMap,
} from './categoryTable/utils/numberPadding';

// Import all column definition functions
import {
  getFixedColumns,
  getPrimaryFilterColumns,
  getPreFilterColumns,
  getGeneCountsColumns,
  getSignificantANOVAColumn,
  getFishersEssentialColumn,
  getFishersFullColumns,
  getBMDEssentialColumns,
  getBMDExtendedColumns,
  getBMDConfidenceColumns,
  getBMDLColumns,
  getBMDLConfidenceColumns,
  getBMDUColumns,
  getBMDUConfidenceColumns,
  getBMDRankColumns,
  getBMDLRankColumns,
  getBMDURankColumns,
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

// Extended type for grid data including focus state and rank
// Extends CategoryAnalysisResultWithRank to be compatible with column definitions
type CategoryResultWithFocusAndRank = CategoryAnalysisResultWithRank & {
  inFocus: boolean;
};

/** Externally controlled table settings (for multi-dataset shared controls) */
export interface TableControls {
  hideRowsWithoutBMD: boolean;
  showSelectedOnly: boolean;
  pageSize: number;
  columnVisibility: ColumnVisibility;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  onColumnVisibilityChange?: (vis: ColumnVisibility) => void;
}

interface CategoryResultsGridProps {
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  /** When provided, hides local controls and uses these shared settings */
  sharedControls?: TableControls;
}

export default function CategoryResultsGrid({ isExpanded, onExpandChange, sharedControls }: CategoryResultsGridProps) {
  const dispatch = useAppDispatch();
  // When inside a DatasetProvider (multi-dataset view), use context data;
  // otherwise fall back to the shared Redux slice (single-dataset view).
  const datasetCtx = useDatasetContext();
  const reduxData = useAppSelector(selectSortedDataWithFocus);
  const allDataWithFocus = datasetCtx ? datasetCtx.data : reduxData;
  const viewMode = useAppSelector((state) => state.categoryResults.viewMode);
  const analysisType = useAppSelector((state) => state.categoryResults.analysisType);
  const analysisParameters = useAppSelector((state) => state.categoryResults.analysisParameters);

  // Visibility state - for selection highlighting
  const categoryState = useReactiveState('categoryId');
  const displayMode = useAppSelector(selectDisplayMode);
  const hasHighlights = categoryState.selectedIds.size > 0;

  // Count selected categories that exist in this dataset's data (not the global total)
  const selectedCount = useMemo(() => {
    let count = 0;
    for (const row of allDataWithFocus) {
      if (row.categoryId && categoryState.selectedIds.has(row.categoryId)) count++;
    }
    return count;
  }, [allDataWithFocus, categoryState.selectedIds]);

  // Count in-focus vs out-of-focus for display
  const inFocusCount = useMemo(() =>
    allDataWithFocus.filter(row => row.inFocus).length,
    [allDataWithFocus]
  );

  // Debug logging
  useEffect(() => {
    console.log('[CategoryResultsGrid] Component mounted/updated with data:', {
      totalCount: allDataWithFocus.length,
      inFocusCount,
      outOfFocusCount: allDataWithFocus.length - inFocusCount,
      highlightedCount: categoryState.selectedIds.size,
      displayMode,
      firstCategory: allDataWithFocus[0]?.categoryDescription || 'none',
      firstCategoryId: allDataWithFocus[0]?.categoryId || 'none',
      firstCategoryInFocus: allDataWithFocus[0]?.inFocus,
    });
    return () => {
      console.log('[CategoryResultsGrid] Component unmounting');
    };
  }, [allDataWithFocus.length, inFocusCount, categoryState.selectedIds.size, displayMode]);

  // Filter toggle state — uses shared controls when provided, local state otherwise
  const [localHideRowsWithoutBMD, setHideRowsWithoutBMD] = useState(false);
  const [localShowSelectedOnly, setShowSelectedOnly] = useState(false);
  const [localPageSize, setPageSize] = useState<number>(0);

  const hideRowsWithoutBMD = sharedControls?.hideRowsWithoutBMD ?? localHideRowsWithoutBMD;
  const showSelectedOnly = sharedControls?.showSelectedOnly ?? localShowSelectedOnly;
  const pageSize = sharedControls?.pageSize ?? localPageSize;

  // Page size options for the selector
  const pageSizeOptions = [
    { value: 0, label: 'All' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 200, label: '200' },
    { value: 500, label: '500' },
  ];

  // Handle table sorting changes — dispatch to Redux for single-dataset,
  // or call shared callback for multi-dataset sync
  const handleTableChange = (
    _pagination: any,
    _filters: any,
    sorter: SorterResult<CategoryResultWithFocusAndRank> | SorterResult<CategoryResultWithFocusAndRank>[]
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    if (singleSorter.column && singleSorter.order) {
      const column = singleSorter.columnKey as string || singleSorter.field as string;
      const direction = singleSorter.order === 'ascend' ? 'asc' : 'desc';
      if (sharedControls?.onSortChange) {
        sharedControls.onSortChange(column, direction);
      } else {
        dispatch(setSortColumn({ column, direction }));
      }
    }
  };

  // Remember column selection preference
  const [rememberColumnSelection, setRememberColumnSelection] = useState<boolean>(() => {
    const saved = localStorage.getItem('categoryTable_rememberColumns');
    return saved === 'true';
  });

  // Column visibility state - load from localStorage only if user wants to remember
  const [localColumnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (rememberColumnSelection) {
      return loadColumnVisibility();
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  const columnVisibility = sharedControls?.columnVisibility ?? localColumnVisibility;

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

  // Apply local filters, shared sort, and calculate ranks
  const data: CategoryResultWithFocusAndRank[] = useMemo(() => {
    let filteredData = allDataWithFocus;

    // Optional: hide rows without BMD (local toggle, separate from inFocus)
    if (hideRowsWithoutBMD) {
      filteredData = filteredData.filter(row =>
        row.bmdMean != null || row.bmdMedian != null
      );
    }

    // Optional: show only rows whose categoryId is in the reactive selection
    if (showSelectedOnly && categoryState.selectedIds.size > 0) {
      filteredData = filteredData.filter(row =>
        row.categoryId != null && categoryState.selectedIds.has(row.categoryId)
      );
    }

    // Apply shared sort when in multi-dataset mode
    if (sharedControls?.sortColumn) {
      const col = sharedControls.sortColumn;
      const dir = sharedControls.sortDirection === 'desc' ? -1 : 1;
      filteredData = [...filteredData].sort((a, b) => {
        const aVal = (a as any)[col];
        const bVal = (b as any)[col];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string') return dir * aVal.localeCompare(bVal);
        return dir * (aVal - bVal);
      });
    }

    // Calculate ranks on the visible data
    const rankedData = calculateAllBMDRanks(filteredData);

    // Merge inFocus back into ranked data
    return rankedData.map((row, idx) => ({
      ...row,
      inFocus: filteredData[idx].inFocus,
    }));
  }, [allDataWithFocus, hideRowsWithoutBMD, showSelectedOnly, categoryState.selectedIds,
      sharedControls?.sortColumn, sharedControls?.sortDirection]);

  // Calculate padding requirements for all numeric columns
  const paddingMap: PaddingMap = useMemo(() => {
    return calculatePaddingMap(data, NUMERIC_FIELDS);
  }, [data]);

  // Convert Set to array for Ant Design Table
  const selectedKeys = useMemo(() => {
    return Array.from(categoryState.selectedIds);
  }, [categoryState.selectedIds]);

  // Handle selection change from table row clicks.
  // Routes through categoryState so multi-dataset mode uses DatasetContext
  // rather than the global Redux slice (which charts in that mode don't read).
  const handleSelectionChange = (selectedRowKeys: React.Key[]) => {
    const categoryIds = selectedRowKeys.map(key => String(key));
    if (categoryIds.length > 0) {
      categoryState.handleMultiSelect(categoryIds, 'table');
    } else {
      categoryState.handleClear();
    }
  };

  // Bulk selection handlers (operate on filtered data only)
  const handleSelectAll = () => {
    const visibleIds = data.map(cat => cat.categoryId).filter(Boolean) as string[];
    categoryState.handleMultiSelect(visibleIds, 'table');
  };

  const handleClearSelection = () => {
    categoryState.handleClear();
  };

  const handleInvertSelection = () => {
    // Invert within visible categories only
    const visibleIds = data.map(cat => cat.categoryId).filter(Boolean) as string[];
    const invertedIds = visibleIds.filter(id => !categoryState.selectedIds.has(id));
    if (invertedIds.length > 0) {
      categoryState.handleMultiSelect(invertedIds, 'table');
    } else {
      categoryState.handleClear();
    }
  };

  // Handle row click to toggle selection
  const handleRowClick = (record: CategoryResultWithFocusAndRank) => {
    // Don't allow selection of out-of-focus (dimmed) rows
    if (!record.inFocus) return;

    const categoryId = record.categoryId;
    if (!categoryId) return;

    const newSelectedKeys = selectedKeys.includes(categoryId)
      ? selectedKeys.filter(key => key !== categoryId)
      : [...selectedKeys, categoryId];

    handleSelectionChange(newSelectedKeys);
  };

  // Build columns dynamically based on visibility state
  // Using 'any' for column array because column definitions use CategoryAnalysisResultDto
  // but the data includes additional properties (inFocus, ranks). This is safe because
  // columns only access properties that exist on the base DTO type.
  const columns = useMemo(() => {
    const cols: ColumnsType<any> = [];

    // Prepare analysis info for dynamic column labels
    const analysisInfo = {
      analysisType,
      analysisParameters,
    };

    // Always show fixed columns with dynamic labels
    cols.push(...getFixedColumns(viewMode, analysisInfo));

    // Conditionally add primary filter columns based on visibility
    // Content varies by analysis type: gene counts for multi-gene categories, BMD stats for GENE type
    if (columnVisibility.primaryFilters.all || Object.values(columnVisibility.primaryFilters.columns).some(v => v)) {
      cols.push(...getPrimaryFilterColumns(
        analysisType,
        columnVisibility.primaryFilters.all ? undefined : columnVisibility.primaryFilters.columns,
        paddingMap
      ));
    }

    // Pre-filter columns (ANOVA, Williams, Curve Fit, etc.)
    if (columnVisibility.preFilters.all || Object.values(columnVisibility.preFilters.columns).some(v => v)) {
      cols.push(...getPreFilterColumns(
        columnVisibility.preFilters.all ? undefined : columnVisibility.preFilters.columns,
        paddingMap
      ));
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

    // Rank columns
    if (columnVisibility.bmdRanks) {
      cols.push(...getBMDRankColumns());
    }
    if (columnVisibility.bmdlRanks) {
      cols.push(...getBMDLRankColumns());
    }
    if (columnVisibility.bmduRanks) {
      cols.push(...getBMDURankColumns());
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
  }, [columnVisibility, viewMode, paddingMap, analysisType, analysisParameters]);

  // Focus/dim styling via rowClassName (for display mode: dim/isolate).
  // Row highlighting is handled by Ant's rowSelection prop instead of
  // manual class names — this ensures fixed columns and hover work correctly.
  const getRowClassName = (record: CategoryResultWithFocusAndRank) => {
    return getRowClassNameByFocus(record.inFocus, displayMode);
  };

  // Ant Table rowSelection config — drives the built-in ant-table-row-selected
  // styling which properly covers fixed/sticky columns and hover states.
  // The checkbox column is hidden via CSS (selection-column-hidden class on
  // the table wrapper) since columnWidth:0 can cause layout issues.
  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: handleSelectionChange,
    columnWidth: 1,
    renderCell: () => null,
    hideSelectAll: true,
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
          Primary Filter Columns
          <div style={{ fontSize: '11px', fontWeight: 400, color: '#666', marginTop: '4px' }}>
            {analysisType === 'GENE'
              ? 'For GENE analysis: BMD statistics'
              : 'For multi-gene categories: Gene counts'
            }
          </div>
        </div>

        {/* Multi-gene category columns (GO, pathways, defined) */}
        {analysisType !== 'GENE' && (
          <>
            <Checkbox
              checked={columnVisibility.primaryFilters.columns.genesPassed}
              onChange={(e) => {
                e.stopPropagation();
                setColumnVisibility({
                  ...columnVisibility,
                  primaryFilters: {
                    ...columnVisibility.primaryFilters,
                    // Switching to per-column mode so individual flags are respected
                    all: false,
                    columns: { ...columnVisibility.primaryFilters.columns, genesPassed: e.target.checked }
                  }
                });
              }}
            >
              Genes (Passed)
            </Checkbox>
            <Checkbox
              checked={columnVisibility.primaryFilters.columns.allGenes}
              onChange={(e) => {
                e.stopPropagation();
                setColumnVisibility({
                  ...columnVisibility,
                  primaryFilters: {
                    ...columnVisibility.primaryFilters,
                    all: false,
                    columns: { ...columnVisibility.primaryFilters.columns, allGenes: e.target.checked }
                  }
                });
              }}
            >
              All Genes
            </Checkbox>
            <Checkbox
              checked={columnVisibility.primaryFilters.columns.percentage}
              onChange={(e) => {
                e.stopPropagation();
                setColumnVisibility({
                  ...columnVisibility,
                  primaryFilters: {
                    ...columnVisibility.primaryFilters,
                    all: false,
                    columns: { ...columnVisibility.primaryFilters.columns, percentage: e.target.checked }
                  }
                });
              }}
            >
              Percentage
            </Checkbox>
          </>
        )}

        {/* Single-gene analysis columns (GENE type) */}
        {analysisType === 'GENE' && (
          <>
            <Checkbox
              checked={columnVisibility.primaryFilters.columns.bmdMean}
              onChange={(e) => {
                e.stopPropagation();
                setColumnVisibility({
                  ...columnVisibility,
                  primaryFilters: {
                    ...columnVisibility.primaryFilters,
                    all: false,
                    columns: { ...columnVisibility.primaryFilters.columns, bmdMean: e.target.checked }
                  }
                });
              }}
            >
              BMD Mean
            </Checkbox>
            <Checkbox
              checked={columnVisibility.primaryFilters.columns.bmdMedian}
              onChange={(e) => {
                e.stopPropagation();
                setColumnVisibility({
                  ...columnVisibility,
                  primaryFilters: {
                    ...columnVisibility.primaryFilters,
                    all: false,
                    columns: { ...columnVisibility.primaryFilters.columns, bmdMedian: e.target.checked }
                  }
                });
              }}
            >
              BMD Median
            </Checkbox>
          </>
        )}

        <div style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          Pre-Filters
          <div style={{ fontSize: '11px', fontWeight: 400, color: '#666', marginTop: '4px' }}>
            Statistical tests applied before BMD analysis
          </div>
        </div>
        <Checkbox
          checked={columnVisibility.preFilters.columns.anova}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({
              ...columnVisibility,
              preFilters: {
                ...columnVisibility.preFilters,
                all: false,
                columns: { ...columnVisibility.preFilters.columns, anova: e.target.checked }
              }
            });
          }}
        >
          ANOVA
        </Checkbox>
        {/* Future pre-filter types will be added here:
        <Checkbox checked={...} onChange={...}>Williams Trend Test</Checkbox>
        <Checkbox checked={...} onChange={...}>Curve Fit</Checkbox>
        */}

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
          Rank Columns
        </div>
        <Checkbox
          checked={columnVisibility.bmdRanks}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdRanks: e.target.checked });
          }}
        >
          BMD Ranks (Mean, Median, Min, W.Mean)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.bmdlRanks}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmdlRanks: e.target.checked });
          }}
        >
          BMDL Ranks (Mean, Median, Min, W.Mean)
        </Checkbox>
        <Checkbox
          checked={columnVisibility.bmduRanks}
          onChange={(e) => {
            e.stopPropagation();
            setColumnVisibility({ ...columnVisibility, bmduRanks: e.target.checked });
          }}
        >
          BMDU Ranks (Mean, Median, Min, W.Mean)
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
                  Percentile BMDs (6 columns)
                </Checkbox>
              </div>
            ),
            children: (
              <div style={{ paddingLeft: '24px' }}>
                <Space direction="vertical" size={4}>
                  {Object.entries({
                    bmd5th: 'BMD 5th %ile Total Genes',
                    bmd10th: 'BMD 10th %ile Total Genes',
                    bmdl5th: 'BMDL 5th %ile Total Genes',
                    bmdl10th: 'BMDL 10th %ile Total Genes',
                    bmdu5th: 'BMDU 5th %ile Total Genes',
                    bmdu10th: 'BMDU 10th %ile Total Genes',
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

  // Stats + dataset tag shown in both the Collapse header and the flat multi-dataset header.
  const statsLabel = (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
      onClick={(e) => e.stopPropagation()}
    >
      {datasetCtx?.label && (
        <Tag color="blue" style={{ fontWeight: 600, marginInlineEnd: 0 }}>{datasetCtx.label}</Tag>
      )}

      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
        {inFocusCount} in focus / {data.length} total{hideRowsWithoutBMD ? ` (${allDataWithFocus.length} before BMD filter)` : ''}
      </Tag>

      {/* Selection Counter */}
      {hasHighlights && (
        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
          Selected: {selectedCount} of {data.length}
        </Tag>
      )}

      {/* Controls shown only in single-dataset mode (shared controls handle multi-dataset) */}
      {!sharedControls && (
        <>
          {/* Page Size Selector */}
          <Space size="small">
            <span style={{ fontSize: '12px', color: '#666' }}>Show:</span>
            <Select
              value={pageSize}
              onChange={(value) => setPageSize(value)}
              onClick={(e) => e.stopPropagation()}
              options={pageSizeOptions}
              size="small"
              style={{ width: 80 }}
            />
          </Space>

          {/* Bulk Selection Buttons */}
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
              disabled={!hasHighlights}
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
              disabled={!hasHighlights}
              danger
              title="Clear selection"
            >
              Clear
            </Button>
          </Space.Compact>

          <Checkbox
            checked={showSelectedOnly}
            onChange={(e) => setShowSelectedOnly(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            disabled={categoryState.selectedIds.size === 0}
          >
            Show selected only
          </Checkbox>
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
        </>
      )}
    </div>
  );

  // Table + bottom page-size selector, used in both Collapse and flat rendering paths.
  const tableContent = (
    <div>
      <Table<CategoryResultWithFocusAndRank>
        key={`table-${categoryState.selectedIds.size}-${selectedKeys[0] || 'none'}`}
        columns={columns}
        dataSource={data}
        rowKey="categoryId"
        rowClassName={getRowClassName}
        rowSelection={rowSelection}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: record.inFocus ? 'pointer' : 'default' },
        })}
        pagination={pageSize === 0 ? false : {
          pageSize: pageSize,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          position: ['bottomCenter'],
        }}
        scroll={{ x: 1250 }}
        tableLayout="fixed"
        size="small"
      />

      {/* Page Size Selector - Bottom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 8px' }}>
        <Space size="small">
          <span style={{ fontSize: '12px', color: '#666' }}>Show:</span>
          <Select
            value={pageSize}
            onChange={(value) => setPageSize(value)}
            options={pageSizeOptions}
            size="small"
            style={{ width: 80 }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>rows per page</span>
        </Space>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {data.length} total categories
        </span>
      </div>
    </div>
  );

  // Collapse items — only used in single-dataset mode.
  const collapseItems = [
    {
      key: '1',
      label: statsLabel,
      children: tableContent,
    },
  ];

  return (
    <>
      <style>
        {`
          /* Focus-based row styles (inFocus = passes filter criteria) */
          .in-focus-row {
            /* In-focus rows: full visibility, normal styling */
          }

          .out-of-focus-row {
            /* Out-of-focus rows: styled based on display mode */
          }

          /* Selection highlight (separate from focus) */
          .highlighted-row {
            background-color: #e6f7ff !important;
          }
          .highlighted-row:hover {
            background-color: #bae7ff !important;
          }

          /* Display mode styles for out-of-focus rows */
          .dimmed-row {
            opacity: 0.3;
          }
          .dimmed-row:hover {
            opacity: 0.6;
          }

          .hidden-row {
            display: none !important;
          }

          .normal-row {
            /* Default styling - no changes */
          }

          /* Apply monospace font to all table cells for proper alignment */
          .ant-table-tbody > tr > td,
          .ant-table-thead > tr > th {
            font-family: 'Roboto Mono', 'SF Mono', 'Segoe UI Mono', 'Ubuntu Mono', Menlo, Monaco, Consolas, monospace;
            font-variant-numeric: tabular-nums;
            font-size: 13px;
          }

          /* Exclude Description column - use proportional Roboto */
          .ant-table-tbody > tr > td[data-index="categoryDescription"],
          .ant-table-thead > tr > th[data-index="categoryDescription"] {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            font-variant-numeric: normal;
            font-size: 14px;
          }

          /* Reduce padding between collapse border and table headers */
          .ant-collapse-content-box {
            padding-top: 0 !important;
            padding-left: 4px !important;
            padding-right: 4px !important;
          }

          /* Reduce left padding on table cells */
          .ant-table-tbody > tr > td:first-child,
          .ant-table-thead > tr > th:first-child {
            padding-left: 4px !important;
          }
        `}
      </style>
      {sharedControls ? (
        // Flat rendering for multi-dataset mode — no Collapse wrapper so the
        // shared ClusterPicker in MultiDatasetView sits directly above each table.
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #d9d9d9', background: '#fafafa', borderRadius: '8px 8px 0 0' }}>
            {statsLabel}
          </div>
          <div style={{ padding: '4px' }}>
            {tableContent}
          </div>
        </div>
      ) : (
        <Collapse
          activeKey={isExpanded !== undefined ? (isExpanded ? ['1'] : []) : undefined}
          defaultActiveKey={isExpanded === undefined ? ['1'] : undefined}
          onChange={(keys) => {
            if (onExpandChange) {
              const keysArray = Array.isArray(keys) ? keys : [keys];
              onExpandChange(keysArray.includes('1'));
            }
          }}
          items={collapseItems}
        />
      )}
    </>
  );
}
