package com.sciome.dto.prefilter;

/**
 * Input parameters for Williams Trend Test prefilter analysis
 * Non-parametric permutation-based test for monotonic dose-response trends
 */
public class WilliamsTrendInput extends PrefilterInput {

    /**
     * Number of permutations for permutation test
     * Default: 100
     * Higher values = more accurate p-values but longer computation time
     * Typical range: 100-1000
     */
    private Double numPermutations = 100.0;

    public WilliamsTrendInput() {
        super();
    }

    public Double getNumPermutations() {
        return numPermutations;
    }

    public void setNumPermutations(Double numPermutations) {
        this.numPermutations = numPermutations;
    }
}
