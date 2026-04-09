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

import { useState, useEffect } from 'react';
import { Collapse, Spin, Tag, Typography } from 'antd';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type CategoryAnalysisResultDto from 'Frontend/generated/com/sciome/dto/CategoryAnalysisResultDto';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import { DatasetProvider, type DatasetContextValue, type CategoryDataRow } from '../context/DatasetContext';

// Chart components — imported individually so we can render them per-dataset
import UmapScatterPlot from '../components/charts/UmapScatterPlot';
import BMDvsPValueScatter from '../components/charts/BMDvsPValueScatter';
import BMDBoxPlot from '../components/charts/BMDBoxPlot';
import CategoryResultsGrid from '../components/CategoryResultsGrid';
import ClusterPicker from '../components/ClusterPicker';

const { Text } = Typography;

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
  // Loaded data for each dataset, keyed by resultName
  const [datasets, setDatasets] = useState<Record<string, LoadedDataset>>({});

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

        // Mark all rows as inFocus and assign default clusterId (-2 = not in reference).
        // Cluster assignment from UMAP is not available in multi-dataset view yet.
        const dataWithFocus: CategoryDataRow[] = rows.map(row => ({
          ...row,
          inFocus: true,
          clusterId: (row as any).clusterId ?? -2,
        }));

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

  // Define chart sections — each becomes a collapse panel
  const chartSections: ChartSection[] = [
    {
      key: 'umap',
      label: 'UMAP Scatter Plot',
      render: () => renderSideBySide(() => (
        <UmapScatterPlot height={400} />
      )),
    },
    {
      key: 'default-charts',
      label: 'Default Charts (Scatter & Box)',
      render: () => renderSideBySide(() => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <BMDvsPValueScatter />
          <BMDBoxPlot />
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
        <ClusterPicker />
      </div>

      {/* One collapse per chart type */}
      <Collapse
        defaultActiveKey={chartSections.map(s => s.key)}
        items={chartSections.map(section => ({
          key: section.key,
          label: section.label,
          children: section.render(),
        }))}
      />
    </div>
  );
}
