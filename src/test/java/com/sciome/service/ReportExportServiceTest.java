package com.sciome.service;

import com.sciome.config.ReportConfig;
import com.sciome.dto.report.ClinicalEndpointDto;
import com.sciome.dto.report.ReportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReportExportServiceTest {

    @TempDir
    Path tempDir;

    private ReportExportService exportService;
    private ReportService reportService;
    private ClinicalDataService clinicalDataService;

    @BeforeEach
    void setUp() {
        ReportConfig config = new ReportConfig();
        config.setDir(tempDir.toString());
        ReportStorageService storageService = new ReportStorageService(config);
        ReportTemplateProvider templateProvider = new ReportTemplateProvider();
        reportService = new ReportService(storageService, templateProvider);
        clinicalDataService = new ClinicalDataService(reportService);
        exportService = new ReportExportService(storageService);
    }

    @Test
    void exportToPdfProducesNonEmptyOutput() throws Exception {
        ReportDto report = reportService.createReport("p1", "EPA BMD Guidance", "PDF Test");

        // Add content to a section
        var section = report.getSections().get(0);
        section.setContent("<p>This is test content for PDF export.</p>");
        reportService.saveReport(report);

        byte[] pdf = exportService.exportToPdf(report.getId());

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
        // PDF files start with %PDF
        assertEquals('%', (char) pdf[0]);
        assertEquals('P', (char) pdf[1]);
        assertEquals('D', (char) pdf[2]);
        assertEquals('F', (char) pdf[3]);
    }

    @Test
    void exportToDocxProducesNonEmptyOutput() throws Exception {
        ReportDto report = reportService.createReport("p1", "ICH General Tox", "DOCX Test");

        // Add content
        var section = report.getSections().get(0);
        section.setContent("<p>Test content for DOCX.</p>");
        reportService.saveReport(report);

        byte[] docx = exportService.exportToDocx(report.getId());

        assertNotNull(docx);
        assertTrue(docx.length > 0);
        // DOCX files are ZIP files (start with PK)
        assertEquals('P', (char) docx[0]);
        assertEquals('K', (char) docx[1]);
    }

    @Test
    void exportWithClinicalData() throws Exception {
        ReportDto report = reportService.createReport("p1", "Blank", "Clinical Export Test");

        ClinicalEndpointDto ep = new ClinicalEndpointDto();
        ep.setCategory("hematology");
        ep.setEndpoint("RBC");
        ep.setDose("100");
        ep.setValue(5.5);
        ep.setUnit("10^6/uL");
        ep.setSignificance("p<0.05");

        clinicalDataService.addManualClinicalData(report.getId(), "Blood Data", List.of(ep));

        byte[] pdf = exportService.exportToPdf(report.getId());
        assertTrue(pdf.length > 0);

        byte[] docx = exportService.exportToDocx(report.getId());
        assertTrue(docx.length > 0);
    }

    @Test
    void exportEmptyReport() throws Exception {
        ReportDto report = reportService.createReport("p1", "Blank", "Empty Report");

        byte[] pdf = exportService.exportToPdf(report.getId());
        assertTrue(pdf.length > 0);

        byte[] docx = exportService.exportToDocx(report.getId());
        assertTrue(docx.length > 0);
    }
}
