package com.sciome.dto.report;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportDto {
    private String id;
    private String title;
    private String projectId;
    private String templateName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ReportSectionDto> sections = new ArrayList<>();
    private List<ClinicalDatasetDto> clinicalDatasets = new ArrayList<>();
    private Map<String, String> metadata = new HashMap<>();

    public ReportDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ReportSectionDto> getSections() {
        return sections;
    }

    public void setSections(List<ReportSectionDto> sections) {
        this.sections = sections;
    }

    public List<ClinicalDatasetDto> getClinicalDatasets() {
        return clinicalDatasets;
    }

    public void setClinicalDatasets(List<ClinicalDatasetDto> clinicalDatasets) {
        this.clinicalDatasets = clinicalDatasets;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
    }
}
