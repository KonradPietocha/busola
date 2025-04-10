const NAME = `test-resource-${Math.floor(Math.random() * 9999) + 1000}`;
const IMAGE = 'nginx:latest';

const busolaConfig = JSON.stringify({
  config: {
    features: {
      PROTECTED_RESOURCES: {
        isEnabled: true,
        config: {
          resources: [
            {
              match: { '$.metadata.labels.protected': 'true' },
            },
            {
              match: {
                '$.metadata.ownerReferences[0].kind':
                  '^[a-zA-Z]([a-zA-Z0-9_-]*)$',
              },
              regex: true,
            },
          ],
        },
      },
    },
  },
});

const configMap = JSON.stringify({
  kind: 'ConfigMap',
  apiVersion: 'v1',
  data: { config: busolaConfig },
});

context('Test Protected Resources', () => {
  Cypress.skipAfterFail();

  before(() => {
    cy.intercept(
      {
        method: 'GET',
        url: /kube-public\/configmaps\/busola-config$/,
      },
      configMap,
    );
    cy.loginAndSelectCluster();
    cy.goToNamespaceDetails();
  });

  it('Create a protected resource', () => {
    cy.navigateTo('Configuration', 'Config Maps');

    cy.openCreate();

    cy.get('[accessible-name="ConfigMap name"]:visible')
      .find('input')
      .type(NAME, { force: true });

    cy.get('.create-form')
      .contains('Labels')
      .click();

    cy.get('.multi-input')
      .find('ui5-input[placeholder="Enter key"][value=""]:visible')
      .find('input')
      .click()
      .type('protected');

    cy.get('.multi-input')
      .find('ui5-input[placeholder="Enter value"][value=""]:visible')
      .eq(0)
      .find('input')
      .click()
      .type('true');

    cy.saveChanges('Create');
  });

  it('Protect a resource', () => {
    cy.getLeftNav()
      .contains('Config Maps')
      .click();

    cy.clickGenericListLink(NAME);

    cy.get('ui5-button[disabled]')
      .should('contain.text', 'Delete')
      .should('be.visible');
  });

  it('Create a protected Pod controlled by Deployment', () => {
    cy.navigateTo('Workloads', 'Deployments');

    cy.openCreate();

    cy.get('[accessible-name="Deployment name"]:visible')
      .find('input')
      .click()
      .clear()
      .type(NAME);

    cy.get('[placeholder^="Enter the Docker image"]:visible')
      .find('input')
      .click()
      .type(IMAGE);

    cy.saveChanges('Create');
  });

  it('Check if Pod is protected', () => {
    cy.url().should('match', new RegExp(`\/deployments\/${NAME}`));

    cy.getMidColumn()
      .contains('ui5-table-row', NAME)
      .find('[accessible-name="Delete"][disabled]')
      .should('exist');
  });

  it('Change protection setting', () => {
    cy.get('[title="Profile"]').click();

    cy.get('ui5-menu-item:visible')
      .contains('Preferences')
      .click({ force: true });

    cy.contains('Cluster interaction').click();

    cy.get(
      'ui5-switch[accessible-name="Allow for modification of protected resources"',
    )
      .find('div[role="switch"')
      .click({ force: true });

    cy.contains('Close').click();
  });

  it("Don't protect a resource", () => {
    cy.getLeftNav()
      .contains('Config Maps')
      .click();

    cy.contains('ui5-table-row', NAME)
      .find('ui5-button[data-testid="delete"]')
      .click();

    cy.contains(`delete Config Map ${NAME}`);
    cy.get(`[header-text="Delete Config Map"]`)
      .find('[data-testid="delete-cancel"]')
      .click();
  });
});
