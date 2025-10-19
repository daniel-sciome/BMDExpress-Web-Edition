package com.sciome.dto;

/**
 * Represents BMD (Benchmark Dose) confidence markers for a dose-response curve.
 * These markers are displayed as colored boxes on the curve overlay chart.
 */
public class BMDMarkersDto {

    /**
     * Benchmark Dose - the dose corresponding to a benchmark response
     * Display color: Green
     */
    private Double bmd;

    /**
     * Benchmark Dose Lower confidence limit (95%)
     * Display color: Red
     */
    private Double bmdl;

    /**
     * Benchmark Dose Upper confidence limit (95%)
     * Display color: Blue
     */
    private Double bmdu;

    /**
     * Response value at the BMD point
     */
    private Double bmdResponse;

    /**
     * Response value at the BMDL point
     */
    private Double bmdlResponse;

    /**
     * Response value at the BMDU point
     */
    private Double bmduResponse;

    // Constructors

    public BMDMarkersDto() {
    }

    public BMDMarkersDto(Double bmd, Double bmdl, Double bmdu) {
        this.bmd = bmd;
        this.bmdl = bmdl;
        this.bmdu = bmdu;
    }

    // Getters and Setters

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

    public Double getBmdResponse() {
        return bmdResponse;
    }

    public void setBmdResponse(Double bmdResponse) {
        this.bmdResponse = bmdResponse;
    }

    public Double getBmdlResponse() {
        return bmdlResponse;
    }

    public void setBmdlResponse(Double bmdlResponse) {
        this.bmdlResponse = bmdlResponse;
    }

    public Double getBmduResponse() {
        return bmduResponse;
    }

    public void setBmduResponse(Double bmduResponse) {
        this.bmduResponse = bmduResponse;
    }

    @Override
    public String toString() {
        return "BMDMarkersDto{" +
                "bmd=" + bmd +
                ", bmdl=" + bmdl +
                ", bmdu=" + bmdu +
                '}';
    }
}
