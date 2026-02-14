package com.sciome.service;

import com.sciome.config.LlmConfig;
import com.sciome.config.ReportConfig;
import com.sciome.dto.report.LlmRequestDto;
import com.sciome.dto.report.LlmResponseDto;
import com.sciome.dto.report.ReportDto;
import com.sciome.service.llm.LlmProvider;
import com.sciome.service.llm.PromptAssembler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LlmServiceTest {

    @TempDir
    Path tempDir;

    private LlmService llmService;
    private ReportService reportService;
    private String testReportId;
    private String testSectionId;

    @BeforeEach
    void setUp() {
        ReportConfig reportConfig = new ReportConfig();
        reportConfig.setDir(tempDir.toString());
        ReportStorageService storageService = new ReportStorageService(reportConfig);
        ReportTemplateProvider templateProvider = new ReportTemplateProvider();
        reportService = new ReportService(storageService, templateProvider);
        ClinicalDataService clinicalDataService = new ClinicalDataService(reportService);

        LlmConfig llmConfig = new LlmConfig();
        llmConfig.setDefaultProvider("mock");
        PromptAssembler promptAssembler = new PromptAssembler();

        // Mock provider
        LlmProvider mockProvider = new LlmProvider() {
            @Override
            public String getName() { return "mock"; }
            @Override
            public String getDefaultModel() { return "mock-model"; }
            @Override
            public LlmResult generate(String systemPrompt, String userPrompt, String apiKey,
                                       String model, double temperature, int maxTokens, int timeoutSeconds) {
                if ("fail".equals(apiKey)) {
                    return new LlmResult("Mock failure");
                }
                return new LlmResult("<p>Generated content for test</p>", 100, 50);
            }
        };

        llmService = new LlmService(llmConfig, reportService, clinicalDataService,
                promptAssembler, List.of(mockProvider));

        // Create test report with sections
        ReportDto report = reportService.createReport("project-1", "EPA BMD Guidance", "Test Report");
        testReportId = report.getId();
        testSectionId = report.getSections().get(0).getId();
    }

    @Test
    void generateSectionContentSuccess() {
        LlmRequestDto request = new LlmRequestDto();
        request.setReportId(testReportId);
        request.setSectionId(testSectionId);
        request.setProvider("mock");
        request.setApiKey("test-key");
        request.setInstruction("Write an overview");

        LlmResponseDto response = llmService.generateSectionContent(request);

        assertTrue(response.isSuccess());
        assertNotNull(response.getContent());
        assertTrue(response.getContent().contains("Generated content"));
        assertEquals(100, response.getInputTokens());
        assertEquals(50, response.getOutputTokens());
    }

    @Test
    void generateSectionContentFailure() {
        LlmRequestDto request = new LlmRequestDto();
        request.setReportId(testReportId);
        request.setSectionId(testSectionId);
        request.setProvider("mock");
        request.setApiKey("fail");

        LlmResponseDto response = llmService.generateSectionContent(request);

        assertFalse(response.isSuccess());
        assertNotNull(response.getError());
    }

    @Test
    void generateWithMissingApiKey() {
        LlmRequestDto request = new LlmRequestDto();
        request.setReportId(testReportId);
        request.setSectionId(testSectionId);
        request.setProvider("mock");

        LlmResponseDto response = llmService.generateSectionContent(request);

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("API key"));
    }

    @Test
    void generateWithUnknownProvider() {
        LlmRequestDto request = new LlmRequestDto();
        request.setReportId(testReportId);
        request.setSectionId(testSectionId);
        request.setProvider("unknown");
        request.setApiKey("key");

        LlmResponseDto response = llmService.generateSectionContent(request);

        assertFalse(response.isSuccess());
        assertTrue(response.getError().contains("Unknown LLM provider"));
    }

    @Test
    void getAvailableProviders() {
        List<String> providers = llmService.getAvailableProviders();
        assertTrue(providers.contains("mock"));
    }

    @Test
    void testApiKey() {
        assertTrue(llmService.testApiKey("mock", "good-key"));
        assertFalse(llmService.testApiKey("mock", "fail"));
        assertFalse(llmService.testApiKey("nonexistent", "key"));
    }
}
