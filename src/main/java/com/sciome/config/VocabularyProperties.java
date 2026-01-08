package com.sciome.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Configuration properties for vocabulary values.
 * Values are loaded from application.yml under the "vocabulary" prefix.
 */
@ConfigurationProperties(prefix = "vocabulary")
public class VocabularyProperties {

    private List<String> providers = new ArrayList<>();
    private List<String> platforms = new ArrayList<>();
    private List<String> subjectTypes = new ArrayList<>();
    private List<String> articleRoutes = new ArrayList<>();
    private List<String> articleVehicles = new ArrayList<>();
    private List<String> administrationMeans = new ArrayList<>();
    private List<String> inVitroDurations = new ArrayList<>();
    private List<String> inVivoDurations = new ArrayList<>();
    private List<String> articleTypes = new ArrayList<>();
    private List<String> species = new ArrayList<>();
    private List<String> sexes = new ArrayList<>();
    private List<String> organs = new ArrayList<>();
    private Map<String, List<String>> strains = new HashMap<>();

    // Getters and Setters

    public List<String> getProviders() {
        return providers;
    }

    public void setProviders(List<String> providers) {
        this.providers = providers;
    }

    public List<String> getPlatforms() {
        return platforms;
    }

    public void setPlatforms(List<String> platforms) {
        this.platforms = platforms;
    }

    public List<String> getSubjectTypes() {
        return subjectTypes;
    }

    public void setSubjectTypes(List<String> subjectTypes) {
        this.subjectTypes = subjectTypes;
    }

    public List<String> getArticleRoutes() {
        return articleRoutes;
    }

    public void setArticleRoutes(List<String> articleRoutes) {
        this.articleRoutes = articleRoutes;
    }

    public List<String> getArticleVehicles() {
        return articleVehicles;
    }

    public void setArticleVehicles(List<String> articleVehicles) {
        this.articleVehicles = articleVehicles;
    }

    public List<String> getAdministrationMeans() {
        return administrationMeans;
    }

    public void setAdministrationMeans(List<String> administrationMeans) {
        this.administrationMeans = administrationMeans;
    }

    public List<String> getInVitroDurations() {
        return inVitroDurations;
    }

    public void setInVitroDurations(List<String> inVitroDurations) {
        this.inVitroDurations = inVitroDurations;
    }

    public List<String> getInVivoDurations() {
        return inVivoDurations;
    }

    public void setInVivoDurations(List<String> inVivoDurations) {
        this.inVivoDurations = inVivoDurations;
    }

    public List<String> getArticleTypes() {
        return articleTypes;
    }

    public void setArticleTypes(List<String> articleTypes) {
        this.articleTypes = articleTypes;
    }

    public List<String> getSpecies() {
        return species;
    }

    public void setSpecies(List<String> species) {
        this.species = species;
    }

    public List<String> getSexes() {
        return sexes;
    }

    public void setSexes(List<String> sexes) {
        this.sexes = sexes;
    }

    public List<String> getOrgans() {
        return organs;
    }

    public void setOrgans(List<String> organs) {
        this.organs = organs;
    }

    public Map<String, List<String>> getStrains() {
        return strains;
    }

    public void setStrains(Map<String, List<String>> strains) {
        this.strains = strains;
    }

    /**
     * Get combined study durations (both in vitro and in vivo)
     */
    public List<String> getAllDurations() {
        List<String> all = new ArrayList<>();
        all.addAll(inVitroDurations);
        all.addAll(inVivoDurations);
        return all;
    }

    /**
     * Get strains for a specific species
     */
    public List<String> getStrainsForSpecies(String speciesName) {
        return strains.getOrDefault(speciesName, List.of());
    }
}
