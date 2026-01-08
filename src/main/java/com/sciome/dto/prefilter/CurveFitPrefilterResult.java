package com.sciome.dto.prefilter;

/**
 * Result data for Curve Fit Prefilter analysis
 * Contains BMD model fitting results
 */
public class CurveFitPrefilterResult extends PrefilterResult {

    /**
     * Name of the best-fit model
     * Examples: "Hill", "Power", "Exponential-3", "Exponential-5", "Linear", "Polynomial-2"
     */
    private String bestModel;

    /**
     * Benchmark Dose (BMD)
     * Dose at which the benchmark response is reached
     */
    private Double bmd;

    /**
     * BMD Lower Confidence Limit (BMDL)
     * Lower bound of 95% confidence interval on BMD
     */
    private Double bmdl;

    /**
     * BMD Upper Confidence Limit (BMDU)
     * Upper bound of 95% confidence interval on BMD
     * May be null if not calculated
     */
    private Double bmdu;

    /**
     * Akaike Information Criterion (AIC)
     * Used for model selection (lower is better)
     */
    private Double aic;

    /**
     * Note: pValue in base PrefilterResult represents goodness-of-fit p-value
     */

    public CurveFitPrefilterResult() {
        super();
    }

    public String getBestModel() {
        return bestModel;
    }

    public void setBestModel(String bestModel) {
        this.bestModel = bestModel;
    }

    public Double getBmd() {
        return bmd;
    }

    public void setBmd(Double bmd) {
        this.bmd = bmd;
    }

    public Double getBmdl() {
        return bmdl;
    }

    public void setBmdl(Double bmdl) {
        this.bmdl = bmdl;
    }

    public Double getBmdu() {
        return bmdu;
    }

    public void setBmdu(Double bmdu) {
        this.bmdu = bmdu;
    }

    public Double getAic() {
        return aic;
    }

    public void setAic(Double aic) {
        this.aic = aic;
    }
}
