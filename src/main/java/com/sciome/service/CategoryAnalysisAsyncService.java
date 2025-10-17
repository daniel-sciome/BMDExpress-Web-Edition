package com.sciome.service;

import com.sciome.dto.CategoryAnalysisParametersDto;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;
import com.sciome.bmdexpress2.shared.CategoryAnalysisEnum;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Async service for running category analyses
 * Wraps the core CategoryAnalysisService from BMDExpress
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class CategoryAnalysisAsyncService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryAnalysisAsyncService.class);

    private final BmdResultsService bmdResultsService;

    // In-memory result store
    private final Map<String, AnalysisJobResult> analysisResults = new ConcurrentHashMap<>();

    @Autowired
    public CategoryAnalysisAsyncService(BmdResultsService bmdResultsService) {
        this.bmdResultsService = bmdResultsService;
    }

    /**
     * Run category analysis asynchronously
     *
     * @param projectId The project identifier
     * @param bmdResultName The name of the BMD result to analyze
     * @param analysisType Type of category analysis (GO, PATHWAY, DEFINED, GENE_LEVEL)
     * @param parametersDto Analysis parameters
     * @return CompletableFuture with analysis ID
     */
    @Async
    public CompletableFuture<String> runCategoryAnalysisAsync(
            String projectId,
            String bmdResultName,
            String analysisType,
            CategoryAnalysisParametersDto parametersDto) {

        String analysisId = UUID.randomUUID().toString();

        // Store initial status
        AnalysisJobResult job = new AnalysisJobResult(analysisId);
        job.setStatus("RUNNING");
        job.setSubmittedAt(LocalDateTime.now());
        analysisResults.put(analysisId, job);

        try {
            // Look up the BMDResult internally
            BMDResult bmdResult = bmdResultsService.findBmdResult(projectId, bmdResultName);

            // Convert string to enum
            CategoryAnalysisEnum analysisTypeEnum = CategoryAnalysisEnum.valueOf(analysisType);

            logger.info("Starting category analysis: {} for BMDResult: {}", analysisTypeEnum, bmdResult.getName());

            // TODO: Implement actual analysis
            // The prototype (/tmp/server) has a full implementation that:
            // 1. Converts CategoryAnalysisParametersDto to CategoryAnalysisParameters using convertToParameters()
            // 2. Calls CategoryAnalysisService.categoryAnalysis() from desktop app core
            // 3. Returns CategoryAnalysisResults
            //
            // Stub implementation for now - just marks as completed without real analysis
            // See /tmp/server/service/CategoryAnalysisAsyncService.java lines 58-86 for full implementation

            // This would be used when implementing the actual analysis:
            // Object params = convertToParameters(parametersDto, analysisTypeEnum);

            job.setStatus("COMPLETED");
            job.setCompletedAt(LocalDateTime.now());

            logger.info("Completed category analysis stub: {}", analysisId);
            logger.warn("Category analysis execution is stubbed - no actual analysis performed");

            return CompletableFuture.completedFuture(analysisId);

        } catch (Exception e) {
            logger.error("Category analysis failed: {}", analysisId, e);
            job.setStatus("FAILED");
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Get analysis job status (browser-callable, returns simplified DTO)
     */
    public AnalysisJobStatus getAnalysisStatus(String analysisId) {
        AnalysisJobResult result = analysisResults.get(analysisId);
        if (result == null) {
            throw new IllegalArgumentException("Analysis not found: " + analysisId);
        }

        // Convert internal result to simple DTO for browser
        return new AnalysisJobStatus(
                result.getAnalysisId(),
                result.getStatus(),
                result.getSubmittedAt(),
                result.getCompletedAt(),
                result.getErrorMessage()
        );
    }

    /**
     * Get full analysis job result (package-private, not exposed to browser)
     * This includes the CategoryAnalysisResults which cannot be serialized by Hilla
     */
    AnalysisJobResult getAnalysisResult(String analysisId) {
        AnalysisJobResult result = analysisResults.get(analysisId);
        if (result == null) {
            throw new IllegalArgumentException("Analysis not found: " + analysisId);
        }
        return result;
    }

    /**
     * Convert DTO parameters to CategoryAnalysisParameters from desktop app
     *
     * STUB: This method signature is defined to match the prototype implementation.
     * The full implementation would convert all DTO fields to CategoryAnalysisParameters
     * for use with the desktop app's CategoryAnalysisService.
     *
     * See /tmp/server/service/CategoryAnalysisAsyncService.java lines 100-242 for full implementation
     * that handles:
     * - BMD filtering (p-value, BMD/BMDL ratios, r-squared cutoffs)
     * - Gene set size filters (min/max genes)
     * - Fold change filters
     * - Prefilter settings
     * - GO category selection
     * - Pathway database selection
     * - Defined category file parameters
     *
     * @param dto The DTO containing analysis parameters from REST API
     * @param analysisType The type of category analysis
     * @return CategoryAnalysisParameters for desktop app (not implemented in stub)
     */
    private Object convertToParameters(CategoryAnalysisParametersDto dto, CategoryAnalysisEnum analysisType) {
        // STUB: Return null for now
        // Full implementation would return CategoryAnalysisParameters instance
        logger.warn("convertToParameters is stubbed - parameter conversion not implemented");
        return null;
    }

    /**
     * Simplified status DTO for browser (no CategoryAnalysisResults)
     */
    public static class AnalysisJobStatus {
        private final String analysisId;
        private final String status;
        private final LocalDateTime submittedAt;
        private final LocalDateTime completedAt;
        private final String errorMessage;

        public AnalysisJobStatus(String analysisId, String status, LocalDateTime submittedAt,
                                LocalDateTime completedAt, String errorMessage) {
            this.analysisId = analysisId;
            this.status = status;
            this.submittedAt = submittedAt;
            this.completedAt = completedAt;
            this.errorMessage = errorMessage;
        }

        public String getAnalysisId() {
            return analysisId;
        }

        public String getStatus() {
            return status;
        }

        public LocalDateTime getSubmittedAt() {
            return submittedAt;
        }

        public LocalDateTime getCompletedAt() {
            return completedAt;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }

    /**
     * Internal result holder for async analysis jobs (includes CategoryAnalysisResults)
     * Not exposed to browser - use AnalysisJobStatus for browser-callable methods
     */
    static class AnalysisJobResult {
        private final String analysisId;
        private String status; // PENDING, RUNNING, COMPLETED, FAILED
        private LocalDateTime submittedAt;
        private LocalDateTime completedAt;
        private CategoryAnalysisResults results;
        private String errorMessage;

        public AnalysisJobResult(String analysisId) {
            this.analysisId = analysisId;
            this.status = "PENDING";
        }

        // Getters and setters
        public String getAnalysisId() {
            return analysisId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getSubmittedAt() {
            return submittedAt;
        }

        public void setSubmittedAt(LocalDateTime submittedAt) {
            this.submittedAt = submittedAt;
        }

        public LocalDateTime getCompletedAt() {
            return completedAt;
        }

        public void setCompletedAt(LocalDateTime completedAt) {
            this.completedAt = completedAt;
        }

        public CategoryAnalysisResults getResults() {
            return results;
        }

        public void setResults(CategoryAnalysisResults results) {
            this.results = results;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
}
