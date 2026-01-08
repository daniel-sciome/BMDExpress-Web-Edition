package com.sciome.dto;

import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Container DTO for category analysis results.
 * Holds experiment description at the container level to avoid duplication in rows.
 */
public class CategoryAnalysisResultsDto {

    private static final Logger logger = LoggerFactory.getLogger(CategoryAnalysisResultsDto.class);

    private String name;
    private ExperimentDescriptionDto experimentDescription;
    private List<CategoryAnalysisResultDto> results;

    public CategoryAnalysisResultsDto() {
    }

    /**
     * Convert from desktop app CategoryAnalysisResults to DTO.
     * Uses the convenience method getExperimentDescription() to traverse the object chain.
     */
    public static CategoryAnalysisResultsDto fromDesktopObject(CategoryAnalysisResults categoryResults) {
        CategoryAnalysisResultsDto dto = new CategoryAnalysisResultsDto();

        dto.setName(categoryResults.getName());

        // Use convenience method: CategoryAnalysisResults → BMDResult → DoseResponseExperiment → ExperimentDescription
        dto.setExperimentDescription(
            ExperimentDescriptionDto.fromDesktopObject(categoryResults.getExperimentDescription()));

        // Convert individual results (without experiment description)
        if (categoryResults.getCategoryAnalsyisResults() != null) {
            List<CategoryAnalysisResult> sourceResults = categoryResults.getCategoryAnalsyisResults();
            logger.info("[GENE-DEBUG] Converting {} category results", sourceResults.size());

            // Log first 3 results to check referenceGeneProbeStatResults
            for (int i = 0; i < Math.min(3, sourceResults.size()); i++) {
                CategoryAnalysisResult r = sourceResults.get(i);
                var refs = r.getReferenceGeneProbeStatResults();
                logger.info("[GENE-DEBUG] Result {}: categoryId={}, refs={}", i,
                    r.getCategoryIdentifier() != null ? r.getCategoryIdentifier().getId() : "null",
                    refs != null ? refs.size() : "NULL");
                if (refs != null && !refs.isEmpty()) {
                    logger.info("[GENE-DEBUG]   First gene: {}",
                        refs.get(0).getReferenceGene() != null ? refs.get(0).getReferenceGene().getId() : "null");
                }
            }

            List<CategoryAnalysisResultDto> dtoResults = sourceResults.stream()
                .map(CategoryAnalysisResultDto::fromDesktopObject)
                .collect(Collectors.toList());

            // Log first 3 converted DTOs
            for (int i = 0; i < Math.min(3, dtoResults.size()); i++) {
                CategoryAnalysisResultDto d = dtoResults.get(i);
                logger.info("[GENE-DEBUG] DTO {}: categoryId={}, genes={}, genesUp={}, genesDown={}", i,
                    d.getCategoryId(),
                    d.getGenes() != null ? d.getGenes().substring(0, Math.min(50, d.getGenes().length())) : "null",
                    d.getGenesUp() != null ? d.getGenesUp().substring(0, Math.min(50, d.getGenesUp().length())) : "null",
                    d.getGenesDown() != null ? d.getGenesDown().substring(0, Math.min(50, d.getGenesDown().length())) : "null");
            }

            dto.setResults(dtoResults);
        }

        return dto;
    }

    // Getters and setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ExperimentDescriptionDto getExperimentDescription() {
        return experimentDescription;
    }

    public void setExperimentDescription(ExperimentDescriptionDto experimentDescription) {
        this.experimentDescription = experimentDescription;
    }

    public List<CategoryAnalysisResultDto> getResults() {
        return results;
    }

    public void setResults(List<CategoryAnalysisResultDto> results) {
        this.results = results;
    }
}
