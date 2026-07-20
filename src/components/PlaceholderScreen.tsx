import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { i18n } from '../i18n';

type Props = PropsWithChildren<{
  title: string;
}>;

// Used by (tabs) screens not yet implemented — replaced fase by fase
// per docs/04-roadmap.md.
export function PlaceholderScreen({ title, children }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{i18n.t('common.comingSoon')}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
  },
});
