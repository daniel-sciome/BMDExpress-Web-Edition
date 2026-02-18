package com.sciome.service.llm.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Tool-callable skill wrapping InterpretationProvider.searchLiterature().
 * Designed for Phase 2 LLM tool-use — the LLM can call this to
 * search for relevant toxicogenomics literature.
 */
@Component
public class LiteratureSearchSkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(LiteratureSearchSkill.class);

    private final InterpretationProvider interpretationProvider;

    public LiteratureSearchSkill(InterpretationProvider interpretationProvider) {
        this.interpretationProvider = interpretationProvider;
    }

    @Override
    public String getName() {
        return "literature_search";
    }

    @Override
    public String getDescription() {
        return "Searches PubMed for toxicogenomics literature relevant to the study's test article, target organ, and a free-text query context.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of(
                "type", "object",
                "properties", Map.of(
                        "queryContext", Map.of("type", "string",
                                "description", "Free-text context for the literature search"),
                        "testArticle", Map.of("type", "string",
                                "description", "Chemical/compound name"),
                        "organ", Map.of("type", "string",
                                "description", "Target organ or tissue")
                ),
                "required", List.of("queryContext")
        );
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            String queryContext = (String) parameters.getOrDefault("queryContext", "");
            String testArticle = (String) parameters.getOrDefault("testArticle", "");
            String organ = (String) parameters.getOrDefault("organ", "");

            log.info("LiteratureSearchSkill: searching for '{}' / {} / {}", queryContext, testArticle, organ);

            String result = interpretationProvider.searchLiterature(queryContext, testArticle, organ);

            return SkillResult.success(getName(), result);

        } catch (Exception e) {
            log.error("LiteratureSearchSkill failed", e);
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
