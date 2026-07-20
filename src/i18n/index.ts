import { I18n } from 'i18n-js';

import it from './locales/it';

// MVP ships only in Italian (PRD §Localizzazione): the locale is fixed
// rather than derived from expo-localization's getLocales(), since there
// is nothing to fall back to yet. Add a locale file + a translations entry
// below to support a second language later.
export const translations = { it };

export const i18n = new I18n(translations);
i18n.locale = 'it';
i18n.defaultLocale = 'it';
i18n.enableFallback = true;

export default i18n;
