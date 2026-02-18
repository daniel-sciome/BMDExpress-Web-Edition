package com.sciome.service.llm;

import com.sciome.dto.report.DataAttachmentDto;
import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportSectionDto;
import com.sciome.service.llm.skill.SkillRegistry;
import com.sciome.service.llm.skill.SkillResult;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class PromptAssembler {

    private static final String[] SKILL_BLOCK_NAMES = {
            "experiment_summary", "prefilter_summary",
            "bmd_analysis_summary", "category_analysis_summary"
    };

    private static final String[] SKILL_BLOCK_HEADERS = {
            "EXPERIMENT SUMMARY", "PREFILTER SUMMARY",
            "BMD ANALYSIS SUMMARY", "CATEGORY ANALYSIS SUMMARY"
    };

    public String buildSystemPrompt(ReportDto report) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a toxicology report writer assisting with ");
        sb.append(report.getTemplateName()).append(" regulatory submissions.\n\n");
        sb.append("Write in a formal scientific tone appropriate for regulatory toxicology reports. ");
        sb.append("Use precise language, cite specific data values, and organize content with appropriate subheadings. ");
        sb.append("Focus on dose-response relationships and biological significance. ");
        sb.append("Output should be in HTML format suitable for a rich text editor.\n");
        return sb.toString();
    }

    public String buildSystemPromptWithSkills(ReportDto report, SkillRegistry registry) {
        String base = buildSystemPrompt(report);
        String toolDescriptions = registry.buildToolDescriptionText();
        if (toolDescriptions.isEmpty()) {
            return base;
        }
        return base + toolDescriptions;
    }

    public String buildUserPrompt(ReportDto report, ReportSectionDto section,
                                   String clinicalSummary, String instruction,
                                   boolean includeAdjacentSections) {
        return buildUserPromptWithSkillData(report, section, clinicalSummary,
                instruction, includeAdjacentSections, List.of());
    }

    public String buildUserPromptWithSkillData(ReportDto report, ReportSectionDto section,
                                                String clinicalSummary, String instruction,
                                                boolean includeAdjacentSections,
                                                List<SkillResult> skillResults) {
        StringBuilder sb = new StringBuilder();

        // Section purpose
        sb.append("[PURPOSE]\n");
        sb.append(section.getPurpose() != null ? section.getPurpose() : "No specific purpose defined.");
        sb.append("\n\n");

        // Study context from report metadata
        sb.append("[STUDY CONTEXT]\n");
        if (report.getMetadata() != null && !report.getMetadata().isEmpty()) {
            report.getMetadata().forEach((k, v) -> sb.append(k).append(": ").append(v).append("\n"));
        } else {
            sb.append("Project: ").append(report.getProjectId()).append("\n");
        }
        sb.append("\n");

        // Skill data blocks — inserted before genomic/clinical data
        if (skillResults != null && !skillResults.isEmpty()) {
            for (SkillResult result : skillResults) {
                if (!result.isSuccess() || result.getContent() == null || result.getContent().isBlank()) {
                    continue;
                }
                String header = getBlockHeader(result.getSkillName());
                sb.append("[").append(header).append("]\n");
                sb.append(result.getContent());
                sb.append("\n\n");
            }
        }

        // Genomic data attachments
        List<DataAttachmentDto> attachments = section.getDataAttachments();
        if (attachments != null && !attachments.isEmpty()) {
            sb.append("[GENOMIC DATA]\n");
            for (DataAttachmentDto att : attachments) {
                sb.append("- ").append(att.getLabel());
                if (att.getCategoryResultName() != null) {
                    sb.append(" (").append(att.getCategoryResultName()).append(")");
                }
                if (att.getPathwayDescription() != null && !att.getPathwayDescription().isEmpty()) {
                    sb.append(": ").append(att.getPathwayDescription());
                }
                if (att.getGeneSymbols() != null && !att.getGeneSymbols().isEmpty()) {
                    sb.append(" [Genes: ").append(att.getGeneSymbols()).append("]");
                }
                if (att.getSummaryJson() != null && !att.getSummaryJson().isEmpty()) {
                    sb.append("\n  Summary: ").append(att.getSummaryJson());
                }
                sb.append("\n");
            }
            sb.append("\n");
        }

        // Clinical data
        if (clinicalSummary != null && !clinicalSummary.isEmpty()
                && !"No clinical data available.".equals(clinicalSummary)) {
            sb.append("[CLINICAL DATA]\n");
            sb.append(clinicalSummary);
            sb.append("\n");
        }

        // Adjacent sections for narrative coherence
        if (includeAdjacentSections) {
            appendAdjacentSections(sb, report, section);
        }

        // Existing content
        if (section.getContent() != null && !section.getContent().isBlank()) {
            sb.append("[EXISTING CONTENT]\n");
            sb.append(section.getContent());
            sb.append("\n\n");
        }

        // User instruction
        sb.append("[INSTRUCTION]\n");
        sb.append(instruction != null ? instruction : "Draft this section based on the available data.");
        sb.append("\n");

        return sb.toString();
    }

    private String getBlockHeader(String skillName) {
        for (int i = 0; i < SKILL_BLOCK_NAMES.length; i++) {
            if (SKILL_BLOCK_NAMES[i].equals(skillName)) {
                return SKILL_BLOCK_HEADERS[i];
            }
        }
        // Fallback: convert skill_name to SKILL NAME
        return skillName.toUpperCase().replace('_', ' ');
    }

    private void appendAdjacentSections(StringBuilder sb, ReportDto report, ReportSectionDto currentSection) {
        List<ReportSectionDto> sections = report.getSections();
        if (sections == null || sections.size() < 2) return;

        // Sort by order
        List<ReportSectionDto> sorted = sections.stream()
                .sorted(Comparator.comparingInt(ReportSectionDto::getOrder))
                .toList();

        int currentIndex = -1;
        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getId().equals(currentSection.getId())) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex < 0) return;

        sb.append("[ADJACENT SECTIONS]\n");

        // Previous section
        if (currentIndex > 0) {
            ReportSectionDto prev = sorted.get(currentIndex - 1);
            sb.append("Previous section (\"").append(prev.getTitle()).append("\"): ");
            if (prev.getContent() != null && !prev.getContent().isBlank()) {
                String summary = prev.getContent().replaceAll("<[^>]+>", "");
                sb.append(summary.length() > 500 ? summary.substring(0, 500) + "..." : summary);
            } else {
                sb.append("[empty]");
            }
            sb.append("\n");
        }

        // Next section
        if (currentIndex < sorted.size() - 1) {
            ReportSectionDto next = sorted.get(currentIndex + 1);
            sb.append("Next section (\"").append(next.getTitle()).append("\"): ");
            if (next.getContent() != null && !next.getContent().isBlank()) {
                String summary = next.getContent().replaceAll("<[^>]+>", "");
                sb.append(summary.length() > 500 ? summary.substring(0, 500) + "..." : summary);
            } else {
                sb.append("[empty]");
            }
            sb.append("\n");
        }
        sb.append("\n");
    }
}
