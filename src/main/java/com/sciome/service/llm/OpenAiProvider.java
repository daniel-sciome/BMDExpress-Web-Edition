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
public class OpenAiProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiProvider.class);
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getName() {
        return "openai";
    }

    @Override
    public String getDefaultModel() {
        return "gpt-4o";
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
                "messages", new Object[]{
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                }
            );

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("OpenAI API error: {} {}", response.statusCode(), response.body());
                return new LlmResult("OpenAI API error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            int inputTokens = root.path("usage").path("prompt_tokens").asInt();
            int outputTokens = root.path("usage").path("completion_tokens").asInt();

            return new LlmResult(content, inputTokens, outputTokens);

        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            return new LlmResult("Failed to call OpenAI API: " + e.getMessage());
        }
    }
}
