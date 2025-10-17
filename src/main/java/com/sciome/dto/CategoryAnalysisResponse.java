package com.sciome.dto;

import java.time.LocalDateTime;

/**
 * DTO for category analysis response
 */
public class CategoryAnalysisResponse {
    private String analysisId;
    private String projectId;
    private String status;
    private String resultLocation;
    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;
    private String errorMessage;

    // Constructors
    public CategoryAnalysisResponse() {
    }

    public CategoryAnalysisResponse(String analysisId, String projectId, String status) {
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.status = status;
    }

    // Getters and setters
    public String getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(String analysisId) {
        this.analysisId = analysisId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getResultLocation() {
        return resultLocation;
    }

    public void setResultLocation(String resultLocation) {
        this.resultLocation = resultLocation;
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

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
