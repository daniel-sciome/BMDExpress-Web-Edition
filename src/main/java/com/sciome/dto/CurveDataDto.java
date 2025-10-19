package com.sciome.dto;

import java.util.List;

/**
 * Represents complete data for rendering one dose-response curve.
 * Contains measured data points, interpolated curve points, and BMD markers.
 */
public class CurveDataDto {

    /**
     * Unique identifier for this curve (e.g., "GENE_PROBE_001")
     */
    private String curveId;

    /**
     * Gene symbol (e.g., "TP53")
     */
    private String geneSymbol;

    /**
     * Probe identifier (e.g., "Probe_12345")
     */
    private String probeId;

    /**
     * Chemical/treatment name
     */
    private String chemical;

    /**
     * Pathway or GO term identifier
     */
    private String pathwayId;

    /**
     * Pathway or GO term description
     */
    private String pathwayDescription;

    /**
     * Statistical model used for curve fitting (e.g., "Hill", "Polynomial", "Power")
     */
    private String fittedModel;

    /**
     * Measured data points (actual experimental measurements)
     */
    private List<DosePointDto> measuredPoints;

    /**
     * Interpolated curve points (190 points for smooth curve rendering)
     */
    private List<DosePointDto> curvePoints;

    /**
     * BMD confidence markers (BMD, BMDL, BMDU)
     */
    private BMDMarkersDto bmdMarkers;

    /**
     * Curve color for multi-chemical display (e.g., "RED", "BLUE", "BLACK", "GREEN")
     */
    private String color;

    /**
     * Whether to show this curve (for filtering)
     */
    private Boolean visible;

    /**
     * Additional metadata
     */
    private Double bestBMD;
    private Double bestBMDL;
    private Double bestBMDU;
    private Double pValue;
    private Double aic;

    // Constructors

    public CurveDataDto() {
        this.visible = true;
    }

    public CurveDataDto(String curveId, String geneSymbol, String probeId) {
        this.curveId = curveId;
        this.geneSymbol = geneSymbol;
        this.probeId = probeId;
        this.visible = true;
    }

    // Getters and Setters

    public String getCurveId() {
        return curveId;
    }

    public void setCurveId(String curveId) {
        this.curveId = curveId;
    }

    public String getGeneSymbol() {
        return geneSymbol;
    }

    public void setGeneSymbol(String geneSymbol) {
        this.geneSymbol = geneSymbol;
    }

    public String getProbeId() {
        return probeId;
    }

    public void setProbeId(String probeId) {
        this.probeId = probeId;
    }

    public String getChemical() {
        return chemical;
    }

    public void setChemical(String chemical) {
        this.chemical = chemical;
    }

    public String getPathwayId() {
        return pathwayId;
    }

    public void setPathwayId(String pathwayId) {
        this.pathwayId = pathwayId;
    }

    public String getPathwayDescription() {
        return pathwayDescription;
    }

    public void setPathwayDescription(String pathwayDescription) {
        this.pathwayDescription = pathwayDescription;
    }

    public String getFittedModel() {
        return fittedModel;
    }

    public void setFittedModel(String fittedModel) {
        this.fittedModel = fittedModel;
    }

    public List<DosePointDto> getMeasuredPoints() {
        return measuredPoints;
    }

    public void setMeasuredPoints(List<DosePointDto> measuredPoints) {
        this.measuredPoints = measuredPoints;
    }

    public List<DosePointDto> getCurvePoints() {
        return curvePoints;
    }

    public void setCurvePoints(List<DosePointDto> curvePoints) {
        this.curvePoints = curvePoints;
    }

    public BMDMarkersDto getBmdMarkers() {
        return bmdMarkers;
    }

    public void setBmdMarkers(BMDMarkersDto bmdMarkers) {
        this.bmdMarkers = bmdMarkers;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public Double getBestBMD() {
        return bestBMD;
    }

    public void setBestBMD(Double bestBMD) {
        this.bestBMD = bestBMD;
    }

    public Double getBestBMDL() {
        return bestBMDL;
    }

    public void setBestBMDL(Double bestBMDL) {
        this.bestBMDL = bestBMDL;
    }

    public Double getBestBMDU() {
        return bestBMDU;
    }

    public void setBestBMDU(Double bestBMDU) {
        this.bestBMDU = bestBMDU;
    }

    public Double getpValue() {
        return pValue;
    }

    public void setpValue(Double pValue) {
        this.pValue = pValue;
    }

    public Double getAic() {
        return aic;
    }

    public void setAic(Double aic) {
        this.aic = aic;
    }

    @Override
    public String toString() {
        return "CurveDataDto{" +
                "curveId='" + curveId + '\'' +
                ", geneSymbol='" + geneSymbol + '\'' +
                ", probeId='" + probeId + '\'' +
                ", chemical='" + chemical + '\'' +
                ", pathwayId='" + pathwayId + '\'' +
                ", fittedModel='" + fittedModel + '\'' +
                ", measuredPoints=" + (measuredPoints != null ? measuredPoints.size() : 0) +
                ", curvePoints=" + (curvePoints != null ? curvePoints.size() : 0) +
                '}';
    }
}
