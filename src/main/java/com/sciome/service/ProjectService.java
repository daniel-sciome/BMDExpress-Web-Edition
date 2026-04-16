// ============================================================================
// ProjectService.java — Project lifecycle manager for BMDExpress Web Edition
// ============================================================================
// Purpose:
//   Manages .bm2 project files: scanning the library directory, deserializing
//   projects on demand, and providing access to project data for other services.
//
// Architecture:
//   - At startup (@PostConstruct), only scans the library directory for .bm2
//     filenames. No deserialization happens — this keeps startup fast even with
//     dozens of large files.
//   - When a project is actually selected/accessed, it's deserialized on demand
//     (lazy loading). This means only the actively-used project lives in memory.
//   - A simple eviction policy unloads previously loaded library projects when
//     a new one is loaded, bounding memory to roughly one project at a time.
//   - User-uploaded projects (via the upload endpoint) are always kept in memory
//     for the duration of the session, since they have no backing file on disk.
//
// Key consumers:
//   - ProjectTreeSidebar.tsx calls getAllProjectIds() for the sidebar list
//   - CategoryResultsService, BmdResultsService, PrefilterService call
//     getProject() when the user interacts with a specific project
//   - ProjectTreeSidebar.tsx calls getProjectMetadata() when expanding a
//     project's collapse panel
// ============================================================================

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
import java.net.URI;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service for managing BMDExpress projects (.bm2 files).
 *
 * Uses lazy loading: at startup, only filenames are scanned from the library
 * directory. The actual deserialization of a .bm2 file (which can be hundreds
 * of MB) happens on demand when a user selects that project. Previously loaded
 * library projects are evicted to keep memory bounded.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    // --- Configuration ---

    // The path to the library directory containing .bm2 files.
    // Can be a classpath: or file: URI. Configured via application.properties
    // or overridden in bmdexpress-web.conf via APP_OPTS.
    @Value("${bmdexpress.library.dataPath:classpath:data/bm2}")
    private String libraryDataPath;

    // --- In-memory state ---

    // Maps project ID -> ProjectHolder for ALL known projects (both library
    // and user-uploaded). Library projects start with project=null (not yet
    // deserialized) and get populated on first access.
    private final Map<String, ProjectHolder> projects = new ConcurrentHashMap<>();

    // Tracks which library project is currently loaded in memory, so we can
    // evict it when a different one is requested. Only one library project
    // is kept in memory at a time to bound heap usage. User-uploaded projects
    // are exempt from eviction (they have no backing file to reload from).
    private volatile String currentlyLoadedLibraryProjectId = null;

    // ========================================================================
    // Startup — scan library directory for .bm2 filenames (no deserialization)
    // ========================================================================

    /**
     * Scans the library directory for .bm2 files and registers them as
     * unloaded project stubs. Only filenames and file paths are recorded —
     * no deserialization happens here, so startup is fast regardless of how
     * many or how large the .bm2 files are.
     */
    @PostConstruct
    public void loadLibraryProjects() {
        log.info("Scanning library directory for .bm2 files: {}", libraryDataPath);

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

                    // Use filename (without .bm2 extension) as the project ID
                    // for library projects, so the sidebar shows human-readable names
                    String projectId = filename.replace(".bm2", "");

                    // Resolve the filesystem path for later on-demand loading.
                    // For file: URIs this gives us the absolute path; for classpath:
                    // resources we fall back to the URI string.
                    String resourcePath;
                    try {
                        URI uri = resource.getURI();
                        resourcePath = uri.toString();
                    } catch (IOException e) {
                        log.warn("Could not resolve URI for {}, skipping", filename);
                        continue;
                    }

                    // Create an unloaded holder — project field is null until
                    // the user actually selects this project
                    ProjectHolder holder = new ProjectHolder(
                        projectId, null, filename, LocalDateTime.now(),
                        true,          // isLibraryProject = true
                        resourcePath   // path to the .bm2 file for lazy loading
                    );

                    projects.put(projectId, holder);
                    log.info("Registered library project: {} (ID: {})", filename, projectId);

                } catch (Exception e) {
                    log.error("Failed to register library project: {}", resource.getFilename(), e);
                }
            }

            log.info("Library scan complete. {} projects registered (none loaded into memory yet).",
                     projects.size());

        } catch (IOException e) {
            log.error("Failed to scan library directory: {}", libraryDataPath, e);
        }
    }

    // ========================================================================
    // Lazy loading — deserialize a .bm2 file on demand
    // ========================================================================

    /**
     * Ensures the given project's BMDProject is loaded into memory. For library
     * projects, this deserializes the .bm2 file from disk (and evicts any
     * previously loaded library project to save memory). For user-uploaded
     * projects, this is a no-op since they're always in memory.
     *
     * @param projectId the project to ensure is loaded
     * @throws IllegalArgumentException if the project ID is unknown
     * @throws RuntimeException if deserialization fails
     */
    private synchronized void ensureLoaded(String projectId) {
        ProjectHolder holder = projects.get(projectId);
        if (holder == null) {
            throw new IllegalArgumentException("Project not found: " + projectId);
        }

        // Already loaded — nothing to do
        if (holder.getProject() != null) {
            return;
        }

        // Only library projects can be in an unloaded state (user uploads are
        // always in memory). Deserialize from the stored file path.
        if (!holder.isLibraryProject() || holder.getResourcePath() == null) {
            throw new IllegalStateException(
                "Project " + projectId + " has no backing file and no in-memory data");
        }

        // Evict the previously loaded library project to free memory before
        // we load the new one. This keeps heap usage bounded to roughly one
        // deserialized project at a time.
        evictCurrentLibraryProject(projectId);

        log.info("Lazy-loading library project: {} from {}", projectId, holder.getResourcePath());
        long startTime = System.currentTimeMillis();

        try {
            // Use Spring's resource resolver to handle both file: and classpath: URIs
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource resource = resolver.getResource(holder.getResourcePath());

            BufferedInputStream bis = new BufferedInputStream(resource.getInputStream(), 1024 * 2000);
            ObjectInputStream ois = new ObjectInputStream(bis);
            BMDProject project = (BMDProject) ois.readObject();
            ois.close();

            // Store the deserialized project back into the holder
            holder.setProject(project);
            currentlyLoadedLibraryProjectId = projectId;

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Library project loaded: {} ({} ms)", projectId, elapsed);

        } catch (Exception e) {
            log.error("Failed to deserialize library project: {}", projectId, e);
            throw new RuntimeException("Failed to load project " + projectId + ": " + e.getMessage(), e);
        }
    }

    /**
     * Evicts the currently loaded library project from memory (sets its
     * BMDProject reference to null). This allows the garbage collector to
     * reclaim the memory before we load a new project.
     *
     * Does nothing if:
     *   - No library project is currently loaded
     *   - The currently loaded project is the same as the one being requested
     *     (no need to evict and immediately reload)
     *
     * @param incomingProjectId the project about to be loaded (to avoid
     *                          evicting itself)
     */
    private void evictCurrentLibraryProject(String incomingProjectId) {
        String currentId = currentlyLoadedLibraryProjectId;
        if (currentId == null || currentId.equals(incomingProjectId)) {
            return;
        }

        ProjectHolder currentHolder = projects.get(currentId);
        if (currentHolder != null && currentHolder.isLibraryProject()) {
            log.info("Evicting library project from memory: {}", currentId);
            currentHolder.setProject(null);
            currentlyLoadedLibraryProjectId = null;
        }
    }

    // ========================================================================
    // User upload — deserialize immediately and keep in memory
    // ========================================================================

    /**
     * Load a .bm2 project file from a browser upload and store it in memory.
     * User-uploaded projects are NOT subject to eviction — they stay in memory
     * for the session lifetime because there's no backing file to reload from.
     *
     * @param file .bm2 file uploaded from browser
     * @return Project ID (UUID)
     * @throws IOException if deserialization fails
     * @throws ClassNotFoundException if BMDProject class not found
     */
    public String loadProject(MultipartFile file)
            throws IOException, ClassNotFoundException {

        String filename = file.getOriginalFilename();
        log.info("Loading uploaded project from file: {}", filename);

        BufferedInputStream bis = new BufferedInputStream(file.getInputStream(), 1024 * 2000);
        ObjectInputStream ois = new ObjectInputStream(bis);

        BMDProject project = (BMDProject) ois.readObject();
        ois.close();

        String projectId = UUID.randomUUID().toString();
        // isLibraryProject=false, resourcePath=null — uploaded projects can't be evicted/reloaded
        ProjectHolder holder = new ProjectHolder(
            projectId, project, filename, LocalDateTime.now(),
            false, null
        );

        projects.put(projectId, holder);

        log.info("Uploaded project loaded: {} (ID: {})", filename, projectId);

        return projectId;
    }

    // ========================================================================
    // Accessors — used by other services (CategoryResultsService, etc.)
    // ========================================================================

    /**
     * Get a project by ID. Triggers lazy loading if the project hasn't been
     * deserialized yet. This is the main entry point for other services that
     * need the full BMDProject object graph.
     *
     * Package-private because BMDProject is not Hilla-serializable — only
     * other Java services should call this, not the browser.
     *
     * @param projectId The project ID
     * @return The BMDProject (never null)
     * @throws IllegalArgumentException if project not found
     */
    BMDProject getProject(String projectId) {
        ensureLoaded(projectId);
        ProjectHolder holder = projects.get(projectId);
        return holder.getProject();
    }

    /**
     * Get project holder with metadata (package-private, not exposed to browser).
     * Triggers lazy loading.
     *
     * @param projectId The project ID
     * @return ProjectHolder with project and metadata
     * @throws IllegalArgumentException if project not found
     */
    ProjectHolder getProjectHolder(String projectId) {
        ensureLoaded(projectId);
        ProjectHolder holder = projects.get(projectId);
        return holder;
    }

    /**
     * Check if a project ID is registered (may or may not be loaded in memory).
     *
     * @param projectId The project ID
     * @return true if project is known
     */
    public boolean projectExists(String projectId) {
        return projects.containsKey(projectId);
    }

    /**
     * Get all registered project IDs (both library and uploaded). This does NOT
     * trigger any deserialization — it just returns the IDs from the registry.
     * Used by the frontend sidebar to build the project list.
     *
     * @return Sorted list of project IDs
     */
    public List<String> getAllProjectIds() {
        return projects.keySet().stream()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Remove a project from the registry and free its memory.
     *
     * @param projectId The project ID
     */
    public void deleteProject(String projectId) {
        ProjectHolder holder = projects.remove(projectId);
        if (holder != null) {
            // If this was the currently loaded library project, clear the tracker
            if (projectId.equals(currentlyLoadedLibraryProjectId)) {
                currentlyLoadedLibraryProjectId = null;
            }
            log.info("Project deleted: {} (ID: {})", holder.getOriginalFilename(), projectId);
        }
    }

    /**
     * Get comprehensive metadata for a project. Triggers lazy loading because
     * metadata (experiment counts, analysis result counts, etc.) requires
     * access to the deserialized BMDProject.
     *
     * Called by the frontend when a user expands a project's details panel.
     *
     * @param projectId The project ID
     * @return ProjectMetadataDto with all project metadata
     */
    public ProjectMetadataDto getProjectMetadata(String projectId) {
        ensureLoaded(projectId);
        ProjectHolder holder = projects.get(projectId);
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

    // ========================================================================
    // ProjectHolder — container for project data + metadata
    // ========================================================================

    /**
     * Holds a project's identity, metadata, and (optionally) its deserialized
     * BMDProject. For library projects, the project field starts as null and
     * gets populated on first access. For uploaded projects, it's always set.
     *
     * The isLibraryProject flag and resourcePath enable lazy loading and
     * eviction: library projects can be unloaded (project set to null) and
     * reloaded from disk, while uploaded projects cannot.
     */
    public static class ProjectHolder {
        private final String projectId;

        // Mutable — set to null when evicted, populated when lazy-loaded
        private volatile BMDProject project;

        private final String originalFilename;
        private final LocalDateTime uploadedAt;

        // true for projects discovered in the library directory at startup,
        // false for user-uploaded projects
        private final boolean libraryProject;

        // The Spring resource path (e.g. "file:/opt/bmdexpress-web/data/bmd/Furan.bm2")
        // used to reload the project from disk after eviction. Null for uploads.
        private final String resourcePath;

        public ProjectHolder(String projectId, BMDProject project,
                           String originalFilename, LocalDateTime uploadedAt,
                           boolean libraryProject, String resourcePath) {
            this.projectId = projectId;
            this.project = project;
            this.originalFilename = originalFilename;
            this.uploadedAt = uploadedAt;
            this.libraryProject = libraryProject;
            this.resourcePath = resourcePath;
        }

        public String getProjectId() {
            return projectId;
        }

        public BMDProject getProject() {
            return project;
        }

        // Package-private setter — only ProjectService should call this
        // (during lazy load or eviction)
        void setProject(BMDProject project) {
            this.project = project;
        }

        public String getOriginalFilename() {
            return originalFilename;
        }

        public LocalDateTime getUploadedAt() {
            return uploadedAt;
        }

        public boolean isLibraryProject() {
            return libraryProject;
        }

        public String getResourcePath() {
            return resourcePath;
        }
    }
}
