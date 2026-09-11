# Review des Brainstormings und getroffene Entscheidungen

Abgeglichen mit `Gesamtaufgabe.pdf`, der Eröffnungspräsentation und den Repo-Daten.
Pitch ist Samstag 16:00, 10 min + 5 min Fragen.

## Was bleibt (gute Ideen)

- Eine App, die verteilte Angebote bündelt. Das ist exakt die Ausgangslage der Aufgabe.
- Chamäleon als Maskottchen, aber mit Funktion: es erklärt die Punktelogik.
- Karte mit "was kann ich hier in der Nähe tun".
- Foodsharing entlasten: Reservierung, Regal-Status, Slot-Fenster statt WhatsApp.
- Adress-Unschärfe für Saver.
- Benachrichtigungen bei Nähe und bei fälliger Vytal-Rückgabe.
- Mehrsprachigkeit und niedrige Einstiegshürde.
- Greifbare CO2-Vergleiche statt abstrakter Kilogramm.
- Quiz/Lernen als Gamification.
- Aggregierte Nutzungsdaten für Transdev und traffiQ.

## Was geändert wurde (und warum)

| Ursprüngliche Idee | Entscheidung | Grund |
|---|---|---|
| Top-100-Liste, Freundes-Wettbewerb, Stadtteil-Ranking als Hauptmotor | kooperative Gruppen- und Stadtziele, Fortschritt zur eigenen Vorwoche | Aufgabenstellung schliesst "Menge, Hamstern oder Konkurrenz" ausdrücklich aus |
| Deutschlandticket für die Besten | Schwellenbelohnungen + Losverfahren, max. 4 Lose/Monat | "nicht nur die Besten belohnen" ist wörtliches Kriterium |
| NFC-Chips in Bus und Bahn als Kernnachweis | GPS-Spur gegen GTFS mit Konfidenz und Begründung; NFC nur optional auf FES-Behältern | Tags existieren nicht, iOS liest NFC nicht im Hintergrund, nicht demonstrierbar. Der Transdev-Baustein verlangt ohnehin GPS-Matching |
| Bottom-Nav mit vier Unternehmen | Nav nach Nutzerabsicht: Entdecken, Handeln, Impact, Gemeinsam, Profil | Niemand denkt "ich mache jetzt was mit Transdev". Kriterium ist "Klarer Nutzerfluss" |
| Punkte pro aufgehobenem Müllstück | 0 Punkte je Stück; Punkte für koordinierte Aktionen mit Peer-Attestierung und FES-Bestätigung | Kobra-Effekt ist technisch nicht wegprüfbar, wenn das Ereignis selbst herstellbar ist |
| Duolingo-Tagesstreak | Wochenziel 3 von 7, ein Freeze pro Monat | Tagesstreak erzeugt sinnlose Fahrten kurz vor Mitternacht |
| Punkte fürs Abholen bei Foodsharing | 0 Punkte fürs Abholen, Punkte fürs Einstellen und Melden, Impact zählt trotzdem | Punkte fürs Nehmen ist genau der Hamster-Fehlanreiz aus der DoD |
| Globus zeigt persönlich zurückgelegte Strecke | Globus zeigt die gemeinsame Frankfurter Strecke | persönliche Kilometer zu feiern belohnt Vielfahren |
| Vier Unternehmen | fünf Bausteine + MainLastenrad als sechster Kartenlayer | MainLastenrad steht im Datenhandout und wurde übersehen |

## Was neu dazukam

- Trennung von Impact (Physik) und Punkten (Verhaltenswährung).
- Verifikationsgrad als sichtbarer Multiplikator.
- "Warum diese Punkte"-Sheet an jeder Gutschrift.
- Fehlanreiz-Matrix als eigene Pitch-Slide.
- Digitales Saver-Onboarding über die Verifikations-Endpunkte der Foodsharing-API.
- Zeitfenster-Slots gegen zu früh erscheinende Abholer.
- Aggregierter, k-anonymer Datenexport als Produktfeature für Transdev/traffiQ.
- Leichte Sprache als eigene Sprachstufe.
- Kennzeichnung synthetischer Demo-Daten im UI.

## Scope für die verbleibende Zeit

Gebaut wird **eine durchgehende Journey an einem Tag im Leben einer Person**, die alle
fünf Bausteine berührt. Tiefe nur bei Ride2Impact und Save2Share, der Rest ist
klickbar mit echten Daten aus den CSVs.

Nicht gebaut: Login/Registrierung, Push-Infrastruktur, echte Belohnungseinlösung,
Admin-Bereich, native NFC-Integration, Freundesystem mit Server.
