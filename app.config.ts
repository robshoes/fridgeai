import type { ExpoConfig } from 'expo/config';

// Dynamic config (instead of static app.json) so we can read build-time
// values (EAS project id, per-environment app name) from process.env.
// Client-facing secrets (Supabase URL/anon key, Sentry DSN) are NOT read
// here: they go through EXPO_PUBLIC_* vars in .env, inlined directly into
// process.env at build time (see .env.example).
const config: ExpoConfig = {
  name: 'fridgeai',
  slug: 'fridgeai',
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
  },
  android: {
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
    [
      '@sentry/react-native/expo',
      {
        // organization/project/url enable automatic source map upload during
        // EAS builds (via SENTRY_AUTH_TOKEN as an EAS secret) — add them once
        // the Sentry project exists. Crash/error reporting itself works
        // without them, as long as EXPO_PUBLIC_SENTRY_DSN is set.
      },
    ],
  ],
  extra: {
    eas: {
      // Not a secret — `eas init` overwrites this with the real project id
      // once the project is linked to an EAS account.
      projectId: 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
  // `eas update:configure` fills in `updates.url` and `runtimeVersion`
  // automatically once the project is linked — left out until then.
};

export default config;
