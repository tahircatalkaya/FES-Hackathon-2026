# Demo-Skript (10 Minuten) und Pitch-Struktur

Ein Tag im Leben von Lena, 24, Bockenheim. Ein Telefon, ein Durchlauf, alle fünf Bausteine.
Reihenfolge so, dass der stärkste Moment (die abgelehnte Autofahrt) in Minute 3 kommt.

| Min | Screen | Was passiert | Was die Jury hört |
|---|---|---|---|
| 0:00 | Onboarding | Sprache wählen (kurz Hrvatski oder Italiano zeigen), 3 Slides, Name | „Mobile-first, sechs Sprachen, Standort nur bei bewusster Fahrt.“ |
| 0:45 | Entdecken | Karte, Layer wechseln, Kai wechselt die Farbe, Karten-Karussell | „Eine Journey nach Absicht, nicht nach Partner. Live-Daten: foodsharing-API, Vytal, GTFS.“ |
| 1:30 | Fahrt starten | Haltestelle Bockenheimer Warte, echte GTFS-Abfahrten, Demo-Tag, Start | „Bewusst starten. Tag hebt den Nachweis auf bestätigt.“ |
| 2:15 | Tracking | Banner „Aufzeichnung läuft“, Simulation **Autofahrt neben der Linie** → beenden | **„Nicht zuordenbar. 0 Punkte. Das System lehnt eine Autofahrt ab.“** |
| 3:00 | Fahrt starten | Nochmal, Simulation **U4-Fahrt** → 95 % Konfidenz, Bausteine, Begründung → Bestätigen | „Konfidenz aus vier Bausteinen, jede Zahl erklärt.“ |
| 3:45 | Toast → Warum-Sheet | +14 Punkte, Tippen: Formel 20 × 0,7 × 1, Faktoren, Quelle | „Nachvollziehbarkeit: ein Screen, ein Kriterium.“ |
| 4:15 | Fairteiler | Regal melden → Foto → Erkennung schlägt Inhalt vor → bestätigen → 15 P | „Nutzereingabe bleibt Nutzereingabe. Melden hilft anderen.“ |
| 5:00 | Korb | Anfrage statt Reservierung, Kreis statt Adresse, Zusage → Adresse erscheint, Abholung → 0 Punkte, voller Impact | „Abholen gibt keine Punkte. Hamstern hat keinen Hebel.“ |
| 5:45 | Saver | Verifikation über die API: Quiz → 3 Abholungen → Freigabe → is_verified | „Der echte Foodsaver-Prozess, digital.“ |
| 6:30 | Mehrweg | Ausleihe scannen, Rückgabe bestätigen → +30, zweites Mal → 0 (Doppelbelohnung) | „Genau einmal je Transaktion.“ |
| 7:00 | Clean-up | Peer-QR, Vorher/Nachher, FES-Bestätigung → Status springt auf bestätigt | „Kein Punkt pro Müllstück. Anwesenheit + Peer + FES. Das ist unsere Antwort auf den Kobra-Effekt.“ |
| 7:45 | Impact | CO₂ mit Frankfurt-Vergleichen, Wochenziel 3/7, Kai-Stufen, Globus | „Greifbar statt abstrakt. Rhythmus statt Streak.“ |
| 8:30 | Gemeinsam | Frankfurt-Ziel, Kreis mit Ringen, Ehrentafel, Stadtteile vs. Vorwoche, Datentab mit Heatmap/Tagesgang/Auslastung | „Kooperativ. Und der Export, den Transdev und traffiQ brauchen: aggregiert, k ≥ 5.“ |
| 9:15 | Belohnungen | Schwellen + Losverfahren Deutschlandticket | „Nicht die Besten belohnen, sondern Verlässlichkeit.“ |
| 9:45 | Profil → Daten | Datenschutz-Schalter, Daten löschen | „Datenschutz ist ein Feature, nicht ein Absatz.“ |

## Pitch-Folien (Vorschlag, 8 Folien)

1. Problem: Angebote verteilt, Beitrag abstrakt, Wirkung nicht gemeinsam erlebbar (Zitat aus der Aufgabe).
2. Mainsam in einem Satz + Kai.
3. Live-Demo (der Plan oben).
4. Nachweis-Logik: bestätigt / plausibel / schwach / selbst / nicht zuordenbar als Multiplikator.
5. Punkte ≠ Impact: zwei Währungen, warum.
6. **Fehlanreiz-Matrix**: links Fehlanreiz, rechts Gegenmaßnahme (aus konzept/02, Abschnitt 6).
7. Datenintegration: was echt ist (API, GTFS, GraphQL) und was simuliert, ehrlich markiert. Export für Transdev/traffiQ.
8. Nächste Schritte: Dev-Build mit echtem NFC, Store-seitige Vytal-Rückgabe, FES-Ticket-API, Pilot in einem Stadtteil.

## Wahrscheinliche Rückfragen

- **Wie verhindert ihr Betrug beim Müll?** Kein Punkt je Stück. Anwesenheit in einer angelegten Aktion, gegenseitige QR-Bestätigung, Vorher/Nachher-Foto mit Hash, FES bestätigt die Sackabholung. Punkte flach pro Person.
- **Warum kein Ranking?** Die Aufgabe schließt Konkurrenz und Menge aus. Gruppenziel, Ehrentafel ohne Plätze, Stadtteile gegen ihre eigene Vorwoche, pro Kopf. Lose statt Rang.
- **Woher kommen die CO₂-Faktoren?** UBA/TREMOD-Richtwerte, in der App antippbar, als Schätzung markiert.
- **Was ist mit GPS-Spoofing?** Eine gefälschte Spur muss Haltestellenfolge, Fahrplanzeit, Linienform und Stillstände treffen. Das ist teurer als mitzufahren. Plus Tag-Abgleich.
- **Läuft NFC wirklich?** Im Dev-Build ja (react-native-nfc-manager), Expo Go kann kein NFC, deshalb Demo-Tag und QR.
- **Was passiert mit den Daten?** Rohspur bleibt auf dem Gerät und wird nach dem Matching verworfen. Export nur aggregiert mit k ≥ 5, opt-in.
