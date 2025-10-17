package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing and querying BMD analysis results within projects.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class BmdResultsService {

    private final ProjectService projectService;

    @Autowired
    public BmdResultsService(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Find a specific BMD result by name within a project (package-private, not exposed to browser).
     *
     * @param projectId the project identifier
     * @param bmdResultName the name of the BMD result to find (case-insensitive)
     * @return the BMDResult matching the name
     * @throws IllegalArgumentException if the project or result is not found
     */
    BMDResult findBmdResult(String projectId, String bmdResultName) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getbMDResult() == null) {
            throw new IllegalArgumentException("No BMD results found in project " + projectId);
        }

        return project.getbMDResult().stream()
                .filter(result -> result.getName().equalsIgnoreCase(bmdResultName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "BMDResult not found: " + bmdResultName + " in project " + projectId));
    }

    /**
     * Get the names of all BMD results in a project.
     *
     * @param projectId the project identifier
     * @return list of BMD result names
     * @throws IllegalArgumentException if the project is not found
     */
    public List<String> getBmdResultNames(String projectId) {
        BMDProject project = projectService.getProject(projectId);

        if (project.getbMDResult() == null) {
            return List.of();
        }

        return project.getbMDResult().stream()
                .map(BMDResult::getName)
                .collect(Collectors.toList());
    }
}
