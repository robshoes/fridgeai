import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { BANNER_AD_UNIT_ID } from './adUnitIds';

// Placed at the bottom of Home and Inventario (see PRD §Monetizzazione
// pubblicitaria). A load failure just renders nothing — never blocks the
// screen it sits on.
export function AppBannerAd() {
  return <BannerAd unitId={BANNER_AD_UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />;
}
