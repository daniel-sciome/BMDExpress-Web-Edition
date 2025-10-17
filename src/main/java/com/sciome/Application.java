package com.sciome;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@Theme("default")
@PWA(name = "BMDExpress Web", shortName = "BMDExpress")
public class Application implements AppShellConfigurator {

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
