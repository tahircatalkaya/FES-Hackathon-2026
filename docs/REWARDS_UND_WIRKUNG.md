# Anerkennung, Wirkung und faire Teilnahme

## Regelversion demo-v1

Alle folgenden Zahlen sind eigene, im Pilot zu validierende Produktannahmen. Eine gemeinsame Punktewährung, drei getrennt erklärte Ansichten: verdienter Fortschritt, ausstehende Prüfung, einlösbares Guthaben. Die aktuelle Referenz vergibt **ausschließlich nicht einlösbare Demopunkte**. Produktion ist im Referenzcode gesperrt. Materielle Belohnungen und deren Transaktionen sind noch nicht implementiert.

| Aktion | Nutzen / erforderlicher Nachweis | Basis | Tages-/Wochenlimit | Wiederholung / Ausschluss | Für spätere Einlösung vorgeschlagen |
|---|---|---:|---|---|---|
| Mehrwegrückgabe | Wiederverwendung; bestätigter zugeordneter Nutzungszyklus | 10 | 10 / 30 | Pro Zyklus einmal; unmittelbares Leihen/Zurückgeben ohne plausible Nutzung zur Prüfung | Nur stärker geprüfte sinnvolle Nutzung, nie bloße Zähler |
| Bestätigte Korbrettung | Verteilung erleichtern; eigene Abhol-ID und unabhängige Übergabe | 10 | 10 / 30 | Ganzer Korb, Teilnehmerprüfung, Partnerberechtigung; Kreisläufe ausschließen | Nur nach vereinbarter Partnerfreigabe |
| Qualifizierte Foodsaver-Arbeit | Ehrenamt entlasten; verifizierter organisierter Termin | 15 | 15 / 30 | Geschäfts-POST allein beweist Termin nicht; wiederholte neue IDs prüfen | Nur qualifiziert bestätigte Termine |
| Fairteiler-Abgabe | Hilfreiche Weitergabe; zunächst Selbstauskunft | 2 | 2 / 6 | Keine Punkte pro kg; Neuwarekäufe und Abgabe/Abholung im Ring qualifizieren nicht | Nein |
| Fairteiler-Abholung | Nutzung vorhandener Lebensmittel; zunächst Selbstauskunft | 2 | 2 / 6 | Kein Mengenbonus; wiederholte POSTs erzeugen keinen wertigen Anspruch | Nein |
| Organisierter Clean-up | Gemeinsamer öffentlicher Beitrag; Organisator bestätigt Teilnahme | 15 | 15 / 30 | Einmal Teilnehmer/Veranstaltung; Codes allein weitergebbar | Nach zusätzlichem Organisatorcheck möglich |
| Spontane Müllaktion | Niedrigschwelliges Engagement; Selbstauskunft/Plausibilität | 2 | 2 / 6 | Keine Stück-/Sack-/Gewichtsprämie; Foto beweist Müllherkunft nicht | Nein |
| Plausible Mobilitätsentscheidung | Alltag reflektieren; bewusst gestartete abgeschlossene Reise | 5 | 5 / 15 | Umstiege zusammenführen; kein Kilometerbonus; zusätzliche Runde kein Zusatzwert | Nein ohne stärkeren Pilotnachweis |
| Lernmission | Wissen und Handlungskompetenz; einmalig richtige Antwort pro Inhalt | 3 | 3 / 9 | Inhaltsschlüssel statt neuer Request-ID, kein automatisiertes Wiederholen | Nein |
| Hilfreiches Bestandsupdate | Weniger vergebliche Wege; neues zeitlich relevantes Update | 1 | 1 / 3 | Identisches/variiertes Foto, Pingpong und Bestätigungsring ausscheiden | Nein |

Gemeinsame Obergrenze 50/Tag und 100/ISO-Woche pro Nutzer und Umgebung, fest Europe/Berlin. Die Referenz begrenzt konkurrierende Buchungen in einer DB-Transaktion. Ihre Capwerte zählen ursprüngliche Gutschriften auch nach Korrektur, damit Rückbuchung keine neue Sammelkapazität öffnet. Nachweise älter als 24 Stunden oder mehr als fünf Minuten in der Zukunft gehen in der Demo in Prüfung. Produktive verspätete Abgleiche brauchen eine vereinbarte Import-/Prüfregel, keine neue Ereignisidentität.

Beispiel: Quiz +3, gültiger Rückgabefixture +10, erneuter Abruf +0, plausible Fahrt +5 ergibt 18 verdiente Demopunkte, 0 einlösbar. Unverifizierte Foodsharing-Abholung ergibt 0 mit Erklärung. Auch ein echter hilfreicher Beitrag kann wegen fehlender Rewardberechtigung oder ausgeschöpftem Budget 0 Punkte erhalten. Das ist kein Urteil über seinen Wert.

**Technische Grenze:** Die Referenz setzt Tages-, Wochen-, Identitäts-, Umgebungs- und Wiederholungsschutz um. Sie erkennt keine absichtlich erfundenen neuen fachlichen Vorgänge. Partnerautorisierung, unabhängige Nachweise, Fairteiler-/Freundesringe, Eventmoderation und Nachqualifizierung ausstehender Fälle sind Fachmodul-/Piloterweiterungen. Ein neuer boolescher Parameter im Frontend ist kein Nachweis.

## Fehlanreize und Motivation

Keine Punkte pro gefahrenem Kilometer, Lebensmittelgewicht oder Müllstück. Zusätzliche Busrunden treffen dieselbe Tagesgrenze; künstliche Abschnitte gehören in eine Reise. Unnötiger Mehrwegkonsum und sofortige Rückgaben brauchen eine Nutzungsprüfung und berechtigen nicht automatisch zu realen Rewards. Einkaufen für Abgabepunkte und Kreisläufe zwischen Freunden werden durch fehlende Einlösbarkeit schwacher Nachweise sowie spätere Paar-/Terminprüfung entwertet. Selbst ausgelegter Müll und Foto-Replays führen zu keinem Mengenentgelt. Reservieren allein verdient nichts. Quiz-Replay bleibt dieselbe einmalige Aktion.

Selbstbestimmungstheorie motiviert die Gestaltung: frei wählbare Handlung (Autonomie), konkrete Erklärung und erreichbarer Fortschritt (Kompetenz), freiwillige Gemeinschaft (Zugehörigkeit). Das ist eine begründete Designableitung, kein bewiesener Effekt dieser App. Dominante materielle Anreize können die Motivation verändern; deshalb Erklärungen und Handlungsnutzen vor Gutscheinwerbung, keine Verlustdrohung oder tägliche Strafe. Quelle: [Ryan & Deci 2000](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf).

Für geringe Zeit, eingeschränkte Mobilität und kleines Budget bleiben Lernen und Vermeidung eigenständige Wege. Vorgeschlagene Wochenroutine: zwei frei gewählte sinnvolle Tage, Pause ohne Levelverlust. Niveau 1 ab 0, 2 ab 30, 3 ab 70 verdienten Punkten; später saisonale Ziele anpassen. Chami bleibt bei Pausen freundlich. Pflanzenfläche/Globus sind Spielsymbole, keine Aufforstungszertifikate. Die derzeitige Oberfläche zeigt nur einen einfachen Fortschrittsbalken, keinen vollständig implementierten Streak-/Levelalgorithmus.

## Freunde, Top 100 und Gebiete

Nächste Stufe: gegenseitige Freundschaftsannahme, Entfernen, Blockieren, pseudonyme freiwillige Suche und private Voreinstellung. Keine Offenlegung von Abholbedarf, Privatadressen oder Bewegungsprofilen. Ranking nur Opt-in und vierwöchige Saison, gedeckelte verdiente Punkte nach Korrekturen; Einlösen verändert den Rang nicht. Gleichstände teilen den Rang, Eintritt spät in der Saison zusätzlich über persönliches Wochenziel begleiten. Keine käuflichen Wettbewerbsvorteile.

Bezirksvergleich erst ab vorgeschlagenen 20 aktiven, eingewilligten Personen je Gebiet und Zeitraum. Nenner: aktive Teilnehmende, nicht Einwohnerzahl; zusätzlich Stichprobengröße und Angebotsdichte erklären. Kleine Gruppen unterdrücken, keine individuelle Rekonstruktion durch wechselnde Filter. PLZ ist kein Stadtteil; ohne geprüftes Mapping heißt die Ansicht PLZ-Liga. Wechsel erst nächste Saison, Verdachtsfälle klärbar, keine pauschale lebenslange Sperre. Resultate beschreiben die Challenge, nicht die moralische Qualität eines Viertels. Rangliste/Bezirksalgorithmus sind spezifiziert, nicht implementiert.

## Reale Rewards und Budgetmodell

Beispiele: ein kostenloser Kinobesuch, Deutschlandticket oder eine kleine örtliche Anerkennung. Keine Zusagen, Verträge oder Gutscheincodes vorhanden. Deutschlandticket laut [Deutsche Bahn](https://www.bahn.de/angebot/regio/deutschland-ticket) aktuell 63 €/Monat, regionaler Nahverkehr, Abonnementbedingungen beachten. Ein Gutschein dafür braucht einen tatsächlich geeigneten Ausgabe-/Vertragspartner. Es wird kein Abo abgeschlossen.

Rechenannahme: 100 aktive Pilotnutzer × 40 qualifizierte Punkte/Monat = 4.000 Punkte. 30 % Einlösequote bei geplant 200 Punkten je kleiner Prämie ergibt 6 Prämien. Bei angenommen 8 € Beschaffungskosten sind das 48 €. Bei doppelter Quote 96 €, bei zusätzlich doppelter qualifizierter Aktivität 192 €. Hinzu kommen Ausgabe-/Betriebskosten; diese sind noch unbekannt. Gesamtes Monatskontingent als Beispiel maximal 250 €, keine Verpflichtung jenseits bestätigter Ausgabe. Kinokosten sind Budgetannahme, kein recherchierter örtlicher Preis. Ein Deutschlandticket als größere Prämie müsste innerhalb desselben separat finanzierten Kontingents reserviert werden; kein alleiniger Top-100-Zugang.

Produktive Einlösung spezifiziert: in einer Transaktion Nutzer und Bestand sperren, ausreichendes qualifiziertes Guthaben reservieren, eindeutige Redemption-ID erzeugen; Outbox gibt maximal einen Gutschein aus. Timeout wird uncertain, Guthaben bleibt reserviert bis Abgleich. Fachlicher Fehler hebt Reserve mit Gegenbuchung auf. Eindeutige Provider-Ausgabe-ID/Code und ein Zustandsautomat verhindern Doppelverwendung. Ausverkauft erzeugt keine Abbuchung. Korrektur bereits ausgegebener Punkte erzeugt Prüf-/Schuldzustand, niemals still eine zweite Ausgabe. Diese Fälle müssen implementiert und konkurrierend getestet werden, bevor echte Rewards freigegeben werden.

## Impact-Vertrag und Quellen

`shared/impact.py` berechnet Referenz minus alle Teilstrecken. Jede Strecke braucht km, Faktor g CO₂e/Personenkilometer, Quelle und dieselbe Systemgrenze. Unbekannt bleibt null, negative Differenz bleibt negativ. Ein E-Scooter ohne geeigneten Faktor gilt nicht als emissionsfrei. Ein historischer Auskunftsdatensatz beweist keine individuelle Fahrt und keine ersetzte Autofahrt.

Geeignete geprüfte Referenz: [UBA, Verkehrsmittelvergleich 2024](https://www.umweltbundesamt.de/system/files/medien/366/bilder/dateien/vtv_2024_pv_tab_pdf.pdf), TREMOD 6.71B, Quellenstand 10/2025, Berichtsjahr 2024, Abruf 11.09.2026. Pkw durchschnittlich 164, Nahverkehrsbus 90, Straßen-/Stadt-/U-Bahn 42 g CO₂e/Pkm. Energiebereitstellung enthalten; keine vollständige Fahrzeug-/Infrastruktur-Lebenszyklusbilanz. Faktoren sind Durchschnittswerte, keine Messung der konkreten Fahrt.

Eigenes Rechenbeispiel: 5 km U-Bahn gegenüber tatsächlich plausiblen 5 km durchschnittlichem Pkw: (5×164 − 5×42)/1.000 = **0,61 kg CO₂e Vergleichsdifferenz**. Nur Schätzung mit dieser Referenz, nicht automatisch persönliche Einsparung. Mit zusätzlichen Teilstrecken deren Emissionen abziehen. Bei fehlender Referenz keine Differenz. Die Oberfläche verwendet derzeit bewusst keine persönliche CO₂-Zahl.

Foodsharing: Aktion zuerst, kg nur gemessen/erhoben mit Herkunft, CO₂ erst mit Lebensmittelgruppe, Faktor und Vergleich. Vytal: Partnerwert bleibt Berechnung, storebezogene kumulative Werte als Snapshot ersetzen statt addieren; kein paralleles eigenes Doppelzählen derselben Rückgabe. FES: Teilnahme ist Teilnahme, Quiz keine Emission. traffiQ: AFZ-Belegung plus passende Abschnittslänge könnte Personenkilometer liefern; EFA-Suche/Sharingaggregate reichen dafür nicht. Persönliche, historische, simulierte und gemeinschaftliche Werte bleiben getrennt.

## Privatheit und Pilotfreigabe

Standort nur freiwillig für erklärten Zweck, manuelles Gebiet immer verfügbar. Kein Standorttracking in der aktuellen Shell. Rohspuren für einen späteren Pilot als Vorschlag nach sieben Tagen löschen, abgeleitete Nachweise länger nur mit begründetem Zweck; konkrete Fristen rechtlich und technisch prüfen. Pseudonyme sind keine Anonymisierung. Push getrennt von Ortung erlauben, thematische Wahl, Ruhezeit als Vorschlag 21–08 Uhr, höchstens ein Reminder je fachlichem Anlass, Widerruf und In-App-Fallback. Keine privaten Details auf dem Sperrbildschirm. Storno/Rückgabe entfernen geplante Erinnerungen. Push ist noch nicht implementiert.

Zielgruppe ab ungefähr zwölf Jahren ist eine Produktabsicht, keine pauschale rechtliche Freigabe. Vor echtem Betrieb müssen Rechtsgrundlage, Alters-/Einwilligungsweg, Sorgeberechtigte, Vertragsfähigkeit, Partnerbedingungen und Datenschutzfolgen geprüft werden. Relevant sind insbesondere DSGVO Art. 5, 6, 8, 12, 17 und 25. Keine DSGVO-Zertifizierung behauptet.

Rechtsquelle: [DSGVO, EUR-Lex, insbesondere Art. 8](https://eur-lex.europa.eu/legal-content/EN-DE/ALL/?from=EN&uri=CELEX%3A32016R0679). Bei direkt an Kinder angebotenen Diensten und Einwilligung als Grundlage nennt Art. 8 grundsätzlich 16 Jahre und darunter die Zustimmung der elterlich verantwortlichen Person; Mitgliedstaaten können die Schwelle bis mindestens 13 senken. Daraus folgt keine allgemeine App-Zulassung ab zwölf Jahren. Die genaue Anwendung in Deutschland und alternative Rechtsgrundlagen bleiben Teil der Pilotprüfung.
