export interface Cleanup {
  id: string; title: string; lat: number; lon: number; district: string; start: number; end: number; organizer: string;
  participants: number; radiusM: number; material: string; fesConfirmed: boolean; description: string;
}

const today = new Date(); today.setSeconds(0, 0);
const at = (dayOffset: number, h: number, m = 0) => { const d = new Date(today); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0); return d.getTime(); };

export const CLEANUPS: Cleanup[] = [
  { id: 'cu1', title: 'Mainufer-Sammelaktion Sachsenhausen', lat: 50.1049, lon: 8.6867, district: 'Sachsenhausen', start: at(0, 10), end: at(0, 23), organizer: 'Nachbarschaft Schweizer Platz', participants: 14, radiusM: 400, material: 'Zangen & Säcke von FES vor Ort', fesConfirmed: false, description: 'Uferweg zwischen Eisernem Steg und Friedensbrücke. FES holt die Säcke um 13:30 ab.' },
  { id: 'cu2', title: 'Günthersburgpark Clean-up', lat: 50.1276, lon: 8.7010, district: 'Nordend', start: at(1, 15), end: at(1, 17), organizer: 'Grüne Lunge e.V.', participants: 22, radiusM: 350, material: 'Handschuhe, Zangen, 30 Säcke', fesConfirmed: false, description: 'Rund um den Spielplatz und die Liegewiese.' },
  { id: 'cu3', title: 'Bockenheimer Warte Nachtschicht', lat: 50.1206, lon: 8.6506, district: 'Bockenheim', start: at(2, 19), end: at(2, 21), organizer: 'Uni-Campus-Gruppe', participants: 9, radiusM: 300, material: 'FES-Material am Infopoint', fesConfirmed: false, description: 'Nach dem Wochenmarkt. Treffpunkt am Bockenheimer Warte-Turm.' },
  { id: 'cu0', title: 'Hafenpark Frühjahrsputz', lat: 50.1083, lon: 8.7078, district: 'Ostend', start: at(-6, 10), end: at(-6, 12), organizer: 'Skatepark-Crew', participants: 31, radiusM: 350, material: 'FES', fesConfirmed: true, description: '38 Säcke, von FES bestätigt.' },
];

export interface Bin { id: string; lat: number; lon: number; kind: 'Papierkorb' | 'Glascontainer' | 'Altkleider' | 'Pfandring'; label: string }
export const BINS: Bin[] = [
  { id: 'bin-0421', lat: 50.1136, lon: 8.6789, kind: 'Papierkorb', label: 'Hauptwache Nord' },
  { id: 'bin-0422', lat: 50.1151, lon: 8.6835, kind: 'Pfandring', label: 'Zeil / Brockhausbrunnen' },
  { id: 'gl-0087', lat: 50.1188, lon: 8.6540, kind: 'Glascontainer', label: 'Leipziger Straße' },
  { id: 'ak-0031', lat: 50.1071, lon: 8.6892, kind: 'Altkleider', label: 'Schweizer Platz' },
  { id: 'bin-0980', lat: 50.1262, lon: 8.6994, kind: 'Papierkorb', label: 'Günthersburgpark Eingang' },
];

export const LASTENRAD = [
  { id: 'lr1', name: 'Lastenrad „Bocke“', lat: 50.1233, lon: 8.6489, station: 'Bockenheim, Leipziger Str.', free: true, next: 'heute ab 16:00' },
  { id: 'lr2', name: 'Lastenrad „Sachsi“', lat: 50.1033, lon: 8.6939, station: 'Sachsenhausen, Textorstr.', free: false, next: 'morgen 09:00' },
  { id: 'lr3', name: 'Lastenrad „Nordi“', lat: 50.1258, lon: 8.6902, station: 'Nordend, Oeder Weg', free: true, next: 'jetzt' },
];

export interface QuizChapter { id: string; title: string; ctx: 'clean' | 'mobility' | 'food' | 'reuse'; intro: string; questions: { q: string; options: string[]; answer: number; why: string }[] }
export const CHAPTERS: QuizChapter[] = [
  {
    id: 'q1', title: 'Kapitel 1: Wohin damit?', ctx: 'clean',
    intro: 'Kai steht vor drei Tonnen und hat einen Pizzakarton in der Hand. Fettig. Hilfst du ihm?',
    questions: [
      { q: 'Fettiger Pizzakarton, wohin?', options: ['Altpapier', 'Restmüll', 'Biotonne'], answer: 1, why: 'Stark verschmutzte Pappe stört das Recycling. Saubere Kartonteile dürfen ins Altpapier.' },
      { q: 'Kaffeebecher to go mit Kunststoffbeschichtung?', options: ['Altpapier', 'Gelbe Tonne', 'Restmüll'], answer: 2, why: 'Verbundmaterial, in Frankfurt Restmüll. Besser: Mehrwegbecher.' },
      { q: 'Zigarettenkippe auf dem Gehweg vergiftet wie viel Wasser?', options: ['1 Liter', '40 Liter', '1000 Liter'], answer: 1, why: 'Eine Kippe kann rund 40 Liter Grundwasser belasten. Deshalb die Taschenaschenbecher.' },
    ],
  },
  {
    id: 'q2', title: 'Kapitel 2: Der Weg zur Arbeit', ctx: 'mobility',
    intro: 'Kai vergleicht drei Wege von Bockenheim zur Hauptwache. Das Auto steht vor der Tür.',
    questions: [
      { q: 'Wie viel CO₂ spart die U-Bahn gegenüber dem Auto je Kilometer, ungefähr?', options: ['ca. 10 g', 'ca. 100 g', 'ca. 1 kg'], answer: 1, why: 'Pkw ca. 150 g, U-Bahn ca. 55 g je Personenkilometer (UBA-Richtwerte).' },
      { q: 'Ersetzt ein E-Scooter für 800 m meistens…', options: ['eine Autofahrt', 'einen Fußweg', 'eine Bahnfahrt'], answer: 1, why: 'Kurze Scooter-Fahrten ersetzen meist Gehen. Deshalb gibt es dafür in Mainsam keine Punkte.' },
    ],
  },
  {
    id: 'q3', title: 'Kapitel 3: Der Fairteiler', ctx: 'food',
    intro: 'Vor dem Fairteiler an der Ada-Kantine steht ein Karton mit Brot. Kai hat Hunger, aber auch Nachbarn.',
    questions: [
      { q: 'Was darf nicht in einen Fairteiler?', options: ['Backwaren vom Vortag', 'Rohes Hackfleisch', 'Ungeöffnete Konserven'], answer: 1, why: 'Rohes Fleisch, rohes Ei und Alkohol sind ausgeschlossen. Hygiene schützt alle.' },
      { q: 'Warum gibt es fürs Abholen keine Punkte?', options: ['Weil Abholen nichts bringt', 'Weil Essen bereits die Belohnung ist', 'Weil die App das nicht kann'], answer: 1, why: 'Punkte fürs Nehmen würden Hamstern belohnen. Der Impact zählt trotzdem voll.' },
    ],
  },
  {
    id: 'q4', title: 'Kapitel 4: Die Schale', ctx: 'reuse',
    intro: 'Kai bestellt Nudeln. Einweg oder Vytal-Schale?',
    questions: [
      { q: 'Nach wie vielen Nutzungen ist eine Mehrwegschale ökologisch besser als Einweg (Größenordnung)?', options: ['nach 2–3', 'nach 10–20', 'nach 500'], answer: 1, why: 'Je nach Material und Spülung im Bereich von 10 bis 20 Umläufen. Deshalb belohnen wir das Zurückbringen.' },
    ],
  },
];

export interface Reward { id: string; title: string; cost: number; partner: string; emoji: string; desc: string }
export const REWARDS: Reward[] = [
  { id: 'r1', title: 'Gratis-Ausleihe Vytal', cost: 200, partner: 'Vytal', emoji: '🥡', desc: 'Eine Ausleihe ohne Pfandhinterlegung bei allen Partnern.' },
  { id: 'r6', title: 'Spende: 1 Baum für Frankfurt', cost: 300, partner: 'Grünflächenamt', emoji: '🌳', desc: 'Deine Punkte werden zu einem echten Baum. Nimmt Horte-Druck raus.' },
  { id: 'r2', title: 'Kaffee im Mehrwegbecher', cost: 350, partner: 'Partnercafé', emoji: '☕', desc: 'Ein Heißgetränk bei einem teilnehmenden Café.' },
  { id: 'r3', title: 'Kinoticket', cost: 500, partner: 'Kino im Cinema', emoji: '🎬', desc: 'Ein Ticket für eine Vorstellung deiner Wahl.' },
  { id: 'r5', title: 'Lastenrad-Tag', cost: 600, partner: 'MainLastenrad', emoji: '🚲', desc: 'Ein Tag mit einem Lastenrad deiner Wahl.' },
  { id: 'r4', title: 'Tageskarte RMV', cost: 800, partner: 'traffiQ', emoji: '🚊', desc: 'Eine Tageskarte für Frankfurt.' },
  { id: 'r7', title: 'Sportstudio für einen Monat', cost: 1200, partner: 'Partnerstudios Frankfurt', emoji: '🏋️', desc: 'Vier Wochen Mitgliedschaft in einem teilnehmenden Studio. Etwa zwei Wochen aktiver Nutzung.' },
  { id: 'r8', title: 'Deutschlandticket für einen Monat', cost: 2000, partner: 'RMV · traffiQ', emoji: '🎫', desc: 'Ein Monat im ganzen Nahverkehr. Realistisch nach etwa vier Wochen mit erreichtem Wochenziel.' },
  { id: 'r9', title: 'Palmengarten-Jahreskarte', cost: 2500, partner: 'Palmengarten', emoji: '🌴', desc: 'Ein Jahr freier Eintritt, auch im Winter im Tropicarium.' },
  { id: 'r10', title: 'Heimspiel-Ticket', cost: 3000, partner: 'Eintracht Frankfurt', emoji: '🦅', desc: 'Ein Platz im Stadion bei einem Heimspiel der Saison.' },
  { id: 'r11', title: 'Blick hinter die Kulissen der FES', cost: 4000, partner: 'FES', emoji: '🚛', desc: 'Führung durch die Anlagen und eine Frühschicht auf dem Sammelfahrzeug mitfahren.' },
  { id: 'r12', title: 'Baumpatenschaft mit Plakette', cost: 6000, partner: 'Grünflächenamt', emoji: '🪧', desc: 'Ein Baum in deinem Stadtteil, mit deinem Namen am Stamm. Mehrere Monate Arbeit.' },
  { id: 'r13', title: 'Deutschlandticket für ein Jahr', cost: 10000, partner: 'RMV · traffiQ', emoji: '🏆', desc: 'Zwölf Monate Nahverkehr. Das größte Ziel der App, zu schaffen in etwa einem halben Jahr.' },
];

export const DISTRICTS = [
  { name: 'Bockenheim', pop: 41000, thisWeek: 1420, lastWeek: 1180 },
  { name: 'Sachsenhausen', pop: 59000, thisWeek: 1810, lastWeek: 1795 },
  { name: 'Nordend', pop: 56000, thisWeek: 2210, lastWeek: 1930 },
  { name: 'Bornheim', pop: 30000, thisWeek: 990, lastWeek: 860 },
  { name: 'Gallus', pop: 43000, thisWeek: 760, lastWeek: 540 },
  { name: 'Höchst', pop: 15000, thisWeek: 310, lastWeek: 290 },
  { name: 'Ostend', pop: 30000, thisWeek: 870, lastWeek: 910 },
  { name: 'Innenstadt', pop: 7000, thisWeek: 640, lastWeek: 610 },
];

export const FRANKFURT_GOAL = { weekTargetKg: 12000, weekSoFarKg: 8460, participants: 4120 };

export const SAVER_DISTRIBUTIONS = [
  { id: 'd1', saver: 'Marek T.', badge: 'Foodsaver seit 2023', lat: 50.1268, lon: 8.6919, district: 'Nordend', start: at(0, 18), end: at(0, 19), items: [{ n: 'Laugenstangen', q: '2 Tüten' }, { n: 'Joghurt 500 g', q: '6×' }, { n: 'Bananen', q: 'ca. 3 kg' }], slots: 12, taken: 5, source: 'REWE Oeder Weg' },
  { id: 'd2', saver: 'Sonja A.', badge: 'Foodsaver seit 2021', lat: 50.1042, lon: 8.6951, district: 'Sachsenhausen', start: at(0, 19, 30), end: at(0, 20, 30), items: [{ n: 'Salatköpfe', q: '10' }, { n: 'Brot', q: '4 Laibe' }], slots: 8, taken: 8, source: 'Bäckerei Schweizer Str.' },
  { id: 'd3', saver: 'Hanna R.', badge: 'Foodsaver seit 2024', lat: 50.1214, lon: 8.6538, district: 'Bockenheim', start: at(1, 12), end: at(1, 13), items: [{ n: 'Gemüse gemischt', q: '3 Kisten' }, { n: 'Äpfel', q: '5 kg' }], slots: 12, taken: 2, source: 'Wochenmarkt Bockenheimer Warte' },
];
