package com.sciome.dto.prefilter;

/**
 * Input parameters for Curve Fit Prefilter analysis
 * Fits BMD models to each probe and filters based on successful model fits
 * Provides early BMD estimates during the prefilter stage
 */
public class CurveFitPrefilterInput extends PrefilterInput {

    // ========================================
    // MODEL SELECTION (at least one must be true)
    // ========================================

    /**
     * Fit Hill model (4-parameter sigmoid)
     * Default: false
     */
    private Boolean isHill = false;

    /**
     * Fit Power model
     * Default: false
     */
    private Boolean isPower = false;

    /**
     * Fit Exponential 3-parameter model
     * Default: false
     */
    private Boolean isExp3 = false;

    /**
     * Fit Exponential 5-parameter model
     * Default: false
     */
    private Boolean isExp5 = false;

    /**
     * Fit Linear model
     * Default: false
     */
    private Boolean isLinear = false;

    /**
     * Fit Polynomial 2nd degree model
     * Default: false
     */
    private Boolean isPoly2 = false;

    // ========================================
    // VARIANCE MODELING
    // ========================================

    /**
     * Variance type
     * true = constant variance (simpler model)
     * false = non-constant variance (modeled)
     * Default: false
     */
    private Boolean constantVariance = false;

    // ========================================
    // BMR (Benchmark Response) SETTINGS
    // ========================================

    /**
     * BMR Factor settings
     * Defines the benchmark response level
     */
    private BMRFactor bmrFactor;

    /**
     * Optional: Separate BMR factor for Poly2 model
     * If null, uses bmrFactor for all models
     */
    private BMRFactor poly2BMRFactor;

    public CurveFitPrefilterInput() {
        super();
    }

    // Getters and Setters
    public Boolean getIsHill() {
        return isHill;
    }

    public void setIsHill(Boolean isHill) {
        this.isHill = isHill;
    }

    public Boolean getIsPower() {
        return isPower;
    }

    public void setIsPower(Boolean isPower) {
        this.isPower = isPower;
    }

    public Boolean getIsExp3() {
        return isExp3;
    }

    public void setIsExp3(Boolean isExp3) {
        this.isExp3 = isExp3;
    }

    public Boolean getIsExp5() {
        return isExp5;
    }

    public void setIsExp5(Boolean isExp5) {
        this.isExp5 = isExp5;
    }

    public Boolean getIsLinear() {
        return isLinear;
    }

    public void setIsLinear(Boolean isLinear) {
        this.isLinear = isLinear;
    }

    public Boolean getIsPoly2() {
        return isPoly2;
    }

    public void setIsPoly2(Boolean isPoly2) {
        this.isPoly2 = isPoly2;
    }

    public Boolean getConstantVariance() {
        return constantVariance;
    }

    public void setConstantVariance(Boolean constantVariance) {
        this.constantVariance = constantVariance;
    }

    public BMRFactor getBmrFactor() {
        return bmrFactor;
    }

    public void setBmrFactor(BMRFactor bmrFactor) {
        this.bmrFactor = bmrFactor;
    }

    public BMRFactor getPoly2BMRFactor() {
        return poly2BMRFactor;
    }

    public void setPoly2BMRFactor(BMRFactor poly2BMRFactor) {
        this.poly2BMRFactor = poly2BMRFactor;
    }

    /**
     * BMR Factor DTO
     * Defines the benchmark response level for BMD calculation
     */
    public static class BMRFactor {
        /**
         * BMR value
         * Example: 1.349 for 1-SD change
         */
        private Double value;

        /**
         * BMR type
         * Options: "SD" (standard deviation), "REL_DEV" (relative deviation), "ABS_DEV" (absolute deviation)
         */
        private String type;

        public BMRFactor() {
        }

        public BMRFactor(Double value, String type) {
            this.value = value;
            this.type = type;
        }

        public Double getValue() {
            return value;
        }

        public void setValue(Double value) {
            this.value = value;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }
}
