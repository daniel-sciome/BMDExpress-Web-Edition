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

    // Weighted statistics
    private Double bmdWMean;
    private Double bmdWSD;
    private Double bmdlWMean;
    private Double bmdlWSD;
    private Double bmduWMean;
    private Double bmduWSD;

    // Filter counts
    private Integer genesWithBMDLessEqualHighDose;
    private Integer genesWithBMDpValueGreaterEqualValue;
    private Integer genesWithFoldChangeAboveValue;
    private Integer genesWithBMDRSquaredValueGreaterEqualValue;
    private Integer genesWithBMDBMDLRatioBelowValue;
    private Integer genesWithBMDUBMDLRatioBelowValue;
    private Integer genesWithBMDUBMDRatioBelowValue;
    private Integer genesWithNFoldBelowLowPostiveDoseValue;
    private Integer genesWithPrefilterPValueAboveValue;
    private Integer genesWithPrefilterAdjustedPValueAboveValue;
    private Integer genesNotStepFunction;
    private Integer genesNotStepFunctionWithBMDLower;
    private Integer genesNotAdverseDirection;
    private Integer genesWithABSZScoreAboveValue;
    private Integer genesWithABSModelFCAboveValue;

    // Percentile values
    private Double bmdFifthPercentileTotalGenes;
    private Double bmdTenthPercentileTotalGenes;
    private Double bmdlFifthPercentileTotalGenes;
    private Double bmdlTenthPercentileTotalGenes;
    private Double bmduFifthPercentileTotalGenes;
    private Double bmduTenthPercentileTotalGenes;

    // Direction-specific statistics for UP-regulated genes
    private Double genesUpBMDMean;
    private Double genesUpBMDMedian;
    private Double genesUpBMDSD;
    private Double genesUpBMDLMean;
    private Double genesUpBMDLMedian;
    private Double genesUpBMDLSD;
    private Double genesUpBMDUMean;
    private Double genesUpBMDUMedian;
    private Double genesUpBMDUSD;

    // Direction-specific statistics for DOWN-regulated genes
    private Double genesDownBMDMean;
    private Double genesDownBMDMedian;
    private Double genesDownBMDSD;
    private Double genesDownBMDLMean;
    private Double genesDownBMDLMedian;
    private Double genesDownBMDLSD;
    private Double genesDownBMDUMean;
    private Double genesDownBMDUMedian;
    private Double genesDownBMDUSD;

    // Directional analysis (overall direction of dose-response)
    private String overallDirection; // UP, DOWN, or CONFLICT
    private Double percentWithOverallDirectionUP;
    private Double percentWithOverallDirectionDOWN;
    private Double percentWithOverallDirectionConflict;

    // Fold change statistics
    private Double totalFoldChange;
    private Double meanFoldChange;
    private Double medianFoldChange;
    private Double maxFoldChange;
    private Double minFoldChange;
    private Double stdDevFoldChange;

    // 95% Confidence intervals
    private Double bmdLower95;
    private Double bmdUpper95;
    private Double bmdlLower95;
    private Double bmdlUpper95;
    private Double bmduLower95;
    private Double bmduUpper95;

    // Z-Score statistics
    private Double minZScore;
    private Double medianZScore;
    private Double maxZScore;
    private Double meanZScore;

    // Model fold change statistics
    private Double minModelFoldChange;
    private Double medianModelFoldChange;
    private Double maxModelFoldChange;
    private Double meanModelFoldChange;

    // Gene lists (comma-separated)
    private String genes;
    private String geneSymbols;

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

        // Weighted statistics
        dto.setBmdWMean(result.getBmdWMean());
        dto.setBmdWSD(result.getBmdWSD());
        dto.setBmdlWMean(result.getBmdlWMean());
        dto.setBmdlWSD(result.getBmdlWSD());
        dto.setBmduWMean(result.getBmduWMean());
        dto.setBmduWSD(result.getBmduWSD());

        // Filter counts
        dto.setGenesWithBMDLessEqualHighDose(result.getGenesWithBMDLessEqualHighDose());
        dto.setGenesWithBMDpValueGreaterEqualValue(result.getGenesWithBMDpValueGreaterEqualValue());
        dto.setGenesWithFoldChangeAboveValue(result.getGenesWithFoldChangeAboveValue());
        dto.setGenesWithBMDRSquaredValueGreaterEqualValue(result.getGenesWithBMDRSquaredValueGreaterEqualValue());
        dto.setGenesWithBMDBMDLRatioBelowValue(result.getGenesWithBMDBMDLRatioBelowValue());
        dto.setGenesWithBMDUBMDLRatioBelowValue(result.getGenesWithBMDUBMDLRatioBelowValue());
        dto.setGenesWithBMDUBMDRatioBelowValue(result.getGenesWithBMDUBMDRatioBelowValue());
        dto.setGenesWithNFoldBelowLowPostiveDoseValue(result.getGenesWithNFoldBelowLowPostiveDoseValue());
        dto.setGenesWithPrefilterPValueAboveValue(result.getGenesWithPrefilterPValueAboveValue());
        dto.setGenesWithPrefilterAdjustedPValueAboveValue(result.getGenesWithPrefilterAdjustedPValueAboveValue());
        dto.setGenesNotStepFunction(result.getGenesNotStepFunction());
        dto.setGenesNotStepFunctionWithBMDLower(result.getGenesNotStepFunctionWithBMDLower());
        dto.setGenesNotAdverseDirection(result.getGenesNotAdverseDirection());
        dto.setGenesWithABSZScoreAboveValue(result.getGenesWithABSZScoreAboveValue());
        dto.setGenesWithABSModelFCAboveValue(result.getGenesWithABSModelFCAboveValue());

        // Percentile values
        dto.setBmdFifthPercentileTotalGenes(result.getBmdFifthPercentileTotalGenes());
        dto.setBmdTenthPercentileTotalGenes(result.getBmdTenthPercentileTotalGenes());
        dto.setBmdlFifthPercentileTotalGenes(result.getBmdlFifthPercentileTotalGenes());
        dto.setBmdlTenthPercentileTotalGenes(result.getBmdlTenthPercentileTotalGenes());
        dto.setBmduFifthPercentileTotalGenes(result.getBmduFifthPercentileTotalGenes());
        dto.setBmduTenthPercentileTotalGenes(result.getBmduTenthPercentileTotalGenes());

        // Direction-specific statistics for UP-regulated genes
        dto.setGenesUpBMDMean(result.getGenesUpBMDMean());
        dto.setGenesUpBMDMedian(result.getGenesUpBMDMedian());
        dto.setGenesUpBMDSD(result.getGenesUpBMDSD());
        dto.setGenesUpBMDLMean(result.getGenesUpBMDLMean());
        dto.setGenesUpBMDLMedian(result.getGenesUpBMDLMedian());
        dto.setGenesUpBMDLSD(result.getGenesUpBMDLSD());
        dto.setGenesUpBMDUMean(result.getGenesUpBMDUMean());
        dto.setGenesUpBMDUMedian(result.getGenesUpBMDUMedian());
        dto.setGenesUpBMDUSD(result.getGenesUpBMDUSD());

        // Direction-specific statistics for DOWN-regulated genes
        dto.setGenesDownBMDMean(result.getGenesDownBMDMean());
        dto.setGenesDownBMDMedian(result.getGenesDownBMDMedian());
        dto.setGenesDownBMDSD(result.getGenesDownBMDSD());
        dto.setGenesDownBMDLMean(result.getGenesDownBMDLMean());
        dto.setGenesDownBMDLMedian(result.getGenesDownBMDLMedian());
        dto.setGenesDownBMDLSD(result.getGenesDownBMDLSD());
        dto.setGenesDownBMDUMean(result.getGenesDownBMDUMean());
        dto.setGenesDownBMDUMedian(result.getGenesDownBMDUMedian());
        dto.setGenesDownBMDUSD(result.getGenesDownBMDUSD());

        // Directional analysis - convert enum to string
        if (result.getOverallDirection() != null) {
            dto.setOverallDirection(result.getOverallDirection().toString());
        }
        dto.setPercentWithOverallDirectionUP(result.getPercentWithOverallDirectionUP());
        dto.setPercentWithOverallDirectionDOWN(result.getPercentWithOverallDirectionDOWN());
        dto.setPercentWithOverallDirectionConflict(result.getPercentWithOverallDirectionConflict());

        // Fold change statistics - these getters don't exist in CategoryAnalysisResult
        // Only model fold change statistics are available
        // dto.setTotalFoldChange(result.getTotalFoldChange()); // No getter
        // dto.setMeanFoldChange(result.getMeanFoldChange()); // No getter
        // dto.setMedianFoldChange(result.getMedianFoldChange()); // No getter
        // dto.setMaxFoldChange(result.getMaxFoldChange()); // No getter
        // dto.setMinFoldChange(result.getMinFoldChange()); // No getter
        // dto.setStdDevFoldChange(result.getStdDevFoldChange()); // No getter

        // 95% Confidence intervals - these getters don't exist
        // dto.setBmdLower95(result.getBmdLower95()); // No getter
        // dto.setBmdUpper95(result.getBmdUpper95()); // No getter
        // dto.setBmdlLower95(result.getBmdlLower95()); // No getter
        // dto.setBmdlUpper95(result.getBmdlUpper95()); // No getter
        // dto.setBmduLower95(result.getBmduLower95()); // No getter
        // dto.setBmduUpper95(result.getBmduUpper95()); // No getter

        // Z-Score statistics
        dto.setMinZScore(result.getMinZScore());
        dto.setMedianZScore(result.getMedianZScore());
        dto.setMaxZScore(result.getMaxZScore());
        dto.setMeanZScore(result.getMeanZScore());

        // Model fold change statistics
        dto.setMinModelFoldChange(result.getMinModelFoldChange());
        dto.setMedianModelFoldChange(result.getMedianModelFoldChange());
        dto.setMaxModelFoldChange(result.getMaxModelFoldChange());
        dto.setMeanModelFoldChange(result.getMeanModelFoldChange());

        // Gene lists
        dto.setGenes(result.getGenes());
        dto.setGeneSymbols(result.getGeneSymbols());

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

    public Double getBmdWMean() {
        return bmdWMean;
    }

    public void setBmdWMean(Double bmdWMean) {
        this.bmdWMean = bmdWMean;
    }

    public Double getBmdWSD() {
        return bmdWSD;
    }

    public void setBmdWSD(Double bmdWSD) {
        this.bmdWSD = bmdWSD;
    }

    public Double getBmdlWMean() {
        return bmdlWMean;
    }

    public void setBmdlWMean(Double bmdlWMean) {
        this.bmdlWMean = bmdlWMean;
    }

    public Double getBmdlWSD() {
        return bmdlWSD;
    }

    public void setBmdlWSD(Double bmdlWSD) {
        this.bmdlWSD = bmdlWSD;
    }

    public Double getBmduWMean() {
        return bmduWMean;
    }

    public void setBmduWMean(Double bmduWMean) {
        this.bmduWMean = bmduWMean;
    }

    public Double getBmduWSD() {
        return bmduWSD;
    }

    public void setBmduWSD(Double bmduWSD) {
        this.bmduWSD = bmduWSD;
    }

    // Additional filter counts getters/setters
    public Integer getGenesWithBMDRSquaredValueGreaterEqualValue() {
        return genesWithBMDRSquaredValueGreaterEqualValue;
    }

    public void setGenesWithBMDRSquaredValueGreaterEqualValue(Integer genesWithBMDRSquaredValueGreaterEqualValue) {
        this.genesWithBMDRSquaredValueGreaterEqualValue = genesWithBMDRSquaredValueGreaterEqualValue;
    }

    public Integer getGenesWithBMDBMDLRatioBelowValue() {
        return genesWithBMDBMDLRatioBelowValue;
    }

    public void setGenesWithBMDBMDLRatioBelowValue(Integer genesWithBMDBMDLRatioBelowValue) {
        this.genesWithBMDBMDLRatioBelowValue = genesWithBMDBMDLRatioBelowValue;
    }

    public Integer getGenesWithBMDUBMDLRatioBelowValue() {
        return genesWithBMDUBMDLRatioBelowValue;
    }

    public void setGenesWithBMDUBMDLRatioBelowValue(Integer genesWithBMDUBMDLRatioBelowValue) {
        this.genesWithBMDUBMDLRatioBelowValue = genesWithBMDUBMDLRatioBelowValue;
    }

    public Integer getGenesWithBMDUBMDRatioBelowValue() {
        return genesWithBMDUBMDRatioBelowValue;
    }

    public void setGenesWithBMDUBMDRatioBelowValue(Integer genesWithBMDUBMDRatioBelowValue) {
        this.genesWithBMDUBMDRatioBelowValue = genesWithBMDUBMDRatioBelowValue;
    }

    public Integer getGenesWithNFoldBelowLowPostiveDoseValue() {
        return genesWithNFoldBelowLowPostiveDoseValue;
    }

    public void setGenesWithNFoldBelowLowPostiveDoseValue(Integer genesWithNFoldBelowLowPostiveDoseValue) {
        this.genesWithNFoldBelowLowPostiveDoseValue = genesWithNFoldBelowLowPostiveDoseValue;
    }

    public Integer getGenesWithPrefilterPValueAboveValue() {
        return genesWithPrefilterPValueAboveValue;
    }

    public void setGenesWithPrefilterPValueAboveValue(Integer genesWithPrefilterPValueAboveValue) {
        this.genesWithPrefilterPValueAboveValue = genesWithPrefilterPValueAboveValue;
    }

    public Integer getGenesWithPrefilterAdjustedPValueAboveValue() {
        return genesWithPrefilterAdjustedPValueAboveValue;
    }

    public void setGenesWithPrefilterAdjustedPValueAboveValue(Integer genesWithPrefilterAdjustedPValueAboveValue) {
        this.genesWithPrefilterAdjustedPValueAboveValue = genesWithPrefilterAdjustedPValueAboveValue;
    }

    public Integer getGenesNotStepFunction() {
        return genesNotStepFunction;
    }

    public void setGenesNotStepFunction(Integer genesNotStepFunction) {
        this.genesNotStepFunction = genesNotStepFunction;
    }

    public Integer getGenesNotStepFunctionWithBMDLower() {
        return genesNotStepFunctionWithBMDLower;
    }

    public void setGenesNotStepFunctionWithBMDLower(Integer genesNotStepFunctionWithBMDLower) {
        this.genesNotStepFunctionWithBMDLower = genesNotStepFunctionWithBMDLower;
    }

    public Integer getGenesNotAdverseDirection() {
        return genesNotAdverseDirection;
    }

    public void setGenesNotAdverseDirection(Integer genesNotAdverseDirection) {
        this.genesNotAdverseDirection = genesNotAdverseDirection;
    }

    public Integer getGenesWithABSZScoreAboveValue() {
        return genesWithABSZScoreAboveValue;
    }

    public void setGenesWithABSZScoreAboveValue(Integer genesWithABSZScoreAboveValue) {
        this.genesWithABSZScoreAboveValue = genesWithABSZScoreAboveValue;
    }

    public Integer getGenesWithABSModelFCAboveValue() {
        return genesWithABSModelFCAboveValue;
    }

    public void setGenesWithABSModelFCAboveValue(Integer genesWithABSModelFCAboveValue) {
        this.genesWithABSModelFCAboveValue = genesWithABSModelFCAboveValue;
    }

    // Percentile values getters/setters
    public Double getBmdFifthPercentileTotalGenes() {
        return bmdFifthPercentileTotalGenes;
    }

    public void setBmdFifthPercentileTotalGenes(Double bmdFifthPercentileTotalGenes) {
        this.bmdFifthPercentileTotalGenes = bmdFifthPercentileTotalGenes;
    }

    public Double getBmdTenthPercentileTotalGenes() {
        return bmdTenthPercentileTotalGenes;
    }

    public void setBmdTenthPercentileTotalGenes(Double bmdTenthPercentileTotalGenes) {
        this.bmdTenthPercentileTotalGenes = bmdTenthPercentileTotalGenes;
    }

    public Double getBmdlFifthPercentileTotalGenes() {
        return bmdlFifthPercentileTotalGenes;
    }

    public void setBmdlFifthPercentileTotalGenes(Double bmdlFifthPercentileTotalGenes) {
        this.bmdlFifthPercentileTotalGenes = bmdlFifthPercentileTotalGenes;
    }

    public Double getBmdlTenthPercentileTotalGenes() {
        return bmdlTenthPercentileTotalGenes;
    }

    public void setBmdlTenthPercentileTotalGenes(Double bmdlTenthPercentileTotalGenes) {
        this.bmdlTenthPercentileTotalGenes = bmdlTenthPercentileTotalGenes;
    }

    public Double getBmduFifthPercentileTotalGenes() {
        return bmduFifthPercentileTotalGenes;
    }

    public void setBmduFifthPercentileTotalGenes(Double bmduFifthPercentileTotalGenes) {
        this.bmduFifthPercentileTotalGenes = bmduFifthPercentileTotalGenes;
    }

    public Double getBmduTenthPercentileTotalGenes() {
        return bmduTenthPercentileTotalGenes;
    }

    public void setBmduTenthPercentileTotalGenes(Double bmduTenthPercentileTotalGenes) {
        this.bmduTenthPercentileTotalGenes = bmduTenthPercentileTotalGenes;
    }

    // Direction-specific statistics (UP genes) getters/setters
    public Double getGenesUpBMDMean() {
        return genesUpBMDMean;
    }

    public void setGenesUpBMDMean(Double genesUpBMDMean) {
        this.genesUpBMDMean = genesUpBMDMean;
    }

    public Double getGenesUpBMDMedian() {
        return genesUpBMDMedian;
    }

    public void setGenesUpBMDMedian(Double genesUpBMDMedian) {
        this.genesUpBMDMedian = genesUpBMDMedian;
    }

    public Double getGenesUpBMDSD() {
        return genesUpBMDSD;
    }

    public void setGenesUpBMDSD(Double genesUpBMDSD) {
        this.genesUpBMDSD = genesUpBMDSD;
    }

    public Double getGenesUpBMDLMean() {
        return genesUpBMDLMean;
    }

    public void setGenesUpBMDLMean(Double genesUpBMDLMean) {
        this.genesUpBMDLMean = genesUpBMDLMean;
    }

    public Double getGenesUpBMDLMedian() {
        return genesUpBMDLMedian;
    }

    public void setGenesUpBMDLMedian(Double genesUpBMDLMedian) {
        this.genesUpBMDLMedian = genesUpBMDLMedian;
    }

    public Double getGenesUpBMDLSD() {
        return genesUpBMDLSD;
    }

    public void setGenesUpBMDLSD(Double genesUpBMDLSD) {
        this.genesUpBMDLSD = genesUpBMDLSD;
    }

    public Double getGenesUpBMDUMean() {
        return genesUpBMDUMean;
    }

    public void setGenesUpBMDUMean(Double genesUpBMDUMean) {
        this.genesUpBMDUMean = genesUpBMDUMean;
    }

    public Double getGenesUpBMDUMedian() {
        return genesUpBMDUMedian;
    }

    public void setGenesUpBMDUMedian(Double genesUpBMDUMedian) {
        this.genesUpBMDUMedian = genesUpBMDUMedian;
    }

    public Double getGenesUpBMDUSD() {
        return genesUpBMDUSD;
    }

    public void setGenesUpBMDUSD(Double genesUpBMDUSD) {
        this.genesUpBMDUSD = genesUpBMDUSD;
    }

    // Direction-specific statistics (DOWN genes) getters/setters
    public Double getGenesDownBMDMean() {
        return genesDownBMDMean;
    }

    public void setGenesDownBMDMean(Double genesDownBMDMean) {
        this.genesDownBMDMean = genesDownBMDMean;
    }

    public Double getGenesDownBMDMedian() {
        return genesDownBMDMedian;
    }

    public void setGenesDownBMDMedian(Double genesDownBMDMedian) {
        this.genesDownBMDMedian = genesDownBMDMedian;
    }

    public Double getGenesDownBMDSD() {
        return genesDownBMDSD;
    }

    public void setGenesDownBMDSD(Double genesDownBMDSD) {
        this.genesDownBMDSD = genesDownBMDSD;
    }

    public Double getGenesDownBMDLMean() {
        return genesDownBMDLMean;
    }

    public void setGenesDownBMDLMean(Double genesDownBMDLMean) {
        this.genesDownBMDLMean = genesDownBMDLMean;
    }

    public Double getGenesDownBMDLMedian() {
        return genesDownBMDLMedian;
    }

    public void setGenesDownBMDLMedian(Double genesDownBMDLMedian) {
        this.genesDownBMDLMedian = genesDownBMDLMedian;
    }

    public Double getGenesDownBMDLSD() {
        return genesDownBMDLSD;
    }

    public void setGenesDownBMDLSD(Double genesDownBMDLSD) {
        this.genesDownBMDLSD = genesDownBMDLSD;
    }

    public Double getGenesDownBMDUMean() {
        return genesDownBMDUMean;
    }

    public void setGenesDownBMDUMean(Double genesDownBMDUMean) {
        this.genesDownBMDUMean = genesDownBMDUMean;
    }

    public Double getGenesDownBMDUMedian() {
        return genesDownBMDUMedian;
    }

    public void setGenesDownBMDUMedian(Double genesDownBMDUMedian) {
        this.genesDownBMDUMedian = genesDownBMDUMedian;
    }

    public Double getGenesDownBMDUSD() {
        return genesDownBMDUSD;
    }

    public void setGenesDownBMDUSD(Double genesDownBMDUSD) {
        this.genesDownBMDUSD = genesDownBMDUSD;
    }

    // Directional analysis getters/setters
    public String getOverallDirection() {
        return overallDirection;
    }

    public void setOverallDirection(String overallDirection) {
        this.overallDirection = overallDirection;
    }

    public Double getPercentWithOverallDirectionUP() {
        return percentWithOverallDirectionUP;
    }

    public void setPercentWithOverallDirectionUP(Double percentWithOverallDirectionUP) {
        this.percentWithOverallDirectionUP = percentWithOverallDirectionUP;
    }

    public Double getPercentWithOverallDirectionDOWN() {
        return percentWithOverallDirectionDOWN;
    }

    public void setPercentWithOverallDirectionDOWN(Double percentWithOverallDirectionDOWN) {
        this.percentWithOverallDirectionDOWN = percentWithOverallDirectionDOWN;
    }

    public Double getPercentWithOverallDirectionConflict() {
        return percentWithOverallDirectionConflict;
    }

    public void setPercentWithOverallDirectionConflict(Double percentWithOverallDirectionConflict) {
        this.percentWithOverallDirectionConflict = percentWithOverallDirectionConflict;
    }

    // Fold change statistics getters/setters
    public Double getTotalFoldChange() {
        return totalFoldChange;
    }

    public void setTotalFoldChange(Double totalFoldChange) {
        this.totalFoldChange = totalFoldChange;
    }

    public Double getMeanFoldChange() {
        return meanFoldChange;
    }

    public void setMeanFoldChange(Double meanFoldChange) {
        this.meanFoldChange = meanFoldChange;
    }

    public Double getMedianFoldChange() {
        return medianFoldChange;
    }

    public void setMedianFoldChange(Double medianFoldChange) {
        this.medianFoldChange = medianFoldChange;
    }

    public Double getMaxFoldChange() {
        return maxFoldChange;
    }

    public void setMaxFoldChange(Double maxFoldChange) {
        this.maxFoldChange = maxFoldChange;
    }

    public Double getMinFoldChange() {
        return minFoldChange;
    }

    public void setMinFoldChange(Double minFoldChange) {
        this.minFoldChange = minFoldChange;
    }

    public Double getStdDevFoldChange() {
        return stdDevFoldChange;
    }

    public void setStdDevFoldChange(Double stdDevFoldChange) {
        this.stdDevFoldChange = stdDevFoldChange;
    }

    // 95% Confidence intervals getters/setters
    public Double getBmdLower95() {
        return bmdLower95;
    }

    public void setBmdLower95(Double bmdLower95) {
        this.bmdLower95 = bmdLower95;
    }

    public Double getBmdUpper95() {
        return bmdUpper95;
    }

    public void setBmdUpper95(Double bmdUpper95) {
        this.bmdUpper95 = bmdUpper95;
    }

    public Double getBmdlLower95() {
        return bmdlLower95;
    }

    public void setBmdlLower95(Double bmdlLower95) {
        this.bmdlLower95 = bmdlLower95;
    }

    public Double getBmdlUpper95() {
        return bmdlUpper95;
    }

    public void setBmdlUpper95(Double bmdlUpper95) {
        this.bmdlUpper95 = bmdlUpper95;
    }

    public Double getBmduLower95() {
        return bmduLower95;
    }

    public void setBmduLower95(Double bmduLower95) {
        this.bmduLower95 = bmduLower95;
    }

    public Double getBmduUpper95() {
        return bmduUpper95;
    }

    public void setBmduUpper95(Double bmduUpper95) {
        this.bmduUpper95 = bmduUpper95;
    }

    // Z-Score statistics getters/setters
    public Double getMinZScore() {
        return minZScore;
    }

    public void setMinZScore(Double minZScore) {
        this.minZScore = minZScore;
    }

    public Double getMedianZScore() {
        return medianZScore;
    }

    public void setMedianZScore(Double medianZScore) {
        this.medianZScore = medianZScore;
    }

    public Double getMaxZScore() {
        return maxZScore;
    }

    public void setMaxZScore(Double maxZScore) {
        this.maxZScore = maxZScore;
    }

    public Double getMeanZScore() {
        return meanZScore;
    }

    public void setMeanZScore(Double meanZScore) {
        this.meanZScore = meanZScore;
    }

    // Model fold change statistics getters/setters
    public Double getMinModelFoldChange() {
        return minModelFoldChange;
    }

    public void setMinModelFoldChange(Double minModelFoldChange) {
        this.minModelFoldChange = minModelFoldChange;
    }

    public Double getMedianModelFoldChange() {
        return medianModelFoldChange;
    }

    public void setMedianModelFoldChange(Double medianModelFoldChange) {
        this.medianModelFoldChange = medianModelFoldChange;
    }

    public Double getMaxModelFoldChange() {
        return maxModelFoldChange;
    }

    public void setMaxModelFoldChange(Double maxModelFoldChange) {
        this.maxModelFoldChange = maxModelFoldChange;
    }

    public Double getMeanModelFoldChange() {
        return meanModelFoldChange;
    }

    public void setMeanModelFoldChange(Double meanModelFoldChange) {
        this.meanModelFoldChange = meanModelFoldChange;
    }

    // Gene lists getters/setters
    public String getGenes() {
        return genes;
    }

    public void setGenes(String genes) {
        this.genes = genes;
    }

    public String getGeneSymbols() {
        return geneSymbols;
    }

    public void setGeneSymbols(String geneSymbols) {
        this.geneSymbols = geneSymbols;
    }
}
