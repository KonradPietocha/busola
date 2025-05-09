import { useTranslation } from 'react-i18next';

import { ControlledBy } from 'shared/components/ControlledBy/ControlledBy';
import { ResourceDetails } from 'shared/components/ResourceDetails/ResourceDetails';
import SecretData from 'shared/components/Secret/SecretData';
import { HelmReleaseData } from 'components/HelmReleases/HelmReleaseData';
import { CertificateData } from './CertificateData';
import SecretCreate from './SecretCreate';
import { ResourceDescription } from 'resources/Secrets';
import { EventsList } from 'shared/components/EventsList';
import { filterByResource } from 'hooks/useMessageList';
import { UI5Panel } from 'shared/components/UI5Panel/UI5Panel';
import { LayoutPanelRow } from 'shared/components/LayoutPanelRow/LayoutPanelRow';

function HelmReleaseDataWrapper(secret) {
  if (secret.type !== 'helm.sh/release.v1') {
    return null;
  }

  return <HelmReleaseData key="helm-release-data" releaseSecret={secret} />;
}

export function SecretDetails(props) {
  const { t } = useTranslation();
  const Secret = resource => <SecretData key="secret-data" secret={resource} />;

  const customColumns = [
    {
      header: t('common.headers.owner'),
      value: secret => (
        <ControlledBy
          ownerReferences={secret.metadata.ownerReferences}
          namespace={secret.metadata.namespace}
        />
      ),
    },
  ];

  const Events = () => (
    <EventsList
      key="events"
      namespace={props.namespace}
      filter={filterByResource('Secret', props.resourceName)}
      hideInvolvedObjects={true}
    />
  );

  const Configuration = secret => (
    <UI5Panel
      fixed
      keyComponent={'secret-configuration'}
      key="secret-configuration"
      title={t('common.headers.configuration')}
    >
      <LayoutPanelRow name={t('secrets.headers.type')} value={secret.type} />
    </UI5Panel>
  );

  return (
    <ResourceDetails
      customComponents={[
        Configuration,
        Secret,
        CertificateData,
        HelmReleaseDataWrapper,
        Events,
      ]}
      customColumns={customColumns}
      description={ResourceDescription}
      createResourceForm={SecretCreate}
      {...props}
    />
  );
}

export default SecretDetails;
