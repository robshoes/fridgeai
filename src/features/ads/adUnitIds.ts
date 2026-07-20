import { Platform } from 'react-native';

// Google's official test ad unit IDs — safe defaults before a real AdMob
// account/app exists. Override via env once one does (see .env.example).
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';

export const BANNER_AD_UNIT_ID: string =
  Platform.select({
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_ANDROID || TEST_BANNER_ANDROID,
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID_IOS || TEST_BANNER_IOS,
  }) ?? TEST_BANNER_ANDROID;

export const REWARDED_AD_UNIT_ID: string =
  Platform.select({
    android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_ANDROID || TEST_REWARDED_ANDROID,
    ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID_IOS || TEST_REWARDED_IOS,
  }) ?? TEST_REWARDED_ANDROID;
