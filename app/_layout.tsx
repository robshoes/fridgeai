import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { OfflineBanner } from '../src/components/OfflineBanner';
import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
import { initAds } from '../src/features/ads/initAds';
import { NetworkProvider } from '../src/features/network/NetworkProvider';
import { OnboardingProvider, useOnboarding } from '../src/features/onboarding/storage';
import { i18n } from '../src/i18n';
import { initSentry } from '../src/services/sentry';

initSentry();
initAds();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <AuthProvider>
          <OnboardingProvider>
            <View style={{ flex: 1 }}>
              <OfflineBanner />
              <RootNavigator />
            </View>
          </OnboardingProvider>
        </AuthProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { seen: onboardingSeen, isLoading: isOnboardingLoading } = useOnboarding();
  const isLoading = isAuthLoading || isOnboardingLoading;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboardingSeen}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={onboardingSeen && !session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={onboardingSeen && !!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="shopping-list"
          options={{ headerShown: true, title: i18n.t('shoppingList.title') }}
        />
      </Stack.Protected>
    </Stack>
  );
}
