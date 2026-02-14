package com.sciome.service;

import com.sciome.dto.report.ReportSectionDto;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ReportTemplateProvider {

    private static final Map<String, String> TEMPLATE_DESCRIPTIONS = new LinkedHashMap<>();

    static {
        TEMPLATE_DESCRIPTIONS.put("EPA BMD Guidance", "EPA Benchmark Dose Technical Guidance for regulatory submissions");
        TEMPLATE_DESCRIPTIONS.put("ICH General Tox", "ICH S4/M3 General Toxicology study report format");
        TEMPLATE_DESCRIPTIONS.put("OECD TG", "OECD Test Guidelines compliant toxicology report");
        TEMPLATE_DESCRIPTIONS.put("Blank", "Empty report with no pre-defined sections");
    }

    public List<String> getAvailableTemplates() {
        return new ArrayList<>(TEMPLATE_DESCRIPTIONS.keySet());
    }

    public String getTemplateDescription(String templateName) {
        return TEMPLATE_DESCRIPTIONS.getOrDefault(templateName, "");
    }

    public List<ReportSectionDto> generateSections(String templateName) {
        return switch (templateName) {
            case "EPA BMD Guidance" -> generateEpaBmdSections();
            case "ICH General Tox" -> generateIchSections();
            case "OECD TG" -> generateOecdSections();
            case "Blank" -> new ArrayList<>();
            default -> new ArrayList<>();
        };
    }

    private List<ReportSectionDto> generateEpaBmdSections() {
        List<ReportSectionDto> sections = new ArrayList<>();
        int order = 0;

        // 1. Study Overview
        String overviewId = UUID.randomUUID().toString();
        sections.add(createSection(overviewId, null, "Study Overview", order++, "overview",
                "Provide a high-level summary of the study design, test article, species, and objectives."));

        sections.add(createSection(UUID.randomUUID().toString(), overviewId, "Test Article", order++, "subsection",
                "Describe the test article identity, purity, and formulation."));
        sections.add(createSection(UUID.randomUUID().toString(), overviewId, "Study Design", order++, "subsection",
                "Summarize dose groups, duration, route of administration, and animal numbers."));
        sections.add(createSection(UUID.randomUUID().toString(), overviewId, "Objectives", order++, "subsection",
                "State the primary and secondary objectives of the study."));

        // 2. Traditional Toxicology
        String tradToxId = UUID.randomUUID().toString();
        sections.add(createSection(tradToxId, null, "Traditional Toxicology Findings", order++, "trad_tox",
                "Present all conventional toxicology endpoints and identify the NOAEL/LOAEL."));

        sections.add(createSection(UUID.randomUUID().toString(), tradToxId, "Clinical Observations", order++, "subsection",
                "Summarize in-life clinical signs, body weights, and food consumption."));
        sections.add(createSection(UUID.randomUUID().toString(), tradToxId, "Hematology", order++, "clinical_data",
                "Present hematology findings with dose-response relationships."));
        sections.add(createSection(UUID.randomUUID().toString(), tradToxId, "Clinical Chemistry", order++, "clinical_data",
                "Present clinical chemistry findings with dose-response relationships."));
        sections.add(createSection(UUID.randomUUID().toString(), tradToxId, "Organ Weights", order++, "clinical_data",
                "Present organ weight data (absolute and relative) with statistical analysis."));
        sections.add(createSection(UUID.randomUUID().toString(), tradToxId, "Histopathology", order++, "clinical_data",
                "Summarize microscopic findings by organ and severity."));

        // 3. Genomics Analysis
        String genomicsId = UUID.randomUUID().toString();
        sections.add(createSection(genomicsId, null, "Toxicogenomics Analysis", order++, "genomics",
                "Present BMD analysis results from pathway and gene-level analyses."));

        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "BMD Analysis Overview", order++, "subsection",
                "Describe the BMD modeling approach, model averaging, and filtering criteria."));
        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Pathway Analysis", order++, "data_summary",
                "Present top enriched pathways with BMD/BMDL/BMDU estimates and gene counts."));
        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Gene-Level Results", order++, "data_summary",
                "Highlight key gene-level findings supporting pathway-level conclusions."));
        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Dose-Response Curves", order++, "charts",
                "Present dose-response curves for key pathways and genes."));

        // 4. Integrated Assessment
        String integratedId = UUID.randomUUID().toString();
        sections.add(createSection(integratedId, null, "Integrated Assessment", order++, "integration",
                "Synthesize traditional toxicology and genomics findings into a unified assessment."));

        sections.add(createSection(UUID.randomUUID().toString(), integratedId, "Concordance Analysis", order++, "subsection",
                "Compare genomic BMD estimates with apical endpoints to assess concordance."));
        sections.add(createSection(UUID.randomUUID().toString(), integratedId, "Weight of Evidence", order++, "subsection",
                "Evaluate the weight of evidence across all data streams."));
        sections.add(createSection(UUID.randomUUID().toString(), integratedId, "Point of Departure", order++, "subsection",
                "Identify the recommended point of departure integrating both data types."));

        // 5. Conclusions
        sections.add(createSection(UUID.randomUUID().toString(), null, "Conclusions and Recommendations", order++, "conclusions",
                "State the overall conclusions and any recommendations for risk assessment."));

        // 6. References
        sections.add(createSection(UUID.randomUUID().toString(), null, "References", order++, "references",
                "List all references cited in the report."));

        return sections;
    }

    private List<ReportSectionDto> generateIchSections() {
        List<ReportSectionDto> sections = new ArrayList<>();
        int order = 0;

        String overviewId = UUID.randomUUID().toString();
        sections.add(createSection(overviewId, null, "Study Summary", order++, "overview",
                "Provide an executive summary of the study for ICH S4/M3 compliance."));

        sections.add(createSection(UUID.randomUUID().toString(), overviewId, "Introduction", order++, "subsection",
                "Background, regulatory context, and study rationale."));
        sections.add(createSection(UUID.randomUUID().toString(), overviewId, "Materials and Methods", order++, "subsection",
                "Test system, study design, dose selection rationale, and analytical methods."));

        String resultsId = UUID.randomUUID().toString();
        sections.add(createSection(resultsId, null, "Results", order++, "trad_tox",
                "Present all study results organized by endpoint category."));

        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Survival and Clinical Signs", order++, "subsection",
                "Mortality, morbidity, and clinical observations."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Body Weight and Food Consumption", order++, "subsection",
                "Body weight changes and food consumption data."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Clinical Pathology", order++, "clinical_data",
                "Hematology and clinical chemistry findings."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Organ Weights", order++, "clinical_data",
                "Absolute and relative organ weights with statistical analysis."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Histopathology", order++, "clinical_data",
                "Microscopic findings organized by organ system."));

        String genomicsId = UUID.randomUUID().toString();
        sections.add(createSection(genomicsId, null, "Toxicogenomics Assessment", order++, "genomics",
                "Genomics-based mechanistic analysis and BMD modeling."));

        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Gene Expression Analysis", order++, "data_summary",
                "Overview of differentially expressed genes and dose-response modeling."));
        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Pathway Enrichment", order++, "data_summary",
                "Functional pathway analysis with BMD estimates."));

        String discussionId = UUID.randomUUID().toString();
        sections.add(createSection(discussionId, null, "Discussion", order++, "integration",
                "Interpret findings in context of study objectives and regulatory requirements."));

        sections.add(createSection(UUID.randomUUID().toString(), discussionId, "Toxicological Significance", order++, "subsection",
                "Discuss the biological and toxicological significance of findings."));
        sections.add(createSection(UUID.randomUUID().toString(), discussionId, "Integrated Risk Assessment", order++, "subsection",
                "Integrate classical and genomics endpoints for risk characterization."));

        sections.add(createSection(UUID.randomUUID().toString(), null, "Conclusions", order++, "conclusions",
                "Summary of key findings and NOAEL/LOAEL determination."));

        sections.add(createSection(UUID.randomUUID().toString(), null, "References", order++, "references",
                "Cited literature and regulatory guidance documents."));

        return sections;
    }

    private List<ReportSectionDto> generateOecdSections() {
        List<ReportSectionDto> sections = new ArrayList<>();
        int order = 0;

        sections.add(createSection(UUID.randomUUID().toString(), null, "Study Identification", order++, "overview",
                "Test facility, study number, test and reference items, regulatory purpose."));

        String methodsId = UUID.randomUUID().toString();
        sections.add(createSection(methodsId, null, "Materials and Methods", order++, "overview",
                "Describe experimental procedures per OECD Test Guidelines."));

        sections.add(createSection(UUID.randomUUID().toString(), methodsId, "Test System", order++, "subsection",
                "Species, strain, source, housing, diet, and environmental conditions."));
        sections.add(createSection(UUID.randomUUID().toString(), methodsId, "Experimental Design", order++, "subsection",
                "Dose levels, group sizes, route, vehicle, and duration."));
        sections.add(createSection(UUID.randomUUID().toString(), methodsId, "Observations and Examinations", order++, "subsection",
                "Parameters evaluated: clinical signs, body weight, food consumption, laboratory tests."));

        String resultsId = UUID.randomUUID().toString();
        sections.add(createSection(resultsId, null, "Results and Discussion", order++, "trad_tox",
                "Present all results with interpretation."));

        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Clinical Findings", order++, "clinical_data",
                "Hematology, clinical chemistry, and urinalysis results."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Gross and Histopathology", order++, "clinical_data",
                "Macroscopic and microscopic examination results."));
        sections.add(createSection(UUID.randomUUID().toString(), resultsId, "Organ Weights", order++, "clinical_data",
                "Absolute and relative organ weight data."));

        String genomicsId = UUID.randomUUID().toString();
        sections.add(createSection(genomicsId, null, "Genomics Integration", order++, "genomics",
                "Toxicogenomic analysis complementing traditional endpoints."));

        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "BMD Analysis", order++, "data_summary",
                "Benchmark dose analysis of gene expression and pathway data."));
        sections.add(createSection(UUID.randomUUID().toString(), genomicsId, "Mechanistic Interpretation", order++, "subsection",
                "Biological pathway analysis and mechanistic insights."));

        sections.add(createSection(UUID.randomUUID().toString(), null, "Overall Assessment", order++, "integration",
                "Integrated evaluation of all endpoints for hazard characterization."));

        sections.add(createSection(UUID.randomUUID().toString(), null, "Conclusions", order++, "conclusions",
                "NOAEL/LOAEL determination and classification recommendations."));

        sections.add(createSection(UUID.randomUUID().toString(), null, "References", order++, "references",
                "Literature and OECD Test Guideline references."));

        return sections;
    }

    private ReportSectionDto createSection(String id, String parentId, String title, int order,
                                           String sectionType, String purpose) {
        ReportSectionDto section = new ReportSectionDto();
        section.setId(id);
        section.setParentId(parentId);
        section.setTitle(title);
        section.setOrder(order);
        section.setSectionType(sectionType);
        section.setPurpose(purpose);
        section.setContent("");
        section.setStatus("draft");
        return section;
    }
}
