package com.sciome.dto.prefilter;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.List;

/**
 * Base interface for prefilter result data
 * Contains common fields for all prefilter result types
 */
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = OneWayANOVAResult.class, name = "ANOVA"),
    @JsonSubTypes.Type(value = WilliamsTrendResult.class, name = "WILLIAMS"),
    @JsonSubTypes.Type(value = OriogenResult.class, name = "ORIOGEN"),
    @JsonSubTypes.Type(value = CurveFitPrefilterResult.class, name = "CURVE_FIT")
})
public abstract class PrefilterResult {

    // ========================================
    // PROBE/GENE IDENTIFICATION
    // ========================================

    /**
     * Probe/Feature ID
     */
    private String probeId;

    /**
     * Gene ID (optional, depends on annotation)
     */
    private String geneId;

    /**
     * Gene symbol (optional, depends on annotation)
     */
    private String geneSymbol;

    // ========================================
    // STATISTICAL METRICS (common to all prefilters)
    // ========================================

    /**
     * Raw p-value from statistical test
     */
    private Double pValue;

    /**
     * FDR-corrected p-value (q-value)
     * Calculated using Benjamini-Hochberg method
     */
    private Double adjustedPValue;

    // ========================================
    // FOLD CHANGE METRICS
    // ========================================

    /**
     * Maximum absolute fold change across all dose levels
     * Positive = up-regulation, Negative = down-regulation
     */
    private Double bestFoldChange;

    /**
     * Fold change at each dose level
     * Array index corresponds to dose level index
     * Control dose always has fold change = 1.0
     */
    private List<Double> foldChanges;

    // ========================================
    // NOTEL/LOTEL
    // ========================================

    /**
     * No Observable Effect Level (NOTEL) dose
     * Highest dose where no significant effect observed
     * null if all doses show effect
     */
    private Double noelDose;

    /**
     * Lowest Observable Effect Level (LOTEL) dose
     * Lowest dose where significant effect observed
     * null if no doses show effect
     */
    private Double loelDose;

    /**
     * P-values from NOTEL/LOTEL determination tests
     * Array index corresponds to dose level index
     */
    private List<Double> noelLoelPValues;

    // Constructors
    public PrefilterResult() {
    }

    // Getters and Setters
    public String getProbeId() {
        return probeId;
    }

    public void setProbeId(String probeId) {
        this.probeId = probeId;
    }

    public String getGeneId() {
        return geneId;
    }

    public void setGeneId(String geneId) {
        this.geneId = geneId;
    }

    public String getGeneSymbol() {
        return geneSymbol;
    }

    public void setGeneSymbol(String geneSymbol) {
        this.geneSymbol = geneSymbol;
    }

    public Double getpValue() {
        return pValue;
    }

    public void setpValue(Double pValue) {
        this.pValue = pValue;
    }

    public Double getAdjustedPValue() {
        return adjustedPValue;
    }

    public void setAdjustedPValue(Double adjustedPValue) {
        this.adjustedPValue = adjustedPValue;
    }

    public Double getBestFoldChange() {
        return bestFoldChange;
    }

    public void setBestFoldChange(Double bestFoldChange) {
        this.bestFoldChange = bestFoldChange;
    }

    public List<Double> getFoldChanges() {
        return foldChanges;
    }

    public void setFoldChanges(List<Double> foldChanges) {
        this.foldChanges = foldChanges;
    }

    public Double getNoelDose() {
        return noelDose;
    }

    public void setNoelDose(Double noelDose) {
        this.noelDose = noelDose;
    }

    public Double getLoelDose() {
        return loelDose;
    }

    public void setLoelDose(Double loelDose) {
        this.loelDose = loelDose;
    }

    public List<Double> getNoelLoelPValues() {
        return noelLoelPValues;
    }

    public void setNoelLoelPValues(List<Double> noelLoelPValues) {
        this.noelLoelPValues = noelLoelPValues;
    }
}
