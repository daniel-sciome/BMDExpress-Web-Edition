/**
 * MultiDatasetView.tsx — Side-by-side visualization of multiple category analysis datasets.
 *
 * Renders one collapse section per chart type (UMAP, Default Charts, Table, etc.).
 * Within each collapse, all selected datasets' charts are shown side by side.
 * Each dataset's charts are wrapped in a DatasetProvider so chart components
 * read their data from context instead of the shared Redux slice.
 *
 * Data loading:
 *   Loads category results for each selected dataset directly from the backend
 *   service (not via Redux). Each dataset's data is stored in local state and
 *   passed to charts via DatasetContext.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SyncedRange } from '../types/chartSync';
import { Button, Checkbox, Collapse, Drawer, Popover, Select, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { ColumnVisibility } from '../components/categoryTable/utils';
import TableColumnPicker from '../components/categoryTable/TableColumnPicker';
import {
  DatabaseOutlined,
  FileTextOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  FormatPainterOutlined,
  MinusSquareOutlined,
} from '@ant-design/icons';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import { DatasetProvider, type DatasetContextValue, type CategoryDataRow, type DatasetReactiveSelection } from '../context/DatasetContext';
import type { ReactiveSelectionMap, SelectionSource } from '../types/reactiveTypes';
import { useAppDispatch } from '../store/hooks';
import { initializeCategories, upsertCategorySet } from '../store/slices/renderStateSlice';
import { createClusterSets } from '../store/utils/initializeRenderState';
import { umapDataService } from '../data/umapDataService';

// Chart components — imported individually so we can render them per-dataset
import UmapScatterPlot from '../components/charts/UmapScatterPlot';
import BMDvsPValueScatter from '../components/charts/BMDvsPValueScatter';
import BMDBoxPlot from '../components/charts/BMDBoxPlot';
import CategoryResultsGrid, { type TableControls } from '../components/CategoryResultsGrid';
import ClusterPicker, { type DatasetInfo } from '../components/ClusterPicker';
import AppearancePanel from '../components/charts/appearance/AppearancePanel';
import { DEFAULT_COLUMN_VISIBILITY } from '../components/categoryTable/utils';

const { Text } = Typography;

/** Panel types for the icon toolbar flyout */
type ToolPanel = 'datasets' | 'parameters' | 'charts' | 'clusters' | 'appearance' | null;

interface MultiDatasetViewProps {
  projectId: string;
  /** Array of category result fullNames to display side by side */
  resultNames: string[];
  /** Annotations for display name lookup */
  annotations: AnalysisAnnotationDto[];
}

/** One dataset's loaded data */
interface LoadedDataset {
  resultName: string;
  label: string;
  data: CategoryDataRow[];
  loading: boolean;
  error: string | null;
  /** Carried from the annotation so charts can apply the GENE-skip
      carve-out that primary filters use in single-dataset mode. */
  analysisType?: string | null;
}

/**
 * Chart type definitions — each gets its own collapse section.
 * The render function receives a DatasetProvider-wrapped context
 * and renders the appropriate chart component(s).
 */
interface ChartSection {
  key: string;
  label: string;
  render: () => React.ReactNode;
}

export default function MultiDatasetView({
  projectId,
  resultNames,
  annotations,
}: MultiDatasetViewProps) {
  const dispatch = useAppDispatch();

  // Loaded data for each dataset, keyed by resultName
  const [datasets, setDatasets] = useState<Record<string, LoadedDataset>>({});

  // Per-dataset reactive selection state. Each dataset column's charts and
  // tables mutate their own entry via the DatasetReactiveSelection bundle
  // exposed through DatasetContext. This replaces the single global Redux
  // `reactiveSelection` slice for multi-dataset mode, so clicking a point
  // in dataset A no longer highlights same-id points in dataset B, and the
  // filter-driven Dim/Isolate display modes don't get masked by stale
  // selection carried over from a prior single-dataset session.
  //
  // Key invariant: entries are keyed by dataset resultName. An absent entry
  // is treated as empty (no selection).
  const [datasetSelections, setDatasetSelections] = useState<Record<string, ReactiveSelectionMap>>({});

  // Build an empty selection snapshot — used when a dataset has no selection yet.
  const makeEmptySelectionMap = useCallback((): ReactiveSelectionMap => ({
    category: { selectedIds: new Set<string>(), source: null },
    cluster: { selectedIds: new Set<number | string>(), source: null },
  }), []);

  // Shared helpers used by both the per-dataset and the broadcast factories.
  // Written as a functional-setState closure over resultName so we can
  // target one dataset's entry without racing against sibling updates.
  const setDatasetTypeSelection = useCallback((
    resultName: string,
    type: 'category' | 'cluster',
    ids: (string | number)[],
    source: SelectionSource,
  ) => {
    setDatasetSelections(prev => {
      const existing = prev[resultName] ?? makeEmptySelectionMap();
      const nextSet = new Set(ids) as Set<string> & Set<number | string>;
      return {
        ...prev,
        [resultName]: {
          ...existing,
          [type]: { selectedIds: nextSet, source },
        },
      };
    });
  }, [makeEmptySelectionMap]);

  const toggleDatasetTypeSelection = useCallback((
    resultName: string,
    type: 'category' | 'cluster',
    id: string | number,
  ) => {
    setDatasetSelections(prev => {
      const existing = prev[resultName] ?? makeEmptySelectionMap();
      const current = existing[type].selectedIds as Set<string | number>;
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return {
        ...prev,
        [resultName]: {
          ...existing,
          [type]: {
            selectedIds: next as Set<string> & Set<number | string>,
            source: existing[type].source,
          },
        },
      };
    });
  }, [makeEmptySelectionMap]);

  const clearDatasetTypeSelection = useCallback((
    resultName: string,
    type: 'category' | 'cluster',
  ) => {
    setDatasetSelections(prev => {
      const existing = prev[resultName] ?? makeEmptySelectionMap();
      return {
        ...prev,
        [resultName]: {
          ...existing,
          [type]: {
            selectedIds: new Set() as Set<string> & Set<number | string>,
            source: null,
          },
        },
      };
    });
  }, [makeEmptySelectionMap]);

  // Factory for the per-dataset reactive-selection bundle that gets placed on
  // DatasetContextValue. Built inside useCallback so handler identity is stable
  // across renders for a given resultName — chart useMemo deps that include
  // `handleSelect` etc. don't invalidate on every parent render.
  const getReactiveSelectionFor = useCallback((resultName: string): DatasetReactiveSelection => {
    const snapshot = datasetSelections[resultName] ?? makeEmptySelectionMap();
    return {
      state: snapshot,
      setAll: (type, ids, source) => setDatasetTypeSelection(resultName, type, ids, source),
      toggle: (type, id) => toggleDatasetTypeSelection(resultName, type, id),
      clear: (type) => clearDatasetTypeSelection(resultName, type),
    };
  }, [
    datasetSelections,
    makeEmptySelectionMap,
    setDatasetTypeSelection,
    toggleDatasetTypeSelection,
    clearDatasetTypeSelection,
  ]);

  // Broadcast reactive-selection bundle. Used by shared controls that sit
  // above the per-dataset columns — notably the ClusterPicker at the top of
  // MultiDatasetView. When the user clicks a cluster here, the mutation fans
  // out to every loaded dataset's selection state, so all dataset columns
  // update in lockstep. Reads return the union across datasets, so the
  // picker UI shows a cluster as "full" when any dataset has all its ids
  // selected (cheap and good enough for the visual indicator).
  const broadcastReactiveSelection: DatasetReactiveSelection = useMemo(() => {
    const unionCategory = new Set<string>();
    const unionCluster = new Set<number | string>();
    Object.values(datasetSelections).forEach(snap => {
      snap.category.selectedIds.forEach(id => unionCategory.add(id));
      snap.cluster.selectedIds.forEach(id => unionCluster.add(id));
    });
    const unionSnapshot: ReactiveSelectionMap = {
      category: { selectedIds: unionCategory, source: null },
      cluster: { selectedIds: unionCluster, source: null },
    };
    return {
      state: unionSnapshot,
      setAll: (type, ids, source) => {
        resultNames.forEach(rn => setDatasetTypeSelection(rn, type, ids, source));
      },
      toggle: (type, id) => {
        resultNames.forEach(rn => toggleDatasetTypeSelection(rn, type, id));
      },
      clear: (type) => {
        resultNames.forEach(rn => clearDatasetTypeSelection(rn, type));
      },
    };
  }, [
    datasetSelections,
    resultNames,
    setDatasetTypeSelection,
    toggleDatasetTypeSelection,
    clearDatasetTypeSelection,
  ]);

  // Icon toolbar state: which flyout panel is open, and chart collapse keys
  const [activePanel, setActivePanel] = useState<ToolPanel>(null);
  // Chart section state is split into two concerns that were previously conflated:
  //   - `visibleChartKeys`: which chart sections are rendered at all. The flyout's
  //     "Chart Selection" panel toggles entries in/out of this list. When a key is
  //     removed, the section disappears from the page entirely (header + content).
  //   - `expandedChartKeys`: of the visible sections, which are currently expanded in
  //     the Collapse. Users drive this by clicking collapse headers directly.
  // Previously a single `activeChartKeys` did both jobs, so toggling a chart off in
  // the flyout only collapsed the panel — the header stayed visible and the user
  // perceived the toggle as doing nothing.
  const ALL_CHART_KEYS = ['umap', 'default-charts', 'table'];
  const [visibleChartKeys, setVisibleChartKeys] = useState<string[]>(ALL_CHART_KEYS);
  const [expandedChartKeys, setExpandedChartKeys] = useState<string[]>(ALL_CHART_KEYS);

  // Synchronized axis ranges — one per chart type, shared across all dataset instances.
  // When a user zooms/pans in any instance, the range is broadcast to all siblings.
  const [umapRange, setUmapRange] = useState<SyncedRange>({});
  const [scatterRange, setScatterRange] = useState<SyncedRange>({});
  const [boxRange, setBoxRange] = useState<SyncedRange>({});

  const handleUmapRange = useCallback((r: SyncedRange) => setUmapRange(r), []);
  const handleScatterRange = useCallback((r: SyncedRange) => setScatterRange(r), []);
  const handleBoxRange = useCallback((r: SyncedRange) => setBoxRange(r), []);

  // Shared table controls — one set of settings for all dataset tables
  const [sharedHideRowsWithoutBMD, setSharedHideRowsWithoutBMD] = useState(false);
  const [sharedShowSelectedOnly, setSharedShowSelectedOnly] = useState(false);
  const [sharedPageSize, setSharedPageSize] = useState<number>(0);
  const [sharedColumnVisibility, setSharedColumnVisibility] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);

  const [sharedSortColumn, setSharedSortColumn] = useState<string>('clusterId');
  const [sharedSortDirection, setSharedSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSharedSortChange = useCallback((col: string, dir: 'asc' | 'desc') => {
    setSharedSortColumn(col);
    setSharedSortDirection(dir);
  }, []);

  const sharedTableControls: TableControls = {
    hideRowsWithoutBMD: sharedHideRowsWithoutBMD,
    showSelectedOnly: sharedShowSelectedOnly,
    pageSize: sharedPageSize,
    columnVisibility: sharedColumnVisibility,
    sortColumn: sharedSortColumn,
    sortDirection: sharedSortDirection,
    onSortChange: handleSharedSortChange,
    onColumnVisibilityChange: setSharedColumnVisibility,
  };

  // Load data for all selected datasets
  useEffect(() => {
    // Initialize loading state for each dataset
    const initial: Record<string, LoadedDataset> = {};
    for (const name of resultNames) {
      const ann = annotations.find(a => a.fullName === name);
      initial[name] = {
        resultName: name,
        label: ann?.displayName || name,
        data: [],
        loading: true,
        error: null,
        // Propagate analysisType from the annotation so the filter-recomputation
        // path in useFocusAwareStyling can honor the GENE carve-out per dataset
        // (different datasets in the same comparison may have different types).
        analysisType: ann?.analysisType ?? null,
      };
    }
    setDatasets(initial);

    // Load each dataset in parallel
    resultNames.forEach(async (resultName) => {
      try {
        const result = await CategoryResultsService.getCategoryResults(projectId, resultName);
        const rows = (result?.results || []).filter(
          (r): r is CategoryAnalysisResultDto => r !== undefined
        );

        // Enrich each row with cluster ID from the UMAP reference (same
        // logic as the Redux reducer in categoryResultsSlice.fulfilled).
        const dataWithFocus: CategoryDataRow[] = rows.map(row => {
          const umapData = row.categoryId ? umapDataService.getByGoId(row.categoryId) : undefined;
          let clusterId: number;
          if (!umapData) {
            clusterId = -2; // Not in UMAP reference
          } else {
            const raw = umapData.cluster_id;
            clusterId = typeof raw === 'number' ? raw
              : (raw !== undefined ? parseInt(String(raw), 10) : -1);
          }
          return { ...row, inFocus: true, clusterId };
        });

        setDatasets(prev => ({
          ...prev,
          [resultName]: {
            ...prev[resultName],
            data: dataWithFocus,
            loading: false,
          },
        }));

        // Mirror what loadCategoryResults.fulfilled does in single-dataset mode:
        // initialize the reactive selection with all category IDs so that all
        // cluster buttons start as 'full' and Ctrl+click removes a cluster
        // (de-selects it) rather than adding to an empty selection.
        const allCategoryIds = dataWithFocus
          .map(row => row.categoryId)
          .filter((id): id is string => Boolean(id));
        setDatasetSelections(prev => ({
          ...prev,
          [resultName]: {
            category: {
              selectedIds: new Set(allCategoryIds) as Set<string> & Set<number | string>,
              source: null,
            },
            cluster: {
              selectedIds: new Set() as Set<string> & Set<number | string>,
              source: null,
            },
          },
        }));
      } catch (err) {
        console.error(`Failed to load dataset ${resultName}:`, err);
        setDatasets(prev => ({
          ...prev,
          [resultName]: {
            ...prev[resultName],
            loading: false,
            error: `Failed to load: ${err}`,
          },
        }));
      }
    });
  }, [projectId, resultNames.join(','), annotations]);

  // Check if any datasets are still loading
  const anyLoading = Object.values(datasets).some(d => d.loading);
  const loadedDatasets = resultNames
    .map(name => datasets[name])
    .filter((d): d is LoadedDataset => d !== undefined && !d.loading && !d.error);

  // Rebuild Redux render state (clusters) from the union of all loaded datasets.
  // The cluster picker and reactive selection read from Redux, so we need valid
  // cluster sets even though the per-dataset data lives in DatasetContext.
  useEffect(() => {
    if (anyLoading || loadedDatasets.length === 0) return;

    // Deduplicate categories across datasets by categoryId
    const seen = new Set<string>();
    const allCategories: CategoryAnalysisResultDto[] = [];
    for (const ds of loadedDatasets) {
      for (const row of ds.data) {
        if (row.categoryId && !seen.has(row.categoryId)) {
          seen.add(row.categoryId);
          allCategories.push(row);
        }
      }
    }

    dispatch(initializeCategories(allCategories));
    const clusterSets = createClusterSets(allCategories);
    clusterSets.forEach(set => dispatch(upsertCategorySet(set)));
  }, [anyLoading, loadedDatasets.length]);

  // Per-dataset category ID sets for the cluster picker's per-dataset counts
  const datasetInfos: DatasetInfo[] = useMemo(() =>
    loadedDatasets.map(ds => ({
      label: ds.label,
      categoryIds: new Set(ds.data.map(r => r.categoryId).filter(Boolean) as string[]),
    })),
    [loadedDatasets]
  );

  if (anyLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '1rem' }}>Loading {resultNames.length} datasets...</p>
      </div>
    );
  }

  if (loadedDatasets.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No data loaded.</p>
      </div>
    );
  }

  // Helper: render a row of charts, one per dataset, side by side.
  // fitContent: when true, each column is minmax(max-content, 1fr) so the cell
  // is at least as wide as its table content (totalColumnsWidth + borders/padding)
  // and grows to fill extra viewport space. Use for the results table.
  // Without it, 1fr cells can be narrower than the table, forcing a scrollbar
  // even with default columns visible.
  const renderSideBySide = (
    renderChart: (ctx: DatasetContextValue) => React.ReactNode,
    fitContent?: boolean,
  ) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: fitContent
        ? `repeat(${loadedDatasets.length}, minmax(max-content, 1fr))`
        : `repeat(${loadedDatasets.length}, 1fr)`,
      gap: '8px',
    }}>
      {loadedDatasets.map(ds => {
        const ctx: DatasetContextValue = {
          data: ds.data,
          label: ds.label,
          resultName: ds.resultName,
          projectId,
          analysisType: ds.analysisType,
          reactiveSelection: getReactiveSelectionFor(ds.resultName),
        };
        return (
          // minWidth: 0 lets the grid item shrink to its 1fr track size.
          // Without it, the item defaults to min-width: auto (= the table's
          // natural 1250px scroll width), which overflows the grid column and
          // bleeds content to the right of the sticky cluster picker.
          <div key={ds.resultName} style={{ minWidth: 0 }}>
            <DatasetProvider value={ctx}>
              {renderChart(ctx)}
            </DatasetProvider>
          </div>
        );
      })}
    </div>
  );

  // Define chart sections — each becomes a collapse panel.
  // Sync props are passed so zoom/pan in one dataset's chart applies to all.
  const chartSections: ChartSection[] = [
    {
      key: 'umap',
      label: 'UMAP Scatter Plot',
      render: () => renderSideBySide(() => (
        <UmapScatterPlot height={400} syncedRange={umapRange} onRangeChange={handleUmapRange} />
      )),
    },
    {
      key: 'default-charts',
      label: 'Default Charts (Scatter & Box)',
      render: () => renderSideBySide(() => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <BMDvsPValueScatter syncedRange={scatterRange} onRangeChange={handleScatterRange} />
          <BMDBoxPlot syncedRange={boxRange} onRangeChange={handleBoxRange} />
        </div>
      )),
    },
    {
      key: 'table',
      label: 'Category Results Table',
      render: () => (
        <>
          {/* Shared table controls — one set for all datasets */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            padding: '8px 12px', marginBottom: '8px',
            background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px',
          }}>
            <Space size="small">
              <span style={{ fontSize: '12px', color: '#666' }}>Rows:</span>
              <Select
                value={sharedPageSize}
                onChange={setSharedPageSize}
                options={[
                  { value: 0, label: 'All' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                  { value: 200, label: '200' },
                ]}
                size="small"
                style={{ width: 80 }}
              />
            </Space>
            <Checkbox
              checked={sharedShowSelectedOnly}
              onChange={(e) => setSharedShowSelectedOnly(e.target.checked)}
            >
              Show selected only
            </Checkbox>
            <Checkbox
              checked={sharedHideRowsWithoutBMD}
              onChange={(e) => setSharedHideRowsWithoutBMD(e.target.checked)}
            >
              Hide rows without BMD
            </Checkbox>
            <Popover
              trigger="click"
              placement="bottomLeft"
              title="Columns"
              content={
                <TableColumnPicker
                  value={sharedColumnVisibility}
                  onChange={setSharedColumnVisibility}
                />
              }
            >
              <Button icon={<SettingOutlined />} size="small">Columns</Button>
            </Popover>
          </div>
          {renderSideBySide(() => (
            <CategoryResultsGrid
              isExpanded={true}
              onExpandChange={() => {}}
              sharedControls={sharedTableControls}
            />
          ), true)}
        </>
      ),
    },
  ];

  return (
    // Outer flex row: sticky icon toolbar on the left, main content column on the right.
    // Replaces the previous `position: fixed; left: 300` toolbar, which overlapped the
    // app's 300px-wide left sidebar and became invisible whenever the sidebar was open.
    // With the inline flex layout, the toolbar naturally flows after the app drawer and
    // tracks the drawer when the user collapses it via the hamburger in the navbar.
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {/* ──────────────── Icon Toolbar (sticky left column) ────────────────
          Vertical strip of icon buttons. Each button toggles a flyout Drawer that
          shows a panel (Datasets, Parameters, Chart Selection, Cluster Picker,
          Global Theme). Sticky positioning keeps the toolbar glued to the top of
          the viewport as the user scrolls the long chart list below, so the
          flyout triggers are always one click away. `alignSelf: flex-start`
          prevents the flex row from stretching the toolbar to match the content
          column's height. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: '#fafafa',
          padding: '8px 4px',
          borderRight: '1px solid #d9d9d9',
          zIndex: 10,
        }}
      >
        <Tooltip title="Datasets" placement="right">
          <Button
            type={activePanel === 'datasets' ? 'primary' : 'text'}
            icon={<DatabaseOutlined />}
            onClick={() => setActivePanel(activePanel === 'datasets' ? null : 'datasets')}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Analysis Parameters" placement="right">
          <Button
            type={activePanel === 'parameters' ? 'primary' : 'text'}
            icon={<FileTextOutlined />}
            onClick={() => setActivePanel(activePanel === 'parameters' ? null : 'parameters')}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Chart Selection" placement="right">
          <Button
            type={activePanel === 'charts' ? 'primary' : 'text'}
            icon={<LineChartOutlined />}
            onClick={() => setActivePanel(activePanel === 'charts' ? null : 'charts')}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Cluster Picker" placement="right">
          <Button
            type={activePanel === 'clusters' ? 'primary' : 'text'}
            icon={<AppstoreOutlined />}
            onClick={() => setActivePanel(activePanel === 'clusters' ? null : 'clusters')}
            size="small"
          />
        </Tooltip>
        <Tooltip title="Global Theme" placement="right">
          <Button
            type={activePanel === 'appearance' ? 'primary' : 'text'}
            icon={<FormatPainterOutlined />}
            onClick={() => setActivePanel(activePanel === 'appearance' ? null : 'appearance')}
            size="small"
          />
        </Tooltip>
        <div style={{ borderTop: '1px solid #d9d9d9', margin: '4px 0' }} />
        <Tooltip title="Collapse All Charts" placement="right">
          <Button
            type="text"
            icon={<MinusSquareOutlined />}
            onClick={() => setExpandedChartKeys([])}
            size="small"
          />
        </Tooltip>
      </div>

      {/* ──────────────── Main content column ────────────────
          Takes the remaining horizontal space. `minWidth: 0` lets flex children
          (like wide tables) shrink instead of forcing the whole row to overflow.
          No top padding so the sticky cluster picker starts flush with the top
          of the viewport and never needs to scroll before sticking. */}
      <div style={{ flex: 1, minWidth: 0, padding: '0 1rem 1rem' }}>

      {/* Cluster Picker — sticky so it stays visible while charts/table scroll,
          matching the behaviour in single-dataset mode (CategoryResultsView).
          Purely a positioning shell; the Collapse inside ClusterPicker provides
          all visual styling so there's no double-border or radius mismatch. */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        paddingTop: '8px',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        marginBottom: '8px',
        background: '#fff',
      }}>
        {/* Wrap the shared ClusterPicker in a DatasetProvider whose
            reactiveSelection is the broadcast bundle. ClusterPicker's
            useReactiveState picks up that bundle and routes clicks to every
            loaded dataset's selection state at once — no more Redux
            dispatches stranded without a listener. The other context fields
            are placeholders: ClusterPicker reads clusterSets from Redux
            (renderStateSlice) and doesn't use ctx.data/label/resultName. */}
        <DatasetProvider value={{
          data: [],
          label: 'All datasets',
          resultName: '__broadcast__',
          projectId,
          analysisType: null,
          reactiveSelection: broadcastReactiveSelection,
        }}>
          <ClusterPicker datasets={datasetInfos} />
        </DatasetProvider>
      </div>

      {/* One collapse per *visible* chart type. `items` is filtered by
          `visibleChartKeys` so sections toggled off in the flyout disappear entirely
          (not just collapsed). `activeKey` is driven by a separate `expandedChartKeys`
          state so users can collapse/expand visible sections independently. */}
      <Collapse
        activeKey={expandedChartKeys}
        onChange={(keys) => setExpandedChartKeys(Array.isArray(keys) ? keys : [keys])}
        items={chartSections
          .filter(section => visibleChartKeys.includes(section.key))
          .map(section => ({
            key: section.key,
            label: section.label,
            children: section.render(),
          }))}
      />

      </div>{/* ── end main content column ── */}

      {/* ──────────────── Flyout Drawer ────────────────
          Shows the panel corresponding to the active toolbar button. Opens from
          the LEFT (next to the toolbar) instead of the right, so the user's eye
          doesn't have to cross the whole screen when they click an icon. Width
          is set so the panel overlays only a portion of the content, leaving
          most charts visible behind it. */}
      <Drawer
        title={
          activePanel === 'datasets' ? 'Datasets' :
          activePanel === 'parameters' ? 'Analysis Parameters' :
          activePanel === 'charts' ? 'Chart Selection' :
          activePanel === 'clusters' ? 'Cluster Picker' :
          activePanel === 'appearance' ? 'Global Theme' : ''
        }
        placement="left"
        open={activePanel !== null}
        onClose={() => setActivePanel(null)}
        width={400}
      >
        {/* Datasets panel — list the currently selected datasets */}
        {activePanel === 'datasets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Currently comparing {loadedDatasets.length} datasets. Use the chips at the top of the page to change the selection.
            </Text>
            {loadedDatasets.map(ds => (
              <Tag key={ds.resultName} color="blue" style={{ fontSize: '12px', padding: '4px 8px' }}>
                {ds.label}
              </Tag>
            ))}
          </div>
        )}

        {/* Analysis Parameters panel — not applicable to multi-dataset view */}
        {activePanel === 'parameters' && (
          <Text type="secondary">
            Analysis parameters are specific to a single dataset. Select just one dataset to view its parameters.
          </Text>
        )}

        {/* Chart Selection panel — toggle which chart types to show */}
        {activePanel === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
              Toggle which chart types are visible:
            </Text>
            {/* Each button reflects whether the section is currently RENDERED on the
                page (`visibleChartKeys`). Clicking toggles render-visibility; expansion
                state (`expandedChartKeys`) is managed separately by the Collapse
                component below. When a user toggles a section back on, we also add
                it to `expandedChartKeys` so they can immediately see what appeared. */}
            {chartSections.map(section => {
              const isVisible = visibleChartKeys.includes(section.key);
              return (
                <Button
                  key={section.key}
                  type={isVisible ? 'primary' : 'default'}
                  size="small"
                  onClick={() => {
                    if (isVisible) {
                      setVisibleChartKeys(visibleChartKeys.filter(k => k !== section.key));
                    } else {
                      setVisibleChartKeys([...visibleChartKeys, section.key]);
                      if (!expandedChartKeys.includes(section.key)) {
                        setExpandedChartKeys([...expandedChartKeys, section.key]);
                      }
                    }
                  }}
                  style={{ textAlign: 'left' }}
                >
                  {section.label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Cluster Picker panel — must use the broadcast DatasetProvider so clicks
            fan out to all per-dataset selections, matching the inline picker above. */}
        {activePanel === 'clusters' && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
              The cluster picker is also available at the top of the chart area.
            </Text>
            <DatasetProvider value={{
              data: [],
              label: 'All datasets',
              resultName: '__broadcast__',
              projectId,
              analysisType: null,
              reactiveSelection: broadcastReactiveSelection,
            }}>
              <ClusterPicker datasets={datasetInfos} />
            </DatasetProvider>
          </div>
        )}

        {/* Global Theme panel */}
        {activePanel === 'appearance' && (
          <AppearancePanel />
        )}
      </Drawer>
    </div>
  );
}
