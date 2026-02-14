package com.sciome.service;

import com.sciome.config.LlmConfig;
import com.sciome.dto.report.*;
import com.sciome.service.llm.LlmProvider;
import com.sciome.service.llm.PromptAssembler;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@BrowserCallable
@AnonymousAllowed
public class LlmService {

    private static final Logger log = LoggerFactory.getLogger(LlmService.class);

    private final LlmConfig config;
    private final ReportService reportService;
    private final ClinicalDataService clinicalDataService;
    private final PromptAssembler promptAssembler;
    private final Map<String, LlmProvider> providers;

    public LlmService(LlmConfig config, ReportService reportService,
                      ClinicalDataService clinicalDataService, PromptAssembler promptAssembler,
                      List<LlmProvider> providerList) {
        this.config = config;
        this.reportService = reportService;
        this.clinicalDataService = clinicalDataService;
        this.promptAssembler = promptAssembler;
        this.providers = providerList.stream()
                .collect(Collectors.toMap(LlmProvider::getName, p -> p));
    }

    public LlmResponseDto generateSectionContent(LlmRequestDto request) {
        try {
            // Resolve provider
            String providerName = request.getProvider() != null ? request.getProvider() : config.getDefaultProvider();
            LlmProvider provider = providers.get(providerName);
            if (provider == null) {
                return errorResponse("Unknown LLM provider: " + providerName);
            }

            // Validate API key
            if (request.getApiKey() == null || request.getApiKey().isBlank()) {
                return errorResponse("API key is required");
            }

            // Load report and section
            ReportDto report = reportService.getReport(request.getReportId());
            ReportSectionDto section = report.getSections().stream()
                    .filter(s -> s.getId().equals(request.getSectionId()))
                    .findFirst()
                    .orElse(null);

            if (section == null) {
                return errorResponse("Section not found: " + request.getSectionId());
            }

            // Get clinical data summary
            String clinicalSummary = clinicalDataService.getClinicalDataSummary(request.getReportId());

            // Build prompts
            String systemPrompt = promptAssembler.buildSystemPrompt(report);
            String userPrompt = promptAssembler.buildUserPrompt(
                    report, section, clinicalSummary,
                    request.getInstruction(), request.isIncludeAdjacentSections());

            // Resolve parameters
            double temperature = request.getTemperature() != null
                    ? request.getTemperature() : config.getDefaultTemperature();
            int maxTokens = request.getMaxTokens() != null
                    ? request.getMaxTokens() : config.getDefaultMaxTokens();

            log.info("Generating content for section '{}' via {} (model: {})",
                    section.getTitle(), providerName, request.getModel());

            // Call LLM
            LlmProvider.LlmResult result = provider.generate(
                    systemPrompt, userPrompt, request.getApiKey(),
                    request.getModel(), temperature, maxTokens, config.getTimeoutSeconds());

            LlmResponseDto response = new LlmResponseDto();
            response.setProvider(providerName);
            response.setModel(request.getModel() != null ? request.getModel() : provider.getDefaultModel());

            if (result.isSuccess()) {
                response.setSuccess(true);
                response.setContent(result.getContent());
                response.setInputTokens(result.getInputTokens());
                response.setOutputTokens(result.getOutputTokens());
                log.info("LLM generation successful: {} input / {} output tokens",
                        result.getInputTokens(), result.getOutputTokens());
            } else {
                response.setSuccess(false);
                response.setError(result.getError());
                log.warn("LLM generation failed: {}", result.getError());
            }

            return response;

        } catch (Exception e) {
            log.error("LLM generation failed", e);
            return errorResponse("Generation failed: " + e.getMessage());
        }
    }

    public LlmResponseDto refineSectionContent(String reportId, String sectionId,
                                                 String instruction, LlmConfigDto llmConfig) {
        LlmRequestDto request = new LlmRequestDto();
        request.setReportId(reportId);
        request.setSectionId(sectionId);
        request.setInstruction(instruction);
        request.setIncludeAdjacentSections(true);
        if (llmConfig != null) {
            request.setProvider(llmConfig.getProvider());
            request.setModel(llmConfig.getModel());
            request.setTemperature(llmConfig.getTemperature());
            request.setMaxTokens(llmConfig.getMaxTokens());
        }
        return generateSectionContent(request);
    }

    public boolean testApiKey(String provider, String apiKey) {
        LlmProvider llmProvider = providers.get(provider);
        if (llmProvider == null) return false;

        LlmProvider.LlmResult result = llmProvider.generate(
                "You are a helpful assistant.", "Say 'ok'.", apiKey,
                null, 0.0, 10, 15);
        return result.isSuccess();
    }

    public List<String> getAvailableProviders() {
        return List.copyOf(providers.keySet());
    }

    private LlmResponseDto errorResponse(String error) {
        LlmResponseDto response = new LlmResponseDto();
        response.setSuccess(false);
        response.setError(error);
        return response;
    }
}
