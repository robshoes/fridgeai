import mobileAds from 'react-native-google-mobile-ads';

// Called once at app startup (see app/_layout.tsx).
export function initAds() {
  mobileAds()
    .initialize()
    .catch(() => {
      // Non-fatal: ads simply won't show if init fails (e.g. no network).
    });
}
