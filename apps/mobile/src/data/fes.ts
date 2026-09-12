/** Tages-Challenges für das Mülleimer-Bingo. Ein Feld je Kalendertag, 16 Felder im Umlauf. */
export interface BingoChallenge { icon: string; title: string; short: string }

export const BINGO: BingoChallenge[] = [
  { icon: '🧴', title: 'Plastikflasche aufheben', short: 'Flasche' },
  { icon: '🥫', title: 'Dose entsorgen', short: 'Dose' },
  { icon: '🛍️', title: 'Plastiktüte aufheben', short: 'Tüte' },
  { icon: '🥡', title: 'Fast-Food-Verpackung wegräumen', short: 'Verpackung' },
  { icon: '📦', title: 'Karton vom Gehweg räumen', short: 'Karton' },
  { icon: '📰', title: 'Zeitung oder Werbung aufheben', short: 'Papier' },
  { icon: '🃏', title: 'Joker: was auch immer herumliegt', short: 'Joker' },
  { icon: '🥤', title: 'Trinkbecher aufheben', short: 'Becher' },
  { icon: '🍫', title: 'Schokoriegel-Papier aufheben', short: 'Riegel' },
  { icon: '🧃', title: 'Saftpäckchen entsorgen', short: 'Saft' },
  { icon: '♻️', title: 'Pfandflasche in den Pfandring stellen', short: 'Pfandring' },
  { icon: '🍬', title: 'Bonbon- oder Kaugummipapier aufheben', short: 'Bonbon' },
  { icon: '🥢', title: 'Einwegbesteck oder Strohhalm aufheben', short: 'Besteck' },
  { icon: '🐕', title: 'Hundebeutel richtig entsorgen', short: 'Beutel' },
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

/**
 * Kurze Fakten und Alltagstipps nach einer Gutschrift.
 * `topic` passt den Tipp zum Bereich: clean (FES), food (Foodsharing), cup (Mehrweg).
 * Ohne topic passt der Tipp überall.
 */
export const FUN_FACTS: { icon: string; label: string; text: string; source?: string; topic?: 'clean' | 'food' | 'cup' | 'ride' }[] = [
  { icon: '🚬', label: 'Wusstest du?', text: 'Eine Kippe belastet bis zu 40 Liter Wasser.', source: 'Umweltbundesamt', topic: 'clean' },
  { icon: '🌱', label: 'Tipp', text: 'Bioabfall in Papier wickeln, nie in Plastik.', topic: 'clean' },
  { icon: '🍕', label: 'Trenn-Tipp', text: 'Pizzakarton: Deckel ins Altpapier, fettiger Boden in den Restmüll.', topic: 'clean' },
  { icon: '🧾', label: 'Wusstest du?', text: 'Kassenbons sind Thermopapier und gehören in den Restmüll.', topic: 'clean' },
  { icon: '🔋', label: 'Tipp', text: 'Batterien nimmt jeder Laden zurück, der welche verkauft.', topic: 'clean' },
  { icon: '🍾', label: 'Trenn-Tipp', text: 'Blaues Glas kommt zum Grünglas.', topic: 'clean' },
  { icon: '🛋️', label: 'Wusstest du?', text: 'Sperrmüll nur nach Anmeldung rausstellen, sonst ist es illegal.', topic: 'clean' },
  { icon: '🕖', label: 'Tipp', text: 'Altglas erst ab 7 Uhr einwerfen.', topic: 'clean' },
  { icon: '🗑️', label: 'Wusstest du?', text: 'Viele Frankfurter Mülleimer haben oben einen Ascher.', topic: 'clean' },
  { icon: '🍂', label: 'Tipp', text: 'Laub vom Gully kehren hilft bei Starkregen.', topic: 'clean' },
  { icon: '📦', label: 'Tipp', text: 'Kartons flach falten, dann passt dreimal so viel rein.' },
  { icon: '🍞', label: 'Tipp', text: 'Brot hält in Papier oder Stoff länger frisch als in Plastik.', topic: 'food' },
  { icon: '📅', label: 'Wusstest du?', text: 'Mindesthaltbarkeit ist kein Wegwerfdatum: schauen, riechen, probieren.', topic: 'food' },
  { icon: '🍎', label: 'Tipp', text: 'Äpfel getrennt lagern, sie lassen anderes Obst schneller reifen.', topic: 'food' },
  { icon: '🥡', label: 'Tipp', text: 'Ein Fach im Kühlschrank für „muss weg“ spart die meisten Reste.', topic: 'food' },
  { icon: '🥬', label: 'Wusstest du?', text: 'Kräuter halten länger, wenn sie im Wasserglas stehen.', topic: 'food' },
  { icon: '☕', label: 'Tipp', text: 'Eigener Becher statt To-go. Viele Cafés füllen ihn direkt.', topic: 'cup' },
  { icon: '🍽️', label: 'Wusstest du?', text: 'Größere Gastrobetriebe müssen Mehrweg zur Wahl anbieten.', source: 'Verpackungsgesetz', topic: 'cup' },
  { icon: '⏱️', label: 'Tipp', text: 'Schale früh zurückbringen, dann ist sie schneller wieder im Umlauf.', topic: 'cup' },
  { icon: '🎒', label: 'Tipp', text: 'Falt-Box in der Tasche: Reste vom Essen gehen nicht in Einweg.', topic: 'cup' },
  { icon: '🚋', label: 'Wusstest du?', text: 'Eine Bahnfahrt spart gegenüber dem Auto rund zwei Drittel CO₂ je Kilometer.', source: 'UBA-Richtwerte', topic: 'ride' },
  { icon: '🚲', label: 'Tipp', text: 'Unter 2 km ist das Rad meist schneller als Auto plus Parkplatzsuche.', topic: 'ride' },
  { icon: '🎫', label: 'Tipp', text: 'Deutschlandticket gilt im ganzen RMV, auch für spontane Umwege.', topic: 'ride' },
  { icon: '🚏', label: 'Wusstest du?', text: 'Umsteigen zählt als eine Fahrt, solange du in der Verbindung bleibst.', topic: 'ride' },
];
