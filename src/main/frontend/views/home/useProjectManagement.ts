/**
 * Custom hook for managing project state and operations
 *
 * This hook encapsulates all project-related state management,
 * including loading, selecting, deleting projects, and managing
 * category results.
 */

import { useState, useEffect } from 'react';
import { ProjectService, CategoryResultsService } from 'Frontend/generated/endpoints';
import { Notification } from '@vaadin/react-components';
import { UploadBeforeEvent } from '@vaadin/upload';

export interface UseProjectManagementReturn {
  // State
  loadedProjects: string[];
  selectedProject: string | null;
  loading: boolean;
  categoryResults: string[];
  selectedCategoryResult: string | null;

  // Handlers
  handleUpload: (e: UploadBeforeEvent) => Promise<void>;
  handleSelectProject: (projectId: string) => Promise<void>;
  handleDeleteProject: (projectId: string) => Promise<void>;
  setSelectedCategoryResult: (result: string | null) => void;
  loadProjectList: () => Promise<void>;
}

export function useProjectManagement(): UseProjectManagementReturn {
  const [loadedProjects, setLoadedProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryResults, setCategoryResults] = useState<string[]>([]);
  const [selectedCategoryResult, setSelectedCategoryResult] = useState<string | null>(null);

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

  return {
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
  };
}
