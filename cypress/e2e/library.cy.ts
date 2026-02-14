describe('Library – project navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForAppLoad();
  });

  it('shows the sidebar with a project list', () => {
    // The "Projects" collapse should be visible with at least one project radio
    cy.contains('Projects').should('be.visible');
    cy.get('.ant-radio-wrapper').should('have.length.greaterThan', 0);
  });

  it('selects a project and shows dataset details', () => {
    // Click the first project radio
    cy.get('.ant-radio-wrapper').first().find('input').click({ force: true });

    // After selection the main area should no longer show the welcome text
    cy.contains('Welcome to BMD Express Web').should('not.exist');

    // The Visibility toggle should now appear (it's conditional on selectedProject)
    cy.contains('Visibility').should('be.visible');
  });

  it('expands a project in the sidebar to show metadata', () => {
    // Each project is a nested Collapse item.  Click the first project's expand arrow.
    cy.get('.ant-collapse .ant-collapse .ant-collapse-header').first().click();

    // The inner panel should expand (some metadata or placeholder text)
    cy.get('.ant-collapse .ant-collapse .ant-collapse-content-active').should('exist');
  });

  it('switches visibility mode between All / Dim / Hide', () => {
    // Select a project first so the Visibility controls appear
    cy.get('.ant-radio-wrapper').first().find('input').click({ force: true });
    cy.contains('Visibility').should('be.visible');

    // Default is "All" (highlight).  Click "Dim".
    cy.contains('.ant-radio-button-wrapper', 'Dim').click();
    cy.contains('.ant-radio-button-wrapper-checked', 'Dim').should('exist');

    // Switch to "Hide"
    cy.contains('.ant-radio-button-wrapper', 'Hide').click();
    cy.contains('.ant-radio-button-wrapper-checked', 'Hide').should('exist');

    // Back to "All"
    cy.contains('.ant-radio-button-wrapper', 'All').click();
    cy.contains('.ant-radio-button-wrapper-checked', 'All').should('exist');
  });
});
