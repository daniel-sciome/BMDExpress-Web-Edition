import React, { useEffect, useState } from 'react';
import { Spin, Row, Col, Tag } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResults } from '../store/slices/categoryResultsSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsGrid from './CategoryResultsGrid';
import BMDvsPValueScatter from './charts/BMDvsPValueScatter';
import BMDBoxPlot from './charts/BMDBoxPlot';

interface CategoryResultsViewProps {
  projectId: string;
  resultName: string;
}

export default function CategoryResultsView({ projectId, resultName }: CategoryResultsViewProps) {
  const dispatch = useAppDispatch();
  const { loading, error, data } = useAppSelector((state) => state.categoryResults);
  const [annotation, setAnnotation] = useState<AnalysisAnnotationDto | null>(null);

  useEffect(() => {
    if (projectId && resultName) {
      dispatch(loadCategoryResults({ projectId, resultName }));
      loadAnnotation();
    }
  }, [dispatch, projectId, resultName]);

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
    <div style={{ height: '100%', padding: '1rem' }}>
      {/* Formatted header with annotation metadata */}
      {annotation && annotation.parseSuccess ? (
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{annotation.displayName}</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {annotation.chemical && (
              <Tag color="blue" style={{ fontSize: '13px' }}>Chemical: {annotation.chemical}</Tag>
            )}
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
          <p style={{ margin: '0 0 0 0', color: '#888', fontSize: '12px' }}>
            {data.length} categories | Project: {projectId}
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Category Results: {resultName}</h2>
          <p style={{ margin: '0 0 0 0', color: '#666' }}>
            Project: {projectId} | {data.length} categories
          </p>
        </div>
      )}

      {/* Table with category results */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CategoryResultsGrid />
      </div>

      {/* Charts in responsive grid */}
      <Row gutter={16}>
        <Col xs={24} xl={12}>
          <BMDvsPValueScatter />
        </Col>
        <Col xs={24} xl={12}>
          <BMDBoxPlot />
        </Col>
      </Row>
    </div>
  );
}
