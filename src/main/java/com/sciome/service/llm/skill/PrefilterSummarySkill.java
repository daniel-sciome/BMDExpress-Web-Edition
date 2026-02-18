package com.sciome.service.llm.skill;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.info.AnalysisInfo;
import com.sciome.bmdexpress2.mvp.model.prefilter.OneWayANOVAResults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class PrefilterSummarySkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(PrefilterSummarySkill.class);

    @Override
    public String getName() {
        return "prefilter_summary";
    }

    @Override
    public String getDescription() {
        return "Summarizes all prefilter analyses (ANOVA, Williams Trend, Oriogen, Curve Fit) including probes analyzed/passed and filter parameters.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of();
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            BMDProject project = context.getProject();
            StringBuilder sb = new StringBuilder();
            int totalCount = 0;

            // One-Way ANOVA
            totalCount += appendAnovaResults(sb, project);

            // Williams Trend
            totalCount += appendGenericPrefilter(sb, "Williams Trend",
                    project.getWilliamsTrendResults());

            // Oriogen
            totalCount += appendGenericPrefilter(sb, "Oriogen",
                    project.getOriogenResults());

            // Curve Fit Prefilter
            totalCount += appendGenericPrefilter(sb, "Curve Fit Prefilter",
                    project.getCurveFitPrefilterResults());

            if (totalCount == 0) {
                return SkillResult.success(getName(), "No prefilter analyses found in project.");
            }

            sb.insert(0, "Total prefilter analyses: " + totalCount + "\n\n");

            String content = sb.toString().trim();
            log.info("PrefilterSummarySkill: summarized {} prefilter analyses", totalCount);
            return SkillResult.success(getName(), content);

        } catch (Exception e) {
            log.error("PrefilterSummarySkill failed", e);
            return SkillResult.failure(getName(), e.getMessage());
        }
    }

    private int appendAnovaResults(StringBuilder sb, BMDProject project) {
        List<OneWayANOVAResults> anovaList = project.getOneWayANOVAResults();
        if (anovaList == null || anovaList.isEmpty()) {
            return 0;
        }

        for (OneWayANOVAResults anova : anovaList) {
            sb.append("Analysis: ").append(anova.getName()).append("\n");
            sb.append("  Type: One-Way ANOVA\n");

            // Experiment reference
            if (anova.getDoseResponseExperiement() != null) {
                sb.append("  Experiment: ").append(anova.getDoseResponseExperiement().getName()).append("\n");
            }

            // Probe count
            if (anova.getOneWayANOVAResults() != null) {
                sb.append("  Probes in results: ").append(anova.getOneWayANOVAResults().size()).append("\n");
            }

            // Analysis parameters
            appendAnalysisInfo(sb, anova.getAnalysisInfo());
            sb.append("\n");
        }

        return anovaList.size();
    }

    @SuppressWarnings("unchecked")
    private int appendGenericPrefilter(StringBuilder sb, String typeName, List<?> resultsList) {
        if (resultsList == null || resultsList.isEmpty()) {
            return 0;
        }

        for (Object results : resultsList) {
            try {
                // Use reflection to access getName() and getAnalysisInfo()
                String name = (String) results.getClass().getMethod("getName").invoke(results);
                sb.append("Analysis: ").append(name).append("\n");
                sb.append("  Type: ").append(typeName).append("\n");

                // Try to get experiment reference
                try {
                    Object exp = results.getClass().getMethod("getDoseResponseExperiement").invoke(results);
                    if (exp != null) {
                        String expName = (String) exp.getClass().getMethod("getName").invoke(exp);
                        sb.append("  Experiment: ").append(expName).append("\n");
                    }
                } catch (NoSuchMethodException ignored) {
                    // Some containers may use different method names
                }

                // Analysis info
                try {
                    AnalysisInfo info = (AnalysisInfo) results.getClass()
                            .getMethod("getAnalysisInfo").invoke(results);
                    appendAnalysisInfo(sb, info);
                } catch (NoSuchMethodException ignored) {
                    // No analysis info available
                }

                sb.append("\n");
            } catch (Exception e) {
                sb.append("Analysis: ").append(typeName).append(" (details unavailable)\n\n");
                log.debug("Could not extract details from {} result: {}", typeName, e.getMessage());
            }
        }

        return resultsList.size();
    }

    private void appendAnalysisInfo(StringBuilder sb, AnalysisInfo info) {
        if (info == null) return;
        List<String> notes = info.getNotes();
        if (notes == null || notes.isEmpty()) return;

        sb.append("  Parameters:\n");
        for (String note : notes) {
            sb.append("    - ").append(note).append("\n");
        }
    }
}
