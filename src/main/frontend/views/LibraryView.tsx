import { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSelectedCategoryResult } from '../store/slices/navigationSlice';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
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

  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load category results when project changes
  useEffect(() => {
    if (selectedProject) {
      loadCategoryResults(selectedProject);
    } else {
      setCategoryResults([]);
    }
  }, [selectedProject]);

  const loadCategoryResults = async (projectId: string) => {
    try {
      setLoading(true);
      const results = await CategoryResultsService.getCategoryResultNames(projectId);
      const categoryNames = (results || []).filter((r): r is string => r !== undefined);
      setCategoryResults(categoryNames);

      // If we have results but none selected, select the first one
      if (categoryNames.length > 0 && !selectedCategoryResult) {
        dispatch(setSelectedCategoryResult(categoryNames[0]));
      }
    } catch (error) {
      console.error('Failed to load category results:', error);
      setCategoryResults([]);
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
  if (categoryResults.length === 0) {
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

  // Build tab items
  const tabItems = categoryResults.map((resultName) => ({
    key: resultName,
    label: resultName,
    children: (
      <div style={{ padding: '16px' }}>
        <CategoryResultsView
          projectId={selectedProject}
          resultName={resultName}
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

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tabs
          activeKey={selectedCategoryResult || categoryResults[0]}
          onChange={handleTabChange}
          items={tabItems}
          style={{ height: '100%' }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: '24px',
            paddingRight: '24px',
            background: 'white'
          }}
        />
      </div>
    </div>
  );
}
