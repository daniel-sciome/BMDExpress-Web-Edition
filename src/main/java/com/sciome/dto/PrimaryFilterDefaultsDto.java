package com.sciome.dto;

/**
 * DTO for primary filter default values.
 * Hilla generates TypeScript types from this class.
 *
 * These defaults are loaded from application.yml and exposed
 * to the frontend via DefaultsService @BrowserCallable.
 */
public class PrimaryFilterDefaultsDto {

    private int percentageMin;
    private int genesPassedFiltersMin;
    private int allGenesMin;
    private int allGenesMax;

    public PrimaryFilterDefaultsDto() {
    }

    public PrimaryFilterDefaultsDto(int percentageMin, int genesPassedFiltersMin, int allGenesMin, int allGenesMax) {
        this.percentageMin = percentageMin;
        this.genesPassedFiltersMin = genesPassedFiltersMin;
        this.allGenesMin = allGenesMin;
        this.allGenesMax = allGenesMax;
    }

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
