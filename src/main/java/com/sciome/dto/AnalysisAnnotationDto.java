package com.sciome.dto;

/**
 * Data Transfer Object for structured analysis name metadata.
 * Parses BMDExpress analysis names to extract chemical, biological, and platform information.
 *
 * Example name: P2_Perfluoro_3_methoxypropanoic_acid_Female_Heart-expression1_curvefitprefilter_foldfilter1.25_BMD_S1500_Plus_Rat_GO_BP_true_rsquared0.6_ratio10_conf0.5
 *
 * Extracts:
 * - chemical: "Perfluoro 3 methoxypropanoic acid"
 * - sex: "Female"
 * - organ: "Heart"
 * - species: "Rat"
 * - platform: "S1500_Plus"
 * - parameterSuffix: "curvefitprefilter_foldfilter1.25_BMD_S1500_Plus_Rat_GO_BP_true_rsquared0.6_ratio10_conf0.5"
 */
public class AnalysisAnnotationDto {

    /**
     * The original full analysis name
     */
    private String fullName;

    /**
     * Chemical or compound name (e.g., "Perfluoro 3 methoxypropanoic acid")
     */
    private String chemical;

    /**
     * Biological sex (e.g., "Male", "Female", "Mixed")
     */
    private String sex;

    /**
     * Organ or tissue type (e.g., "Heart", "Liver", "Kidney")
     */
    private String organ;

    /**
     * Species (e.g., "Rat", "Mouse", "Human")
     */
    private String species;

    /**
     * Platform or array type (e.g., "S1500_Plus", "TempO_Seq")
     */
    private String platform;

    /**
     * Analysis type (e.g., "GO_BP", "Reactome", "KEGG")
     */
    private String analysisType;

    /**
     * The last 12 underscore-delimited parts of the name containing parameters
     */
    private String parameterSuffix;

    /**
     * Prefix before the main metadata (e.g., "P2", "Batch1")
     */
    private String prefix;

    /**
     * Short display name formatted for UI (e.g., "PFAS - Female Heart (Rat)")
     */
    private String displayName;

    /**
     * Medium-length display name (e.g., "PFAS | Female Heart | S1500_Plus | Rat")
     */
    private String displayNameMedium;

    /**
     * Indicates if parsing was successful
     */
    private boolean parseSuccess;

    /**
     * Error message if parsing failed
     */
    private String parseError;

    // Constructors

    public AnalysisAnnotationDto() {
    }

    public AnalysisAnnotationDto(String fullName) {
        this.fullName = fullName;
        this.parseSuccess = false;
    }

    // Getters and Setters

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getChemical() {
        return chemical;
    }

    public void setChemical(String chemical) {
        this.chemical = chemical;
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

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(String analysisType) {
        this.analysisType = analysisType;
    }

    public String getParameterSuffix() {
        return parameterSuffix;
    }

    public void setParameterSuffix(String parameterSuffix) {
        this.parameterSuffix = parameterSuffix;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayNameMedium() {
        return displayNameMedium;
    }

    public void setDisplayNameMedium(String displayNameMedium) {
        this.displayNameMedium = displayNameMedium;
    }

    public boolean isParseSuccess() {
        return parseSuccess;
    }

    public void setParseSuccess(boolean parseSuccess) {
        this.parseSuccess = parseSuccess;
    }

    public String getParseError() {
        return parseError;
    }

    public void setParseError(String parseError) {
        this.parseError = parseError;
    }

    @Override
    public String toString() {
        return "AnalysisAnnotationDto{" +
                "fullName='" + fullName + '\'' +
                ", chemical='" + chemical + '\'' +
                ", sex='" + sex + '\'' +
                ", organ='" + organ + '\'' +
                ", species='" + species + '\'' +
                ", platform='" + platform + '\'' +
                ", analysisType='" + analysisType + '\'' +
                ", displayName='" + displayName + '\'' +
                ", parseSuccess=" + parseSuccess +
                '}';
    }
}
