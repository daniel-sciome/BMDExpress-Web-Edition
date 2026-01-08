package com.sciome.dto;

import java.time.LocalDateTime;

/**
 * DTO containing all metadata for a BMD project
 */
public class ProjectMetadataDto {
    private String projectId;
    private String projectName;
    private String originalFilename;
    private LocalDateTime uploadedAt;

    // Experiment information
    private int experimentCount;
    private String experimentName;
    private ExperimentDescriptionDto experimentDescription;

    // Data counts
    private int probeCount;
    private int treatmentCount;
    private Double minDose;
    private Double maxDose;

    // Analysis results counts
    private int anovaResultsCount;
    private int williamsTrendResultsCount;
    private int curveFitResultsCount;
    private int oriogenResultsCount;
    private int bmdResultsCount;
    private int categoryResultsCount;

    public ProjectMetadataDto() {
    }

    // Getters and setters

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public int getExperimentCount() {
        return experimentCount;
    }

    public void setExperimentCount(int experimentCount) {
        this.experimentCount = experimentCount;
    }

    public String getExperimentName() {
        return experimentName;
    }

    public void setExperimentName(String experimentName) {
        this.experimentName = experimentName;
    }

    public ExperimentDescriptionDto getExperimentDescription() {
        return experimentDescription;
    }

    public void setExperimentDescription(ExperimentDescriptionDto experimentDescription) {
        this.experimentDescription = experimentDescription;
    }

    public int getProbeCount() {
        return probeCount;
    }

    public void setProbeCount(int probeCount) {
        this.probeCount = probeCount;
    }

    public int getTreatmentCount() {
        return treatmentCount;
    }

    public void setTreatmentCount(int treatmentCount) {
        this.treatmentCount = treatmentCount;
    }

    public Double getMinDose() {
        return minDose;
    }

    public void setMinDose(Double minDose) {
        this.minDose = minDose;
    }

    public Double getMaxDose() {
        return maxDose;
    }

    public void setMaxDose(Double maxDose) {
        this.maxDose = maxDose;
    }

    public int getAnovaResultsCount() {
        return anovaResultsCount;
    }

    public void setAnovaResultsCount(int anovaResultsCount) {
        this.anovaResultsCount = anovaResultsCount;
    }

    public int getWilliamsTrendResultsCount() {
        return williamsTrendResultsCount;
    }

    public void setWilliamsTrendResultsCount(int williamsTrendResultsCount) {
        this.williamsTrendResultsCount = williamsTrendResultsCount;
    }

    public int getCurveFitResultsCount() {
        return curveFitResultsCount;
    }

    public void setCurveFitResultsCount(int curveFitResultsCount) {
        this.curveFitResultsCount = curveFitResultsCount;
    }

    public int getOriogenResultsCount() {
        return oriogenResultsCount;
    }

    public void setOriogenResultsCount(int oriogenResultsCount) {
        this.oriogenResultsCount = oriogenResultsCount;
    }

    public int getBmdResultsCount() {
        return bmdResultsCount;
    }

    public void setBmdResultsCount(int bmdResultsCount) {
        this.bmdResultsCount = bmdResultsCount;
    }

    public int getCategoryResultsCount() {
        return categoryResultsCount;
    }

    public void setCategoryResultsCount(int categoryResultsCount) {
        this.categoryResultsCount = categoryResultsCount;
    }
}
