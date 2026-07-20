import { Stack } from 'expo-router';

import { i18n } from '../../../src/i18n';

export default function ScannerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: i18n.t('tabs.scanner'), headerShown: false }} />
      <Stack.Screen name="[scanId]" options={{ title: i18n.t('scanner.results.title') }} />
    </Stack>
  );
}
