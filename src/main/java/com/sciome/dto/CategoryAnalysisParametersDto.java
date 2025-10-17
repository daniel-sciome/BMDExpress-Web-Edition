package com.sciome.dto;

/**
 * DTO for category analysis parameters
 * Maps to CategoryAnalysisParameters from core BMDExpress library
 */
public class CategoryAnalysisParametersDto {

    // Filtering parameters
    private Boolean removePromiscuousProbes;
    private Boolean removeBMDGreaterHighDose;
    private Double nFoldBelowLowestDose;
    private Double bmdPValueCutoff;
    private Double bmduBmdlRatioMin;
    private Double bmdBmdlRatioMin;
    private Double bmduBmdRatioMin;
    private Double bmdRSquaredCutoff;

    private Integer minGenesInSet;
    private Integer maxGenesInSet;

    private Double maxFoldChange;
    private Double prefilterPValueMin;
    private Double prefilterAdjustedPValueMin;

    private Boolean removeStepFunction;
    private Boolean removeStepFunctionWithBMDLower;
    private Boolean identifyConflictingProbeSets;
    private Double correlationCutoffConflictingProbeSets;

    private String removeAdverseDirection; // "UP" or "DOWN"

    private Boolean deduplicateGeneSets;

    // GO-specific
    private String goCategory; // "universal", "biological_process", "molecular_function", "cellular_component"

    // Pathway-specific
    private String pathwayDB; // "REACTOME", "KEGG", etc.

    // Defined category-specific
    private String probeFilePath;
    private String categoryFilePath;

    public CategoryAnalysisParametersDto() {
    }

    // Getters and Setters
    public Boolean getRemovePromiscuousProbes() {
        return removePromiscuousProbes;
    }

    public void setRemovePromiscuousProbes(Boolean removePromiscuousProbes) {
        this.removePromiscuousProbes = removePromiscuousProbes;
    }

    public Boolean getRemoveBMDGreaterHighDose() {
        return removeBMDGreaterHighDose;
    }

    public void setRemoveBMDGreaterHighDose(Boolean removeBMDGreaterHighDose) {
        this.removeBMDGreaterHighDose = removeBMDGreaterHighDose;
    }

    public Double getnFoldBelowLowestDose() {
        return nFoldBelowLowestDose;
    }

    public void setnFoldBelowLowestDose(Double nFoldBelowLowestDose) {
        this.nFoldBelowLowestDose = nFoldBelowLowestDose;
    }

    public Double getBmdPValueCutoff() {
        return bmdPValueCutoff;
    }

    public void setBmdPValueCutoff(Double bmdPValueCutoff) {
        this.bmdPValueCutoff = bmdPValueCutoff;
    }

    public Double getBmduBmdlRatioMin() {
        return bmduBmdlRatioMin;
    }

    public void setBmduBmdlRatioMin(Double bmduBmdlRatioMin) {
        this.bmduBmdlRatioMin = bmduBmdlRatioMin;
    }

    public Double getBmdBmdlRatioMin() {
        return bmdBmdlRatioMin;
    }

    public void setBmdBmdlRatioMin(Double bmdBmdlRatioMin) {
        this.bmdBmdlRatioMin = bmdBmdlRatioMin;
    }

    public Double getBmduBmdRatioMin() {
        return bmduBmdRatioMin;
    }

    public void setBmduBmdRatioMin(Double bmduBmdRatioMin) {
        this.bmduBmdRatioMin = bmduBmdRatioMin;
    }

    public Double getBmdRSquaredCutoff() {
        return bmdRSquaredCutoff;
    }

    public void setBmdRSquaredCutoff(Double bmdRSquaredCutoff) {
        this.bmdRSquaredCutoff = bmdRSquaredCutoff;
    }

    public Integer getMinGenesInSet() {
        return minGenesInSet;
    }

    public void setMinGenesInSet(Integer minGenesInSet) {
        this.minGenesInSet = minGenesInSet;
    }

    public Integer getMaxGenesInSet() {
        return maxGenesInSet;
    }

    public void setMaxGenesInSet(Integer maxGenesInSet) {
        this.maxGenesInSet = maxGenesInSet;
    }

    public Double getMaxFoldChange() {
        return maxFoldChange;
    }

    public void setMaxFoldChange(Double maxFoldChange) {
        this.maxFoldChange = maxFoldChange;
    }

    public Double getPrefilterPValueMin() {
        return prefilterPValueMin;
    }

    public void setPrefilterPValueMin(Double prefilterPValueMin) {
        this.prefilterPValueMin = prefilterPValueMin;
    }

    public Double getPrefilterAdjustedPValueMin() {
        return prefilterAdjustedPValueMin;
    }

    public void setPrefilterAdjustedPValueMin(Double prefilterAdjustedPValueMin) {
        this.prefilterAdjustedPValueMin = prefilterAdjustedPValueMin;
    }

    public Boolean getRemoveStepFunction() {
        return removeStepFunction;
    }

    public void setRemoveStepFunction(Boolean removeStepFunction) {
        this.removeStepFunction = removeStepFunction;
    }

    public Boolean getRemoveStepFunctionWithBMDLower() {
        return removeStepFunctionWithBMDLower;
    }

    public void setRemoveStepFunctionWithBMDLower(Boolean removeStepFunctionWithBMDLower) {
        this.removeStepFunctionWithBMDLower = removeStepFunctionWithBMDLower;
    }

    public Boolean getIdentifyConflictingProbeSets() {
        return identifyConflictingProbeSets;
    }

    public void setIdentifyConflictingProbeSets(Boolean identifyConflictingProbeSets) {
        this.identifyConflictingProbeSets = identifyConflictingProbeSets;
    }

    public Double getCorrelationCutoffConflictingProbeSets() {
        return correlationCutoffConflictingProbeSets;
    }

    public void setCorrelationCutoffConflictingProbeSets(Double correlationCutoffConflictingProbeSets) {
        this.correlationCutoffConflictingProbeSets = correlationCutoffConflictingProbeSets;
    }

    public String getRemoveAdverseDirection() {
        return removeAdverseDirection;
    }

    public void setRemoveAdverseDirection(String removeAdverseDirection) {
        this.removeAdverseDirection = removeAdverseDirection;
    }

    public Boolean getDeduplicateGeneSets() {
        return deduplicateGeneSets;
    }

    public void setDeduplicateGeneSets(Boolean deduplicateGeneSets) {
        this.deduplicateGeneSets = deduplicateGeneSets;
    }

    public String getGoCategory() {
        return goCategory;
    }

    public void setGoCategory(String goCategory) {
        this.goCategory = goCategory;
    }

    public String getPathwayDB() {
        return pathwayDB;
    }

    public void setPathwayDB(String pathwayDB) {
        this.pathwayDB = pathwayDB;
    }

    public String getProbeFilePath() {
        return probeFilePath;
    }

    public void setProbeFilePath(String probeFilePath) {
        this.probeFilePath = probeFilePath;
    }

    public String getCategoryFilePath() {
        return categoryFilePath;
    }

    public void setCategoryFilePath(String categoryFilePath) {
        this.categoryFilePath = categoryFilePath;
    }
}
