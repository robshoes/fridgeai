import { useCallback, useEffect, useRef, useState } from 'react';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

import { REWARDED_AD_UNIT_ID } from './adUnitIds';

export type RewardedAdReward = { amount: number; type: string };
export type RewardedAdResult = { earnedReward: boolean; reward?: RewardedAdReward };

// Reusable ad-watching mechanism, independent of what the reward means.
// Fase 3 wires `show()`'s result into granting bonus scans once the daily
// scan counter exists (see docs/04-roadmap.md Fase 2.5/Fase 3).
export function useRewardedAd() {
  const [isLoaded, setIsLoaded] = useState(false);
  const adRef = useRef<RewardedAd | null>(null);
  if (adRef.current === null) {
    adRef.current = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);
  }

  useEffect(() => {
    const ad = adRef.current!;
    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () =>
      setIsLoaded(true),
    );
    ad.load();
    return unsubscribeLoaded;
  }, []);

  const show = useCallback((): Promise<RewardedAdResult> => {
    return new Promise((resolve, reject) => {
      const ad = adRef.current!;
      let reward: RewardedAdReward | undefined;

      const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (r) => {
        reward = r;
      });
      const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
        setIsLoaded(false);
        ad.load(); // preload the next one
        resolve({ earnedReward: Boolean(reward), reward });
      });
      const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
        reject(error);
      });

      ad.show();
    });
  }, []);

  return { isLoaded, show };
}
