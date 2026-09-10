# API-Datenobjekte

Referenz der JSON-Felder in Requests und Antworten der Foodsharing Hackathon API.
Die vollständige maschinenlesbare Beschreibung steht in [openapi.json](openapi.json).
Endpunkte, Parameter und Fehler: [API-GUIDE.md](API-GUIDE.md).

## Datentypen und Beziehungen

`integer` bezeichnet eine ganze Zahl, `number` eine Zahl mit möglichen Nachkommastellen,
`boolean` die Werte `true` und `false`. `string[]` ist eine Liste von Zeichenketten.
`null` bedeutet, dass für ein Feld kein Wert vorliegt.

Zeitstempel sind Zeichenketten im ISO-8601-Format. Bei editierbaren Zeitstempeln ist
eine Zeitzone erforderlich, zum Beispiel `2026-09-08T09:00:00Z` oder
`2026-09-08T11:00:00+02:00`.

| Objekt | Zusammenhang |
|--------|--------------|
| Teamnutzer | Handelt über den gemeinsamen Team-Key und optional `X-User-ID` |
| Korb | Angebot eines Nutzers; kann von einem anderen Nutzer angefragt oder abgeholt werden |
| Abholanfrage | Verbindet einen Anfragenden mit einem Korb |
| Abholung | Abgeschlossenes Ereignis an genau einer Quelle: Korb, Fairteiler oder Geschäft |
| Fairteiler | Standort, an dem mehrere Abholungen erfasst werden können |

## Nutzer (UserMeResponse)

Antwort von `GET /users/me`, `GET /users/{user_id}`, Nutzer-PATCHes und
`POST /users/me/approve`. `GET /users` liefert eine Liste dieser Objekte.

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `id` | integer | Nutzer-ID; für Pfadparameter und `X-User-ID` |
| `team_id` | integer | Zugehöriges Team |
| `team_name` | string oder null | Team-Label des verwendeten Keys |
| `display_name` | string oder null | Editierbarer Name des Testnutzers |
| `is_default` | boolean | Dieser Nutzer ist ohne Auswahlheader aktiv |
| `joined_at` | Zeitstempel | Angegebener Beitrittszeitpunkt |
| `pickups_completed` | integer | Zähler regulärer Abholungen |
| `trial_pickups_completed` | integer | Zähler der Probeabholungen |
| `verification` | VerificationState | Verifikation und aktuelle Abholberechtigung |

Die Zähler können für Tests unabhängig von den tatsächlichen Abholereignissen
geändert werden. Identität und Teamzugehörigkeit sind nicht editierbar.
Alle editierbaren Felder und PATCH-Regeln stehen in [TEAM-USERS.md](TEAM-USERS.md).

## Verifikation (VerificationState)

In Nutzerantworten steht dieses Objekt unter `verification`.
`GET/PATCH /users/{user_id}/verification` liefern es direkt.

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `status` | string | `quiz_pending`, `trial_pending`, `approval_pending` oder `verified` |
| `is_verified` | boolean | Nutzer ist verifiziert; per Test-PATCH auch explizit setzbar |
| `quiz_passed` | boolean | Quiz als bestanden markiert |
| `quiz_passed_at` | Zeitstempel oder null | Zeitpunkt des bestandenen Quiz |
| `trial_pickups_completed` | integer | Probeabholungszähler |
| `trial_pickups_required` | integer | Erforderliche Probeabholungen für die reguläre Verifikation |
| `mentor_approved` | boolean | Simulierte Freigabe liegt vor |
| `mentor_approved_at` | Zeitstempel oder null | Zeitpunkt der Freigabe |
| `verified_at` | Zeitstempel oder null | Zeitpunkt der Verifikation |
| `may_pick_up` | boolean | Körbe/Fairteiler abholen; für alle Teamnutzer true |
| `may_pick_up_from_business` | boolean | Geschäftsrettung erlaubt; entspricht `is_verified` |
| `may_earn_rewards` | boolean | Entspricht `is_verified`; löst keine Belohnungsvergabe aus |
| `next_step` | string | Beschreibung des nächsten Schritts im Verifikationsablauf |

Ein `is_verified: true` hat bei der Statusermittlung Vorrang vor Quiz und
Probeabholungszähler. Die API unterstützt dadurch auch absichtlich widersprüchliche
Testzustände. Bei eigenen Verifikationsfehlern steht das Objekt unter
`detail.verification`; andere `403`-Antworten müssen es nicht enthalten.

## Korb (BasketSummary und BasketDetail)

`GET /baskets/nearby` liefert eine Liste von `BasketSummary`-Objekten.
`GET /baskets/{basket_id}` und `POST /baskets` liefern `BasketDetail`.

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `id` | integer | Korb-ID |
| `title` | string | Titel des Angebots |
| `description` | string oder null | Beschreibung |
| `lat` | number | Breitengrad des Abholorts |
| `lon` | number | Längengrad des Abholorts |
| `food_types` | string[] oder null | Lebensmittelarten; keine feste Werteliste |
| `status` | string | `available`, `requested`, `picked_up` oder `expired` |
| `created_by_user_id` | integer oder null | Anbieter-ID |
| `created_at` | Zeitstempel | Zeitpunkt des Angebots |
| `expires_at` | Zeitstempel | Ab hier sind API-Abholungen gesperrt |
| `distance_km` | number oder null | Entfernung zum Suchpunkt; außerhalb einer Umkreissuche `null` |
| `pickup_requests` | PickupRequestSummary[] | Nur in `BasketDetail`: Anfrageübersicht, gegebenenfalls leere Liste |

Ein gespeicherter Status `available` allein garantiert noch keine Verfügbarkeit:
Auch `expires_at` begrenzt die Abholung. Die Umkreissuche liefert ausschließlich
freie, noch nicht abgelaufene Körbe.

### Korb anbieten (BasketCreate)

`POST /baskets` akzeptiert folgende Felder:

| Feld | Pflicht | Werte |
|------|---------|-------|
| `title` | ja | Text, 1–200 Zeichen |
| `lat` | ja | Zahl von -90 bis 90 |
| `lon` | ja | Zahl von -180 bis 180 |
| `description` | nein | Text oder `null` |
| `food_types` | nein | Liste von Texten oder `null` |
| `expires_in_hours` | nein | Ganze Zahl von 1 bis 168; Default 48 |

Anbieter ist der ausgewählte Teamnutzer. ID, Erstellungszeit, Status und Ablaufzeit
werden von der API vergeben.

## Abholanfragen

### Anfrageübersicht (PickupRequestSummary)

Einträge in `BasketDetail.pickup_requests`:

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `requester_id` | integer | Anfragender Nutzer |
| `status` | string | `pending`, `accepted`, `rejected`, `cancelled` oder `picked_up` |
| `requested_at` | Zeitstempel | Zeitpunkt der Anfrage |

### Anfrage erstellen (PickupRequestCreate und PickupRequestResponse)

`POST /baskets/{basket_id}/requests` erwartet einen JSON-Body.
`message` ist optional und enthält einen Text oder `null`; `{}` ist ebenfalls zulässig.
Der Anfragende ist der ausgewählte Nutzer. Die Antwort enthält:

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `id` | integer | ID der Anfrage |
| `basket_id` | integer | Angefragter Korb |
| `requester_id` | integer | Anfragender Nutzer |
| `status` | string | Nach erfolgreicher Erstellung `pending` |
| `message` | string oder null | Übermittelte Nachricht |
| `requested_at` | Zeitstempel | Zeitpunkt der Anfrage |

### Status ändern (PickupStatusUpdate und PickupStatusResponse)

`PATCH /baskets/{basket_id}/requests/{requester_id}/status` erwartet `status` mit
`accepted`, `rejected`, `cancelled` oder `picked_up`. Im Pfad steht die Nutzer-ID
des Anfragenden, nicht die ID der Anfrage. Die Antwort enthält:

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `basket_id` | integer | Betroffener Korb |
| `requester_id` | integer | Anfragender Nutzer |
| `status` | string | Neuer Status |
| `updated_at` | Zeitstempel | Zeitpunkt des Statuswechsels |
| `pickup_id` | integer oder null | ID der bei `picked_up` erfassten Abholung; sonst `null` |
| `was_trial` | boolean | Bei neuen Korbabschlüssen immer false |

Die erlaubten Übergänge und Akteure stehen im
[API-Guide](API-GUIDE.md#6-berechtigungen-bei-statuswechseln).

## Abholungen (PickupResponse und SamplePickupResponse)

`POST /pickups` und `POST /businesses/{business_id}/pickups` liefern `PickupResponse`.
`GET /users/me/pickups` liefert eine Liste dieser Objekte;
`GET /pickups/sample` eine Liste von `SamplePickupResponse`.

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `id` | integer | Abholungs-ID; nur in `PickupResponse` |
| `person` | string | Pseudonym der Beispielperson; nur in `SamplePickupResponse` |
| `source` | string | `basket`, `food_share_point` oder `business` |
| `picked_up_at` | Zeitstempel | Zeitpunkt der Abholung |
| `was_trial` | boolean | Historische Trial-Markierung; alle neuen Rettungen haben false |
| `food_share_point_id` | integer oder null | ID der Fairteiler-Quelle |
| `food_share_point_name` | string oder null | Name der Fairteiler-Quelle |
| `business_id` | integer oder null | ID der Geschäftsquelle |
| `business_name` | string oder null | Name der Geschäftsquelle |
| `basket_id` | integer oder null | ID der Korb-Quelle |
| `basket_title` | string oder null | Titel des Quellkorbs |
| `basket_created_at` | Zeitstempel oder null | Zeitpunkt des Korbangebots |
| `basket_expires_at` | Zeitstempel oder null | Ablaufzeit des Quellkorbs |
| `food_types` | string[] oder null | Lebensmittelarten des Quellkorbs |
| `lat` | number oder null | Breitengrad der Quelle |
| `lon` | number oder null | Längengrad der Quelle |

Felder anderer Quellen sind `null`; bei Geschäftsrettungen sind beispielsweise
Korb- und Fairteiler-Felder einschließlich `food_types` leer. Die Antworten enthalten keine
`user_id`. Im Sample ersetzt `person` die Abholungs-`id`.

### Abholung erfassen (PickupCreate)

`POST /pickups` akzeptiert genau eine der beiden Quellen:

```json
{"food_share_point_id": 1}
```

oder:

```json
{"basket_id": 123}
```

Beide Quellen gleichzeitig, keine Quelle oder zusätzliche Body-Felder ergeben
`422`. Nutzer und Abholzeitpunkt werden durch die Nutzerauswahl und die API bestimmt.
Korb-ID und Fairteiler-ID in den Beispielen sind durch vorhandene IDs zu ersetzen.

## Fairteiler (FoodSharePointResponse)

Antwort von `GET /food-share-points/{food_share_point_id}`;
`GET /food-share-points` liefert eine Liste dieser Objekte.

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `id` | integer | Standort-ID |
| `name` | string | Name des Fairteilers oder der Abgabestelle |
| `description` | string oder null | Beschreibung, falls vorhanden |
| `address` | string oder null | Adresse, falls vorhanden |
| `lat` | number | Breitengrad |
| `lon` | number | Längengrad |
| `opening_hours` | string oder null | Öffnungszeiten, falls vorhanden |
| `region_id` | integer | Kennung der Standortregion |
| `distance_km` | number oder null | Entfernung zum Suchpunkt; ohne Umkreissuche `null` |

## Geschäft (BusinessResponse)

`GET /businesses` liefert eine Liste fiktiver Demo-Geschäfte mit `id` (integer),
`name` (string), `lat` und `lon` (number). Der Katalog benötigt einen Team-Key,
aber keine Verifikation. `POST /businesses/{business_id}/pickups` benötigt einen
verifizierten ausgewählten Nutzer und keinen Body.

## Dienststatus

`GET /` liefert `status: "ok"`, `docs: "/docs"` und `version` mit der API-Version.
`GET /ready` liefert bei Bereitschaft `status: "ready"` und `build_id`, eine
technische Kennung der bereitgestellten API. Andernfalls folgt `503` mit einer
Fehlermeldung unter `detail`.
