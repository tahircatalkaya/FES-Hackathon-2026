# Funktionsstand und Prüfprotokoll

Prüfung am **11.09.2026**, Windows / Python 3.12.14 / Node 22.18.0 / Codex In-App-Browser, Branch `codex/plattform-grundlagen`. Ausgangscheckout ohne Appcode. Die gemeinsame Grundlage ist nutzbar; vollständige Fachmodule und reale Android-/iOS-App sind noch nicht geliefert. Es gab keine ausdrückliche Modulzuordnung, keine schreibenden Partnertests, keine Veröffentlichung und keinen Push nach GitHub.

## Einheitlicher Funktionsstatus

| Funktion | Status | Umgebung / konkreter Nachweis / Grenze |
|---|---|---|
| Vier Bereiche, Chami, Quellenhinweise | implementiert und getestet | Lokale Browserdemo; visuelle Desktop-/Mobilprüfung |
| Deutsch und Englisch | implementiert und getestet | Sprachwechsel im Mobilitätsbereich erhält Ansicht; identische Schlüsselmengen geprüft |
| Manuelles Suchgebiet und Entfernungsfilter | implementiert und getestet | Öffentliche API-Snapshots; Bockenheim/Innenstadt ohne Ortung |
| Öffentliche Foodsharing-/Vytal-Orte | implementiert und getestet | Öffentliche Partner-API: 28 Fairteiler, maximal 20 Vytal-Partner; Snapshot in UI, kein Livebestand |
| Standortkarte und gleichwertige Liste | implementiert und getestet | Lokale Koordinatenkarte ohne Straßenebene; externer OSM-Link. Eingebettete Straßenkarte funktionierte im Test nicht und wurde ersetzt |
| Gemeinsame persistente Historie / Journal | implementiert und getestet | Lokale SQLite; Browserreload, neuer Ledger-Zugriff, Replay und Konkurrenz |
| Punkte-/Nachweis-/Umgebungstrennung | implementiert und getestet | Lokale Demo / Partner-Sandbox im Referenzschema; Produktion gesperrt, Einlöseguthaben immer 0 |
| FES-Lernmission mit einmaligem Fortschritt | implementiert und getestet | Eigene lokale Lern-/Integrationsdemo, kein gemessener Umweltbeitrag |
| Mehrweg-Rückgabenachweis | eigene Simulation | Fixture durch Journal getestet; keine echte Ausleihe/Rückgabe, Frist oder Storebestätigung |
| Mobilitätsnachweis | eigene Simulation | Fixture mit plausible-Status; keine GPS-Erkennung und kein physischer Scan |
| traffiQ-Stundenprofil | implementiert und getestet | Gelieferte Originaldatei; 24 Stunden, Summe 567.200 Suchanfragen, Referenzzeitraum unbekannt |
| Foodsharing-Key und Nutzerwahl | implementiert und getestet | Partner-Sandbox, read-only; Nutzer 21/31 jeweils korrekt ausgewählt, beide unverifiziert |
| Vollständige Korbreservierung/Abholung | spezifiziert | Fachmodul-/Personenzuordnung offen; eigene Testkorb-E2E-Prüfung nicht ausgeführt |
| Foodsharing-Rewardbindung | implementiert und getestet | Referenzfixture mit `may_earn_rewards=false` ergibt keine Punkte |
| Vytal-Zyklus mit echtem Testbehälter | blockiert | Kein bestätigter Testbehälter; widersprüchlicher Merchant-Host muss geklärt werden |
| Private Adressen, Mengen/Slots, Saver-Verwaltung | spezifiziert | Eigene Erweiterung, keine entsprechende sichere UI/API implementiert |
| NFC / Kamera / Hintergrundtracking | später | Native Integration und Gerätezugang erforderlich |
| Fahrtzustandsautomat / GPS-Negativfälle | spezifiziert | Keine Erkennung implementiert, daher keine Erkennungsquote |
| Impact-Vergleich unbekannt/negativ/mehrteilig | implementiert und getestet | Rechenfunktion; Testfaktoren ausdrücklich Fixtures. Keine individuelle CO₂-Anzeige |
| Produktions-Rewardbestand / Einlösung | spezifiziert | Noch kein Sponsor, kein Anspruch, keine produktive Ausgabe |
| Freunde, Blockieren, freiwillige Top 100, Bezirke | später | Regeln dokumentiert; keine künstlichen Communitydaten in UI |
| Wochenstreak, Level, Globus/Fahrzeug, Pflanze | spezifiziert | Einfacher Fortschrittsbalken und symbolische Welt vorhanden; vollständige Spiellogik offen |
| Fotos / KI / Spracheingabe | später | Kein Modell angebunden; Hygiene-/Metadatenregeln dokumentiert |
| Push, Ruhezeiten und Abonnements | später | Zentraler Ereignis-/Outboxvertrag spezifiziert |
| Nachprüfung ausstehender Nachweise | spezifiziert | Referenz hält pending fest; noch keine berechtigte Auflösung/Moderation |
| PostgreSQL und umfassende GTFS-Abfragen | spezifiziert | Die im Prompt genannte DB fehlt; Archiv vollständig lesend geprüft, keine DB erfunden |
| Native Android-/iOS-Builds und Storeinstallation | später | Keine physischen Geräte und kein nativer Build getestet |

## Ausgeführte automatisierte Prüfungen

`python -m unittest discover -s tests -v`: **18 Tests bestanden**. Ein anfänglicher Windows-Dateihandlefehler im Testcleanup wurde durch explizites Schließen des Testzugriffs behoben; der anschließende vollständige Lauf war erfolgreich.

| Prüfgruppe | Tatsächlich geprüft |
|---|---|
| Doppelgutschrift | 32 konkurrierende Einreichungen desselben fachlichen Events: eine Gutschrift; neue Request-ID / Regelversion dupliziert nicht |
| Neue Ereignisse / Limits | 30 konkurrierende unterschiedliche Zyklusschlüssel: Tagescap eingehalten; neuer legitimer Zyklus gespeichert, nächste Tage/Wochen berücksichtigen Caps |
| Identität / Umgebung | Falscher Principal und fremder Anspruch abgewiesen; Produktion gesperrt; Sandboxkonto nicht in lokale Summe gemischt |
| Pending / Zeit / Partnerflag | Unklarer Nachweis und zu alte/zukünftige Ereignisse unbezahlt; unverifizierte Foodsharingaktion unbezahlt; Offset und Pflichtfelder validiert |
| Korrektur | Berechtigung nötig, Gegenbuchung idempotent, Journal append-only, Replay nach Korrektur erzeugt keine neue Gutschrift |
| Wirkung | Fehlender Faktor ist null, negative Differenz bleibt negativ, alle Teilstrecken berücksichtigt, ungleiche Bilanzgrenzen abgelehnt |
| HTTP-Grenze | Keine Auslieferung von Keydatei, Repositorycode oder .git; Client kann keine user_id/Punkte angeben; cross-origin POST abgewiesen |
| HTTP-E2E | Fixture → Journal → Kontolesen; wiederholt +0; Foodsharing-Nullpunktfall |

Zusätzlich: JavaScript-Syntaxprüfung, gleiche DE-/EN-Schlüssel, `git diff --check`; neue Text-/Codeartefakte auf JWT-/Team-Key-Muster geprüft, kein Treffer. Das ist keine umfassende Sicherheitszertifizierung. Fachliche Anti-Farming-Prüfungen über neue falsche Ereignisse hinaus sind noch offen.

## Daten- und Partnerprüfung

Alle 13 PDF-Seiten textlich ausgewertet; S.2 und S.12 gerendert und visuell geprüft. Texte und Notizen aller zwölf PowerPoint-Folien gelesen. Extrahierte Rastergrafiken als Kontaktübersicht kontrolliert: Geschäftsfelder, Fotografien und Logos, keine zusätzlichen versteckten Testdaten. Keine Prüfung in PowerPoint selbst; vollständige visuelle PPTX-Renderprüfung bleibt offen.

CSV-Bericht reproduzierbar aus Originaldateien: AFZ 100 Zeilen 30.04.2024 + 942 Zeilen 15.09.2025; Datei-SHA stimmt mit AFZ-Herkunft überein. EFA 50, gleiche SHA wie Originalsicherung; keine erzeugte Ergänzung. 79 Haltestellen ohne Koordinaten. Sharing 20 nextbike-Originalzeilen + je 3.360 synthetische Rad/Scooter-Zeilen. GTFS per tar neu entpackt, alle acht Tabellen gestreamt, 515 fehlende Eltern-IDs, 5.119 Shapes, nach `.0`-Normalisierung keine unzugeordneten trip-Shape-IDs, maximal 112.740 Sekunden. Archive/CSV-Quelldateien unverändert.

Foodsharing um 19:38:46 UTC: OpenAPI 2.4.0, 28 Fairteiler, `/users`, zwei getrennte `/users/me`-Abrufe und jeweils erste Historienseite erfolgreich. Testnutzer 21 und 31, Team 1, `may_earn_rewards=false`, Schwelle drei. Vytal GraphQL-Abfrage öffentlich: 20 Ergebnisse, kein GraphQL-errors-Feld. Vytal-Notion bis zum eingeklappten Storebestandsabschnitt gelesen. Keine geschützte Vytal-Transaktion ausgeführt. Schlüssel nicht in Berichte/Client übernommen.

## Tatsächlich ausgeführte Browserprüfungen

- Desktopansicht visuell geprüft; mobile Viewports **390×844** und **320×800** geprüft. Das sind Browsergrößen, keine physischen Android-/iOS-Tests.
- Lernmission geöffnet, richtige Antwort, +3, Wiederholung ohne zweite Gutschrift, Historie zeigt einen Eintrag.
- Rückgabefixture +10, erneuter Nachweis sichtbar ohne zweite Gutschrift; Fahrtnachweisfixture +5.
- Sprachwechsel DE→EN im Mobilitätsbereich erhält die aktuelle Ansicht; manuelle Gebietswahl Bockenheim, Foodsharing-Fixture ergibt erklärtes +0.
- Seite neu geladen: verdiente 18 Demopunkte und Journal erhalten. Rückwechsel nach Deutsch geprüft.
- Leere externe Karte entdeckt; auf lokale Karte umgestellt und visuell geprüft. Lange Ortsnamen führten bei 320 px zunächst zu Überlauf; flexiblen Textumbruch korrigiert. Danach Dokumentbreite = Inhaltsbreite (305 px im Browser mit Scrollbar), sowohl Start als auch Foodsharing.
- Browserkonsole im geprüften Verlauf ohne erfasste JavaScriptfehler. Ein externer Link ist kein getesteter Navigationsdienst.

## Offene, zwingende Fachabnahmen

Noch **nicht** bestanden: echter Partner-E2E-Zyklus; konkurrierende letzte Korbeinheit; Storno/Ablauf/No-show im Upstream; private Adressfreigabe einschließlich Payload/Logs/Route; Foodsaver-Mentorrechte; Vytal-Storeautorisierung und neue echte Zyklen; NFC-Hardware und Replay; GPS-Lücke/Tunnel/Umstieg/App-Neustart; Auto parallel/Haltestellenstillstand; Foto-/KI-Missbrauch; echte Rewardausgabe mit Bestand/Timeout; Ranglistenoptout und kleine Gruppen; Pushwiderruf; echte Android-/iOS-Geräte; Screenreader und vollständige 200-%-Schriftvergrößerung. Aufgaben und Reproduktionsziele stehen in den sechs Modulübergaben und im Auftragregister.

Geräteprotokoll für die nächste Abnahme: Gerät, OS, App-/Browserbuild, Datum, Netzstatus, Berechtigungen, Testkonto, Ausgangszustand, Handlung, sichtbares Ergebnis und Abweichung. Ohne diesen Beleg steht das Gerät auf Prüfung offen. Keine Bestätigung allein anhand eines Backenderfolgs.

## Nächster Integrationsschritt

Die Person-/Branch-Zuordnung bestätigen und den ersten Fachadapter anschließen. Foodsharing ist lesend vorbereitet; für eine gewünschte einmalige Punktegutschrift müssen Partnerberechtigung und unabhängiger Übergabenachweis geklärt sein. Alternativ Vytal-Testbehälter und Zielhost zuordnen. Gemeinsam verfügbare Referenz und Schnittstellen müssen dafür nicht neu gebaut werden.
