package com.sciome.service;

import com.sciome.config.DefaultsConfig;
import com.sciome.dto.PrimaryFilterDefaultsDto;
import com.sciome.dto.VisibilityDefaultsDto;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.stereotype.Service;

/**
 * Service for accessing default configuration values.
 * Defaults are loaded from application.yml and exposed to the frontend.
 *
 * Hilla generates TypeScript client code for these methods.
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class DefaultsService {

    private final DefaultsConfig config;

    public DefaultsService(DefaultsConfig config) {
        this.config = config;
    }

    /**
     * Get default values for the primary filter.
     * Used to initialize the PrimaryFilter component with sensible defaults.
     */
    public PrimaryFilterDefaultsDto getPrimaryFilterDefaults() {
        DefaultsConfig.PrimaryFilter pf = config.getPrimaryFilter();
        return new PrimaryFilterDefaultsDto(
            pf.getPercentageMin(),
            pf.getGenesPassedFiltersMin(),
            pf.getAllGenesMin(),
            pf.getAllGenesMax()
        );
    }

    /**
     * Get default values for visibility settings.
     * Used to initialize the visibility state with sensible defaults.
     */
    public VisibilityDefaultsDto getVisibilityDefaults() {
        DefaultsConfig.Visibility vis = config.getVisibility();
        DefaultsConfig.DisplayMode dm = config.getDisplayMode();
        return new VisibilityDefaultsDto(
            vis.getDefaultState(),
            vis.getDefaultSize(),
            dm.getNonSelected()
        );
    }
}
