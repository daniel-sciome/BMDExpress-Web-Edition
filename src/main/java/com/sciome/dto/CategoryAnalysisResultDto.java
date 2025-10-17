package com.sciome.dto;

import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;

/**
 * DTO for category analysis results that can be serialized by Hilla/Vaadin
 * Represents a single category (e.g., GO term, pathway) with enrichment statistics
 */
public class CategoryAnalysisResultDto {

    // Category identification
    private String categoryId;
    private String categoryDescription;

    // Gene counts
    private Integer geneAllCount;
    private Integer geneCountSignificantANOVA;
    private Integer genesThatPassedAllFilters;
    private Double percentage;

    // Fisher's Exact Test results
    private Integer fishersA;
    private Integer fishersB;
    private Integer fishersC;
    private Integer fishersD;
    private Double fishersExactLeftPValue;
    private Double fishersExactRightPValue;
    private Double fishersExactTwoTailPValue;

    // BMD statistics
    private Double bmdMean;
    private Double bmdMedian;
    private Double bmdMinimum;
    private Double bmdSD;

    private Double bmdlMean;
    private Double bmdlMedian;
    private Double bmdlMinimum;
    private Double bmdlSD;

    private Double bmduMean;
    private Double bmduMedian;
    private Double bmduMinimum;
    private Double bmduSD;

    // Filter counts
    private Integer genesWithBMDLessEqualHighDose;
    private Integer genesWithBMDpValueGreaterEqualValue;
    private Integer genesWithFoldChangeAboveValue;

    // Default constructor for Hilla
    public CategoryAnalysisResultDto() {
    }

    /**
     * Convert from desktop app CategoryAnalysisResult to DTO
     */
    public static CategoryAnalysisResultDto fromDesktopObject(CategoryAnalysisResult result) {
        CategoryAnalysisResultDto dto = new CategoryAnalysisResultDto();

        // Category identification
        if (result.getCategoryIdentifier() != null) {
            dto.setCategoryId(result.getCategoryIdentifier().getId());
            dto.setCategoryDescription(result.getCategoryIdentifier().getTitle());
        }

        // Gene counts
        dto.setGeneAllCount(result.getGeneAllCount());
        dto.setGeneCountSignificantANOVA(result.getGeneCountSignificantANOVA());
        dto.setGenesThatPassedAllFilters(result.getGenesThatPassedAllFilters());
        dto.setPercentage(result.getPercentage());

        // Fisher's Exact Test
        dto.setFishersA(result.getFishersA());
        dto.setFishersB(result.getFishersB());
        dto.setFishersC(result.getFishersC());
        dto.setFishersD(result.getFishersD());
        dto.setFishersExactLeftPValue(result.getFishersExactLeftPValue());
        dto.setFishersExactRightPValue(result.getFishersExactRightPValue());
        dto.setFishersExactTwoTailPValue(result.getFishersExactTwoTailPValue());

        // BMD statistics
        dto.setBmdMean(result.getBmdMean());
        dto.setBmdMedian(result.getBmdMedian());
        dto.setBmdMinimum(result.getBmdMinimum());
        dto.setBmdSD(result.getBmdSD());

        dto.setBmdlMean(result.getBmdlMean());
        dto.setBmdlMedian(result.getBmdlMedian());
        dto.setBmdlMinimum(result.getBmdlMinimum());
        dto.setBmdlSD(result.getBmdlSD());

        dto.setBmduMean(result.getBmduMean());
        dto.setBmduMedian(result.getBmduMedian());
        dto.setBmduMinimum(result.getBmduMinimum());
        dto.setBmduSD(result.getBmduSD());

        // Filter counts
        dto.setGenesWithBMDLessEqualHighDose(result.getGenesWithBMDLessEqualHighDose());
        dto.setGenesWithBMDpValueGreaterEqualValue(result.getGenesWithBMDpValueGreaterEqualValue());
        dto.setGenesWithFoldChangeAboveValue(result.getGenesWithFoldChangeAboveValue());

        return dto;
    }

    // Getters and setters

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryDescription() {
        return categoryDescription;
    }

    public void setCategoryDescription(String categoryDescription) {
        this.categoryDescription = categoryDescription;
    }

    public Integer getGeneAllCount() {
        return geneAllCount;
    }

    public void setGeneAllCount(Integer geneAllCount) {
        this.geneAllCount = geneAllCount;
    }

    public Integer getGeneCountSignificantANOVA() {
        return geneCountSignificantANOVA;
    }

    public void setGeneCountSignificantANOVA(Integer geneCountSignificantANOVA) {
        this.geneCountSignificantANOVA = geneCountSignificantANOVA;
    }

    public Integer getGenesThatPassedAllFilters() {
        return genesThatPassedAllFilters;
    }

    public void setGenesThatPassedAllFilters(Integer genesThatPassedAllFilters) {
        this.genesThatPassedAllFilters = genesThatPassedAllFilters;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public Integer getFishersA() {
        return fishersA;
    }

    public void setFishersA(Integer fishersA) {
        this.fishersA = fishersA;
    }

    public Integer getFishersB() {
        return fishersB;
    }

    public void setFishersB(Integer fishersB) {
        this.fishersB = fishersB;
    }

    public Integer getFishersC() {
        return fishersC;
    }

    public void setFishersC(Integer fishersC) {
        this.fishersC = fishersC;
    }

    public Integer getFishersD() {
        return fishersD;
    }

    public void setFishersD(Integer fishersD) {
        this.fishersD = fishersD;
    }

    public Double getFishersExactLeftPValue() {
        return fishersExactLeftPValue;
    }

    public void setFishersExactLeftPValue(Double fishersExactLeftPValue) {
        this.fishersExactLeftPValue = fishersExactLeftPValue;
    }

    public Double getFishersExactRightPValue() {
        return fishersExactRightPValue;
    }

    public void setFishersExactRightPValue(Double fishersExactRightPValue) {
        this.fishersExactRightPValue = fishersExactRightPValue;
    }

    public Double getFishersExactTwoTailPValue() {
        return fishersExactTwoTailPValue;
    }

    public void setFishersExactTwoTailPValue(Double fishersExactTwoTailPValue) {
        this.fishersExactTwoTailPValue = fishersExactTwoTailPValue;
    }

    public Double getBmdMean() {
        return bmdMean;
    }

    public void setBmdMean(Double bmdMean) {
        this.bmdMean = bmdMean;
    }

    public Double getBmdMedian() {
        return bmdMedian;
    }

    public void setBmdMedian(Double bmdMedian) {
        this.bmdMedian = bmdMedian;
    }

    public Double getBmdMinimum() {
        return bmdMinimum;
    }

    public void setBmdMinimum(Double bmdMinimum) {
        this.bmdMinimum = bmdMinimum;
    }

    public Double getBmdSD() {
        return bmdSD;
    }

    public void setBmdSD(Double bmdSD) {
        this.bmdSD = bmdSD;
    }

    public Double getBmdlMean() {
        return bmdlMean;
    }

    public void setBmdlMean(Double bmdlMean) {
        this.bmdlMean = bmdlMean;
    }

    public Double getBmdlMedian() {
        return bmdlMedian;
    }

    public void setBmdlMedian(Double bmdlMedian) {
        this.bmdlMedian = bmdlMedian;
    }

    public Double getBmdlMinimum() {
        return bmdlMinimum;
    }

    public void setBmdlMinimum(Double bmdlMinimum) {
        this.bmdlMinimum = bmdlMinimum;
    }

    public Double getBmdlSD() {
        return bmdlSD;
    }

    public void setBmdlSD(Double bmdlSD) {
        this.bmdlSD = bmdlSD;
    }

    public Double getBmduMean() {
        return bmduMean;
    }

    public void setBmduMean(Double bmduMean) {
        this.bmduMean = bmduMean;
    }

    public Double getBmduMedian() {
        return bmduMedian;
    }

    public void setBmduMedian(Double bmduMedian) {
        this.bmduMedian = bmduMedian;
    }

    public Double getBmduMinimum() {
        return bmduMinimum;
    }

    public void setBmduMinimum(Double bmduMinimum) {
        this.bmduMinimum = bmduMinimum;
    }

    public Double getBmduSD() {
        return bmduSD;
    }

    public void setBmduSD(Double bmduSD) {
        this.bmduSD = bmduSD;
    }

    public Integer getGenesWithBMDLessEqualHighDose() {
        return genesWithBMDLessEqualHighDose;
    }

    public void setGenesWithBMDLessEqualHighDose(Integer genesWithBMDLessEqualHighDose) {
        this.genesWithBMDLessEqualHighDose = genesWithBMDLessEqualHighDose;
    }

    public Integer getGenesWithBMDpValueGreaterEqualValue() {
        return genesWithBMDpValueGreaterEqualValue;
    }

    public void setGenesWithBMDpValueGreaterEqualValue(Integer genesWithBMDpValueGreaterEqualValue) {
        this.genesWithBMDpValueGreaterEqualValue = genesWithBMDpValueGreaterEqualValue;
    }

    public Integer getGenesWithFoldChangeAboveValue() {
        return genesWithFoldChangeAboveValue;
    }

    public void setGenesWithFoldChangeAboveValue(Integer genesWithFoldChangeAboveValue) {
        this.genesWithFoldChangeAboveValue = genesWithFoldChangeAboveValue;
    }
}
