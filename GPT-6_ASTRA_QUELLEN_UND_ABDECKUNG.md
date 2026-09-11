# Verwendung und Quellen des Masterprompts

Stand: 11.09.2026.

Der vollständige Prompt steht in [GPT-6_ASTRA_HACKATHON_MASTERPROMPT.md](C:/Users/Tahir/Downloads/FES/team-01/GPT-6_ASTRA_HACKATHON_MASTERPROMPT.md). Die gleichnamige TXT-Datei enthält denselben Text zum direkten Kopieren. Verwende eine der beiden Fassungen vollständig als Startnachricht für GPT-6 Astra im Projektkontext. Die Unterlagen und Partnerdokumentationen müssen auch in dieser Zielumgebung erreichbar sein.

Für ein einzelnes Teammitglied kann davor eine kurze Kontextzeile stehen, zum Beispiel: „Mein Modul ist Foodsharing. Arbeite ausschließlich im dafür vorgesehenen Bereich und verwende die vereinbarten gemeinsamen Schnittstellen.“ Die tatsächlichen Zuständigkeiten und Branch-Namen einsetzen; der Masterprompt selbst setzt keine willkürliche Personenzuordnung voraus.

## Grundlage und Prüfung

- Die ursprüngliche eingefügte Datei wurde vollständig gelesen: `C:\Users\Tahir\.codex\attachments\4d5f6d46-e02b-420f-9eeb-e12eef6c19c5\pasted-text.txt`.
- Die 13 Seiten der lokalen `Gesamtaufgabe.pdf` wurden textlich ausgewertet und anhand gerenderter Seiten visuell geprüft. Besonders relevant: Hauptaufgabe und Jurykriterien auf S. 1–2, Partnerbausteine auf S. 3–11, Datenhandout auf S. 12–13.
- Alle zwölf Folien sowie die vorhandenen Notiztexte aus `2026_09_08_Vorstellung_Eröffnung_V2.pptx` wurden ausgelesen. Die Folien wurden nicht in PowerPoint geöffnet. Folien 8–10 liefern Ergebnis-, Pitch- und Zeitvorgaben.
- README, vorhandene Analyse, die vier Foodsharing-Dokumentationen, Mobilitätskatalog und beide Herkunftsdateien wurden gelesen.
- Das PostgreSQL-Schema, Importcode, Docker-Konfiguration, Prüf-SQL und vorhandene Tests wurden gelesen. Der Import und seine Tests wurden für diese Prompt-Erstellung nicht gestartet.
- Die CSV- und entpackten GTFS-Dateien wurden direkt gezählt; die EFA-Arbeitsdatei wurde byteweise mit ihrer Originalsicherung verglichen. Das 7z-Archiv wurde bei dieser Arbeit nicht erneut entpackt oder gegen die entpackten Dateien geprüft.
- Zugangsdaten wurden nicht in die Ergebnisdateien übernommen. Die lokale Foodsharing-Keydatei wurde für die Prompt-Erstellung nicht ausgelesen. Es wurden keine geschützten Partnertransaktionen, Reservierungen, Ausleihen oder Rückgaben ausgeführt.

Die veranstaltungsbezogenen Angaben wurden zusätzlich mit der [offiziellen Hackathon-Seite](https://hackathon.fes-frankfurt.de/#t79488-01) im Browser abgeglichen. Die [Vytal-Hackathon-Dokumentation](https://app.notion.com/p/vytal-col/Vytal-x-FES-Hackathon-Technical-Documentation-57622b6fddc3821ba7a00156eb4aa4ee) war ebenfalls im Browser lesbar. Ausgewertet wurden die sichtbaren Verträge für Store-Suche, Nutzeranlage, Checkout, Behälterhistorie, CO₂-Werte, Codeprüfung und Rückgabe. Der konkrete Vertrag des eingeklappten Store-Bestandsabschnitts wurde nicht übernommen; der Prompt fordert dessen Prüfung vor Implementierung.

Die Struktur berücksichtigt die aktuellen [offiziellen Empfehlungen für GPT-6 Astra](https://developers.openai.com/api/docs/guides/latest-model): klarer Aufgabenrahmen, ausdrücklich gewünschte Eigenständigkeit, präzise Arbeitsgrenzen und angemessene Verifikation. Die ausführlichen fachlichen Anforderungen stammen aus dem Briefing und den Hackathon-Unterlagen; es werden keine besonderen Modellparameter oder unbelegten Fähigkeiten vorausgesetzt.

Als geeignete Quelle für später zu prüfende Mobilitätsfaktoren ist die [UBA-Seite zu Emissionsdaten](https://www.umweltbundesamt.de/themen/verkehr/emissionsdaten) aufgenommen. Ihre Vergleichstabelle verweist beim Abruf auf das Bezugsjahr 2024. Der Prompt übernimmt keine ungeprüften numerischen Faktoren.

## Wichtige Präzisierungen

| Thema | Im Prompt gelöst |
|---|---|
| „100 % gewinnen“ | Als hoher Qualitätsanspruch und Arbeit an den Jurykriterien formuliert; keine Erfolgsgarantie |
| Fünf Partner, vier Navigationseinträge | Transdev und traffiQ teilen den Mobilitätsbereich, behalten getrennte Fachverantwortung |
| Vollständigkeit versus Hackathonzeit | Alle Wünsche bleiben in der Anforderungsmatrix; Umsetzungstiefe und Fallbacks werden priorisiert |
| Ältere lokale Analyse | Datenbefunde werden genutzt; abweichende Design-/Scopeempfehlungen überschreiben die aktuellen Wünsche nicht |
| EFA-Dokumentation | 50 tatsächliche Originalzeilen statt der teilweise dokumentierten 5.699; fehlende Simulation wird nicht erfunden |
| Historischer GTFS | Fahrplan von 2025 wird nicht als Livefahrplan für September 2026 ausgegeben |
| Erwähnte HTML-Datei | Im untersuchten Projekt nicht vorhanden; gezielte spätere Suche vorgesehen, keine erfundene Begutachtung |
| NFC | Wiederverwendbarer Fahrzeugtag startet eine Nutzersitzung; die Einmaligkeit betrifft die belohnte Fahrt |
| Fahrzeug-GPS | Vergleich nur bei vorhandenem Feed; ein passiver NFC-Tag liefert keine Fahrzeugposition |
| Privatadresse und exakte Reisezeit | Vor Berechtigung gerundete Zeit/Spanne; präzise Reisezeit könnte den Ort über wiederholte Anfragen verraten |
| Reservierungen | Eigene Mengen-/Slotfunktionen werden von der dokumentierten Ganzkorb-Reservierung unterschieden |
| Fairteiler | Offene Regale bleiben offen; digitale Reservierung garantiert dort ohne Organisation keinen physischen Bestand |
| Punktesystem | Eine gemeinsame Währung mit erklärt sichtbarem Prüfstatus und Einlöseberechtigung |
| Ranglisten | Freunde, Bezirke und Top 100 bleiben enthalten; freiwillige Teilnahme und faire Vergleichsregeln ergänzen sie |
| Belohnungen | Deutschlandticket und Kino bleiben ausdrücklich enthalten; reale Zusagen setzen Finanzierung und Partnerbedingungen voraus |
| Müllbetrug | Keine angebliche hundertprozentige Foto-/KI-Erkennung; konkrete alternative Nachweisverfahren |

## Abdeckung des ursprünglichen Briefings

Die Abschnittsnummern beziehen sich auf den Masterprompt. „Enthalten“ bedeutet, dass die Anforderung als Arbeitsauftrag erhalten ist; es bedeutet nicht, dass die App bereits umgesetzt wurde.

| Nr. | Wunsch oder Detail aus dem Briefing | Abschnitte |
|---:|---|---|
| 1 | Gemeinsam als Hackathon-Team auf ein bestmögliches Ergebnis hinarbeiten | Einstieg, 1, 3, 18–23 |
| 2 | Alle lokalen Dateien analysieren und wichtige Informationen extrahieren | 2, 10, 22 |
| 3 | Veranstaltung und Partnerkontext berücksichtigen | 2–4, 21 |
| 4 | Repository und vorhandene APIs tatsächlich nutzen | 2, 7–10, 17, 19–20 |
| 5 | Eine funktionierende gemeinsame App statt isolierter Unternehmenslösungen | 4–5, 17–20 |
| 6 | Mobile Anwendung für Android und iOS | 4–5, 9, 17, 20 |
| 7 | Einfache, intuitive, schnell erreichbare Funktionen | 4–6, 19–20 |
| 8 | Breite Zielgruppe ab ungefähr zwölf Jahren | 4, 13, 17 |
| 9 | Mehrere Sprachen und zugängliche Bedienung | 5, 20 |
| 10 | Jede Person arbeitet in eigenem Branch und eigenem Softwarebereich | 1, 18 |
| 11 | Alle behalten dennoch den Gesamtkontext | 2, 18, 22 |
| 12 | NFC in Bus und Bahn scannen | 9, 20 |
| 13 | Fahrt nach Einstieg erfassen und analysieren | 9–10, 15 |
| 14 | Fahrt manuell beim Aussteigen beenden | 9 |
| 15 | Fahrtende automatisch anhand abweichender Bewegung erkennen | 9 |
| 16 | Fahrzeug-/Nutzer-GPS vergleichen, soweit verfügbar | 9 |
| 17 | Punkte erst anhand einer plausibel abgeschlossenen Fahrt | 9, 12, 14 |
| 18 | Wiederholtes Scannen darf nicht erneut belohnen | 9, 14, 20 |
| 19 | Pfandprinzip als Inspiration für einmalige Anerkennung | 8, 11, 14 |
| 20 | Freunde hinzufügen und Fortschritte vergleichen | 13 |
| 21 | Konkurrenz zwischen Bezirken beziehungsweise PLZ-Gebieten | 13 |
| 22 | Erkennen, welches Gebiet im Vergleich besser abschneidet | 5, 13 |
| 23 | Top-100-Liste mit Anerkennung und Belohnungskonzept | 13 |
| 24 | Gesammelte Punkte gegen Vorteile eintauschen | 12–14 |
| 25 | Deutschlandticket als möglicher Reward | 13 |
| 26 | Kostenloser Kinobesuch als möglicher Reward | 13 |
| 27 | Psychologische Begründung des Punktesystems | 12–13 |
| 28 | Kobra-Effekt und andere Fehlanreize vermeiden | 11–14, 20 |
| 29 | Nachhaltigeres Verhalten und Bewusstsein statt bloßer Punktesammlung | 4, 11–15 |
| 30 | Chamäleon zeigt Entwicklung und Nachhaltigkeitsfortschritt | 5, 13 |
| 31 | Chamäleon ändert Farbe je Partnerbereich | 5 |
| 32 | Start bei FES mit dunkelblauem Chamäleon | 5 |
| 33 | Vier Einträge in der unteren Navigationsleiste | 5 |
| 34 | Unternehmensbezogene Seiten und Farben | 5 |
| 35 | Startseite mit Punkteranking | 5, 13 |
| 36 | Startseite mit persönlichem CO₂-Vergleich | 5, 15 |
| 37 | Weltkarte/Globus, Fahrzeug und Chamäleon zeigen zurückgelegte Strecke | 5, 13 |
| 38 | Wachsende Pflanze als Fortschrittsidee | 5, 13 |
| 39 | „Good to Go“ als einfaches Angebots-/Abholerlebnis | 4, 6 |
| 40 | Tägliche und wöchentliche Missionen | 5, 11–13 |
| 41 | Nachhaltigkeitsquiz mit Punkten | 11–13 |
| 42 | Streak nach dem Vorbild von Duolingo | 5, 13 |
| 43 | FES-Vortrag und gewünschte Belohnungen für nachhaltiges Handeln | 3–4, 11–14 |
| 44 | Gefundenen Müll aufheben und entsorgen | 11 |
| 45 | Betrug durch selbst hingeworfenen Müll verhindern beziehungsweise begrenzen | 11–12, 20 |
| 46 | Inspiration aus anderen Städten und Ländern | 11 |
| 47 | Vytal-Schalen/Tassen ausleihen und zurückgeben | 8 |
| 48 | Nächste Vytal-Abhol- und Rückgabestellen auf der Karte | 5, 8, 16 |
| 49 | Nachhaltige Angebote möglichst nah und einfach nutzbar machen | 4–6, 8–9, 16 |
| 50 | Foodsharing-WhatsApp-Gruppen je Stadtteil berücksichtigen | 6 |
| 51 | Foodsaver holen Waren bei kooperierenden Geschäften ab | 6–7 |
| 52 | REWE als Gesprächsbeispiel, keine erfundene Partnerschaft | 6 |
| 53 | Unklarer Warenmix, beispielsweise viele Laugenstangen | 6 |
| 54 | Unangekündigte Besucher zu gewohnten Zeiten vermeiden | 6 |
| 55 | Freie Regale für Menschen ohne Registrierung | 6 |
| 56 | Abgeben und Mitnehmen an Fairteilern sinnvoll anerkennen | 6, 12 |
| 57 | Bestand bei Regal und privater Verteilung sichtbar machen | 6–7 |
| 58 | Reservierungen vermeiden vergebliche Wege | 6 |
| 59 | Einzelne sollen nicht alles reservieren oder mitnehmen | 6, 12 |
| 60 | Reservierte Mengen für andere sichtbar reduzieren | 6–7 |
| 61 | Einfache Stornierung und begrenzte Reservierungszeit | 6–7 |
| 62 | Gegen Missbrauch von Reservierungen vorgehen | 6, 20 |
| 63 | Erwähnten Foodsharing-HTML-Prototyp untersuchen und übertreffen | 2 |
| 64 | Ehrenamtliche durch Automatisierung und einfachere Arbeit entlasten | 6, 16, 21 |
| 65 | Fotos/KI für Bestandserkennung | 6 |
| 66 | Hilfreiche Foto-/Bestandsupdates anerkennen | 6, 12, 20 |
| 67 | Genaue Saver-Adresse vor Reservierung schützen | 6, 14, 17, 20 |
| 68 | Vorher ungefährer Kartenpunkt, nach berechtigter Reservierung genaue Adresse | 6 |
| 69 | Reisezeit möglichst nützlich anzeigen, ohne Ortungslücke | 6 |
| 70 | Foodsaver-Rekrutierung, Quiz, Training und etwa drei Begleitabholungen | 6–7 |
| 71 | Hygiene und verantwortlichen Umgang berücksichtigen | 6 |
| 72 | Egoistisches Hamstern und Kreisläufe aus Abgeben/Abholen vermeiden | 6, 12 |
| 73 | Gemeinsame Historie über alle Aktivitäten | 5, 8–9, 14, 16 |
| 74 | Nachricht bei neuen Lebensmitteln eines Savers | 16 |
| 75 | Nähehinweis, im Briefing beispielhaft 100 Meter | 16 |
| 76 | Erinnerung an geliehene Vytal-Behälter | 8, 16 |
| 77 | Benachrichtigungen auch für andere geeignete Partnerfälle | 16 |
| 78 | Transdev-/traffiQ-Ziele aus den Gesprächen aufnehmen | 9–10 |
| 79 | Häufig oder selten genutzte Verbindungen und volle Fahrzeuge auswerten | 10 |
| 80 | Daten für Evaluation und Analysen bereitstellen | 10, 14–17 |
| 81 | Kosten, Energie und unnötige Betriebsfahrten reduzieren helfen | 10, 21 |
| 82 | Busfarben sind für die übergreifende UX nicht entscheidend | 5 |
| 83 | ÖPNV, Fahrrad, E-Scooter, Auto und Zufußgehen erfassen | 9, 15 |
| 84 | Verschiedene Verkehrsmittel einzeln auswerten und vergleichen | 9–10, 15 |
| 85 | CO₂ durch greifbare Alltagsvergleiche verständlich machen | 4–5, 15 |
| 86 | Langfristige Verhaltensänderung und Regelmäßigkeit fördern | 9, 12–13 |
| 87 | Nicht nur die bereits besten oder aktivsten Nutzer belohnen | 12–13 |
| 88 | Gemeinsame Punkte für sämtliche Partner | 12, 14, 17–18 |
| 89 | FES-Lernen mit Gamebooks oder anderem passenden Prinzip | 11 |
| 90 | Lernkonzept sinnvoll in die normale UX einfügen | 5, 11, 13 |

## Ergänzungen aus den lokalen Unterlagen

Über das ursprüngliche Briefing hinaus berücksichtigt der Prompt die offiziellen Definitionen der fünf Bausteine, die Jurykriterien, Pitchdauer und GitHub-Ablage. Er bindet die bestehenden PostgreSQL-Importtabellen ein, unterscheidet Datenherkunft und Nachweisqualität und nennt die konkreten Foodsharing- und Vytal-Verträge. Technische Datenfallen wie Shape-IDs, Tagesüberläufe, fehlende Stationshierarchien und synthetische Sharing-Zeilen sind erhalten.

Der Masterprompt ist ein Arbeitsauftrag für die anschließende Entwicklung. Die App selbst wurde in diesem Auftrag nicht gebaut. Bestehende Projektdateien wurden für die Prompt-Erstellung nicht inhaltlich verändert.
