Cypress.Commands.add('inspectList', (resourceName, hiddenButtons = false) => {
  cy.closeMidColumn(false, hiddenButtons);

  cy.get('ui5-input[id="search-input"]:visible')
    .find('input')
    .wait(1000)
    .type(`${resourceName}{enter}`);

  cy.contains('span', resourceName).should('be.visible');
});
