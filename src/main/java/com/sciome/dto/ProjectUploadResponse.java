package com.sciome.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for project upload operations
 *
 * Contains project metadata and summary information after successfully
 * loading a .bm2 project file into memory.
 */
public class ProjectUploadResponse {
    private String projectId;
    private String name;
    private LocalDateTime uploadedAt;
    private List<String> bmdResultNames;
    private List<String> categoryResultNames;
    private int expressionDataCount;

    public ProjectUploadResponse() {
    }

    public ProjectUploadResponse(String projectId, String name, LocalDateTime uploadedAt,
                                 List<String> bmdResultNames, List<String> categoryResultNames,
                                 int expressionDataCount) {
        this.projectId = projectId;
        this.name = name;
        this.uploadedAt = uploadedAt;
        this.bmdResultNames = bmdResultNames;
        this.categoryResultNames = categoryResultNames;
        this.expressionDataCount = expressionDataCount;
    }

    // Getters and Setters
    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public List<String> getBmdResultNames() {
        return bmdResultNames;
    }

    public void setBmdResultNames(List<String> bmdResultNames) {
        this.bmdResultNames = bmdResultNames;
    }

    public List<String> getCategoryResultNames() {
        return categoryResultNames;
    }

    public void setCategoryResultNames(List<String> categoryResultNames) {
        this.categoryResultNames = categoryResultNames;
    }

    public int getExpressionDataCount() {
        return expressionDataCount;
    }

    public void setExpressionDataCount(int expressionDataCount) {
        this.expressionDataCount = expressionDataCount;
    }
}
