# Team 01 – Frankfurt Impact Challenge (FES Hackathon 2026)

**Mainsam** ist unsere App: eine Anwendung für Frankfurt, die nachhaltiges Verhalten sichtbar macht und belohnt.
Ein Chamäleon (Kai) führt durch Bus und Bahn (Transdev/traffiQ), Mehrweg (Vytal), Lebensmittelrettung
(foodsharing) und Sauberkeit (FES). Der lauffähige Code liegt in **`apps/mobile/`**.

## App starten

Mit aktueller Expo Go-App (SDK 57) auf dem Handy und Node 22 LTS oder neuer auf dem Mac:

```bash
cd apps/mobile
npm install --include=optional
npm run start:lan
```

Den Mac mit dem persönlichen Hotspot des iPhones oder beide Geräte mit demselben privaten WLAN verbinden. In den iPhone-Einstellungen für Expo Go **Lokales Netzwerk** erlauben. Den neuen QR-Code mit der iPhone-Kamera scannen und in Expo Go öffnen. Den einmaligen Entwicklerhinweis mit **Continue** schließen. Das Terminal bleibt geöffnet. Öffentliches WLAN kann Verbindungen zwischen Geräten blockieren.

Die [App-Anleitung](apps/mobile/README.md) erklärt Startfehler, Mikrofonrechte, Google Free Tier und die neuen Partnerkarten. Den vorhandenen Schlüssel in `apps/mobile/.env` nicht überschreiben. Die nativen Paketversionen sind passend zu Expo Go gepinnt.

## Wo was liegt

| Ordner | Inhalt |
| --- | --- |
| `apps/mobile/` | Die App (Expo / React Native, iOS + Android + Web). Eigene README mit Details |
| `konzept/` | Review und Entscheidungen, Master-Prompt, Punktemodell und Anti-Fehlanreiz-Regeln |
| `docs/` | Status, Verträge, Anforderungen, Quellenprüfungen der Vorarbeit |
| `Foodsharing API/`, `Mobilitätsdaten/` | Partnerdokumentation und Rohdaten des Veranstalters |
| `shared/`, `tests/`, `tools/`, `START.ps1` | Ältere Python-Integrationsdemo der Vorarbeit, nicht die App |

Die Punkte- und Fairnessregeln stehen in [`konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md`](konzept/02-PUNKTE-UND-ANTI-FEHLANREIZ.md).
Arbeitsregeln für das Repo und die Bewertungskriterien der Jury stehen in [`CLAUDE.md`](CLAUDE.md).

## Ältere Integrationsdemo (Python)

Aus der Vorarbeit liegt zusätzlich eine lokale Python-Demo im Repo. Sie ist **nicht** die App und wird für den
Pitch nicht gebraucht. Start unter PowerShell mit `.\START.ps1`, danach <http://127.0.0.1:8765>.
Details und Grenzen: [Status und Tests](docs/STATUS_UND_TESTS.md), [Entscheidungen](docs/ENTSCHEIDUNGEN.md),
[Anforderungen](docs/ANFORDERUNGEN.md), [Verträge](docs/VERTRAEGE.md), [Rewards und Wirkung](docs/REWARDS_UND_WIRKUNG.md),
[UX und Demo](docs/UX_UND_DEMO.md).


# Daten und API-Dokumentationen für den Hackathon

Dieses Repository bündelt die Beispieldaten des Verkehrsverbunds und die Dokumentation der Foodsharing Hackathon API. Die Dokumentation zur Vytal API ist extern verlinkt.

## Foodsharing Hackathon API

Die API stellt Teamnutzer, Essenskörbe, Abholanfragen, Abholhistorien und Fairteiler-Standorte bereit. Nutzer, Angebote und Abholungen sind fiktive Testdaten; die Standortdaten beziehen sich auf Frankfurt am Main.

| Dokumentation | Inhalt |
| --- | --- |
| [API-Guide](Foodsharing%20API/API-GUIDE.md) | Einstieg, Authentifizierung mit Team-Key, Nutzerauswahl, Verifikation, Endpunkte, Aufrufbeispiele und Fehlerfälle |
| [Verfügbare Daten](Foodsharing%20API/DATABASE.md) | Übersicht der Datenbestände, persönlichen Abholhistorien, gemeinsamen Beispieldaten und Sichtbarkeit zwischen Teams |
| [API-Datenobjekte](Foodsharing%20API/SCHEMA.md) | JSON-Felder, Datentypen und Beziehungen der Requests und Antworten |
| [Testnutzer pro Team](Foodsharing%20API/TEAM-USERS.md) | Verwendung der zwei Testnutzer eines Teams sowie Auswahl und Bearbeitung ihrer Testzustände |

Die Basis-URL lautet `https://app-foodsharing-hackathon.azurewebsites.net`. Die interaktive API-Referenz ist über [Swagger](https://app-foodsharing-hackathon.azurewebsites.net/docs) erreichbar, die maschinenlesbare Spezifikation über [OpenAPI](https://app-foodsharing-hackathon.azurewebsites.net/openapi.json). Geschützte Endpunkte verwenden den von der Organisation vergebenen Team-Key; Details stehen im API-Guide.

## Vytal API

Die externe Integrationsdokumentation findet ihr im [Vytal x FES Hackathon – Technical Documentation](https://app.notion.com/p/vytal-col/Vytal-x-FES-Hackathon-Technical-Documentation-57622b6fddc3821ba7a00156eb4aa4ee).

## Beispieldaten des Verkehrsverbunds

Dieses Repository enthält fünf CSV-Arbeitsdateien und einen GTFS-Fahrplan als 7z-Archiv. Zusätzlich liegt der gesicherte EFA-Originalbestand unter `docs/`. Die Daten beschreiben Fahrgastzählungen, Fahrpläne, Auskunftsanfragen und die Nutzung von Sharing-Angeboten.

Die [Datendokumentation](Mobilitätsdaten/docs/DATENKATALOG.md) beschreibt Inhalt, Spalten, Dateiformate, Zeiträume, Herkunft und bekannte Einschränkungen. Die Verknüpfung der Daten, die Bewertung des Impacts und die Verifikation der Verkehrsmittelnutzung sind Aufgaben der Teilnehmer.

### Herkunft und Einordnung

Nach der mitgelieferten Information des Verkehrsverbunds wurden Beispieldaten sowie Haltestellen- und Tagesverlaufsdaten zum Kalibrieren bereitgestellt. Der beigefügte GTFS-Fahrplan soll die Rekonstruktion der Fahrtwege aus den AFZ-Daten ermöglichen. Für die E-Scooter-Daten nennt der Verkehrsverbund eine Größenordnung von **etwa 30.000 Nutzungen pro Tag**.

Diese Größenordnung ist eine Begleitinformation zum Gesamtbestand. Sie wurde nicht aus dem Testdatensatz ermittelt. Die Datei `e-scooter-beispiel.csv` enthält die 20 gelieferten Fahrrad-Zeilen von `nextbike` sowie 6.720 synthetische Ergänzungen für Bikesharing und E-Scooter. Die Ergänzungen sind an `provider_name=synthetic_bikesharing` bzw. `synthetic_e_scooter` erkennbar. Diese Namen bezeichnen fiktive Simulationsanbieter. Herkunft und Annahmen stehen im [Datenkatalog](Mobilitätsdaten/docs/DATENKATALOG.md#6-e-scooter-beispielcsv).

### Dateien im Überblick

Zeilenzahlen beziehen sich auf Datensätze ohne Kopfzeile. Prüfstand: **10.09.2026**, anhand der vorliegenden Dateien.

| Datei | Umfang | Inhalt und zeitlicher Bezug |
| --- | ---: | --- |
| [BeispielAFZ.csv](Mobilitätsdaten/BeispielAFZ.csv) | 1.042 Zeilen, 21 Spalten | Vier originale U7-Fahrten am 30.04.2024 sowie 48 synthetische Fahrten auf U1–U6, U8 und U9 am 15.09.2025 |
| [BeispielDataSetEFA.csv](Mobilitätsdaten/BeispielDataSetEFA.csv) | 5.699 Zeilen, 15 Spalten | Ausschließlich Frankfurt: 27 Originalzeilen vom 30.04./01.05.2024 und 5.672 synthetische Anfragen am 15.09.2025; je Stunde exakt 1 % von `tagesgang_avg.csv` im synthetischen Teil |
| [haltestellen_avg.csv](Mobilitätsdaten/haltestellen_avg.csv) | 3.093 Zeilen, 4 Spalten | Durchschnittliche monatliche Anfragen je Haltestelle, teilweise mit Koordinaten |
| [tagesgang_avg.csv](Mobilitätsdaten/tagesgang_avg.csv) | 24 Zeilen, 2 Spalten | Durchschnittliche tägliche Anfragen nach Stunde 0–23 |
| [e-scooter-beispiel.csv](Mobilitätsdaten/e-scooter-beispiel.csv) | 6.740 Zeilen, 9 Spalten | 20 Originalzeilen und je 3.360 synthetische Fahrrad-/E-Scooter-Zeilen; fünf Standorte, vier Radien, sieben simulierte Tage ab 07.04.2025 |
| [GTFS_gefiltert_Frankfurt+30km.7z](Mobilitätsdaten/GTFS_gefiltert_Frankfurt+30km.7z) | 8 Tabellen; 100.483 Fahrten | Fahrplan mit Kalenderdaten vom 12.07. bis 13.12.2025 und Geometrien |

Die Begleitdatei [AFZ_HERKUNFT.json](Mobilitätsdaten/docs/AFZ_HERKUNFT.json) dokumentiert die Herkunft der AFZ-Daten: Original- und Simulationsbestand, ihre CSV-Zeilenbereiche, Zeitbezüge und Prüfsummen.

Für EFA dokumentiert [EFA_HERKUNFT.json](Mobilitätsdaten/docs/EFA_HERKUNFT.json) den Frankfurt-Filter, die Herkunft der Haltestellen, Stundenmengen und Simulationsannahmen. Alle 50 gelieferten Originalzeilen bleiben in [BeispielDataSetEFA_original.csv](Mobilitätsdaten/docs/BeispielDataSetEFA_original.csv) erhalten; 23 davon enthalten Orte außerhalb Frankfurts und sind deshalb nicht in der Arbeitsdatei enthalten. Details stehen im [EFA-Datenkatalog](Mobilitätsdaten/docs/DATENKATALOG.md#3-beispieldatasetefacsv).

### Einordnung der Daten

- Die Dateien beziehen sich auf unterschiedliche Zeiträume. Der GTFS-Fahrplan umfasst Juli bis Dezember 2025; die Originalbeispiele stammen teilweise aus April 2024 bzw. April 2025.
- Die ergänzten AFZ-, EFA- und Sharing-Werte sind synthetische Testdaten und keine gemessene Nachfrage. Herkunft und Kennzeichnung sind im Datenkatalog beschrieben.
- Auskunftsanfragen, Fahrgastzählwerte und Sharing-Starts/-Enden sind unterschiedliche Messgrößen. Die Bezugszeiträume der Durchschnittsdateien sind nicht dokumentiert.
- Die Verkehrsdaten enthalten keine Handy-GPS-Spuren, keine bestätigten individuellen Verkehrsmittelnutzungen und keine Emissionsfaktoren für den Vergleich von ÖPNV und PKW.

Die gelieferten Originalzeilen sind erhalten, bei EFA zusätzlich in der separaten Originalsicherung. Die AFZ- und Sharing-Dateien wurden um synthetische Beispiele ergänzt. Die EFA-Arbeitsdatei wurde auf Frankfurt eingeschränkt und ebenfalls synthetisch ergänzt; Haltestellenmittelwerte, Tagesgang und GTFS-Archiv sind unverändert.
