# Verfügbare Daten

Die API enthält Teamnutzer, Essenskörbe, Abholanfragen, Abholhistorien und
Fairteiler-Standorte und fiktive Geschäfte. Nutzer, Angebote und Abholungen sind fiktive Testdaten.
Die Standortdaten beziehen sich auf Fairteiler und Abgabestellen in Frankfurt am Main.

Feldnamen und Datentypen: [SCHEMA.md](SCHEMA.md).
Endpunkte und Parameter: [API-GUIDE.md](API-GUIDE.md).

## Übersicht

| Daten | Endpunkt | Sichtbarkeit |
|-------|----------|--------------|
| Demo-Geschäfte | `GET /businesses` | Alle gültigen Team-Keys |
| Zwei eigene Testnutzer | `GET /users` | Eigenes Team |
| Aktuell ausgewählter Nutzer | `GET /users/me` | Eigenes Team |
| Verifikationszustand | `GET /users/{user_id}/verification` | Eigenes Team |
| Persönliche Abholhistorie | `GET /users/me/pickups` | Ausgewählter Teamnutzer |
| Gemeinsame Beispielabholungen | `GET /pickups/sample` | Alle gültigen Team-Keys |
| Verfügbare Körbe im Umkreis | `GET /baskets/nearby` | Alle gültigen Team-Keys |
| Korbdetails und Anfrageübersicht | `GET /baskets/{basket_id}` | Alle gültigen Team-Keys |
| Fairteiler-Liste und einzelne Standorte | `GET /food-share-points`, `GET /food-share-points/{food_share_point_id}` | Öffentlich |

Der aktuelle Umfang der Körbe und Abholungen ergibt sich aus den API-Antworten.
Angebote können inzwischen reserviert, abgeholt oder abgelaufen sein.

## Persönliche Abholhistorie

`GET /users/me/pickups` liefert die tatsächlichen Abholereignisse des ausgewählten
Teamnutzers. Jeder erfolgreiche Abholabschluss ergänzt ein Ereignis. Eine Historie
kann leer sein oder bereits gutgeschriebene Probeabholungen enthalten.

Die Antwort enthält eine `id` für jede Abholung. `was_trial: true` kennzeichnet
eine Probeabholung, `was_trial: false` eine reguläre Abholung. Spätere Änderungen
der Verifikation schreiben diesen Wert nicht um. Neue Rettungen aller drei Quellen
haben `was_trial: false`; sie erhöhen ausschließlich den regulären Zähler.
Neue Seeds erzeugen keine Fairteiler-Ereignisse für simuliertes Trial-Guthaben.
Ältere Trial-Einträge bleiben bei Migration und Neustarts erhalten.

`pickups_completed` und `trial_pickups_completed` im Nutzerprofil sind unabhängig
editierbare Testzähler. Sie können deshalb von der Anzahl der Historieneinträge
abweichen. Eine Zähleränderung erzeugt und löscht keine Abholungen.

## Gemeinsamer Beispieldatensatz

`GET /pickups/sample` liefert historische Abholungen fiktiver Personen ohne
Teamzugehörigkeit. Der Datensatz enthält Fairteiler- und Korb-Abholungen sowie
Probeabholungen und reguläre Abholungen. Eigene und fremde Team-Abholungen sind
ausgeschlossen, auch wenn ein Teamnutzer keinen eigenen API-Key hat.

Die fachlichen Felder entsprechen der persönlichen Historie. Statt einer
Abholungs-`id` steht im Sample jedoch `person`, zum Beispiel `person_007`.
Eine `user_id` ist in keiner der beiden Antworten enthalten. Die IDs der
zugehörigen Körbe, Fairteiler oder Geschäfte bleiben sichtbar. Der Filter
`source=business` zeigt Geschäftsrettungen; er kann beim Beispieldatensatz leer sein.

Ein `person`-Wert bleibt bei unverändertem Bestand an Beispielpersonen über
Seiten und Quellenfilter hinweg gleich. Er ist kein für `/users/{user_id}` oder
`X-User-ID` verwendbarer Wert. Profile und Verifikationszustände dieser Personen
sind mit Team-Keys nicht zugänglich.

Die historischen Testdaten bilden keinen vollständigen Lebenslauf einer Person
ab. Abholzeitpunkte können beispielsweise vor dem angegebenen Beitritt liegen.
Aus den Testdaten ergeben sich keine gemessenen Aussagen über reales Abholverhalten.

### Aufrufbeispiele (Bash)

```bash
BASE=https://app-foodsharing-hackathon.azurewebsites.net
KEY=team_01_...

# Erste Seite aller Beispielabholungen
curl -H "X-API-Key: $KEY" "$BASE/pickups/sample?limit=200&offset=0"

# Nur Korb-Abholungen
curl -H "X-API-Key: $KEY" "$BASE/pickups/sample?source=basket&limit=1000"

# Nur Fairteiler-Abholungen
curl -H "X-API-Key: $KEY" "$BASE/pickups/sample?source=food_share_point&limit=1000"

# Persönliche Historie eines ausgewählten Teamnutzers
USER_ID=22  # Tatsächliche ID aus GET /users
curl -H "X-API-Key: $KEY" -H "X-User-ID: $USER_ID" "$BASE/users/me/pickups"
```

Beide Historien liefern die neuesten Ereignisse zuerst und unterstützen `limit`
und `offset`. Die persönliche Historie erlaubt bis zu 500 Einträge pro Aufruf,
das Sample bis zu 1000. Der `source`-Filter ist nur beim Sample verfügbar.

## Fairteiler

Die Standortdaten enthalten Namen und Koordinaten von Fairteilern und
Abgabestellen im Raum Frankfurt. Beschreibung, Adresse und Öffnungszeiten können
`null` sein; bei den bereitgestellten Standorten sind diese Angaben nicht hinterlegt.
Eine Unterscheidung zwischen Kühlschrank und Regal ist nicht enthalten.
Die Einträge sind keine Bestätigung aktueller Öffnungs- oder Betriebszeiten.

Ohne Koordinaten liefert `GET /food-share-points` die Standorte nach Name sortiert.
Mit `lat` und `lon` werden Standorte innerhalb von `distance_km` nach Entfernung
sortiert. Die Antwort enthält dann die berechnete `distance_km`; ohne
Umkreissuche ist dieses Feld `null`.

## Demo-Geschäfte

Drei ausdrücklich fiktive Geschäfte in Frankfurt stehen in `GET /businesses`.
Die Migration ergänzt sie auch in bestehenden Datenbanken und erhält bestehende
Team-Schlüssel, Zustände und Historien. Geschäftsrettungen erscheinen mit
`source: business`, `business_id`, `business_name` und Koordinaten in der Historie.
Es gibt keine Warenbestände oder Terminbuchung; jeder erfolgreiche POST ist ein
eigenes Ereignis und setzt Verifikation voraus.

## Körbe und Anfragen

Ein Korb hat einen Titel, einen Abholort, einen Status und eine Ablaufzeit. Optional
sind Beschreibung und Lebensmittelarten (`food_types`). Beispielangebote liegen
im Raum Frankfurt; neue Angebote können beliebige gültige Koordinaten verwenden.

Die Umkreissuche liefert nur freie, noch nicht abgelaufene Körbe. Die Detailansicht
bleibt auch bei reservierten, abgeholten oder abgelaufenen Körben verfügbar.
`expires_at` ist die Verfügbarkeitsgrenze für API-Abholungen, keine Aussage über
die tatsächliche Genießbarkeit der Lebensmittel.

Anfragen beschreiben die Reservierung eines Korbs. Erst der Abholabschluss erzeugt
ein Abholereignis. Ein offener Request reserviert den Korb für den Anfragenden;
Statusänderungen sind abhängig vom Zielstatus dem Anbieter oder Anfragenden erlaubt.
Die vollständigen Regeln stehen im [API-Guide](API-GUIDE.md#6-berechtigungen-bei-statuswechseln).

## Teamübergreifende Sichtbarkeit

Nutzerprofile, Verifikation und persönliche Historien sind nur innerhalb des
eigenen Teams zugänglich. Körbe und Anfrageübersichten sind mit jedem gültigen
Key lesbar. Dabei sind Anbieter-ID und Anfragenden-ID sichtbar. Diese IDs erlauben
keinen Zugriff auf fremde Nutzerprofile und keine Auswahl als handelnder Nutzer.
