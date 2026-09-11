# Nutzerführung, Gestaltung und Demo

## Gemeinsame App

Arbeitstitel **MainWandel**, eigener Designvorschlag ohne Markenfreigabe. Vier dauerhaft beschriftete Bereiche: Gemeinsam/FES, Essen retten/Foodsharing, Mehrweg/Vytal, Mobilität/Transdev und traffiQ. Profil und Historie liegen am gleichen Ort. Kein zweiter konkurrierender Navigationssatz. Typografie systemnah, ruhige weiße Flächen, klare Umgebungslabels, kurze nächste Aktion statt großer Kennzahlwand.

| Bereich | Eigener Farbton | Chami und Inhalt |
|---|---|---|
| Gemeinsam | Dunkelblau `#102b54` | Dunkelblaues Chamäleon, Lernmission, gemeinsamer Fortschritt |
| Essen retten | Grün `#31643a` | Grüner Chami im Kopf, Orte/Verfügbarkeit/Nachweis |
| Mehrweg | Beere `#7c3155` | Passender Chami, Rückgabe-/Fristkontext |
| Mobilität | Blau `#245e86` | Passender Chami, freiwillige Fahrt und getrennte Datenanalyse |

Farbe ist ergänzend; Überschrift, Text und Status tragen die Information. Die lokale SVG-Welt ist ein Spielsymbol, keine reale Aufforstung. Als Ausbau: ab 30/70 Punkten Pflanzenschritte derselben Welt, optional kurze Bewegung des Chamäleons im gewählten Verkehrsmittel. Reduced-motion ersetzt sie durch eine statische Zustandsänderung. Keine Weltfortschritte allein für zusätzliche Kilometer. Keine Verlustanimation bei einer Pause.

## Personas und vollständige Ziel-Journeys

| Person | Journey | Stand / offene Abnahme |
|---|---|---|
| Spontan suchende Person | Gebiet wählen → Karte/Liste → Verfügbarkeit und Hinweise → betreute Abholung reservieren → Übergabe → Historie | Orte und manueller Einstieg demonstrierbar; Reservierung im Foodsharing-Modul offen |
| Foodsaver | berechtigtes Profil → unerwartete Waren schnell erfassen → Vorlagen/Abholfenster → Queue/Pause → Übergaben bestätigen | Saver-Verwaltung spezifiziert; Mengen und Slots fehlen in Upstream, eigene Erweiterung nötig |
| Pendlerin | Station wählen → bewusst starten → Standort optional erklären → Fahrtende korrigieren → Gründe und Referenzvergleich | Aktuell nur gemeinsame Fixtureübergabe, keine tatsächliche Erkennung |
| Person mit eingeschränkter Mobilität | Liste statt Karte → passende Lern-/Vermeidungsaufgabe → Fortschritt ohne Fahrtpflicht | Lernfixture und Listenansicht; native Assistenztechnik offen |
| Neue Person ohne Ortung | Innenstadt/Bockenheim/etc. manuell → Hinweise → keine Berechtigungshürde bei öffentlichen Orten | Manuelle Suche getestet; keine Geräteortung angefordert |
| Mehrwegpartner | Storeberechtigung → QR prüfen → zugeordneten Testbehälter ausgeben → berechtigt zurücknehmen → Zyklus abgleichen | Fachadapter offen, gemeinsame Fixtures und öffentliche Orte vorhanden |
| Mobilitätsplaner | Rolle prüfen → Zeitraum/Quelle/Original vs. Simulation → Nenner und Aggregat → Hypothese statt automatische Linienkürzung | Tagesprofil originaler Datei dargestellt; geschützte Partneranalyse offen |

## Screenübersicht und Zustände

Startseite: nächste Handlung, wenige getrennte Punktestände, Lernkarte, Wochenroutine, nächste Orte, freiwillige soziale Ausbauziele. Profil: lokales Demo-Profil, anerkannt/ausstehend/verfügbar und persistent gespeicherte Historie. Foodsharing: manueller Suchpunkt, 5-km-Luftlinienfilter, Liste und geografische Übersicht, Quelle/Abrufzeit und unbekannter Bestand. Mehrweg: öffentliche Partner, klar eigener Rückgabefixture, sichtbare Replayprüfung. Mobilität: eigener plausibler Fahrtnachweis und echtes geliefertes Stundenprofil in separater Darstellung.

Die externe eingebettete OpenStreetMap-Karte blieb bei der Browserprüfung leer. Die endgültige Demo verwendet deshalb eine **lokal gerenderte geografische Standortübersicht ohne Straßenebene** mit echten Partnerkoordinaten, Maßstab und Listenalternative. Der freiwillige externe OpenStreetMap-Link ermöglicht eine Straßenkarte, benötigt aber Netz. Keine private Adresse oder Nutzerortung wird dafür übertragen. Kein Navigations-/Wegezeitanspruch für Luftlinienwerte.

Später aktive Vorgänge auf Start priorisieren: Reservierung angenommen/noch offen, Frist mit konkretem Zeitpunkt, Fahrt läuft, Rückgabe ausstehend. Offlinevorgänge bleiben ausstehend, nie abgeschlossen. Nicht verfügbare Bestände werden nicht als leer oder sicher vorhanden ausgegeben. Storno, No-show und Ausnahmen benötigen verständliche nächste Schritte, keinen beschämenden Text.

## Sprache und Zugänglichkeit

DE/EN-Textkatalog in `shared/web/app.js`, Zahlen/Datum via Intl und klarer Zeitzone Europe/Berlin. Sprachwechsel erhält den aktuellen Bereich und die gespeicherte Historie. Eigennamen der Partnerorte bleiben Originalnamen. Weitere Sprachen über neue Kataloge; arabische/spätere RTL-Lokalisierung zusätzlich mit dir=rtl und Layouttest, aktuell nicht behauptet.

Native Buttons, Fokusmarkierung, Skip-Link, semantische Überschriften, Dialog mit Escape/Schließen, Statusnachrichten via live region und Text statt reiner Farbe. Normaler Haupttext 16 px, Aktionsziele mindestens 44–48 px, kompakte Navigationslabels auf kleinen Screens 12 px. Diese kleinen Labels und volle Textvergrößerung bleiben ein gezielter Ausbaupunkt. Keine Animation, daher keine Bewegungsbarriere in der Demo. Datenchart besitzt eine textliche Stundenliste. Kein vollständiges WCAG-Konformitätsurteil ohne Audit und Assistenztechniktests.

Lernbeispiele für den Ausbau: vorhandene Einkaufstasche einsetzen; vor einer Abholung Bedarf und erlaubte Menge prüfen; fremde Privatadresse nicht weitergeben; bei unsicherer Lebensmittelverträglichkeit keine Foto-KI als Freigabe verwenden. Lebensmittelhygiene und konkrete Mülltrennungsantworten erst mit fachlich geprüfter offizieller Quelle veröffentlichen. Bilderkennung liefert allenfalls editierbare Vorschläge mit Unsicherheit und entfernt unnötige Metadaten; keine Verzehr- oder Allergenfreigabe.

## Aktuell ehrliches Demo-Drehbuch (10 Minuten)

| Zeit | Handlung / Aussage | Jurybezug |
|---|---|---|
| 0:00–1:00 | Alex plant den bestehenden Heimweg: verstreute Angebote und unklare Verfügbarkeit kosten Zeit. Gesprächsbriefing, keine gemessene Marktstudie. | Nutzerwert |
| 1:00–2:00 | Vier Bereiche, Chami, manuelles Gebiet und gemeinsames Profil erklären. | Verständlicher Nutzerfluss |
| 2:00–3:00 | Essen retten: echten API-Snapshot, unbekannten Bestand, Gebiet und Standortübersicht zeigen. Für einen Livebeleg read-only Probe ausführen. | Reale Datenintegration |
| 3:00–4:00 | Lernfrage beantworten, +3 Demopunkte, Historie öffnen. | Niedrigschwelliger FES-Beitrag |
| 4:00–5:00 | Mehrwegfixture auslösen, +10, denselben Nachweis erneut prüfen: +0. Klar sagen: echte Standorte, eigener Aktionsfixture. | Nachweis-/Rewardlogik und ehrlicher Prototyp |
| 5:00–6:00 | Foodsharing-Nullpunkte wegen `may_earn_rewards=false`; keine manipulierte Verifikation. Standortfreigabe nicht verlangt. | Fairness und Berechtigungen |
| 6:00–7:00 | traffiQ-Stundenprofil: 567.200 Suchanfragen/Durchschnittstag, unbekannter Bezugszeitraum. Historie nicht mit heutiger Nutzung vermischen. | Datenqualität und Aussagegrenzen |
| 7:00–8:00 | Gemeinsam: Adapter → Nachweis → Journal. Keine CO₂-Zahl erfinden. Falls verlangt 5-km-Rechenbeispiel aus Reward-/Impactdokument als Schätzung erläutern. | Architektur, Wirkung |
| 8:00–9:00 | Pilotmessung, freiwillige Teilnahme und finanziertes Kontingent statt unbegrenzter Gutscheine. | Nutzen, Wirtschaftlichkeit |
| 9:00–10:00 | Ergebnis und nächste konkrete Integration: eigener Foodsharingkorb oder zugewiesener Vytal-Testzyklus. Grenzen offen benennen. | Pitchqualität |

Dieses Drehbuch ist auf den heutigen Funktionsstand abgestimmt. Sobald ein Fachmodul geliefert wird, ersetzen echte Sandboxaktionen die Fixtureminute. Eine Rückgabesimulation darf nicht als Partnertransaktion vorgeführt werden. Ein gesicherter API-Abruf ist kein Livebestand.

## Fünf Minuten Fragen

- **Wie verhindert ihr Betrug?** Eindeutigkeit, Transaktionen und Caps sind getestet; sie verhindern Replays, keine erfundenen neuen Handlungen. Stärkere Nachweise, Rollen und Moderation kommen aus Fachmodulen.
- **Warum kein CO₂-Gesamtwert?** Mengen und geeignete Referenzen fehlen. Punkte sind Anerkennung. Zeigbare Vergleichsrechnung ist getrennt und mit Quelle belegt.
- **Wo ist NFC?** Im Pilotplan. Kein physischer Scan/GPS-Nachweis implementiert; statischer Tag allein beweist keine Fahrt.
- **Was ist wirklich integriert?** Öffentliche Foodsharing-/Vytal-Abrufe und lokale traffiQ-Datei. Geschützte Foodsharing-Identitätsabfrage getestet. Schreibende Partnerprozesse offen.
- **Wie schützt ihr private Abholung?** Geschützte Adresse erst nach berechtigter Vereinbarung; keine Privatdaten in teamübergreifender Sandbox. Im aktuellen Client nur öffentliche Quellorte.
- **Wer bezahlt Gutscheine?** Noch niemand zugesagt; Budgethypothese und Reservierungsprozess spezifiziert. Demopunkte schaffen keinen Anspruch.
- **Skaliert das?** Architektur mit begrenzten Serverantworten und zentralen Buchungen; keine große GTFS-Datei im Client. SQLite ist Referenz, Last-/Produktionsbetrieb und PostgreSQL-Anbindung offen.

## Pilot und messbarer Nutzen

Vorschlag, keine gemessenen Resultate: zwei Wochen mit 30–50 freiwilligen Erwachsenen, zwei betreuten Verteilorten und einem Mehrwegpartner, erst nach deren Zustimmung. Einführen mit Ausgangswerten: Anteil vergeblicher Abholwege, Minuten Koordinationsaufwand pro Übergabe, pünktliche Rückgaben, sinnvoll wiederkehrende Beteiligung, Anteil akzeptierter/unklarer Nachweise, strittige Gutschriften und Verständnis der Wirkungsanzeige.

Vorher/nachher per kurzen freiwilligen Abfragen und minimierten Ereignissen vergleichen, Fallzahlen und Ausfälle mitberichten. Zielhypothesen beispielsweise 20 % weniger vergebliche Abholwege und 15 % weniger Koordinationsminuten; Konfidenz und Ausgangslage prüfen statt Erfolg vorwegzunehmen. FES betrachtet Lernen/Engagement, Foodsharing Koordinationsentlastung, Vytal Rückgabeverhalten, Transdev freiwillige plausible Reisen, traffiQ geeignete Aggregate. Punkteanzahl allein ist kein Umweltindikator.

## Probe und Fallback

Frische Datenbank starten (`START.ps1 -Database .runtime/probe-02.sqlite`), vier Bereiche und Sprache prüfen. Datenbankdatei behalten, um Persistenz nach Neustart zu zeigen. Keine Partnerflags zurücksetzen. Schlüssel ausschließlich im Backend, Prüfbericht enthält nur nichtgeheime Testnutzerzuordnung. Bei fehlendem Netz funktionieren Standorte aus dem gespeicherten API-Abruf, Stundenprofil, lokale Karte, Lernmission und Ledger weiter. Liveprobe bei Netzfehler abbrechen und Snapshot ehrlich kennzeichnen. Keine Backups als Liveaktionen ausgeben.

Bis 14 Uhr Funktionen einfrieren; zwei Proben mit je zehn Minuten, Tastaturbedienung, Fehlertext, Nullpunkte und Replay einschließen. Native Android-/iOS-Tests mit Gerät/OS/Build dokumentieren; derzeit liegen solche Tests nicht vor. Keine Videoaufnahme wurde erstellt.
