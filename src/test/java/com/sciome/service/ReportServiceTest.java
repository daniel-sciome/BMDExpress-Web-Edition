package com.sciome.service;

import com.sciome.config.ReportConfig;
import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportMetadataDto;
import com.sciome.dto.report.ReportSectionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReportServiceTest {

    @TempDir
    Path tempDir;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        ReportConfig config = new ReportConfig();
        config.setDir(tempDir.toString());
        ReportStorageService storageService = new ReportStorageService(config);
        ReportTemplateProvider templateProvider = new ReportTemplateProvider();
        reportService = new ReportService(storageService, templateProvider);
    }

    @Test
    void createReportWithTemplate() {
        ReportDto report = reportService.createReport("project-1", "EPA BMD Guidance", "Test Report");

        assertNotNull(report.getId());
        assertEquals("Test Report", report.getTitle());
        assertEquals("project-1", report.getProjectId());
        assertEquals("EPA BMD Guidance", report.getTemplateName());
        assertFalse(report.getSections().isEmpty());
    }

    @Test
    void createBlankReport() {
        ReportDto report = reportService.createReport("project-1", "Blank", "Blank Report");

        assertTrue(report.getSections().isEmpty());
    }

    @Test
    void getAndSaveReport() {
        ReportDto created = reportService.createReport("project-1", "Blank", "My Report");
        ReportDto loaded = reportService.getReport(created.getId());
        assertEquals("My Report", loaded.getTitle());

        loaded.setTitle("Updated Title");
        reportService.saveReport(loaded);

        ReportDto reloaded = reportService.getReport(created.getId());
        assertEquals("Updated Title", reloaded.getTitle());
    }

    @Test
    void listReports() {
        reportService.createReport("p1", "Blank", "Report A");
        reportService.createReport("p2", "Blank", "Report B");

        List<ReportMetadataDto> list = reportService.listReports();
        assertEquals(2, list.size());
    }

    @Test
    void listReportsForProject() {
        reportService.createReport("p1", "Blank", "Report A");
        reportService.createReport("p2", "Blank", "Report B");
        reportService.createReport("p1", "Blank", "Report C");

        List<ReportMetadataDto> p1Reports = reportService.listReportsForProject("p1");
        assertEquals(2, p1Reports.size());
    }

    @Test
    void deleteReport() {
        ReportDto report = reportService.createReport("p1", "Blank", "To Delete");
        reportService.deleteReport(report.getId());

        assertThrows(RuntimeException.class, () -> reportService.getReport(report.getId()));
    }

    @Test
    void addSection() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");

        ReportSectionDto section = new ReportSectionDto();
        section.setTitle("New Section");
        section.setSectionType("overview");

        ReportDto updated = reportService.addSection(report.getId(), section);
        assertEquals(1, updated.getSections().size());
        assertNotNull(updated.getSections().get(0).getId());
    }

    @Test
    void deleteSection() {
        ReportDto report = reportService.createReport("p1", "EPA BMD Guidance", "Test");
        int originalCount = report.getSections().size();
        assertTrue(originalCount > 0);

        // Delete a root section (should cascade to children)
        String rootId = report.getSections().stream()
                .filter(s -> s.getParentId() == null)
                .findFirst()
                .map(ReportSectionDto::getId)
                .orElseThrow();

        ReportDto updated = reportService.deleteSection(report.getId(), rootId);
        assertTrue(updated.getSections().size() < originalCount);
    }

    @Test
    void reorderSections() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");

        ReportSectionDto s1 = new ReportSectionDto();
        s1.setTitle("First");
        s1.setSectionType("overview");
        report = reportService.addSection(report.getId(), s1);

        ReportSectionDto s2 = new ReportSectionDto();
        s2.setTitle("Second");
        s2.setSectionType("overview");
        report = reportService.addSection(report.getId(), s2);

        List<String> reversed = List.of(
                report.getSections().get(1).getId(),
                report.getSections().get(0).getId()
        );

        ReportDto reordered = reportService.reorderSections(report.getId(), reversed);
        assertEquals(0, reordered.getSections().stream()
                .filter(s -> s.getId().equals(reversed.get(0)))
                .findFirst().orElseThrow().getOrder());
    }

    @Test
    void getAvailableTemplates() {
        List<String> templates = reportService.getAvailableTemplates();
        assertTrue(templates.contains("EPA BMD Guidance"));
        assertTrue(templates.contains("ICH General Tox"));
        assertTrue(templates.contains("OECD TG"));
        assertTrue(templates.contains("Blank"));
    }
}
