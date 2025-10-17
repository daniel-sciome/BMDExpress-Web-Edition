package com.sciome.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for exposing application configuration to the frontend
 */
@Service
@BrowserCallable
@AnonymousAllowed
public class ConfigService {

    @Value("${bmdexpress.openingView:upload}")
    private String openingView;

    /**
     * Get the configured opening view type
     *
     * @return "upload" or "library"
     */
    public String getOpeningView() {
        return openingView;
    }
}
