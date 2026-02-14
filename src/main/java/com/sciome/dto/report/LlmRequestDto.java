package com.sciome.dto.report;

public class LlmRequestDto {
    private String reportId;
    private String sectionId;
    private String provider;
    private String apiKey; // per-request, never stored
    private String model;
    private String instruction;
    private boolean includeAdjacentSections;
    private Double temperature;
    private Integer maxTokens;

    public LlmRequestDto() {
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String reportId) {
        this.reportId = reportId;
    }

    public String getSectionId() {
        return sectionId;
    }

    public void setSectionId(String sectionId) {
        this.sectionId = sectionId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public boolean isIncludeAdjacentSections() {
        return includeAdjacentSections;
    }

    public void setIncludeAdjacentSections(boolean includeAdjacentSections) {
        this.includeAdjacentSections = includeAdjacentSections;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }
}
