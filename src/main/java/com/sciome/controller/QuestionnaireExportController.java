package com.sciome.controller;

import com.sciome.dto.QuestionnaireResponseDto;
import com.sciome.service.QuestionnaireService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/questionnaire")
public class QuestionnaireExportController {

    private final QuestionnaireService questionnaireService;

    public QuestionnaireExportController(QuestionnaireService questionnaireService) {
        this.questionnaireService = questionnaireService;
    }

    @GetMapping("/export")
    public ResponseEntity<?> exportResponses(@RequestParam String code) {
        if (!questionnaireService.validateAccessCode(code)) {
            return ResponseEntity.status(403).body("Invalid access code");
        }

        List<QuestionnaireResponseDto> responses = questionnaireService.listResponses();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"questionnaire-responses.json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(responses);
    }
}
