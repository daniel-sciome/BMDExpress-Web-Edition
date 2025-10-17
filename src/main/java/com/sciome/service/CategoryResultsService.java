package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.dto.CategoryAnalysisResultDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing and querying category analysis results within projects.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class CategoryResultsService {

    private final ProjectService projectService;

    @Autowired
    public CategoryResultsService(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Find a specific category analysis result by name within a project (package-private, not exposed to browser).
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result to find (case-insensitive)
     * @return the CategoryAnalysisResults matching the name
     * @throws IllegalArgumentException if the project or result is not found
     */
    CategoryAnalysisResults findCategoryResult(String projectId, String categoryResultName) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getCategoryAnalysisResults() == null) {
            throw new IllegalArgumentException("No category analysis results found in project " + projectId);
        }

        return project.getCategoryAnalysisResults().stream()
                .filter(result -> result.getName().equalsIgnoreCase(categoryResultName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Category analysis result not found: " + categoryResultName + " in project " + projectId));
    }

    /**
     * Get the names of all category analysis results in a project.
     *
     * @param projectId the project identifier
     * @return list of category analysis result names
     * @throws IllegalArgumentException if the project is not found
     */
    public List<String> getCategoryResultNames(String projectId) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getCategoryAnalysisResults() == null) {
            return List.of();
        }

        return project.getCategoryAnalysisResults().stream()
                .map(CategoryAnalysisResults::getName)
                .collect(Collectors.toList());
    }

    /**
     * Get category analysis results (converted to DTOs for browser consumption).
     *
     * @param projectId the project identifier
     * @param categoryResultName the name of the category result to retrieve
     * @return list of category analysis result DTOs
     * @throws IllegalArgumentException if the project or result is not found
     */
    public List<CategoryAnalysisResultDto> getCategoryResults(String projectId, String categoryResultName) {
        // Use package-private helper to get the desktop app object
        CategoryAnalysisResults categoryResults = findCategoryResult(projectId, categoryResultName);

        if (categoryResults.getCategoryAnalsyisResults() == null) {
            return List.of();
        }

        // Convert desktop app objects to DTOs for Hilla
        return categoryResults.getCategoryAnalsyisResults().stream()
                .map(CategoryAnalysisResultDto::fromDesktopObject)
                .collect(Collectors.toList());
    }
}
