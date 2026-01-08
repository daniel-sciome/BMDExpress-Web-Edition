package com.sciome.dto.prefilter;

/**
 * Result data for One-Way ANOVA prefilter analysis
 * Contains ANOVA-specific F-statistic and degrees of freedom
 */
public class OneWayANOVAResult extends PrefilterResult {

    /**
     * F-statistic from ANOVA test
     * Ratio of between-group variance to within-group variance
     */
    private Double fValue;

    /**
     * Between-groups degrees of freedom
     * Equals (number of dose groups - 1)
     */
    private Integer degreesOfFreedomOne;

    /**
     * Within-groups degrees of freedom
     * Equals (total samples - number of dose groups)
     */
    private Integer degreesOfFreedomTwo;

    public OneWayANOVAResult() {
        super();
    }

    public Double getfValue() {
        return fValue;
    }

    public void setfValue(Double fValue) {
        this.fValue = fValue;
    }

    public Integer getDegreesOfFreedomOne() {
        return degreesOfFreedomOne;
    }

    public void setDegreesOfFreedomOne(Integer degreesOfFreedomOne) {
        this.degreesOfFreedomOne = degreesOfFreedomOne;
    }

    public Integer getDegreesOfFreedomTwo() {
        return degreesOfFreedomTwo;
    }

    public void setDegreesOfFreedomTwo(Integer degreesOfFreedomTwo) {
        this.degreesOfFreedomTwo = degreesOfFreedomTwo;
    }
}
