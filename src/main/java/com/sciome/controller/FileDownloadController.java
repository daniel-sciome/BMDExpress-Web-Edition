package com.sciome.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

/**
 * REST Controller for downloading analysis result files
 */
@RestController
@RequestMapping("/api/download")
public class FileDownloadController {

    /**
     * Download a .bm2 project file
     *
     * @param filename The filename to download (e.g., "P3MP-Parham-with-anova.bm2")
     * @return The file as a downloadable resource
     */
    @GetMapping("/bm2/{filename}")
    public ResponseEntity<Resource> downloadBM2File(@PathVariable String filename) {
        File file = new File("src/main/resources/data/bmd/" + filename);

        if (!file.exists() || !file.isFile()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(file.length())
                .body(resource);
    }

    /**
     * Get download URL for a project
     *
     * @param projectId The project ID (e.g., "P3MP-Parham")
     * @return Download URL
     */
    @GetMapping("/url/{projectId}")
    public ResponseEntity<String> getDownloadUrl(@PathVariable String projectId) {
        String filename = projectId + "-with-anova.bm2";
        File file = new File("src/main/resources/data/bmd/" + filename);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        String url = "/api/download/bm2/" + filename;
        return ResponseEntity.ok(url);
    }
}
