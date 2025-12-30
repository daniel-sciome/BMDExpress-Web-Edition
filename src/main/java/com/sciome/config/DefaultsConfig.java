package com.sciome.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for default values.
 * Values are loaded from application.yml under the "bmdexpress.defaults" prefix.
 *
 * These defaults are exposed to the frontend via DefaultsService @BrowserCallable.
 */
@ConfigurationProperties(prefix = "bmdexpress.defaults")
public class DefaultsConfig {

    private PrimaryFilter primaryFilter = new PrimaryFilter();
    private Visibility visibility = new Visibility();
    private DisplayMode displayMode = new DisplayMode();

    // Nested configuration classes

    public static class PrimaryFilter {
        private int percentageMin = 5;
        private int genesPassedFiltersMin = 3;
        private int allGenesMin = 40;
        private int allGenesMax = 500;

        public int getPercentageMin() {
            return percentageMin;
        }

        public void setPercentageMin(int percentageMin) {
            this.percentageMin = percentageMin;
        }

        public int getGenesPassedFiltersMin() {
            return genesPassedFiltersMin;
        }

        public void setGenesPassedFiltersMin(int genesPassedFiltersMin) {
            this.genesPassedFiltersMin = genesPassedFiltersMin;
        }

        public int getAllGenesMin() {
            return allGenesMin;
        }

        public void setAllGenesMin(int allGenesMin) {
            this.allGenesMin = allGenesMin;
        }

        public int getAllGenesMax() {
            return allGenesMax;
        }

        public void setAllGenesMax(int allGenesMax) {
            this.allGenesMax = allGenesMax;
        }
    }

    public static class Visibility {
        private String defaultState = "normal";  // normal | highlighted | dimmed | hidden
        private String defaultSize = "medium";   // small | medium | large

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
    }

    public static class DisplayMode {
        private String nonSelected = "dimmed";  // How to display non-selected items: normal | dimmed | hidden

        public String getNonSelected() {
            return nonSelected;
        }

        public void setNonSelected(String nonSelected) {
            this.nonSelected = nonSelected;
        }
    }

    // Getters and Setters for top-level properties

    public PrimaryFilter getPrimaryFilter() {
        return primaryFilter;
    }

    public void setPrimaryFilter(PrimaryFilter primaryFilter) {
        this.primaryFilter = primaryFilter;
    }

    public Visibility getVisibility() {
        return visibility;
    }

    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
    }

    public DisplayMode getDisplayMode() {
        return displayMode;
    }

    public void setDisplayMode(DisplayMode displayMode) {
        this.displayMode = displayMode;
    }
}
