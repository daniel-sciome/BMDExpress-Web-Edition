package com.sciome.service;

import com.sciome.config.VocabularyProperties;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service for accessing vocabulary values.
 * Vocabularies are loaded from application.yml and can be extended or overridden.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class VocabularyService {

    private final VocabularyProperties properties;

    public VocabularyService(VocabularyProperties properties) {
        this.properties = properties;
    }

    public List<String> getProviders() {
        return properties.getProviders();
    }

    public List<String> getPlatforms() {
        return properties.getPlatforms();
    }

    public List<String> getSubjectTypes() {
        return properties.getSubjectTypes();
    }

    public List<String> getArticleRoutes() {
        return properties.getArticleRoutes();
    }

    public List<String> getArticleVehicles() {
        return properties.getArticleVehicles();
    }

    public List<String> getAdministrationMeans() {
        return properties.getAdministrationMeans();
    }

    public List<String> getInVitroDurations() {
        return properties.getInVitroDurations();
    }

    public List<String> getInVivoDurations() {
        return properties.getInVivoDurations();
    }

    public List<String> getAllDurations() {
        return properties.getAllDurations();
    }

    public List<String> getArticleTypes() {
        return properties.getArticleTypes();
    }

    public List<String> getSpecies() {
        return properties.getSpecies();
    }

    public List<String> getSexes() {
        return properties.getSexes();
    }

    public List<String> getOrgans() {
        return properties.getOrgans();
    }

    public Map<String, List<String>> getAllStrains() {
        return properties.getStrains();
    }

    public List<String> getStrainsForSpecies(String species) {
        return properties.getStrainsForSpecies(species);
    }
}
