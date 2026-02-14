describe('Report Builder workflow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForAppLoad();
  });

  it('navigates to the Report Builder via sidebar link', () => {
    cy.contains('button', 'Report Builder').click();
    cy.url().should('include', '/report-builder');
    // The report builder placeholder should appear
    cy.contains('Select or create a report to begin editing').should('be.visible');
  });

  it('creates a new report from the EPA BMD Guidance template', () => {
    cy.visit('/report-builder');

    // Click "New" button in the report list panel
    cy.contains('button', 'New').click();

    // The modal should appear
    cy.contains('Create New Report').should('be.visible');

    // Fill in the report title
    cy.get('.ant-modal')
      .find('input')
      .first()
      .type('Cypress Test Report');

    // Template defaults to "EPA BMD Guidance" – verify it's selected
    cy.get('.ant-modal').contains('EPA BMD Guidance').should('exist');

    // Click Create
    cy.get('.ant-modal').contains('button', 'Create').click();

    // Modal should close and the report should appear in the list
    cy.contains('.ant-modal', 'Create New Report').should('not.exist');
    cy.contains('Cypress Test Report').should('be.visible');
  });

  it('shows sections tree after selecting a report', () => {
    cy.visit('/report-builder');

    // If a report already exists, click on it; otherwise create one first
    cy.get('body').then(($body) => {
      if ($body.find('.ant-list-item').length === 0) {
        // Create a report so we have something to click
        cy.contains('button', 'New').click();
        cy.get('.ant-modal').find('input').first().type('Section Tree Test');
        cy.get('.ant-modal').contains('button', 'Create').click();
      }
    });

    // Click the first report in the list
    cy.get('.ant-list-item').first().click();

    // The section tree heading should appear
    cy.contains('Sections').should('be.visible');
    // At least one tree node should exist (templates come with sections)
    cy.get('.ant-tree-treenode').should('have.length.greaterThan', 0);
  });

  it('opens section editor when clicking a tree node', () => {
    cy.visit('/report-builder');

    cy.get('body').then(($body) => {
      if ($body.find('.ant-list-item').length === 0) {
        cy.contains('button', 'New').click();
        cy.get('.ant-modal').find('input').first().type('Editor Test');
        cy.get('.ant-modal').contains('button', 'Create').click();
      }
    });

    cy.get('.ant-list-item').first().click();

    // Click the first section in the tree
    cy.get('.ant-tree-treenode').first().click();

    // The rich-text editor area (Tiptap) should now be present
    cy.get('.tiptap', { timeout: 10000 }).should('exist');
  });

  it('types content into the section editor', () => {
    cy.visit('/report-builder');

    cy.get('body').then(($body) => {
      if ($body.find('.ant-list-item').length === 0) {
        cy.contains('button', 'New').click();
        cy.get('.ant-modal').find('input').first().type('Typing Test');
        cy.get('.ant-modal').contains('button', 'Create').click();
      }
    });

    cy.get('.ant-list-item').first().click();
    cy.get('.ant-tree-treenode').first().click();

    // Type into the Tiptap editor
    cy.get('.tiptap').click().type('Hello from Cypress!');
    cy.get('.tiptap').should('contain.text', 'Hello from Cypress!');
  });

  it('opens the export modal', () => {
    cy.visit('/report-builder');

    cy.get('body').then(($body) => {
      if ($body.find('.ant-list-item').length === 0) {
        cy.contains('button', 'New').click();
        cy.get('.ant-modal').find('input').first().type('Export Test');
        cy.get('.ant-modal').contains('button', 'Create').click();
      }
    });

    cy.get('.ant-list-item').first().click();
    cy.get('.ant-tree-treenode').first().click();

    // Click the "Export" action button
    cy.contains('button', 'Export').click();

    // The export modal should appear with format choices
    cy.contains('Export Report').should('be.visible');
    cy.contains('PDF').should('be.visible');
    cy.contains('Word (.docx)').should('be.visible');

    // Close the modal
    cy.contains('button', 'Cancel').click();
    cy.contains('.ant-modal', 'Export Report').should('not.exist');
  });
});
