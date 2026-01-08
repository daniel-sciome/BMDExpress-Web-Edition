package com.sciome.dto.prefilter;

/**
 * Base class for all prefilter input parameters
 * Contains common parameters shared across all prefilter types
 *
 * Note: No @JsonTypeInfo needed since service methods use concrete types
 */
public abstract class PrefilterInput {

    // ========================================
    // DATA SOURCE
    // ========================================

    /**
     * ID of the dose-response experiment to analyze
     */
    private String doseResponseExperimentId;

    /**
     * User-provided name for the prefilter results
     */
    private String name;

    // ========================================
    // FILTERING PARAMETERS
    // ========================================

    /**
     * Statistical significance threshold
     * Default: 0.05
     * Range: 0.0 - 1.0
     * Applied to adjustedPValue if useBenAndHoch is true, else to pValue
     */
    private Double pValueCutOff = 0.05;

    /**
     * Remove Affymetrix control probes (AFFX- prefix)
     * Default: true
     * Applies to: Affymetrix microarray data only
     */
    private Boolean filterControlGenes = true;

    /**
     * Apply Benjamini-Hochberg FDR correction for multiple testing
     * Default: false
     * When true: pValueCutOff applied to adjustedPValue
     * When false: pValueCutOff applied to raw pValue
     */
    private Boolean useBenAndHoch = false;

    // ========================================
    // FOLD CHANGE PARAMETERS
    // ========================================

    /**
     * Apply fold change filter in addition to p-value filter
     * Default: true
     * Requires: bestFoldChange ≥ foldChangeValue
     */
    private Boolean useFoldChange = true;

    /**
     * Minimum fold change threshold
     * Default: 2.0
     * Range: 1.0 - Infinity
     * Example: 2.0 means at least 2-fold change (up or down)
     */
    private Double foldChangeValue = 2.0;

    // ========================================
    // NOTEL/LOTEL DETERMINATION
    // ========================================

    /**
     * P-value threshold for LOTEL determination
     * Default: 0.05
     * Range: 0.0 - 1.0
     * LOTEL = Lowest Observable Effect Level
     */
    private Double loelPValue = 0.05;

    /**
     * Fold change threshold for LOTEL determination
     * Default: 2.0
     * Range: 1.0 - Infinity
     * LOTEL identified when BOTH conditions met:
     *   1. p-value < loelPValue
     *   2. |fold change| ≥ loelFoldChangeValue
     */
    private Double loelFoldChangeValue = 2.0;

    /**
     * Statistical test for NOTEL/LOTEL determination
     * Default: true (T-Test)
     * true = T-Test (pairwise comparisons)
     * false = Dunnett's Test (multiple comparisons to control)
     */
    private Boolean tTest = true;

    // ========================================
    // EXECUTION PARAMETERS
    // ========================================

    /**
     * Thread pool size for parallel processing
     * Default: 4
     * Range: 1 - Number of CPU cores
     */
    private Integer numThreads = 4;

    // Constructors
    public PrefilterInput() {
    }

    // Getters and Setters
    public String getDoseResponseExperimentId() {
        return doseResponseExperimentId;
    }

    public void setDoseResponseExperimentId(String doseResponseExperimentId) {
        this.doseResponseExperimentId = doseResponseExperimentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getpValueCutOff() {
        return pValueCutOff;
    }

    public void setpValueCutOff(Double pValueCutOff) {
        this.pValueCutOff = pValueCutOff;
    }

    public Boolean getFilterControlGenes() {
        return filterControlGenes;
    }

    public void setFilterControlGenes(Boolean filterControlGenes) {
        this.filterControlGenes = filterControlGenes;
    }

    public Boolean getUseBenAndHoch() {
        return useBenAndHoch;
    }

    public void setUseBenAndHoch(Boolean useBenAndHoch) {
        this.useBenAndHoch = useBenAndHoch;
    }

    public Boolean getUseFoldChange() {
        return useFoldChange;
    }

    public void setUseFoldChange(Boolean useFoldChange) {
        this.useFoldChange = useFoldChange;
    }

    public Double getFoldChangeValue() {
        return foldChangeValue;
    }

    public void setFoldChangeValue(Double foldChangeValue) {
        this.foldChangeValue = foldChangeValue;
    }

    public Double getLoelPValue() {
        return loelPValue;
    }

    public void setLoelPValue(Double loelPValue) {
        this.loelPValue = loelPValue;
    }

    public Double getLoelFoldChangeValue() {
        return loelFoldChangeValue;
    }

    public void setLoelFoldChangeValue(Double loelFoldChangeValue) {
        this.loelFoldChangeValue = loelFoldChangeValue;
    }

    public Boolean gettTest() {
        return tTest;
    }

    public void settTest(Boolean tTest) {
        this.tTest = tTest;
    }

    public Integer getNumThreads() {
        return numThreads;
    }

    public void setNumThreads(Integer numThreads) {
        this.numThreads = numThreads;
    }
}
