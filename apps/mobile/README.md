# Mainsam – Frankfurt Impact Challenge (Team 01)

Mobile-first Prototyp (Expo / React Native, iOS + Android + Web) für die FES Hackathon 2026 Aufgabe.
Ein Chamäleon (Kai) führt durch fünf Bausteine: Ride2Impact (Transdev), Smart Mehrweg (Vytal),
Save2Share (Frankfurt foodsharing), Sauberes Frankfurt (FES), Mobilitätsimpact (traffiQ) + MainLastenrad.

## Schnellstart

Voraussetzungen: Node 20 oder neuer, npm, ein Handy mit **Expo Go** (App Store / Play Store) und ein kostenloses Expo-Konto von [expo.dev](https://expo.dev/signup).

```bash
git clone <repo-url>
cd team-01/apps/mobile
npm install
npx expo login          # einmalig, mit dem Expo-Konto
npx expo start
```

Danach den QR-Code scannen: iPhone mit der normalen Kamera-App, Android mit dem Scanner in Expo Go.

**Wichtig:** In Expo Go muss dasselbe Konto eingeloggt sein wie im Terminal. Sonst bleibt die App bei "Opening project" hängen oder verlangt einen Login.

Browser-Demo ohne Handy:

```bash
npx expo start --web
```

### Erstes Öffnen in Expo Go

Beim ersten Start zeigt Expo Go einmalig ein Entwicklermenü ("This is the developer menu"). Einfach auf **Continue** tippen. Danach lädt Mainsam mit dem Onboarding.

## Wenn es nicht startet

| Symptom | Ursache | Lösung |
|---|---|---|
| "Opening project" lädt ewig, Handy findet den Rechner nicht | Uni-, Gäste- oder Firmen-WLAN trennt Geräte voneinander (Client Isolation) | Handy-Hotspot aufmachen, Rechner damit verbinden, `npx expo start` neu starten |
| Expo Go verlangt einen Login | Konto im Terminal und in Expo Go stimmen nicht überein | `npx expo login` auf dem Rechner, in Expo Go dasselbe Konto |
| App startet kurz und schließt sich sofort wieder | Native Paketversionen passen nicht zu der Version, die Expo Go fest eingebaut hat | `rm -rf node_modules && npm install && npx expo start -c`. Versionen in `package.json` bitte **nicht** eigenmächtig hochziehen |
| Roter oder blauer Fehlerscreen | JS-Fehler | Meldung lesen, sie zeigt Datei und Zeile. Der ErrorBoundary in `app/_layout.tsx` fängt das ab, statt die App zu schließen |
| Karte bleibt leer | Kein Netz auf dem Handy | Karte lädt OpenStreetMap-Kacheln über Leaflet, ein Kartenschlüssel ist **nicht** nötig |
| Änderungen kommen nicht an | Metro-Cache | `npx expo start -c` |

Prüfen, ob alle Versionen zum SDK passen:

```bash
npx expo-doctor
```

### Versionen bewusst gepinnt

`react-native-reanimated`, `react-native-worklets`, `react-native-svg`, `react-native-webview` und
`@react-native-async-storage/async-storage` stehen ohne `^` in der `package.json`. Expo Go bringt diese
Module nativ in genau einer Version mit. Zieht npm eine neuere JS-Version, stürzt die App beim Start
kommentarlos ab. Also bitte so lassen, solange wir mit Expo Go demonstrieren.

## Bild- und Spracherkennung (Foodsharing)

Beim Fairteiler gibt es drei Aktionen (Abholen, Einstellen, Regal melden) und jeweils drei Wege:
Foto, Sprachnotiz oder selbst eintragen. Foto und Sprachnotiz werden von einer echten KI ausgewertet,
das Ergebnis ist immer editierbar. Dafür braucht die App einen Schlüssel:

```bash
cp .env.example .env      # dann EXPO_PUBLIC_GEMINI_KEY eintragen (kostenlos: https://aistudio.google.com/apikey)
npx expo start -c         # Schlüssel wird beim Bundlen eingesetzt, deshalb neu starten
```

Alternativ `EXPO_PUBLIC_OPENAI_KEY` (Vision + Whisper). Ohne Schlüssel bleibt alles bedienbar:
Foto und Sprachnotiz werden als Nachweis gespeichert, den Inhalt trägt man dann selbst ein.
Es wird nichts vorgetäuscht. Der Schlüssel liegt für den Hackathon im Client, für einen Store-Build
gehört er hinter einen kleinen Server.

## Was echt ist, was simuliert

| Baustein | Echt | Simuliert |
|---|---|---|
| Foodsharing | Live-API (Fairteiler, Körbe, Anfragen, Abholungen, Saver-Verifikation), Bild- und Spracherkennung mit Schlüssel | Verteilungen, Zusage des Anbieters (Demo-Timer) |
| Transdev | GTFS RMV (U/S/Tram), Abfahrten, Matching on-device mit Konfidenz | GPS-Testspuren (aus shapes.txt erzeugt), Demo-NFC-Tag in Expo Go |
| Vytal | Store-Suche (GraphQL, mit Snapshot-Fallback) | Ausleihe/Rückgabe-Bestätigung (Store-seitig) |
| traffiQ | CSVs aus dem Repo (Heatmap, Tagesgang, Auslastung, Relationen, Sharing) | Daten teils synthetisch |
| FES | Konzept + Flows (Peer-QR, Vorher/Nachher, Ticket) | Aktionen, Behälter, FES-Bestätigung |

NFC: `react-native-nfc-manager` ist eingebunden und wird in einem Dev- oder Store-Build echt gelesen.
Expo Go hat kein NFC, dort läuft automatisch der Demo-Tag, der Ablauf im UI ist identisch.
QR-Codes funktionieren überall (expo-camera).

## Demo-Ablauf für den Pitch

Siehe `DEMO.md`. Kurzfassung: Onboarding, Scan-Knopf in der Tab-Leiste, NFC-Tap-in für eine Fahrt,
Fairteiler mit Foto-Erkennung, Mehrweg-Rückgabe, Impact-Seite mit Chamäleon und Frankfurt-Ziel.

## Struktur

```
app/                 Screens (expo-router)
  (tabs)/            Entdecken · Handeln · Impact · Gemeinsam · Profil
  fahrt.tsx          Ride2Impact: Haltestelle → Abfahrten → Tracking → Matching → Ergebnis
  mehrweg.tsx        Vytal-Kreislauf
  fairteiler/, korb/, verteilung/, saver.tsx   Foodsharing
  cleanup/, melden.tsx, quiz/, scan.tsx        FES
  belohnungen, journal, daten                  Rewards, Nachvollziehbarkeit, Transparenz
src/engine/          reward.ts (einzige Punktvergabe), impact.ts (Faktoren), matching.ts (GTFS-Abgleich)
src/api/             foodsharing.ts, vytal.ts, nfc.ts, route.ts, opportunities.ts
src/data/            transit.json (aus GTFS), traces.json, traffiQ-Aggregate, Snapshots, mock.ts
src/store/           zustand + AsyncStorage (Journal, Reservierungen, Behälter, Einstellungen)
src/components/      Chameleon, Map (native + web), WhySheet, AwardToast, AiSheets, ui
tools/               shot.py (Web-Screenshots), spa_server.py, flows.py, prep_gtfs.py
```

Punkte- und Fairnessregeln: `../../konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md`.
Daten neu erzeugen: `python3 tools/prep_gtfs.py` (GTFS-7z vorher nach `gtfs/` entpacken, braucht die CSVs aus `Mobilitätsdaten/` und `docs/generated/`).

## Prüfen vor dem Pitch

```bash
npx tsc --noEmit                 # Typen
npx expo export --platform web   # Build muss durchlaufen
python3 tools/flows.py           # Klick-Durchläufe, meldet Laufzeitfehler
```
