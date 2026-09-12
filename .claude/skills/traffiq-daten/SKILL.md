---
name: traffiq-daten
description: Spalten und Fallstricke der traffiQ- und Verkehrsverbund-CSVs im Repo. Laden bei Haltestellen, Auslastung, Ein- und Aussteiger, Tagesgang, E-Scooter, Verbindungsanfragen, Heatmap, Gemeinschaftsimpact.
---

# traffiQ-Daten: Spalten und Fallstricke

Alle Dateien in `Mobilitätsdaten/`. Trennzeichen ist meist `;`, bei
`e-scooter-beispiel.csv` ein Komma. Dezimaltrennzeichen teils Komma.
Encoding teils nicht UTF-8, beim Einlesen `latin-1` als Fallback probieren.

## Dateien

**haltestellen_avg.csv** (`;`) — `haltestelle; gps_x; gps_y; anfragen_durchschnittsmonat`
3.093 Zeilen. `gps_x` ist Längengrad, `gps_y` Breitengrad. Koordinaten teils leer.
Bester Kandidat für die Heatmap, direkt kartierbar.

**tagesgang_avg.csv** (`;`) — `stunde; anfragen_durchschnittstag`, 24 Zeilen.
Ideal für ein "wann ist Frankfurt unterwegs"-Diagramm.

**BeispielAFZ.csv** (`;`) — Fahrgastzählung.
Spalten u.a. `Datum, Tag, Linie, Ri, AbZeit, FahrtAbHstName, AnZeit, FahrtAnHstName,
PlaetzeIst, StehplaetzeIst, SitzplaetzeIst, HstName(Fpl), Hst, Einsteiger, Aussteiger,
Besetzung, Auslastung`. 1.042 Zeilen. `Auslastung` ist ein Prozentstring mit Komma.
Nur 4 echte U7-Fahrten vom 30.04.2024, der Rest synthetisch vom 15.09.2025.

**BeispielDataSetEFA.csv** (`;`) — Verbindungsanfragen Start/Ziel mit Koordinaten.
5.699 Zeilen, davon 27 original. Achtung: Koordinaten stehen als `8.686.438`,
das sind Tausenderpunkte. Vor Gebrauch parsen: Punkte entfernen, dann Dezimalstelle
nach der ersten bzw. zweiten Ziffer setzen. Gute Quelle für "beliebteste Relationen".

**e-scooter-beispiel.csv** (`,`) — `provider_name, end_date, start_hour, end_hour,
vehicle_type, stop_name, radius, trips_starting, trips_ending`. 6.740 Zeilen.
Nur 20 echte nextbike-Zeilen, der Rest `synthetic_bikesharing` / `synthetic_e_scooter`.
Jeder Standort kommt in vier Radien vor, also nicht doppelt summieren.

**GTFS_gefiltert_Frankfurt+30km.7z** — siehe Skill `gtfs-trip-matching`.

## Pflicht im UI

Alles, was aus synthetischen Zeilen stammt, trägt das Label `Demo-Daten`.
Die Zeiträume sind unterschiedlich (2024, 2025), also keine Zeitreihen über
Dateigrenzen hinweg bilden. Anfragen, Zählwerte und Sharing-Starts sind
unterschiedliche Messgrössen und dürfen nicht addiert werden.

## Was wir daraus bauen

- Heatmap der Haltestellen-Nachfrage, antippbar mit Wert und Quelle
- Tagesgang als Kurve mit "jetzt"-Marker
- Frankfurt-Gesamtziel der Woche, gespeist aus aggregierten Werten
- Stadtteil-Fortschritt gegenüber der eigenen Vorwoche, kein Ranking
- Exportansicht für Transdev und traffiQ: aggregiert nach Linie, Stunde, Richtung,
  k-Anonymität mit k>=5, keine Einzelprofile
