package com.sciome.service;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription;
import com.sciome.dto.ExperimentDescriptionDto;
import com.sciome.dto.ProjectMetadataDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
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

    @Value("${bmdexpress.library.dataPath:classpath:data/bm2}")
    private String libraryDataPath;

    // In-memory project store
    // Maps project ID (UUID) -> ProjectHolder (project + metadata)
    private final Map<String, ProjectHolder> projects = new ConcurrentHashMap<>();

    /**
     * Load .bm2 files from the library directory on startup
     */
    @PostConstruct
    public void loadLibraryProjects() {
        log.info("Loading library projects from: {}", libraryDataPath);

        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            String pattern = libraryDataPath + "/**/*.bm2";
            Resource[] resources = resolver.getResources(pattern);

            log.info("Found {} .bm2 files in library directory", resources.length);

            for (Resource resource : resources) {
                try {
                    String filename = resource.getFilename();
                    if (filename == null) {
                        continue;
                    }

                    log.info("Loading library project: {}", filename);

                    BufferedInputStream bis = new BufferedInputStream(resource.getInputStream(), 1024 * 2000);
                    ObjectInputStream ois = new ObjectInputStream(bis);
                    BMDProject project = (BMDProject) ois.readObject();
                    ois.close();

                    // Use filename (without .bm2 extension) as project ID for library projects
                    String projectId = filename.replace(".bm2", "");
                    ProjectHolder holder = new ProjectHolder(projectId, project, filename, LocalDateTime.now());

                    projects.put(projectId, holder);
                    log.info("Library project loaded: {} (ID: {})", filename, projectId);

                    // Debug: Check if gene data is present in category results
                    if (project.getCategoryAnalysisResults() != null) {
                        for (var catResult : project.getCategoryAnalysisResults()) {
                            String catName = catResult.getName();
                            if (catName != null && catName.contains("GO_BP") && catName.contains("Kidney")) {
                                var results = catResult.getCategoryAnalsyisResults();
                                log.info("[GENE-DEBUG-LOAD] Category: {}", catName);
                                log.info("[GENE-DEBUG-LOAD] Results count: {}", results != null ? results.size() : 0);
                                if (results != null && !results.isEmpty()) {
                                    var firstResult = results.get(0);
                                    var refs = firstResult.getReferenceGeneProbeStatResults();
                                    log.info("[GENE-DEBUG-LOAD] First result refs: {}", refs != null ? refs.size() : "NULL");
                                    if (refs != null && !refs.isEmpty()) {
                                        var firstRef = refs.get(0);
                                        log.info("[GENE-DEBUG-LOAD] First gene: {}",
                                            firstRef.getReferenceGene() != null ? firstRef.getReferenceGene().getId() : "null");
                                    }
                                }
                                break; // Only log one GO_BP Kidney result
                            }
                        }
                    }

                } catch (Exception e) {
                    log.error("Failed to load library project: {}", resource.getFilename(), e);
                }
            }

            log.info("Library initialization complete. {} projects loaded.", projects.size());

        } catch (IOException e) {
            log.error("Failed to scan library directory: {}", libraryDataPath, e);
        }
    }

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
     * Get a project by ID (public for use by skill pipeline, not exposed to browser
     * because BMDProject is not a Hilla-serializable DTO)
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
     * Get comprehensive metadata for a project
     *
     * @param projectId The project ID
     * @return ProjectMetadataDto with all project metadata
     */
    public ProjectMetadataDto getProjectMetadata(String projectId) {
        ProjectHolder holder = getProjectHolder(projectId);
        BMDProject project = holder.getProject();

        ProjectMetadataDto metadata = new ProjectMetadataDto();
        metadata.setProjectId(projectId);
        metadata.setProjectName(project.getName());
        metadata.setOriginalFilename(holder.getOriginalFilename());
        metadata.setUploadedAt(holder.getUploadedAt());

        // Count experiments
        List<DoseResponseExperiment> experiments = project.getDoseResponseExperiments();
        metadata.setExperimentCount(experiments != null ? experiments.size() : 0);

        // Extract metadata from first experiment (if available)
        if (experiments != null && !experiments.isEmpty()) {
            DoseResponseExperiment firstExp = experiments.get(0);
            metadata.setExperimentName(firstExp.getName());

            // Extract experimental description (metadata added in BMDExpress-3)
            ExperimentDescription expDesc = firstExp.getExperimentDescription();
            if (expDesc != null && expDesc.hasDescription()) {
                ExperimentDescriptionDto descDto = ExperimentDescriptionDto.fromDesktopObject(expDesc);
                metadata.setExperimentDescription(descDto);
            }

            // Extract data counts
            if (firstExp.getProbeResponses() != null) {
                metadata.setProbeCount(firstExp.getProbeResponses().size());
            }
            if (firstExp.getTreatments() != null) {
                metadata.setTreatmentCount(firstExp.getTreatments().size());
            }
            metadata.setMinDose(firstExp.getMinDose());
            metadata.setMaxDose(firstExp.getMaxDose());
        }

        // Count analysis results
        if (project.getOneWayANOVAResults() != null) {
            metadata.setAnovaResultsCount(project.getOneWayANOVAResults().size());
        }
        if (project.getWilliamsTrendResults() != null) {
            metadata.setWilliamsTrendResultsCount(project.getWilliamsTrendResults().size());
        }
        if (project.getCurveFitPrefilterResults() != null) {
            metadata.setCurveFitResultsCount(project.getCurveFitPrefilterResults().size());
        }
        if (project.getOriogenResults() != null) {
            metadata.setOriogenResultsCount(project.getOriogenResults().size());
        }
        if (project.getbMDResult() != null) {
            metadata.setBmdResultsCount(project.getbMDResult().size());
        }
        if (project.getCategoryAnalysisResults() != null) {
            metadata.setCategoryResultsCount(project.getCategoryAnalysisResults().size());
        }

        return metadata;
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
