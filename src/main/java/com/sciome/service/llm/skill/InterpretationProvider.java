package com.sciome.service.llm.skill;

import java.util.List;

/**
 * Swappable backend for biological interpretation.
 * Now: PubMed E-utilities web search.
 * Future: custom trained model.
 */
public interface InterpretationProvider {

    String getName();

    /**
     * Interpret a pathway's biological significance given study context.
     *
     * @param pathwayName   pathway/category description
     * @param pathwayId     pathway identifier (GO ID, KEGG ID, etc.)
     * @param species       species under study
     * @param organ         target organ/tissue
     * @param testArticle   chemical/compound name
     * @param geneSymbols   genes in the pathway
     * @return interpretation text suitable for LLM context
     */
    String interpretPathway(String pathwayName, String pathwayId,
                            String species, String organ, String testArticle,
                            List<String> geneSymbols);

    /**
     * Search literature for relevant toxicology studies.
     *
     * @param queryContext   free-text context for the search
     * @param testArticle   chemical/compound name
     * @param organ         target organ/tissue
     * @return literature summary suitable for LLM context
     */
    String searchLiterature(String queryContext, String testArticle, String organ);
}
