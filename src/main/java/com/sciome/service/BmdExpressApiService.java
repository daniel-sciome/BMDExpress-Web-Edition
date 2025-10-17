package com.sciome.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.client5.http.ssl.TrustAllStrategy;
import org.apache.hc.core5.ssl.SSLContexts;
import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.dto.ProjectUploadResponse;

import javax.net.ssl.SSLContext;
import java.io.File;
import java.util.List;
import java.util.Map;

/**
 * Service to interact with BMDExpress REST API
 *
 * NOTE: Not annotated with @Service to avoid Spring Boot HTTP client autoconfiguration issues.
 * Instantiate manually when needed.
 */
public class BmdExpressApiService {

    private final RestTemplate restTemplate;
    private final String apiUrl;

    public BmdExpressApiService(@Value("${bmdexpress.api.url:}") String apiUrl) {
        // If no API URL is configured, use empty string for relative URLs (same server)
        this.apiUrl = apiUrl;
        try {
            // Trust all certificates (for self-signed certs) and disable hostname verification
            SSLContext sslContext = SSLContexts.custom()
                    .loadTrustMaterial(new TrustAllStrategy())
                    .build();

            // NoopHostnameVerifier disables hostname verification
            SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(
                    sslContext,
                    org.apache.hc.client5.http.ssl.NoopHostnameVerifier.INSTANCE
            );

            CloseableHttpClient httpClient = HttpClients.custom()
                    .setConnectionManager(
                        PoolingHttpClientConnectionManagerBuilder.create()
                            .setSSLSocketFactory(socketFactory)
                            .build()
                    )
                    .build();

            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
            this.restTemplate = new RestTemplate(factory);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create RestTemplate", e);
        }
    }

    /**
     * Upload a .bm2 project file
     */
    public ProjectUploadResponse uploadProject(File file) {
        String url = apiUrl + "/api/projects";

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(file));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<ProjectUploadResponse> response = restTemplate.postForEntity(url, requestEntity, ProjectUploadResponse.class);
        return response.getBody();
    }

    /**
     * Get project metadata
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getProject(String projectId) {
        String url = apiUrl + "/api/projects/" + projectId;
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        return response.getBody();
    }

    /**
     * Get the full BMDProject object
     */
    public BMDProject getFullProject(String projectId) {
        String url = apiUrl + "/api/projects/" + projectId + "/full";
        ResponseEntity<BMDProject> response = restTemplate.getForEntity(url, BMDProject.class);
        return response.getBody();
    }

    /**
     * Get BMD results for a project
     */
    public String[] getBmdResults(String projectId) {
        String url = apiUrl + "/api/projects/" + projectId + "/bmd-results";
        ResponseEntity<String[]> response = restTemplate.getForEntity(url, String[].class);
        return response.getBody();
    }

    /**
     * Submit category analysis
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> submitCategoryAnalysis(Map<String, Object> request) {
        String url = apiUrl + "/api/category-analysis";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        return response.getBody();
    }

    /**
     * Get analysis status/results
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getAnalysisResults(String analysisId) {
        System.out.println("DEBUG: Requesting analysis results for ID: " + analysisId);
        String url = apiUrl + "/api/category-analysis/" + analysisId;

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            System.out.println("DEBUG: Response status: " + response.getStatusCode());
            Map<String, Object> result = response.getBody();
            System.out.println("DEBUG: Successfully received response, keys: " + (result != null ? result.keySet() : "null"));
            return result;
        } catch (Exception e) {
            System.err.println("ERROR: Request failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get analysis results: " + e.getMessage(), e);
        }
    }

    /**
     * List available .bm2 files on server
     */
    @SuppressWarnings("unchecked")
    public List<String> listAvailableFiles() {
        String url = apiUrl + "/api/projects/available-files";
        ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
        return response.getBody();
    }

    /**
     * Load project from server filesystem
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> loadProjectFromFile(String filename) {
        String url = apiUrl + "/api/projects/load-from-file";

        Map<String, String> request = Map.of("filename", filename);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(request, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
        return response.getBody();
    }

    /**
     * Get a specific category analysis result from a project
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getCategoryResult(String projectId, String resultName) {
        String url = apiUrl + "/api/projects/" + projectId + "/category-results/" + resultName;
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        return response.getBody();
    }

    /**
     * Check API health
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> checkHealth() {
        String url = apiUrl + "/actuator/health";
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        return response.getBody();
    }
}
