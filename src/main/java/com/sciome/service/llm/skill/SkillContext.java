package com.sciome.service.llm.skill;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportSectionDto;

public class SkillContext {
    private final String projectId;
    private final BMDProject project;
    private final ReportDto report;
    private final ReportSectionDto section;

    public SkillContext(String projectId, BMDProject project,
                        ReportDto report, ReportSectionDto section) {
        this.projectId = projectId;
        this.project = project;
        this.report = report;
        this.section = section;
    }

    public String getProjectId() {
        return projectId;
    }

    public BMDProject getProject() {
        return project;
    }

    public ReportDto getReport() {
        return report;
    }

    public ReportSectionDto getSection() {
        return section;
    }
}
