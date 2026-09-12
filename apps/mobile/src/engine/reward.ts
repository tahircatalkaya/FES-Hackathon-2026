import type { ActionEvent, ActionType, Award, VerificationStatus } from './types';
import { emptyImpact, impactFor } from './impact.ts';

/** Basispunkte je Aktion (vor Multiplikator). Siehe konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md */
export const BASE: Record<ActionType, number> = {
  'ride.transit': 20,
  'ride.active': 10,
  'ride.sharing_feeder': 10,
  'ride.scooter_short': 0,
  'ride.correction': 5,
  'reuse.return': 30,
  'reuse.return_fast': 10,
  'food.stock': 40,
  'food.report': 15,
  'food.offer': 25,
  'food.distribute': 60,
  'food.pickup': 15,
  'food.pickup_for_other': 15,
  'food.reservation_kept': 5,
  'clean.participate': 60,
  'clean.organize': 100,
  'clean.report': 25,
  'clean.bin_checkin': 5,
  'clean.quiz': 5,
  'clean.litter_solo': 0,
  'rhythm.weekly_goal': 50,
  'rhythm.four_weeks': 100,
};

/** Tagesdeckel je Aktion (Anzahl gewerteter Aktionen). */
export const DAILY_COUNT_CAP: Partial<Record<ActionType, number>> = {
  'ride.transit': 2,
  'ride.active': 2,
  'ride.sharing_feeder': 1,
  'ride.correction': 3,
  'clean.bin_checkin': 3,
  'clean.quiz': 3,
  'food.report': 4,
  'food.pickup': 2,
};

/** Kategorie für die Degression (1., 2., 3. Aktion am Tag) */
export const CATEGORY: Record<ActionType, string> = Object.fromEntries(
  (Object.keys(BASE) as ActionType[]).map((k) => [k, k.split('.')[0]]),
) as Record<ActionType, string>;

export const MULTIPLIER: Record<VerificationStatus, number> = {
  bestätigt: 1.0,
  plausibel: 0.7,
  'schwach plausibel': 0.4,
  'selbst angegeben': 0.3,
  'nicht zuordenbar': 0,
  ausstehend: 0,
};

export const DEGRESSION = [1, 0.6, 0.3, 0];
export const DAILY_POINT_CAP = 150;

export const WHY_BASE: Record<ActionType, string> = {
  'ride.transit': 'Bewusst gestartete ÖPNV-Fahrt. Punkte gibt es für die Entscheidung, nicht für die Strecke.',
  'ride.active': 'Weg über 1 km zu Fuß oder mit dem Rad statt mit dem Auto.',
  'ride.sharing_feeder': 'Sharing-Fahrt als Zubringer zur Haltestelle, ersetzt eine Autofahrt.',
  'ride.scooter_short': 'Kurze E-Scooter-Fahrt ersetzt meistens Gehen, deshalb keine Punkte. Wir zeigen das ehrlich.',
  'ride.correction': 'Du hast eine falsche Zuordnung korrigiert. Das macht die Daten für alle besser.',
  'reuse.return': 'Bestätigte Mehrweg-Rückgabe. Zurückbringen ist die Leistung, nicht Ausleihen.',
  'reuse.return_fast': 'Rückgabe innerhalb von 48 Stunden. Schneller Umlauf, mehr Nutzung je Behälter.',
  'food.stock': 'Du hast Lebensmittel eingestellt und damit ein Angebot für andere geschaffen.',
  'food.report': 'Regal-Status gemeldet. Andere fahren nicht umsonst hin.',
  'food.offer': 'Korb angeboten. Lebensmittel bleiben im Kreislauf.',
  'food.distribute': 'Verteilung als Saver durchgeführt. Ehrenamtliche Arbeit mit dem höchsten Gemeinnutzen.',
  'food.pickup': 'Lebensmittel abgeholt, bevor sie weggeworfen werden. Zweimal am Tag gewertet, damit für alle etwas übrig bleibt.',
  'food.pickup_for_other': 'Abholung für eine andere Person, per QR bestätigt.',
  'food.reservation_kept': 'Reservierung eingehalten. Verlässlichkeit hilft allen.',
  'clean.participate': 'Teilnahme an einer angemeldeten Clean-up-Aktion, Anwesenheit gegenseitig bestätigt.',
  'clean.organize': 'Clean-up organisiert. FES hat die Sackabholung bestätigt.',
  'clean.report': 'Meldung, die zu einem FES-Ticket geführt hat. Erste Meldung je Ort in 72 h.',
  'clean.bin_checkin': 'Entsorgung an einem registrierten FES-Behälter.',
  'clean.quiz': 'Lernmodul abgeschlossen. Wissen über Vermeidung und richtige Entsorgung.',
  'clean.litter_solo': 'Ein einzelnes Müllstück gibt keine Punkte, weil das nicht prüfbar ist. Danke trotzdem, das Chamäleon freut sich.',
  'rhythm.weekly_goal': 'Wochenziel erreicht: drei aktive Tage von sieben.',
  'rhythm.four_weeks': 'Vier Wochen in Folge das Wochenziel erreicht.',
};

export interface LedgerLike {
  key: string;
  type: ActionType;
  at: number;
  points: number;
}

function sameDay(a: number, b: number) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/**
 * Einzige Stelle, die Punkte vergibt.
 * Idempotent über `event.key`, mit Multiplikator, Degression, Zähl- und Punktedeckel.
 */
export function award(event: ActionEvent, ledger: LedgerLike[], authority?: { verifiedFood: true }): Award {
  // A photo, GPS reading, API self-report or caller-supplied status is not a handover.
  // Only the authenticated server calls this with authority after both parties finish.
  if (event.type.startsWith('food.') && !authority?.verifiedFood) {
    return {
      ...event, status: 'ausstehend', base: BASE[event.type], multiplier: 0, degression: 0,
      capped: 0, points: 0, impact: emptyImpact(), duplicate: ledger.some(l => l.key === event.key),
      reasons: ['Erfassung gespeichert. Foto und Audio beschreiben Lebensmittel, beweisen aber keine Übergabe.', 'Ohne beidseitig bestätigte Übergabe keine Punkte und kein bestätigter Impact.'],
      formula: 'Nachweis ausstehend → 0 Punkte',
    };
  }
  const reasons: string[] = [];
  const impact = impactFor(event);
  const base = BASE[event.type];
  const mult = MULTIPLIER[event.status];

  const dup = ledger.find((l) => l.key === event.key);
  if (dup) {
    return {
      key: event.key, type: event.type, partner: event.partner, title: event.title, at: event.at, status: event.status,
      base, multiplier: mult, degression: 0, capped: 0, points: 0, impact,
      reasons: ['Dieses Ereignis wurde bereits gewertet (gleicher Schlüssel). Keine Doppelbelohnung.'],
      formula: `Schlüssel ${event.key} bereits im Journal`, duplicate: true, meta: event.meta,
    };
  }

  reasons.push(WHY_BASE[event.type]);
  if (event.meta?.evidence?.length) reasons.push(...event.meta.evidence);
  reasons.push(`Nachweis: ${event.status} → Multiplikator ×${mult.toFixed(1)}`);

  const todays = ledger.filter((l) => sameDay(l.at, event.at));
  const sameCat = todays.filter((l) => CATEGORY[l.type] === CATEGORY[event.type] && l.points > 0);
  const nth = sameCat.length; // 0-basiert
  const deg = DEGRESSION[Math.min(nth, DEGRESSION.length - 1)];
  if (nth > 0) reasons.push(`${nth + 1}. Aktion in der Kategorie „${CATEGORY[event.type]}“ heute → ${Math.round(deg * 100)} % der Basispunkte`);

  const cap = DAILY_COUNT_CAP[event.type];
  const sameType = todays.filter((l) => l.type === event.type).length;
  let countCapped = false;
  if (cap !== undefined && sameType >= cap) {
    countCapped = true;
    reasons.push(`Tagesdeckel für diese Aktion erreicht (${cap}×). Impact zählt weiter voll.`);
  }

  let points = countCapped ? 0 : Math.round(base * mult * deg);
  const todayPoints = todays.reduce((s, l) => s + l.points, 0);
  let capped = 0;
  if (todayPoints + points > DAILY_POINT_CAP) {
    capped = todayPoints + points - DAILY_POINT_CAP;
    points = Math.max(0, DAILY_POINT_CAP - todayPoints);
    reasons.push(`Harter Tagesdeckel von ${DAILY_POINT_CAP} Punkten: ${capped} Punkte verfallen. Gewohnheit schlägt Farmen.`);
  }
  if (base === 0) reasons.push('Basispunkte 0. Anerkennung ja, Punkte nein.');

  const formula = `${base} × ${mult.toFixed(1)} × ${deg} = ${Math.round(base * mult * deg)}${countCapped ? ' → 0 (Zähldeckel)' : ''}${capped ? ` → ${points} (Tagesdeckel)` : ''}`;

  return {
    key: event.key, type: event.type, partner: event.partner, title: event.title, at: event.at, status: event.status,
    base, multiplier: mult, degression: deg, capped, points, impact, reasons, formula, meta: event.meta,
  };
}

export function statusFromConfidence(c: number): VerificationStatus {
  if (c >= 0.8) return 'plausibel';
  if (c >= 0.5) return 'schwach plausibel';
  return 'nicht zuordenbar';
}
