import type { VerificationStatus } from './types';
import { haversine } from './geo.ts';

/**
 * Vorher/Nachher-Nachweis fuer aufgehobenen Muell.
 *
 * Gegen den Kobra-Effekt gibt es hier bewusst keine Punkte je Muellstueck
 * (siehe konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md). Der Nachweis entscheidet
 * allein darueber, ob der Eintrag als belegt gilt und in die Statistik darf.
 *
 * Vier Bedingungen, alle muessen erfuellt sein:
 *   1. Zeitfenster: zwischen den Fotos liegen 10 bis 120 Minuten. Zu schnell heisst,
 *      es wurde nichts aufgeraeumt; zu lange heisst, die Fotos gehoeren nicht zusammen.
 *   2. Geofence: beide Fotos entstehen am selben Ort, hoechstens 50 m auseinander.
 *   3. Zwei verschiedene Bilder: Nachher darf nicht dasselbe Foto wie Vorher sein.
 *   4. Dublettenschutz: kein Bild, das schon einmal eingereicht wurde.
 */

export const PROOF = {
  minMinutes: 10,
  maxMinutes: 120,
  geofenceM: 50,
  /** Ab dieser Bit-Differenz gelten zwei Fingerabdruecke als verschiedene Bilder. */
  minDifferentBits: 8,
  /** Darunter zaehlt ein Bild als Wiedervorlage eines frueheren. */
  duplicateBits: 5,
};

export interface LitterShot {
  at: number;
  lat: number;
  lon: number;
  accuracy?: number;
  /** Fingerabdruck des Fotos, siehe api/photohash. */
  hash: string;
}

export interface LitterVerdict {
  ok: boolean;
  status: VerificationStatus;
  minutes: number;
  meters: number;
  reasons: string[];
}

/** Bit-Unterschied zweier Hex-Fingerabdruecke. Verschiedene Laengen gelten als voellig verschieden. */
export function hamming(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

/**
 * Prueft das Nachher-Foto gegen das Vorher-Foto und gegen alle frueher eingereichten Bilder.
 * `used` enthaelt die Fingerabdruecke abgeschlossener Nachweise.
 */
export function checkLitterProof(before: LitterShot, after: LitterShot, used: string[] = []): LitterVerdict {
  const valid = (shot: LitterShot) => Number.isFinite(shot.at) && shot.at > 0
    && Number.isFinite(shot.lat) && Math.abs(shot.lat) <= 90
    && Number.isFinite(shot.lon) && Math.abs(shot.lon) <= 180
    && Number.isFinite(shot.accuracy) && shot.accuracy! >= 0 && shot.accuracy! <= PROOF.geofenceM
    && typeof shot.hash === 'string' && /^[a-f0-9]{16}$/i.test(shot.hash);
  if (!before || !after || !valid(before) || !valid(after)) return {
    ok: false, status: 'nicht zuordenbar', minutes: 0, meters: 0,
    reasons: ['Kein gültiger Foto- und Standortnachweis. Bitte mit frischem Standort neu beginnen.'],
  };
  const minutes = (after.at - before.at) / 60000;
  const dist = haversine(before.lat, before.lon, after.lat, after.lon);
  const reasons: string[] = [];
  let ok = true;

  if (minutes < PROOF.minMinutes) {
    ok = false;
    reasons.push(`Nur ${minutes.toFixed(0)} min zwischen den Fotos, mindestens ${PROOF.minMinutes} min nötig.`);
  } else if (minutes > PROOF.maxMinutes) {
    ok = false;
    reasons.push(`${Math.round(minutes)} min zwischen den Fotos, höchstens ${PROOF.maxMinutes} min erlaubt.`);
  } else {
    reasons.push(`${Math.round(minutes)} min zwischen Vorher und Nachher, im Fenster ${PROOF.minMinutes}–${PROOF.maxMinutes} min.`);
  }

  if (dist > PROOF.geofenceM) {
    ok = false;
    reasons.push(`Die Fotos liegen ${Math.round(dist)} m auseinander, erlaubt sind ${PROOF.geofenceM} m.`);
  } else {
    reasons.push(`Beide Fotos am selben Ort, ${Math.round(dist)} m auseinander.`);
  }

  const diff = hamming(before.hash, after.hash);
  if (diff < PROOF.minDifferentBits) {
    ok = false;
    reasons.push('Vorher und Nachher zeigen dasselbe Bild.');
  } else {
    reasons.push('Vorher und Nachher sind zwei verschiedene Aufnahmen.');
  }

  const dupe = used.find((h) => hamming(h, after.hash) <= PROOF.duplicateBits || hamming(h, before.hash) <= PROOF.duplicateBits);
  if (dupe) {
    ok = false;
    reasons.push('Eines der Fotos wurde schon einmal eingereicht.');
  }

  return {
    ok,
    status: ok ? 'plausibel' : 'nicht zuordenbar',
    minutes: Math.round(minutes),
    meters: Math.round(dist),
    reasons,
  };
}
