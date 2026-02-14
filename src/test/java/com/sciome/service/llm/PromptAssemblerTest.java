package com.sciome.service.llm;

import com.sciome.dto.report.DataAttachmentDto;
import com.sciome.dto.report.ReportDto;
import com.sciome.dto.report.ReportSectionDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PromptAssemblerTest {

    private final PromptAssembler assembler = new PromptAssembler();

    @Test
    void buildSystemPromptContainsTemplateName() {
        ReportDto report = createReport();
        String systemPrompt = assembler.buildSystemPrompt(report);

        assertTrue(systemPrompt.contains("EPA BMD Guidance"));
        assertTrue(systemPrompt.contains("toxicology"));
        assertTrue(systemPrompt.contains("HTML"));
    }

    @Test
    void buildUserPromptContainsSectionPurpose() {
        ReportDto report = createReport();
        ReportSectionDto section = report.getSections().get(0);

        String prompt = assembler.buildUserPrompt(report, section, null, "Write it", false);

        assertTrue(prompt.contains("[PURPOSE]"));
        assertTrue(prompt.contains("Study overview"));
        assertTrue(prompt.contains("[INSTRUCTION]"));
        assertTrue(prompt.contains("Write it"));
    }

    @Test
    void buildUserPromptIncludesClinicalData() {
        ReportDto report = createReport();
        ReportSectionDto section = report.getSections().get(0);

        String prompt = assembler.buildUserPrompt(report, section,
                "NOAEL: 100 mg/kg", "Draft", false);

        assertTrue(prompt.contains("[CLINICAL DATA]"));
        assertTrue(prompt.contains("NOAEL: 100 mg/kg"));
    }

    @Test
    void buildUserPromptIncludesGenomicAttachments() {
        ReportDto report = createReport();
        ReportSectionDto section = report.getSections().get(0);

        DataAttachmentDto att = new DataAttachmentDto();
        att.setLabel("GO_BP Kidney");
        att.setCategoryResultName("GO_BP Analysis");
        att.setGeneSymbols("CYP1A1;CYP2B6");
        section.setDataAttachments(List.of(att));

        String prompt = assembler.buildUserPrompt(report, section, null, "Draft", false);

        assertTrue(prompt.contains("[GENOMIC DATA]"));
        assertTrue(prompt.contains("GO_BP Kidney"));
        assertTrue(prompt.contains("CYP1A1"));
    }

    @Test
    void buildUserPromptIncludesAdjacentSections() {
        ReportDto report = createReport();
        ReportSectionDto section = report.getSections().get(1); // middle section

        String prompt = assembler.buildUserPrompt(report, section, null, "Draft", true);

        assertTrue(prompt.contains("[ADJACENT SECTIONS]"));
    }

    @Test
    void buildUserPromptExcludesAdjacentSectionsWhenDisabled() {
        ReportDto report = createReport();
        ReportSectionDto section = report.getSections().get(1);

        String prompt = assembler.buildUserPrompt(report, section, null, "Draft", false);

        assertFalse(prompt.contains("[ADJACENT SECTIONS]"));
    }

    private ReportDto createReport() {
        ReportDto report = new ReportDto();
        report.setTitle("Test Report");
        report.setProjectId("project-1");
        report.setTemplateName("EPA BMD Guidance");

        ReportSectionDto s1 = new ReportSectionDto();
        s1.setId("s1");
        s1.setTitle("Overview");
        s1.setOrder(0);
        s1.setPurpose("Study overview");
        s1.setContent("<p>Overview content</p>");
        s1.setSectionType("overview");
        s1.setStatus("draft");

        ReportSectionDto s2 = new ReportSectionDto();
        s2.setId("s2");
        s2.setTitle("Results");
        s2.setOrder(1);
        s2.setPurpose("Present results");
        s2.setContent("");
        s2.setSectionType("results");
        s2.setStatus("draft");

        ReportSectionDto s3 = new ReportSectionDto();
        s3.setId("s3");
        s3.setTitle("Conclusions");
        s3.setOrder(2);
        s3.setPurpose("Summarize");
        s3.setContent("<p>Conclusions</p>");
        s3.setSectionType("conclusions");
        s3.setStatus("draft");

        report.setSections(List.of(s1, s2, s3));
        return report;
    }
}
