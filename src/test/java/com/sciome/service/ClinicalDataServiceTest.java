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

class ClinicalDataServiceTest {

    @TempDir
    Path tempDir;

    private ClinicalDataService clinicalDataService;
    private ReportService reportService;

    @BeforeEach
    void setUp() {
        ReportConfig config = new ReportConfig();
        config.setDir(tempDir.toString());
        ReportStorageService storageService = new ReportStorageService(config);
        ReportTemplateProvider templateProvider = new ReportTemplateProvider();
        reportService = new ReportService(storageService, templateProvider);
        clinicalDataService = new ClinicalDataService(reportService);
    }

    @Test
    void addManualClinicalData() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");

        ClinicalEndpointDto ep = new ClinicalEndpointDto();
        ep.setCategory("hematology");
        ep.setEndpoint("RBC");
        ep.setDose("100");
        ep.setValue(5.5);
        ep.setUnit("10^6/uL");

        ReportDto updated = clinicalDataService.addManualClinicalData(
                report.getId(), "Hematology Data", List.of(ep));

        assertEquals(1, updated.getClinicalDatasets().size());
        assertEquals("manual", updated.getClinicalDatasets().get(0).getSource());
        assertEquals(1, updated.getClinicalDatasets().get(0).getEndpoints().size());
        assertNotNull(updated.getClinicalDatasets().get(0).getEndpoints().get(0).getId());
    }

    @Test
    void addNarrativeClinicalData() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");

        ReportDto updated = clinicalDataService.addNarrativeClinicalData(
                report.getId(), "Summary", "NOAEL was 100 mg/kg based on liver effects.");

        assertEquals(1, updated.getClinicalDatasets().size());
        assertEquals("narrative", updated.getClinicalDatasets().get(0).getSource());
        assertEquals("NOAEL was 100 mg/kg based on liver effects.",
                updated.getClinicalDatasets().get(0).getNarrativeSummary());
    }

    @Test
    void deleteClinicalDataset() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");
        report = clinicalDataService.addNarrativeClinicalData(report.getId(), "To Delete", "text");
        String datasetId = report.getClinicalDatasets().get(0).getId();

        ReportDto updated = clinicalDataService.deleteClinicalDataset(report.getId(), datasetId);
        assertTrue(updated.getClinicalDatasets().isEmpty());
    }

    @Test
    void getClinicalDataSummaryEmpty() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");
        String summary = clinicalDataService.getClinicalDataSummary(report.getId());
        assertEquals("No clinical data available.", summary);
    }

    @Test
    void getClinicalDataSummaryWithData() {
        ReportDto report = reportService.createReport("p1", "Blank", "Test");

        ClinicalEndpointDto ep = new ClinicalEndpointDto();
        ep.setCategory("hematology");
        ep.setEndpoint("WBC");
        ep.setDose("50");
        ep.setValue(8.2);
        ep.setUnit("10^3/uL");

        clinicalDataService.addManualClinicalData(report.getId(), "Blood Work", List.of(ep));

        String summary = clinicalDataService.getClinicalDataSummary(report.getId());
        assertTrue(summary.contains("Blood Work"));
        assertTrue(summary.contains("hematology"));
        assertTrue(summary.contains("WBC"));
    }

    @Test
    void validateCsvSchemaValid() {
        String csv = "category,endpoint,dose,value\nhematology,RBC,100,5.5";
        assertEquals("valid", clinicalDataService.validateCsvSchema(csv));
    }

    @Test
    void validateCsvSchemaMissingColumns() {
        String csv = "dose,value\n100,5.5";
        String result = clinicalDataService.validateCsvSchema(csv);
        assertTrue(result.contains("Missing required columns"));
        assertTrue(result.contains("endpoint"));
        assertTrue(result.contains("category"));
    }

    @Test
    void validateCsvSchemaEmpty() {
        assertEquals("CSV content is empty", clinicalDataService.validateCsvSchema(""));
        assertEquals("CSV content is empty", clinicalDataService.validateCsvSchema(null));
    }
}
