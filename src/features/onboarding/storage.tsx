import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

const ONBOARDING_SEEN_KEY = 'fridgeai.onboardingSeen';

type OnboardingContextValue = {
  seen: boolean;
  isLoading: boolean;
  markSeen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const value = use(OnboardingContext);
  if (!value) {
    throw new Error('useOnboarding must be used within an <OnboardingProvider>');
  }
  return value;
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [seen, setSeen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then((value) => {
      setSeen(value === 'true');
      setIsLoading(false);
    });
  }, []);

  const markSeen = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    setSeen(true);
  };

  return (
    <OnboardingContext.Provider value={{ seen, isLoading, markSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}
