import { Platform } from 'react-native';
import { useStore } from '@/store';

/** Lokale Erinnerung (z. B. Vytal-Rückgabe). In Expo Go/Web nur In-App-Postfach; im Build zusätzlich System-Notification. */
export async function remind(title: string, body: string, ctx: string, inSeconds?: number) {
  const s = useStore.getState();
  s.notify({ title, body, ctx });
  if (!s.privacy.notifications || Platform.OS === 'web') return;
  const h = new Date().getHours();
  if (s.privacy.quietHours && (h >= 22 || h < 7) && !inSeconds) return; // Ruhezeit
  try {
    const N = require('expo-notifications');
    await N.requestPermissionsAsync();
    await N.scheduleNotificationAsync({ content: { title, body }, trigger: inSeconds ? { seconds: inSeconds } : null });
  } catch { /* Expo Go ohne Notification-Modul */ }
}
