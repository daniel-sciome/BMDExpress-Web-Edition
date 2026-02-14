package com.sciome.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.sciome.config.ReportConfig;
import com.sciome.dto.report.ChartSnapshotDto;
import com.sciome.dto.report.ReportDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.Stream;

@Service
public class ReportStorageService {

    private static final Logger log = LoggerFactory.getLogger(ReportStorageService.class);
    private static final String REPORT_FILE = "report.json";
    private static final String SNAPSHOTS_DIR = "snapshots";

    private final Path reportsDir;
    private final ObjectMapper objectMapper;

    public ReportStorageService(ReportConfig config) {
        this.reportsDir = Paths.get(config.getDir());
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        try {
            Files.createDirectories(reportsDir);
            log.info("Reports directory initialized: {}", reportsDir.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create reports directory: {}", reportsDir, e);
        }
    }

    public void save(ReportDto report) throws IOException {
        Path reportDir = reportsDir.resolve(report.getId());
        Files.createDirectories(reportDir);

        // Save chart snapshot images to disk, replace dataUrl with file reference
        Path snapshotsDir = reportDir.resolve(SNAPSHOTS_DIR);
        if (report.getSections() != null) {
            for (var section : report.getSections()) {
                if (section.getChartSnapshots() != null) {
                    for (ChartSnapshotDto snapshot : section.getChartSnapshots()) {
                        if (snapshot.getDataUrl() != null && snapshot.getDataUrl().startsWith("data:image")) {
                            Files.createDirectories(snapshotsDir);
                            String base64Data = snapshot.getDataUrl().replaceFirst("^data:image/\\w+;base64,", "");
                            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                            Path imagePath = snapshotsDir.resolve(snapshot.getId() + ".png");
                            Files.write(imagePath, imageBytes);
                        }
                    }
                }
            }
        }

        Path reportFile = reportDir.resolve(REPORT_FILE);
        objectMapper.writeValue(reportFile.toFile(), report);
        log.debug("Report saved: {}", report.getId());
    }

    public ReportDto load(String reportId) throws IOException {
        Path reportFile = reportsDir.resolve(reportId).resolve(REPORT_FILE);
        if (!Files.exists(reportFile)) {
            throw new IOException("Report not found: " + reportId);
        }
        return objectMapper.readValue(reportFile.toFile(), ReportDto.class);
    }

    public List<ReportDto> list() throws IOException {
        List<ReportDto> reports = new ArrayList<>();
        if (!Files.exists(reportsDir)) {
            return reports;
        }
        try (Stream<Path> dirs = Files.list(reportsDir)) {
            dirs.filter(Files::isDirectory).forEach(dir -> {
                Path reportFile = dir.resolve(REPORT_FILE);
                if (Files.exists(reportFile)) {
                    try {
                        reports.add(objectMapper.readValue(reportFile.toFile(), ReportDto.class));
                    } catch (IOException e) {
                        log.warn("Failed to read report: {}", dir.getFileName(), e);
                    }
                }
            });
        }
        return reports;
    }

    public void delete(String reportId) throws IOException {
        Path reportDir = reportsDir.resolve(reportId);
        if (!Files.exists(reportDir)) {
            return;
        }
        // Delete all files within the report directory
        try (Stream<Path> walk = Files.walk(reportDir)) {
            walk.sorted((a, b) -> b.compareTo(a)) // deepest first
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        log.warn("Failed to delete: {}", path, e);
                    }
                });
        }
        log.info("Report deleted: {}", reportId);
    }

    public boolean exists(String reportId) {
        return Files.exists(reportsDir.resolve(reportId).resolve(REPORT_FILE));
    }

    public byte[] getSnapshotImage(String reportId, String snapshotId) throws IOException {
        Path imagePath = reportsDir.resolve(reportId).resolve(SNAPSHOTS_DIR).resolve(snapshotId + ".png");
        if (!Files.exists(imagePath)) {
            throw new IOException("Snapshot not found: " + snapshotId);
        }
        return Files.readAllBytes(imagePath);
    }
}
