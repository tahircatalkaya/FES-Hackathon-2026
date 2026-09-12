# Mainsam – Frankfurt Impact Challenge (Team 01)

Mobile-first Prototyp (Expo / React Native, iOS + Android + Web) für die FES Hackathon 2026 Aufgabe.
Ein Chamäleon (Kai) führt durch fünf Bausteine: Ride2Impact (Transdev), Smart Mehrweg (Vytal),
Save2Share (Frankfurt foodsharing), Sauberes Frankfurt (FES), Mobilitätsimpact (traffiQ) + MainLastenrad.

## Auf dem iPhone starten (privater Hotspot/LAN)

Voraussetzungen: Node 22 LTS oder neuer, npm und die aktuelle **Expo Go**-App mit Unterstützung für **SDK 57**. Dein Screenshot zeigt bereits SDK 57.

Den Mac mit dem persönlichen Hotspot des iPhones verbinden oder beide Geräte mit demselben privaten WLAN verbinden. Auf dem iPhone unter Einstellungen → Apps → Expo Go **Lokales Netzwerk** erlauben. Im Mac-Terminal:

```bash
cd "/Users/imad.azizi/Desktop/FES Hackathon 2026/team-01/apps/mobile"
npm install --include=optional
npm run start:lan
```

Der Startbefehl verwendet `expo start --go --lan --clear`. Scanne den **neuen** QR-Code mit der iPhone-Kamera und öffne ihn in Expo Go. Beim einmaligen Entwicklerhinweis auf **Continue** tippen. Terminal und Mac müssen während der Nutzung weiterlaufen.

Öffentliches WLAN kann direkte Verbindungen zwischen Geräten blockieren. Ein Handy-Hotspot löst außerdem keinen App-Absturz. Deshalb wurde zusätzlich die native Startanimation korrigiert.

Optional ist `npm run start:phone` für einen öffentlichen Expo/ngrok-Tunnel vorhanden. Der Befehl prüft und repariert eine fehlende ngrok-Programmdatei. Ein Tunnel benötigt Internet auf beiden Geräten und muss erst **Tunnel ready** melden. Beim Test war der Tunnel wegen eines Verbindungs-Timeouts nicht verfügbar; für diese Demo bleibt es wie gewünscht beim privaten Hotspot/LAN.

### Fehler eindeutig unterscheiden

| Symptom | Was tun? |
|---|---|
| Chamäleon erscheint, dann schließt Expo Go | Native Animation korrigiert: `shade()` ist jetzt ein Worklet. App vollständig schließen und den neuen QR-Code scannen. Die Versionen der nativen Module passen zu SDK 57. |
| `file argument … null` beim Tunnelstart | Fehlendes ngrok-Binärpaket. `npm run start:phone` repariert es; falls weiterhin fehlerhaft: `npm ci --include=optional` im App-Ordner. |
| `ngrok tunnel took too long to connect` | Tunnel wurde nicht erstellt. Noch keinen alten QR-Code scannen. Internetzugang/Captive Portal prüfen; Mac über Handy-Hotspot verbinden und Start erneut ausführen. |
| Tunnel nicht verfügbar, beide Geräte im selben privaten Netz | `npm run start:lan`. iPhone: Einstellungen → Apps → Expo Go → Lokales Netzwerk erlauben. Mac muss eingehende Verbindungen für Node erlauben. |
| Schwarzer Bildschirm hinter dem Expo-Hinweis | Erst Continue tippen. Schließt die App danach weiter: das ist ein separater Laufzeitfehler, nicht der Hinweis selbst. |
| Browseraufnahme über `http://192.168…` | Browser-Mikrofon benötigt HTTPS oder localhost. Für die Handy-Demo Expo Go verwenden. |
| Roter/blauer Fehlerscreen | Fehlermeldung prüfen; der Render-ErrorBoundary kann keine nativen Prozessabstürze abfangen. |

Browser auf dem Mac: `npm run web`. Paketprüfung: `npx expo install --check`.

`react-native-reanimated`, `react-native-worklets`, `react-native-svg`, `react-native-webview` und
AsyncStorage sind passend zu Expo Go gepinnt. Nicht unabhängig vom Expo SDK aktualisieren.

## Foto, Mikrofon und Google-KI

**Aufnehmen benötigt kein Google-Abo.** Behoben wurden der falsche `AudioRecorder`-Konstruktor und der Wettlauf zwischen langem Drücken, Berechtigungsdialog und Stoppen. Die App nutzt jetzt den offiziellen `useAudioRecorder`-Hook mit Start-/Stopp-Taste, Aufnahmedauer, Berechtigungsprüfung und maximal 60 Sekunden. Native Aufnahmen werden als M4A gelesen; Safari kann MP4, andere Browser WebM verwenden. Zurück/Schließen beendet eine laufende Aufnahme.

iPhone: **Einstellungen → Apps → Expo Go → Mikrofon** einschalten. In eigenen Builds setzt das `expo-audio`-Plugin die Mikrofonberechtigung; Konfigurationsänderungen an Berechtigungen erfordern dort einen neuen Build.

Der vorhandene Google-Schlüssel bleibt in `.env`. **Nicht mit `.env.example` überschreiben.** Google hat für diesen Zugang `gemini-2.5-flash` mit HTTP 404 abgewiesen. Der Standard ist deshalb jetzt `gemini-3.6-flash`; dessen Endpunkt wurde mit dem vorhandenen Schlüssel geprüft. Optional überschreibbar mit `EXPO_PUBLIC_GEMINI_MODEL`. Nach `.env`-Änderungen Expo neu starten.

Google AI Pro bietet Vorteile in Gemini und AI Studio, ist aber kein pauschales unbegrenztes API-Kontingent für diese App. Entscheidend sind das Projekt und dessen API-Limits in [AI Studio](https://aistudio.google.com/apikey). Ein 429 bedeutet ausgeschöpftes Kontingent, 403 einen Schlüssel-/Berechtigungsfehler, 404 ein nicht verfügbares Modell; 503 kann vorübergehende Überlastung sein. Die App zeigt diese Fälle verständlich an und lässt die manuelle Eingabe offen. Eine Anfrage läuft maximal 45 Sekunden.

Kostenlose Optionen:

- Aufnahme, Kamera und selbst eintragen funktionieren ohne bezahlte KI.
- Im Eingabefeld das **Mikrofon der Handy-Tastatur** nutzen: Diktieren ohne API-Schlüssel für Mainsam, danach Menge/Kategorie bestätigen.
- **Gemini API Free Tier** für Bild und Audio, innerhalb der im eigenen Projekt verfügbaren Limits. Google AI Pro ist dafür keine Voraussetzung. Keine Bezahlabrechnung aktivieren, wenn die Nutzung strikt kostenlos bleiben soll. [Aktuelle Preise und Free Tier](https://ai.google.dev/gemini-api/docs/pricing).

KI-Ergebnisse immer prüfen: Auch eine erfolgreiche Transkription kann Lebensmittel verwechseln. Im Funktionstest wurde beispielsweise „Äpfel“ als „Brezeln“ verstanden. Posten lassen sich entfernen und neu eintragen.

Weitere Quellen: [Expo Audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/), [Expo Tunnel](https://docs.expo.dev/more/expo-cli/#tunneling), [Google Audioformate](https://ai.google.dev/gemini-api/docs/audio), [Google AI Pro und AI Studio](https://blog.google/innovation-and-ai/technology/developers-tools/google-one-ai-studio/).

Die Demo verwendet weiterhin öffentliche Client-Umgebungsvariablen für KI-Schlüssel. Vor einer Veröffentlichung gehört die KI-Anbindung auf einen Server; bei einem offenen Entwicklungs-Tunnel nur den benötigten Testzeitraum laufen lassen.

## Bestätigte Foodsharing-Übergaben

Neu: Profil → **Übergaben & Zuverlässigkeit**. Ein lokaler Server speichert getrennte Konten, echte Zusagen, kurz gültige Übergabecodes und Bewertungen. Kamera und Audio bleiben zur Erfassung erhalten. Punkte erst nach Bestätigung beider Personen; keine automatischen Zusagen oder Selbst-Freigaben mehr.

Im App-Ordner zuerst `npm run trust:lan`, dann in einem zweiten Terminal `npm run start:lan`. Beide Geräte müssen dasselbe private Netz nutzen. Jede Person legt einen eigenen Zugang an. Der Treffpunkt erscheint nur nach Zusage, kurz vor dem Termin. [Ablauf, Tests und Grenzen](../trust-server/README.md).

Offene Regal-Meldungen ohne Gegenüber bleiben Eigenangaben ohne Punkte und bestätigten Impact. Alte Foodsharing-Gutschriften aus Selbstbestätigungen werden entsprechend gekennzeichnet. Für echte Prämieneinlösung ist zusätzlich ein serverseitiges Prämiensystem nötig; der lokale Dienst ist kein öffentlicher Produktionsbetrieb.

## Partner

Profil → **Partner** zeigt FES, foodsharing, Vytal, Transdev und traffiQ sowie Main-Lastenrad als Initiative aus der Region. Jede Karte öffnet die offizielle Website. Das foodsharing-Original-Logo liegt lokal unter `assets/partners/foodsharing.png` und erscheint auch im Essen-Filter sowie in Fairteiler-, Korb-, Verteilungs- und Saver-Kopfzeilen. Quelle: [offizielle Presse-Mediendatenbank](https://foodsharing.de/content?sub=presse).

## Gezielte Prüfungen

```bash
npm run typecheck
node tools/check-ai.cjs
npx expo export --platform ios --platform android --platform web
# Optional: kleine echte API-Anfragen mit dem vorhandenen Schlüssel
node tools/check-ai.cjs --live
```

Die automatisierten Adaptertests prüfen Upload/MIME, leere Dateien, API-Limits, fehlende Berechtigungen, nicht verfügbare Modelle und Verbindungsfehler. Ein Export ersetzt keinen Test des physischen iPhone-Mikrofons.

## Was echt ist, was simuliert

| Baustein | Echt | Simuliert |
|---|---|---|
| Foodsharing | Fairteiler/Korb-API, Bild-/Spracherkennung, eigener Übergaben-Server mit Zusagen, Codes und Bewertungen | Historische Verteilungsbeispiele; keine automatische Zusage und keine Punkte für Selbstbestätigungen |
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
