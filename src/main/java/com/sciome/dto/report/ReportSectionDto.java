package com.sciome.dto.report;

import java.util.ArrayList;
import java.util.List;

public class ReportSectionDto {
    private String id;
    private String parentId;
    private String title;
    private int order;
    private String sectionType;
    private String purpose;
    private String content; // HTML
    private String status; // draft | reviewed | final
    private List<DataAttachmentDto> dataAttachments = new ArrayList<>();
    private List<ChartSnapshotDto> chartSnapshots = new ArrayList<>();
    private List<String> clinicalDatasetIds = new ArrayList<>();

    public ReportSectionDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public String getSectionType() {
        return sectionType;
    }

    public void setSectionType(String sectionType) {
        this.sectionType = sectionType;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<DataAttachmentDto> getDataAttachments() {
        return dataAttachments;
    }

    public void setDataAttachments(List<DataAttachmentDto> dataAttachments) {
        this.dataAttachments = dataAttachments;
    }

    public List<ChartSnapshotDto> getChartSnapshots() {
        return chartSnapshots;
    }

    public void setChartSnapshots(List<ChartSnapshotDto> chartSnapshots) {
        this.chartSnapshots = chartSnapshots;
    }

    public List<String> getClinicalDatasetIds() {
        return clinicalDatasetIds;
    }

    public void setClinicalDatasetIds(List<String> clinicalDatasetIds) {
        this.clinicalDatasetIds = clinicalDatasetIds;
    }
}
