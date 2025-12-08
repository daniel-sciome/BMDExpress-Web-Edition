package com.sciome.dto;

/**
 * DTO for experimental metadata describing biological context.
 * Contains all metadata fields from experiment file headers.
 */
public class ExperimentDescriptionDto {
    // Test article identification
    private String testArticle;  // Chemical/compound name
    private String casrn;        // CAS Registry Number
    private String dsstox;       // DSSTox Substance ID

    // Subject information (In Vivo)
    private String subjectType;  // "In Vivo" or "In Vitro"
    private String species;      // Animal species
    private String strain;       // Animal strain
    private String sex;          // Sex
    private String organ;        // Target organ/tissue

    // Subject information (In Vitro)
    private String cellLine;     // Cell line for In Vitro experiments

    // Study details
    private String studyDuration;       // Duration (e.g., "28d", "24h")
    private String articleType;         // "Chemical", "Mixture", "Electromagnetic Radiation"
    private String articleRoute;        // "Oral", "Inhaled", "Transdermal"
    private String articleVehicle;      // "Corn Oil", "Feed", "Water", "Aerosol", "Gas"
    private String administrationMeans; // "Gavage", "Drinking Water", "Dietary"

    // Platform information
    private String platform;     // Array platform name
    private String provider;     // Platform provider

    public ExperimentDescriptionDto() {
    }

    // Getters and setters

    public String getTestArticle() {
        return testArticle;
    }

    public void setTestArticle(String testArticle) {
        this.testArticle = testArticle;
    }

    public String getCasrn() {
        return casrn;
    }

    public void setCasrn(String casrn) {
        this.casrn = casrn;
    }

    public String getDsstox() {
        return dsstox;
    }

    public void setDsstox(String dsstox) {
        this.dsstox = dsstox;
    }

    public String getSubjectType() {
        return subjectType;
    }

    public void setSubjectType(String subjectType) {
        this.subjectType = subjectType;
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

    public String getCellLine() {
        return cellLine;
    }

    public void setCellLine(String cellLine) {
        this.cellLine = cellLine;
    }

    public String getStudyDuration() {
        return studyDuration;
    }

    public void setStudyDuration(String studyDuration) {
        this.studyDuration = studyDuration;
    }

    public String getArticleType() {
        return articleType;
    }

    public void setArticleType(String articleType) {
        this.articleType = articleType;
    }

    public String getArticleRoute() {
        return articleRoute;
    }

    public void setArticleRoute(String articleRoute) {
        this.articleRoute = articleRoute;
    }

    public String getArticleVehicle() {
        return articleVehicle;
    }

    public void setArticleVehicle(String articleVehicle) {
        this.articleVehicle = articleVehicle;
    }

    public String getAdministrationMeans() {
        return administrationMeans;
    }

    public void setAdministrationMeans(String administrationMeans) {
        this.administrationMeans = administrationMeans;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean hasDescription() {
        return (testArticle != null && !testArticle.isEmpty()) ||
               (species != null && !species.isEmpty()) ||
               (strain != null && !strain.isEmpty()) ||
               (sex != null && !sex.isEmpty()) ||
               (organ != null && !organ.isEmpty()) ||
               (cellLine != null && !cellLine.isEmpty()) ||
               (platform != null && !platform.isEmpty());
    }

    /**
     * Convert from desktop app ExperimentDescription to DTO
     */
    public static ExperimentDescriptionDto fromDesktopObject(com.sciome.bmdexpress2.mvp.model.info.ExperimentDescription desc) {
        if (desc == null) {
            return null;
        }

        ExperimentDescriptionDto dto = new ExperimentDescriptionDto();

        // Test article identification
        if (desc.getTestArticle() != null) {
            dto.setTestArticle(desc.getTestArticle().getName());
            dto.setCasrn(desc.getTestArticle().getCasrn());
            dto.setDsstox(desc.getTestArticle().getDsstox());
        }

        // Common fields
        dto.setSubjectType(desc.getSubjectType());
        dto.setStudyDuration(desc.getStudyDuration());
        dto.setArticleType(desc.getArticleType());
        dto.setArticleRoute(desc.getArticleRoute());
        dto.setArticleVehicle(desc.getArticleVehicle());
        dto.setAdministrationMeans(desc.getAdministrationMeans());
        dto.setPlatform(desc.getPlatform());
        dto.setProvider(desc.getProvider());

        // In vivo fields (unified class has all fields)
        dto.setSpecies(desc.getSpecies());
        dto.setStrain(desc.getStrain());
        dto.setSex(desc.getSex());
        dto.setOrgan(desc.getOrgan());

        // In vitro fields
        dto.setCellLine(desc.getCellLine());

        return dto;
    }
}
