# Mainsam – Frankfurt Impact Challenge (Team 01)

Mobile-first Prototyp (Expo / React Native, iOS + Android + Web) für die FES Hackathon 2026 Aufgabe.
Ein Chamäleon (Kai) führt durch fünf Bausteine: Ride2Impact (Transdev), Smart Mehrweg (Vytal),
Save2Share (Frankfurt foodsharing), Sauberes Frankfurt (FES), Mobilitätsimpact (traffiQ) + MainLastenrad.

## Starten

```bash
cd apps/mobile
npm install
npx expo start          # QR-Code mit Expo Go (iOS/Android) scannen – aktuelle Expo-Go-Version (SDK 57)
npx expo start --web    # Browser-Demo (Karte über Leaflet/OSM)
```

Bei Netzwerkproblemen mit Expo Go: `npx expo start --tunnel`.

## Was echt ist, was simuliert

| Baustein | Echt | Simuliert |
|---|---|---|
| Foodsharing | Live-API (Fairteiler, Körbe, Anfragen, Abholungen, Saver-Verifikation) | Verteilungen, Zusage des Anbieters (Demo-Timer) |
| Transdev | GTFS RMV (U/S/Tram), Abfahrten, Matching on-device mit Konfidenz | GPS-Testspuren (aus shapes.txt erzeugt), Demo-NFC-Tag in Expo Go |
| Vytal | Store-Suche (GraphQL, mit Snapshot-Fallback) | Ausleihe/Rückgabe-Bestätigung (Store-seitig) |
| traffiQ | CSVs aus dem Repo (Heatmap, Tagesgang, Auslastung, Relationen, Sharing) | – (Daten teils synthetisch, im UI markiert) |
| FES | Konzept + Flows (Peer-QR, Vorher/Nachher, Ticket) | Aktionen, Behälter, FES-Bestätigung |

NFC: `react-native-nfc-manager` ist eingebunden und wird in einem Dev-/Store-Build echt gelesen.
Expo Go hat kein NFC, dort läuft der Demo-Tag. QR-Codes funktionieren überall (expo-camera).

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
src/api/             foodsharing.ts, vytal.ts, nfc.ts, opportunities.ts (getOpportunities)
src/data/            transit.json (aus GTFS), traces.json, traffiQ-Aggregate, Snapshots, mock.ts
src/store/           zustand + AsyncStorage (Journal, Reservierungen, Behälter, Einstellungen)
src/components/      Chameleon, Map (native + web), WhySheet, AwardToast, ui
tools/               shot.py (Web-Screenshots), spa_server.py
```

Punkte- und Fairnessregeln: `../../konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md`.
Daten neu erzeugen: `python3 tools/prep_gtfs.py` (GTFS-7z vorher nach gtfs/ entpacken; braucht die CSVs aus Mobilitätsdaten/ und docs/generated/).
