import { RecoilValueReadOnly, selector } from 'recoil';
import { partial } from 'lodash';

import { assignNodesToCategories } from './assignToCategories';
import { Category } from './categories';
import { hasCurrentScope } from './filters/hasCurrentScope';
import { configFeaturesNames, NavNode, Scope } from '../types';

import { clusterAndNsNodesSelector } from './clusterAndNsNodesSelector';
import { externalNodesSelector } from './externalNodesSelector';
import { activeNamespaceIdState } from '../activeNamespaceIdAtom';
import { configurationAtom } from '../configuration/configurationAtom';
import { extensionsState } from './extensionsAtom';
import { mapExtResourceToNavNode } from '../resourceList/mapExtResourceToNavNode';
import { extensibilityNodesExtSelector } from './extensibilityNodesExtSelector';

export const sidebarNavigationNodesSelector: RecoilValueReadOnly<Category[]> = selector<
  Category[]
>({
  key: 'scopedNavigationSelector',
  get: ({ get }) => {
    const navNodes: NavNode[] = get(clusterAndNsNodesSelector);
    const activeNamespaceId = get(activeNamespaceIdState);
    const externalNodes = get(externalNodesSelector);
    const externalNodesExt = get(extensibilityNodesExtSelector);
    const configuration = get(configurationAtom);
    const features = configuration?.features;

    const scope: Scope = activeNamespaceId ? 'namespace' : 'cluster';
    if (!navNodes || !externalNodes) {
      return [];
    }
    let allNodes = [...navNodes, ...externalNodes];

    const extResources = get(extensionsState);
    const isExtensibilityOn =
      features?.[configFeaturesNames.EXTENSIBILITY]?.isEnabled;
    if (isExtensibilityOn && extResources) {
      const extNavNodes = extResources.map(ext => mapExtResourceToNavNode(ext));
      allNodes = mergeInExtensibilityNav(allNodes, extNavNodes);
    }

    if (externalNodesExt) {
      allNodes = allNodes.concat(externalNodesExt);
    }
    const nodesFromCurrentScope = partial(hasCurrentScope, scope);
    const filteredNodes = allNodes.filter(nodesFromCurrentScope);

    const assignedToCategories: Category[] = assignNodesToCategories(
      filteredNodes,
    );

    return assignedToCategories;
  },
});

export const mergeInExtensibilityNav = (
  nodes: NavNode[],
  extensionNodes: NavNode[],
) => {
  const busolaNodeList = [...nodes];

  extensionNodes.forEach(extNode => {
    if (isLabelAndPathDefined(extNode)) {
      const busolaNodeSameAsExtNodeFn = partial(isTheSameLabelAndPath, extNode);
      const elToBeReplacedIndex = busolaNodeList.findIndex(
        busolaNodeSameAsExtNodeFn,
      );
      replaceOrAddNode(busolaNodeList, extNode, elToBeReplacedIndex);
    }
  });

  return busolaNodeList;
};

const replaceOrAddNode = (
  nodeList: NavNode[],
  node: NavNode,
  index: number,
) => {
  if (index === -1) {
    nodeList.push(node);
  } else {
    nodeList.splice(index, 1, node);
  }
};

const isTheSameLabelAndPath = (
  busolaNode: NavNode,
  extNode: NavNode,
): boolean =>
  busolaNode.label === extNode.label &&
  busolaNode.pathSegment === extNode.pathSegment;

const isLabelAndPathDefined = (node: NavNode) => node.label && node.pathSegment;
