package com.sciome.service.llm.skill;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResult;
import com.sciome.bmdexpress2.mvp.model.category.CategoryAnalysisResults;
import com.sciome.bmdexpress2.mvp.model.category.ReferenceGeneProbeStatResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class CategoryAnalysisSummarySkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(CategoryAnalysisSummarySkill.class);
    private static final int TOP_PATHWAYS = 20;
    private static final int MAX_GENES_DISPLAY = 20;

    @Override
    public String getName() {
        return "category_analysis_summary";
    }

    @Override
    public String getDescription() {
        return "Summarizes category/pathway enrichment analyses with top 20 pathways by Fisher's p-value, including gene counts, BMD statistics, direction, and gene symbols.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of();
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            BMDProject project = context.getProject();
            List<CategoryAnalysisResults> catResults = project.getCategoryAnalysisResults();

            if (catResults == null || catResults.isEmpty()) {
                return SkillResult.success(getName(), "No category analysis results found in project.");
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Total category analyses: ").append(catResults.size()).append("\n\n");

            for (CategoryAnalysisResults catResult : catResults) {
                sb.append("Analysis: ").append(catResult.getName()).append("\n");

                List<CategoryAnalysisResult> pathways = catResult.getCategoryAnalsyisResults();
                if (pathways == null || pathways.isEmpty()) {
                    sb.append("  No pathway results available\n\n");
                    continue;
                }

                sb.append("  Total pathways: ").append(pathways.size()).append("\n");

                // Sort by Fisher's exact two-tail p-value and take top N
                List<CategoryAnalysisResult> topPathways = pathways.stream()
                        .filter(p -> p.getFishersExactTwoTailPValue() != null)
                        .sorted(Comparator.comparingDouble(CategoryAnalysisResult::getFishersExactTwoTailPValue))
                        .limit(TOP_PATHWAYS)
                        .toList();

                sb.append("  Top ").append(Math.min(TOP_PATHWAYS, topPathways.size()))
                        .append(" pathways by Fisher's p-value:\n\n");

                for (int i = 0; i < topPathways.size(); i++) {
                    CategoryAnalysisResult pathway = topPathways.get(i);
                    sb.append("  ").append(i + 1).append(". ");
                    sb.append(pathway.getCategoryDescription());

                    // Category ID
                    if (pathway.getCategoryIdentifier() != null) {
                        sb.append(" [").append(pathway.getCategoryIdentifier()).append("]");
                    }
                    sb.append("\n");

                    // Gene count
                    int geneCount = 0;
                    if (pathway.getReferenceGeneProbeStatResults() != null) {
                        geneCount = pathway.getReferenceGeneProbeStatResults().size();
                    }
                    sb.append("     Genes: ").append(geneCount);

                    // Fisher's p-value
                    sb.append(" | Fisher p-value: ").append(
                            String.format("%.2e", pathway.getFishersExactTwoTailPValue()));

                    // BMD stats
                    if (pathway.getBmdMedian() != null) {
                        sb.append(" | BMD median: ").append(
                                String.format("%.4f", pathway.getBmdMedian()));
                    }
                    if (pathway.getBmdlMedian() != null) {
                        sb.append(" | BMDL median: ").append(
                                String.format("%.4f", pathway.getBmdlMedian()));
                    }

                    // Direction
                    if (pathway.getOverallDirection() != null) {
                        sb.append(" | Direction: ").append(pathway.getOverallDirection());
                    }

                    sb.append("\n");

                    // Gene symbols
                    List<String> genes = extractGeneSymbols(pathway);
                    if (!genes.isEmpty()) {
                        sb.append("     Gene symbols: ");
                        if (genes.size() > MAX_GENES_DISPLAY) {
                            sb.append(String.join(", ", genes.subList(0, MAX_GENES_DISPLAY)));
                            sb.append(" ... (").append(genes.size() - MAX_GENES_DISPLAY).append(" more)");
                        } else {
                            sb.append(String.join(", ", genes));
                        }
                        sb.append("\n");
                    }

                    sb.append("\n");
                }
            }

            String content = sb.toString().trim();
            log.info("CategoryAnalysisSummarySkill: summarized {} category analyses", catResults.size());
            return SkillResult.success(getName(), content);

        } catch (Exception e) {
            log.error("CategoryAnalysisSummarySkill failed", e);
            return SkillResult.failure(getName(), e.getMessage());
        }
    }

    private List<String> extractGeneSymbols(CategoryAnalysisResult pathway) {
        if (pathway.getReferenceGeneProbeStatResults() == null) {
            return List.of();
        }

        Set<String> symbols = new LinkedHashSet<>();
        for (ReferenceGeneProbeStatResult rgps : pathway.getReferenceGeneProbeStatResults()) {
            if (rgps.getReferenceGene() != null && rgps.getReferenceGene().getGeneSymbol() != null) {
                symbols.add(rgps.getReferenceGene().getGeneSymbol());
            }
        }

        List<String> sorted = new ArrayList<>(symbols);
        Collections.sort(sorted);
        return sorted;
    }
}
