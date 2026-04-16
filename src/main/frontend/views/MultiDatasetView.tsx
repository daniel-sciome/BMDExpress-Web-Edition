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
import { Button, Collapse, Drawer, Spin, Tag, Tooltip, Typography } from 'antd';
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
import CategoryResultsGrid from '../components/CategoryResultsGrid';
import ClusterPicker, { type DatasetInfo } from '../components/ClusterPicker';
import AppearancePanel from '../components/charts/appearance/AppearancePanel';

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
  // Start with all chart sections expanded
  const [activeChartKeys, setActiveChartKeys] = useState<string[]>(['umap', 'default-charts', 'table']);

  // Synchronized axis ranges — one per chart type, shared across all dataset instances.
  // When a user zooms/pans in any instance, the range is broadcast to all siblings.
  const [umapRange, setUmapRange] = useState<SyncedRange>({});
  const [scatterRange, setScatterRange] = useState<SyncedRange>({});
  const [boxRange, setBoxRange] = useState<SyncedRange>({});

  const handleUmapRange = useCallback((r: SyncedRange) => setUmapRange(r), []);
  const handleScatterRange = useCallback((r: SyncedRange) => setScatterRange(r), []);
  const handleBoxRange = useCallback((r: SyncedRange) => setBoxRange(r), []);

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
      render: () => renderSideBySide(() => (
        <CategoryResultsGrid
          isExpanded={true}
          onExpandChange={() => {}}
        />
      )),
    },
  ];

  return (
    <div style={{ padding: '1rem' }}>
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

      {/* One collapse per chart type — controlled so the toolbar can collapse all */}
      <Collapse
        activeKey={activeChartKeys}
        onChange={(keys) => setActiveChartKeys(Array.isArray(keys) ? keys : [keys])}
        items={chartSections.map(section => ({
          key: section.key,
          label: section.label,
          children: section.render(),
        }))}
      />

      {/* Icon Toolbar — fixed strip on the left edge of the content area.
          Mirrors the toolbar in CategoryResultsView for consistency. */}
      <div
        style={{
          position: 'fixed',
          left: 300,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '4px',
          background: '#fafafa',
          padding: '8px 4px',
          borderRight: '1px solid #d9d9d9',
          zIndex: 100,
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
            onClick={() => setActiveChartKeys([])}
            size="small"
          />
        </Tooltip>
      </div>

      {/* Flyout Drawer — shows the panel corresponding to the active toolbar button */}
      <Drawer
        title={
          activePanel === 'datasets' ? 'Datasets' :
          activePanel === 'parameters' ? 'Analysis Parameters' :
          activePanel === 'charts' ? 'Chart Selection' :
          activePanel === 'clusters' ? 'Cluster Picker' :
          activePanel === 'appearance' ? 'Global Theme' : ''
        }
        placement="right"
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
            {chartSections.map(section => {
              const isOpen = activeChartKeys.includes(section.key);
              return (
                <Button
                  key={section.key}
                  type={isOpen ? 'primary' : 'default'}
                  size="small"
                  onClick={() => {
                    if (isOpen) {
                      setActiveChartKeys(activeChartKeys.filter(k => k !== section.key));
                    } else {
                      setActiveChartKeys([...activeChartKeys, section.key]);
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
