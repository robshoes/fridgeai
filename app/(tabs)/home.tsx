import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '../../src/components/PlaceholderScreen';
import { AppBannerAd } from '../../src/features/ads/AppBannerAd';
import { i18n } from '../../src/i18n';

// Temporary entry point to the shopping list until the real Home screen
// (with its own "apri lista della spesa" action) is built in Fase 6.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <PlaceholderScreen title={i18n.t('tabs.home')}>
        <Link href="/shopping-list" style={styles.link}>
          <Text style={styles.linkText}>{i18n.t('shoppingList.title')}</Text>
        </Link>
      </PlaceholderScreen>
      <AppBannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  link: { marginTop: 16 },
  linkText: { color: '#2e7d32', fontWeight: '600' },
});
