package com.sciome.dto.prefilter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Container for prefilter analysis results
 * Stores metadata, input parameters, and individual probe results
 */
public class PrefilterResults {

    // ========================================
    // METADATA
    // ========================================

    /**
     * Unique identifier
     */
    private String id;

    /**
     * User-provided name for these results
     */
    private String name;

    /**
     * Prefilter type
     * Values: "ANOVA", "WILLIAMS", "ORIOGEN", "CURVE_FIT"
     */
    private String prefilterType;

    /**
     * Timestamp when analysis was created
     */
    private LocalDateTime createdDate;

    /**
     * Software version that created these results
     */
    private String version;

    /**
     * User who created the analysis (optional)
     */
    private String createdBy;

    /**
     * User notes (optional)
     */
    private String notes;

    /**
     * Execution time in milliseconds (optional)
     */
    private Long executionTime;

    // ========================================
    // INPUT REFERENCE
    // ========================================

    /**
     * ID of the dose-response experiment that was analyzed
     */
    private String doseResponseExperimentId;

    /**
     * Name of the dose-response experiment
     */
    private String doseResponseExperimentName;

    /**
     * Input parameters used for this analysis
     * Stores the complete configuration as JSON
     */
    private PrefilterInput inputParameters;

    // ========================================
    // RESULTS
    // ========================================

    /**
     * Individual probe/gene results
     * Only includes probes that passed all filters
     */
    private List<PrefilterResult> results;

    // ========================================
    // SUMMARY STATISTICS
    // ========================================

    /**
     * Total number of probes analyzed
     */
    private Integer totalProbesAnalyzed;

    /**
     * Number of probes that passed all filters
     */
    private Integer probesPassed;

    /**
     * Number of probes that failed filters
     */
    private Integer probesFailed;

    // Constructors
    public PrefilterResults() {
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPrefilterType() {
        return prefilterType;
    }

    public void setPrefilterType(String prefilterType) {
        this.prefilterType = prefilterType;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Long getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(Long executionTime) {
        this.executionTime = executionTime;
    }

    public String getDoseResponseExperimentId() {
        return doseResponseExperimentId;
    }

    public void setDoseResponseExperimentId(String doseResponseExperimentId) {
        this.doseResponseExperimentId = doseResponseExperimentId;
    }

    public String getDoseResponseExperimentName() {
        return doseResponseExperimentName;
    }

    public void setDoseResponseExperimentName(String doseResponseExperimentName) {
        this.doseResponseExperimentName = doseResponseExperimentName;
    }

    public PrefilterInput getInputParameters() {
        return inputParameters;
    }

    public void setInputParameters(PrefilterInput inputParameters) {
        this.inputParameters = inputParameters;
    }

    public List<PrefilterResult> getResults() {
        return results;
    }

    public void setResults(List<PrefilterResult> results) {
        this.results = results;
    }

    public Integer getTotalProbesAnalyzed() {
        return totalProbesAnalyzed;
    }

    public void setTotalProbesAnalyzed(Integer totalProbesAnalyzed) {
        this.totalProbesAnalyzed = totalProbesAnalyzed;
    }

    public Integer getProbesPassed() {
        return probesPassed;
    }

    public void setProbesPassed(Integer probesPassed) {
        this.probesPassed = probesPassed;
    }

    public Integer getProbesFailed() {
        return probesFailed;
    }

    public void setProbesFailed(Integer probesFailed) {
        this.probesFailed = probesFailed;
    }
}
