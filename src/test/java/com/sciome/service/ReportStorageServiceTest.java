package com.sciome.service;

import com.sciome.config.ReportConfig;
import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportSectionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReportStorageServiceTest {

    @TempDir
    Path tempDir;

    private ReportStorageService storageService;

    @BeforeEach
    void setUp() {
        ReportConfig config = new ReportConfig();
        config.setDir(tempDir.toString());
        storageService = new ReportStorageService(config);
    }

    @Test
    void saveAndLoadRoundTrip() throws Exception {
        ReportDto report = createTestReport("test-1");
        storageService.save(report);

        ReportDto loaded = storageService.load("test-1");

        assertEquals("test-1", loaded.getId());
        assertEquals("Test Report", loaded.getTitle());
        assertEquals("project-1", loaded.getProjectId());
        assertEquals("EPA BMD Guidance", loaded.getTemplateName());
        assertEquals(2, loaded.getSections().size());
        assertEquals("Overview", loaded.getSections().get(0).getTitle());
    }

    @Test
    void listReports() throws Exception {
        storageService.save(createTestReport("report-a"));
        storageService.save(createTestReport("report-b"));

        List<ReportDto> reports = storageService.list();
        assertEquals(2, reports.size());
    }

    @Test
    void deleteReport() throws Exception {
        storageService.save(createTestReport("to-delete"));
        assertTrue(storageService.exists("to-delete"));

        storageService.delete("to-delete");
        assertFalse(storageService.exists("to-delete"));
    }

    @Test
    void loadNonExistentThrows() {
        assertThrows(Exception.class, () -> storageService.load("nonexistent"));
    }

    @Test
    void existsReturnsFalseForMissing() {
        assertFalse(storageService.exists("missing-id"));
    }

    private ReportDto createTestReport(String id) {
        ReportDto report = new ReportDto();
        report.setId(id);
        report.setTitle("Test Report");
        report.setProjectId("project-1");
        report.setTemplateName("EPA BMD Guidance");
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());

        ReportSectionDto s1 = new ReportSectionDto();
        s1.setId("s1");
        s1.setTitle("Overview");
        s1.setOrder(0);
        s1.setSectionType("overview");
        s1.setStatus("draft");
        s1.setContent("<p>Test content</p>");

        ReportSectionDto s2 = new ReportSectionDto();
        s2.setId("s2");
        s2.setParentId("s1");
        s2.setTitle("Study Design");
        s2.setOrder(1);
        s2.setSectionType("subsection");
        s2.setStatus("draft");

        report.setSections(List.of(s1, s2));
        return report;
    }
}
