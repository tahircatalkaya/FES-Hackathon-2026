---
name: gtfs-trip-matching
description: Rezept für den Ride2Impact-Baustein - GPS-Spur gegen GTFS-Fahrplan matchen, Konfidenz berechnen und begründen. Laden bei OEPNV-Fahrt erkennen, Haltestellensuche, Abfahrten, Tracking, Konfidenz, Transdev.
---

# Ride2Impact: Fahrt erkennen mit Konfidenz

Daten: `Mobilitätsdaten/GTFS_gefiltert_Frankfurt+30km.7z`, Kalender 12.07.-13.12.2025,
100.483 Fahrten, 8 Tabellen. Entpacken mit `7z x`, dann als SQLite laden.

## Vorbereitung (einmalig, als Skript)

1. `stops.txt`, `stop_times.txt`, `trips.txt`, `routes.txt`, `calendar*.txt`, `shapes.txt` in SQLite.
2. Index auf `stop_times(trip_id, stop_sequence)` und `stops(stop_lat, stop_lon)`.
3. Räumlicher Vorfilter über Bounding-Box, das reicht für den Prototyp.
4. GTFS-Kalender liegt in 2025. Für die Demo den Wochentag mappen, nicht das Datum.
   Das im UI als Demo-Hinweis kennzeichnen, nicht verstecken.

## Flow

1. Nahe Haltestellen im Umkreis 400 m, sortiert nach Distanz, Nutzer kann korrigieren.
2. Nächste Abfahrten aus `stop_times` für den aktuellen Zeitpunkt, plus Linie und Richtung.
3. Tracking startet erst nach explizitem Tap. Banner "Aufzeichnung läuft" bleibt sichtbar.
4. GPS-Punkte alle 5-10 s puffern, on-device.
5. Beim Beenden: Kandidaten bilden, bewerten, bestes Ergebnis mit Konfidenz zeigen.

## Kandidatenbildung

Alle Fahrten, die im Zeitfenster [start-10min, ende+10min] eine Haltestelle
innerhalb 300 m des ersten und des letzten GPS-Punkts bedienen, in der richtigen
Reihenfolge der `stop_sequence`.

## Konfidenz (0 bis 1, gewichtete Summe, alle Teilwerte anzeigen)

| Merkmal | Gewicht | Berechnung |
|---|---|---|
| Haltestellen-Trefferquote | 0,35 | Anteil der Fahrt-Haltestellen, an denen die Spur < 150 m vorbeikam |
| Zeitliche Übereinstimmung | 0,25 | 1 - (mittlere Abweichung in min / 10), gekappt bei 0 |
| Streckenähnlichkeit | 0,25 | mittlerer Abstand der GPS-Punkte zur `shapes.txt`-Linie, 0 m = 1, 200 m = 0 |
| Geschwindigkeitsprofil | 0,15 | Haltepunkte der Spur vs. Haltestellen, Median-Speed im plausiblen Bereich |

Schwellen: >= 0,80 `plausibel` (Multiplikator 0,7), 0,50-0,79 `schwach plausibel` (0,4),
< 0,50 `nicht zuordenbar` (0,0, Nutzer kann manuell zuordnen -> 0,3).

## Begründung im UI

Immer als Liste von Sätzen, nicht als Zahl allein. Beispiel:
"7 von 8 Haltestellen getroffen", "im Schnitt 1,4 min nach Fahrplan",
"Streckenabweichung im Mittel 38 m", "Ergebnis: U4 Richtung Enkheim, Konfidenz 0,86".

## Fehlerfälle sauber behandeln

- Keine Kandidaten: Status `nicht zuordenbar`, Nutzer kann Linie manuell wählen.
- Mehrere gleich gute Kandidaten: beide anzeigen, Nutzer entscheidet, Status bleibt bei 0,4.
- GPS-Lücke > 3 min: markieren, Konfidenz um 0,15 senken, im Grund nennen.
- Spur zu kurz (< 500 m): keine Punkte, Hinweis statt Fehler.

## Testspuren

Es liegen keine echten GPS-Spuren im Repo. Synthetische Spuren aus `shapes.txt`
erzeugen: Punkte entlang der Linie interpolieren, Rauschen von 10-25 m addieren,
Zeitstempel aus `stop_times` ableiten. Zusätzlich eine bewusst falsche Spur
(Autofahrt parallel zur Linie) bauen, um zu zeigen, dass das Matching sie ablehnt.
Diese Ablehnung im Pitch zeigen, das ist der stärkste Moment des Bausteins.
