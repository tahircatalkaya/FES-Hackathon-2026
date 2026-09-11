# Gemeinsame Grundlagen – 11. September 2026

## Arbeitsbereich und tatsächlicher Stand

Branch `codex/plattform-grundlagen`, Ausgangscommit `ad09e1e`. Beim Start war der Checkout sauber. Es gab keine App und keine Modulzuweisung. Deshalb entstehen nur gemeinsame Verträge, Prüfwerkzeuge, Planungsunterlagen und eine ausdrücklich lokale Integrationsdemo. Fachmodule bleiben den noch zu benennenden Verantwortlichen vorbehalten. Es wurden keine KI-Subagenten eingesetzt, da der Auftrag ihre ausdrückliche Freigabe verlangt und diese noch fehlt.

Team 1 laut Eröffnungsfolie 12: Amal, Imad, Laroussi, Rania, Tabarek, Tahir; Raum Ernst. Die Folie weist keine Softwaremodule zu. Namen werden daher nicht willkürlich verteilt.

## Gesicherte Befunde

| Quelle / Fundstelle | Befund | Konsequenz |
|---|---|---|
| Gesamtaufgabe.pdf S. 1–2 | Mobile-first, fünf kombinierbare Bausteine, nachvollziehbare Nachweise, Fairness, Gemeinschaft | Durchgängige Journey zuerst; alle fünf Partner bleiben im Plan |
| Gesamtaufgabe.pdf S. 12 | Sandbox, Mock und Simulation zulässig | Umgebung und Herkunft immer sichtbar halten |
| Eröffnung, Folien 9–10 | Pitch 10+5 Minuten; 12.09. um 16 Uhr; GitHub verpflichtend | Funktionsstopp spätestens 14 Uhr, danach Probe und Reserve |
| Dateiinventar | `database/`, `compose.yaml`, `ANALYSE_UND_UMSETZUNGSPLAN.md` und entpacktes GTFS fehlen | Keine vorhandene PostgreSQL-Installation behaupten oder überschreiben |
| CSV-Prüfung | EFA 50×15, Originalkopie bytegleich; README/Katalog behaupten 5.699 | Mit 50 gelieferten Zeilen rechnen; nicht doppelt zählen |
| CSV-Prüfung | AFZ 1.042×21; Sharing 6.740×9; Tagesgang 24×2; Haltestellen 3.093×4 | Herkunftsfilter und Einheiten erhalten |
| GTFS-Archiv, neu in `.runtime/gtfs` entpackt | 1.918.201 stop_times, 100.483 trips, 515 fehlende Elternstationen, max. 112.740 Betriebstagsekunden | Serverseitiges Streaming, Text-IDs, keine aktuellen Abfahrten daraus |
| Foodsharing, 11.09.2026 19:38 UTC | OpenAPI 2.4.0, 28 Fairteiler; eigene Testnutzer 21 und 31; Headerauswahl geprüft | Bevorzugter erster echter Partnerablauf |
| Foodsharing /users | Beide Nutzer derzeit unverifiziert, `may_earn_rewards=false` | Keine automatische Gutschrift; Testflags nicht heimlich umstellen |
| Vytal, öffentlicher GraphQL-Abruf | 20 Standorte erfolgreich abgerufen | Standortsuche technisch erreichbar; Rückgaben noch nicht getestet |
| Vytal-Dokumentation | Team 1 / Demo-Store A; JWT storegebunden; Label und verlinkter Merchant-Host widersprüchlich | Vor Transaktionen Zielhost und Testbehälter klären |
| Originalunterlagen vs. Dateiinventar | GPS-Ground-Truth, DB-Zugang/Mapping, Livefahrzeuge, Knut, Forecast und MainLastenrad fehlen | Als Abhängigkeit erfassen, keine Leistungsquote oder Liveanzeige erfinden |

Das erwähnte Foodsharing-HTML ist im ursprünglichen Checkout nicht vorhanden. Neue HTML-Dateien dieser Umsetzung sind kein nachgereichter Partnerprototyp. PDF-Text aller 13 Seiten und Texte/Notizen aller zwölf Folien wurden ausgelesen; PDF-Seiten 2 und 12 visuell geprüft. Die PowerPoint wurde nicht in PowerPoint gerendert. Detaillierte Belege: `generated/inventory.json`, `data-audit.json`, `gtfs-audit.json`, `partner-probe.json`.

## Produktentscheidung vor dem Ausbau

Die Pilotperson möchte auf ihrem bestehenden Heimweg ein Angebot prüfen und einen sinnvoll belegten Beitrag verstehen. Der besondere Moment der Demo ist der Blick in denselben Nachweis aus Nutzer- und Systemperspektive: Herkunft, Bewertung, Punkte und ein wiederholter Abruf ohne zweite Gutschrift. Das Chamäleon erklärt diesen Vorgang. Eine bessere Zahl oder ein zusätzlicher Weg ist kein Selbstzweck.

| Funktion | Nutzerwert / Jurybezug | Aufwand / Risiko | Abhängigkeit / Verantwortung | Zieltermin (Berlin) | Fallback |
|---|---|---|---|---|---|
| Verträge, zentrales Journal und Herkunft | Verständliche und einmalige Anerkennung | 1–2 h / hoch | Plattform, Person offen | 11.09. 23:00 | Geprüfte lokale Referenz |
| Vier Bereiche, DE/EN, Chamäleon, Historie | Auffindbarkeit / Prototyp | 2–3 h / mittel | Plattform | 12.09. 01:00 | Lokale Browserdemo |
| Zwei-Nutzer-Korbablauf | Konkrete Entlastung / echte Integration | 2–3 h / hoch | Foodsharing, Person offen; Rewardfreigabe | 12.09. 10:00 | Öffentliche API plus als Simulation markierter Nachweis |
| Vytal-Zyklus | Rückgabe erleichtern / Nachweisqualität | 2–3 h / hoch | Vytal, Store A, Host und Testbehälter | 12.09. 10:00 | Öffentliche Partnerkarte, eigener Zyklusfixture |
| Lernmission / Clean-up | Niedrigschwelliger FES-Beitrag | 1–2 h / mittel | FES, geprüfter Inhalt / Organisator | 12.09. 11:00 | Lernfixture, kein CO₂-Wert |
| Fahrtzustände und Negativfälle | Freiwilligkeit / plausible Erkennung | 2–3 h / hoch | Transdev, eigene getrennte Testspuren | 12.09. 11:00 | Sichtbare Simulation ohne NFC-/GPS-Behauptung |
| traffiQ-Auswertung | Lokalen Kontext verständlich machen | 1–2 h / mittel | traffiQ, Herkunftsfilter | 12.09. 11:00 | Verifizierter Tagesgang ohne Fahrgastinterpretation |
| Geräte / Integration / Demo-Reset | Stabilität / Prototypqualität | 2 h / hoch | Alle, getrennte Abnahmezuständigkeit | 12.09. 14:00 | Laptopdemo und dokumentierte Gerätegrenzen |
| Pitchprobe und Ausfallreserve | Verständlicher Pitch | 2 h / mittel | Moderation/Pitch noch zuordnen | 12.09. 16:00 | Drehbuch, lokale Daten |

Zeitplanung ist ein Vorschlag mit paralleler menschlicher Arbeit. Frühstück 07:45, Mittag 12:00 und Workshop 13:00 reduzieren verfügbare Arbeitszeit. Am Prüfzeitpunkt 21:38 bleiben etwa 18 h 22 min bis zum angekündigten Präsentationsbeginn; keine Zusage aller Funktionen.

## Stack und Plattformen

Eine modulare App mit einem Backend ist das Ziel. Ohne bekannte Teamkenntnisse ist React Native/Expo mit TypeScript ein **Vorschlag**, keine bereits beschlossene Migration. Die isolierte Referenz verwendet Python/SQLite und eine kleine Browseroberfläche, damit Verträge und riskante Buchungsregeln sofort ohne Paketinstallation prüfbar sind. Sie legt den späteren App-Stack nicht fest. PostgreSQL wird erst nach Rücklieferung oder vereinbarter Neuanlage angebunden.

| Fähigkeit | Android-Ziel | iOS-Ziel | Lokale Webdemo |
|---|---|---|---|
| Vier Bereiche / DE–EN / Liste | Gemeinsame UI | Gemeinsame UI | Im Plattformbereich umsetzbar |
| NFC | Native Integration und Gerätetest nötig; Web NFC existiert in Chrome Android | Core NFC / native Integration und Gerätetest nötig | Kein NFC-Nachweis |
| Kamera / QR | Permission und Geräteprüfung | Permission und Geräteprüfung | Bewusste Auswahl als Fallback |
| Hintergrundortung | Development Build + Konfiguration | Development Build + Berechtigungen | Nicht implementiert |
| Persistente Punkte | Backend | Backend | Lokale SQLite-Referenz |

Quellen: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/), [Expo Permissions](https://docs.expo.dev/guides/permissions/), [Chrome Web NFC](https://developer.chrome.com/docs/capabilities/nfc), [Apple Core NFC](https://developer.apple.com/documentation/corenfc). Expo Go unterstützt die benötigte Hintergrundortung nicht; eine Webseite ersetzt keine beidseitig getestete native App.

## Offene Informationen, nach Priorität

1. Modul/Person/Branch-Zuordnung und bereits teamweit beschlossener Stack.
2. Foodsharing: gewünschte fachliche Rewardbindung bei `may_earn_rewards=false`; unabhängige Übergabebestätigung; Regeln für reale Privatadressen und Hygiene.
3. Vytal: bestätigter Merchant-Host für Store A, Testbehälter, stabiler Zyklusschlüssel und erlaubter Store-Bestandspfad.
4. Transdev: NFC-Pilotformat und verfügbare Hardware, Livefeed, unabhängige Testspuren; traffiQ: fehlende Datensätze und ID-Mappings.
5. Tatsächliche Rewardpartner, finanziertes Budget, Kontingente, Datenschutz-/Alterskonzept für einen realen Pilot.

Keine dieser Fragen wurde an Dritte versendet. Kein Sieg, Sponsorvertrag oder realer Umweltgewinn wird zugesichert.
