import { useMatch } from 'react-router';
import pluralize from 'pluralize';

import { UrlGenerators, UrlOverrides } from 'state/types';
import { K8sResource } from 'types';

export const useUrl: () => UrlGenerators = () => {
  const cluster =
    useMatch({ path: '/cluster/:cluster', end: false })?.params?.cluster ?? '';
  const namespace =
    useMatch({ path: '/cluster/:cluster/namespaces/:namespace', end: false })
      ?.params?.namespace ?? '';

  const clusterUrl = (path: string, overrides: UrlOverrides = {}) => {
    return `/cluster/${encodeURIComponent(
      overrides?.cluster ?? cluster,
    )}/${path ?? ''}`;
  };

  const namespaceUrl = (path: string, overrides: UrlOverrides = {}) => {
    return `/cluster/${encodeURIComponent(
      overrides?.cluster ?? cluster,
    )}/namespaces/${overrides?.namespace ?? namespace}/${path ?? ''}`;
  };

  const scopedUrl = (path: string, overrides: UrlOverrides = {}) => {
    if ((overrides?.resourceType || '').toLowerCase() === 'namespaces') {
      return clusterUrl(path, overrides);
    } else if (overrides?.namespace ?? namespace) {
      return namespaceUrl(path, overrides);
    } else {
      return clusterUrl(path, overrides);
    }
  };

  const resourcePath = (resource: K8sResource, overrides: UrlOverrides = {}) =>
    (overrides.resourceType ?? pluralize(resource.kind || '')).toLowerCase();

  const resourceListUrl = (
    resource: K8sResource,
    overrides: UrlOverrides = {},
  ) => {
    return scopedUrl(resourcePath(resource, overrides), {
      namespace: resource?.metadata?.namespace,
      ...overrides,
    });
  };

  const resourceUrl = (resource: K8sResource, overrides: UrlOverrides = {}) => {
    const encodedName = encodeURIComponent(resource?.metadata?.name);
    const path = `${resourcePath(resource, overrides)}/${encodedName}`;
    return scopedUrl(path, {
      namespace: resource?.metadata?.namespace,
      ...overrides,
    });
  };

  return {
    cluster,
    namespace,
    clusterUrl,
    namespaceUrl,
    scopedUrl,
    resourceListUrl,
    resourceUrl,
  };
};
