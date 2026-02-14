package com.sciome.controller;

import com.sciome.service.ReportExportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportExportController {

    private static final Logger log = LoggerFactory.getLogger(ReportExportController.class);

    private final ReportExportService exportService;

    public ReportExportController(ReportExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/{reportId}/export/{format}")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportId,
            @PathVariable String format) {

        try {
            byte[] data;
            String contentType;
            String extension;

            switch (format.toLowerCase()) {
                case "pdf" -> {
                    data = exportService.exportToPdf(reportId);
                    contentType = "application/pdf";
                    extension = "pdf";
                }
                case "docx" -> {
                    data = exportService.exportToDocx(reportId);
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    extension = "docx";
                }
                default -> {
                    return ResponseEntity.badRequest().build();
                }
            }

            String filename = "report-" + reportId.substring(0, 8) + "." + extension;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(data.length)
                    .body(data);

        } catch (Exception e) {
            log.error("Failed to export report {} as {}", reportId, format, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
