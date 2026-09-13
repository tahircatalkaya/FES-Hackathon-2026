import { useCallback, type RefObject } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Refresh on focus; poll only while the app is active and no mutation is pending. */
export function useFocusRefresh(refresh: () => Promise<void>, paused?: RefObject<boolean>) {
  useFocusEffect(useCallback(() => {
    void refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active' && !paused?.current) void refresh();
    }, 10_000);
    return () => clearInterval(timer);
  }, [refresh, paused]));
}
