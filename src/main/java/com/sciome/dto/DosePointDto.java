package com.sciome.dto;

/**
 * Represents a single dose-response data point.
 * Used for both actual measured points and interpolated curve points.
 */
public class DosePointDto {

    /**
     * Dose value (mg/kg or other dose units)
     */
    private Double dose;

    /**
     * Response value (typically log2 fold change in expression)
     */
    private Double response;

    /**
     * Whether this is an actual measured point or interpolated
     */
    private Boolean measured;

    // Constructors

    public DosePointDto() {
    }

    public DosePointDto(Double dose, Double response) {
        this.dose = dose;
        this.response = response;
        this.measured = false;
    }

    public DosePointDto(Double dose, Double response, Boolean measured) {
        this.dose = dose;
        this.response = response;
        this.measured = measured;
    }

    // Getters and Setters

    public Double getDose() {
        return dose;
    }

    public void setDose(Double dose) {
        this.dose = dose;
    }

    public Double getResponse() {
        return response;
    }

    public void setResponse(Double response) {
        this.response = response;
    }

    public Boolean getMeasured() {
        return measured;
    }

    public void setMeasured(Boolean measured) {
        this.measured = measured;
    }

    @Override
    public String toString() {
        return "DosePointDto{" +
                "dose=" + dose +
                ", response=" + response +
                ", measured=" + measured +
                '}';
    }
}
