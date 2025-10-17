package com.sciome;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.theme.Theme;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@Theme("default")
public class Application implements AppShellConfigurator {

    public static void main(String[] args) {
        // Configure BMDExpress to run in console/headless mode (no GUI components)
        com.sciome.bmdexpress2.shared.BMDExpressProperties.getInstance().setIsConsole(true);

        SpringApplication.run(Application.class, args);
    }

}
