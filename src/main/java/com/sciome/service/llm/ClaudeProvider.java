package com.sciome.service.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Component
public class ClaudeProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(ClaudeProvider.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() {
        return "claude";
    }

    @Override
    public String getDefaultModel() {
        return "claude-sonnet-4-5-20250929";
    }

    @Override
    public LlmResult generate(String systemPrompt, String userPrompt, String apiKey,
                               String model, double temperature, int maxTokens, int timeoutSeconds) {
        try {
            String effectiveModel = model != null && !model.isEmpty() ? model : getDefaultModel();

            Map<String, Object> body = Map.of(
                "model", effectiveModel,
                "max_tokens", maxTokens,
                "temperature", temperature,
                "system", systemPrompt,
                "messages", new Object[]{
                    Map.of("role", "user", "content", userPrompt)
                }
            );

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Claude API error: {} {}", response.statusCode(), response.body());
                return new LlmResult("Claude API error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("content").get(0).path("text").asText();
            int inputTokens = root.path("usage").path("input_tokens").asInt();
            int outputTokens = root.path("usage").path("output_tokens").asInt();

            return new LlmResult(content, inputTokens, outputTokens);

        } catch (Exception e) {
            log.error("Claude API call failed", e);
            return new LlmResult("Failed to call Claude API: " + e.getMessage());
        }
    }
}
