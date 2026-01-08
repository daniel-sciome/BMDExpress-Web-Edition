package com.sciome.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;

/**
 * Controller for serving design documentation and source code files.
 * Used by the REACTIVITY_ARCHITECTURE_DESIGN.html to display inline code.
 *
 * Endpoints:
 * - GET /api/docs/design - Serves the design HTML document
 * - GET /api/source?path=... - Serves source code files for inline display
 */
@RestController
public class DesignDocsController {

    @Value("${app.project.root:#{systemProperties['user.dir']}}")
    private String projectRoot;

    // Allowed file extensions for source code viewing
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
        ".ts", ".tsx", ".js", ".jsx", ".java", ".yml", ".yaml",
        ".json", ".css", ".html", ".xml", ".properties", ".md"
    );

    // Allowed directories (relative to project root)
    private static final Set<String> ALLOWED_PREFIXES = Set.of(
        "src/main/frontend/",
        "src/main/java/",
        "src/main/resources/",
        "docs/"
    );

    /**
     * Serve the design documentation HTML file.
     * Access at: http://localhost:8080/api/docs/design
     */
    @GetMapping(value = "/api/docs/design", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> getDesignDoc() throws IOException {
        Path docPath = Paths.get(projectRoot, "docs", "REACTIVITY_ARCHITECTURE_DESIGN.html");

        if (!Files.exists(docPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(docPath);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
            .body(resource);
    }

    /**
     * Serve source code files for inline display in documentation.
     * Access at: http://localhost:8080/api/source?path=src/main/frontend/store/store.ts
     *
     * Security: Only allows files within approved directories and with approved extensions.
     */
    @GetMapping(value = "/api/source", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getSourceFile(@RequestParam String path) throws IOException {
        // Security: Normalize path and check for traversal attempts
        String normalizedPath = Paths.get(path).normalize().toString();

        // Prevent path traversal
        if (normalizedPath.contains("..") || normalizedPath.startsWith("/")) {
            return ResponseEntity.badRequest().body("Invalid path");
        }

        // Check if path starts with allowed prefix
        boolean allowedPrefix = ALLOWED_PREFIXES.stream()
            .anyMatch(prefix -> normalizedPath.startsWith(prefix));

        if (!allowedPrefix) {
            return ResponseEntity.badRequest()
                .body("Path not in allowed directories: " + ALLOWED_PREFIXES);
        }

        // Check file extension
        boolean allowedExtension = ALLOWED_EXTENSIONS.stream()
            .anyMatch(ext -> normalizedPath.toLowerCase().endsWith(ext));

        if (!allowedExtension) {
            return ResponseEntity.badRequest()
                .body("File type not allowed: " + ALLOWED_EXTENSIONS);
        }

        // Build full path and read file
        Path fullPath = Paths.get(projectRoot, normalizedPath);

        if (!Files.exists(fullPath)) {
            return ResponseEntity.notFound().build();
        }

        if (!Files.isRegularFile(fullPath)) {
            return ResponseEntity.badRequest().body("Not a file");
        }

        String content = Files.readString(fullPath);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE + "; charset=UTF-8")
            .body(content);
    }
}
