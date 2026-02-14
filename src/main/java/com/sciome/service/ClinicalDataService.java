package com.sciome.service;

import com.sciome.dto.report.ClinicalDatasetDto;
import com.sciome.dto.report.ClinicalEndpointDto;
import com.sciome.dto.report.ReportDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@BrowserCallable
@AnonymousAllowed
public class ClinicalDataService {

    private static final Logger log = LoggerFactory.getLogger(ClinicalDataService.class);

    private final ReportService reportService;

    public ClinicalDataService(ReportService reportService) {
        this.reportService = reportService;
    }

    public ReportDto addManualClinicalData(String reportId, String name, List<ClinicalEndpointDto> endpoints) {
        ReportDto report = reportService.getReport(reportId);

        ClinicalDatasetDto dataset = new ClinicalDatasetDto();
        dataset.setId(UUID.randomUUID().toString());
        dataset.setName(name);
        dataset.setSource("manual");
        dataset.setEndpoints(endpoints != null ? endpoints : new ArrayList<>());

        // Assign IDs to endpoints that don't have them
        for (ClinicalEndpointDto ep : dataset.getEndpoints()) {
            if (ep.getId() == null || ep.getId().isEmpty()) {
                ep.setId(UUID.randomUUID().toString());
            }
        }

        report.getClinicalDatasets().add(dataset);
        reportService.saveReport(report);
        log.info("Manual clinical data added to report {}: {}", reportId, name);
        return report;
    }

    public ReportDto addNarrativeClinicalData(String reportId, String name, String summary) {
        ReportDto report = reportService.getReport(reportId);

        ClinicalDatasetDto dataset = new ClinicalDatasetDto();
        dataset.setId(UUID.randomUUID().toString());
        dataset.setName(name);
        dataset.setSource("narrative");
        dataset.setNarrativeSummary(summary);

        report.getClinicalDatasets().add(dataset);
        reportService.saveReport(report);
        log.info("Narrative clinical data added to report {}: {}", reportId, name);
        return report;
    }

    public ReportDto deleteClinicalDataset(String reportId, String datasetId) {
        ReportDto report = reportService.getReport(reportId);
        report.getClinicalDatasets().removeIf(d -> d.getId().equals(datasetId));

        // Also remove references from sections
        for (var section : report.getSections()) {
            section.getClinicalDatasetIds().remove(datasetId);
        }

        reportService.saveReport(report);
        log.info("Clinical dataset deleted from report {}: {}", reportId, datasetId);
        return report;
    }

    public String getClinicalDataSummary(String reportId) {
        ReportDto report = reportService.getReport(reportId);
        List<ClinicalDatasetDto> datasets = report.getClinicalDatasets();

        if (datasets == null || datasets.isEmpty()) {
            return "No clinical data available.";
        }

        StringBuilder sb = new StringBuilder();
        for (ClinicalDatasetDto ds : datasets) {
            sb.append("Dataset: ").append(ds.getName());
            sb.append(" (source: ").append(ds.getSource()).append(")\n");

            if ("narrative".equals(ds.getSource()) && ds.getNarrativeSummary() != null) {
                sb.append("Summary: ").append(ds.getNarrativeSummary()).append("\n");
            }

            if (ds.getEndpoints() != null && !ds.getEndpoints().isEmpty()) {
                // Group by category
                var grouped = ds.getEndpoints().stream()
                        .collect(Collectors.groupingBy(
                                ep -> ep.getCategory() != null ? ep.getCategory() : "unknown"));
                for (var entry : grouped.entrySet()) {
                    sb.append("  ").append(entry.getKey()).append(": ");
                    sb.append(entry.getValue().size()).append(" endpoints\n");
                    for (ClinicalEndpointDto ep : entry.getValue()) {
                        sb.append("    - ").append(ep.getEndpoint());
                        if (ep.getDose() != null) sb.append(" at ").append(ep.getDose());
                        if (ep.getValue() != null) sb.append(": ").append(ep.getValue());
                        if (ep.getUnit() != null) sb.append(" ").append(ep.getUnit());
                        if (ep.getSignificance() != null) sb.append(" (").append(ep.getSignificance()).append(")");
                        sb.append("\n");
                    }
                }
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    public String validateCsvSchema(String csvContent) {
        if (csvContent == null || csvContent.isBlank()) {
            return "CSV content is empty";
        }
        String[] lines = csvContent.split("\n");
        if (lines.length < 2) {
            return "CSV must have a header row and at least one data row";
        }
        String[] headers = lines[0].split(",");
        List<String> requiredHeaders = List.of("endpoint", "category");
        List<String> missing = new ArrayList<>();
        for (String req : requiredHeaders) {
            boolean found = false;
            for (String h : headers) {
                if (h.trim().equalsIgnoreCase(req)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                missing.add(req);
            }
        }
        if (!missing.isEmpty()) {
            return "Missing required columns: " + String.join(", ", missing);
        }
        return "valid";
    }
}
