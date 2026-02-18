package com.sciome.service.llm.skill;

import com.sciome.bmdexpress2.mvp.model.BMDProject;
import com.sciome.bmdexpress2.mvp.model.DoseResponseExperiment;
import com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ExperimentSummarySkill implements Skill {

    private static final Logger log = LoggerFactory.getLogger(ExperimentSummarySkill.class);

    @Override
    public String getName() {
        return "experiment_summary";
    }

    @Override
    public String getDescription() {
        return "Summarizes all dose-response experiments in the project including species, strain, sex, organ, test article, dose levels, and probe counts.";
    }

    @Override
    public Map<String, Object> getParameterSchema() {
        return Map.of();
    }

    @Override
    public SkillResult execute(SkillContext context, Map<String, Object> parameters) {
        try {
            BMDProject project = context.getProject();
            List<DoseResponseExperiment> experiments = project.getDoseResponseExperiments();

            if (experiments == null || experiments.isEmpty()) {
                return SkillResult.success(getName(), "No dose-response experiments found in project.");
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Project: ").append(project.getName()).append("\n");
            sb.append("Total experiments: ").append(experiments.size()).append("\n\n");

            for (int i = 0; i < experiments.size(); i++) {
                DoseResponseExperiment exp = experiments.get(i);
                sb.append("Experiment ").append(i + 1).append(": ").append(exp.getName()).append("\n");

                // Probe and treatment counts
                int probeCount = exp.getProbeResponses() != null ? exp.getProbeResponses().size() : 0;
                int treatmentCount = exp.getTreatments() != null ? exp.getTreatments().size() : 0;
                sb.append("  Probes: ").append(probeCount).append("\n");
                sb.append("  Treatments (samples): ").append(treatmentCount).append("\n");

                // Dose levels
                if (exp.getTreatments() != null && !exp.getTreatments().isEmpty()) {
                    List<Double> uniqueDoses = exp.getTreatments().stream()
                            .map(t -> t.getDose().doubleValue())
                            .distinct()
                            .sorted()
                            .toList();
                    sb.append("  Dose levels: ").append(uniqueDoses).append("\n");
                    sb.append("  Number of dose groups: ").append(uniqueDoses.size()).append("\n");
                }

                // Experiment description metadata
                ExperimentDescription desc = exp.getExperimentDescription();
                if (desc != null && desc.hasDescription()) {
                    if (desc.getTestArticle() != null && desc.getTestArticle().getName() != null) {
                        sb.append("  Test article: ").append(desc.getTestArticle().getName()).append("\n");
                        if (desc.getTestArticle().getCasrn() != null) {
                            sb.append("  CASRN: ").append(desc.getTestArticle().getCasrn()).append("\n");
                        }
                    }
                    appendIfPresent(sb, "  Species", desc.getSpecies());
                    appendIfPresent(sb, "  Strain", desc.getStrain());
                    appendIfPresent(sb, "  Sex", desc.getSex());
                    appendIfPresent(sb, "  Organ/Tissue", desc.getOrgan());
                    appendIfPresent(sb, "  Route", desc.getArticleRoute());
                    appendIfPresent(sb, "  Duration", desc.getStudyDuration());
                    appendIfPresent(sb, "  Platform", desc.getPlatform());
                    appendIfPresent(sb, "  Cell line", desc.getCellLine());
                }

                sb.append("\n");
            }

            String content = sb.toString().trim();
            log.info("ExperimentSummarySkill: summarized {} experiments", experiments.size());
            return SkillResult.success(getName(), content);

        } catch (Exception e) {
            log.error("ExperimentSummarySkill failed", e);
            return SkillResult.failure(getName(), e.getMessage());
        }
    }

    private void appendIfPresent(StringBuilder sb, String label, String value) {
        if (value != null && !value.isEmpty()) {
            sb.append(label).append(": ").append(value).append("\n");
        }
    }
}
