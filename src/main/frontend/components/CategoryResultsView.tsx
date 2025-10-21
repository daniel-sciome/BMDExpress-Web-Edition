import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Tag, Select, Card } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResults } from '../store/slices/categoryResultsSlice';
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
import VennDiagram from './charts/VennDiagram';
import UmapScatterPlot from './charts/UmapScatterPlot';

interface CategoryResultsViewProps {
  projectId: string;
  resultName: string;
}

// Chart type constants - matching BMDExpress-3 desktop app
const CHART_TYPES = {
  DEFAULT: 'Default Charts',
  UMAP_SEMANTIC: 'UMAP Semantic Space',
  CURVE_OVERLAY: 'Curve Overlay',
  RANGE_PLOT: 'Range Plot',
  BUBBLE_CHART: 'Bubble Chart',
  BMD_BMDL_BARCHARTS: 'BMD and BMDL Bar Charts',
  ACCUMULATION_CHARTS: 'Accumulation Charts',
  BEST_MODEL_PIE: 'Best Models Pie Chart',
  MEAN_HISTOGRAMS: 'Mean Histograms',
  MEDIAN_HISTOGRAMS: 'Median Histograms',
  BMD_BMDL_SCATTER: 'BMD vs BMDL Scatter Plots',
  VIOLIN: 'Violin Plot Per Category',
  VIOLIN_PLOT_DATASET: 'Global Violin Plot',
  VENN_DIAGRAM: 'Venn Diagram',
} as const;

export default function CategoryResultsView({ projectId, resultName }: CategoryResultsViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error, data } = useAppSelector((state) => state.categoryResults);
  const [annotation, setAnnotation] = useState<AnalysisAnnotationDto | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<string>(CHART_TYPES.DEFAULT);
  const [availableResults, setAvailableResults] = useState<string[]>([]);

  useEffect(() => {
    if (projectId && resultName) {
      dispatch(loadCategoryResults({ projectId, resultName }));
      loadAnnotation();
      loadAvailableResults();
    }
  }, [dispatch, projectId, resultName]);

  const loadAvailableResults = async () => {
    try {
      const results = await CategoryResultsService.getCategoryResultNames(projectId);
      if (results && Array.isArray(results)) {
        setAvailableResults(results.filter((r): r is string => typeof r === 'string'));
      }
    } catch (err) {
      console.error('Failed to load available results:', err);
    }
  };

  const loadAnnotation = async () => {
    try {
      const ann = await CategoryResultsService.getCategoryResultAnnotation(projectId, resultName);
      setAnnotation(ann || null);
    } catch (error) {
      console.error('Failed to load annotation:', error);
      setAnnotation(null);
    }
  };

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      {/* Formatted header with annotation metadata */}
      {annotation && annotation.parseSuccess ? (
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{annotation.chemical || 'Unknown Chemical'}</h2>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 'normal', color: '#666' }}>{annotation.displayName}</h3>
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
            <Tag color="geekblue" style={{ fontSize: '13px' }}>
              Analysis Parameters: curvefitprefilter_foldfilter1.25_BMD_S1500_Plus_Rat_GO_BP_true_rsquared0.6_ratio10_conf0.5
            </Tag>
          </div>
          <p style={{ margin: '0 0 0 0', color: '#888', fontSize: '12px' }}>
            {data.length} categories | Project: {projectId}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Category Results: {resultName}</h2>
          <p style={{ margin: '0 0 0 0', color: '#666' }}>
            Project: {projectId} | {data.length} categories
          </p>
        </div>
      )}

      {/* Charts in scrolling container */}
      <Card
        title="Visualizations"
        style={{ marginBottom: '1.5rem' }}
        extra={
          <Select
            value={selectedChartType}
            onChange={setSelectedChartType}
            style={{ width: 250 }}
            options={Object.values(CHART_TYPES).map(type => ({
              label: type,
              value: type,
            }))}
          />
        }
      >
        <div style={{
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {/* Render selected chart(s) */}
          {selectedChartType === CHART_TYPES.DEFAULT && (
            <Row gutter={16}>
              <Col xs={24} xl={12}>
                <BMDvsPValueScatter />
              </Col>
              <Col xs={24} xl={12}>
                <BMDBoxPlot />
              </Col>
            </Row>
          )}

          {selectedChartType === CHART_TYPES.UMAP_SEMANTIC && <UmapScatterPlot />}

          {selectedChartType === CHART_TYPES.CURVE_OVERLAY && (
            <PathwayCurveViewer projectId={projectId} resultName={resultName} />
          )}

          {selectedChartType === CHART_TYPES.RANGE_PLOT && <RangePlot />}

          {selectedChartType === CHART_TYPES.BUBBLE_CHART && <BubbleChart />}

          {selectedChartType === CHART_TYPES.BEST_MODEL_PIE && (
            <BestModelsPieChart projectId={projectId} resultName={resultName} />
          )}

          {selectedChartType === CHART_TYPES.BMD_BMDL_BARCHARTS && <BarCharts />}

          {selectedChartType === CHART_TYPES.ACCUMULATION_CHARTS && <AccumulationCharts />}

          {selectedChartType === CHART_TYPES.MEAN_HISTOGRAMS && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Mean Histograms - Coming Soon
            </div>
          )}

          {selectedChartType === CHART_TYPES.MEDIAN_HISTOGRAMS && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Median Histograms - Coming Soon
            </div>
          )}

          {selectedChartType === CHART_TYPES.BMD_BMDL_SCATTER && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              BMD vs BMDL Scatter Plots - Coming Soon
            </div>
          )}

          {selectedChartType === CHART_TYPES.VIOLIN && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Violin Plot Per Category - Coming Soon
            </div>
          )}

          {selectedChartType === CHART_TYPES.VIOLIN_PLOT_DATASET && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Global Violin Plot - Coming Soon
            </div>
          )}

          {selectedChartType === CHART_TYPES.VENN_DIAGRAM && (
            <VennDiagram projectId={projectId} availableResults={availableResults} />
          )}
        </div>
      </Card>

      {/* Table at the bottom */}
      <div style={{ flexShrink: 0 }}>
        <CategoryResultsGrid />
      </div>
    </div>
  );
}
