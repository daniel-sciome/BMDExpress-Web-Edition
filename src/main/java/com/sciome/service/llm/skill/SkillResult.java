package com.sciome.service.llm.skill;

import java.util.Map;

public class SkillResult {
    private final boolean success;
    private final String content;
    private final String error;
    private final String skillName;
    private final Map<String, Object> metadata;

    private SkillResult(boolean success, String content, String error,
                        String skillName, Map<String, Object> metadata) {
        this.success = success;
        this.content = content;
        this.error = error;
        this.skillName = skillName;
        this.metadata = metadata;
    }

    public static SkillResult success(String skillName, String content) {
        return new SkillResult(true, content, null, skillName, Map.of());
    }

    public static SkillResult success(String skillName, String content, Map<String, Object> metadata) {
        return new SkillResult(true, content, null, skillName, metadata);
    }

    public static SkillResult failure(String skillName, String error) {
        return new SkillResult(false, null, error, skillName, Map.of());
    }

    public boolean isSuccess() {
        return success;
    }

    public String getContent() {
        return content;
    }

    public String getError() {
        return error;
    }

    public String getSkillName() {
        return skillName;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }
}
