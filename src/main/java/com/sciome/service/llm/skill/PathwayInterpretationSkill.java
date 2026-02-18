package com.sciome.service.llm.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Tool-callable skill wrapping InterpretationProvider.interpretPathway().
 * Designed for Phase 2 LLM tool-use — the LLM can call this to
 * look up biological significance of a specific pathway.
 */
@Component
public class PathwayInterpretationSkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(PathwayInterpretationSkill.class);

    private final InterpretationProvider interpretationProvider;

    public PathwayInterpretationSkill(InterpretationProvider interpretationProvider) {
        this.interpretationProvider = interpretationProvider;
    }

    @Override
    public String getName() {
        return "pathway_interpretation";
    }

    @Override
    public String getDescription() {
        return "Searches PubMed for literature about a specific biological pathway in the context of the study's test article and target organ. Returns relevant article titles and abstracts.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "pathwayName", Map.of("type", "string", "description", "Pathway or GO term name"),
                        "pathwayId", Map.of("type", "string", "description", "Pathway identifier (GO ID, KEGG ID)"),
                        "species", Map.of("type", "string", "description", "Species"),
                        "organ", Map.of("type", "string", "description", "Target organ"),
                        "testArticle", Map.of("type", "string", "description", "Chemical/compound name"),
                        "geneSymbols", Map.of("type", "array", "items", Map.of("type", "string"),
                                "description", "Gene symbols in the pathway")
                ),
                "required", List.of("pathwayName")
        );
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            String pathwayName = (String) parameters.getOrDefault("pathwayName", "");
            String pathwayId = (String) parameters.getOrDefault("pathwayId", "");
            String species = (String) parameters.getOrDefault("species", "");
            String organ = (String) parameters.getOrDefault("organ", "");
            String testArticle = (String) parameters.getOrDefault("testArticle", "");

            @SuppressWarnings("unchecked")
            List<String> geneSymbols = parameters.containsKey("geneSymbols")
                    ? (List<String>) parameters.get("geneSymbols")
                    : List.of();

            log.info("PathwayInterpretationSkill: looking up '{}' for {} / {}", pathwayName, testArticle, organ);

            String result = interpretationProvider.interpretPathway(
                    pathwayName, pathwayId, species, organ, testArticle, geneSymbols);

            return SkillResult.success(getName(), result);

        } catch (Exception e) {
            log.error("PathwayInterpretationSkill failed", e);
            return SkillResult.failure(getName(), e.getMessage());
        }
    }

    @Override
    public boolean isToolCallable() {
        return true;
    }

    @Override
    public SkillCategory getCategory() {
        return SkillCategory.INTERPRETATION;
    }
}
