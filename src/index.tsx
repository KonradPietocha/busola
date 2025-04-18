import i18next from 'i18next';
import yaml from 'js-yaml';
import { Suspense } from 'react';
import { RecoilRoot } from 'recoil';
import { initReactI18next } from 'react-i18next';
import { BrowserRouter } from 'react-router';
import i18nextBackend from 'i18next-http-backend';
import { savePreviousPath } from 'state/useAfterInitHook';

import App from './components/App/App';
import { Spinner } from 'shared/components/Spinner/Spinner';
import { NotificationProvider } from 'shared/contexts/NotificationContext';

import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/dist/Assets';
import '@ui5/webcomponents-icons/dist/AllIcons.js';
import '@ui5/webcomponents-icons-tnt/dist/network.js';
import '@ui5/webcomponents-icons-tnt/dist/application.js';
import '@ui5/webcomponents-icons-tnt/dist/application-service.js';
import '@sap-ui/common-css/dist/sap-margin.css';
import '@sap-ui/common-css/dist/sap-padding.css';

import './styles/reset.css';
import './styles/sapIllus-Fills.css';
import './styles/sapIllus-Layout.css';
import './styles/index.scss';
import './styles/fiori-helpers.scss';
import { createRoot } from 'react-dom/client';

i18next
  .use(initReactI18next)
  .use(i18nextBackend)
  .init({
    lng: 'en',
    fallbackLng: false,
    nsSeparator: '::',
    defaultNS: 'translation',
    backend: {
      loadPath: '/i18n/{{lng}}.yaml',
      parse: (data: string) => ({
        ...(yaml.load(data) as object),
        fallback: '{{fallback}}',
      }),
    },
    saveMissing: true,
    missingKeyHandler: (_lngs, _ns, key) => {
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        console.warn(key);
      }
    },
    interpolation: {
      escapeValue: false, // react already handles the escaping
    },
  });

savePreviousPath();

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <RecoilRoot>
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </RecoilRoot>,
);
