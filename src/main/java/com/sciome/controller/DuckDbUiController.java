package com.sciome.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;

/**
 * Controller for serving the DuckDB browser UI.
 *
 * Endpoints:
 * - GET /duckdb-ui       — Standalone HTML page with DuckDB-WASM table browser
 * - GET /duckdb-graph    — Graph-based joined table explorer with vis-network
 * - GET /api/duckdb/file — Serves bmdx.duckdb as binary for WASM to load
 */
@RestController
public class DuckDbUiController {

    private static final Logger log = LoggerFactory.getLogger(DuckDbUiController.class);

    @Value("${bmdexpress.library.dataPath:classpath:data/bmd}")
    private String libraryDataPath;

    /**
     * Serve the standalone DuckDB UI HTML page.
     */
    @GetMapping(value = "/duckdb-ui", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> getDuckDbUi() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource resource = resolver.getResource("classpath:static/duckdb-ui.html");

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                .body(resource);
    }

    /**
     * Serve the standalone DuckDB Graph Explorer HTML page.
     */
    @GetMapping(value = "/duckdb-graph", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<Resource> getDuckDbGraph() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource resource = resolver.getResource("classpath:static/duckdb-graph.html");

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                .body(resource);
    }

    /**
     * Serve the bmdx.duckdb file for the WASM client to load.
     */
    @GetMapping(value = "/api/duckdb/file", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getDuckDbFile() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource resource = resolver.getResource(libraryDataPath + "/bmdx.duckdb");

        if (!resource.exists()) {
            log.warn("bmdx.duckdb not found at {}/bmdx.duckdb", libraryDataPath);
            return ResponseEntity.notFound().build();
        }

        try (InputStream is = resource.getInputStream()) {
            byte[] data = is.readAllBytes();
            log.info("Serving bmdx.duckdb ({} bytes)", data.length);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"bmdx.duckdb\"")
                    .contentLength(data.length)
                    .body(data);
        }
    }
}
