import type { ExpoConfig } from 'expo/config';

// Dynamic config (instead of static app.json) so we can read build-time
// values (EAS project id, per-environment app name) from process.env.
// Client-facing secrets (Supabase URL/anon key, Sentry DSN) are NOT read
// here: they go through EXPO_PUBLIC_* vars in .env, inlined directly into
// process.env at build time (see .env.example).

// Google's official test AdMob app IDs — safe defaults so the app works
// out of the box before a real AdMob account exists. Override via env
// once the user creates one (see .env.example).
const ADMOB_ANDROID_APP_ID_TEST = 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_IOS_APP_ID_TEST = 'ca-app-pub-3940256099942544~1458002511';

const config: ExpoConfig = {
  name: 'fridgeai',
  slug: 'fridgeai',
  owner: 'fridgeai-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'fridgeai',
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fridgeai.app',
  },
  android: {
    package: 'com.fridgeai.app',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-splash-screen',
    'expo-font',
    [
      '@sentry/react-native/expo',
      {
        organization: 'fridgeai-yn',
        project: 'fridgeai',
        // Also needs SENTRY_AUTH_TOKEN as an EAS secret to actually upload
        // source maps during builds — crash/error reporting itself works
        // without it, as long as EXPO_PUBLIC_SENTRY_DSN is set.
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        // `||` (not `??`): an empty string from a copied .env.example line
        // must also fall back to the test ID, not just an unset var.
        androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || ADMOB_ANDROID_APP_ID_TEST,
        iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || ADMOB_IOS_APP_ID_TEST,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '4f8f698d-9282-4115-814a-ad92b256edcc',
    },
  },
  updates: {
    url: 'https://u.expo.dev/4f8f698d-9282-4115-814a-ad92b256edcc',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
};

export default config;
