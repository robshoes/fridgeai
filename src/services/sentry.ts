import * as Sentry from '@sentry/react-native';

// Called once, at app startup (see app/_layout.tsx). No-op in local dev
// until EXPO_PUBLIC_SENTRY_DSN is set, so we don't spam warnings before a
// Sentry project exists.
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
  });
}
