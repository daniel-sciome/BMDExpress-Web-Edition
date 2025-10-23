import { useState, useEffect } from 'react';
import { ConfigService } from 'Frontend/generated/endpoints';
import LibraryView from './LibraryView';
import CategoryResultsView from '../components/CategoryResultsView';
import UploadSection from './home/UploadSection';
import ProjectsList from './home/ProjectsList';
import SelectedProjectInfo from './home/SelectedProjectInfo';
import EmptyState from './home/EmptyState';
import { useProjectManagement } from './home/useProjectManagement';
import {
  VerticalLayout,
  Icon
} from '@vaadin/react-components';

export default function HomeView() {
  const [viewMode, setViewMode] = useState<'upload' | 'library' | null>(null);

  // Use custom hook for project management
  const {
    loadedProjects,
    selectedProject,
    loading,
    categoryResults,
    selectedCategoryResult,
    handleUpload,
    handleSelectProject,
    handleDeleteProject,
    setSelectedCategoryResult,
    loadProjectList,
  } = useProjectManagement();

  // Load opening view configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const openingView = await ConfigService.getOpeningView();
        setViewMode(openingView as 'upload' | 'library');
      } catch (error) {
        console.error('Failed to load config, defaulting to upload view:', error);
        setViewMode('upload');
      }
    };
    loadConfig();
  }, []);

  // Load list of existing projects on mount
  useEffect(() => {
    if (viewMode === 'upload') {
      loadProjectList();
    }
  }, [viewMode]);

  // Show library view if configured
  if (viewMode === 'library') {
    return <LibraryView />;
  }

  // Show loading while determining view mode
  if (viewMode === null) {
    return (
      <div className="p-l flex items-center justify-center h-full">
        <div className="text-center">
          <Icon icon="vaadin:spinner" className="animate-spin text-4xl text-primary mb-m" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Default upload view
  return (
    <div className="p-l flex flex-col h-full">
      {/* Header */}
      <div className="mb-l">
        <h1 className="text-3xl font-bold mb-m flex items-center gap-m">
          <Icon icon="vaadin:chart-line" className="text-primary" />
          BMDExpress Web
        </h1>
        <p className="text-secondary">
          Benchmark Dose Analysis and Functional Classification
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <VerticalLayout theme="spacing-l">

          {/* Upload Section */}
          <UploadSection loading={loading} onUpload={handleUpload} />

          {/* Projects List */}
          <ProjectsList
            projects={loadedProjects}
            selectedProject={selectedProject}
            onSelectProject={handleSelectProject}
            onDeleteProject={handleDeleteProject}
          />

          {/* Selected Project Info */}
          {selectedProject && (
            <SelectedProjectInfo
              projectId={selectedProject}
              categoryResults={categoryResults}
              selectedCategoryResult={selectedCategoryResult}
              onSelectCategoryResult={setSelectedCategoryResult}
            />
          )}

          {/* Category Results View */}
          {selectedProject && selectedCategoryResult && (
            <div className="border rounded p-m" style={{ minHeight: '600px' }}>
              <CategoryResultsView
                projectId={selectedProject}
                resultName={selectedCategoryResult}
              />
            </div>
          )}

          {/* Empty State */}
          {loadedProjects.length === 0 && <EmptyState />}

        </VerticalLayout>
      </div>

      {/* Footer Info */}
      <div className="mt-l pt-m border-t text-s text-secondary">
        <p>
          BMDExpress Web provides benchmark dose analysis and functional classification
          for toxicogenomics data. Load a project file to begin.
        </p>
      </div>
    </div>
  );
}
