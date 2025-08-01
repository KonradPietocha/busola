import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';
import { Select, Option, Label } from '@ui5/webcomponents-react';
import { languageAtom } from 'state/preferences/languageAtom';

const AVAILABLE_LANGUAGES = [{ key: 'en', text: 'English' }];

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const setLanguage = useSetRecoilState(languageAtom);

  const onChange = (event: CustomEvent) => {
    const selectedLanguage = event.detail.selectedOption.value;
    setLanguage(selectedLanguage);
  };

  return (
    <div className="preferences-row">
      <Label for="language-select" className="bsl-has-color-status-4">
        {t('settings.language')}
      </Label>
      <Select
        id="language-select"
        accessibleName={t('settings.language')}
        onChange={onChange}
      >
        {AVAILABLE_LANGUAGES.map(available_language => (
          <Option
            value={available_language.key}
            key={available_language.key}
            selected={i18n.language === available_language.key}
          >
            {available_language.text}
          </Option>
        ))}
      </Select>
    </div>
  );
}
