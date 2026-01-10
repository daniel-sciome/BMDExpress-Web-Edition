import React, { useEffect, useState, useRef } from 'react';
import { Spin, Row, Col, Tag, Collapse, Checkbox, Space, Badge, Tooltip, Card, Radio, Button } from 'antd';
import { FileTextOutlined, InfoCircleOutlined, LineChartOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Icon } from '@vaadin/react-components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResultsWithRenderState, loadAnalysisParameters, setAnalysisType } from '../store/slices/categoryResultsSlice';
import { loadVisibilityDefaults, selectVisibilityInitialized, setDisplayMode, selectDisplayMode } from '../store/slices/visibilitySlice';
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
import PrimaryFilter, { PrimaryFilterTitle } from './PrimaryFilter';
import ViolinPlotPerCategory from './charts/ViolinPlotPerCategory';
import MeanHistograms from './charts/MeanHistograms';
import MedianHistograms from './charts/MedianHistograms';
import BMDvsBMDLScatter from './charts/BMDvsBMDLScatter';
import ClusterHeatmap from './charts/ClusterHeatmap';
import ClusterScatterPlot from './charts/ClusterScatterPlot';
import ClusterPicker from './ClusterPicker';
import ExperimentDescriptionRequired from './ExperimentDescriptionRequired';

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
 * Experiment Metadata Title Component
 * Styled header for Experiment Metadata collapse section
 */
function ExperimentMetadataTitle() {
  return (
    <Space>
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
      <span>Experiment Metadata (from project)</span>
      <Tooltip title="Metadata about the experiment from the project file. Includes species, sex, organ, test article, and other experimental conditions.">
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
  const [visibleCharts, setVisibleCharts] = useState<string[]>([]);
  // Track which chart collapses are open (start with all expanded, including table)
  const [openChartCollapses, setOpenChartCollapses] = useState<string[]>([
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6',
    'chart-7', 'chart-8', 'chart-9', 'chart-10', 'chart-11', 'chart-12',
    'chart-14', 'chart-15', 'category-results-table'
  ]);

  // Handle toggling a single chart collapse (add or remove from open list)
  const handleChartCollapseChange = (chartKey: string) => (keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.includes(chartKey)) {
      // Opening this collapse - add to list if not present
      setOpenChartCollapses(prev => prev.includes(chartKey) ? prev : [...prev, chartKey]);
    } else {
      // Closing this collapse - remove from list
      setOpenChartCollapses(prev => prev.filter(k => k !== chartKey));
    }
  };

  // Handle collapse all charts
  const handleCollapseAll = () => {
    setOpenChartCollapses([]);
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
      .filter((key): key is string => key !== undefined);

    if (newKeys.length > 0) {
      setOpenChartCollapses(prev => [...prev, ...newKeys]);
    }

    // Update ref for next comparison
    prevVisibleChartsRef.current = visibleCharts;
  }, [visibleCharts]);

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

  // Calculate active filter count for Primary Filter title
  const activeFilterCount = Object.entries(filters).filter(
    ([_, value]) => value !== undefined && value !== null
  ).length;

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
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Formatted header with annotation metadata */}
        {annotation && annotation.parseSuccess ? (
          <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {experimentDescription.testArticle || annotation.chemical || 'Unknown Test Article'}
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

            {/* Experiment Description from Project Metadata - Collapsible */}
            <div style={{ marginBottom: '4px' }}>
              <Collapse
                size="small"
                items={[{
                  key: 'experiment-metadata',
                  label: <ExperimentMetadataTitle />,
                  children: (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {experimentDescription.subjectType && (
                        <Tag color="default" style={{ fontSize: '13px' }}>Type: {experimentDescription.subjectType}</Tag>
                      )}
                      {experimentDescription.testArticle && (
                        <Tag color="blue" style={{ fontSize: '13px' }}>Test Article: {experimentDescription.testArticle}</Tag>
                      )}
                      {experimentDescription.casrn && (
                        <Tag color="geekblue" style={{ fontSize: '13px' }}>CASRN: {experimentDescription.casrn}</Tag>
                      )}
                      {experimentDescription.dsstox && (
                        <Tag color="geekblue" style={{ fontSize: '13px' }}>DSSTOX: {experimentDescription.dsstox}</Tag>
                      )}
                      <Tag color="orange" style={{ fontSize: '13px' }}>Species: {experimentDescription.species}</Tag>
                      {experimentDescription.strain && (
                        <Tag color="gold" style={{ fontSize: '13px' }}>Strain: {experimentDescription.strain}</Tag>
                      )}
                      <Tag color="purple" style={{ fontSize: '13px' }}>Sex: {experimentDescription.sex}</Tag>
                      <Tag color="green" style={{ fontSize: '13px' }}>Organ: {experimentDescription.organ}</Tag>
                      {experimentDescription.cellLine && (
                        <Tag color="lime" style={{ fontSize: '13px' }}>Cell Line: {experimentDescription.cellLine}</Tag>
                      )}
                      {experimentDescription.studyDuration && (
                        <Tag color="volcano" style={{ fontSize: '13px' }}>Duration: {experimentDescription.studyDuration}</Tag>
                      )}
                      {experimentDescription.articleRoute && (
                        <Tag color="red" style={{ fontSize: '13px' }}>Route: {experimentDescription.articleRoute}</Tag>
                      )}
                      {experimentDescription.articleVehicle && (
                        <Tag color="magenta" style={{ fontSize: '13px' }}>Vehicle: {experimentDescription.articleVehicle}</Tag>
                      )}
                      {experimentDescription.administrationMeans && (
                        <Tag color="pink" style={{ fontSize: '13px' }}>Means: {experimentDescription.administrationMeans}</Tag>
                      )}
                      {experimentDescription.platform && (
                        <Tag color="cyan" style={{ fontSize: '13px' }}>Platform: {experimentDescription.platform}</Tag>
                      )}
                      {experimentDescription.provider && (
                        <Tag color="processing" style={{ fontSize: '13px' }}>Provider: {experimentDescription.provider}</Tag>
                      )}
                    </div>
                  ),
                }]}
                style={{ background: '#fafafa' }}
              />
            </div>

            {/* Analysis Parameters - Collapsible */}
            {analysisParameters && analysisParameters.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <Collapse
                  size="small"
                  items={[{
                    key: 'params',
                    label: <AnalysisParametersTitle paramCount={analysisParameters.length} />,
                    children: (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {analysisParameters.map((param, index) => (
                          <Tag key={index} color="geekblue" style={{ fontSize: '12px', margin: 0 }}>
                            {param}
                          </Tag>
                        ))}
                      </div>
                    ),
                  }]}
                  style={{ background: '#fafafa' }}
                />
              </div>
            )}

          </div>
        ) : (
          <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {experimentDescription.testArticle || resultName}
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

            {/* Experiment Description - Collapsible */}
            <div style={{ marginBottom: '4px' }}>
              <Collapse
                size="small"
                items={[{
                  key: 'experiment-metadata',
                  label: <ExperimentMetadataTitle />,
                  children: (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {experimentDescription.subjectType && (
                        <Tag color="default" style={{ fontSize: '13px' }}>Type: {experimentDescription.subjectType}</Tag>
                      )}
                      {experimentDescription.testArticle && (
                        <Tag color="blue" style={{ fontSize: '13px' }}>Test Article: {experimentDescription.testArticle}</Tag>
                      )}
                      {experimentDescription.casrn && (
                        <Tag color="geekblue" style={{ fontSize: '13px' }}>CASRN: {experimentDescription.casrn}</Tag>
                      )}
                      {experimentDescription.dsstox && (
                        <Tag color="geekblue" style={{ fontSize: '13px' }}>DSSTOX: {experimentDescription.dsstox}</Tag>
                      )}
                      <Tag color="orange" style={{ fontSize: '13px' }}>Species: {experimentDescription.species}</Tag>
                      {experimentDescription.strain && (
                        <Tag color="gold" style={{ fontSize: '13px' }}>Strain: {experimentDescription.strain}</Tag>
                      )}
                      <Tag color="purple" style={{ fontSize: '13px' }}>Sex: {experimentDescription.sex}</Tag>
                      <Tag color="green" style={{ fontSize: '13px' }}>Organ: {experimentDescription.organ}</Tag>
                      {experimentDescription.cellLine && (
                        <Tag color="lime" style={{ fontSize: '13px' }}>Cell Line: {experimentDescription.cellLine}</Tag>
                      )}
                      {experimentDescription.studyDuration && (
                        <Tag color="volcano" style={{ fontSize: '13px' }}>Duration: {experimentDescription.studyDuration}</Tag>
                      )}
                      {experimentDescription.articleRoute && (
                        <Tag color="red" style={{ fontSize: '13px' }}>Route: {experimentDescription.articleRoute}</Tag>
                      )}
                      {experimentDescription.articleVehicle && (
                        <Tag color="magenta" style={{ fontSize: '13px' }}>Vehicle: {experimentDescription.articleVehicle}</Tag>
                      )}
                      {experimentDescription.administrationMeans && (
                        <Tag color="pink" style={{ fontSize: '13px' }}>Means: {experimentDescription.administrationMeans}</Tag>
                      )}
                      {experimentDescription.platform && (
                        <Tag color="cyan" style={{ fontSize: '13px' }}>Platform: {experimentDescription.platform}</Tag>
                      )}
                      {experimentDescription.provider && (
                        <Tag color="processing" style={{ fontSize: '13px' }}>Provider: {experimentDescription.provider}</Tag>
                      )}
                    </div>
                  ),
                }]}
                style={{ background: '#fafafa' }}
              />
            </div>
          </div>
        )}

      {/* Primary Filter - Collapsible (skip for GENE analyses) */}
      {annotation && annotation.analysisType !== 'GENE' && (
        <div style={{ padding: '0 1rem', flexShrink: 0 }}>
          <Collapse
            size="small"
            items={[{
              key: 'masterfilter',
              label: <PrimaryFilterTitle activeCount={activeFilterCount} />,
              children: <PrimaryFilter hideCard={true} />,
            }]}
            style={{ marginBottom: '4px', background: '#fafafa' }}
          />
        </div>
      )}

      {/* Chart Selection - Collapsible (Power User mode only) */}
      {viewMode === 'power' && (
        <div style={{ padding: '0 1rem', flexShrink: 0 }}>
          <Collapse
            size="small"
            items={[{
              key: 'chartselection',
              label: <ChartSelectionTitle selectedCount={visibleCharts.length} />,
              children: (
                <Checkbox.Group
                  value={visibleCharts}
                  onChange={setVisibleCharts}
                >
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
              ),
            }]}
            style={{ marginBottom: '4px', background: '#fafafa' }}
          />
        </div>
      )}

      {/* Display Mode Toggle - with border to match collapses */}
      <div style={{ padding: '0 1rem', flexShrink: 0 }}>
        <div style={{
          marginBottom: '4px',
          padding: '8px 12px',
          background: '#fafafa',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        }}>
          <Space size="middle" align="center">
            <Space size="small">
              <EyeOutlined style={{ color: '#666' }} />
              <span style={{ fontSize: '12px', color: '#666' }}>Visibility:</span>
            </Space>
            <Radio.Group
              value={displayMode}
              onChange={(e) => handleDisplayModeChange(e.target.value as DisplayMode)}
              size="small"
              optionType="button"
              buttonStyle="solid"
            >
              <Tooltip title="Show all categories (filtered + unfiltered) at full opacity">
                <Radio.Button value="highlight">Show All</Radio.Button>
              </Tooltip>
              <Tooltip title="Dim categories that don't pass filter criteria">
                <Radio.Button value="dim">Dim Others</Radio.Button>
              </Tooltip>
              <Tooltip title="Hide categories that don't pass filter criteria">
                <Radio.Button value="isolate">Hide Others</Radio.Button>
              </Tooltip>
            </Radio.Group>
            <Tooltip title="Collapse all expanded sections">
              <Button size="small" onClick={handleCollapseAll}>
                Collapse All
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* Cluster Picker - Power User mode only */}
      {viewMode === 'power' && (
        <div style={{ padding: '0 1rem', flexShrink: 0 }}>
          <ClusterPicker />
        </div>
      )}

      {/* Single scrollable container for both charts and table */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        padding: '1rem'
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
                  <Row gutter={16} key={`${projectId}-${resultName}`}>
                    <Col xs={24} xl={12}>
                      <BMDvsPValueScatter key={`${projectId}-${resultName}-scatter`} />
                    </Col>
                    <Col xs={24} xl={12}>
                      <BMDBoxPlot key={`${projectId}-${resultName}-box`} />
                    </Col>
                  </Row>
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
                label: <span style={{ lineHeight: '22px' }}>Mean Histograms</span>,
                children: <MeanHistograms key={`${projectId}-${resultName}`} />
              }]}
            />
          </div>
        )}

        {viewMode === 'power' && visibleCharts.includes('10') && (
          <div style={{ marginBottom: '4px' }}>
            <Collapse
              activeKey={openChartCollapses}
              onChange={handleChartCollapseChange('chart-10')}
              items={[{
                key: 'chart-10',
                label: <span style={{ lineHeight: '22px' }}>Median Histograms</span>,
                children: <MedianHistograms key={`${projectId}-${resultName}`} />
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
              setOpenChartCollapses(prev => prev.includes('category-results-table') ? prev : [...prev, 'category-results-table']);
            } else {
              setOpenChartCollapses(prev => prev.filter(k => k !== 'category-results-table'));
            }
          }}
        />
      </div>
    </div>
    </>
  );
}
