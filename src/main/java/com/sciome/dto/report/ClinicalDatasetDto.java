package com.sciome.dto.report;

import java.util.ArrayList;
import java.util.List;

public class ClinicalDatasetDto {
    private String id;
    private String name;
    private String source; // upload | manual | narrative
    private List<ClinicalEndpointDto> endpoints = new ArrayList<>();
    private String narrativeSummary;

    public ClinicalDatasetDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public List<ClinicalEndpointDto> getEndpoints() {
        return endpoints;
    }

    public void setEndpoints(List<ClinicalEndpointDto> endpoints) {
        this.endpoints = endpoints;
    }

    public String getNarrativeSummary() {
        return narrativeSummary;
    }

    public void setNarrativeSummary(String narrativeSummary) {
        this.narrativeSummary = narrativeSummary;
    }
}
