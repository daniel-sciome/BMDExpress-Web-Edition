package com.sciome;

import com.sciome.config.DefaultsConfig;
import com.sciome.config.LlmConfig;
import com.sciome.config.ReportConfig;
import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({DefaultsConfig.class, ReportConfig.class, LlmConfig.class})
@Theme("default")
@PWA(name = "BMDExpress Web", shortName = "BMDExpress")
public class Application extends SpringBootServletInitializer implements AppShellConfigurator {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        // Replicate essential setup from main() for WAR deployment
        com.sciome.bmdexpress2.shared.BMDExpressProperties.getInstance().setIsConsole(true);
        System.setProperty("vaadin.statistics.enabled", "false");
        System.setProperty("vaadin.usageStatistics.disabled", "true");
        return builder.sources(Application.class);
    }

    public static void main(String[] args) {
        // Configure BMDExpress to run in console/headless mode (no GUI components)
        com.sciome.bmdexpress2.shared.BMDExpressProperties.getInstance().setIsConsole(true);

        // Disable Vaadin telemetry at JVM level
        System.setProperty("vaadin.statistics.enabled", "false");
        System.setProperty("vaadin.usageStatistics.disabled", "true");

        // Allow dev tools for specific hostnames/IPs
        System.setProperty("vaadin.devmode.hostsAllowed", "fedora,lee-nooks,localhost,192.168.100.*,10.120.210.*");

        SpringApplication.run(Application.class, args);
    }

}
