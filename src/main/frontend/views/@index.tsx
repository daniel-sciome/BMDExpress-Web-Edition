import { useState, useEffect } from 'react';
import { ProjectService, ConfigService, CategoryResultsService } from 'Frontend/generated/endpoints';
import LibraryView from './LibraryView';
import CategoryResultsView from '../components/CategoryResultsView';
import {
  Button,
  Upload,
  VerticalLayout,
  HorizontalLayout,
  Notification,
  Icon
} from '@vaadin/react-components';
import { UploadBeforeEvent } from '@vaadin/upload';

export default function HomeView() {
  const [viewMode, setViewMode] = useState<'upload' | 'library' | null>(null);
  const [loadedProjects, setLoadedProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [selectedCategoryResult, setSelectedCategoryResult] = useState<string | null>(null);

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

  const loadProjectList = async () => {
    try {
      const projects = await ProjectService.getAllProjectIds();
      // Filter out undefined values
      setLoadedProjects((projects || []).filter((p): p is string => p !== undefined));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleUpload = async (e: UploadBeforeEvent) => {
    const file = e.detail.file;

    // Prevent default upload
    e.preventDefault();

    setLoading(true);

    try {
      // Upload project file
      const projectId = await ProjectService.loadProject(file);

      if (projectId) {
        Notification.show(`Project loaded successfully: ${projectId}`, {
          theme: 'success',
          position: 'top-center',
          duration: 3000
        });

        // Refresh project list
        await loadProjectList();
        setSelectedProject(projectId);
      }
    } catch (error: any) {
      Notification.show(`Failed to load project: ${error.message}`, {
        theme: 'error',
        position: 'top-center',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedCategoryResult(null);

    // Load category results for this project
    try {
      const results = await CategoryResultsService.getCategoryResultNames(projectId);
      setCategoryResults((results || []).filter((r): r is string => r !== undefined));
    } catch (error) {
      console.error('Failed to load category results:', error);
      setCategoryResults([]);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(`Delete project ${projectId}?`)) {
      return;
    }

    try {
      await ProjectService.deleteProject(projectId);
      Notification.show('Project deleted', {
        theme: 'success',
        position: 'top-center',
        duration: 2000
      });

      await loadProjectList();

      if (selectedProject === projectId) {
        setSelectedProject(null);
      }
    } catch (error: any) {
      Notification.show(`Failed to delete project: ${error.message}`, {
        theme: 'error',
        position: 'top-center',
        duration: 5000
      });
    }
  };

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
          <div className="border rounded p-m bg-contrast-5">
            <h2 className="text-xl font-semibold mb-m flex items-center gap-s">
              <Icon icon="vaadin:upload" />
              Load BMD Project
            </h2>

            <p className="text-secondary mb-m">
              Upload a .bm2 project file to begin analysis
            </p>

            <Upload
              accept=".bm2"
              maxFiles={1}
              onUploadBefore={handleUpload}
              style={{ width: '100%' }}
            >
              <Button slot="add-button" theme="primary" disabled={loading}>
                <Icon icon="vaadin:folder-open" slot="prefix" />
                {loading ? 'Loading...' : 'Choose .bm2 File'}
              </Button>
            </Upload>
          </div>

          {/* Projects List */}
          {loadedProjects.length > 0 && (
            <div className="border rounded p-m">
              <h2 className="text-xl font-semibold mb-m flex items-center gap-s">
                <Icon icon="vaadin:folder" />
                Loaded Projects ({loadedProjects.length})
              </h2>

              <div className="space-y-s">
                {loadedProjects.map((projectId) => (
                  <div
                    key={projectId}
                    className={`border rounded p-m flex items-center justify-between cursor-pointer transition-colors ${
                      selectedProject === projectId
                        ? 'bg-primary-10 border-primary'
                        : 'bg-contrast-5 hover:bg-contrast-10'
                    }`}
                    onClick={() => handleSelectProject(projectId)}
                  >
                    <div className="flex items-center gap-m flex-1">
                      <Icon
                        icon={selectedProject === projectId ? "vaadin:check-circle" : "vaadin:circle-thin"}
                        className={selectedProject === projectId ? "text-primary" : "text-secondary"}
                      />
                      <div>
                        <div className="font-semibold">{projectId}</div>
                        <div className="text-s text-secondary">
                          Click to select project
                        </div>
                      </div>
                    </div>

                    <HorizontalLayout theme="spacing-s">
                      <Button
                        theme="icon error tertiary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(projectId);
                        }}
                      >
                        <Icon icon="vaadin:trash" />
                      </Button>
                    </HorizontalLayout>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Project Info */}
          {selectedProject && (
            <div className="border rounded p-m bg-success-10 border-success">
              <h3 className="text-l font-semibold mb-m flex items-center gap-s">
                <Icon icon="vaadin:check" className="text-success" />
                Active Project: {selectedProject}
              </h3>

              {/* Category Results Selector */}
              {categoryResults.length > 0 && (
                <div className="mb-m">
                  <label className="block mb-s font-semibold">
                    Select Category Analysis Results:
                  </label>
                  <select
                    className="w-full p-s border rounded"
                    value={selectedCategoryResult || ''}
                    onChange={(e) => setSelectedCategoryResult(e.target.value || null)}
                  >
                    <option value="">-- Select a category result --</option>
                    {categoryResults.map((result) => (
                      <option key={result} value={result}>
                        {result}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {categoryResults.length === 0 && (
                <p className="text-secondary mb-m">
                  No category analysis results found in this project.
                </p>
              )}

              <HorizontalLayout theme="spacing">
                <Button
                  theme="primary success"
                  disabled={!selectedCategoryResult}
                  onClick={() => {
                    if (selectedCategoryResult) {
                      // View results will be shown below
                    }
                  }}
                >
                  <Icon icon="vaadin:eye" slot="prefix" />
                  View Results
                </Button>
                <Button disabled>
                  <Icon icon="vaadin:play" slot="prefix" />
                  Run Analysis
                </Button>
              </HorizontalLayout>
            </div>
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
          {loadedProjects.length === 0 && (
            <div className="text-center py-xl">
              <Icon
                icon="vaadin:folder-open-o"
                style={{ fontSize: '4rem' }}
                className="text-secondary mb-m"
              />
              <h3 className="text-xl font-semibold mb-s">No Projects Loaded</h3>
              <p className="text-secondary">
                Upload a .bm2 project file to get started
              </p>
            </div>
          )}
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
