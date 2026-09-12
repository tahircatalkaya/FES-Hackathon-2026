---
name: fes-impact-rules
description: Verbindliche Produkt- und Fairness-Regeln der Frankfurt Impact Challenge. Immer laden, wenn es um Punkte, Belohnungen, Badges, Streaks, Ranglisten, Impact-Berechnung, CO2-Werte, Nachweise, Betrugsschutz, Fehlanreize oder neue Features geht.
---

# Verbindliche Regeln: Punkte, Impact, Fairness

Prüfe jeden Vorschlag gegen diese Liste. Verstösst er dagegen, widersprich und
schlag die konforme Variante vor.

## Zwei Währungen

| | Impact | Punkte |
|---|---|---|
| Was | kg CO2e, kg Lebensmittel, vermiedene Einwegverpackungen | Verhaltenswährung |
| Skalierung | proportional zur Menge | gedeckelt, degressiv, nie proportional |
| Label | bestätigt / plausibel / geschätzt | Herleitung antippbar |

Merksatz: Punkte gibt es für die Entscheidung, nicht für die Strecke.

## Verifikations-Multiplikator

bestätigt 1,0 (API-Event) / plausibel 0,7 (GPS-GTFS-Konfidenz >= 0,80) /
schwach plausibel 0,4 / selbst angegeben 0,3 / nicht zuordenbar 0,0.
Der Multiplikator steht sichtbar an jeder Gutschrift, mit Begründung.

## Basispunkte (vor Multiplikator)

Der Tagesdeckel liegt bei **50 Punkten**, deshalb sind die Beträge klein und nach
Hebel gestaffelt: Mobilität oben, Mehrweg unten. Quelle im Code:
`apps/mobile/src/engine/reward.ts` (`BASE`), das ist die verbindliche Fassung.

Mobilität: Terminal-Check-in 5 (fest, max 3/Tag), Leihrad/E-Scooter als Zubringer
zur Haltestelle 3 nur mit Anbieterbeleg, E-Scooter <1,5 km ohne Anschluss **0**,
Fehlerkorrektur melden 3. Fuss und Rad geben **0** Punkte: nicht nachweisbar, der
Impact wird trotzdem gezählt. Die geprüfte Fahrt selbst gibt 0 Punkte, sie bucht
Nachweis und Impact.
Vytal: bestätigte Rückgabe 5 (idempotent je event_id, max 3/Tag), Rückgabe <48 h +3,
Ausleihe 0.
Foodsharing: einstellen 15, Regal-Status melden 5 (max 4/Tag), Korb anbieten 10,
Verteilung als Saver 25, abholen 5 (max 2/Tag), für Dritte mitnehmen 5,
Reservierung eingehalten 2.
FES: Anmeldung zu einer Aktion 1 (fest, max 2/Tag), Clean-up-Teilnahme 15,
Organisation 20, Meldung mit Ticket 10,
Entsorgung am Behälter 3 (max 3/Tag), Biotonnen-Check 5 (max 1/Tag),
Quiz 2/Frage (max 3 Kapitel/Tag).
Rhythmus: Wochenziel 3 von 7 Tagen +25, vier Wochen in Folge +50.

## Deckel und Degression

Pro Kategorie und Tag: 1. Aktion 100 %, 2. 60 %, 3. 30 %, ab 4. 0 %.
Impact zählt immer voll weiter. Harter Tagesdeckel **50 Punkte**.
Der Rhythmus-Bonus liegt ausserhalb des Deckels (`CAP_EXEMPT`), sonst frisst ein
guter Tag die Belohnung für Regelmässigkeit.

## Verboten

- Ranglisten zwischen Nutzenden oder Stadtteilen als Motivationsmotor
- Belohnungen nach Platzierung (Top 100 etc.)
- Tagesstreaks
- Punkte pro Kilometer, pro Kilogramm, pro Müllstück, pro abgeholtem Lebensmittel
- Minuspunkte, Shaming
- Punktetransfer zwischen Konten
- Zahlen ohne Quelle oder ohne Label

## Erlaubt statt dessen

- Kooperative Gruppen- und Stadtziele, Fortschritt gegenüber der eigenen Vorwoche
- Schwellenbelohnungen (200/350/500/800 P) plus Losverfahren, max 4 Lose/Monat
- Punkte spenden statt horten
- Wochenziel mit einem Freeze pro Monat

## Müll-Nachweis ohne Kobra-Effekt

Kein Punkt je Müllstück. Belohnt wird:
1. Anwesenheit bei vorher angelegter Aktion (Polygon + Zeitfenster)
2. Gegenseitige QR-Attestierung von mindestens zwei Personen (rotierender Code)
3. Vorher/Nachher-Foto, 10-120 min Abstand, Geofence, Perceptual-Hash-Dublettenschutz
4. FES bestätigt Sackabholung -> Multiplikator 1,0, sonst 0,4
5. NFC/QR auf FES-Behältern mit Cooldown je Behälter und Nutzer

## Datenschutz

GPS nur während bewusst gestarteter Fahrt, Banner "Aufzeichnung läuft",
Matching on-device, Rohspur max 24 h, Saver-Adresse als 300-m-Kreis mit exakter
Adresse erst nach bestätigter Reservierung und frühestens 15 min vor Slot,
Export an Verkehrsunternehmen nur aggregiert mit k>=5.

## Impact-Faktoren (g CO2e/Pkm, Richtwerte, Quelle UBA im UI nennen)

Pkw ~150, Linienbus ~80, Strassen-/U-/S-Bahn ~55, Fernzug ~30,
E-Scooter ~70-120, Pedelec ~5, Rad und zu Fuss 0.
Formel: `vermieden = km * (Faktor_Pkw - Faktor_genutzt)`.
Wenn keine Einsparung entsteht, ehrlich "keine Einsparung" anzeigen.
