import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsView from '../components/CategoryResultsView';
import { Icon } from '@vaadin/react-components';

/**
 * Library View - Displays category results based on sidebar selection
 * Shows tabs for all category results in the selected project
 */
export default function LibraryView() {
  const dispatch = useAppDispatch();
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedCategoryResult = useAppSelector((state) => state.navigation.selectedCategoryResult);

  const [annotations, setAnnotations] = useState<AnalysisAnnotationDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Load category results when project changes
  useEffect(() => {
    if (selectedProject) {
      loadCategoryResults(selectedProject);
    } else {
      setAnnotations([]);
    }
  }, [selectedProject]);

  const loadCategoryResults = async (projectId: string) => {
    try {
      setLoading(true);
      const annotationList = await CategoryResultsService.getAllCategoryResultAnnotations(projectId);
      const validAnnotations = (annotationList || []).filter((a): a is AnalysisAnnotationDto => a !== undefined);
      setAnnotations(validAnnotations);

      // If we have results but none selected, select the first one
      if (validAnnotations.length > 0 && !selectedCategoryResult) {
        dispatch(setSelectedCategoryResult(validAnnotations[0].fullName || ''));
      }
    } catch (error) {
      console.error('Failed to load category results:', error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (activeKey: string) => {
    dispatch(setSelectedCategoryResult(activeKey));
  };

  // No selection - show welcome message
  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon
            icon="vaadin:book"
            style={{ fontSize: '4rem', color: '#1890ff' }}
            className="mb-m"
          />
          <h1 className="text-3xl font-bold mb-m">
            Welcome to BMDExpress Web
          </h1>
          <p className="text-secondary text-l">
            Select a project from the sidebar to get started.
          </p>
          <p className="text-secondary mt-m">
            Expand a project to view and analyze category results.
          </p>
        </div>
      </div>
    );
  }

  // Project selected but loading category results
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ padding: '2rem' }}>
          <p className="text-secondary text-l">Loading category results...</p>
        </div>
      </div>
    );
  }

  // Project selected but no category results found
  if (annotations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon
            icon="vaadin:folder-open"
            style={{ fontSize: '4rem', color: '#faad14' }}
            className="mb-m"
          />
          <h2 className="text-2xl font-bold mb-m">
            Project: {selectedProject}
          </h2>
          <p className="text-secondary text-l">
            No category analysis results found in this project.
          </p>
        </div>
      </div>
    );
  }

  // Build tab items using annotations
  const tabItems = annotations.map((annotation) => ({
    key: annotation.fullName || '',
    label: annotation.parseSuccess && annotation.displayName ? annotation.displayName : annotation.fullName,
    children: (
      <div style={{ height: '100%' }}>
        <CategoryResultsView
          projectId={selectedProject}
          resultName={annotation.fullName || ''}
        />
      </div>
    ),
  }));

  // Project and category results available - show tabs
  return (
    <div className="h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '16px 24px 0 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <h2 className="text-xl font-semibold mb-s flex items-center gap-s">
          <Icon icon="vaadin:folder-open" style={{ color: '#1890ff' }} />
          {selectedProject}
        </h2>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          activeKey={selectedCategoryResult || annotations[0]?.fullName || ''}
          onChange={handleTabChange}
          items={tabItems}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: '24px',
            paddingRight: '24px',
            background: 'white',
            flexShrink: 0
          }}
        />
      </div>
    </div>
  );
}
