package com.sciome.dto;

/**
 * DTO for clustering input item - sent from browser to server.
 */
public class ClusteringInputItemDto {
    private String categoryId;
    private String categoryTitle;
    private String clusterBMD;
    private String genesUp;
    private String genesDown;
    private String allGenes;

    public ClusteringInputItemDto() {
    }

    public ClusteringInputItemDto(String categoryId, String categoryTitle, String clusterBMD,
            String genesUp, String genesDown, String allGenes) {
        this.categoryId = categoryId;
        this.categoryTitle = categoryTitle;
        this.clusterBMD = clusterBMD;
        this.genesUp = genesUp;
        this.genesDown = genesDown;
        this.allGenes = allGenes;
    }

    // Getters and setters
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getCategoryTitle() { return categoryTitle; }
    public void setCategoryTitle(String categoryTitle) { this.categoryTitle = categoryTitle; }

    public String getClusterBMD() { return clusterBMD; }
    public void setClusterBMD(String clusterBMD) { this.clusterBMD = clusterBMD; }

    public String getGenesUp() { return genesUp; }
    public void setGenesUp(String genesUp) { this.genesUp = genesUp; }

    public String getGenesDown() { return genesDown; }
    public void setGenesDown(String genesDown) { this.genesDown = genesDown; }

    public String getAllGenes() { return allGenes; }
    public void setAllGenes(String allGenes) { this.allGenes = allGenes; }
}
