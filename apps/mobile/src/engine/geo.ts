/** Luftlinie in Metern; Koordinaten in Grad (Breite, Länge). */
export function haversine(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const dp = rad(bLat - aLat), dl = rad(bLon - aLon);
  const x = Math.sin(dp / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dl / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(x));
}
