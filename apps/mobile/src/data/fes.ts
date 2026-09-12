/** Tages-Challenges für das Mülleimer-Bingo. Ein Feld je Kalendertag, 16 Felder im Umlauf. */
export interface BingoChallenge { icon: string; title: string; short: string }

export const BINGO: BingoChallenge[] = [
  { icon: '🧴', title: 'Plastikflasche aufheben', short: 'Flasche' },
  { icon: '🚬', title: 'Zigarettenkippe einsammeln', short: 'Kippe' },
  { icon: '🥫', title: 'Dose entsorgen', short: 'Dose' },
  { icon: '🛍️', title: 'Plastiktüte aufheben', short: 'Tüte' },
  { icon: '🍾', title: 'Glasflasche einsammeln', short: 'Glas' },
  { icon: '☕', title: 'Kaffeebecher wegräumen', short: 'Kaffee' },
  { icon: '📦', title: 'Karton vom Gehweg räumen', short: 'Karton' },
  { icon: '📰', title: 'Zeitung oder Werbung aufheben', short: 'Papier' },
  { icon: '🍕', title: 'Pizzakarton entsorgen', short: 'Pizza' },
  { icon: '🥤', title: 'Trinkbecher aufheben', short: 'Becher' },
  { icon: '🍫', title: 'Schokoriegel-Papier aufheben', short: 'Riegel' },
  { icon: '🧃', title: 'Saftpäckchen entsorgen', short: 'Saft' },
  { icon: '🔋', title: 'Batterie richtig entsorgen', short: 'Batterie' },
  { icon: '🍌', title: 'Bananenschale in die Biotonne', short: 'Banane' },
  { icon: '🧾', title: 'Kassenbon aufheben', short: 'Bon' },
  { icon: '🌿', title: 'Grünabfall richtig entsorgen', short: 'Grünes' },
];

/** Tag → Feld. Über den Tag im Jahr, damit jeder Kalendertag genau ein Feld trifft. */
export function bingoIndexFor(d = new Date()) {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day - start) / 86400000) % BINGO.length;
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fehlwürfe, die die Bilderkennung in der Biotonne vorschlägt. Vorschlag, kein Beweis. */
export const BIN_FINDINGS = [
  { label: 'Plastiktüte', hint: 'Bioabfall lose oder in Papiertüten einwerfen.' },
  { label: 'Joghurtbecher', hint: 'Verpackungen gehören in die gelbe Tonne.' },
  { label: 'Glasflasche', hint: 'Glas gehört in den Altglascontainer.' },
  { label: 'Kaffeekapsel', hint: 'Kapseln sind Verpackung, kein Bioabfall.' },
  { label: 'Kunststoffnetz', hint: 'Obstnetze zählen als Verpackung.' },
];

/** Vorlagen für eigene Aktionen: Auswahl statt Freitext. */
export const ACTION_TYPES = [
  { icon: '🧹', title: 'Clean-up', short: 'Clean-up' },
  { icon: '🚬', title: 'Kippen-Sammelrunde', short: 'Kippen' },
  { icon: '🌳', title: 'Parkputz', short: 'Park' },
  { icon: '🚲', title: 'Uferweg-Aktion', short: 'Uferweg' },
  { icon: '📣', title: 'Aufklärungsstand', short: 'Aufklärung' },
  { icon: '♻️', title: 'Mülltrennungs-Aktion', short: 'Trennen' },
];

export const MEETING_POINTS: Record<string, string[]> = {
  Bockenheim: ['Kurfürstenplatz', 'Rothschildpark', 'Bockenheimer Warte'],
  Nordend: ['Günthersburgpark', 'Friedberger Platz', 'Bethmannpark'],
  Sachsenhausen: ['Schaumainkai', 'Südbahnhof', 'Textorpark'],
  Bornheim: ['Berger Straße', 'Bornheim Mitte', 'Günthersburgpark'],
  Ostend: ['Danziger Platz', 'Hafenpark', 'Zoo'],
  Gallus: ['Güterplatz', 'Rebstockpark', 'Galluspark'],
  Höchst: ['Höchster Altstadt', 'Bolongaropalast', 'Mainufer Höchst'],
};

export function meetingPointsFor(district: string) {
  return MEETING_POINTS[district] ?? ['Marktplatz', 'Hauptstraße', 'Park'];
}

/** Terminvorschläge: nächste 14 Tage, 08:00 bis 20:00 in halben Stunden. */
export function dayOptions(now = new Date()) {
  const names = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i + 1);
    return { label: i === 0 ? 'Morgen' : `${names[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.`, date: d };
  });
}

export function timeOptions() {
  const out: string[] = [];
  for (let m = 8 * 60; m <= 20 * 60; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return out;
}
