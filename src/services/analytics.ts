import AsyncStorage from '@react-native-async-storage/async-storage';
import PostHog from 'posthog-react-native';

type EventProperties = Record<string, string | number | boolean | null>;

// Mirrors src/services/sentry.ts: no-op until EXPO_PUBLIC_POSTHOG_* is set,
// so local dev doesn't require a PostHog project to exist.
let client: PostHog | null = null;

const LAST_OPENED_AT_KEY = 'analytics_last_opened_at';
const RETURN_GAP_MS = 7 * 24 * 60 * 60 * 1000;

// Called once, at app startup (see app/_layout.tsx).
export function initAnalytics() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  if (!apiKey || !host) {
    return;
  }

  client = new PostHog(apiKey, { host });
  client.capture('app_opened');
  trackReturnIfDue(client);
}

// docs/03-architecture.md §Eventi Analytics: `user_returned` = a session at
// least 7 days after the previous one. Compares against the last recorded
// open instead of relying on PostHog's own session gap, which resets on
// every foreground and can't express a 7-day threshold.
async function trackReturnIfDue(posthog: PostHog) {
  const lastOpenedAtRaw = await AsyncStorage.getItem(LAST_OPENED_AT_KEY);
  const now = Date.now();
  if (lastOpenedAtRaw && now - Number(lastOpenedAtRaw) >= RETURN_GAP_MS) {
    posthog.capture('user_returned');
  }
  await AsyncStorage.setItem(LAST_OPENED_AT_KEY, String(now));
}

export function identifyUser(userId: string) {
  client?.identify(userId);
}

export function resetAnalytics() {
  client?.reset();
}

export function track(event: string, properties?: EventProperties) {
  client?.capture(event, properties);
}
