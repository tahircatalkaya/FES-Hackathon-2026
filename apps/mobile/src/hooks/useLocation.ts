import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/** Bockenheimer Warte, Frankfurt. Fallback, wenn keine Freigabe oder Demo. */
export const DEMO_LOC = { lat: 50.1206, lon: 8.6506 };

export function useLocation(auto = true) {
  const [loc, setLoc] = useState<{ lat: number; lon: number }>(DEMO_LOC);
  const [status, setStatus] = useState<'idle' | 'asking' | 'granted' | 'denied' | 'demo'>('idle');

  const request = useCallback(async () => {
    setStatus('asking');
    try {
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      if (s !== 'granted') { setStatus('demo'); return DEMO_LOC; }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const l = { lat: p.coords.latitude, lon: p.coords.longitude };
      // Außerhalb Rhein-Main? Dann Demo-Standort, damit die Karte etwas zeigt.
      const inFfm = l.lat > 49.9 && l.lat < 50.35 && l.lon > 8.3 && l.lon < 9.0;
      setLoc(inFfm ? l : DEMO_LOC); setStatus(inFfm ? 'granted' : 'demo');
      return inFfm ? l : DEMO_LOC;
    } catch { setStatus('demo'); return DEMO_LOC; }
  }, []);

  useEffect(() => { if (auto) request(); }, [auto]);
  return { loc, status, request, isDemo: status !== 'granted' };
}

export type TrackPoint = { lat: number; lon: number; t: number; acc?: number };

/** Nur während einer bewusst gestarteten Fahrt. Stoppt sauber, keine Hintergrundaufzeichnung. */
export function useTracker() {
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [active, setActive] = useState(false);
  const sub = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    setPoints([]); setActive(true);
    if (Platform.OS === 'web') return true;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return false;
      sub.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 8 }, (p) => {
        setPoints((prev) => [...prev, { lat: p.coords.latitude, lon: p.coords.longitude, t: p.timestamp, acc: p.coords.accuracy ?? undefined }]);
      });
      return true;
    } catch { return false; }
  }, []);

  const stop = useCallback(() => { sub.current?.remove(); sub.current = null; setActive(false); }, []);
  const feed = useCallback((p: TrackPoint) => setPoints((prev) => [...prev, p]), []);
  useEffect(() => () => { sub.current?.remove(); }, []);
  return { points, active, start, stop, feed, reset: () => setPoints([]) };
}
