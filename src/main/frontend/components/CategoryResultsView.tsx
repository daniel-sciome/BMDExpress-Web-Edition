import React, { useEffect, useState, useRef } from 'react';
import { Spin, Row, Col, Tag, Collapse, Checkbox, Space, Badge, Tooltip, Card, Radio, Button, Typography, Tabs, Drawer, Divider } from 'antd';
import { FileTextOutlined, InfoCircleOutlined, LineChartOutlined, EyeOutlined, DatabaseOutlined, AppstoreOutlined, MinusSquareOutlined, PlusOutlined, EditOutlined, SettingOutlined, FormatPainterOutlined } from '@ant-design/icons';
import { Icon } from '@vaadin/react-components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResultsWithRenderState, loadAnalysisParameters, setAnalysisType } from '../store/slices/categoryResultsSlice';
import { setSelectedAnalysisType, setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { loadVisibilityDefaults, selectVisibilityInitialized, setDisplayMode, selectDisplayMode } from '../store/slices/visibilitySlice';
import { selectVisibleCharts, selectOpenCollapses, setVisibleCharts, setOpenCollapses, openCollapse, collapseAll } from '../store/slices/uiStateSlice';
import type { DisplayMode } from '../types/visibilityTypes';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsGrid from './CategoryResultsGrid';
import BMDvsPValueScatter from './charts/BMDvsPValueScatter';
import BMDBoxPlot from './charts/BMDBoxPlot';
import RangePlot from './charts/RangePlot';
import BubbleChart from './charts/BubbleChart';
import BarCharts from './charts/BarCharts';
import AccumulationCharts from './charts/AccumulationCharts';
import BestModelsPieChart from './charts/BestModelsPieChart';
import PathwayCurveViewer from './PathwayCurveViewer';
import UmapScatterPlot from './charts/UmapScatterPlot';
import ViolinPlotPerCategory from './charts/ViolinPlotPerCategory';
import StatHistograms from './charts/StatHistograms';
import BMDvsBMDLScatter from './charts/BMDvsBMDLScatter';
import ClusterHeatmap from './charts/ClusterHeatmap';
import ClusterScatterPlot from './charts/ClusterScatterPlot';
import ClusterPicker from './ClusterPicker';
import ExperimentDescriptionRequired from './ExperimentDescriptionRequired';
import VennDiagram from './charts/VennDiagram';
import AccumulationChartsComparison from './charts/AccumulationChartsComparison';
import GlobalViolinComparison from './charts/GlobalViolinComparison';
import ComparisonTable from './charts/ComparisonTable';
import { BmdStatSelector } from './charts/BmdMetricSelector';
import type { BmdStatType } from './charts/utils/bmdMetricConfig';
import { getAnalysisTypeDisplayName } from '../utils/analysisTypeConfig';
import ChartConfigEditor from './charts/ChartConfigEditor';
import ConfigurableChart from './charts/ConfigurableChart';
import AppearancePanel from './charts/appearance/AppearancePanel';
import ChartAppearanceModal from './charts/appearance/ChartAppearanceModal';
import type { SubplotDefinition } from 'Frontend/types/chartConfiguration';
import {
  saveConfiguration,
  selectUserConfigurations,
  selectPresetConfigurations,
  deleteConfiguration,
  PRESET_CONFIGURATIONS,
  type ChartConfiguration,
  type ChartConfigurationInput,
} from './charts/chartConfig';

const { Text } = Typography;

/**
 * Chart Configuration
 * Single source of truth for all chart definitions.
 * Each chart has a semantic ID, display label, and rendering info.
 */
interface ChartConfig {
  id: string;           // Semantic ID (e.g., 'bmd-histograms')
  label: string;        // Display label for checkbox and collapse
  // Component is rendered dynamically based on id in renderChart function
  // Some charts need extra props (projectId, resultName) which are passed at render time
  keyPostfix?: string;  // Optional postfix for React key (e.g., '-cluster-heatmap')
  subplots?: SubplotDefinition[];  // Sub-plot definitions for multi-plot charts
}

const CHART_CONFIG: ChartConfig[] = [
  { id: 'default-charts', label: 'Default Charts (Scatter & Box)', subplots: [
    { key: 'scatter', label: 'BMD vs P-Value Scatter' },
    { key: 'box', label: 'BMD Box Plot' },
  ]},
  { id: 'umap-scatter', label: 'UMAP Scatter Plot' },
  { id: 'curve-overlay', label: 'Dose Response Plots', subplots: [
    { key: 'overlay', label: 'Overlay Plot' },
  ]},
  { id: 'range-plot', label: 'Range Plot' },
  { id: 'bubble-chart', label: 'Bubble Chart' },
  { id: 'best-models-pie', label: 'Best Models Pie Chart' },
  { id: 'bar-charts', label: 'Bar Charts', subplots: [
    { key: 'bmd', label: 'BMD Bars' },
    { key: 'bmdl', label: 'BMDL Bars' },
    { key: 'bmdu', label: 'BMDU Bars' },
  ]},
  { id: 'accumulation-charts', label: 'Accumulation Plots (cumulative distribution)', subplots: [
    { key: 'bmd', label: 'BMD Accumulation' },
    { key: 'bmdl', label: 'BMDL Accumulation' },
    { key: 'bmdu', label: 'BMDU Accumulation' },
  ]},
  { id: 'bmd-histograms', label: 'BMD(L/U) Histograms', subplots: [
    { key: 'bmd', label: 'BMD Histogram' },
    { key: 'bmdl', label: 'BMDL Histogram' },
    { key: 'bmdu', label: 'BMDU Histogram' },
  ]},
  { id: 'bmd-vs-bmdl-scatter', label: 'BMD vs BMDL Scatter' },
  { id: 'violin-per-category', label: 'Violin Plot Per Category' },
  { id: 'cluster-heatmap', label: 'Gene Cluster Heatmap', keyPostfix: '-cluster-heatmap' },
  { id: 'cluster-scatter', label: 'Gene Cluster Scatter', keyPostfix: '-cluster-scatter' },
];

// Helper to get chart collapse key from chart ID
const getChartKey = (chartId: string) => `chart-${chartId}`;

interface CategoryResultsViewProps {
  projectId: string;
  resultName: string;
}

/**
 * Analysis Parameters Title Component
 * Styled header for Analysis Parameters collapse section
 */
function AnalysisParametersTitle({ paramCount }: { paramCount: number }) {
  return (
    <Space>
      <FileTextOutlined />
      <span>Analysis Parameters</span>
      {paramCount > 0 && (
        <Badge count={paramCount} style={{ backgroundColor: '#1890ff' }} />
      )}
      <Tooltip title="Configuration parameters used for this BMD analysis. These settings define the statistical methods, thresholds, and options applied during the benchmark dose modeling process.">
        <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

/**
 * Chart Selection Title Component
 * Styled header for Chart Selection collapse section
 */
function ChartSelectionTitle({ selectedCount }: { selectedCount: number }) {
  return (
    <Space>
      <LineChartOutlined />
      <span>Chart Selection</span>
      {selectedCount > 0 && (
        <Badge count={selectedCount} style={{ backgroundColor: '#52c41a' }} />
      )}
      <Tooltip title="Select which charts to display. Charts will render below the table based on your selection.">
        <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

/**
 * Datasets Title Component
 * Styled header for Datasets collapse section
 */
function DatasetsTitle({ count }: { count: number }) {
  return (
    <Space>
      <DatabaseOutlined />
      <span>Datasets</span>
      {count > 0 && (
        <Badge count={count} style={{ backgroundColor: '#1890ff' }} />
      )}
      <Tooltip title="Select a different dataset from this project to analyze.">
        <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}


export default function CategoryResultsView({ projectId, resultName }: CategoryResultsViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error, data, experimentDescription, analysisParameters, filters, viewMode } = useAppSelector((state) => state.categoryResults);
  const visibilityInitialized = useAppSelector(selectVisibilityInitialized);
  const displayMode = useAppSelector(selectDisplayMode);
  const [annotation, setAnnotation] = useState<AnalysisAnnotationDto | null>(null);

  // Chart visibility and collapse state from Redux (persists across result changes)
  const visibleCharts = useAppSelector(selectVisibleCharts);
  const openChartCollapses = useAppSelector(selectOpenCollapses);

  // Datasets state
  const [allAnnotations, setAllAnnotations] = useState<AnalysisAnnotationDto[]>([]);
  const [comparatorDatasets, setComparatorDatasets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('single');
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Shared BMD stat for BMD Overview section (controls both scatter and box plot)
  const [bmdOverviewStat, setBmdOverviewStat] = useState<BmdStatType>('fifthPercentile');

  // Per-chart appearance modal
  const [appearanceChartId, setAppearanceChartId] = useState<string | null>(null);


  // Chart configuration
  const userConfigurations = useAppSelector(selectUserConfigurations);
  const presetConfigurations = useAppSelector(selectPresetConfigurations);
  const [chartEditorVisible, setChartEditorVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChartConfiguration | null>(null);

  // Handle save chart configuration
  const handleSaveChartConfig = (config: ChartConfigurationInput) => {
    dispatch(saveConfiguration(config));
    setChartEditorVisible(false);
    setEditingConfig(null);
  };

  // Handle delete custom chart
  const handleDeleteCustomChart = (id: string) => {
    dispatch(deleteConfiguration(id));
  };

  // Render chart content based on chart ID
  const renderChartContent = (chartId: string) => {
    const chartKey = `${projectId}-${resultName}`;
    const config = CHART_CONFIG.find(c => c.id === chartId);
    const keyPostfix = config?.keyPostfix || '';

    switch (chartId) {
      case 'default-charts':
        return (
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Space>
                <Text>BMD Statistic:</Text>
                <BmdStatSelector stat={bmdOverviewStat} onStatChange={setBmdOverviewStat} />
              </Space>
            </div>
            <Row gutter={16} key={chartKey}>
              <Col xs={24} xl={12}>
                <BMDvsPValueScatter key={`${chartKey}-scatter`} stat={bmdOverviewStat} hideControls chartId="default-charts-scatter" parentChartId="default-charts" subplotKey="scatter" />
              </Col>
              <Col xs={24} xl={12}>
                <BMDBoxPlot key={`${chartKey}-box`} stat={bmdOverviewStat} hideControls chartId="default-charts-box" parentChartId="default-charts" subplotKey="box" />
              </Col>
            </Row>
          </div>
        );
      case 'umap-scatter':
        return <UmapScatterPlot key={chartKey} chartId={chartId} />;
      case 'curve-overlay':
        return <PathwayCurveViewer key={chartKey} projectId={projectId} resultName={resultName} chartId={chartId} />;
      case 'range-plot':
        return <RangePlot key={chartKey} chartId={chartId} />;
      case 'bubble-chart':
        return <BubbleChart key={chartKey} chartId={chartId} />;
      case 'best-models-pie':
        return <BestModelsPieChart key={chartKey} projectId={projectId} resultName={resultName} chartId={chartId} />;
      case 'bar-charts':
        return <BarCharts key={chartKey} chartId={chartId} />;
      case 'accumulation-charts':
        return <AccumulationCharts key={chartKey} chartId={chartId} />;
      case 'bmd-histograms':
        return <StatHistograms key={chartKey} chartId={chartId} />;
      case 'bmd-vs-bmdl-scatter':
        return <BMDvsBMDLScatter key={chartKey} chartId={chartId} />;
      case 'violin-per-category':
        return <ViolinPlotPerCategory key={chartKey} chartId={chartId} />;
      case 'cluster-heatmap':
        return <ClusterHeatmap key={`${chartKey}${keyPostfix}`} chartId={chartId} />;
      case 'cluster-scatter':
        return <ClusterScatterPlot key={`${chartKey}${keyPostfix}`} chartId={chartId} />;
      default:
        // Check if it's a custom chart
        const customConfig = userConfigurations.find(c => c.id === chartId);
        if (customConfig) {
          return <ConfigurableChart key={`${chartKey}-${chartId}`} config={customConfig} showControls />;
        }
        return null;
    }
  };

  // Render a chart collapse panel
  const renderChartCollapse = (chartId: string) => {
    const config = CHART_CONFIG.find(c => c.id === chartId);
    if (!config) return null;

    const collapseKey = getChartKey(chartId);

    if (!visibleCharts.includes(chartId)) return null;

    // Check if this chart is configurable
    const presetConfig = presetConfigurations.find(p => p.id === chartId)
      || PRESET_CONFIGURATIONS.find(p => p.id === chartId);
    const isConfigurable = presetConfig && ['scatter', 'bubble', 'histogram', 'bar'].includes(presetConfig.chartType);

    // Build the label with optional gear icon and appearance button
    const labelContent = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isConfigurable && (
          <Tooltip title="Configure chart axes & options">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                if (presetConfig) {
                  setEditingConfig(presetConfig);
                  setChartEditorVisible(true);
                }
              }}
            />
          </Tooltip>
        )}
        <Tooltip title="Chart Appearance">
          <Button
            type="text"
            size="small"
            icon={<FormatPainterOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setAppearanceChartId(chartId);
            }}
          />
        </Tooltip>
        <span style={{ lineHeight: '22px' }}>{config.label}</span>
      </div>
    );

    return (
      <div key={chartId} style={{ marginBottom: '4px' }}>
        <Collapse
          activeKey={openChartCollapses}
          onChange={handleChartCollapseChange(collapseKey)}
          items={[{
            key: collapseKey,
            label: labelContent,
            children: renderChartContent(chartId)
          }]}
        />
      </div>
    );
  };

  // Load all annotations for the project
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const annotationList = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
        const valid = (annotationList || []).filter((a): a is AnalysisAnnotationDto => a !== undefined);
        setAllAnnotations(valid);
      } catch (error) {
        console.error('Failed to load annotations:', error);
        setAllAnnotations([]);
      }
    };
    loadAnnotations();
  }, [projectId]);

  // Auto-switch to comparison tab when comparators are added
  useEffect(() => {
    if (comparatorDatasets.length > 0) {
      setActiveTab('comparison');
    }
  }, [comparatorDatasets.length]);

  // Note: getAnalysisTypeDisplayName imported from analysisTypeConfig.ts

  // Group annotations by analysis type
  const groupedAnnotations = allAnnotations.reduce((acc, ann) => {
    const type = ann.analysisType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(ann);
    return acc;
  }, {} as Record<string, AnalysisAnnotationDto[]>);

  // Handle dataset chip click
  const handleDatasetClick = (datasetKey: string, event: React.MouseEvent) => {
    const isModifierClick = event.ctrlKey || event.metaKey;

    if (isModifierClick) {
      // Toggle comparator
      setComparatorDatasets(prev => {
        if (prev.includes(datasetKey)) {
          return prev.filter(d => d !== datasetKey);
        } else {
          // Can't be both primary and comparator
          if (datasetKey === resultName) return prev;
          return [...prev, datasetKey];
        }
      });
    } else {
      // Set as primary (navigate to it)
      if (datasetKey !== resultName) {
        // Remove from comparators if it was one
        setComparatorDatasets(prev => prev.filter(d => d !== datasetKey));
        dispatch(setSelectedCategoryResult(datasetKey));
      }
    }
  };

  // Handle analysis type click (group header)
  const handleAnalysisTypeClick = (analysisType: string) => {
    dispatch(setSelectedAnalysisType(analysisType));
  };

  // Handle toggling a single chart collapse (add or remove from open list)
  const handleChartCollapseChange = (chartKey: string) => (keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.includes(chartKey)) {
      // Opening this collapse - add to list if not present
      if (!openChartCollapses.includes(chartKey)) {
        dispatch(setOpenCollapses([...openChartCollapses, chartKey]));
      }
    } else {
      // Closing this collapse - remove from list
      dispatch(setOpenCollapses(openChartCollapses.filter(k => k !== chartKey)));
    }
  };

  // Handle collapse all charts
  const handleCollapseAll = () => {
    dispatch(collapseAll());
  };

  // Track previous visibleCharts to detect newly selected charts
  const prevVisibleChartsRef = useRef<string[]>([]);

  // When a NEW chart is selected (not previously visible), auto-expand it
  // Charts that were already visible keep their current collapse state
  useEffect(() => {
    // Find charts that are newly selected (in current but not in previous)
    const newlySelected = visibleCharts.filter(v => !prevVisibleChartsRef.current.includes(v));

    // Only expand newly selected charts
    const newKeys = newlySelected
      .map(v => getChartKey(v))
      .filter(key => !openChartCollapses.includes(key));

    if (newKeys.length > 0) {
      dispatch(setOpenCollapses([...openChartCollapses, ...newKeys]));
    }

    // Update ref for next comparison
    prevVisibleChartsRef.current = visibleCharts;
  }, [visibleCharts, openChartCollapses, dispatch]);

  // Handle display mode change
  const handleDisplayModeChange = (mode: DisplayMode) => {
    dispatch(setDisplayMode(mode));
  };

  // Load visibility defaults from backend on first render (if not already loaded)
  useEffect(() => {
    if (!visibilityInitialized) {
      console.log('[CategoryResultsView] Loading visibility defaults from backend');
      dispatch(loadVisibilityDefaults());
    }
  }, [dispatch, visibilityInitialized]);

  // Note: Initial "all selected" state is now set in loadCategoryResultsWithRenderState thunk
  // This ensures selection is set BEFORE the component renders, avoiding flash of unchecked state

  // Debug logging for component mounting and props changes
  useEffect(() => {
    console.log('[CategoryResultsView] Component mounted/updated with:', {
      projectId,
      resultName,
      dataLength: data.length,
      primaryFilters: filters
    });
    return () => {
      console.log('[CategoryResultsView] Component unmounting');
    };
  }, [projectId, resultName, data.length, filters]);

  useEffect(() => {
    console.log('[CategoryResultsView] Loading data for:', { projectId, resultName });
    if (projectId && resultName) {
      dispatch(loadCategoryResultsWithRenderState({ projectId, resultName }));
      dispatch(loadAnalysisParameters({ projectId, resultName }));
      loadAnnotation();
    }
  }, [dispatch, projectId, resultName]);

  const loadAnnotation = async () => {
    console.log('[CategoryResultsView] Loading annotation for:', { projectId, resultName });
    try {
      const ann = await CategoryResultsService.getCategoryResultAnnotation(projectId, resultName);
      console.log('[CategoryResultsView] Annotation loaded:', ann);
      setAnnotation(ann || null);
    } catch (error) {
      console.error('[CategoryResultsView] Failed to load annotation:', error);
      setAnnotation(null);
    }
  };

  // Update analysisType in Redux when annotation changes
  useEffect(() => {
    if (annotation) {
      dispatch(setAnalysisType(annotation.analysisType || null));
    }
  }, [annotation, dispatch]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: '1rem' }}>Loading category results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ color: 'red' }}>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>No Results</h2>
        <p>No category results found for {resultName} in project {projectId}.</p>
      </div>
    );
  }

  // Validate experiment description - required fields: sex, organ, species
  const isExperimentDescriptionComplete = experimentDescription && experimentDescription.sex && experimentDescription.organ && experimentDescription.species;

  if (!isExperimentDescriptionComplete) {
    return <ExperimentDescriptionRequired experimentDesc={experimentDescription} showCurrentStatus={true} />;
  }

  return (
    <>
      <style>
        {`
          .ant-tabs-content,
          .ant-tabs-content-holder,
          .ant-tabs-tabpane {
            height: 100%;
          }

          /* Compact Collapse styling */
          .ant-collapse-borderless {
            background: transparent !important;
          }
          .ant-collapse-borderless > .ant-collapse-item {
            border-bottom: none !important;
            margin-bottom: 0 !important;
          }
          .ant-collapse-borderless > .ant-collapse-item:last-child {
            border-radius: 0 !important;
          }
          .ant-collapse > .ant-collapse-item > .ant-collapse-header {
            padding: 4px 12px !important;
            min-height: 28px !important;
            align-items: center !important;
          }
          .ant-collapse > .ant-collapse-item {
            margin-bottom: 0 !important;
          }
        `}
      </style>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', marginLeft: '40px' }}>
        {/* Formatted header with annotation metadata */}
        {annotation && annotation.parseSuccess ? (
          <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
            {/* TODO: Project-level metadata is not well-defined. Currently using experiment-level metadata. */}
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {experimentDescription.testArticle || annotation.chemical || 'Unknown Test Article'}
              {(experimentDescription.strain || experimentDescription.species) && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #fa8c16',
                  color: '#fa8c16',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {[experimentDescription.strain, experimentDescription.species ? experimentDescription.species.charAt(0).toUpperCase() + experimentDescription.species.slice(1) : null].filter(Boolean).join(' ')}
                </span>
              )}
              {experimentDescription.sex && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #722ed1',
                  color: '#722ed1',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.sex}
                </span>
              )}
              {experimentDescription.organ && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #52c41a',
                  color: '#52c41a',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.organ}
                </span>
              )}
              {experimentDescription.platform && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #13c2c2',
                  color: '#13c2c2',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.platform}
                </span>
              )}
              {experimentDescription.casrn && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #2f54eb',
                  color: '#2f54eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  CASRN {experimentDescription.casrn}
                </span>
              )}
              {experimentDescription.dsstox && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #2f54eb',
                  color: '#2f54eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.dsstox.replace(/^(DTXSID)(\d+)$/, '$1 $2')}
                </span>
              )}
              {annotation.analysisType && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #722ed1',
                  color: '#722ed1',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {annotation.analysisType}
                </span>
              )}
              <span style={{
                padding: '2px 8px',
                border: '1px solid #888',
                color: '#888',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 500,
              }}>
                {data.length} categories
              </span>
            </h2>

          </div>
        ) : (
          <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
            {/* TODO: Project-level metadata is not well-defined. Currently using experiment-level metadata. */}
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {experimentDescription.testArticle || resultName}
              {(experimentDescription.strain || experimentDescription.species) && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #fa8c16',
                  color: '#fa8c16',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {[experimentDescription.strain, experimentDescription.species ? experimentDescription.species.charAt(0).toUpperCase() + experimentDescription.species.slice(1) : null].filter(Boolean).join(' ')}
                </span>
              )}
              {experimentDescription.sex && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #722ed1',
                  color: '#722ed1',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.sex}
                </span>
              )}
              {experimentDescription.organ && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #52c41a',
                  color: '#52c41a',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.organ}
                </span>
              )}
              {experimentDescription.platform && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #13c2c2',
                  color: '#13c2c2',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.platform}
                </span>
              )}
              {experimentDescription.casrn && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #2f54eb',
                  color: '#2f54eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  CASRN {experimentDescription.casrn}
                </span>
              )}
              {experimentDescription.dsstox && (
                <span style={{
                  padding: '2px 8px',
                  border: '1px solid #2f54eb',
                  color: '#2f54eb',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}>
                  {experimentDescription.dsstox.replace(/^(DTXSID)(\d+)$/, '$1 $2')}
                </span>
              )}
              <span style={{
                padding: '2px 8px',
                border: '1px solid #888',
                color: '#888',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 500,
              }}>
                {data.length} categories
              </span>
            </h2>

          </div>
        )}

      {/* Main content - tabbed when comparators are selected */}
      {comparatorDatasets.length > 0 ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          items={[
            {
              key: 'single',
              label: 'Single Dataset',
              children: (
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0,
                  padding: '1rem',
                  paddingLeft: '1rem'
                }}>
                  {/* Charts - Direct rendering based on checkbox selection (Power User mode only) */}
                  {viewMode === 'power' && CHART_CONFIG.map(config => renderChartCollapse(config.id))}

                  {/* Table */}
                  <CategoryResultsGrid
                    key={`${projectId}-${resultName}`}
                    isExpanded={openChartCollapses.includes('category-results-table')}
                    onExpandChange={(expanded) => {
                      if (expanded) {
                        if (!openChartCollapses.includes('category-results-table')) {
                          dispatch(setOpenCollapses([...openChartCollapses, 'category-results-table']));
                        }
                      } else {
                        dispatch(setOpenCollapses(openChartCollapses.filter(k => k !== 'category-results-table')));
                      }
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'comparison',
              label: `Comparison (${comparatorDatasets.length + 1} datasets)`,
              children: (
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0,
                  padding: '1rem',
                  paddingLeft: '1rem'
                }}>
                  <Collapse
                    defaultActiveKey={['comparisonTable', 'venn', 'accumulation', 'globalViolin']}
                    items={[
                      {
                        key: 'comparisonTable',
                        label: 'Comparison Table',
                        children: (
                          <ComparisonTable
                            projectId={projectId}
                            selectedResults={[resultName, ...comparatorDatasets]}
                            resultDisplayNames={{}}
                            analysisType={annotation?.analysisType || ''}
                          />
                        ),
                      },
                      {
                        key: 'venn',
                        label: 'Venn Diagram',
                        children: (
                          <VennDiagram
                            projectId={projectId}
                            availableResults={[resultName, ...comparatorDatasets]}
                            selectedResults={[resultName, ...comparatorDatasets]}
                          />
                        ),
                      },
                      {
                        key: 'accumulation',
                        label: 'Accumulation Charts',
                        children: (
                          <AccumulationChartsComparison
                            projectId={projectId}
                            availableResults={[resultName, ...comparatorDatasets]}
                            selectedResults={[resultName, ...comparatorDatasets]}
                            analysisType={annotation?.analysisType || ''}
                          />
                        ),
                      },
                      {
                        key: 'globalViolin',
                        label: 'Global Violin Plot',
                        children: (
                          <GlobalViolinComparison
                            projectId={projectId}
                            availableResults={[resultName, ...comparatorDatasets]}
                            selectedResults={[resultName, ...comparatorDatasets]}
                            analysisType={annotation?.analysisType || ''}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          padding: '1rem',
          paddingLeft: '1rem'
        }}>
        {/* Charts - Direct rendering based on checkbox selection (Power User mode only) */}
        {viewMode === 'power' && CHART_CONFIG.map(config => renderChartCollapse(config.id))}

        {/* Table */}
        <CategoryResultsGrid
          key={`${projectId}-${resultName}`}
          isExpanded={openChartCollapses.includes('category-results-table')}
          onExpandChange={(expanded) => {
            if (expanded) {
              if (!openChartCollapses.includes('category-results-table')) {
                dispatch(setOpenCollapses([...openChartCollapses, 'category-results-table']));
              }
            } else {
              dispatch(setOpenCollapses(openChartCollapses.filter(k => k !== 'category-results-table')));
            }
          }}
        />
      </div>
      )}


      {/* Icon Toolbar - fixed strip between sidebar and content */}
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
        {analysisParameters && analysisParameters.length > 0 && (
          <Tooltip title="Analysis Parameters" placement="right">
            <Button
              type={activePanel === 'parameters' ? 'primary' : 'text'}
              icon={<FileTextOutlined />}
              onClick={() => setActivePanel(activePanel === 'parameters' ? null : 'parameters')}
              size="small"
            />
          </Tooltip>
        )}
        {viewMode === 'power' && (
          <>
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
          </>
        )}
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
            onClick={handleCollapseAll}
            size="small"
          />
        </Tooltip>
      </div>

      {/* Flyout Drawer */}
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
        {/* Datasets Panel */}
        {activePanel === 'datasets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(groupedAnnotations).sort((a, b) => a[0].localeCompare(b[0])).map(([analysisType, items]) => (
              <div key={analysisType}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#666',
                    marginBottom: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🧬</span>
                  {getAnalysisTypeDisplayName(analysisType)}
                  <Tag color="blue" style={{ fontSize: '11px' }}>{items.length}</Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {items.map(ann => {
                    const datasetKey = ann.fullName || '';
                    const isPrimary = datasetKey === resultName;
                    const isComparator = comparatorDatasets.includes(datasetKey);
                    return (
                      <Tooltip
                        key={datasetKey}
                        title={
                          isPrimary ? 'Primary dataset (Cmd/Ctrl+click to compare others)' :
                          isComparator ? 'Comparator (click to set as primary, Cmd/Ctrl+click to remove)' :
                          'Click to set as primary, Cmd/Ctrl+click to add as comparator'
                        }
                      >
                        <div
                          onClick={(e) => handleDatasetClick(datasetKey, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isPrimary ? 600 : 400,
                            backgroundColor: isPrimary ? '#1890ff' : isComparator ? '#e6f7ff' : '#fff',
                            color: isPrimary ? '#fff' : '#333',
                            border: isPrimary ? '1px solid #1890ff' : isComparator ? '1px solid #91d5ff' : '1px solid #d9d9d9',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isPrimary && !isComparator) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                              e.currentTarget.style.borderColor = '#bfbfbf';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isPrimary && !isComparator) {
                              e.currentTarget.style.backgroundColor = '#fff';
                              e.currentTarget.style.borderColor = '#d9d9d9';
                            }
                          }}
                        >
                          {isPrimary && <span>★</span>}
                          {isComparator && <span>◇</span>}
                          {ann.displayName || ann.fullName}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic', marginTop: '8px' }}>
              Click = set primary, Cmd/Ctrl+click = toggle comparator
            </div>
          </div>
        )}

        {/* Parameters Panel */}
        {activePanel === 'parameters' && analysisParameters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {analysisParameters.map((param, index) => (
              <Tag key={index} color="geekblue" style={{ fontSize: '12px', margin: 0 }}>
                {param}
              </Tag>
            ))}
          </div>
        )}

        {/* Charts Panel */}
        {activePanel === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Built-in Charts */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Built-in Charts</Text>
              <Checkbox.Group
                value={visibleCharts}
                onChange={(checkedValues) => dispatch(setVisibleCharts(checkedValues as string[]))}
                style={{ width: '100%' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CHART_CONFIG.map(config => {
                    // Find corresponding preset configuration for this chart
                    const presetConfig = presetConfigurations.find(p => p.id === config.id)
                      || PRESET_CONFIGURATIONS.find(p => p.id === config.id);
                    const isConfigurable = presetConfig && ['scatter', 'bubble', 'histogram', 'bar'].includes(presetConfig.chartType);

                    return (
                      <div key={config.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Checkbox value={config.id} style={{ flex: 1 }}>
                          {config.label}
                        </Checkbox>
                        {isConfigurable && (
                          <Tooltip title="Configure axes & options">
                            <Button
                              type="text"
                              size="small"
                              icon={<SettingOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (presetConfig) {
                                  setEditingConfig(presetConfig);
                                  setChartEditorVisible(true);
                                }
                              }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Checkbox.Group>
            </div>

            {/* Custom Charts Section */}
            <Divider style={{ margin: '8px 0' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text strong>Custom Charts</Text>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingConfig(null);
                    setChartEditorVisible(true);
                  }}
                >
                  Create
                </Button>
              </div>

              {userConfigurations.length === 0 ? (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  No custom charts yet. Click "Create" to add one.
                </Text>
              ) : (
                <Checkbox.Group
                  value={visibleCharts}
                  onChange={(checkedValues) => dispatch(setVisibleCharts(checkedValues as string[]))}
                  style={{ width: '100%' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userConfigurations.map(config => (
                      <div key={config.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Checkbox value={config.id} style={{ flex: 1 }}>
                          {config.name}
                        </Checkbox>
                        <Tooltip title="Edit">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingConfig(config);
                              setChartEditorVisible(true);
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<MinusSquareOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomChart(config.id);
                            }}
                          />
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              )}
            </div>
          </div>
        )}

        {/* Clusters Panel */}
        {activePanel === 'clusters' && (
          <ClusterPicker />
        )}

        {/* Appearance Panel */}
        {activePanel === 'appearance' && (
          <AppearancePanel />
        )}
      </Drawer>

      {/* Chart Configuration Editor Modal */}
      <ChartConfigEditor
        visible={chartEditorVisible}
        config={editingConfig}
        onSave={handleSaveChartConfig}
        onCancel={() => {
          setChartEditorVisible(false);
          setEditingConfig(null);
        }}
        isNew={editingConfig === null}
      />

      {/* Per-Chart Appearance Modal */}
      <ChartAppearanceModal
        chartId={appearanceChartId || ''}
        chartLabel={CHART_CONFIG.find(c => c.id === appearanceChartId)?.label || ''}
        open={appearanceChartId !== null}
        onClose={() => setAppearanceChartId(null)}
        renderChart={() => appearanceChartId ? renderChartContent(appearanceChartId) : null}
        subplots={CHART_CONFIG.find(c => c.id === appearanceChartId)?.subplots}
      />
    </div>
    </>
  );
}
