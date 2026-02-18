package com.sciome.service.llm.skill;

import java.util.Map;

public interface Skill {
    String getName();

    String getDescription();

    Map<String, Object> getParameterSchema();

    SkillResult execute(SkillContext context, Map<String, Object> parameters);

    default boolean isToolCallable() {
        return false;
    }

    default SkillCategory getCategory() {
        return SkillCategory.DATA_EXTRACTION;
    }
}
