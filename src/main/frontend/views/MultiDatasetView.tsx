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
import { DatasetProvider, type DatasetContextValue, type CategoryDataRow } from '../context/DatasetContext';
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

  // Column group labels for the simplified column visibility toggle
  const columnGroups: { key: keyof ColumnVisibility; label: string }[] = [
    { key: 'primaryFilters', label: 'Primary Filters' },
    { key: 'preFilters', label: 'Pre-Filters' },
    { key: 'fishersFull', label: 'Fisher\'s Test' },
    { key: 'bmdExtended', label: 'BMD Extended' },
    { key: 'bmdConfidence', label: 'BMD Confidence' },
    { key: 'bmdlStats', label: 'BMDL Stats' },
    { key: 'bmdlConfidence', label: 'BMDL Confidence' },
    { key: 'bmduStats', label: 'BMDU Stats' },
    { key: 'bmduConfidence', label: 'BMDU Confidence' },
    { key: 'bmdRanks', label: 'BMD Ranks' },
    { key: 'bmdlRanks', label: 'BMDL Ranks' },
    { key: 'bmduRanks', label: 'BMDU Ranks' },
    { key: 'filterCounts', label: 'Filter Counts' },
    { key: 'percentiles', label: 'Percentiles' },
    { key: 'directionalUp', label: 'Directional Up' },
    { key: 'directionalDown', label: 'Directional Down' },
    { key: 'directionalAnalysis', label: 'Directional Analysis' },
    { key: 'foldChange', label: 'Fold Change' },
    { key: 'zScores', label: 'Z-Scores' },
    { key: 'modelFoldChange', label: 'Model Fold Change' },
    { key: 'geneLists', label: 'Gene Lists' },
  ];

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

  // Helper: render a row of charts, one per dataset, side by side
  const renderSideBySide = (
    renderChart: (ctx: DatasetContextValue) => React.ReactNode
  ) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${loadedDatasets.length}, 1fr)`,
      gap: '8px',
    }}>
      {loadedDatasets.map(ds => {
        const ctx: DatasetContextValue = {
          data: ds.data,
          label: ds.label,
          resultName: ds.resultName,
          projectId,
        };
        return (
          <div key={ds.resultName}>
            {/* Dataset label */}
            <div style={{
              padding: '4px 8px',
              background: '#e6f7ff',
              borderBottom: '1px solid #91d5ff',
              fontSize: '11px',
              fontWeight: 600,
              color: '#1890ff',
              textAlign: 'center',
              marginBottom: '4px',
            }}>
              {ds.label}
            </div>
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
              title="Column Groups"
              content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                  {columnGroups.map(({ key, label }) => {
                    const val = sharedColumnVisibility[key];
                    const isOn = typeof val === 'boolean' ? val : val?.all;
                    return (
                      <Checkbox
                        key={key}
                        checked={isOn}
                        onChange={(e) => {
                          const next = { ...sharedColumnVisibility };
                          if (typeof next[key] === 'boolean') {
                            (next as any)[key] = e.target.checked;
                          } else {
                            (next as any)[key] = { ...(next[key] as any), all: e.target.checked };
                          }
                          setSharedColumnVisibility(next);
                        }}
                      >
                        {label}
                      </Checkbox>
                    );
                  })}
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px', marginTop: '4px', display: 'flex', gap: '8px' }}>
                    <Button size="small" onClick={() => {
                      const all: any = { ...sharedColumnVisibility };
                      columnGroups.forEach(({ key }) => {
                        if (typeof all[key] === 'boolean') all[key] = true;
                        else all[key] = { ...all[key], all: true };
                      });
                      setSharedColumnVisibility(all);
                    }}>Show All</Button>
                    <Button size="small" onClick={() => setSharedColumnVisibility(DEFAULT_COLUMN_VISIBILITY)}>
                      Reset
                    </Button>
                  </div>
                </div>
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
          ))}
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
          (like wide tables) shrink instead of forcing the whole row to overflow. */}
      <div style={{ flex: 1, minWidth: 0, padding: '1rem' }}>
      {/* Header showing how many datasets are compared */}
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Text strong style={{ fontSize: '14px' }}>
          Comparing {loadedDatasets.length} datasets
        </Text>
        {loadedDatasets.map(ds => (
          <Tag key={ds.resultName} color="blue" style={{ fontSize: '11px' }}>
            {ds.label}
          </Tag>
        ))}
      </div>

      {/* Cluster Picker — non-collapsible, always visible at top */}
      <div style={{
        marginBottom: '8px',
        padding: '8px 12px',
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '4px',
      }}>
        <ClusterPicker datasets={datasetInfos} />
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

        {/* Cluster Picker panel — the picker is already inline at the top of the view */}
        {activePanel === 'clusters' && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '12px' }}>
              The cluster picker is also available at the top of the chart area.
            </Text>
            <ClusterPicker />
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
