package com.sciome.dto;

/**
 * DTO for experimental metadata describing biological context
 */
public class ExperimentDescriptionDto {
    private String testArticle;  // Chemical/compound being tested
    private String species;      // Animal species
    private String strain;       // Animal strain
    private String sex;          // Sex
    private String organ;        // Target organ/tissue

    public ExperimentDescriptionDto() {
    }

    public ExperimentDescriptionDto(String testArticle, String species, String strain, String sex, String organ) {
        this.testArticle = testArticle;
        this.species = species;
        this.strain = strain;
        this.sex = sex;
        this.organ = organ;
    }

    // Getters and setters

    public String getTestArticle() {
        return testArticle;
    }

    public void setTestArticle(String testArticle) {
        this.testArticle = testArticle;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getStrain() {
        return strain;
    }

    public void setStrain(String strain) {
        this.strain = strain;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getOrgan() {
        return organ;
    }

    public void setOrgan(String organ) {
        this.organ = organ;
    }

    public boolean hasDescription() {
        return (testArticle != null && !testArticle.isEmpty()) ||
               (species != null && !species.isEmpty()) ||
               (strain != null && !strain.isEmpty()) ||
               (sex != null && !sex.isEmpty()) ||
               (organ != null && !organ.isEmpty());
    }

    /**
     * Convert from desktop app ExperimentDescription to DTO
     */
    public static ExperimentDescriptionDto fromDesktopObject(com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription desc) {
        if (desc == null) {
            return null;
        }
        return new ExperimentDescriptionDto(
            desc.getTestArticle(),
            desc.getSpecies(),
            desc.getStrain(),
            desc.getSex(),
            desc.getOrgan()
        );
    }
}
