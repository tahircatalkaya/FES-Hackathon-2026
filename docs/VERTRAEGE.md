# Gemeinsame Architektur und Übergabeverträge

Status: gemeinsame Referenz implementiert; Produktionsarchitektur spezifiziert. Fachmodule und reale Identität sind noch nicht implementiert. `shared/contracts.py` ist ein **serverinternes** Ereignisformat, kein frei beschreibbarer Client-Endpunkt. Die Browserdemo akzeptiert ausschließlich fest benannte lokale Fixtures ohne frei wählbare Nutzer-, Punkte- oder Storefelder.

## Verantwortungsgrenzen

| Bereich | Vorgeschlagener Pfad / Integrationspunkt | Eigentümer |
|---|---|---|
| App-Shell, Design, Identität, Journal und Wirkung | `shared/`; aktueller Branch `codex/plattform-grundlagen` | Person noch offen |
| FES | künftiges `modules/fes/` | Person/Branch offen |
| Foodsharing | künftiges `modules/foodsharing/` | Person/Branch offen |
| Vytal | künftiges `modules/vytal/` | Person/Branch offen |
| Transdev | künftiges `modules/transdev/` | Person/Branch offen |
| traffiQ | künftiges `modules/traffiq/` | Person/Branch offen |

Die `shared/web`-Ansichten sind die gemeinsame Integrationsoberfläche. Aktionsbuttons lösen **eigene Fixtures** aus. Sie sind keine Ersatzimplementierungen fremder Fachmodule. Partnerorte stammen aus geprüften öffentlichen Abrufen, traffiQ-Tageswerte aus der gelieferten Originaldatei.

## Datenfluss und Identität

App-Sitzung → autorisierter Modulbefehl → Partneradapter → Abgleich → serverseitiger Nachweis → zentrale Entscheidung → Journal und Historie. Eine App-Sitzung bindet genau eine interne Identität; eine Partnersession bindet serverseitig deren Partner-ID. Clients dürfen diese Zuordnung weder auswählen noch überschreiben. Die Team-Headerauswahl ist nur ein Testwerkzeug. Die aktuelle lokale Demo besitzt eine einzige fiktive Person, lauscht nur auf Loopback und ist kein Login-System.

| Vertrag | Pflichtinhalt | Grenzen |
|---|---|---|
| `EvidenceEvent` | event_id, schema_version, partner, environment, external_id/null, action_key, user_id, action, occurred_at mit Offset, source, evidence_status, reason, privacy, quantity/unit nullable, impact_version nullable | Keine GPS-Rohspur, Adresse, Fotos, JWTs oder unnötigen Personendaten |
| Eingangszeit | `received_at` setzt das Backend | Nicht aus dem Client übernehmen |
| Entscheidung | accepted / pending / not_qualified, reason, rule_version, points, duplicate | Referenz unterstützt noch keine Freigabe ausstehender Nachweise; keine neue action_key als Umgehung |
| Konto | earned, pending, redeemable, environment, history | Demo und Partner-Sandbox getrennt abfragen; keine Mischsumme mit Produktion |
| Impact | Wert oder null, Einheit, Systemgrenze, Zeitraum, Quelle, Methode, Schätzstatus | Punkte sind keine CO₂-Einheit; fehlende Faktoren bleiben null |
| Gelegenheit | stabile ID, Partner, grobes Suchgebiet/öffentliche Koordinate, Titel, optionale Hinweise, Zeitfenster/null, retrieved_at, Datenalter | Private Adresse niemals in öffentlicher Antwort |

Für den produktiven gemeinsamen Event-Endpunkt wird `Idempotency-Key` zusätzlich zum fachlichen Schlüssel benötigt. Eindeutigkeit der **Aktionsidentität** bleibt unabhängig von Request-ID und Regelversion. `partner + environment + action_key` ist die Referenz-UNIQUE-Regel. Bei Foodsharing umfasst ein Schlüssel die kanonische Abholung, bei Vytal den belegten Ausleihzyklus; ein Adapter muss alternative Abschlusswege auf denselben Schlüssel abbilden. Einmaligkeit ersetzt keine Missbrauchsbewertung.

## Fünf anschließbare Ereignisse

| Modul | Beispiel-action_key | Aktion / Status | Erforderliche Prüfung vor Annahme |
|---|---|---|---|
| FES | `cleanup:EVENT:participant:APP_USER` | `fes.cleanup`, confirmed | Veranstaltung, Teilnahme, berechtigter Organisator; keine Menge/Fotos als Wertnachweis |
| Foodsharing | `pickup:PARTNER_PICKUP_ID` | `foodsharing.basket_pickup`, confirmed | Eigene User-Historie, zugehöriger Korb und Übergabe; `may_earn_rewards` unverändert respektieren |
| Vytal | `container:ID:user:ID:checkout:TIME` | `vytal.return`, confirmed | Vollständiger Zyklus, Nutzerbindung, erlaubter Store, Rückgabe; bei ungenauem Zeitstempel pending |
| Transdev | `journey:APP_USER:SESSION_UUID` | `transdev.journey`, plausible | Bewusster Start, zusammengefasste Umstiege, Verlauf und Alternativhypothesen |
| traffiQ | `aggregate:SOURCE_HASH:FILTER:PERIOD` | Aggregation ohne persönliche Punkte | Quelle, Nenner, Zeit und Herkunft getrennt; kein persönliches Ledger-Ereignis |

Die ersten vier Beispiele sind eigene Vertragsschemata, keine behaupteten Partner-IDs. Vollständige eigene Testevents entstehen in `shared/demo.py` und `shared/server.py`. traffiQ erhält bewusst keinen automatischen Punktetarif für das Ansehen von Verkehrszahlen.

## Foodsharing-Adapter

Basis und aktueller Vertrag: `https://app-foodsharing-hackathon.azurewebsites.net`, OpenAPI 2.4.0 geprüft. Auth-Header nur serverseitig, `X-User-ID` bei jedem Nutzerrequest neu setzen. Provider 21 und Abholer 31 sind eine vorgeschlagene Demo-Zuordnung, keine Personenrollen. Beide derzeit `may_earn_rewards=false`.

Erster Kernablauf nach Modulzuordnung: eigenen synthetischen Korb durch 21 an ausdrücklich öffentlichem Demo-Ort anlegen, durch 31 anfragen, durch 21 akzeptieren und Übergabe bestätigen, Historie von 31 lesen, `pickup_id` kanonisieren. Wiederholen des Nachweises erzeugt keine zweite Entscheidung. Kein fremder Teamkorb wird für Tests reserviert. Ohne Rewardfreigabe endet der Ablauf ehrlich mit 0 Punkten; FES-Lernen demonstriert parallel das Journal.

Ganzer Korb, keine Teilmenge: `POST /baskets/{id}/requests` mit `{}`; Pfad beim Statuspatch enthält `requester_id`, nicht Request-ID. Anbieter accepted aus pending; rejected aus pending/accepted. Abholer cancelled aus pending/accepted. picked_up laut API durch beide aus pending/accepted möglich, deshalb noch kein unabhängiger Übergabenachweis. Eigene stärkere Bestätigung getrennt verwalten. Pro Nutzer/Korb nur eine Anfrage auch nach Storno. Keine neue Reservierbarkeit versprechen. Reservierung verdient 0 Punkte. Fairteiler und Geschäfte erzeugen pro erfolgreichem POST neue Ereignisse: nicht automatisch wiederholen oder pro ID wertig belohnen.

Eigene Mengenverwaltung und Terminverwaltung erst später: Gesamt, reserviert, abgeholt, abgelaufen, verworfen getrennt; Transaktion sperrt verfügbare Menge. Ganze API-Körbe und eigene Teilpakete müssen eindeutig abgebildet werden, ohne parallel die letzte Einheit zweimal zu vergeben. Ablauf eines lokalen Timers ändert keine Upstream-Reservierung. Reconciliation-Zustand anzeigen.

Private Orte: öffentliche stabile Gebietszelle; bis zur Berechtigung nur gerundete Zeitspanne, kein präzises Routing. Eigener geschützter Adresstresor mit zeitlich begrenzter Freigabe an Beteiligte, Ratenlimits und Audit. Keine echten Privatkoordinaten in der teamübergreifend lesbaren Hackathon-API. Bereits gesehenes Wissen lässt sich bei Storno nicht zurücknehmen.

## Vytal-Adapter

[Technische Quelle](https://app.notion.com/p/vytal-col/Vytal-x-FES-Hackathon-Technical-Documentation-57622b6fddc3821ba7a00156eb4aa4ee), am 11.09. lesend geprüft. Öffentliche GraphQL-Storeabfrage erfolgreich; geschützte Transaktionen nicht durchgeführt.

| Funktion | Gelesener Vertrag | Besondere Behandlung |
|---|---|---|
| Benutzerzuordnung | POST `/api/3/ReferencedAnonUser/Create?userId=...` | Einmalig speichern; Ergebnisfeld success prüfen |
| Stores | GraphQL `storeSearch` / `nearestVytalStores` an `https://colugo.vytal.org/`, Header ANONYMOUS | `errors` trotz 200 behandeln, Distanzen korrekt berechnen; 20 Ergebnisse ≠ kompletter Bestand |
| Checkout | POST `/api/3/Containers/Checkout` | `userId`, QR-Liste und stabile transactionId; fachliches result prüfen |
| Historie | GET `/api/3/ContainerHistory/GetUserContainers` | showActive/showReturned explizit; skip/limit, Status/checkoutTime/returnTime abgleichen |
| Code | GET `/api/3/Container/CheckCode?code=...` | Legacyformate serverseitig; ImageUrl statt deprecated IconUrl |
| Return | POST `/api/3/Container/ContainerReturn` | Store-JWT, codes, transactionId; keine offene Endnutzerberechtigung |
| Wirkung | GET `/api/3/Sustainability/GetUserCo2SavingsForStore?userId=...` | Store-bezogene kumulative Partnerberechnung, niemals pro Poll addieren |
| Bestand | Gelesen: GET `/Merchant/GetStoreStock` | Response Liste mit id/amount/name. Basis-/Versionspräfix nicht still ergänzen; Hostkonflikt vor Nutzung klären |

Die Dokumentation nennt bei Authorization im Text `merchantapi.vytal.org`, das Linkziel enthält jedoch `merchantapi-dev.vytal.org`. Eine URL-Bezeichnung beweist keine Sandbox. Keine Store-Zugangsdaten in diesem Dokument, Client, Git oder Logs. Eine Endnutzeraktion darf nicht eigenmächtig fremde Behälter retournieren. Auch `allLocationsUnchanged` und erneut gelesene Zustände sind keine neue Rückgabe.

## Adapter-Fehler und Wiederholung

Eigene Defaults (noch keine Partner-SLA): Connect/Gesamttimeout 5/15 s, maximal zwei GET-Wiederholungen mit Jitter, 429/Retry-After respektieren. Öffentliche Ortsdaten 15 min Cache; sensible Zustände beim entscheidenden Schritt erneut lesen. Stale-Markierung samt Abrufzeit und Offlinehinweis. Paginierte Backendantworten maximal 100; Partnerlimits separat respektieren (Foodsharing-Historie 500, Sample 1.000). Radiusparameter paarig, Einheiten km/m explizit, Nullwerte erhalten.

400/422 verständlicher Eingabefehler; 401 Sitzung/Zugang prüfen, Geheimnis nicht anzeigen; 403 fehlende Berechtigung; 404 nicht mehr verfügbar; 409 Konflikt, neuesten Zustand holen; 503/Netzfehler Vorgang offenlassen. Ein ungewisses nicht idempotentes POST zuerst über Zustand und Historie aufklären. Lokale DB-Transaktion macht externes POST nicht atomar. Geplant: operation/outbox mit prepared, sent, uncertain, reconciled, failed; Reparaturpfad ohne blindes Replay. Partnerfachfehler sind auch bei HTTP 200 Fehler.

## Datenmodell für die folgende Implementierung

Bestehend in der Referenz: `events` (UNIQUE Partner/Umgebung/Aktion), `journal` (FK Event, einmal award und reversal; append-only Trigger). Das reicht für persistente Fixtureprüfung. Keine behauptete produktive Migration.

Vorgesehen: users, partner_identity (UNIQUE provider/env/external_user), consents, activities, evidence, reward_decisions, ledger, redemption_holds, reward_stock, operations/outbox, friendships, district_membership, challenge_membership, learning_progress, notification_preferences. Nur im aktiven Modul benötigte Tabellen anlegen. Privatadresse separat mit Beteiligten-/Zeitfensterprüfung. Zugriff auf Analysen nur Partnerrolle, Storeaktionen nur Storemitgliedschaft. Export/Löschung brauchen Authentifizierung, Widerruf stoppt Tracking/Push; minimal nötige Betrugs-/Buchungsbelege mit dokumentiertem Aufbewahrungszweck statt pauschaler Vollspeicherung.

## Transdev / traffiQ

Fahrtzustände: idle → starting → tracking → end_suspected → processing → accepted/pending/rejected; aborted und Korrekturweg. NFC ist Startsignal, keine Fahrtenbestätigung. Kopierter statischer Tag bleibt kopierbar. Deduplizierung pro Nutzerreise, niemals global pro Tagchip. Ohne Standort funktioniert manuelle Auswahl, ihr schwächerer Nachweis bleibt sichtbar. Keine Livefahrzeugposition aus GTFS ableiten. Tunnel/GPS-Lücken tolerieren, mehrere Punkte und Nutzerbestätigung verwenden. Scores sind keine kalibrierten Wahrscheinlichkeiten.

traffiQ liefert Aggregation mit source_sha256, observed_period/null, origin, metric, unit, sample_size/null, filters und uncertainty. AFZ positionsbasiert lesen (doppelte Spaltennamen), cp1252, Dezimalkomma, Hst=0 ausschließen. Originale AFZ nicht ungeprüft auf GTFS mappen; synthetic: hat einen anderen Vertrag. EFA-Koordinaten als Rohtext erhalten. Sharing nicht über kumulative Radien summieren und Starts+Enden nicht zu Fahrten addieren. GTFS-Servicekalender inklusive Ausnahmen, Offsetsekunden >86.400, Zeitzone und normalisierte shape_id verwenden. Keine Prognose aus synthetischer Nachfrage oder automatische Linienkürzung aus kleiner Stichprobe.

## Sechs kurze Übergabeaufträge

Alle übernehmen die obigen Verträge und `shared/ledger.py` als Referenz. Jeder PR nennt Stand, Vertragsänderung, Tests, Blocker und nächsten Integrationsschritt. Gemeinsame Änderungen zuerst als kompatiblen Vorschlag übergeben.

1. **FES:** nur `modules/fes/`. PDF S.7, Auftrag §§11–14. Lernscene plus organisierter Clean-up. Output fes.quiz/fes.cleanup. Pflicht: Pause, eingeschränkte Mobilität, wiederholter Nachweis, selbst erzeugter Müll ohne Mengenbonus. DoD: sichtbare Erklärung, geprüfte Lernantwort, Journalübergabe; übernimmt inhaltliche Pitchprüfung.
2. **Foodsharing:** nur `modules/foodsharing/`. PDF S.8–9, lokale API-Doku, aktuelles OpenAPI, Auftrag §§6–7. Input interne Session und öffentlicher Suchpunkt; Output eigene persönliche pickup-ID. Pflicht: getrennte 21/31, pending/accepted/storno/abholung, letzte Einheit, Privatadresse, fehlende Rewards. DoD: eigener Sandboxkorb E2E samt Testbeleg. Übernimmt Demo-Seeds und Internet-Fallback.
3. **Vytal:** nur `modules/vytal/`. PDF S.5–6 und aktuelle Notion-Doku. Input Appidentität, Store-A-Berechtigung und Testbehälter; Output Zyklusevent. Pflicht: ungewisser Timeout, GraphQL-Fehler, neuer legitimer Zyklus, fremde Rückgabe verboten. Abhängigkeit Host/Testbehälter. DoD: belegter Zyklus und Replaytest; übernimmt Partnerdemo-/Fristenprüfung.
4. **Transdev:** nur `modules/transdev/`. PDF S.3–4, Auftrag §9 und GTFS-Katalog. Input freiwillige Session, optional Tag, eigene Spur; Output Reise, Modus, Gründe und Nachweisgrad. Pflicht: Tunnel, Umstieg, Neustart, Auto parallel, Haltestellenstillstand, verweigerte Ortung, Replay. DoD: positive und negative Fixtures, keine behauptete Erkennungsquote; übernimmt Android-Geräteprotokoll.
5. **traffiQ:** nur `modules/traffiq/`. PDF S.10–13, Originaldaten und Herkunftsdateien. Input bounded Filter; Output geprüfte Aggregate. Pflicht: EFA 50, Original/Simulation, Zeitüberschreitung, fehlende IDs, unbekannter Nenner. DoD: reproduzierbare Auswertung, Quellenlabel und sachlich begrenzte Planungshypothese; übernimmt Daten-/Juryfolien.
6. **Plattform:** `shared/`, gemeinsame Dokumente; Schemaänderungen zentral koordinieren. Input Modulevents, Output Session/UI/Journal/Impact. Pflicht: konkurrierende Nachweise, Regelwechsel, Korrektur, Sprache ohne Zustandsverlust, Kartenliste, keine Clientkeys. DoD: gemeinsame Demo und Integration; übernimmt iOS-/Barriereprüfungskoordination, nicht sämtliche Fachtests allein.
