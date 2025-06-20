/// <reference types="cypress" />

function mockPermissionsCall(permissions) {
  cy.intercept(
    {
      method: 'POST',
      url: '/backend/apis/authorization.k8s.io/v1/selfsubjectrulesreviews',
    },
    {
      kind: 'SelfSubjectRulesReview',
      apiVersion: 'authorization.k8s.io/v1',
      status: {
        resourceRules: permissions,
      },
    },
  );
}

function mockPermissionsCall2(namespacePermissions, clusterPermissions) {
  cy.intercept(
    {
      method: 'POST',
      url: '/backend/apis/authorization.k8s.io/v1/selfsubjectrulesreviews',
    },
    req => {
      if (req.body.spec.namespace !== '*') {
        req.reply({
          kind: 'SelfSubjectRulesReview',
          apiVersion: 'authorization.k8s.io/v1',
          status: {
            resourceRules: namespacePermissions,
          },
        });
      } else {
        req.reply({
          kind: 'SelfSubjectRulesReview',
          apiVersion: 'authorization.k8s.io/v1',
          status: {
            resourceRules: clusterPermissions,
          },
        });
      }
    },
  );
}

context('Test reduced permissions 2', () => {
  Cypress.skipAfterFail();

  it('Test displaying navigation nodes', () => {
    const mockClusterPermissions = () =>
      mockPermissionsCall([
        {
          verbs: ['*'],
          apiGroups: [''],
          resources: ['namespaces', 'pods'],
        },
      ]);

    const mockNamespacePermissions = () =>
      mockPermissionsCall([
        {
          verbs: ['*'],
          apiGroups: [''],
          resources: ['namespaces', 'pods', 'persistentvolumeclaims'],
        },
      ]);

    // check out cluster view - expect only Namespaces here
    mockClusterPermissions();
    cy.loginAndSelectCluster();

    cy.getLeftNav()
      .contains('Namespaces')
      .should('exist');

    cy.getLeftNav()
      .contains('Events')
      .should('not.exist');

    // check out "normal" namespace view - expect only Pods here
    cy.goToNamespaceDetails();

    cy.getLeftNav()
      .contains('Discovery and Network')
      .should('not.exist');

    cy.getLeftNav()
      .contains('Workloads')
      .should('exist')
      .click();

    cy.getLeftNav()
      .contains('Pods')
      .should('exist');

    cy.getLeftNav()
      .contains('Deployments')
      .should('not.exist');

    // check out "special" namespace view - expect Pods and Services here
    mockNamespacePermissions();

    cy.getLeftNav()
      .contains('Back To Cluster Details')
      .click();

    cy.getLeftNav()
      .find('ui5-side-navigation-item')
      .contains('Namespaces')
      .click();

    cy.wait(500)
      .get('ui5-input[id="search-input"]:visible')
      .find('input')
      .type('kube-public');

    cy.clickListLink('kube-public');

    cy.getLeftNav()
      .contains('Pods')
      .should('exist');

    cy.getLeftNav()
      .contains('Storage')
      .should('exist')
      .click();

    cy.getLeftNav()
      .contains('Persistent Volume Claims')
      .should('exist');

    cy.getLeftNav()
      .contains('Secrets')
      .should('not.exist');
  });

  it('Test extension CMs call - user has access to clusterwide CMs', () => {
    //spy na fetching CMs in the cluster-context, you have access
    cy.intercept({
      method: 'GET',
      url:
        '/backend/api/v1/configmaps?labelSelector=busola.io/extension=resource',
    }).as('clusterwide CM call');

    cy.loginAndSelectCluster();

    cy.wait('@clusterwide CM call');
  });

  it('Test extension CMs call - user has no access to clusterwide CMs, fallback to namespace wide CMs', () => {
    const namespaceName = Cypress.env('NAMESPACE_NAME');

    cy.loginAndSelectCluster();
    cy.goToNamespaceDetails();

    const namespacePermissions = [
      {
        verbs: ['*'],
        apiGroups: [''],
        resources: ['pods', 'configmaps'],
        namespace: namespaceName,
      },
    ];

    const clusterPermission = [
      {
        verbs: [''],
        apiGroups: [''],
        resources: [''],
      },
    ];

    mockPermissionsCall2(namespacePermissions, clusterPermission);

    cy.intercept({
      method: 'GET',
      url: `/backend/api/v1/namespaces/${namespaceName}/configmaps?labelSelector=busola.io/extension=resource`,
    }).as('logged namespace CM call');

    cy.reload();
    cy.wait('@logged namespace CM call');
  });
});
