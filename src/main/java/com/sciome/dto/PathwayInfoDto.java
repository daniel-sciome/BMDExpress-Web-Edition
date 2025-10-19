package com.sciome.dto;

/**
 * Lightweight DTO for listing available pathways in a category analysis result.
 * Used for autocomplete/selection in the curve overlay UI.
 */
public class PathwayInfoDto {

    /**
     * Pathway identifier (GO ID, Reactome ID, etc.)
     */
    private String pathwayId;

    /**
     * Pathway description/name
     */
    private String pathwayDescription;

    /**
     * Number of genes in this pathway for this analysis
     */
    private Integer geneCount;

    /**
     * Category analysis type (e.g., "GO_BP", "Reactome", "GENE")
     */
    private String analysisType;

    // Constructors

    public PathwayInfoDto() {
    }

    public PathwayInfoDto(String pathwayId, String pathwayDescription, Integer geneCount) {
        this.pathwayId = pathwayId;
        this.pathwayDescription = pathwayDescription;
        this.geneCount = geneCount;
    }

    // Getters and Setters

    public String getPathwayId() {
        return pathwayId;
    }

    public void setPathwayId(String pathwayId) {
        this.pathwayId = pathwayId;
    }

    public String getPathwayDescription() {
        return pathwayDescription;
    }

    public void setPathwayDescription(String pathwayDescription) {
        this.pathwayDescription = pathwayDescription;
    }

    public Integer getGeneCount() {
        return geneCount;
    }

    public void setGeneCount(Integer geneCount) {
        this.geneCount = geneCount;
    }

    public String getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(String analysisType) {
        this.analysisType = analysisType;
    }

    @Override
    public String toString() {
        return "PathwayInfoDto{" +
                "pathwayId='" + pathwayId + '\'' +
                ", pathwayDescription='" + pathwayDescription + '\'' +
                ", geneCount=" + geneCount +
                '}';
    }
}
