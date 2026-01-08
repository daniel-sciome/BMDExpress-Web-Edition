package com.sciome.dto.prefilter;

/**
 * Result data for Oriogen prefilter analysis
 * Contains dose-response pattern profile string
 */
public class OriogenResult extends PrefilterResult {

    /**
     * Pattern description string
     * Describes the dose-response pattern observed
     * Examples: "↑↑↑" (increasing), "↓↓" (decreasing), "↑↓↑" (non-monotonic)
     */
    private String profile;

    public OriogenResult() {
        super();
    }

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }
}
