# Mainsam-App

Expo / React Native mit Expo Router für iOS, Android und Web. [Projektübersicht](../../README.md), [Demo-Ablauf](DEMO.md), [Serververträge](../trust-server/README.md).

## Starten

Node **22.18+**, npm und Expo Go mit Unterstützung für **SDK 57** werden benötigt. Vom Repository aus:

```bash
cd apps/mobile
npm ci --include=optional
npm run dev:lan
```

`dev:lan` startet Trust-Server und Expo unter derselben privaten LAN-Adresse. Rechner und Handy bleiben im selben WLAN/Hotspot. Den neuen QR-Code in Expo Go öffnen; unter iOS den Zugriff auf das lokale Netzwerk erlauben. Ctrl+C beendet beide Prozesse. Nach einem Netzwerkwechsel oder einer Serveränderung neu starten.

Weitere Startmöglichkeiten im App-Verzeichnis:

| Befehl | Zweck |
| --- | --- |
| `npm run web` | Expo im Browser; für gemeinsame Daten zusätzlich `npm run trust:start` |
| `npm run trust:start` | Server nur auf localhost:8787 |
| `npm run trust:lan` | Server im privaten LAN |
| `npm run start:lan` | Expo separat im privaten LAN |
| `npm run start:phone` | Optionaler öffentlicher Expo/ngrok-Tunnel mit Vorprüfung |

Ein Expo-Tunnel macht den privaten Trust-Server nicht automatisch erreichbar. `EXPO_PUBLIC_TRUST_URL` setzt bei Bedarf eine eigene Serveradresse; veröffentlichte Builds benötigen einen HTTPS-Endpunkt. Lokale Konten und Belege bleiben in `../trust-server/data/trust.sqlite`. Die Datenbank zum Neustarten nicht löschen.

## Einrichtung und Fehlerhilfe

Nach dem Tutorial gibt es einen gemeinsamen Zugang mit Benutzername, E-Mail und Passwort oder „Ohne Anmeldung weiter“. Innerhalb von Foodsharing und Mehrweg wird dieselbe Sitzung verwendet. Alte Konten funktionieren weiterhin mit Benutzername und Passwort. QR-Formate und Gastmodus: [Technische Referenz](../../docs/README.md).

Kamera und Mikrofon in den Geräte-Einstellungen für Expo Go erlauben. Im Browser braucht das Mikrofon HTTPS oder localhost. Audio wird über die Start-/Stopp-Taste höchstens 60 Sekunden aufgenommen; Schließen beendet die Aufnahme. Manuelle Lebensmittelangaben funktionieren ohne KI-Schlüssel.

Für KI-Erfassung die benötigten Variablen aus [.env.example](.env.example) in eine lokale `.env` übernehmen und Expo neu starten. Eine vorhandene `.env` erhalten. Schlüssel werden in diesem Prototyp als öffentliche Client-Variablen eingebunden; für öffentlichen Betrieb gehört die KI-Anbindung auf einen Server. Modellnamen sind in `src/api/ai.ts` voreingestellt und teilweise per Umgebung überschreibbar.

| Symptom | Prüfung |
| --- | --- |
| App öffnet sich, gemeinsame Übergaben laden nicht | Server auf Port 8787, gemeinsames Netz, lokale Netzwerkfreigabe und Firewall prüfen; `dev:lan` neu starten |
| Netzwerkfehler beim Speichern | Zuerst neu laden und den Stand prüfen: die Aktion könnte bereits gespeichert sein. Schreibanfragen werden nicht automatisch wiederholt. |
| Netzwerkfehler beim Lesen | Die App versucht einmal erneut und erhält die Sitzung. „Erneut verbinden“ prüft die tatsächliche Serverantwort. |
| `file argument … null` beim Tunnelstart | `start:phone` prüft das ngrok-Binärpaket; bei Bedarf `npm ci --include=optional` |
| `ngrok tunnel took too long to connect` | Tunnel nicht bereit; Internet/Captive Portal prüfen oder den gemeinsamen LAN-Start verwenden |
| Schwarzer Bildschirm hinter Expo-Hinweis | Einmal „Continue“ wählen; bleibt der Fehler, die konkrete Laufzeitmeldung prüfen |
| KI meldet 403 / 404 / 429 / 503 | Schlüssel/Berechtigung / Modell / Kontingent / vorübergehende Verfügbarkeit prüfen; manuelle Eingabe bleibt möglich |

Native Modulversionen sind im Lockfile abgestimmt. Mit `npx expo install --check` prüfen; native Pakete gemeinsam mit dem Expo SDK aktualisieren.

## Prüfen

```bash
npm run check
npx expo export --platform ios --platform android --platform web
```

`check` kombiniert Typprüfung mit sämtlichen Node-Tests. Für gezielte Prüfungen:

| Befehl | Abdeckung |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm test` | Alle automatisierten Node-Tests, einschließlich Netzwerk, Geometrie und LAN-Auswahl |
| `npm run trust:test` | Rollen, Privatsphäre, Bestand, Termine, Belege, Punkte und Persistenz |
| `npm run test:session` | Sitzungswechsel, Gastzugang und verzögerte Netzwerkantworten |
| `npm run test:proofs` | Fotozeitfenster, Standort, Dubletten und ungültige Nachweise |
| `npm run test:i18n` | Vollständige Übersetzungen und Platzhalter |
| `node tools/check-ai.cjs` | KI-Adapter mit simulierten Uploads und Fehlerantworten |

Tests verwenden isolierte Datenbanken und synthetische Konten. Nur `node tools/check-ai.cjs --live` sendet ausdrücklich echte KI-Anfragen mit dem lokal eingerichteten Schlüssel. Ein Export ersetzt keine Kamera-, Mikrofon-, NFC- oder GPS-Prüfung auf einem Handy. Web-Klickabläufe: `python tools/flows.py` nach Web-Export und Start des lokalen Vorschau-Servers; Einzelbilder: `tools/shot.py`.

## Code und Daten

| Bereich | Inhalt |
| --- | --- |
| `app/` | Routen und Screens; Tabs: Entdecken, Handeln, Impact, Gemeinsam, Profil |
| `src/components/`, `src/hooks/` | Gemeinsame UI, QR-Kamera, Fokus-Aktualisierung und Standortzugriff |
| `src/engine/` | Zentrale Punktvergabe, Impact, GTFS-Matching, Entfernungen und Fotonachweise |
| `src/api/` | Partner-, KI- und Trust-Adapter; Netzwerkfehler und Sitzungen |
| `src/store/` | Zustand, lokale Persistenz und Anzeigecache der Serverbelege |
| `src/data/` | GTFS-Aggregate, Verkehrsdaten, Snapshots und gekennzeichnete Beispiele |
| [src/i18n](src/i18n/README.md) | Deutsch, Englisch, Türkisch, Arabisch, Kroatisch und Italienisch |
| `tools/` | Entwicklung, Adaptertests, Datenaufbereitung und Web-Prüfungen |

Verkehrsplanung neu erzeugen: `python tools/prep_planning.py`. GTFS-Aggregate: `python tools/prep_gtfs.py`; das GTFS-Archiv vorher nach `gtfs/` entpacken. Herkunft und Einschränkungen der Verkehrsdaten: [Datenkatalog](../../Mobilitätsdaten/docs/DATENKATALOG.md).

## Nachweise und Grenzen

Foodsharing-Übergaben, Mehrwegbelege und FES-Teilnahmen verwenden den lokalen Trust-Server. Der Anbieter zeigt den Übergabecode; die abholende Person bestätigt den Empfang. Regalaufkleber und Eigenmeldungen geben keine bestätigten Punkte. Gäste erhalten keine einlösbaren Punkte. Die Nutzeroberfläche bietet Mehrweg-Ausleihe und Schadens-/Verlustmeldung; Rückgabe und Regalbetreuung sind nur noch über geschützte bestehende Serverendpunkte unterstützt.

GPS-/Foto- und Peer-Nachweise prüfen Plausibilität und Wiederverwendung, ersetzen aber keine externe Partnerbestätigung. Die Vytal-Händler-API ist nicht angebunden. GTFS-Testspuren, historische Angebote und Teile der Verkehrs-/Aktionsdaten sind Beispiele oder Simulationen. NFC liest im unterstützten eigenen Build echte Tags; Expo Go verwendet den Demo-Tag. Einzelheiten zu Rollen, Punkten, Migrationen und Datenhaltung stehen in der [Serveranleitung](../trust-server/README.md) und im [Punktemodell](../../konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md).
