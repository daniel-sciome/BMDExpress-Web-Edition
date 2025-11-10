import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { CategoryResultsService } from 'Frontend/generated/endpoints';
import type AnalysisAnnotationDto from 'Frontend/generated/com/sciome/dto/AnalysisAnnotationDto';
import CategoryResultsView from '../components/CategoryResultsView';
import CategoryAnalysisMultisetView from './CategoryAnalysisMultisetView';
import { Icon } from '@vaadin/react-components';

/**
 * Library View - Displays category results based on sidebar selection
 * Directly shows the selected result without tabs (navigation handled by sidebar tree)
 */
export default function LibraryView() {
  const selectedProject = useAppSelector((state) => state.navigation.selectedProject);
  const selectedAnalysisType = useAppSelector((state) => state.navigation.selectedAnalysisType);
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
      // No auto-selection - require explicit user clicks
    } catch (error) {
      console.error('Failed to load category results:', error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
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

  // Analysis type selected (multi-set view)
  if (selectedAnalysisType && !selectedCategoryResult) {
    return (
      <CategoryAnalysisMultisetView
        projectId={selectedProject}
        analysisType={selectedAnalysisType}
      />
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

  // Project selected but nothing specific chosen yet
  if (!selectedAnalysisType && !selectedCategoryResult) {
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

    // Show prompt to select an analysis type or individual result
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
          <Icon
            icon="vaadin:sitemap"
            style={{ fontSize: '4rem', color: '#1890ff' }}
            className="mb-m"
          />
          <h2 className="text-2xl font-bold mb-m">
            Project: {selectedProject}
          </h2>
          <p className="text-secondary text-l mb-m">
            Select an item from the sidebar to view analysis results:
          </p>
          <div style={{ textAlign: 'left', display: 'inline-block' }}>
            <p className="text-secondary">
              <strong>📂 Analysis Type Groups</strong> - Click to compare multiple results
              <br />
              (e.g., "GO Biological Process")
            </p>
            <p className="text-secondary mt-m">
              <strong>📊 Individual Results</strong> - Click to analyze a single dataset
              <br />
              (e.g., "Aflatoxin_Female_Liver_GO_BP")
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Individual category result selected - show directly (no tabs needed, sidebar handles navigation)
  if (selectedCategoryResult) {
    return (
      <div className="h-full">
        <CategoryResultsView
          projectId={selectedProject}
          resultName={selectedCategoryResult}
        />
      </div>
    );
  }

  // Project selected but no specific result - this should not happen with current navigation
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center" style={{ maxWidth: '600px', padding: '2rem' }}>
        <Icon
          icon="vaadin:folder-open"
          style={{ fontSize: '4rem', color: '#1890ff' }}
          className="mb-m"
        />
        <h2 className="text-2xl font-bold mb-m">
          Project: {selectedProject}
        </h2>
        <p className="text-secondary text-l">
          Select a category analysis result from the sidebar.
        </p>
      </div>
    </div>
  );
}
