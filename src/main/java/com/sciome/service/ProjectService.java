package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for managing BMDExpress projects (.bm2 files)
 * Provides in-memory storage and deserialization of .bm2 project files
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    // In-memory project store
    // Maps project ID (UUID) -> ProjectHolder (project + metadata)
    private final Map<String, ProjectHolder> projects = new ConcurrentHashMap<>();

    /**
     * Load a .bm2 project file from a MultipartFile and store it in memory
     *
     * @param file .bm2 file uploaded from browser
     * @return Project ID (UUID)
     * @throws IOException if deserialization fails
     * @throws ClassNotFoundException if BMDProject class not found
     */
    public String loadProject(MultipartFile file)
            throws IOException, ClassNotFoundException {

        String filename = file.getOriginalFilename();
        log.info("Loading project from file: {}", filename);

        BufferedInputStream bis = new BufferedInputStream(file.getInputStream(), 1024 * 2000);
        ObjectInputStream ois = new ObjectInputStream(bis);

        BMDProject project = (BMDProject) ois.readObject();
        ois.close();

        String projectId = UUID.randomUUID().toString();
        ProjectHolder holder = new ProjectHolder(projectId, project, filename, LocalDateTime.now());

        projects.put(projectId, holder);

        log.info("Project loaded successfully: {} (ID: {})", filename, projectId);

        return projectId;
    }

    /**
     * Get a project by ID (package-private, not exposed to browser)
     *
     * @param projectId The project ID
     * @return The BMDProject
     * @throws IllegalArgumentException if project not found
     */
    BMDProject getProject(String projectId) {
        ProjectHolder holder = projects.get(projectId);
        if (holder == null) {
            throw new IllegalArgumentException("Project not found: " + projectId);
        }
        return holder.getProject();
    }

    /**
     * Get project holder (with metadata, package-private, not exposed to browser)
     *
     * @param projectId The project ID
     * @return ProjectHolder with project and metadata
     * @throws IllegalArgumentException if project not found
     */
    ProjectHolder getProjectHolder(String projectId) {
        ProjectHolder holder = projects.get(projectId);
        if (holder == null) {
            throw new IllegalArgumentException("Project not found: " + projectId);
        }
        return holder;
    }

    /**
     * Check if project exists
     *
     * @param projectId The project ID
     * @return true if project exists
     */
    public boolean projectExists(String projectId) {
        return projects.containsKey(projectId);
    }

    /**
     * Get all loaded project IDs
     *
     * @return List of project IDs
     */
    public List<String> getAllProjectIds() {
        return projects.keySet().stream()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Remove a project from memory
     *
     * @param projectId The project ID
     */
    public void deleteProject(String projectId) {
        ProjectHolder holder = projects.remove(projectId);
        if (holder != null) {
            log.info("Project deleted: {} (ID: {})", holder.getOriginalFilename(), projectId);
        }
    }

    /**
     * Holder class for project + metadata
     * Stores the BMDProject along with upload metadata
     */
    public static class ProjectHolder {
        private final String projectId;
        private final BMDProject project;
        private final String originalFilename;
        private final LocalDateTime uploadedAt;

        public ProjectHolder(String projectId, BMDProject project,
                           String originalFilename, LocalDateTime uploadedAt) {
            this.projectId = projectId;
            this.project = project;
            this.originalFilename = originalFilename;
            this.uploadedAt = uploadedAt;
        }

        public String getProjectId() {
            return projectId;
        }

        public BMDProject getProject() {
            return project;
        }

        public String getOriginalFilename() {
            return originalFilename;
        }

        public LocalDateTime getUploadedAt() {
            return uploadedAt;
        }
    }
}
