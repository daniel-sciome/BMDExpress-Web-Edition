// -- Reusable helpers for BMDExpress E2E tests --

/** Wait for the Hilla/Spring Boot app to finish its initial load. */
Cypress.Commands.add('waitForAppLoad', () => {
  // The Vaadin app-layout is the root shell; once it's in the DOM the app is up.
  cy.get('vaadin-app-layout', { timeout: 30000 }).should('exist');
  // Wait for the sidebar "Projects" collapse to be rendered (data fetched).
  cy.contains('Projects', { timeout: 15000 }).should('be.visible');
});

/** Select a project by its name in the sidebar radio list. */
Cypress.Commands.add('selectProject', (projectName: string) => {
  // Expand the Projects collapse if needed, then click the radio next to the project.
  cy.contains('.ant-collapse-header', 'Projects').click();
  cy.contains('.ant-radio-wrapper', projectName).find('input').click({ force: true });
});

// -- Type declarations so TS knows about the custom commands --
declare global {
  namespace Cypress {
    interface Chainable {
      waitForAppLoad(): Chainable<void>;
      selectProject(projectName: string): Chainable<void>;
    }
  }
}
