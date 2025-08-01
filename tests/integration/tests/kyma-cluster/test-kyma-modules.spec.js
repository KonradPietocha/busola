/// <reference types="cypress" />

context('Test Kyma Modules views', () => {
  before(() => {
    cy.loginAndSelectCluster();
  });

  it('Test Modules Overview card', () => {
    cy.wait(2000);

    cy.get('ui5-card')
      .contains('Modules Overview')
      .should('be.visible');

    cy.contains('ui5-card', 'Installed Modules')
      .contains('0')
      .should('be.visible');

    cy.get('ui5-card')
      .contains('Modify Modules')
      .click();

    cy.url().should('match', /.*\/kymamodules/);
  });

  it('Check if edit is empty', () => {
    cy.wait(500);
    cy.inspectTab('Edit');

    cy.contains('No modules installed').should('be.visible');

    cy.inspectTab('View');
  });

  it('Test adding Modules', () => {
    cy.get('ui5-panel[data-testid="kyma-modules-list"]')
      .find('ui5-table')
      .find('ui5-illustrated-message')
      .find('ui5-title', 'No modules')
      .should('be.visible');

    // Add first module
    cy.get('ui5-panel[data-testid="kyma-modules-list"]')
      .contains('ui5-button', 'Add')
      .click();

    cy.wait(1000);

    cy.get('ui5-card')
      .contains('api-gateway')
      .should('be.visible');

    cy.get('ui5-title')
      .contains('api-gateway')
      .click();

    cy.get('[data-testid="create-form-footer-bar"]')
      .contains('ui5-button:visible', 'Add')
      .click();

    // Check if already installed module is not visible
    cy.get('ui5-panel[data-testid="kyma-modules-list"]')
      .contains('ui5-button', 'Add')
      .click();

    cy.wait(1000);

    cy.get('ui5-card')
      .contains('api-gateway')
      .should('not.exist');

    cy.get('ui5-card')
      .contains('eventing')
      .should('be.visible');

    // Add second module
    cy.get('ui5-title')
      .contains('eventing')
      .click();

    cy.get('[data-testid="create-form-footer-bar"]')
      .contains('ui5-button:visible', 'Add')
      .click();

    cy.wait(7000);

    cy.get('ui5-table-row')
      .contains('eventing')
      .should('be.visible');

    cy.get('ui5-table-row')
      .contains('api-gateway')
      .should('be.visible');
  });

  it('Test number of Modules in Modules Overview card', () => {
    cy.getLeftNav()
      .contains('Cluster Details')
      .click();

    // Uncomment after adding local KLM
    // cy.contains('ui5-card', 'Installed Modules')
    //   .contains('2')
    //   .should('be.visible');

    // cy.contains('ui5-card', 'Ready')
    //   .contains('2')
    //   .should('be.visible');

    cy.get('ui5-card')
      .contains('Modify Modules')
      .click();
  });

  it('Test Modules list and details', () => {
    cy.wait(1000);

    cy.get('.modules-list')
      .find('ui5-input[id="search-input"]:visible')
      .find('input')
      .wait(1000)
      .type('api-gateway');

    cy.get('ui5-table-row')
      .contains('api-gateway')
      .should('be.visible');

    // Uncomment after adding local KLM
    // cy.get('ui5-table-row')
    //   .contains('api-gateway')
    //   .click();

    // cy.getMidColumn().contains('default');
    // cy.getMidColumn().contains(`APIGateway`);
    // cy.getMidColumn().contains(`0 days`);

    // cy.closeMidColumn();

    cy.get('.modules-list')
      .find('ui5-input[id="search-input"]:visible')
      .find('input')
      .clearInput();

    cy.inspectTab('Edit');

    cy.get('ui5-button:visible')
      .contains('Save')
      .click();

    cy.get('ui5-toast')
      .contains('Kyma updated')
      .should('be.visible');

    cy.inspectTab('View');
  });

  it('Test changing Module Channel', () => {
    cy.inspectTab('Edit');

    cy.wait(1000);

    cy.contains('ui5-label', 'eventing').should('be.visible');

    cy.contains('ui5-label', 'eventing')
      .parent()
      .find('ui5-select')
      .click();

    cy.wait(500);

    cy.get('ui5-option:visible')
      .contains(/^Fast .*/)
      .click();

    cy.checkUnsavedDialog();

    cy.saveChanges('Edit');

    cy.contains('Change Release Channel').should('be.visible');

    cy.get('ui5-button')
      .contains('Change')
      .click();

    cy.contains('Kyma updated').should('be.visible');

    cy.inspectTab('View');

    cy.wait(10000);

    cy.get('ui5-table-row')
      .contains('eventing')
      .should('be.visible');

    cy.get('ui5-table-row')
      .contains('fast')
      .should('be.visible');

    cy.get('ui5-table-row')
      .contains('Overridden')
      .should('be.visible');
  });

  it('Test changing Module Channel to Predefined', () => {
    cy.inspectTab('Edit');

    cy.wait(1000);

    cy.contains('ui5-label', 'eventing').should('be.visible');

    cy.contains('ui5-label', 'eventing')
      .parent()
      .find('ui5-select')
      .click();

    cy.get('ui5-option:visible')
      .contains(/Predefined .*/)
      .filter(':visible')
      .find('li')
      .click({ force: true });

    cy.saveChanges('Edit');

    cy.contains('Change Release Channel').should('be.visible');

    cy.get('ui5-button')
      .contains('Change')
      .click();

    cy.contains('Kyma updated').should('be.visible');

    cy.inspectTab('View');

    cy.wait(10000);

    cy.get('ui5-table-row')
      .contains('eventing')
      .should('be.visible');

    cy.get('ui5-table-row')
      .contains('Overridden')
      .should('not.be.exist');
  });

  it('Test deleting Modules from List and Details', { retries: 3 }, () => {
    cy.deleteFromGenericList('Module', 'eventing', {
      searchInPlainTableText: true,
      parentSelector: '.modules-list',
    });

    // Uncomment after adding local KLM
    // cy.get('ui5-input[id="search-input"]:visible')
    //   .find('input')
    //   .wait(1000)
    //   .type('api-gateway');
    //
    // cy.get('ui5-table-row')
    //   .contains('api-gateway')
    //   .click();
    //
    // cy.deleteInDetails('Module', 'api-gateway', true);
    //
    // cy.wait(20000);
    //
    // cy.get('ui5-input[id="search-input"]:visible')
    //   .find('input')
    //   .clear();
    //
    // cy.get('ui5-table')
    //   .contains('ui5-illustrated-message', 'No modules')
    //   .should('be.visible');
  });
});
