package com.sciome.service.llm.skill;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.stat.BMDResult;
import com.sciome.bmdexpress2.mvp.model.stat.ProbeStatResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class BmdAnalysisSummarySkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(BmdAnalysisSummarySkill.class);

    @Override
    public String getName() {
        return "bmd_analysis_summary";
    }

    @Override
    public String getDescription() {
        return "Summarizes BMD (Benchmark Dose) modeling results including probes modeled, model distribution, and BMD value statistics.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of();
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            BMDProject project = context.getProject();
            List<BMDResult> bmdResults = project.getbMDResult();

            if (bmdResults == null || bmdResults.isEmpty()) {
                return SkillResult.success(getName(), "No BMD analysis results found in project.");
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Total BMD analyses: ").append(bmdResults.size()).append("\n\n");

            for (BMDResult bmdResult : bmdResults) {
                sb.append("Analysis: ").append(bmdResult.getName()).append("\n");

                List<ProbeStatResult> probeResults = bmdResult.getProbeStatResults();
                if (probeResults == null || probeResults.isEmpty()) {
                    sb.append("  No probe results available\n\n");
                    continue;
                }

                sb.append("  Probes modeled: ").append(probeResults.size()).append("\n");

                // Model distribution
                Map<String, Integer> modelCounts = new HashMap<>();
                List<Double> bmdValues = new ArrayList<>();
                List<Double> bmdlValues = new ArrayList<>();
                List<Double> bmduValues = new ArrayList<>();
                int failedCount = 0;

                for (ProbeStatResult psr : probeResults) {
                    var bestStat = psr.getBestStatResult();
                    if (bestStat != null) {
                        String modelName = bestStat.toString();
                        modelCounts.merge(modelName, 1, Integer::sum);
                    } else {
                        failedCount++;
                    }

                    addIfValid(bmdValues, psr.getBestBMD());
                    addIfValid(bmdlValues, psr.getBestBMDL());
                    addIfValid(bmduValues, psr.getBestBMDU());
                }

                // Model distribution
                sb.append("  Model distribution:\n");
                modelCounts.entrySet().stream()
                        .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                        .forEach(e -> sb.append("    ").append(e.getKey())
                                .append(": ").append(e.getValue()).append("\n"));
                if (failedCount > 0) {
                    sb.append("    Failed/no model: ").append(failedCount).append("\n");
                }

                // BMD value statistics
                appendStats(sb, "BMD", bmdValues);
                appendStats(sb, "BMDL", bmdlValues);
                appendStats(sb, "BMDU", bmduValues);

                sb.append("\n");
            }

            String content = sb.toString().trim();
            log.info("BmdAnalysisSummarySkill: summarized {} BMD analyses", bmdResults.size());
            return SkillResult.success(getName(), content);

        } catch (Exception e) {
            log.error("BmdAnalysisSummarySkill failed", e);
            return SkillResult.failure(getName(), e.getMessage());
        }
    }

    private void addIfValid(List<Double> list, Double value) {
        if (value != null && !value.isNaN() && !value.isInfinite() && value > 0) {
            list.add(value);
        }
    }

    private void appendStats(StringBuilder sb, String label, List<Double> values) {
        if (values.isEmpty()) {
            sb.append("  ").append(label).append(" values: none available\n");
            return;
        }

        Collections.sort(values);
        double min = values.get(0);
        double max = values.get(values.size() - 1);
        double median = values.get(values.size() / 2);
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        sb.append("  ").append(label).append(" values (n=").append(values.size()).append("): ");
        sb.append(String.format("min=%.4f, max=%.4f, median=%.4f, mean=%.4f", min, max, median, mean));
        sb.append("\n");
    }
}
