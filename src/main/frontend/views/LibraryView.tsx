import { useState, useEffect } from 'react';
import { ProjectService, CategoryResultsService } from 'Frontend/generated/endpoints';
import CategoryResultsView from '../components/CategoryResultsView';
import {
  Button,
  VerticalLayout,
  HorizontalLayout,
  Icon
} from '@vaadin/react-components';

/**
 * Library View - Alternative opening view showing existing projects as a library
 * Assumes projects are already loaded/available in the system
 */
export default function LibraryView() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [selectedCategoryResult, setSelectedCategoryResult] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await ProjectService.getAllProjectIds();
      setProjects((projectList || []).filter((p): p is string => p !== undefined));
    } catch (error) {
      console.error('Failed to load projects:', error);
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

  return (
    <div className="p-l flex flex-col h-full">
      {/* Header */}
      <div className="mb-l">
        <h1 className="text-3xl font-bold mb-m flex items-center gap-m">
          <Icon icon="vaadin:book" className="text-primary" />
          BMDExpress Project Library
        </h1>
        <p className="text-secondary">
          Browse and select from available BMD analysis projects
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <VerticalLayout theme="spacing-l">

          {loading && (
            <div className="text-center py-xl">
              <p className="text-secondary">Loading projects...</p>
            </div>
          )}

          {!loading && projects.length === 0 && (
            <div className="text-center py-xl">
              <Icon
                icon="vaadin:archive"
                style={{ fontSize: '4rem' }}
                className="text-secondary mb-m"
              />
              <h3 className="text-xl font-semibold mb-s">No Projects Available</h3>
              <p className="text-secondary mb-m">
                The project library is empty. Projects must be loaded by an administrator.
              </p>
            </div>
          )}

          {!loading && projects.length > 0 && (
            <div className="border rounded p-m">
              <h2 className="text-xl font-semibold mb-m flex items-center gap-s">
                <Icon icon="vaadin:folder" />
                Available Projects ({projects.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-m">
                {projects.map((projectId) => (
                  <div
                    key={projectId}
                    className={`border rounded p-m cursor-pointer transition-all ${
                      selectedProject === projectId
                        ? 'bg-primary-10 border-primary shadow-md'
                        : 'bg-contrast-5 hover:bg-contrast-10 hover:shadow-sm'
                    }`}
                    onClick={() => handleSelectProject(projectId)}
                  >
                    <div className="flex items-start gap-m">
                      <Icon
                        icon={selectedProject === projectId ? "vaadin:check-circle" : "vaadin:circle-thin"}
                        className={`text-xl ${selectedProject === projectId ? "text-primary" : "text-secondary"}`}
                      />
                      <div className="flex-1">
                        <div className="font-semibold mb-xs">{projectId}</div>
                        <div className="text-s text-secondary">
                          Click to open project
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Project Actions */}
          {selectedProject && (
            <div className="border rounded p-m bg-success-10 border-success">
              <h3 className="text-l font-semibold mb-m flex items-center gap-s">
                <Icon icon="vaadin:check" className="text-success" />
                Selected: {selectedProject}
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
        </VerticalLayout>
      </div>

      {/* Footer Info */}
      <div className="mt-l pt-m border-t text-s text-secondary">
        <p>
          Select a project from the library to view results or run additional analyses.
        </p>
      </div>
    </div>
  );
}
