# Punkte-, Impact- und Anti-Fehlanreiz-Modell

Grundlage für Pitch und Implementierung. Jede Regel hier ist eine Antwort auf ein
Bewertungskriterium der Jury ("Faire Motivation", "Plausible Nachweislogik",
"Nachvollziehbarkeit der Impact- und Reward-Logik").

---

## 1. Zwei getrennte Währungen

Der häufigste Denkfehler in solchen Apps: Punkte = Impact. Das erzeugt genau die
Fehlanreize, die die Aufgabenstellung verbietet.

| | **Impact** | **Punkte ("Blätter")** |
|---|---|---|
| Was | kg CO2e vermieden, kg Lebensmittel gerettet, Einwegverpackungen vermieden | Verhaltenswährung |
| Berechnung | Physik / dokumentierte Emissionsfaktoren | Gestaltete Spielregel |
| Skalierung | proportional zur Menge | **nicht** proportional, gedeckelt, degressiv |
| Anzeige | immer mit Label: bestätigt / plausibel / geschätzt | immer mit Herleitung antippbar |
| Einlösbar | nein | ja |

Merksatz für den Pitch: **"Punkte gibt es für die Entscheidung, nicht für die Strecke."**

---

## 2. Verifikationsgewicht (Multiplikator)

Die Foodsharing-DoD verlangt wörtlich: "Belohnung nach Verifikationsgrad und
gesellschaftlichem Nutzen gewichten." Also machen wir das explizit:

| Nachweisstatus | Multiplikator | Beispiel |
|---|---|---|
| `bestätigt` | 1,0 | Vytal-Rückgabe-Event, Foodsharing-API-Pickup, FES-Ticket bearbeitet |
| `plausibel` | 0,7 | GPS-Spur matcht GTFS-Fahrt mit Konfidenz >= 0,80 |
| `schwach plausibel` | 0,4 | Konfidenz 0,50-0,79, oder Peer-Bestätigung ohne API |
| `selbst angegeben` | 0,3 | Nutzer hakt "bin Rad gefahren" ab |
| `nicht zuordenbar` | 0,0 | Impact wird trotzdem als Schätzung angezeigt, nur ohne Punkte |

Im UI steht an jeder Gutschrift der Multiplikator und **warum**. Das ist ein ganzes
Bewertungskriterium, das man mit einem Screen gewinnt.

---

## 3. Basispunkte (vor Multiplikator)

Gemeinnutzen schlägt Eigennutzen. Handlungen, die **anderen** helfen, geben mehr
Punkte als Handlungen, die einem selbst nutzen.

### Mobilität (Transdev / traffiQ)
| Aktion | Punkte | Deckel |
|---|---:|---|
| Terminal-Check-in (fest) | 5 | max. 3 gewertete Fahrten/Tag |
| Fuss-/Radweg > 1 km statt Auto | 0 | nicht nachweisbar, nur Impact |
| E-Scooter/Bike-Sharing als Zubringer zu OEPNV-Halt | 3 | max. 1/Tag |
| E-Scooter-Fahrt < 1,5 km ohne OEPNV-Anschluss | **0** | ersetzt typischerweise Gehen, kein Gewinn |
| Fehlerkorrektur melden ("das war nicht Linie 12") | 3 | max. 2/Tag |

### Mehrweg (Vytal)
| Aktion | Punkte | Regel |
|---|---:|---|
| Bestätigte Rückgabe | 5 | genau einmal je `event_id`/`transaction_id`, idempotent |
| Rückgabe innerhalb 48 h statt kurz vor Frist | +10 | belohnt schnellen Umlauf, nicht Menge |
| Ausleihe | 0 | Ausleihen ist keine Leistung, Zurückbringen ist die Leistung |

### Foodsharing (Save2Share)
| Aktion | Punkte | Begründung |
|---|---:|---|
| Lebensmittel in Fairteiler **einstellen** | 15 | erzeugt Angebot für andere |
| Regal-Status melden (Foto + Kategorien) | 5 | max. 1 je Fairteiler/6 h, verhindert Leerfahrten anderer |
| Korb anbieten | 10 | |
| Verteilung als Saver ankündigen und durchführen | 25 | ehrenamtliche Arbeit, höchster Gemeinnutzen |
| Lebensmittel **abholen** | **15** | max. 2 je Tag, danach 0. Nachweis per Foto vor Ort |
| Abholung für dritte Person mitnehmen | 5 | bestätigt durch Empfänger-QR |
| Reservierung eingehalten | 2 | belohnt Verlässlichkeit statt Menge |

Die **Deckelung beim Abholen** gehört in den Pitch. Abholen bekommt Punkte, weil gerettetes
Essen der eigentliche Zweck ist und weil sonst niemand den Weg zum Fairteiler macht. Aber nur
zweimal am Tag, danach null. So lohnt sich Hamstern nicht: Wer ein Regal leerräumt, bekommt für
die dritte Tüte nichts mehr, während Einstellen (40) und Melden (15) unverändert zählen. Der
**Impact** (kg gerettet) wird immer voll angezeigt und zaehlt aufs Frankfurt-Ziel ein.

### Stadtsauberkeit (FES)
| Aktion | Punkte | Nachweis |
|---|---:|---|
| Teilnahme an angemeldeter Clean-up-Aktion | 15 | Geofence + Zeitfenster + Peer-Check-in |
| Organisation einer Clean-up-Aktion | 20 | FES bestätigt Sackabholung |
| Meldung (volle Tonne, wilde Kippe) die zu FES-Ticket führt | 10 | erste Meldung je Ort/72 h |
| Richtige Entsorgung am FES-Papierkorb/Container (NFC/QR) | 3 | max. 3/Tag, Cooldown 60 min je Behälter |
| Lernmodul/Quiz | 2 je Frage | max. 3 Kapitel/Tag |
| **Einzelnes Müllstück aufheben** | **0 Punkte** | siehe Abschnitt 5 |

### Rhythmus statt Rekord
| | Punkte |
|---|---:|
| Wochenziel erreicht (3 aktive Tage von 7) | +25, ausserhalb des Tagesdeckels |
| Vier Wochen in Folge Wochenziel | +50, einmalig pro Monat, ausserhalb des Tagesdeckels |

**Kein Tagesstreak.** Ein Tagesstreak nach Duolingo-Vorbild erzeugt um 23:50 sinnlose
Busfahrten, nur um die Serie zu halten. Wir zählen Wochen, das Wochenziel ist 3 von 7,
und es gibt einen Freeze pro Monat. Das ist erklärbar und kein Fehlanreiz.

---

## 4. Degression und Deckel

Innerhalb einer Kategorie pro Tag:

| Aktion Nr. | Anteil der Basispunkte |
|---|---|
| 1. | 100 % |
| 2. | 60 % |
| 3. | 30 % |
| ab 4. | 0 % (Impact wird weiter voll gezählt) |

Harter Tagesdeckel: **50 Punkte/Tag** (Rhythmus-Bonus ausgenommen). Begründung für die Jury: Wir wollen, dass
Menschen ihre Gewohnheiten ändern, nicht dass sie einen Nachmittag lang die App
farmen. Die Kurve macht den 5. Fairteiler-Besuch am Tag wertlos, die 3 Tage pro Woche
über Monate aber sehr wertvoll.

---

## 5. Der Kobra-Effekt beim Müll: warum wir pro Müllstück nichts zahlen

Das Problem, das ihr richtig erkannt habt: Wer für aufgehobenen Müll bezahlt wird,
kann Müll hinwerfen und wieder aufheben. Kein Foto- oder KI-Verfahren löst das
zuverlässig, weil das Ereignis "dieser Müll lag schon da" technisch nicht beweisbar ist.

Unsere Antwort ist, den Nachweis auf Dinge zu verschieben, die **nicht** selbst
herstellbar sind:

1. **Anwesenheit bei einer koordinierten Aktion.** Die Aktion existiert vorher in der
   App (Polygon + Zeitfenster + Organisator). Punkte gibt es pro Person, flach, nicht
   pro Sack. Damit ist "mehr Müll" kein Hebel.
2. **Gegenseitige Bestätigung (Peer-Attestierung).** Mindestens zwei Teilnehmende
   scannen sich gegenseitig einen rotierenden QR-Code vom Display des anderen.
   Aus der Ferne nicht fälschbar, Kollusion braucht zwei physisch anwesende Personen.
3. **Vorher/Nachher-Foto vom gleichen Standpunkt.** Zeitabstand 10-120 min, gleicher
   Geofence, Perceptual Hash gegen alle bereits eingereichten Fotos (Dublettenschutz).
4. **FES als Orakel.** FES stellt bei angemeldeten Aktionen Material und holt die Säcke
   ab. Diese Abholung ist die Bestätigung, die den Multiplikator auf 1,0 setzt.
   Ohne FES-Bestätigung bleibt die Aktion auf 0,4 stehen.
5. **Der Behälter als Anker.** NFC/QR gehört nicht in Busse, sondern auf FES-Papierkörbe,
   Glas- und Altkleidercontainer. FES besitzt diese Behälter, kann sie bekleben und das
   ist die realistische Pfand-Analogie, nach der ihr gesucht habt: ein fester,
   registrierter Ort, an dem etwas endet, mit Cooldown je Behälter und Nutzer.

Was **nicht** belohnt wird, bekommt trotzdem Anerkennung: Wer allein ein Stück Müll
aufhebt, sieht die Chamäleon-Reaktion, den Tages-Haken und einen Eintrag im Logbuch.
Anerkennung ist billig zu geben und billig zu faken, also ist sie das richtige
Instrument. Punkte sind teuer, also brauchen sie einen harten Nachweis.

---

## 6. Fehlanreiz-Matrix (gehört als Slide in den Pitch)

| Fehlanreiz | Gegenmassnahme |
|---|---|
| Sinnlose Fahrten für Punkte | Flat pro Fahrt, Deckel 2/Tag, Degression, keine Punkte pro km |
| Punkte pro km lässt Vielfahrer gewinnen | Punkte an Entscheidung gekoppelt, nicht an Distanz |
| E-Scooter ersetzt Gehen statt Auto | 0 Punkte unter 1,5 km ohne OEPNV-Anschluss |
| Müll hinwerfen und aufheben | keine Punkte je Müllstück, nur Anwesenheit + Peer + FES-Bestätigung |
| Fairteiler leerräumen (Hamstern) | Abholen nur 2x je Tag gutgeschrieben, danach 0. Punkte bleiben beim Einstellen und Melden |
| Alles reservieren, nichts abholen | max. 1 offene Reservierung, TTL 45 min, Teilmengen, No-Show-Sperre |
| Doppelbelohnung Vytal | Idempotenz-Key auf `event_id`, serverseitige Dedupe-Tabelle |
| Mehrfach-Accounts (Sybil) | ein Konto je Gerät + Telefonnummer, kein Punktetransfer, Einladungsbonus einmalig und klein |
| GPS-Spoofing | Plausibilitätsprüfung gegen GTFS-Fahrplan: Geschwindigkeit, Haltestellenfolge, Fahrtzeitfenster. Eine gespoofte Spur, die exakt zu einer realen Fahrt passt, ist teurer als einfach mitzufahren |
| Foto-Recycling | Perceptual Hash + EXIF-Zeit + Geofence |
| Streak-Zwang | Wochenziel statt Tagesstreak, Freeze, keine Minuspunkte |
| Nur die Besten gewinnen | Schwellen- und Losbelohnungen statt Rangbelohnungen (Abschnitt 7) |
| Stadtteil-Ranking bestraft schlecht angebundene Viertel | Vergleich relativ zur eigenen Vorwoche, pro Kopf, kooperatives Stadtziel statt Rangliste |

---

## 7. Einlösung: Schwellen und Lose statt Rang

Die Aufgabenstellung sagt explizit, das System darf nicht nur die Besten belohnen.
Eine Top-100-Liste mit Deutschlandticket für Platz 1 verletzt das direkt.

- **Schwellenbelohnungen**, für alle erreichbar und jederzeit:
  200 P = eine Gratis-Vytal-Ausleihe, 350 P = Kaffee bei Partnerbetrieb,
  500 P = Kinoticket, 800 P = Monats-Gutschein.
- **Lose statt Rang:** Jede Woche mit erreichtem Wochenziel gibt **1 Los**, maximal
  4 Lose pro Monat. Verlost wird monatlich ein Deutschlandticket. Wer 10x mehr
  Punkte sammelt, hat damit nicht 10x mehr Chancen, sondern maximal die gleichen 4.
  Das ist der entscheidende Fairness-Mechanismus: Verlässlichkeit zählt, Menge nicht.
- **Spenden-Option:** Punkte in eine Foodsharing-Spende oder Baumpflanzung umwandeln.
  Nimmt Horte-Druck raus und gibt Vielsammlern ein sinnvolles Ventil.
- **Keine Minuspunkte, kein öffentliches Ranking nach unten.**

Soziales bleibt, aber kooperativ: Freundesgruppen haben ein **gemeinsames Wochenziel**
("wir 5 schaffen 12 aktive Tage"), keine Rangliste untereinander. Stadtteile füllen
gemeinsam einen Frankfurt-Balken, sichtbar wird der **Fortschritt gegenüber der eigenen
Vorwoche**, nicht der Platz gegenüber Sachsenhausen.

---

## 8. Impact-Berechnung

Formel je Fahrt:

```
vermiedene Emissionen = Distanz_km * (Faktor_Referenz - Faktor_genutzt)
Referenz = Pkw (Durchschnittsbesetzung)
```

Richtwerte in g CO2e pro Personenkilometer (Quelle vor dem Pitch bei UBA/TREMOD
gegenprüfen und in der App als Quelle nennen):

| Verkehrsmittel | ca. g/Pkm |
|---|---:|
| Pkw | ~150 |
| Linienbus | ~80 |
| Strassen-/U-/S-Bahn | ~55 |
| Fernzug | ~30 |
| E-Scooter (Lebenszyklus) | ~70-120 |
| Pedelec | ~5 |
| Fahrrad, zu Fuss | 0 |

Regeln:
- Jeder Faktor ist in der App antippbar: Wert, Quelle, Stand, Annahme.
- Negative Werte werden nicht versteckt: Wenn E-Scooter statt Gehen, steht dort ehrlich
  "keine Einsparung".
- Alles, was nicht aus einer Schnittstelle kommt, trägt das Label `Schätzung`.
- Die gelieferten Beispieldaten sind teilweise synthetisch (steht im Repo-README).
  Im UI kennzeichnen wir das mit `Demo-Daten`. Das ist kein Makel, sondern erfüllt
  das Kriterium "klare Unterscheidung zwischen bestätigten Daten und Schätzwerten".

Vergleiche statt abstrakter Zahlen, immer Frankfurt-lokal:
"2,1 kg CO2 = 14 km Autofahrt von Bockenheim nach Offenbach und zurück"
"= 9 Tassen Kaffee to go in Einwegbechern"
"= was eine Buche an einem Tag bindet" (mit Faktor-Quelle hinterlegt)

---

## 9. Datenschutz als Feature

Eigenes Kriterium in der Bewertung, also gehört es sichtbar ins Produkt:

- GPS **nur** während einer bewusst gestarteten Fahrt, mit dauerhaftem Banner
  "Aufzeichnung läuft" und Stop-Button auf jedem Screen.
- Kein Hintergrund-Tracking, keine Standortfreigabe an Freunde.
- Matching GPS-Spur gegen GTFS läuft on-device, an den Server geht nur das Ergebnis
  (Linie, Fahrt-ID, Konfidenz), nicht die Rohspur. Im Pitch sagen.
- Saver-Adressen: Anzeige als 300-m-Kreis mit zufälligem Mittelpunkt. Exakte Adresse
  erst nach bestätigter Reservierung und frühestens 15 Minuten vor dem Zeitfenster.
  Das löst gleichzeitig das Problem der Leute, die zu früh vor der Tür stehen.
- Rohdaten-Retention: GPS-Spuren 24 h, danach nur noch aggregierte Fahrt.
- "Meine Daten löschen" in einem Tap, und es funktioniert in der Demo.
- Für traffiQ/Transdev: Export ist **aggregiert** (Linie, Stunde, Richtung, Anzahl),
  k-Anonymität mit k>=5, keine Einzelprofile. Genau das brauchen sie für ihre
  Auslastungsanalysen, und es ist DSGVO-fest.

---

## 10. Zielgruppe ab 12 Jahren

- Keine öffentlichen Klarnamen, Anzeigename frei wählbar.
- Kein Standortteilen mit anderen Nutzenden.
- Belohnungen ohne Altersbeschränkung (kein Alkohol, keine Glücksspiel-Optik beim Los).
- Sprachen: Deutsch, Englisch, Türkisch, Arabisch + **Leichte Sprache** als eigene
  Stufe. Leichte Sprache ist bei einer Stadt-App mit Frankfurter Bevölkerungsstruktur
  das stärkere Inklusionsargument als eine fünfte Fremdsprache.
- Bedienbar mit einer Hand, Kernaktion in maximal zwei Taps, Kontrast AA,
  Screenreader-Labels an den Hauptflows.
