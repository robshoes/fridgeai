import { Stack } from 'expo-router';

import { i18n } from '../../../src/i18n';

export default function InventoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: i18n.t('tabs.inventory') }} />
      <Stack.Screen
        name="new"
        options={{ title: i18n.t('inventory.addTitle'), presentation: 'modal' }}
      />
      <Stack.Screen name="[id]" options={{ title: i18n.t('inventory.editTitle') }} />
    </Stack>
  );
}
