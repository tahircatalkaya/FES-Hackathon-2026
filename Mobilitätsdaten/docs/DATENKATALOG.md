# Beschreibung der Verkehrsdaten

[Zur Übersicht](../ReadME.md)

Stand: **10.09.2026**. Diese Dokumentation beschreibt die bereitgestellten Dateien, ihre Felder, Herkunft und bekannten Einschränkungen. Die fachlichen Bedeutungen beruhen auf der Begleitinformation des Verkehrsverbunds sowie auf Spaltennamen und Dateiinhalten. Nicht bestätigte Bedeutungen sind entsprechend gekennzeichnet; ein vollständiges Datenwörterbuch des Verkehrsverbunds liegt nicht vor.

Zeilenzahlen zählen Datensätze ohne Kopfzeile. Bei CSV-Zeilennummern ist die Kopfzeile Zeile 1. Identifikatoren sind Textwerte; leere Felder bezeichnen fehlende Angaben.

## 1. Dateiformate

| Datei | Datensätze | Spalten | Trennzeichen | Zeichencodierung / Zahlen |
| --- | ---: | ---: | --- | --- |
| `BeispielAFZ.csv` | 1.042 | 21 | `;` | Mit Windows-1252 (`cp1252`) lesbar; Dezimalkomma und Prozentzeichen |
| `BeispielDataSetEFA.csv` | 5.699 | 15 | `;` | UTF-8; Originalkoordinaten im Rohformat, synthetische Koordinaten mit Dezimalpunkt |
| `docs/BeispielDataSetEFA_original.csv` | 50 | 15 | `;` | Unveränderte UTF-8-Originalsicherung; Koordinaten in uneinheitlichem Punktformat |
| `haltestellen_avg.csv` | 3.093 | 4 | `;` | UTF-8; Dezimalpunkt bei Koordinaten |
| `tagesgang_avg.csv` | 24 | 2 | `;` | UTF-8-kompatibel; Dezimalpunkt |
| `e-scooter-beispiel.csv` | 6.740 | 9 | `,` | UTF-8; ganzzahlige Zählwerte und Radien |
| `GTFS_gefiltert_Frankfurt+30km.7z` | 8 Tabellen | Je Tabelle verschieden | Archiv | Enthält kommaseparierte UTF-8-Tabellen mit Endung `.txt` |

## 2. `BeispielAFZ.csv`

### Inhalt und Herkunft

AFZ wird hier als **automatische Fahrgastzählung** verstanden. Eine Zeile beschreibt einen Halt oder einen Betriebsmarker innerhalb einer Fahrt. Enthalten sind Fahrgastwechsel, Belegung, Kapazität sowie geplante und als Istzeiten interpretierte Zeitangaben.

Die Datei enthält **52 Fahrten mit 1.042 Zeilen**:

| Herkunft | Datum | Linien | Fahrten | Zeilen |
| --- | --- | --- | ---: | ---: |
| Originaldaten des Verkehrsverbunds | 30.04.2024 | U7 | 4 | 100 |
| Synthetische Ergänzungen für den Hackathon | 15.09.2025 | U1–U6, U8 und U9 | 48 | 942 |

Die Originalzeilen stehen unverändert in CSV-Zeilen **2–101**, die Ergänzungen in **102–1.043**. Die Begleitdatei [AFZ_HERKUNFT.json](AFZ_HERKUNFT.json) dokumentiert diese Herkunft einschließlich Prüfsummen.

Die Originalfahrten verlaufen zwischen Enkheim und Heerstraße, mit Fahrtbeginn zwischen 05:51 und 07:02 Uhr. Jede umfasst 23 Halte und zwei Betriebsmarker. Die Ergänzungen enthalten je zusätzlicher Linie sechs Fahrten: beide Richtungen, jeweils morgens, mittags und abends. Insgesamt liegen 938 Haltzeilen und 104 Betriebsmarker vor.

### Synthetische Daten

Haltefolgen, Sollzeiten, Linienbezeichnungen und Endpunkte der Ergänzungen stammen aus dem gelieferten GTFS-Fahrplan für den 15.09.2025. Fahrgastzahlen, Belegung, Kapazitäten und Istzeiten sind simuliert. Die Richtungscodes und zusätzlichen Haltestellenkennungen wurden für die Simulation festgelegt.

Die simulierten Kapazitäten betragen 184 oder 368 Plätze und belegen keine tatsächlichen Fahrzeugformationen. Fahrgastzahlen sind ganzzahlig und nicht negativ; die Belegung liegt innerhalb der angenommenen Kapazität. Istzeiten enthalten künstliche Verzögerungen und Aufenthalte. Die Nachfrageprofile sind frei gewählte Szenarien und nicht empirisch validiert. Die Zeitzone der Simulation ist `Europe/Berlin`.

Halt-IDs der Ergänzungen tragen den Präfix `synthetic:` und enthalten eine GTFS-Haltestellenkennung. Sie sind keine realen internen AFZ-Kennungen. Betriebsmarker behalten auch im synthetischen Teil `Hst=0`.

### Spalten

`AbZeit` und `AnZeit` kommen jeweils zweimal in der Kopfzeile vor. Ihre Position unterscheidet Fahrt- und Haltbezug.

| Position | Spaltenname | Typ / Bedeutung |
| ---: | --- | --- |
| 1 | `Datum` | Datum `TT.MM.JJJJ`; Fahrtdatum laut Export |
| 2 | `Tag` | Wochentag: `Di` im Originalteil, `Mo` in der Simulation |
| 3 | `Linie` | Linienbezeichnung U1–U9; U7 ausschließlich im Originalteil |
| 4 | `Ri` | Richtungscode; Werte `1` und `2`, keine allgemeine Codierungsdefinition mitgeliefert |
| 5 | `AbZeit` | `HH:MM`; Beginn der gesamten Fahrt |
| 6 | `FahrtAbHstName` | Name der Starthaltestelle der Fahrt |
| 7 | `AnZeit` | `HH:MM`; Ende der gesamten Fahrt |
| 8 | `FahrtAnHstName` | Name der Zielhaltestelle der Fahrt |
| 9 | `PlaetzeIst` | Ganzzahl; Gesamtkapazität laut Feldname |
| 10 | `StehplaetzeIst` | Ganzzahl; Stehplatzkapazität |
| 11 | `SitzplaetzeIst` | Ganzzahl; Sitzplatzkapazität |
| 12 | `AnZeit Soll` | `HH:MM`; geplante Ankunft am Halt |
| 13 | `AbZeit Soll` | `HH:MM`; geplante Abfahrt am Halt |
| 14 | `AnZeit` | `HH:MM:SS`; als Ist-Ankunft am Halt interpretiert |
| 15 | `AbZeit` | `HH:MM:SS`; als Ist-Abfahrt am Halt interpretiert |
| 16 | `HstName(Fpl)` | Haltestellenname oder Betriebsmarker `einfahrend` / `ausfahrend` |
| 17 | `Hst` | Text-ID der Haltestelle; Originalkennung oder synthetische Kennung, `0` für Betriebsmarker |
| 18 | `Einsteiger` | Dezimalzahl; Einstiegszählwert am Halt |
| 19 | `Aussteiger` | Dezimalzahl; Ausstiegszählwert am Halt |
| 20 | `Besetzung` | Dezimalzahl; als Belegung nach dem Fahrgastwechsel interpretiert |
| 21 | `Auslastung` | Prozenttext, z. B. `3,00%`; Anteil der belegten Kapazität |

### Bekannte Einschränkungen

Eine explizite Fahrt-ID und eine numerische Haltereihenfolge fehlen. Die zweite Zeitgruppe ist im Export nicht ausdrücklich mit `Ist` bezeichnet; ihre Bedeutung ist aus dem Kontext abgeleitet. Die genaue Bedeutung der Betriebsmarker ist nicht dokumentiert.

Originale Zählwerte sind teilweise gebrochen, beispielsweise `10,9`; ein zugrunde liegendes Hochrechnungs- oder Korrekturverfahren ist nicht beschrieben. Im Originalteil gibt es zeitliche Rücksprünge zwischen aufeinanderfolgenden Zeilen. Diese Auffälligkeiten wurden unverändert belassen.

## 3. `BeispielDataSetEFA.csv`

### Inhalt

EFA wird hier als **elektronische Fahrplanauskunft** verstanden. Die **5.699 Zeilen** beschreiben Start-/Zielanfragen mit Ortsangaben und Zeitstempeln. Start und Ziel liegen in der Arbeitsdatei ausschließlich in Frankfurt am Main. Eine Anfrage ist kein Nachweis einer tatsächlich durchgeführten Fahrt. Personenkennungen, gefahrene Routen oder GPS-Spuren sind nicht enthalten.

| Herkunft | Zeitbezug | Datensätze | CSV-Zeilen |
| --- | --- | ---: | --- |
| Originaldaten, auf Start- und Zielgemeinde Frankfurt am Main gefiltert | Anfragezeit 30.04.2024, Protokollzeit 01.05.2024 | 27 | 2–28 |
| Synthetische Ergänzungen für den Hackathon | 15.09.2025, vollständiger Tag | 5.672 | 29–5.700 |

Die 27 übernommenen Originalzeilen sind inhaltlich und in ihrer relativen Reihenfolge unverändert. Alle 50 ursprünglichen Zeilen sind zusätzlich bytegetreu in [BeispielDataSetEFA_original.csv](BeispielDataSetEFA_original.csv) gesichert. Die 23 ausgeschlossenen Zeilen enthalten mindestens einen Ort außerhalb Frankfurts. [EFA_HERKUNFT.json](EFA_HERKUNFT.json) enthält Zeilenbereiche, ursprüngliche Zeilennummern, Prüfsummen und die Simulationsparameter. Das 15-spaltige CSV-Schema bleibt unverändert; die Herkunft lässt sich anhand von Datum und dokumentiertem Zeilenbereich unterscheiden.

### Synthetische Daten und Tagesgang

`tagesgang_avg.csv` enthält **567.200 Anfragen pro Durchschnittstag**, aufgeteilt auf 24 Stunden. Für den handhabbaren Beispieldatensatz wird jede Stundenmenge mit **0,01** multipliziert. Daraus entstehen exakt **5.672 Anfragen** ohne Rundungsabweichung. Beispielsweise enthält 03:00–04:00 Uhr 9 Anfragen, 07:00–08:00 Uhr 411 und 17:00–18:00 Uhr 480. Alle 24 Stunden sind abgedeckt. Die Kalibrierung gilt ausschließlich für den synthetischen Tag; die 27 historischen Originalzeilen gehören nicht zu dessen Stundenmengen.

Der 15.09.2025 wurde passend zu den synthetischen AFZ-Fahrten und innerhalb des gelieferten GTFS-Gültigkeitszeitraums gewählt. Das Durchschnittsprofil wird unverändert als Beispielszenario verwendet, ohne zusätzliche Wochentagskorrektur. Die Skalierung ist keine Schätzung des tatsächlichen Frankfurter Anteils am Gesamtanfrageaufkommen.

Die Simulation nutzt **19 Frankfurter Haltestellen**. Namen und HAFAS-IDs stammen aus dem vollständigen EFA-Originalbestand; der Alias `Ffm Hauptbahnhof` wird zu `Frankfurt (Main) Hauptbahnhof` vereinheitlicht. Koordinaten werden über den Haltestellennamen aus `haltestellen_avg.csv` übernommen und als Dezimalwerte mit Punkt geschrieben. Die genaue Liste steht in `EFA_HERKUNFT.json`; es werden keine HAFAS-IDs erfunden.

Start und Ziel werden gleichverteilt aus diesen Haltestellen gewählt, wobei identische Start-/Zielhaltestellen ausgeschlossen sind. Diese räumliche Verteilung ist eine Simulationsannahme und weder an beobachtete Start-Ziel-Beziehungen noch an die monatlichen Haltestellenmengen angepasst. Für jede Stunde werden gleich breite, nicht überlappende Sekundenintervalle gebildet und daraus jeweils ein zufälliger Zeitpunkt gewählt. Die verwendete Pseudozufallsfolge mit Startwert `20260910` ist in der Herkunftsdatei beschrieben. Die neuen Zeilen sind chronologisch sortiert und enthalten keine vollständigen Duplikate.

### Spalten

| Spaltenname | Typ / Beispiel | Bedeutung |
| --- | --- | --- |
| `request_timestamp` | Zeitstempel mit neun Nachkommastellen | Original: Bedeutung offen; Simulation: Zeitpunkt der Auskunftsanfrage |
| `start_type` | Code, hier `STA` | Typ des Startorts |
| `s_adress_name` | Text | Name des Startorts; `adress` ist die Originalschreibweise |
| `s_hafas_id` | Text-ID | Start-ID des Auskunftssystems |
| `s_longitude` | Original: Rohtext; Simulation: Dezimalpunkt | Geographische Länge des Starts; Originalskalierung unbestätigt |
| `s_latitude` | Original: Rohtext; Simulation: Dezimalpunkt | Geographische Breite des Starts; Originalskalierung unbestätigt |
| `ziel_type` | Code, hier `STA` | Typ des Zielorts |
| `z_adress_name` | Text | Name des Zielorts |
| `z_hafas_id` | Text-ID | Ziel-ID des Auskunftssystems |
| `z_longitude` | Original: Rohtext; Simulation: Dezimalpunkt | Geographische Länge des Ziels; Originalskalierung unbestätigt |
| `z_latitude` | Original: Rohtext; Simulation: Dezimalpunkt | Geographische Breite des Ziels; Originalskalierung unbestätigt |
| `s_gem` | Text | Startgemeinde laut Feldname und Werten |
| `z_gem` | Text | Zielgemeinde laut Feldname und Werten |
| `log_timestamp` | Zeitstempel mit neun Nachkommastellen | Original: Protokollzeit laut Feldname; Simulation: sofortige Protokollierung, identisch mit `request_timestamp` |
| `diff_time` | Ganzzahl | Original: Einheit/Berechnung unbestätigt; Simulation: (`request_timestamp` − `log_timestamp`) in Minuten, stets `0` |

### Zeitbezug und Einschränkungen

Im übernommenen Originalteil liegen die Anfragezeitstempel am **30.04.2024 zwischen 02:35 und 08:45 Uhr**, die Protokollzeitstempel am **01.05.2024 zwischen 00:24:32 und 05:37:14 Uhr**. Eine Zeitzone ist dort nicht angegeben. Die Simulation verwendet lokale Zeit in `Europe/Berlin` ohne UTC-Offset. Dort sind Anfrage- und Protokollzeit identisch; das Stundenprofil passt deshalb zu beiden Zeitspalten. Diese vereinfachte Annahme bestätigt nicht die offenen Feldbedeutungen des Originalexports.

Die übernommenen Originalkoordinaten bleiben im Rohformat, beispielsweise `8.687.966` und `5.012.831`. Eine bestätigte Formatdefinition fehlt. Im Originalteil reicht `diff_time` von −1.426 bis −1.020 und entspricht nicht durchgehend der Zeitstempeldifferenz in Minuten. Die Arbeitsdatei enthält keine vollständigen Duplikate und keine leeren Felder. Beim Einlesen müssen die Originalkoordinaten getrennt von den synthetischen Dezimalgradwerten behandelt werden.

Die Originalsicherung enthält weiterhin alle ursprünglichen Einschränkungen: auch Orte außerhalb Frankfurts, uneinheitliche Koordinaten, zwei vollständige Duplikate und `diff_time` von −1.438 bis −983.

## 4. `haltestellen_avg.csv`

Eine Zeile beschreibt eine Haltestelle mit einem durchschnittlichen monatlichen Anfragewert. Die Datei enthält **3.093 Haltestellennamen**, die innerhalb dieses Ausschnitts eindeutig sind.

| Spaltenname | Typ / Einheit | Bedeutung |
| --- | --- | --- |
| `haltestelle` | Text | Haltestellenname einschließlich Ortsbezug |
| `gps_x` | Optionale Dezimalzahl | Werte entsprechen plausibel geographischer Länge |
| `gps_y` | Optionale Dezimalzahl | Werte entsprechen plausibel geographischer Breite |
| `anfragen_durchschnittsmonat` | Zahl; Anfragen je Durchschnittsmonat | Durchschnittlicher Anfragewert laut Feldname |

Bei **79 Haltestellen** fehlen beide Koordinaten. Vorhandene Koordinaten reichen von 6,091499 bis 16,377113 in `gps_x` und von 47,567625 bis 54,314577 in `gps_y`; die Werte liegen somit teilweise weit außerhalb Frankfurts. Das Koordinatenreferenzsystem ist nicht ausdrücklich angegeben.

Eine ID-Spalte, konkrete Bezugsmonate, das Mittelungsverfahren und die Start-/Zielzählweise sind nicht dokumentiert. Die Werte bezeichnen Anfragen und keine gemessenen Fahrgastzahlen.

## 5. `tagesgang_avg.csv`

Die Datei beschreibt den durchschnittlichen Tagesverlauf von Anfragen mit **24 Zeilen**, jeweils einer für jede Stunde von 0 bis 23.

| Spaltenname | Typ / Einheit | Bedeutung |
| --- | --- | --- |
| `stunde` | Ganzzahl 0–23 | Stundenklasse; plausibel Beginn des Intervalls, z. B. 7 für 07:00–08:00 |
| `anfragen_durchschnittstag` | Dezimalzahl; Anfragen je Stundenklasse eines Durchschnittstags | Durchschnittlicher Anfragewert laut Feldname |

Es fehlen weder Stunden noch Werte. Bezugszeitraum, Wochentags-/Feiertagsauswahl, Zeitzone und verwendeter Anfragezeitstempel sind nicht dokumentiert. Haltestellen, einzelne Fahrten und individuelle Reisezeiten sind nicht enthalten.

Für die synthetische EFA-Ergänzung wird dieses Profil unverändert mit dem Faktor 0,01 verwendet: 5.672 Beispielanfragen aus insgesamt 567.200 Anfragen je Durchschnittstag. Die Annahmen hierzu stehen in Abschnitt 3; die Quelldatei selbst ist unverändert.

## 6. `e-scooter-beispiel.csv`

### Inhalt und Herkunft

Eine Zeile enthält aggregierte Fahrtstarts und -enden für einen Anbieter, Fahrzeugtyp, Standort, Radius und ein Zeitfenster. Es liegen keine einzelnen Fahrten, Fahrzeug-IDs, verbundenen Start-Ziel-Paare oder GPS-Spuren vor.

| Herkunft / `provider_name` | `vehicle_type` | Zeilen | Zeitbezug |
| --- | --- | ---: | --- |
| Verkehrsverbund: `nextbike` | `bicycle` | 20 | Ein Fenster vom 06.04.2025 um 16:00 Uhr bis 07.04.2025 um 13:00 Uhr, also 21 Stunden |
| Simulation: `synthetic_bikesharing` | `bicycle` | 3.360 | Stundenfenster vom 07.04.2025 um 00:00 Uhr bis 14.04.2025 um 00:00 Uhr |
| Simulation: `synthetic_e_scooter` | `e-scooter` | 3.360 | Dieselben sieben Tage und Stundenfenster |

Die **20 Originalzeilen** stehen unverändert am Dateianfang. Die **6.720 Ergänzungen** verwenden fiktive Anbieternamen mit dem Präfix `synthetic_`. Sie beziehen sich auf dieselben fünf Standortnamen und vier Radien wie der Originalteil. Alle E-Scooter-Zeilen sind synthetisch; die gelieferten Originalzeilen betreffen Fahrräder.

### Spalten

| Spaltenname | Typ / Beispiel | Bedeutung |
| --- | --- | --- |
| `provider_name` | Text | Gelieferter Anbieter bzw. fiktiver Simulationsanbieter |
| `end_date` | Datum `JJJJ-MM-TT` | Datum des Fensterendes `end_hour` |
| `start_hour` | Zeitstempel `JJJJ-MM-TT HH:MM:SS` | Beginn des Aggregationsfensters |
| `end_hour` | Zeitstempel `JJJJ-MM-TT HH:MM:SS` | Ende des Aggregationsfensters |
| `vehicle_type` | `bicycle` oder `e-scooter` | Fahrrad oder E-Scooter |
| `stop_name` | Text, z. B. `F Miquel-/Adickesallee` | Standortbezeichnung; keine eigene Standort-ID oder Koordinate |
| `radius` | Ganzzahl: 50, 100, 250, 350 | Räumlicher Einzugsbereich; in der Simulation Meter und kumulativ, Originaldefinition unbestätigt |
| `trips_starting` | Nichtnegative Ganzzahl | Zahl der Starts im räumlich-zeitlichen Aggregat |
| `trips_ending` | Nichtnegative Ganzzahl | Zahl der Enden im räumlich-zeitlichen Aggregat |

### Synthetische Daten und Einschränkungen

Die simulierten Zeitfenster beziehen sich auf lokale Zeit in `Europe/Berlin` ohne UTC-Offset im Zeitstempel. Der Fensterbeginn ist eingeschlossen, das Fensterende ausgeschlossen. Das letzte Stundenfenster endet am 14.04.2025 um 00:00 Uhr.

Die Zählwerte beruhen auf frei gewählten Tageszeit-, Wochenend- und Standortprofilen mit Zufallsvariation. Starts und Enden wurden unabhängig erzeugt; eine ausgeglichene Bilanz über alle Standorte ist nicht vorausgesetzt. Die simulierten Radien sind ineinanderliegende Bereiche: Der größere Radius enthält die Zählwerte des kleineren. Standortübergreifende Überschneidungen sind nicht bereinigt.

Bei den Originaldaten sind Zeitzone, Einbeziehung der Zeitgrenzen, Zählmethode sowie Einheit und Bezugspunkt der Radien nicht bestätigt. Die Simulation bestätigt diese offenen Definitionen des Originalbestands nicht.

Die Angabe von **etwa 30.000 E-Scooter-Nutzungen pro Tag** stammt aus der Begleitinformation des Verkehrsverbunds. Ihr genauer räumlicher, zeitlicher und anbieterbezogener Umfang ist nicht beschrieben. Die synthetischen Ergänzungen sind nicht auf diese Zahl kalibriert und belegen keine tatsächliche Nutzung.

## 7. `GTFS_gefiltert_Frankfurt+30km.7z`

### Inhalt

GTFS ist ein Format für Fahrplandaten. Das Archiv enthält den Unterordner `GTFS_gefiltert_Frankfurt+30km/` mit acht Tabellen. Es beschreibt geplante Verkehre und keine gemessenen Fahrzeugbewegungen.

| Tabelle | Zeilen | Inhalt |
| --- | ---: | --- |
| `agency.txt` | 1.168 | Betreiberinformationen und Zeitzone |
| `routes.txt` | 621 | Linien und Verkehrsmittelcodes |
| `trips.txt` | 100.483 | Fahrplanfahrten mit Kalender- und Geometriebezug |
| `stop_times.txt` | 1.918.201 | Halte und Zeiten der Fahrplanfahrten |
| `stops.txt` | 10.437 | Haltepunkte, Namen, Koordinaten und Stationsangaben |
| `calendar.txt` | 3.903 | Wochentagsmuster und Gültigkeitszeiträume |
| `calendar_dates.txt` | 470.417 | Kalendertagsbezogene Ausnahmen |
| `shapes.txt` | 170.460 | Geometriepunkte für 5.119 Shapes |

### Enthaltene Spalten

| Tabelle | Spalten |
| --- | --- |
| `agency.txt` | `agency_id`, `agency_name`, `agency_url`, `agency_timezone`, `agency_lang`, `agency_phone` |
| `routes.txt` | `route_id`, `agency_id`, `route_short_name`, `route_long_name`, `route_type`, `route_color`, `route_text_color`, `route_desc` |
| `trips.txt` | `route_id`, `service_id`, `trip_id`, `trip_headsign`, `trip_short_name`, `direction_id`, `block_id`, `shape_id`, `wheelchair_accessible`, `bikes_allowed` |
| `stop_times.txt` | `trip_id`, `arrival_time`, `departure_time`, `stop_id`, `stop_sequence`, `pickup_type`, `drop_off_type`, `stop_headsign`, `arrival_time_seconds`, `departure_time_seconds` |
| `stops.txt` | `stop_id`, `stop_code`, `stop_name`, `stop_desc`, `stop_lat`, `stop_lon`, `location_type`, `parent_station`, `wheelchair_boarding`, `platform_code`, `level_id` |
| `calendar.txt` | `service_id`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`, `start_date`, `end_date` |
| `calendar_dates.txt` | `service_id`, `date`, `exception_type` |
| `shapes.txt` | `shape_id`, `shape_pt_lat`, `shape_pt_lon`, `shape_pt_sequence` |

### Zeitlicher und räumlicher Umfang

Die Kalenderdaten reichen vom **12.07.2025 bis 13.12.2025**. Die im Fahrplan angegebene Zeitzone ist `Europe/Berlin`. Die Originalbeispiele aus April 2024 und April 2025 sowie die synthetische Sharing-Woche liegen außerhalb dieses Zeitraums; die synthetischen AFZ-Fahrten am 15.09.2025 liegen darin.

Der Dateiname bezeichnet Frankfurt plus 30 km. Die gelieferten Haltepunktkoordinaten reichen jedoch von 6,990939 bis 13,435024 Länge und von 48,784084 bis 54,078725 Breite. Der genaue räumliche Filter ist nicht dokumentiert.

### Besonderheiten des Exports

- Die 100.483 Einträge in `trips.txt` sind Fahrplanfahrten, die an mehreren Betriebstagen verkehren können; sie sind keine Zahl täglicher Fahrten.
- Identifikatoren sind Textwerte. `shape_id` enthält in `trips.txt` durchgehend die Endung `.0`, in `shapes.txt` fehlt diese Endung.
- Die Uhrzeittexte in `stop_times.txt` bleiben unter `24:00:00`. Die zusätzlichen Felder `arrival_time_seconds` und `departure_time_seconds` enthalten Sekunden relativ zum Betriebstag und reichen bis 112.740; sie enthalten damit auch Tagesüberläufe.
- Die Stationshierarchie ist unvollständig: Zahlreiche in `parent_station` genannte Elternhaltestellen fehlen. Trotz gefüllter `level_id`-Felder ist keine `levels.txt` enthalten.
- `feed_info.txt`, `transfers.txt` und `pathways.txt` sind nicht enthalten. Verschiedene Beschreibungs-, Sprach-, Farb- und Kontaktfelder sind leer.
- Shapes sind Fahrplangeometrien und keine aufgezeichneten GPS-Spuren. Ihre räumliche Detailtiefe ist nicht als gleisgenauer Verlauf zugesichert.

## 8. Aussagegrenzen des Datenpakets

Die Originalbeispiele zeigen Ausschnitte aus den jeweiligen Datenbeständen. Ihre Repräsentativität für das gesamte Verkehrsgeschehen ist nicht belegt. Die synthetischen Ergänzungen sind Testdaten mit frei gewählten Nachfragewerten.

Auskunftsanfragen, Fahrgastzählungen und Sharing-Starts/-Enden sind unterschiedliche Messgrößen. Die Durchschnittsdateien enthalten keine dokumentierten Bezugszeiträume und keine gemeinsame Aufschlüsselung nach Haltestelle und Stunde.

Das Verkehrsdatenpaket enthält keine Handy-GPS-Spuren, keine bestätigten individuellen Verkehrsmittelnutzungen, keine PKW-Vergleichsfahrten und keine Emissionsfaktoren.
