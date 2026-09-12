import transit from '@/data/transit.json';

export type LL = [number, number]; // lat, lon
export type TracePoint = [number, number, number]; // lat, lon, seconds-of-day

export interface Station { id: number; name: string; lat: number; lon: number }
export interface Pattern {
  route: string; kind: 'U' | 'S' | 'T'; color: string; dir: string; headsign: string;
  stops: number[]; offsets: number[]; departures: number[]; shape: LL[];
}

export const STATIONS: Station[] = transit.stations as Station[];
export const PATTERNS: Pattern[] = transit.patterns as Pattern[];
export const SERVICE_DAY: string = transit.serviceDay;

export function haversine(a: number, b: number, c: number, d: number) {
  const R = 6371000;
  const p1 = (a * Math.PI) / 180, p2 = (c * Math.PI) / 180;
  const dp = ((c - a) * Math.PI) / 180, dl = ((d - b) * Math.PI) / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function distToSegment(p: LL, a: LL, b: LL) {
  const kx = 111320 * Math.cos((a[0] * Math.PI) / 180), ky = 110540;
  const ax = a[1] * kx, ay = a[0] * ky, bx = b[1] * kx, by = b[0] * ky, px = p[1] * kx, py = p[0] * ky;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolyline(p: LL, line: LL[]) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) best = Math.min(best, distToSegment(p, line[i], line[i + 1]));
  return best;
}

export function nearestStations(lat: number, lon: number, n = 6, maxM = 1500) {
  return STATIONS.map((s) => ({ ...s, d: haversine(lat, lon, s.lat, s.lon) }))
    .filter((s) => s.d <= maxM)
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
}

export interface Departure { route: string; kind: string; color: string; headsign: string; minute: number; pattern: Pattern; stopIndex: number }

/** Nächste Abfahrten an einer Station (Minuten seit Mitternacht). */
export function departuresAt(stationId: number, nowMin: number, limit = 8): Departure[] {
  const out: Departure[] = [];
  for (const p of PATTERNS) {
    const si = p.stops.indexOf(stationId);
    if (si < 0 || si === p.stops.length - 1) continue;
    for (const d of p.departures) {
      const m = d + p.offsets[si];
      if (m >= nowMin - 1 && m <= nowMin + 90) out.push({ route: p.route, kind: p.kind, color: p.color, headsign: p.headsign, minute: m, pattern: p, stopIndex: si });
    }
  }
  out.sort((a, b) => a.minute - b.minute);
  // gleiche Linie/Richtung nicht 8× hintereinander
  const seen: Record<string, number> = {};
  return out.filter((d) => { const k = d.route + d.headsign; seen[k] = (seen[k] ?? 0) + 1; return seen[k] <= 2; }).slice(0, limit);
}

export interface UpcomingStop { id: number; name: string; lat: number; lon: number; minute: number; last: boolean }

/**
 * Restliche Halte einer Fahrt ab dem Einstieg, mit planmaessiger Ankunft.
 * Die Abfahrt kennt ihren Halt-Index, daraus laesst sich der Fahrtbeginn zurueckrechnen.
 */
export function remainingStops(d: Departure): UpcomingStop[] {
  const start = d.minute - d.pattern.offsets[d.stopIndex];
  const lastIdx = d.pattern.stops.length - 1;
  return d.pattern.stops.slice(d.stopIndex + 1).map((id, k) => {
    const i = d.stopIndex + 1 + k;
    const st = STATIONS[id];
    return { id, name: st.name, lat: st.lat, lon: st.lon, minute: start + d.pattern.offsets[i], last: i === lastIdx };
  });
}

export interface MatchScore {
  pattern: Pattern;
  fromIdx: number; toIdx: number;
  confidence: number;
  parts: { stops: number; time: number; shape: number; speed: number };
  reasons: string[];
  km: number;
  departure: number;
  stopsHit: number; stopsTotal: number;
  meanShapeDev: number; meanTimeDev: number;
}

export interface MatchResult {
  ok: boolean;
  reason?: string;
  candidates: MatchScore[];
  traceKm: number;
  gaps: number;
}

function traceLength(tr: TracePoint[]) {
  let L = 0;
  for (let i = 1; i < tr.length; i++) L += haversine(tr[i - 1][0], tr[i - 1][1], tr[i][0], tr[i][1]);
  return L;
}

/** GPS-Spur gegen Fahrplan-Muster abgleichen. Läuft on-device, die Rohspur verlässt das Gerät nicht. */
export function matchTrace(tr: TracePoint[]): MatchResult {
  const traceM = traceLength(tr);
  const gaps = tr.filter((p, i) => i > 0 && p[2] - tr[i - 1][2] > 180).length;
  if (tr.length < 6 || traceM < 500) return { ok: false, reason: 'Spur zu kurz (unter 500 m). Keine Bewertung, keine Punkte.', candidates: [], traceKm: traceM / 1000, gaps };

  const first = tr[0], last = tr[tr.length - 1];
  const t0 = first[2], t1 = last[2];
  const cands: MatchScore[] = [];

  for (const p of PATTERNS) {
    // Einstiegs-/Ausstiegskandidaten
    let fromIdx = -1, toIdx = -1, dFrom = 300, dTo = 300;
    p.stops.forEach((sid, i) => {
      const s = STATIONS[sid];
      const d0 = haversine(first[0], first[1], s.lat, s.lon);
      if (d0 < dFrom) { dFrom = d0; fromIdx = i; }
    });
    if (fromIdx < 0) continue;
    p.stops.forEach((sid, i) => {
      if (i <= fromIdx) return;
      const s = STATIONS[sid];
      const d1 = haversine(last[0], last[1], s.lat, s.lon);
      if (d1 < dTo) { dTo = d1; toIdx = i; }
    });
    if (toIdx < 0) continue;

    // Fahrplan: welche Abfahrt passt zeitlich zum Start?
    const startMin = t0 / 60;
    let bestDep = p.departures[0], bestDev = Infinity;
    for (const d of p.departures) {
      const dev = Math.abs(d + p.offsets[fromIdx] - startMin);
      if (dev < bestDev) { bestDev = dev; bestDep = d; }
    }
    if (bestDev > 12) continue; // keine Fahrt im Zeitfenster

    // 1) Haltestellen-Trefferquote
    let hit = 0; const timeDevs: number[] = [];
    for (let i = fromIdx; i <= toIdx; i++) {
      const s = STATIONS[p.stops[i]];
      let dmin = Infinity, tAt = 0;
      for (const q of tr) { const d = haversine(q[0], q[1], s.lat, s.lon); if (d < dmin) { dmin = d; tAt = q[2]; } }
      if (dmin < 150) { hit++; timeDevs.push(Math.abs(tAt / 60 - (bestDep + p.offsets[i]))); }
    }
    const total = toIdx - fromIdx + 1;
    const stopsScore = hit / total;

    // 2) Zeit
    const meanTimeDev = timeDevs.length ? timeDevs.reduce((a, b) => a + b, 0) / timeDevs.length : 10;
    const timeScore = Math.max(0, 1 - meanTimeDev / 10);

    // 3) Streckenähnlichkeit (Abstand zur Linienform zwischen Ein- und Ausstieg)
    const a = STATIONS[p.stops[fromIdx]], b = STATIONS[p.stops[toIdx]];
    const ia = p.shape.reduce((bi, pt, i) => (haversine(pt[0], pt[1], a.lat, a.lon) < haversine(p.shape[bi][0], p.shape[bi][1], a.lat, a.lon) ? i : bi), 0);
    const ib = p.shape.reduce((bi, pt, i) => (haversine(pt[0], pt[1], b.lat, b.lon) < haversine(p.shape[bi][0], p.shape[bi][1], b.lat, b.lon) ? i : bi), 0);
    const seg = p.shape.slice(Math.min(ia, ib), Math.max(ia, ib) + 1);
    const devs = tr.map((q) => distToPolyline([q[0], q[1]], seg.length > 1 ? seg : p.shape));
    const meanShapeDev = devs.reduce((x, y) => x + y, 0) / devs.length;
    const shapeScore = Math.max(0, 1 - meanShapeDev / 200);

    // 4) Geschwindigkeitsprofil: Stillstände nahe Haltestellen, Mediangeschwindigkeit
    let stillNearStop = 0, stillTotal = 0; const speeds: number[] = [];
    for (let i = 1; i < tr.length; i++) {
      const d = haversine(tr[i - 1][0], tr[i - 1][1], tr[i][0], tr[i][1]);
      const dt = Math.max(1, tr[i][2] - tr[i - 1][2]);
      const v = d / dt; speeds.push(v);
      if (v < 1.2) {
        stillTotal++;
        const near = p.stops.slice(fromIdx, toIdx + 1).some((sid) => haversine(tr[i][0], tr[i][1], STATIONS[sid].lat, STATIONS[sid].lon) < 120);
        if (near) stillNearStop++;
      }
    }
    const med = speeds.length ? [...speeds].sort((x, y) => x - y)[Math.floor(speeds.length / 2)] * 3.6 : 0;
    const stillScore = stillTotal ? stillNearStop / stillTotal : 0.2;
    const speedPlaus = med > 4 && med < 75 ? 1 : 0.3;
    const speedScore = 0.6 * stillScore + 0.4 * speedPlaus;

    let confidence = 0.35 * stopsScore + 0.25 * timeScore + 0.25 * shapeScore + 0.15 * speedScore;
    if (gaps > 0) confidence -= 0.15;
    if (t1 - t0 < 90) confidence -= 0.2;
    confidence = Math.max(0, Math.min(1, confidence));

    let km = 0;
    for (let i = fromIdx; i < toIdx; i++) km += haversine(STATIONS[p.stops[i]].lat, STATIONS[p.stops[i]].lon, STATIONS[p.stops[i + 1]].lat, STATIONS[p.stops[i + 1]].lon);
    km = km / 1000;

    const reasons = [
      `${hit} von ${total} Haltestellen der ${p.route} getroffen (${a.name} → ${b.name})`,
      `Fahrplanabweichung im Schnitt ${meanTimeDev.toFixed(1)} min (Abfahrt ${fmtMin(bestDep + p.offsets[fromIdx])})`,
      `Streckenabweichung im Mittel ${Math.round(meanShapeDev)} m`,
      `${stillTotal ? Math.round(stillScore * 100) : 0} % der Stillstände an Haltestellen, Mediantempo ${Math.round(med)} km/h`,
    ];
    if (gaps) reasons.push(`${gaps} GPS-Lücke(n) über 3 min, Konfidenz um 0,15 gesenkt`);

    cands.push({ pattern: p, fromIdx, toIdx, confidence, parts: { stops: stopsScore, time: timeScore, shape: shapeScore, speed: speedScore }, reasons, km, departure: bestDep, stopsHit: hit, stopsTotal: total, meanShapeDev, meanTimeDev });
  }
  cands.sort((x, y) => y.confidence - x.confidence);
  if (!cands.length) return { ok: false, reason: 'Keine Fahrt im Fahrplan passt zu Start, Ziel und Uhrzeit. Status: nicht zuordenbar. Du kannst die Linie manuell angeben (Multiplikator 0,3).', candidates: [], traceKm: traceM / 1000, gaps };
  return { ok: true, candidates: cands.slice(0, 3), traceKm: traceM / 1000, gaps };
}

export function fmtMin(m: number) {
  const h = Math.floor(m / 60) % 24, mm = Math.round(m % 60);
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
