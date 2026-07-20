import { Stack } from 'expo-router';

import { initSentry } from '../src/services/sentry';

initSentry();

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
