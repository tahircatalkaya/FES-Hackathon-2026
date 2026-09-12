import { FACTORS, FOOD_CO2_PER_KG, CUP_CO2, BOWL_CO2 } from './impact.ts';

/**
 * Gemeinschafts-Impact für Frankfurt: Tag, Woche, Monat.
 *
 * Die Stadtwerte sind Demo-Daten. Sie entstehen aber nicht als drei erfundene
 * Zahlen nebeneinander, sondern als eine Zeitreihe je Tag: Woche und Monat sind
 * die Summe derselben Tage. Wer nachrechnet, bekommt dasselbe Ergebnis.
 * Die CO2-Rechnung nutzt exakt die Faktoren aus `impact.ts`, damit der Stadtwert
 * nach derselben Formel entsteht wie die eigene Gutschrift.
 */
export const CITY_PARTICIPANTS = 4120;
export const CITY_WEEK_TARGET_KG = 12000;

/** Annahmen der Demo-Stadtdaten, im UI als Quelle sichtbar. */
export const CITY_ASSUMPTIONS = {
  rideKm: 5.4,
  railShare: 0.6,
  portionG: 500,
  /** Auto-km quer durch Frankfurt, Höchst bis Bergen-Enkheim. */
  crossCityKm: 21,
};

const DAY = 86400000;

/** Deterministischer Wert je Tag: dieselbe Zahl bei jedem Öffnen, kein Flackern im Pitch. */
function noise(n: number) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Montag bis Freitag ist mehr los als am Wochenende. */
const WEEKDAY = [1.08, 1.06, 1.05, 1.04, 1.0, 0.72, 0.6];

export interface CityImpact {
  co2_g: number;
  food_g: number;
  /** Vermiedene Einwegverpackungen, Stück. */
  packaging: number;
  km: number;
  rides: number;
  /** Menschen, die in diesem Zeitraum mindestens eine Aktion hatten. */
  people: number;
  from: number;
  to: number;
  days: number;
}

const empty = (from: number, to: number): CityImpact => ({ co2_g: 0, food_g: 0, packaging: 0, km: 0, rides: 0, people: 0, from, to, days: 0 });

/** Ein Demo-Tag der Stadt, aus dem Datum abgeleitet. */
export function cityDay(dayStart: number): CityImpact {
  const n = Math.round(dayStart / DAY);
  const weekday = WEEKDAY[(new Date(dayStart).getDay() + 6) % 7];
  const wobble = 0.92 + noise(n) * 0.16;
  const people = Math.round(CITY_PARTICIPANTS * 0.31 * weekday * wobble);
  const rides = Math.round(people * 1.65 * (0.95 + noise(n + 7777) * 0.1));
  const km = rides * CITY_ASSUMPTIONS.rideKm;
  const usedG = CITY_ASSUMPTIONS.railShare * FACTORS.U.g + (1 - CITY_ASSUMPTIONS.railShare) * FACTORS.bus.g;
  const foodG = Math.round(people * 95 * weekday * (0.9 + noise(n + 1234) * 0.2));
  const packaging = Math.round(people * 0.7 * (0.9 + noise(n + 4321) * 0.2));
  return {
    people,
    rides,
    km,
    food_g: foodG,
    packaging,
    co2_g: Math.round(km * (FACTORS.car.g - usedG) + (foodG / 1000) * FOOD_CO2_PER_KG + packaging * ((CUP_CO2 + BOWL_CO2) / 2)),
    from: dayStart,
    to: dayStart + DAY,
    days: 1,
  };
}

export type Period = 'day' | 'week' | 'month';
export const PERIODS: Period[] = ['day', 'week', 'month'];

const startOfDay = (at: number) => { const d = new Date(at); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** Beginn des Zeitraums: heute, Montag dieser Woche, Erster dieses Monats. */
export function periodStart(period: Period, now = Date.now()) {
  const d = new Date(startOfDay(now));
  if (period === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (period === 'month') d.setDate(1);
  return d.getTime();
}

function sum(from: number, to: number): CityImpact {
  const out = empty(from, to);
  let peak = 0;
  for (let t = from; t < to; t = startOfDay(t + DAY + DAY / 2)) {
    const d = cityDay(t);
    out.co2_g += d.co2_g; out.food_g += d.food_g; out.packaging += d.packaging;
    out.km += d.km; out.rides += d.rides; out.days++;
    // Menschen sind keine Summe: wer an drei Tagen mitmacht, ist eine Person.
    peak = Math.max(peak, d.people);
  }
  out.people = Math.min(CITY_PARTICIPANTS, Math.round(peak * (1 + Math.log2(Math.max(1, out.days)) * 0.22)));
  return out;
}

/** Stadtwert für den laufenden Zeitraum, bis einschliesslich heute. */
export function cityImpact(period: Period, now = Date.now()): CityImpact {
  return sum(periodStart(period, now), startOfDay(now) + DAY);
}

/** Derselbe Zeitraum davor, für den Vergleich mit sich selbst statt mit anderen. */
export function previousCityImpact(period: Period, now = Date.now()): CityImpact {
  const start = periodStart(period, now);
  const elapsed = startOfDay(now) + DAY - start;
  if (period === 'month') {
    const d = new Date(start); d.setMonth(d.getMonth() - 1);
    return sum(d.getTime(), d.getTime() + elapsed);
  }
  const before = period === 'day' ? start - DAY : start - 7 * DAY;
  return sum(before, before + elapsed);
}

/** Zahl so schreiben, wie man sie vorlesen würde. */
export function fmtCount(n: number) {
  if (n >= 10) return Math.round(n).toLocaleString('de-DE');
  if (n >= 1) return n.toFixed(1).replace('.', ',');
  return n.toFixed(2).replace('.', ',');
}

export function fmtKg(g: number) {
  const kg = g / 1000;
  return kg >= 1000 ? `${(kg / 1000).toFixed(1).replace('.', ',')} t` : `${fmtCount(kg)} kg`;
}

export interface Comparison { icon: string; value: string; title: string; sub: string }

/**
 * Vergleiche für Menschen ohne Klimabilanz im Kopf. Jeder Vergleich nennt die
 * Rechengrundlage, damit niemand eine Zahl glauben muss.
 */
export function cityComparisons(i: Pick<CityImpact, 'co2_g' | 'food_g' | 'packaging'>): Comparison[] {
  const carKm = i.co2_g / FACTORS.car.g;
  return [
    { icon: '🚗', value: `${fmtCount(carKm / CITY_ASSUMPTIONS.crossCityKm)} Autofahrten`, title: 'quer durch Frankfurt', sub: `Höchst bis Bergen-Enkheim sind rund ${CITY_ASSUMPTIONS.crossCityKm} km · ${FACTORS.car.label}, ${FACTORS.car.source}` },
    { icon: '🍽️', value: `${fmtCount(i.food_g / CITY_ASSUMPTIONS.portionG)} Mahlzeiten`, title: 'aus geretteten Lebensmitteln', sub: `gerechnet mit ${CITY_ASSUMPTIONS.portionG} g je Portion (Schätzung)` },
    { icon: '☕', value: `${fmtCount(i.packaging)} Becher und Schalen`, title: 'nicht im Restmüll', sub: 'jede bestätigte Mehrweg-Rückgabe ist eine Einwegverpackung weniger' },
  ];
}
