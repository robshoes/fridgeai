import { StyleSheet, Text, View } from 'react-native';

import { i18n } from '../i18n';

type Props = {
  title: string;
};

// Used by (tabs) screens not yet implemented — replaced fase by fase
// per docs/04-roadmap.md.
export function PlaceholderScreen({ title }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{i18n.t('common.comingSoon')}</Text>
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
