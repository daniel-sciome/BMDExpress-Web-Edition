import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Tag, Collapse, Checkbox, Space, Badge, Tooltip, Card } from 'antd';
import { FileTextOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResultsWithRenderState, loadAnalysisParameters, setAnalysisType } from '../store/slices/categoryResultsSlice';
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
import GlobalViolinComparison from './charts/GlobalViolinComparison';
import MeanHistograms from './charts/MeanHistograms';
import MedianHistograms from './charts/MedianHistograms';
import BMDvsBMDLScatter from './charts/BMDvsBMDLScatter';

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

export default function CategoryResultsView({ projectId, resultName }: CategoryResultsViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error, data, analysisParameters, filters, viewMode } = useAppSelector((state) => state.categoryResults);
  const [annotation, setAnnotation] = useState<AnalysisAnnotationDto | null>(null);
  const [visibleCharts, setVisibleCharts] = useState<string[]>([]);
  const [availableResults, setAvailableResults] = useState<string[]>([]);

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

  // Load all available category results for this project
  useEffect(() => {
    const loadAvailableResults = async () => {
      try {
        const allAnnotations = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
        const validAnnotations = (allAnnotations || [])
          .filter((a): a is AnalysisAnnotationDto => a !== undefined && a.fullName !== undefined);

        // Get all unique result names for this project
        const resultNames = validAnnotations.map(a => a.fullName!);
        setAvailableResults(resultNames);
      } catch (error) {
        console.error('[CategoryResultsView] Failed to load available results:', error);
        setAvailableResults([resultName]); // Fallback to just current result
      }
    };

    if (projectId) {
      loadAvailableResults();
    }
  }, [projectId, resultName]);

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
            padding: 2px 12px !important;
            line-height: 1.1 !important;
            min-height: 24px !important;
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
          <h2 style={{ marginBottom: '0.5rem' }}>{annotation.chemical || 'Unknown Chemical'}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {annotation.sex && (
              <Tag color="purple" style={{ fontSize: '13px' }}>Sex: {annotation.sex}</Tag>
            )}
            {annotation.organ && (
              <Tag color="green" style={{ fontSize: '13px' }}>Organ: {annotation.organ}</Tag>
            )}
            {annotation.species && (
              <Tag color="orange" style={{ fontSize: '13px' }}>Species: {annotation.species}</Tag>
            )}
            {annotation.platform && (
              <Tag color="cyan" style={{ fontSize: '13px' }}>Platform: {annotation.platform}</Tag>
            )}
            {annotation.analysisType && (
              <Tag color="magenta" style={{ fontSize: '13px' }}>Analysis: {annotation.analysisType}</Tag>
            )}
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
                style={{ background: '#fafafa', border: 'none' }}
                bordered={false}
              />
            </div>
          )}
          <p style={{ margin: '0 0 0 0', color: '#888', fontSize: '12px' }}>
            {data.length} categories | Project: {projectId}
          </p>
        </div>
      ) : (
        <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Category Results: {resultName}</h2>
          <p style={{ margin: '0 0 0 0', color: '#666' }}>
            Project: {projectId} | {data.length} categories
          </p>
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
            style={{ marginBottom: '4px', border: 'none' }}
            bordered={false}
          />
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
        {/* Chart Selection Controls - Only in Power User mode */}
        {viewMode === 'power' && (
          <div style={{ marginBottom: '1rem' }}>
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
                <Checkbox value="13">Global Violin Plot</Checkbox>
              </div>
            </Checkbox.Group>
          </div>
        )}

        {/* Charts - Direct rendering based on checkbox selection (Power User mode only) */}
        {viewMode === 'power' && visibleCharts.includes('1') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <Row gutter={16} key={`${projectId}-${resultName}`}>
              <Col xs={24} xl={12}>
                <BMDvsPValueScatter key={`${projectId}-${resultName}-scatter`} />
              </Col>
              <Col xs={24} xl={12}>
                <BMDBoxPlot key={`${projectId}-${resultName}-box`} />
              </Col>
            </Row>
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('2') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <UmapScatterPlot key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('3') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <PathwayCurveViewer key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('4') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <RangePlot key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('5') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <BubbleChart key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('6') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <BestModelsPieChart key={`${projectId}-${resultName}`} projectId={projectId} resultName={resultName} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('7') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <BarCharts key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('8') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <AccumulationCharts key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('9') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <MeanHistograms key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('10') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <MedianHistograms key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('11') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <BMDvsBMDLScatter key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('12') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <ViolinPlotPerCategory key={`${projectId}-${resultName}`} />
          </Card>
        )}

        {viewMode === 'power' && visibleCharts.includes('13') && (
          <Card size="small" style={{ marginBottom: '1rem' }}>
            <GlobalViolinComparison
              key={`${projectId}-${resultName}`}
              projectId={projectId}
              availableResults={availableResults}
              selectedResults={[resultName]}
            />
          </Card>
        )}

        {/* Table */}
        <CategoryResultsGrid key={`${projectId}-${resultName}`} />
      </div>
    </div>
    </>
  );
}
