import { useTranslation } from 'react-i18next';
import { ObjectStatus } from '@ui5/webcomponents-react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './StatusBadge.scss';
import { PopoverBadge } from '../PopoverBadge/PopoverBadge';

const resolveType = status => {
  if (typeof status !== 'string') {
    console.warn(
      `'autoResolveType' prop requires 'children' prop to be a string.`,
    );
    return undefined;
  }

  switch (status) {
    case 'Initial':
    case 'Pending':
    case 'Available':
    case 'Released':
      return 'Information';

    case 'Ready':
    case 'Bound':
    case 'Running':
    case 'Success':
    case 'Succeeded':
    case 'Ok':
      return 'Positive';

    case 'Unknown':
    case 'Warning':
      return 'Critical';

    case 'Failed':
    case 'Error':
    case 'Failure':
    case 'Invalid':
      return 'Negative';

    default:
      return 'None';
  }
};

const translate = (i18n, t, arrayOfVariableNames, fallbackValue) => {
  return i18n.exists(arrayOfVariableNames)
    ? t(arrayOfVariableNames)
    : fallbackValue;
};

const prepareTranslationPath = (resourceKind, value, type) => {
  return `${resourceKind.toString().toLowerCase()}.${type}.${value
    .toString()
    .toLowerCase()
    .replace(/\s/g, '-')}`;
};

const TYPE_FALLBACK = new Map([
  ['positive', 'Positive'],
  ['critical', 'Critical'],
  ['negative', 'Negative'],
  ['info', 'Information'],
]);

export const StatusBadge = ({
  additionalContent,
  tooltipContent, // deprecated
  type,
  resourceKind = 'common',
  children: value = '',
  autoResolveType = false,
  noTooltip = false,
  className,
}) => {
  const { t, i18n } = useTranslation();
  if (autoResolveType) type = resolveType(value);
  else type = TYPE_FALLBACK.get(type) || type;

  const i18nFullVariableName = prepareTranslationPath(
    resourceKind,
    value,
    'statuses',
  );
  const commonStatusVariableName = prepareTranslationPath(
    'common',
    value,
    'statuses',
  );
  const tooltipVariableName = prepareTranslationPath(
    resourceKind,
    value,
    'tooltips',
  );
  const commonTooltipVariableName = prepareTranslationPath(
    'common',
    value,
    'tooltips',
  );
  const fallbackValue = value.toString();
  const badgeContent = translate(
    i18n,
    t,
    [i18nFullVariableName, commonStatusVariableName],
    fallbackValue,
  );
  let content = translate(
    i18n,
    t,
    [tooltipVariableName, commonTooltipVariableName, i18nFullVariableName],
    fallbackValue,
  );

  if (!additionalContent && content === badgeContent) noTooltip = true;

  const classes = classNames(
    'status-badge',
    {
      'has-tooltip': !noTooltip,
    },
    className,
  );

  if (additionalContent) {
    if (badgeContent === content) content = additionalContent;
    else {
      // Remove the dot at the end of the sentence if we add a colon afterwards
      if (content?.endsWith('.')) content = content?.slice(0, -1);
      content = `${content}: ${additionalContent}`;
    }
  }

  // tooltipContent is DEPRECATED. Use the TooltipBadge component if a Badge with a simple Tooltip is needed.
  if (tooltipContent) {
    return (
      <PopoverBadge
        tooltipContent={tooltipContent}
        type={type}
        className={classes}
      >
        {badgeContent}
      </PopoverBadge>
    );
  } else if (noTooltip) {
    return (
      <ObjectStatus
        aria-label="Status"
        role="status"
        inverted
        state={type}
        className={classes}
        data-testid="no-tooltip"
        showDefaultIcon={type !== 'Information'}
      >
        {badgeContent}
      </ObjectStatus>
    );
  } else {
    return (
      <PopoverBadge tooltipContent={content} type={type} className={classes}>
        {badgeContent}
      </PopoverBadge>
    );
  }
};

StatusBadge.propTypes = {
  additionalContent: PropTypes.node,
  tooltipContent: PropTypes.node,
  type: PropTypes.oneOf([
    'Information',
    'Positive',
    'Negative',
    'Critical',
    'None',
  ]),
  autoResolveType: PropTypes.bool,
  noTooltip: PropTypes.bool,
  resourceKind: PropTypes.string,
  tooltipProps: PropTypes.object,
  className: PropTypes.string,
};
