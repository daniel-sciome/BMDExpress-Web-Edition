package com.sciome.service.llm.skill;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class SkillRegistry {

    private static final Logger log = LoggerFactory.getLogger(SkillRegistry.class);

    private final Map<String, Skill> skillsByName;
    private final List<Skill> allSkills;

    public SkillRegistry(List<Skill> skills) {
        this.allSkills = skills;
        this.skillsByName = skills.stream()
                .collect(Collectors.toMap(Skill::getName, s -> s));
        log.info("SkillRegistry initialized with {} skills: {}",
                skills.size(),
                skills.stream().map(Skill::getName).collect(Collectors.joining(", ")));
    }

    public Optional<Skill> getSkill(String name) {
        return Optional.ofNullable(skillsByName.get(name));
    }

    public List<Skill> getSkillsByCategory(SkillCategory category) {
        return allSkills.stream()
                .filter(s -> s.getCategory() == category)
                .collect(Collectors.toList());
    }

    public List<Skill> getToolCallableSkills() {
        return allSkills.stream()
                .filter(Skill::isToolCallable)
                .collect(Collectors.toList());
    }

    public List<Skill> getAllSkills() {
        return List.copyOf(allSkills);
    }

    public String buildToolDescriptionText() {
        List<Skill> toolSkills = getToolCallableSkills();
        if (toolSkills.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("\n\nYou have access to the following tools:\n");
        for (Skill skill : toolSkills) {
            sb.append("- ").append(skill.getName()).append(": ").append(skill.getDescription()).append("\n");
        }
        return sb.toString();
    }
}
