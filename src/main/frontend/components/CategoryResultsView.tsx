import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Tag, Collapse, Checkbox } from 'antd';
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

export default function CategoryResultsView({ projectId, resultName }: CategoryResultsViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error, data } = useAppSelector((state) => state.categoryResults);
  const [annotation, setAnnotation] = useState<AnalysisAnnotationDto | null>(null);
  const [availableResults, setAvailableResults] = useState<string[]>([]);
  const [visibleCharts, setVisibleCharts] = useState(['1']); // Default Charts visible by default

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
    <>
      <style>
        {`
          .ant-tabs-content,
          .ant-tabs-content-holder,
          .ant-tabs-tabpane {
            height: 100%;
          }
        `}
      </style>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Formatted header with annotation metadata */}
      {annotation && annotation.parseSuccess ? (
        <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
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
        <div style={{ padding: '1rem 1rem 0 1rem', flexShrink: 0 }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Category Results: {resultName}</h2>
          <p style={{ margin: '0 0 0 0', color: '#666' }}>
            Project: {projectId} | {data.length} categories
          </p>
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
        {/* Charts Collection */}
        <div style={{
          marginBottom: '1.5rem',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          padding: '12px'
        }}>
          {/* Chart Visibility Controls */}
          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600, color: '#000' }}>Select Charts to Display:</div>
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <Checkbox.Group
                value={visibleCharts}
                onChange={setVisibleCharts}
              >
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', minWidth: 'max-content' }}>
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
                  <Checkbox value="14">Venn Diagram</Checkbox>
                </div>
              </Checkbox.Group>
            </div>
          </div>

          {/* Chart Panels - Only render checked charts */}
          <Collapse
            items={[
              visibleCharts.includes('1') && {
                key: '1',
                label: 'Default Charts',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} xl={12}>
                      <BMDvsPValueScatter />
                    </Col>
                    <Col xs={24} xl={12}>
                      <BMDBoxPlot />
                    </Col>
                  </Row>
                ),
              },
              visibleCharts.includes('2') && {
                key: '2',
                label: 'UMAP Semantic Space',
                children: <UmapScatterPlot />,
              },
              visibleCharts.includes('3') && {
                key: '3',
                label: 'Curve Overlay',
                children: <PathwayCurveViewer projectId={projectId} resultName={resultName} />,
              },
              visibleCharts.includes('4') && {
                key: '4',
                label: 'Range Plot',
                children: <RangePlot />,
              },
              visibleCharts.includes('5') && {
                key: '5',
                label: 'Bubble Chart',
                children: <BubbleChart />,
              },
              visibleCharts.includes('6') && {
                key: '6',
                label: 'Best Models Pie Chart',
                children: <BestModelsPieChart projectId={projectId} resultName={resultName} />,
              },
              visibleCharts.includes('7') && {
                key: '7',
                label: 'BMD and BMDL Bar Charts',
                children: <BarCharts />,
              },
              visibleCharts.includes('8') && {
                key: '8',
                label: 'Accumulation Charts',
                children: <AccumulationCharts />,
              },
              visibleCharts.includes('9') && {
                key: '9',
                label: 'Mean Histograms',
                children: (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Mean Histograms - Coming Soon
                  </div>
                ),
              },
              visibleCharts.includes('10') && {
                key: '10',
                label: 'Median Histograms',
                children: (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Median Histograms - Coming Soon
                  </div>
                ),
              },
              visibleCharts.includes('11') && {
                key: '11',
                label: 'BMD vs BMDL Scatter Plots',
                children: (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    BMD vs BMDL Scatter Plots - Coming Soon
                  </div>
                ),
              },
              visibleCharts.includes('12') && {
                key: '12',
                label: 'Violin Plot Per Category',
                children: (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Violin Plot Per Category - Coming Soon
                  </div>
                ),
              },
              visibleCharts.includes('13') && {
                key: '13',
                label: 'Global Violin Plot',
                children: (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                    Global Violin Plot - Coming Soon
                  </div>
                ),
              },
              visibleCharts.includes('14') && {
                key: '14',
                label: 'Venn Diagram',
                children: <VennDiagram projectId={projectId} availableResults={availableResults} />,
              },
            ].filter(Boolean)}
          />
        </div>

        {/* Table */}
        <CategoryResultsGrid />
      </div>
    </div>
    </>
  );
}
