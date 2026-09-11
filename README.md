# MainWandel – gemeinsame Integrationsdemo

Lokale, ausführbare Grundlage für die Frankfurt Impact Challenge. Branch: `codex/plattform-grundlagen`. Es handelt sich um eine **Integrationsdemo**, noch keine vollständige Android-/iOS-App. Öffentliche Partnerorte stammen aus geprüften API-Abrufen, Aktionsnachweise sind eigene Fixtures. Keine echten Gutscheine oder schreibenden Partnertransaktionen.

## Start

Im Projektordner unter PowerShell:

```powershell
.\START.ps1
```

Dann [lokale Demo öffnen](http://127.0.0.1:8765). Python 3.11+ genügt; das Startskript nutzt auf diesem Rechner die gebündelte Python-Laufzeit. Auf einem anderen Rechner Python installieren und bei fehlender Zeitzonendatenbank `python -m pip install -r requirements-dev.txt` ausführen.

```powershell
python -m shared.server
python -m unittest discover -s tests -v
python -m shared.demo
```

Frischer Zustand ohne Löschen alter Daten: Server mit Strg+C beenden, `./START.ps1 -Database .runtime/probe-02.sqlite` mit einem **neuen** Dateinamen starten. Gleicher Dateiname erhält Historie und Replay-Schutz. Alle Demodaten bleiben lokal in `.runtime/`. Der Server bindet nur `127.0.0.1`; nicht ins Internet freigeben. Er ist kein produktives Authentifizierungssystem.

## Arbeitsergebnisse und Grenzen

- [Aktueller Status und tatsächlich ausgeführte Tests](docs/STATUS_UND_TESTS.md)
- [Gesicherte Befunde, Scope, Stackvorschlag und Zeitplan](docs/ENTSCHEIDUNGEN.md)
- [Alle 422 Auftragspassagen und Prioritäten](docs/ANFORDERUNGEN.md), [maschinenlesbar](docs/anforderungen.json)
- [Architektur, Adapterverträge und sechs Modulübergaben](docs/VERTRAEGE.md)
- [Punkte, Missbrauchsschutz, Impact und Budget](docs/REWARDS_UND_WIRKUNG.md)
- [Nutzerabläufe, Gestaltung, Pitch und Pilot](docs/UX_UND_DEMO.md)

Die Modul-/Personenzuordnung fehlt noch. Deshalb wurden keine fremden Fachmodule implementiert. Native NFC-/GPS-Funktionen, vollständige Partneraktionen, private Adressfreigabe, echte Rewards, Freunde/Top 100 und Push sind offen beziehungsweise spezifiziert. **18 automatisierte Tests bestanden**; mobiler Browser wurde geprüft, echte Android-/iOS-Geräte noch nicht.

## Reproduzierbare Quellenprüfung

```powershell
python tools/inspect_sources.py
python tools/probe_partners.py
# Optional: eigener Team-Key wird ausschließlich serverseitig gelesen.
python tools/probe_partners.py --auth
```

Die Probe liest nur öffentliche Standorte und optional eigene Testnutzer/deren Historien. Keine Reservierungen, Ausleihen, Verifikationsänderungen oder Partnernachrichten. Ergebnisse ohne Schlüssel unter `docs/generated/`. Onlinezugang nötig; bei Netzfehler bleibt die Demo mit den vorhandenen Snapshots nutzbar.

Für die GTFS-Prüfung das geprüfte Archiv nach `.runtime/gtfs/` entpacken (`tar -xf "Mobilitätsdaten/GTFS_gefiltert_Frankfurt+30km.7z" -C .runtime/gtfs`) und `python tools/audit_gtfs.py` ausführen. Es werden nur kleine Aggregationsberichte ausgegeben, kein GTFS in den Client geladen.

**Korrektur des unten erhaltenen älteren Datenhandouts:** Der tatsächlich gelieferte EFA-Bestand hat 50 Zeilen und ist bytegleich mit der Originalsicherung. Die dort beschriebenen 5.699 Zeilen existieren in diesem Checkout nicht. `compose.yaml`, `database/` und der ältere Umsetzungsplan sind ebenfalls nicht vorhanden. Verbindlicher Iststand: [Datenprüfung](docs/generated/data-audit.json), [GTFS-Prüfung](docs/generated/gtfs-audit.json).

---

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
