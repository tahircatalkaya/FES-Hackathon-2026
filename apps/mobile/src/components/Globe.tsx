import React, { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G, Path, Defs, RadialGradient, Stop, ClipPath } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Chameleon from './Chameleon';
import { C } from '@/theme';

/**
 * Globus mit der eigenen Strecke. Start ist Frankfurt, von dort geht es auf einem
 * Großkreis nach Osten, genau so weit, wie die Person mit Bus und Bahn gefahren ist.
 *
 * Dargestellt wird orthografisch, also so, wie man eine Kugel von außen sieht:
 * Gradnetz und Landmassen sind aus Längen- und Breitengraden gerechnet, nicht gemalt.
 * Die Küstenlinien sind bewusst grob gehalten, sie sind Illustration und keine Kartendaten.
 */

const R_EARTH = 6371; // km
export const CIRCUMFERENCE = 40075; // km am Äquator
const FRANKFURT = { lat: 50.11, lon: 8.68 };

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Kartennadel, Spitze im Ursprung, Kopf mit Radius 7 darüber. */
const PIN = 'M0,0 C-3,-6 -7,-9 -7,-13 A7,7 0 1 1 7,-13 C7,-9 3,-6 0,0 Z';

/**
 * Referenzorte für die Ortsangabe an der Nadel, gerundete Koordinaten.
 * Der Korridor nach Osten ist dichter besetzt, weil die Route dort entlangläuft.
 */
const PLACES: [string, number, number][] = [
  ['Frankfurt am Main', 50.11, 8.68], ['Würzburg', 49.79, 9.93], ['Nürnberg', 49.45, 11.08],
  ['München', 48.14, 11.58], ['Berlin', 52.52, 13.4], ['Dresden', 51.05, 13.74],
  ['Prag', 50.08, 14.44], ['Wien', 48.21, 16.37], ['Breslau', 51.11, 17.03],
  ['Krakau', 50.06, 19.94], ['Budapest', 47.5, 19.04], ['Warschau', 52.23, 21.01],
  ['Lemberg', 49.84, 24.03], ['Bukarest', 44.43, 26.1], ['Istanbul', 41.01, 28.98],
  ['Kiew', 50.45, 30.52], ['Sankt Petersburg', 59.94, 30.34], ['Charkiw', 49.99, 36.23],
  ['Moskau', 55.76, 37.62], ['Woronesch', 51.67, 39.21], ['Saratow', 51.53, 46.03],
  ['Samara', 53.2, 50.15], ['Orenburg', 51.77, 55.1], ['Astana', 51.13, 71.43],
  ['Nowosibirsk', 55.01, 82.93], ['Irkutsk', 52.29, 104.3], ['Ulaanbaatar', 47.89, 106.91],
  ['Peking', 39.9, 116.41], ['Wladiwostok', 43.12, 131.89], ['Tokio', 35.68, 139.69],
  ['Anchorage', 61.22, -149.9], ['Vancouver', 49.28, -123.12], ['Calgary', 51.05, -114.07],
  ['Winnipeg', 49.9, -97.14], ['Chicago', 41.88, -87.63], ['Toronto', 43.65, -79.38],
  ['New York', 40.71, -74.01], ['Reykjavík', 64.15, -21.94], ['London', 51.51, -0.13],
  ['Paris', 48.86, 2.35], ['Amsterdam', 52.37, 4.9], ['Kopenhagen', 55.68, 12.57],
  ['Stockholm', 59.33, 18.07], ['Helsinki', 60.17, 24.94], ['Madrid', 40.42, -3.7], ['Rom', 41.9, 12.5],
  // Der Großkreis nach Osten sinkt Richtung Äquator und weiter auf die Südhalbkugel.
  ['Teheran', 35.69, 51.39], ['Delhi', 28.61, 77.21], ['Kalkutta', 22.57, 88.36],
  ['Bangkok', 13.76, 100.5], ['Singapur', 1.35, 103.82], ['Jakarta', -6.21, 106.85],
  ['Perth', -31.95, 115.86], ['Sydney', -33.87, 151.21], ['Auckland', -36.85, 174.76],
  ['Kairo', 30.04, 31.24], ['Nairobi', -1.29, 36.82], ['Kapstadt', -33.92, 18.42],
  ['Honolulu', 21.31, -157.86], ['Los Angeles', 34.05, -118.24], ['Mexiko-Stadt', 19.43, -99.13],
  ['Lima', -12.05, -77.04], ['Rio de Janeiro', -22.91, -43.17], ['Buenos Aires', -34.6, -58.38],
];

/** Luftlinie in km zwischen zwei Koordinaten. */
function distKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dp = rad(bLat - aLat), dl = rad(bLon - aLon);
  const x = Math.sin(dp / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dl / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(x));
}

/**
 * Ortsangabe für die Nadel. Nah dran wird der Ort genannt, in mittlerer Entfernung mit Abstand,
 * und wenn nichts in der Nähe liegt (meist über dem Meer) stehen die Koordinaten da.
 * So wird kein Punkt einer Stadt zugeschrieben, die tausend Kilometer weit weg ist.
 */
function placeLabel(lat: number, lon: number) {
  let best = PLACES[0], bestD = Infinity;
  for (const p of PLACES) {
    const d = distKm(lat, lon, p[1], p[2]);
    if (d < bestD) { bestD = d; best = p; }
  }
  if (bestD < 100) return best[0];
  if (bestD < 500) return `${Math.round(bestD).toLocaleString('de-DE')} km von ${best[0]}`;
  const fmt = (v: number) => Math.abs(v).toLocaleString('de-DE', { maximumFractionDigits: 1 });
  return `${fmt(lat)}° ${lat >= 0 ? 'N' : 'S'} · ${fmt(lon)}° ${lon >= 0 ? 'O' : 'W'}`;
}

/** Grobe Umrisse, Punkte als [Breite, Länge]. Stilisiert, keine Vermessungsdaten. */
const LAND: [number, number][][] = [
  // Europa
  [[36, -9], [43, -9], [48, -5], [51, 2], [58, 5], [62, 5], [70, 20], [68, 32], [60, 30], [55, 38], [46, 38], [41, 29], [37, 15], [36, -3]],
  // Afrika
  [[35, -6], [37, 10], [32, 25], [22, 37], [12, 43], [10, 51], [0, 42], [-15, 40], [-25, 33], [-34, 26], [-34, 18], [-22, 14], [-5, 9], [5, 0], [5, -8], [15, -17], [25, -15], [32, -9]],
  // Asien
  [[70, 60], [75, 90], [72, 130], [65, 178], [60, 160], [52, 140], [43, 132], [35, 130], [30, 122], [22, 110], [10, 105], [8, 80], [20, 72], [25, 60], [30, 48], [40, 45], [55, 50], [65, 55]],
  // Nordamerika
  [[70, -160], [72, -120], [70, -90], [60, -65], [48, -53], [42, -70], [30, -81], [25, -97], [18, -95], [22, -106], [35, -120], [50, -128], [60, -140], [65, -165]],
  // Südamerika
  [[12, -72], [10, -60], [5, -50], [-5, -35], [-15, -38], [-25, -45], [-35, -53], [-45, -65], [-53, -70], [-40, -73], [-25, -70], [-15, -75], [0, -80], [8, -78]],
  // Australien
  [[-11, 131], [-12, 142], [-20, 148], [-28, 153], [-38, 146], [-35, 138], [-32, 128], [-22, 114], [-15, 125]],
  // Grönland
  [[83, -30], [78, -20], [70, -22], [60, -43], [68, -52], [76, -60], [82, -45]],
];

export default function Globe({
  km, size = 250, color = C.community, label, tilt = 28,
}: {
  km: number;
  size?: number;
  color?: string;
  label?: string;
  tilt?: number;
}) {
  const R = size / 2 - 10;
  const cx = size / 2, cy = size / 2;

  /** Orthografische Projektion, zentriert auf Frankfurt. `v` heißt: liegt auf der zugewandten Seite. */
  const project = useMemo(() => {
    const p0 = rad(tilt), l0 = rad(FRANKFURT.lon);
    return (latDeg: number, lonDeg: number) => {
      const p = rad(latDeg), l = rad(lonDeg);
      const cosC = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
      const x = R * Math.cos(p) * Math.sin(l - l0);
      const y = R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0));
      return { x: cx + x, y: cy - y, v: cosC > 0 };
    };
  }, [R, cx, cy, tilt]);

  /** Linienzug, der hinter der Kugel abreißt statt darüber zu laufen. */
  const strokePath = (pts: [number, number][]) => {
    let d = '', open = false;
    for (const [la, lo] of pts) {
      const q = project(la, lo);
      if (!q.v) { open = false; continue; }
      d += `${open ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)} `;
      open = true;
    }
    return d.trim();
  };

  /** Fläche: verdeckte Punkte wandern auf den Kugelrand, damit der Umriss geschlossen bleibt. */
  const areaPath = (pts: [number, number][]) => {
    if (!pts.some(([la, lo]) => project(la, lo).v)) return '';
    let d = '';
    pts.forEach(([la, lo], i) => {
      let { x, y, v } = project(la, lo);
      if (!v) {
        const dx = x - cx, dy = y - cy, len = Math.hypot(dx, dy) || 1;
        x = cx + (dx / len) * R; y = cy + (dy / len) * R;
      }
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
    });
    return d + 'Z';
  };

  const graticule = useMemo(() => {
    const out: string[] = [];
    for (let lon = -180; lon < 180; lon += 30) {
      const pts: [number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 3) pts.push([lat, lon]);
      const d = strokePath(pts); if (d) out.push(d);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: [number, number][] = [];
      for (let lon = -180; lon <= 180; lon += 3) pts.push([lat, lon]);
      const d = strokePath(pts); if (d) out.push(d);
    }
    return out;
  }, [project]);

  /** Großkreis ab Frankfurt Richtung Osten, Bogenlänge exakt `km`. */
  const route = useMemo(() => {
    const total = Math.max(0, km) / R_EARTH; // Bogenmaß
    if (total <= 0) return { d: '', end: null as null | { lat: number; lon: number } };
    const p1 = rad(FRANKFURT.lat), l1 = rad(FRANKFURT.lon), brg = rad(90);
    const at = (delta: number) => {
      const p2 = Math.asin(Math.sin(p1) * Math.cos(delta) + Math.cos(p1) * Math.sin(delta) * Math.cos(brg));
      const l2 = l1 + Math.atan2(Math.sin(brg) * Math.sin(delta) * Math.cos(p1), Math.cos(delta) - Math.sin(p1) * Math.sin(p2));
      return [deg(p2), deg(l2)] as [number, number];
    };
    const n = 160;
    const pts = Array.from({ length: n + 1 }, (_, i) => at((total * i) / n));
    return { d: strokePath(pts), end: { lat: pts[n][0], lon: pts[n][1] } };
  }, [km, project]);

  // Die Route zeichnet sich einmal ein, danach bleibt sie stehen.
  const draw = useSharedValue(0);
  useEffect(() => { draw.value = 0; draw.value = withDelay(250, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) })); }, [km]);
  const drawSt = useAnimatedStyle(() => ({ opacity: draw.value }));

  const home = project(FRANKFURT.lat, FRANKFURT.lon);
  const end = route.end ? project(route.end.lat, route.end.lon) : null;
  const laps = km / CIRCUMFERENCE;
  const pct = laps * 100;

  return (
    <View style={{ width: size, height: size + 46, alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sea" cx="36%" cy="30%" r="78%">
              <Stop offset="0%" stopColor="#8FD3FF" /><Stop offset="70%" stopColor="#2E74C8" /><Stop offset="100%" stopColor="#123E7C" />
            </RadialGradient>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="72%" stopColor={color} stopOpacity={0} /><Stop offset="100%" stopColor={color} stopOpacity={0.35} />
            </RadialGradient>
            <ClipPath id="ball"><Circle cx={cx} cy={cy} r={R} /></ClipPath>
          </Defs>

          <Circle cx={cx} cy={cy} r={R + 9} fill="url(#halo)" />
          <Circle cx={cx} cy={cy} r={R} fill="url(#sea)" />

          <G clipPath="url(#ball)">
            {LAND.map((poly, i) => {
              const d = areaPath(poly);
              return d ? <Path key={`l${i}`} d={d} fill="#7BC97F" opacity={0.95} /> : null;
            })}
            {graticule.map((d, i) => <Path key={`g${i}`} d={d} fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={0.8} />)}
          </G>

          {/* Lichtkante und heller Fleck geben der Kugel Tiefe. */}
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.5} />
          <Circle cx={cx * 0.72} cy={cy * 0.66} r={R * 0.46} fill="#ffffff" opacity={0.09} />
        </Svg>

        {/* Chami fährt oben auf dem Globus mit. */}
        <View style={{ position: 'absolute', top: -20, left: size / 2 - 61 }}><Chameleon pose="car" size={81} /></View>

        <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, drawSt]}>
          <Svg width={size} height={size}>
            <G clipPath="url(#ball)">
              {route.d ? <Path d={route.d} fill="none" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={5} strokeLinecap="round" /> : null}
              {route.d ? <Path d={route.d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" /> : null}
            </G>
            {home.v && <Circle cx={home.x} cy={home.y} r={5} fill={color} stroke="#fff" strokeWidth={2} />}
            {/* Nadel am Ankunftspunkt. Die Spitze sitzt genau auf der Koordinate, der Kopf steht darüber. */}
            {end && end.v && km > 0 && (
              <G transform={`translate(${end.x.toFixed(1)},${end.y.toFixed(1)})`}>
                <Path d={PIN} fill={color} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
                <Circle cx={0} cy={-13} r={2.8} fill="#fff" />
              </G>
            )}
          </Svg>

          {/* Ortsangabe über der Nadel. Feste Breite, damit sie ohne Textmessung mittig sitzt. */}
          {end && end.v && km > 0 && route.end && (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: Math.max(2, Math.min(size - 182, end.x - 90)), top: end.y > 80 ? end.y - 42 : end.y + 10, width: 180, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '800', color: C.ink, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' }}>
                {placeLabel(route.end.lat, route.end.lon)}
              </Text>
            </View>
          )}
        </Animated.View>

      </View>

      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Text style={{ fontWeight: '900', fontSize: 24, color: C.ink, letterSpacing: -0.5 }}>
          {km.toLocaleString('de-DE', { maximumFractionDigits: km < 100 ? 1 : 0 })} km
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '700', marginTop: 2 }}>
          {label ?? (laps >= 1
            ? `${laps.toLocaleString('de-DE', { maximumFractionDigits: 2 })}× um die Erde`
            : `${pct.toLocaleString('de-DE', { maximumFractionDigits: pct < 0.01 ? 4 : 2 })} % einer Erdumrundung`)}
        </Text>
      </View>
    </View>
  );
}
