import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { i18n } from '../src/i18n';

// Placeholder route for Fase 0 — confirms Expo Router boots correctly.
// Replaced by the (auth)/(tabs) navigation shell in Fase 1.
export default function Index() {
  return (
    <View style={styles.container}>
      <Text>{i18n.t('common.appName')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
