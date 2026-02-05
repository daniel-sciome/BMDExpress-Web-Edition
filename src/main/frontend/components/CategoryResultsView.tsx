import React, { useEffect, useState, useRef } from 'react';
import { Spin, Row, Col, Tag, Collapse, Checkbox, Space, Badge, Tooltip, Card, Radio, Button, Typography, Tabs, Drawer } from 'antd';
import { FileTextOutlined, InfoCircleOutlined, LineChartOutlined, EyeOutlined, DatabaseOutlined, AppstoreOutlined, MinusSquareOutlined } from '@ant-design/icons';
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

const { Text } = Typography;

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

  // Helper function to get friendly name for analysis type
  const getAnalysisTypeDisplayName = (analysisType: string | undefined): string => {
    if (!analysisType) return 'Other';
    const typeMap: Record<string, string> = {
      'GO_BP': 'GO Biological Process',
      'GO_MF': 'GO Molecular Function',
      'GO_CC': 'GO Cellular Component',
      'GO_ALL': 'GO All Terms',
      'KEGG': 'KEGG Pathways',
      'Reactome': 'Reactome Pathways',
      'BioPlanet': 'BioPlanet Pathways',
      'Pathway': 'Pathways',
      'GENE': 'Genes',
    };
    return typeMap[analysisType] || analysisType;
  };

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
    const chartKeyMap: Record<string, string> = {
      '1': 'chart-1', '2': 'chart-2', '3': 'chart-3', '4': 'chart-4',
      '5': 'chart-5', '6': 'chart-6', '7': 'chart-7', '8': 'chart-8',
      '9': 'chart-9', '10': 'chart-10', '11': 'chart-11', '12': 'chart-12',
      '14': 'chart-14', '15': 'chart-15'
    };

    // Find charts that are newly selected (in current but not in previous)
    const newlySelected = visibleCharts.filter(v => !prevVisibleChartsRef.current.includes(v));

    // Only expand newly selected charts
    const newKeys = newlySelected
      .map(v => chartKeyMap[v])
      .filter((key): key is string => key !== undefined)
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
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Formatted header with annotation metadata */}
        {annotation && annotation.parseSuccess ? (
          <div style={{ padding: '1rem 1rem 0 50px', flexShrink: 0 }}>
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
          <div style={{ padding: '1rem 1rem 0 50px', flexShrink: 0 }}>
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
                  paddingLeft: '50px'
                }}>
                  {/* Charts - Direct rendering based on checkbox selection (Power User mode only) */}
                  {viewMode === 'power' && visibleCharts.includes('1') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-1')}
                        items={[{
                          key: 'chart-1',
                          label: <span style={{ lineHeight: '22px' }}>BMD Overview (Scatter & Box Plot)</span>,
                          children: (
                            <div>
                              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <Space>
                                  <Text>BMD Statistic:</Text>
                                  <BmdStatSelector stat={bmdOverviewStat} onStatChange={setBmdOverviewStat} />
                                </Space>
                              </div>
                              <Row gutter={16} key={`${projectId}-${resultName}`}>
                                <Col xs={24} xl={12}>
                                  <BMDvsPValueScatter key={`${projectId}-${resultName}-scatter`} stat={bmdOverviewStat} hideControls />
                                </Col>
                                <Col xs={24} xl={12}>
                                  <BMDBoxPlot key={`${projectId}-${resultName}-box`} stat={bmdOverviewStat} hideControls />
                                </Col>
                              </Row>
                            </div>
                          )
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('2') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-2')}
                        items={[{
                          key: 'chart-2',
                          label: <span style={{ lineHeight: '22px' }}>UMAP Scatter Plot</span>,
                          children: <UmapScatterPlot key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('3') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-3')}
                        items={[{
                          key: 'chart-3',
                          label: <span style={{ lineHeight: '22px' }}>Curve Overlay</span>,
                          children: <PathwayCurveViewer key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('4') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-4')}
                        items={[{
                          key: 'chart-4',
                          label: <span style={{ lineHeight: '22px' }}>Range Plot</span>,
                          children: <RangePlot key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('5') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-5')}
                        items={[{
                          key: 'chart-5',
                          label: <span style={{ lineHeight: '22px' }}>Bubble Chart</span>,
                          children: <BubbleChart key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('6') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-6')}
                        items={[{
                          key: 'chart-6',
                          label: <span style={{ lineHeight: '22px' }}>Best Models Pie Chart</span>,
                          children: <BestModelsPieChart key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('7') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-7')}
                        items={[{
                          key: 'chart-7',
                          label: <span style={{ lineHeight: '22px' }}>Bar Charts</span>,
                          children: <BarCharts key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('8') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-8')}
                        items={[{
                          key: 'chart-8',
                          label: <span style={{ lineHeight: '22px' }}>Accumulation Charts</span>,
                          children: <AccumulationCharts key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('9') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-9')}
                        items={[{
                          key: 'chart-9',
                          label: <span style={{ lineHeight: '22px' }}>Stat Histograms</span>,
                          children: <StatHistograms key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('11') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-11')}
                        items={[{
                          key: 'chart-11',
                          label: <span style={{ lineHeight: '22px' }}>BMD vs BMDL Scatter</span>,
                          children: <BMDvsBMDLScatter key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('12') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-12')}
                        items={[{
                          key: 'chart-12',
                          label: <span style={{ lineHeight: '22px' }}>Violin Plot Per Category</span>,
                          children: <ViolinPlotPerCategory key={`${projectId}-${resultName}`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('14') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-14')}
                        items={[{
                          key: 'chart-14',
                          label: <span style={{ lineHeight: '22px' }}>Gene Cluster Histogram</span>,
                          children: <ClusterHeatmap key={`${projectId}-${resultName}-cluster-heatmap`} />
                        }]}
                      />
                    </div>
                  )}

                  {viewMode === 'power' && visibleCharts.includes('15') && (
                    <div style={{ marginBottom: '4px' }}>
                      <Collapse
                        activeKey={openChartCollapses}
                        onChange={handleChartCollapseChange('chart-15')}
                        items={[{
                          key: 'chart-15',
                          label: <span style={{ lineHeight: '22px' }}>Gene Cluster Scatter</span>,
                          children: <ClusterScatterPlot key={`${projectId}-${resultName}-cluster-scatter`} />
                        }]}
                      />
                    </div>
                  )}

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
                  paddingLeft: '50px'
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
          paddingLeft: '50px'
        }}>
        {/* Charts - Direct rendering based on checkbox selection (Power User mode only) */}
        {viewMode === 'power' && visibleCharts.includes('1') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-1')}
              items={[{
                key: 'chart-1',
                label: <span style={{ lineHeight: '22px' }}>BMD Overview (Scatter & Box Plot)</span>,
                children: (
                  <div>
                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <Space>
                        <Text>BMD Statistic:</Text>
                        <BmdStatSelector stat={bmdOverviewStat} onStatChange={setBmdOverviewStat} />
                      </Space>
                    </div>
                    <Row gutter={16} key={`${projectId}-${resultName}`}>
                      <Col xs={24} xl={12}>
                        <BMDvsPValueScatter key={`${projectId}-${resultName}-scatter`} stat={bmdOverviewStat} hideControls />
                      </Col>
                      <Col xs={24} xl={12}>
                        <BMDBoxPlot key={`${projectId}-${resultName}-box`} stat={bmdOverviewStat} hideControls />
                      </Col>
                    </Row>
                  </div>
                )
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('2') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-2')}
              items={[{
                key: 'chart-2',
                label: <span style={{ lineHeight: '22px' }}>UMAP Scatter Plot</span>,
                children: <UmapScatterPlot key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('3') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-3')}
              items={[{
                key: 'chart-3',
                label: <span style={{ lineHeight: '22px' }}>Curve Overlay</span>,
                children: <PathwayCurveViewer key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('4') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-4')}
              items={[{
                key: 'chart-4',
                label: <span style={{ lineHeight: '22px' }}>Range Plot</span>,
                children: <RangePlot key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('5') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-5')}
              items={[{
                key: 'chart-5',
                label: <span style={{ lineHeight: '22px' }}>Bubble Chart</span>,
                children: <BubbleChart key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('6') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-6')}
              items={[{
                key: 'chart-6',
                label: <span style={{ lineHeight: '22px' }}>Best Models Pie Chart</span>,
                children: <BestModelsPieChart key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('7') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-7')}
              items={[{
                key: 'chart-7',
                label: <span style={{ lineHeight: '22px' }}>Bar Charts</span>,
                children: <BarCharts key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('8') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-8')}
              items={[{
                key: 'chart-8',
                label: <span style={{ lineHeight: '22px' }}>Accumulation Charts</span>,
                children: <AccumulationCharts key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('9') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-9')}
              items={[{
                key: 'chart-9',
                label: <span style={{ lineHeight: '22px' }}>Stat Histograms</span>,
                children: <StatHistograms key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('11') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-11')}
              items={[{
                key: 'chart-11',
                label: <span style={{ lineHeight: '22px' }}>BMD vs BMDL Scatter</span>,
                children: <BMDvsBMDLScatter key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('12') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-12')}
              items={[{
                key: 'chart-12',
                label: <span style={{ lineHeight: '22px' }}>Violin Plot Per Category</span>,
                children: <ViolinPlotPerCategory key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('14') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-14')}
              items={[{
                key: 'chart-14',
                label: <span style={{ lineHeight: '22px' }}>Gene Cluster Histogram</span>,
                children: <ClusterHeatmap key={`${projectId}-${resultName}-cluster-heatmap`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('15') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-15')}
              items={[{
                key: 'chart-15',
                label: <span style={{ lineHeight: '22px' }}>Gene Cluster Scatter</span>,
                children: <ClusterScatterPlot key={`${projectId}-${resultName}-cluster-scatter`} />
              }]}
            />
          </div>
        )}

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

      {/* Icon Toolbar - Left Edge */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: '#fff',
          borderRadius: '4px',
          padding: '8px 6px',
          border: '1px solid #d9d9d9',
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
        {/* Divider */}
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
          activePanel === 'clusters' ? 'Cluster Picker' : ''
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
          <Checkbox.Group
            value={visibleCharts}
            onChange={(checkedValues) => dispatch(setVisibleCharts(checkedValues as string[]))}
            style={{ width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox value="1">Default Charts</Checkbox>
              <Checkbox value="2">UMAP Semantic Space</Checkbox>
              <Checkbox value="3">Curve Overlay</Checkbox>
              <Checkbox value="4">Range Plot</Checkbox>
              <Checkbox value="5">Bubble Chart</Checkbox>
              <Checkbox value="6">Best Models Pie</Checkbox>
              <Checkbox value="7">Bar Charts</Checkbox>
              <Checkbox value="8">Accumulation Charts</Checkbox>
              <Checkbox value="9">Mean Histograms</Checkbox>
              <Checkbox value="10">Median Histograms</Checkbox>
              <Checkbox value="11">BMD vs BMDL Scatter</Checkbox>
              <Checkbox value="12">Violin Per Category</Checkbox>
              <Checkbox value="14">Gene Cluster Heatmap</Checkbox>
              <Checkbox value="15">Gene Cluster Scatter</Checkbox>
            </div>
          </Checkbox.Group>
        )}

        {/* Clusters Panel */}
        {activePanel === 'clusters' && (
          <ClusterPicker />
        )}
      </Drawer>
    </div>
    </>
  );
}
