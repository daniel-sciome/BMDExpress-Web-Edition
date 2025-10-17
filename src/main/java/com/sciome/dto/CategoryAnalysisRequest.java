package com.sciome.dto;

import com.sciome.bmdexpress2.shared.CategoryAnalysisEnum;

/**
 * DTO for category analysis request
 */
public class CategoryAnalysisRequest {
    private String projectId;
    private String bmdResultName;
    private CategoryAnalysisEnum analysisType;
    private CategoryAnalysisParametersDto parameters;

    // Constructors
    public CategoryAnalysisRequest() {
    }

    public CategoryAnalysisRequest(String projectId, String bmdResultName,
                                  CategoryAnalysisEnum analysisType, CategoryAnalysisParametersDto parameters) {
        this.projectId = projectId;
        this.bmdResultName = bmdResultName;
        this.analysisType = analysisType;
        this.parameters = parameters;
    }

    // Getters and setters
    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getBmdResultName() {
        return bmdResultName;
    }

    public void setBmdResultName(String bmdResultName) {
        this.bmdResultName = bmdResultName;
    }

    public CategoryAnalysisEnum getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(CategoryAnalysisEnum analysisType) {
        this.analysisType = analysisType;
    }

    public CategoryAnalysisParametersDto getParameters() {
        return parameters;
    }

    public void setParameters(CategoryAnalysisParametersDto parameters) {
        this.parameters = parameters;
    }
}
