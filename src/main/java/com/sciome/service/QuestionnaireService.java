package com.sciome.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.sciome.config.QuestionnaireConfig;
import com.sciome.dto.QuestionnaireResponseDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@BrowserCallable
@AnonymousAllowed
public class QuestionnaireService {

    private static final Logger log = LoggerFactory.getLogger(QuestionnaireService.class);

    private final Path questionnairesDir;
    private final ObjectMapper objectMapper;
    private final String accessCode;

    public QuestionnaireService(QuestionnaireConfig config) {
        this.questionnairesDir = Paths.get(config.getDir());
        this.accessCode = config.getAccessCode();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        try {
            Files.createDirectories(questionnairesDir);
            log.info("Questionnaires directory initialized: {}", questionnairesDir.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create questionnaires directory: {}", questionnairesDir, e);
        }
    }

    public boolean validateAccessCode(String code) {
        return accessCode.equals(code);
    }

    public void submitResponse(QuestionnaireResponseDto response) {
        response.setId(UUID.randomUUID().toString());
        response.setSubmittedAt(Instant.now().toString());

        Path file = questionnairesDir.resolve(response.getId() + ".json");
        try {
            objectMapper.writeValue(file.toFile(), response);
            log.info("Questionnaire response saved: {} ({})", response.getRespondentName(), response.getId());
        } catch (IOException e) {
            log.error("Failed to save questionnaire response", e);
            throw new RuntimeException("Failed to save questionnaire response", e);
        }
    }

    public List<QuestionnaireResponseDto> listResponses() {
        List<QuestionnaireResponseDto> responses = new ArrayList<>();
        if (!Files.exists(questionnairesDir)) {
            return responses;
        }
        try (Stream<Path> files = Files.list(questionnairesDir)) {
            files.filter(p -> p.toString().endsWith(".json")).forEach(file -> {
                try {
                    responses.add(objectMapper.readValue(file.toFile(), QuestionnaireResponseDto.class));
                } catch (IOException e) {
                    log.warn("Failed to read questionnaire response: {}", file.getFileName(), e);
                }
            });
        } catch (IOException e) {
            log.error("Failed to list questionnaire responses", e);
        }
        return responses;
    }
}
