package com.sciome.dto.prefilter;

/**
 * Input parameters for Oriogen prefilter analysis
 * Bootstrap-based shrinkage estimator for identifying dose-responsive genes
 * Particularly useful for high variance data or small sample sizes
 */
public class OriogenInput extends PrefilterInput {

    /**
     * Initial number of bootstrap samples
     * Default: 500
     * These bootstrap samples are always performed
     */
    private Integer numInitialBootstraps = 500;

    /**
     * Maximum number of bootstrap samples
     * Default: 1000
     * Additional samples performed if initial samples haven't converged
     */
    private Integer numMaximumBootstraps = 1000;

    /**
     * Shrinkage adjustment percentile
     * Default: 5.0
     * Range: 0.0-100.0
     * Lower percentile for shrinkage variance estimation
     */
    private Double shrinkagePercentile = 5.0;

    public OriogenInput() {
        super();
    }

    public Integer getNumInitialBootstraps() {
        return numInitialBootstraps;
    }

    public void setNumInitialBootstraps(Integer numInitialBootstraps) {
        this.numInitialBootstraps = numInitialBootstraps;
    }

    public Integer getNumMaximumBootstraps() {
        return numMaximumBootstraps;
    }

    public void setNumMaximumBootstraps(Integer numMaximumBootstraps) {
        this.numMaximumBootstraps = numMaximumBootstraps;
    }

    public Double getShrinkagePercentile() {
        return shrinkagePercentile;
    }

    public void setShrinkagePercentile(Double shrinkagePercentile) {
        this.shrinkagePercentile = shrinkagePercentile;
    }
}
