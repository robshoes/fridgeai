import { Alert } from 'react-native';

import { i18n } from '../i18n';

// Best-effort detection of "no connectivity" vs. other failures, based on
// the errors React Native's fetch typically throws when offline. Good
// enough for a clear error message (PRD Fase 3 minimum); a full
// connectivity-aware experience across every screen is built in Fase 6.
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return /network request failed|failed to fetch/i.test(error.message);
}

// Shared onError handler for mutations across the app (PRD Fase 6:
// consistent, clear error messages) — network errors get the specific
// "you're offline" copy, everything else falls back to a generic one.
export function showErrorAlert(error: unknown) {
  if (isNetworkError(error)) {
    Alert.alert(i18n.t('common.networkError'));
  } else {
    Alert.alert(i18n.t('common.genericError'), error instanceof Error ? error.message : '');
  }
}
