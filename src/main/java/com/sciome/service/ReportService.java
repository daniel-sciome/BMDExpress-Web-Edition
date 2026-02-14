package com.sciome.service;

import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportMetadataDto;
import com.sciome.dto.report.ReportSectionDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@BrowserCallable
@AnonymousAllowed
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final ReportStorageService storageService;
    private final ReportTemplateProvider templateProvider;

    public ReportService(ReportStorageService storageService, ReportTemplateProvider templateProvider) {
        this.storageService = storageService;
        this.templateProvider = templateProvider;
    }

    // --- CRUD Operations ---

    public ReportDto createReport(String projectId, String templateName, String title) {
        ReportDto report = new ReportDto();
        report.setId(UUID.randomUUID().toString());
        report.setProjectId(projectId);
        report.setTemplateName(templateName);
        report.setTitle(title);
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        report.setSections(templateProvider.generateSections(templateName));

        try {
            storageService.save(report);
            log.info("Report created: {} ({})", title, report.getId());
        } catch (IOException e) {
            log.error("Failed to save new report", e);
            throw new RuntimeException("Failed to create report", e);
        }
        return report;
    }

    public ReportDto getReport(String reportId) {
        try {
            return storageService.load(reportId);
        } catch (IOException e) {
            log.error("Failed to load report: {}", reportId, e);
            throw new RuntimeException("Report not found: " + reportId, e);
        }
    }

    public void saveReport(ReportDto report) {
        report.setUpdatedAt(LocalDateTime.now());
        try {
            storageService.save(report);
        } catch (IOException e) {
            log.error("Failed to save report: {}", report.getId(), e);
            throw new RuntimeException("Failed to save report", e);
        }
    }

    public void deleteReport(String reportId) {
        try {
            storageService.delete(reportId);
            log.info("Report deleted: {}", reportId);
        } catch (IOException e) {
            log.error("Failed to delete report: {}", reportId, e);
            throw new RuntimeException("Failed to delete report", e);
        }
    }

    public List<ReportMetadataDto> listReports() {
        try {
            return storageService.list().stream()
                    .map(this::toMetadata)
                    .sorted(Comparator.comparing(ReportMetadataDto::getUpdatedAt,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            log.error("Failed to list reports", e);
            return new ArrayList<>();
        }
    }

    public List<ReportMetadataDto> listReportsForProject(String projectId) {
        return listReports().stream()
                .filter(r -> projectId.equals(r.getProjectId()))
                .collect(Collectors.toList());
    }

    // --- Section Operations ---

    public ReportDto addSection(String reportId, ReportSectionDto section) {
        ReportDto report = getReport(reportId);
        if (section.getId() == null || section.getId().isEmpty()) {
            section.setId(UUID.randomUUID().toString());
        }
        if (section.getStatus() == null) {
            section.setStatus("draft");
        }
        report.getSections().add(section);
        saveReport(report);
        return report;
    }

    public ReportDto updateSection(String reportId, ReportSectionDto updatedSection) {
        ReportDto report = getReport(reportId);
        List<ReportSectionDto> sections = report.getSections();
        for (int i = 0; i < sections.size(); i++) {
            if (sections.get(i).getId().equals(updatedSection.getId())) {
                sections.set(i, updatedSection);
                break;
            }
        }
        saveReport(report);
        return report;
    }

    public ReportDto deleteSection(String reportId, String sectionId) {
        ReportDto report = getReport(reportId);
        // Remove the section and all its children
        Set<String> idsToRemove = new HashSet<>();
        idsToRemove.add(sectionId);
        boolean found = true;
        while (found) {
            found = false;
            for (ReportSectionDto section : report.getSections()) {
                if (section.getParentId() != null && idsToRemove.contains(section.getParentId())
                        && !idsToRemove.contains(section.getId())) {
                    idsToRemove.add(section.getId());
                    found = true;
                }
            }
        }
        report.getSections().removeIf(s -> idsToRemove.contains(s.getId()));
        saveReport(report);
        return report;
    }

    public ReportDto moveSection(String reportId, String sectionId, String newParentId) {
        ReportDto report = getReport(reportId);
        for (ReportSectionDto section : report.getSections()) {
            if (section.getId().equals(sectionId)) {
                section.setParentId(newParentId);
                break;
            }
        }
        saveReport(report);
        return report;
    }

    public ReportDto reorderSections(String reportId, List<String> sectionIds) {
        ReportDto report = getReport(reportId);
        Map<String, ReportSectionDto> sectionMap = new HashMap<>();
        for (ReportSectionDto section : report.getSections()) {
            sectionMap.put(section.getId(), section);
        }
        for (int i = 0; i < sectionIds.size(); i++) {
            ReportSectionDto section = sectionMap.get(sectionIds.get(i));
            if (section != null) {
                section.setOrder(i);
            }
        }
        saveReport(report);
        return report;
    }

    // --- Templates ---

    public List<String> getAvailableTemplates() {
        return templateProvider.getAvailableTemplates();
    }

    public List<ReportSectionDto> getTemplatePreview(String templateName) {
        return templateProvider.generateSections(templateName);
    }

    // --- Helpers ---

    private ReportMetadataDto toMetadata(ReportDto report) {
        ReportMetadataDto meta = new ReportMetadataDto();
        meta.setId(report.getId());
        meta.setTitle(report.getTitle());
        meta.setProjectId(report.getProjectId());
        meta.setTemplateName(report.getTemplateName());
        meta.setCreatedAt(report.getCreatedAt());
        meta.setUpdatedAt(report.getUpdatedAt());

        List<ReportSectionDto> sections = report.getSections();
        meta.setSectionCount(sections != null ? sections.size() : 0);

        if (sections != null && !sections.isEmpty()) {
            long totalLeafSections = sections.stream()
                    .filter(s -> sections.stream().noneMatch(c -> s.getId().equals(c.getParentId())))
                    .count();
            long completedSections = sections.stream()
                    .filter(s -> sections.stream().noneMatch(c -> s.getId().equals(c.getParentId())))
                    .filter(s -> s.getContent() != null && !s.getContent().isBlank())
                    .count();
            meta.setCompletionPercent(totalLeafSections > 0
                    ? (int) (100 * completedSections / totalLeafSections) : 0);
        }

        return meta;
    }
}
