import { useNetworkState } from 'expo-network';
import { createContext, use, type PropsWithChildren } from 'react';

const NetworkContext = createContext<boolean | null>(null);

export function useOnline(): boolean {
  const value = use(NetworkContext);
  if (value === null) {
    throw new Error('useOnline must be used within a <NetworkProvider>');
  }
  return value;
}

export function NetworkProvider({ children }: PropsWithChildren) {
  const state = useNetworkState();
  // Optimistic until proven otherwise: while the OS hasn't reported yet,
  // or on the (rare) platform where isInternetReachable stays null, don't
  // block the user on an unknown.
  const isOnline = state.isConnected !== false && state.isInternetReachable !== false;

  return <NetworkContext.Provider value={isOnline}>{children}</NetworkContext.Provider>;
}
