import React, { useEffect } from 'react';
import { Spin, Row, Col } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadCategoryResults } from '../store/slices/categoryResultsSlice';
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

  useEffect(() => {
    if (projectId && resultName) {
      dispatch(loadCategoryResults({ projectId, resultName }));
    }
  }, [dispatch, projectId, resultName]);

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
      <h2 style={{ marginBottom: '0.5rem' }}>Category Results: {resultName}</h2>
      <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
        Project: {projectId} | {data.length} categories
      </p>

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
