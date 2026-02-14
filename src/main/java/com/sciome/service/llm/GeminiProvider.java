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
public class GeminiProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(GeminiProvider.class);
    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() {
        return "gemini";
    }

    @Override
    public String getDefaultModel() {
        return "gemini-2.0-flash";
    }

    @Override
    public LlmResult generate(String systemPrompt, String userPrompt, String apiKey,
                               String model, double temperature, int maxTokens, int timeoutSeconds) {
        try {
            String effectiveModel = model != null && !model.isEmpty() ? model : getDefaultModel();
            String url = String.format(API_URL, effectiveModel, apiKey);

            Map<String, Object> body = Map.of(
                "systemInstruction", Map.of(
                    "parts", new Object[]{ Map.of("text", systemPrompt) }
                ),
                "contents", new Object[]{
                    Map.of("parts", new Object[]{ Map.of("text", userPrompt) })
                },
                "generationConfig", Map.of(
                    "temperature", temperature,
                    "maxOutputTokens", maxTokens
                )
            );

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {} {}", response.statusCode(), response.body());
                return new LlmResult("Gemini API error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("candidates").get(0)
                .path("content").path("parts").get(0).path("text").asText();
            int inputTokens = root.path("usageMetadata").path("promptTokenCount").asInt();
            int outputTokens = root.path("usageMetadata").path("candidatesTokenCount").asInt();

            return new LlmResult(content, inputTokens, outputTokens);

        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            return new LlmResult("Failed to call Gemini API: " + e.getMessage());
        }
    }
}
