import { Linking, Platform } from 'react-native';

/** Öffnet die Route in Apple Karten, Google Maps oder im Browser. */
export function openRoute(lat: number, lon: number, label = 'Ziel') {
  const q = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lon}&q=${q}&dirflg=w`,
    android: `google.navigation:q=${lat},${lon}&mode=w`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`,
  })!;
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
  Linking.openURL(url).catch(() => Linking.openURL(web).catch(() => {}));
}
