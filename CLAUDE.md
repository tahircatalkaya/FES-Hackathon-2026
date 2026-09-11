# Team 01 — Frankfurt Impact Challenge (FES Hackathon 2026)

Diese Datei wird von Claude Code in diesem Repo automatisch geladen. Sie gilt für
jede Session, jeden Branch, jede Person.

## Was wir bauen

**Mainsam** — eine mobile-first App, die nachhaltige Angebote in Frankfurt bündelt:
entdecken, Aktion bewusst auslösen, Nachweis prüfen, Wirkung verstehen, fair belohnen.
Maskottchen ist ein Chamäleon, das den Kontext einfärbt und die Punktelogik erklärt.

## Bewertungskriterien der Jury (jede Änderung muss auf mindestens eines einzahlen)

1. Nutzerwert und Verständlichkeit der Journey
2. Qualität der Datenintegration und Plausibilität des Nachweises
3. Fairness, Datenschutz und Schutz vor Fehlanreizen
4. Nachvollziehbarkeit der Impact- und Reward-Logik
5. Qualität des lauffähigen Prototyps

Veranstalter-Ansage: "Nicht alles bauen. Den Kern erlebbar machen."
Pitch: Samstag 16:00, 10 min + 5 min Fragen.

## Nicht verhandelbar

- **Punkte und Impact sind getrennt.** Impact = Physik (kg CO2e, kg Lebensmittel).
  Punkte = gestaltete Verhaltenswährung, gedeckelt, degressiv, nie proportional zur Menge.
- **Punkte für die Entscheidung, nie für die Strecke oder die Menge.**
- **Keine Rangliste als Hauptmotor.** Kooperative Ziele, Fortschritt zur eigenen Vorwoche.
  Belohnungen über Schwellen und Lose, nie über Platzierung.
- **Nachweisstatus als sichtbarer Multiplikator:** bestätigt 1,0 / plausibel 0,7 /
  schwach plausibel 0,4 / selbst angegeben 0,3 / nicht zuordenbar 0,0.
- **Jede Punktgutschrift hat ein "Warum"-Sheet** mit Status, Formel, Faktor, Quelle.
- **Kein NFC-Fundament.** Es gibt keine Tags in Frankfurter Bussen. OEPNV-Nachweis
  läuft über GPS gegen GTFS mit Konfidenz.
- **Keine Punkte pro Müllstück.** Siehe Skill `fes-impact-rules`.
- **Kein Feature ohne Mock-Fallback.** Fällt eine API im Pitch aus, zeigt der Screen trotzdem etwas.
- **Keine erfundenen API-Felder.** Nur dokumentierte Felder aus `Foodsharing API/SCHEMA.md`.
- **Keine Zahl ohne Quelle oder ohne Label `Schätzung` / `Demo-Daten`.**

Vollständiges Modell: `konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md`.
Review und Entscheidungen: `konzept/00-REVIEW-UND-ENTSCHEIDUNGEN.md`.

## Wo der Code liegt

`apps/mobile/` ist die App (Expo/React Native, expo-router). Start: `cd apps/mobile && npm install && npx expo start`.
README und Demo-Skript liegen dort (`README.md`, `DEMO.md`). Web-Screenshots: `python3 tools/shot.py <route> <name>` nach `npx expo export --platform web`.

## Architektur

- Expo / React Native / TypeScript. Ein Stand für iOS und Android.
- Zwei zentrale Schnittstellen, in Stunde 1 eingefroren, danach nur additiv ändern:
  - `getOpportunities({lat, lon, radius}) -> Opportunity[]`
    mit `{id, source, type, title, distance_m, availability, verification_level, payload}`
  - `award(event: ActionEvent) -> {points, impact, status, reason[], idempotency_key}`
    Einzige Stelle im Code, die Punkte vergibt. Keine Ausnahme.
- Alle Strings in `locales/{de,en,tr,ar,de-leicht}.json`. Kein hartkodierter Text im JSX.
- Karte: react-native-maps. State: zustand. Backend optional, SQLite reicht.

## Arbeitsweise

- Jede Person hat einen Branch, kleine Commits, häufig auf `main` mergen.
- Nach Stunde 20 keine grossen Merges mehr.
- Vor jedem PR: laufen die beiden Kernflows (Ride2Impact, Save2Share) noch?

## Datenquellen im Repo

- `Mobilitätsdaten/GTFS_gefiltert_Frankfurt+30km.7z` — Fahrplan, 100.483 Fahrten
- `Mobilitätsdaten/haltestellen_avg.csv`, `tagesgang_avg.csv`, `BeispielAFZ.csv`,
  `BeispielDataSetEFA.csv`, `e-scooter-beispiel.csv` — teilweise synthetisch
- `Foodsharing API/` — Live-API, Key in `KEYS.txt`
- Vytal: externe Notion-Doku, sonst Mocks
