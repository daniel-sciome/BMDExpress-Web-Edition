package com.sciome.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sciome.dto.AnalysisAnnotationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Service for parsing BMDExpress analysis names into structured metadata.
 * Reads configuration from analysis-name-parser-config.json.
 */
@Service
public class AnalysisNameParser {

    private static final Logger log = LoggerFactory.getLogger(AnalysisNameParser.class);

    private JsonNode config;
    private int parameterSuffixCount;
    private boolean strictMode;
    private Set<String> knownSexValues;
    private Set<String> knownSpeciesValues;
    private Set<String> knownOrganValues;
    private List<String> knownPlatformPatterns;
    private List<String> knownAnalysisTypePatterns;

    @PostConstruct
    public void init() throws IOException {
        log.info("Initializing AnalysisNameParser...");
        loadConfiguration();
        log.info("AnalysisNameParser initialized successfully. Parameter suffix count: {}", parameterSuffixCount);
    }

    private void loadConfiguration() throws IOException {
        ClassPathResource resource = new ClassPathResource("analysis-name-parser-config.json");
        ObjectMapper mapper = new ObjectMapper();

        try (InputStream inputStream = resource.getInputStream()) {
            config = mapper.readTree(inputStream);
            JsonNode parserConfig = config.get("parserConfig");

            // Load basic settings
            parameterSuffixCount = parserConfig.get("parameterSuffixCount").asInt();
            strictMode = parserConfig.get("validation").get("strictMode").asBoolean();

            // Load known values
            JsonNode knownValues = parserConfig.get("knownValues");

            knownSexValues = loadValues(knownValues.get("sex").get("values"));
            knownSpeciesValues = loadValues(knownValues.get("species").get("values"));
            knownOrganValues = loadValues(knownValues.get("organ").get("values"));

            knownPlatformPatterns = loadPatterns(knownValues.get("platform").get("patterns"));
            knownAnalysisTypePatterns = loadPatterns(knownValues.get("analysisType").get("patterns"));

            log.info("Loaded configuration: {} sex values, {} species, {} organs, {} platforms, {} analysis types",
                    knownSexValues.size(), knownSpeciesValues.size(), knownOrganValues.size(),
                    knownPlatformPatterns.size(), knownAnalysisTypePatterns.size());
        }
    }

    private Set<String> loadValues(JsonNode arrayNode) {
        return StreamSupport.stream(arrayNode.spliterator(), false)
                .map(JsonNode::asText)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    private List<String> loadPatterns(JsonNode arrayNode) {
        return StreamSupport.stream(arrayNode.spliterator(), false)
                .map(JsonNode::asText)
                .collect(Collectors.toList());
    }

    /**
     * Parse an analysis name into structured metadata.
     *
     * @param fullName The complete analysis name
     * @return AnalysisAnnotationDto with extracted metadata
     */
    public AnalysisAnnotationDto parse(String fullName) {
        AnalysisAnnotationDto dto = new AnalysisAnnotationDto(fullName);

        try {
            if (fullName == null || fullName.trim().isEmpty()) {
                throw new IllegalArgumentException("Analysis name cannot be null or empty");
            }

            log.debug("Parsing analysis name: {}", fullName);

            // Split by underscore
            String[] parts = fullName.split("_");

            if (parts.length <= parameterSuffixCount) {
                throw new IllegalArgumentException(
                        "Analysis name has too few parts. Expected more than " + parameterSuffixCount + ", got " + parts.length);
            }

            // Extract parameter suffix (last N parts)
            int prefixEndIndex = parts.length - parameterSuffixCount;
            String parameterSuffix = String.join("_",
                    Arrays.copyOfRange(parts, prefixEndIndex, parts.length));
            dto.setParameterSuffix(parameterSuffix);

            // Extract prefix parts (before parameter suffix)
            String[] prefixParts = Arrays.copyOfRange(parts, 0, prefixEndIndex);

            // Parse prefix and parameter suffix
            parsePrefix(prefixParts, dto);
            parseParameterSuffix(parameterSuffix.split("_"), dto);

            // Generate display names
            generateDisplayNames(dto);

            // Validate required fields
            validateAnnotation(dto);

            dto.setParseSuccess(true);
            log.debug("Successfully parsed: {}", dto);

        } catch (Exception e) {
            log.error("Failed to parse analysis name '{}': {}", fullName, e.getMessage());
            dto.setParseSuccess(false);
            dto.setParseError(e.getMessage());

            if (strictMode) {
                throw new RuntimeException("Failed to parse analysis name: " + fullName, e);
            }
        }

        return dto;
    }

    private void parsePrefix(String[] prefixParts, AnalysisAnnotationDto dto) {
        if (prefixParts.length == 0) {
            throw new IllegalArgumentException("Prefix is empty");
        }

        // First part is typically a prefix identifier (e.g., "P2", "Batch1")
        dto.setPrefix(prefixParts[0]);

        // Track which parts have been identified
        Set<Integer> identifiedIndices = new HashSet<>();
        identifiedIndices.add(0); // Prefix already identified

        // Scan for sex
        for (int i = 1; i < prefixParts.length; i++) {
            if (knownSexValues.contains(prefixParts[i].toLowerCase())) {
                dto.setSex(capitalizeFirst(prefixParts[i]));
                identifiedIndices.add(i);
                break;
            }
        }

        // Scan for organ (may have suffix like "Heart-expression1")
        for (int i = 1; i < prefixParts.length; i++) {
            String part = prefixParts[i];
            // Check if part starts with a known organ
            for (String organ : knownOrganValues) {
                if (part.toLowerCase().startsWith(organ.toLowerCase())) {
                    // Extract just the organ name (before any dash or suffix)
                    String extractedOrgan = part.split("-")[0];
                    dto.setOrgan(capitalizeFirst(extractedOrgan));
                    identifiedIndices.add(i);
                    break;
                }
            }
            if (dto.getOrgan() != null) break;
        }

        // Remaining unidentified parts (excluding prefix) form the chemical name
        List<String> chemicalParts = new ArrayList<>();
        for (int i = 1; i < prefixParts.length; i++) {
            if (!identifiedIndices.contains(i)) {
                chemicalParts.add(prefixParts[i]);
            }
        }

        if (!chemicalParts.isEmpty()) {
            // Join chemical parts with spaces instead of underscores for readability
            String chemical = String.join(" ", chemicalParts);
            dto.setChemical(chemical);
        }
    }

    private void parseParameterSuffix(String[] suffixParts, AnalysisAnnotationDto dto) {
        // Scan for species
        for (String part : suffixParts) {
            if (knownSpeciesValues.contains(part.toLowerCase())) {
                dto.setSpecies(capitalizeFirst(part));
                break;
            }
        }

        // Scan for platform (may be multi-part like "S1500_Plus")
        for (String pattern : knownPlatformPatterns) {
            String patternWithUnderscores = pattern.replace("_", "_");
            if (dto.getParameterSuffix().contains(pattern)) {
                dto.setPlatform(pattern);
                break;
            }
        }

        // Scan for analysis type (may be multi-part like "GO_BP")
        for (String pattern : knownAnalysisTypePatterns) {
            if (dto.getParameterSuffix().contains(pattern)) {
                dto.setAnalysisType(pattern);
                break;
            }
        }
    }

    private void generateDisplayNames(AnalysisAnnotationDto dto) {
        // Short format: "Chemical - Sex Organ (Species)"
        String shortName = String.format("%s - %s %s (%s)",
                dto.getChemical() != null ? dto.getChemical() : "Unknown",
                dto.getSex() != null ? dto.getSex() : "?",
                dto.getOrgan() != null ? dto.getOrgan() : "?",
                dto.getSpecies() != null ? dto.getSpecies() : "?"
        );
        dto.setDisplayName(shortName);

        // Medium format: "Chemical | Sex Organ | Platform | Species"
        String mediumName = String.format("%s | %s %s | %s | %s",
                dto.getChemical() != null ? dto.getChemical() : "Unknown",
                dto.getSex() != null ? dto.getSex() : "?",
                dto.getOrgan() != null ? dto.getOrgan() : "?",
                dto.getPlatform() != null ? dto.getPlatform() : "?",
                dto.getSpecies() != null ? dto.getSpecies() : "?"
        );
        dto.setDisplayNameMedium(mediumName);
    }

    private void validateAnnotation(AnalysisAnnotationDto dto) {
        List<String> missingFields = new ArrayList<>();

        // Only validate chemical as required (based on updated config)
        if (dto.getChemical() == null) missingFields.add("chemical");

        if (!missingFields.isEmpty()) {
            String message = "Required fields missing: " + String.join(", ", missingFields);
            log.warn("Validation warning for '{}': {}", dto.getFullName(), message);
            // Don't throw, just log warning
        }
    }

    private String capitalizeFirst(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    /**
     * Parse multiple analysis names in batch.
     *
     * @param names List of analysis names
     * @return List of parsed annotations
     */
    public List<AnalysisAnnotationDto> parseAll(List<String> names) {
        return names.stream()
                .map(this::parse)
                .collect(Collectors.toList());
    }
}
