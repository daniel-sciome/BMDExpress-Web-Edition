package com.sciome.service;

import com.sciome.dto.report.ReportSectionDto;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ReportTemplateProviderTest {

    private final ReportTemplateProvider provider = new ReportTemplateProvider();

    @Test
    void allTemplatesAvailable() {
        List<String> templates = provider.getAvailableTemplates();
        assertEquals(4, templates.size());
        assertTrue(templates.contains("EPA BMD Guidance"));
        assertTrue(templates.contains("ICH General Tox"));
        assertTrue(templates.contains("OECD TG"));
        assertTrue(templates.contains("Blank"));
    }

    @Test
    void epaBmdTemplateHasValidSections() {
        List<ReportSectionDto> sections = provider.generateSections("EPA BMD Guidance");
        assertValidSectionTree(sections, "EPA BMD Guidance");

        // Should have root sections for major areas
        long rootCount = sections.stream().filter(s -> s.getParentId() == null).count();
        assertTrue(rootCount >= 4, "EPA BMD should have at least 4 root sections");
    }

    @Test
    void ichTemplateHasValidSections() {
        List<ReportSectionDto> sections = provider.generateSections("ICH General Tox");
        assertValidSectionTree(sections, "ICH General Tox");
    }

    @Test
    void oecdTemplateHasValidSections() {
        List<ReportSectionDto> sections = provider.generateSections("OECD TG");
        assertValidSectionTree(sections, "OECD TG");
    }

    @Test
    void blankTemplateIsEmpty() {
        List<ReportSectionDto> sections = provider.generateSections("Blank");
        assertTrue(sections.isEmpty());
    }

    @Test
    void unknownTemplateIsEmpty() {
        List<ReportSectionDto> sections = provider.generateSections("Unknown Template");
        assertTrue(sections.isEmpty());
    }

    private void assertValidSectionTree(List<ReportSectionDto> sections, String templateName) {
        assertFalse(sections.isEmpty(), templateName + " should have sections");

        Set<String> ids = new HashSet<>();
        for (ReportSectionDto section : sections) {
            assertNotNull(section.getId(), "Section must have an ID");
            assertNotNull(section.getTitle(), "Section must have a title");
            assertNotNull(section.getSectionType(), "Section must have a type");
            assertNotNull(section.getStatus(), "Section must have a status");
            assertEquals("draft", section.getStatus(), "Initial status should be 'draft'");
            assertTrue(ids.add(section.getId()), "Section IDs must be unique: " + section.getId());

            // If it has a parent, the parent must exist
            if (section.getParentId() != null) {
                assertTrue(sections.stream().anyMatch(s -> s.getId().equals(section.getParentId())),
                        "Parent ID must reference existing section: " + section.getParentId());
            }
        }
    }
}
