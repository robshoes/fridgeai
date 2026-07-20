import { StyleSheet, Text } from 'react-native';

import { useOnline } from '../features/network/NetworkProvider';
import { i18n } from '../i18n';
import { colors } from '../theme';

// Ambient "you're offline" cue shown on every screen (PRD Fase 6: read-only
// from cache, no writes/AI calls offline) — individual screens still show
// their own specific error when a write/AI action is actually attempted.
export function OfflineBanner() {
  const isOnline = useOnline();
  if (isOnline) {
    return null;
  }
  return <Text style={styles.banner}>{i18n.t('common.offlineBanner')}</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    color: colors.white,
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});
