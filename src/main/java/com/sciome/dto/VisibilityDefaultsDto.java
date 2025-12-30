package com.sciome.dto;

/**
 * DTO for visibility default values.
 * Hilla generates TypeScript types from this class.
 *
 * These defaults are loaded from application.yml and exposed
 * to the frontend via DefaultsService @BrowserCallable.
 */
public class VisibilityDefaultsDto {

    private String defaultState;    // normal | highlighted | dimmed | hidden
    private String defaultSize;     // small | medium | large
    private String nonSelected;     // How to display non-selected items: normal | dimmed | hidden

    public VisibilityDefaultsDto() {
    }

    public VisibilityDefaultsDto(String defaultState, String defaultSize, String nonSelected) {
        this.defaultState = defaultState;
        this.defaultSize = defaultSize;
        this.nonSelected = nonSelected;
    }

    public String getDefaultState() {
        return defaultState;
    }

    public void setDefaultState(String defaultState) {
        this.defaultState = defaultState;
    }

    public String getDefaultSize() {
        return defaultSize;
    }

    public void setDefaultSize(String defaultSize) {
        this.defaultSize = defaultSize;
    }

    public String getNonSelected() {
        return nonSelected;
    }

    public void setNonSelected(String nonSelected) {
        this.nonSelected = nonSelected;
    }
}
