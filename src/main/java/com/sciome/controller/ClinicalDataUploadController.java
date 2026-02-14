package com.sciome.controller;

import com.sciome.dto.report.ClinicalDatasetDto;
import com.sciome.dto.report.ClinicalEndpointDto;
import com.sciome.dto.report.ReportDto;
import com.sciome.service.ReportService;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ClinicalDataUploadController {

    private static final Logger log = LoggerFactory.getLogger(ClinicalDataUploadController.class);

    private final ReportService reportService;

    public ClinicalDataUploadController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/{reportId}/clinical-data/upload")
    public ResponseEntity<ReportDto> uploadClinicalData(
            @PathVariable String reportId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", defaultValue = "Uploaded Data") String name) {

        String filename = file.getOriginalFilename();
        if (filename == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            List<ClinicalEndpointDto> endpoints;
            String lowerName = filename.toLowerCase();

            if (lowerName.endsWith(".csv")) {
                endpoints = parseCsv(file);
            } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
                endpoints = parseExcel(file);
            } else {
                return ResponseEntity.badRequest().build();
            }

            ClinicalDatasetDto dataset = new ClinicalDatasetDto();
            dataset.setId(UUID.randomUUID().toString());
            dataset.setName(name);
            dataset.setSource("upload");
            dataset.setEndpoints(endpoints);

            ReportDto report = reportService.getReport(reportId);
            report.getClinicalDatasets().add(dataset);
            reportService.saveReport(report);

            log.info("Clinical data uploaded to report {}: {} ({} endpoints)", reportId, filename, endpoints.size());
            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("Failed to parse clinical data file: {}", filename, e);
            return ResponseEntity.badRequest().build();
        }
    }

    private List<ClinicalEndpointDto> parseCsv(MultipartFile file) throws Exception {
        List<ClinicalEndpointDto> endpoints = new ArrayList<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            Map<String, Integer> headerMap = parser.getHeaderMap();

            for (CSVRecord record : parser) {
                ClinicalEndpointDto ep = new ClinicalEndpointDto();
                ep.setId(UUID.randomUUID().toString());

                if (headerMap.containsKey("category")) ep.setCategory(record.get("category"));
                if (headerMap.containsKey("endpoint")) ep.setEndpoint(record.get("endpoint"));
                if (headerMap.containsKey("dose")) ep.setDose(record.get("dose"));
                if (headerMap.containsKey("sex")) ep.setSex(record.get("sex"));
                if (headerMap.containsKey("value")) ep.setValue(parseDouble(record.get("value")));
                if (headerMap.containsKey("unit")) ep.setUnit(record.get("unit"));
                if (headerMap.containsKey("control_value")) ep.setControlValue(parseDouble(record.get("control_value")));
                if (headerMap.containsKey("percent_change")) ep.setPercentChange(parseDouble(record.get("percent_change")));
                if (headerMap.containsKey("significance")) ep.setSignificance(record.get("significance"));
                if (headerMap.containsKey("notes")) ep.setNotes(record.get("notes"));

                endpoints.add(ep);
            }
        }

        return endpoints;
    }

    private List<ClinicalEndpointDto> parseExcel(MultipartFile file) throws Exception {
        List<ClinicalEndpointDto> endpoints = new ArrayList<>();

        try (var workbook = org.apache.poi.ss.usermodel.WorkbookFactory.create(file.getInputStream())) {
            var sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                return endpoints;
            }

            // Read header row
            var headerRow = sheet.getRow(0);
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                var cell = headerRow.getCell(i);
                if (cell != null) {
                    headerMap.put(cell.getStringCellValue().toLowerCase().trim(), i);
                }
            }

            // Read data rows
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                var row = sheet.getRow(rowIdx);
                if (row == null) continue;

                ClinicalEndpointDto ep = new ClinicalEndpointDto();
                ep.setId(UUID.randomUUID().toString());

                ep.setCategory(getCellString(row, headerMap.get("category")));
                ep.setEndpoint(getCellString(row, headerMap.get("endpoint")));
                ep.setDose(getCellString(row, headerMap.get("dose")));
                ep.setSex(getCellString(row, headerMap.get("sex")));
                ep.setValue(getCellDouble(row, headerMap.get("value")));
                ep.setUnit(getCellString(row, headerMap.get("unit")));
                ep.setControlValue(getCellDouble(row, headerMap.get("control_value")));
                ep.setPercentChange(getCellDouble(row, headerMap.get("percent_change")));
                ep.setSignificance(getCellString(row, headerMap.get("significance")));
                ep.setNotes(getCellString(row, headerMap.get("notes")));

                endpoints.add(ep);
            }
        }

        return endpoints;
    }

    private String getCellString(org.apache.poi.ss.usermodel.Row row, Integer colIdx) {
        if (colIdx == null) return null;
        var cell = row.getCell(colIdx);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private Double getCellDouble(org.apache.poi.ss.usermodel.Row row, Integer colIdx) {
        if (colIdx == null) return null;
        var cell = row.getCell(colIdx);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> parseDouble(cell.getStringCellValue());
            default -> null;
        };
    }

    private Double parseDouble(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Double.parseDouble(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
