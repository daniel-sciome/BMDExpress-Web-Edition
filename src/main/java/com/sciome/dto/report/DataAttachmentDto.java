package com.sciome.dto.report;

public class DataAttachmentDto {
    private String projectId;
    private String categoryResultName;
    private String pathwayDescription;
    private String geneSymbols;
    private String label;
    private String summaryJson;

    public DataAttachmentDto() {
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getCategoryResultName() {
        return categoryResultName;
    }

    public void setCategoryResultName(String categoryResultName) {
        this.categoryResultName = categoryResultName;
    }

    public String getPathwayDescription() {
        return pathwayDescription;
    }

    public void setPathwayDescription(String pathwayDescription) {
        this.pathwayDescription = pathwayDescription;
    }

    public String getGeneSymbols() {
        return geneSymbols;
    }

    public void setGeneSymbols(String geneSymbols) {
        this.geneSymbols = geneSymbols;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getSummaryJson() {
        return summaryJson;
    }

    public void setSummaryJson(String summaryJson) {
        this.summaryJson = summaryJson;
    }
}
