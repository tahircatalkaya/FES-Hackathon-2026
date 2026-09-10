# API-Guide

Technische Referenz zur API-Version **2.4.0**. Datenmodell: [SCHEMA.md](SCHEMA.md).
Verfügbare Daten: [DATABASE.md](DATABASE.md). Testnutzer: [TEAM-USERS.md](TEAM-USERS.md).

**Basis-URL:** `https://app-foodsharing-hackathon.azurewebsites.net`
**Swagger:** [`/docs`](https://app-foodsharing-hackathon.azurewebsites.net/docs)
**ReDoc:** [`/redoc`](https://app-foodsharing-hackathon.azurewebsites.net/redoc)

## 1. Spezifikation

[openapi.json](openapi.json) beschreibt die API im OpenAPI-3.1-Format: Pfade,
Parameter, Request- und Response-Schemata sowie deklarierte Statuscodes.
Weitere Fehlerfälle stehen in Abschnitt 8. Die aktuelle Spezifikation ist
unter `/openapi.json` verfügbar.

```bash
curl https://app-foodsharing-hackathon.azurewebsites.net/openapi.json
```

Swagger unter `/docs` zeigt die Endpunkte mit Eingabefeldern und Antworten.
**Try it out** führt einen Aufruf mit den eingegebenen Werten aus.

## 2. Authentifizierung und Nutzerauswahl

Geschützte Endpunkte erwarten den von der Organisation vergebenen Team-Key:

```text
X-API-Key: team_01_...
```

In Swagger setzt **Authorize** den Key ohne Präfix als `X-API-Key`.
Öffentlich sind Fairteiler-Liste und -Detail, `/`, `/ready`, `/docs`, `/redoc`
und `/openapi.json`.

Jedes Team hat zwei Testnutzer. `GET /users` listet die eigenen Nutzer.
Für nutzerbezogene Aktionen wählt `X-User-ID: <id>` einen von ihnen; ohne Header
ist bei jedem Request der Nutzer mit `is_default: true` aktiv.
Die Auswahl wird nicht für spätere Aufrufe gespeichert.
Nutzer anderer Teams und fiktive Beispielpersonen können nicht als handelnder
Nutzer ausgewählt werden (`404`).
Ein nicht ganzzahliger oder kleiner als 1 gesetzter `X-User-ID` ergibt `422`.

`X-User-ID` gilt für `/users/me`, `/users/me/approve`, `/users/me/pickups`, das
Anbieten von Körben, das Anfragen und Ändern einer Anfrage sowie `POST /pickups`.
Bei `/users/{user_id}` und `/users/{user_id}/verification` bestimmt die Pfad-ID
unabhängig vom Header den Zielnutzer. Nutzerlisten, Sample und lesende Korb-Endpunkte
verwenden den Auswahlheader ebenfalls nicht.

Nutzerprofile, Verifikationsdaten und persönliche Historien sind auf das eigene
Team beschränkt. Körbe sind teamübergreifend lesbar, einschließlich
`created_by_user_id` und Anfrageübersichten mit `requester_id`, `status` und
`requested_at`. Ein gültiger Key allein erlaubt keine fremden Statusänderungen.

## 3. Verifikation und Abholberechtigung

Körbe und Fairteiler können alle Teamnutzer ohne Quiz oder Verifikation abholen.
Nur Geschäftsrettungen erfordern `is_verified: true`.

| Status | Geschäftsrettung |
|--------|------------------|
| `quiz_pending` | `403`, `quiz_not_passed` |
| `trial_pending` | `403`, `trial_pickups_incomplete` |
| `approval_pending` | `403`, `awaiting_approval` |
| `verified` | erlaubt |

Der reguläre Verifikationsablauf besteht aus Quiz, Einführungsabholungen und Freigabe.
Die API simuliert diese Schritte: `quiz_passed`, `trial_pickups_completed` und
`mentor_approved` können mit `PATCH /users/{user_id}/verification` gesetzt werden.
Die erforderliche Anzahl steht in `trial_pickups_required` (Default drei).
`POST /users/me/approve` setzt die Freigabe und berechnet die Verifikation neu.
Ein explizites `is_verified` hat bei Test-PATCHes weiterhin Vorrang.

Neue Korb- und Fairteiler-Abholungen zählen **nicht** als Einführungsabholungen.
Alle neuen Abholungen, auch Geschäftsrettungen, haben `was_trial: false` und erhöhen
`pickups_completed`. Vorhandene historische Trial-Markierungen und Zähler werden
bei der Umstellung nicht verändert. Testzähler können weiterhin unabhängig von der
Historie bearbeitet werden.

`may_pick_up` ist für Körbe/Fairteiler immer true. `may_pick_up_from_business`
entspricht `is_verified`. Das bestehende Feld `may_earn_rewards` entspricht ebenfalls
`is_verified`; es berechnet oder vergibt keine Belohnung.

### Geschäftsrettung ausprobieren (Bash)

```bash
BASE=https://app-foodsharing-hackathon.azurewebsites.net
KEY=team_01_...
curl -H "X-API-Key: $KEY" "$BASE/users"
curl -H "X-API-Key: $KEY" "$BASE/businesses"

USER_ID=31  # Tatsächliche ID aus GET /users
BUSINESS_ID=1  # Tatsächliche ID aus GET /businesses
curl -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"quiz_passed":true,"trial_pickups_completed":3,"mentor_approved":true}' \
  "$BASE/users/$USER_ID/verification"
curl -X POST -H "X-API-Key: $KEY" -H "X-User-ID: $USER_ID" \
  "$BASE/businesses/$BUSINESS_ID/pickups"
curl -H "X-API-Key: $KEY" -H "X-User-ID: $USER_ID" "$BASE/users/me/pickups"
```

Geschäfte sind fiktive Demo-Standorte, keine realen foodsharing-Kooperationspartner.
Die Sandbox bildet keine Warenbestände oder Abholtermine ab. Der POST benötigt
keinen Body; jeder erfolgreiche Aufruf erfasst eine separate Rettung (`201`).
Die aktuelle Verifikation wird unter einer Nutzersperre erneut geprüft; bei
fehlender Verifikation folgt `403` mit `detail.error`, `detail.message` und dem
eigenen `detail.verification`. Ein unbekanntes Geschäft ergibt für einen
verifizierten Nutzer `404`.

## 4. Endpunkte und Parameter

### Öffentlich

| Methode | Pfad | Verhalten |
|---------|------|-----------|
| `GET` | `/food-share-points` | Ohne Koordinaten alle gespeicherten Standorte, nach Name sortiert; mit Koordinaten Umkreissuche |
| `GET` | `/food-share-points/{food_share_point_id}` | Einzelner Standort oder `404` |
| `GET` | `/` | `status`, `docs` und API-`version` |
| `GET` | `/ready` | Bereitschaftsstatus: `200` mit `status` und `build_id`, sonst `503` mit `detail` |

`lat` und `lon` sind bei der Fairteiler-Liste optional, müssen aber zusammen
angegeben werden (`422` bei nur einem Wert).
`distance_km` hat dort Default 10, Minimum 0,1 und Maximum 100; ohne Koordinaten wird
kein Distanzfilter angewendet. Mit Koordinaten ist die Antwort nach Distanz sortiert.

### Mit Team-Key

| Methode | Pfad | Verhalten |
|---------|------|-----------|
| `GET` | `/users` | Eigene Teamnutzer, nach ID sortiert |
| `GET` | `/users/{user_id}` | Eigener Teamnutzer |
| `PATCH` | `/users/{user_id}` | Testzustand dieses Nutzers bearbeiten |
| `GET` | `/users/me` | Ausgewählter Nutzer und Verifikationszustand |
| `PATCH` | `/users/me` | Testzustand des ausgewählten Nutzers bearbeiten |
| `GET` / `PATCH` | `/users/{user_id}/verification` | Verifikationszustand direkt lesen oder bearbeiten |
| `POST` | `/users/me/approve` | Simulierte Freigabe speichern und Verifikation berechnen |
| `GET` | `/users/me/pickups` | Historie des ausgewählten Nutzers |
| `GET` | `/pickups/sample` | Pseudonymisierte Abholungen von Nutzern ohne Team |
| `POST` | `/pickups` | Korb/Fairteiler ohne Verifikation abholen; Erfolg: `201` |
| `GET` | `/businesses` | Fiktive Demo-Geschäfte, nach ID sortiert |
| `POST` | `/businesses/{business_id}/pickups` | Geschäftsrettung nur mit Verifikation; Erfolg: `201` |
| `GET` | `/baskets/nearby` | Freie, noch nicht abgelaufene Körbe im Umkreis |
| `GET` | `/baskets/{basket_id}` | Korb einschließlich Anfrageübersicht |
| `POST` | `/baskets` | Korb anbieten, ohne Verifikation; Erfolg: `201` |
| `POST` | `/baskets/{basket_id}/requests` | Korb ohne Verifikation reservieren; Erfolg: `201` |
| `PATCH` | `/baskets/{basket_id}/requests/{requester_id}/status` | Anfrage-Status ändern |

Die Korbsuche erfordert `lat` und `lon`; `distance_km` hat Default 5, Minimum 0,1
und Maximum 50. Sie schließt Körbe mit vorhandener Abholung oder offener Anfrage
aus und sortiert nach Distanz. Eigene freie Körbe können in der Suche erscheinen.
Korbdetails sind auch für reservierte, abgeholte oder abgelaufene Körbe lesbar.

`POST /baskets` erwartet `title` (1–200 Zeichen), `lat` und `lon`. Optional sind
`description`, `food_types` und `expires_in_hours` (1–168, Default 48). Besitzer ist
der ausgewählte Nutzer; Ablaufzeit und Erstellungszeit setzt der Server.

`POST /pickups` erwartet genau eine Quelle: `{"food_share_point_id": 1}` oder
`{"basket_id": 1}`. Beide, keine Quelle oder unbekannte Body-Felder ergeben `422`.
Abholzeit und Nutzer stammen vom Server beziehungsweise aus der Nutzerauswahl.

`POST /baskets/{basket_id}/requests` erwartet einen JSON-Body; `{}` ist zulässig,
`message` ist optional. Nur eine Anfrage pro Nutzer und Korb ist möglich, auch nach
einem abgeschlossenen, abgelehnten oder stornierten Versuch.

## 5. Aufrufbeispiele für Abholungen

Für die folgenden Korb- und Fairteiler-Beispiele reicht ein gültiger Team-Key.
`BASE` und `KEY` entsprechen den dort definierten Bash-Variablen.

```bash
# Abholung an einem gespeicherten Fairteiler
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
     -d '{"food_share_point_id": 1}' "$BASE/pickups"

# Verfügbare Körbe lesen
curl -H "X-API-Key: $KEY" "$BASE/baskets/nearby?lat=50.11&lon=8.68&distance_km=30"

# BID: ID eines freien, fremden Korbs aus der Antwort
BID=123
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
     -d '{"message":"Abholung vereinbart"}' "$BASE/baskets/$BID/requests"

MYID=$(curl -s -H "X-API-Key: $KEY" "$BASE/users/me" \
       | python -c "import sys,json;print(json.load(sys.stdin)['id'])")
curl -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
     -d '{"status":"picked_up"}' "$BASE/baskets/$BID/requests/$MYID/status"

curl -H "X-API-Key: $KEY" "$BASE/users/me/pickups"
```

Alternativ erfolgt die Korb-Abholung direkt über `POST /pickups` mit `basket_id`.
Eine vorherige Anfrage ist dafür nicht zwingend nötig. Fairteiler-Abholungen sind
wiederholt möglich; jeder erfolgreiche POST erzeugt ein neues Ereignis.

## 6. Berechtigungen bei Statuswechseln

| Zielstatus | Berechtigter Nutzer | Erlaubter Ausgangsstatus |
|------------|---------------------|------------------------|
| `accepted` | Anbieter des Korbs | `pending` |
| `rejected` | Anbieter des Korbs | `pending`, `accepted` |
| `cancelled` | Anfragender | `pending`, `accepted` |
| `picked_up` | Anbieter oder Anfragender | `pending`, `accepted` |

Der erste Request setzt den Korb von `available` auf `requested` und reserviert ihn
für genau diesen Nutzer. Das gilt auch gegenüber anderen Nutzern desselben Teams.
Ablehnung oder Stornierung geben den Korb frei, sofern keine weitere offene Anfrage
vorliegt; bei bereits erreichtem Ablauf wird der Korb dabei auf `expired` gesetzt.

`rejected`, `cancelled` und `picked_up` sind Endzustände. Weitere Änderungen ergeben
`409`. Auch ein wiederholtes `accepted` ergibt `409`. Beim Abholabschluss werden
die Reservierung und die Ablaufzeit geprüft; eine Verifikation ist nicht erforderlich.
Eine separate Annahme vor `picked_up` ist nicht nötig.

Die direkte Korb-Abholung schließt eine eigene offene Anfrage mit ab. Eigene Körbe
ergeben `400`; abgelaufene, bereits abgeholte oder für andere Nutzer reservierte
Körbe ergeben `409`. Eine eigene geschlossene Anfrage verhindert auch den direkten
Abschluss. Bei `expires_at <= jetzt` ist der Korb abgelaufen.

Ein Korb kann nur einmal abgeholt werden, auch bei gleichzeitigen Aufrufen oder
einem Wechsel zwischen den beiden Abschlusswegen. Ein weiterer Abschluss ergibt
`409`. Bei erfolgreichem Abschluss werden Korb und gegebenenfalls Anfrage als
abgeholt markiert; die Abholung erscheint in der Historie und erhöht den passenden
Nutzerzähler.

Am Status-Endpunkt erfolgt die Existenzprüfung vor der Prüfung des Akteurs und
diese vor der Prüfung des Anfragezustands (`404` → `403` → `409`). Das ist keine
allgemeine Fehlerreihenfolge für andere Endpunkte oder alle Abschlussprüfungen.

## 7. Abholhistorien

| Eigenschaft | `/users/me/pickups` | `/pickups/sample` |
|-------------|---------------------|-------------------|
| Datenumfang | Ausgewählter Teamnutzer | Alle Nutzer ohne Teamzugehörigkeit |
| Identifikation | `id` der Abholung, keine `user_id` | `person`-Pseudonym, keine Abholungs- oder Nutzer-ID |
| `limit` | Default 100, 1–500 | Default 200, 1–1000 |
| `offset` | Default 0, mindestens 0 | Default 0, mindestens 0 |
| Quellenfilter | keiner | `source=basket`, `source=food_share_point` oder `source=business` |
| Sortierung | Neueste Abholung zuerst; bei gleichem Zeitpunkt höhere Abholungs-ID zuerst | ebenso |

Die gemeinsamen fachlichen Felder sind:

| Feld | Bedeutung |
|------|-----------|
| `source` | `basket`, `food_share_point` oder `business` |
| `picked_up_at` | Zeitpunkt der erfassten Abholung |
| `was_trial` | Historische Trial-Markierung; bei allen neuen Rettungen false |
| `food_share_point_id`, `food_share_point_name` | Fairteiler-Quelle, sonst `null` |
| `business_id`, `business_name` | Geschäftsquelle, sonst `null` |
| `basket_id`, `basket_title`, `basket_created_at`, `basket_expires_at`, `food_types` | Korb-Quelle, sonst `null` |
| `lat`, `lon` | Koordinaten der Quelle |

Quellangaben werden beim Lesen aus Korb, Fairteiler oder Geschäft ergänzt.
Das Sample ersetzt das Feld `id` der persönlichen Historie durch `person`.
Pseudonyme wie `person_001` bleiben innerhalb eines unveränderten Bestands an
Beispielpersonen über Seiten und Quellenfilter hinweg gleich. Sie sind keine
Nutzer-IDs. Alle Teamnutzer sind aus dem Sample ausgeschlossen.

Eine persönliche Historie kann bereits Probeabholungen enthalten oder leer sein.
Testzähler lassen sich unabhängig davon ändern. Eigenschaften des Beispieldatensatzes
stehen in [DATABASE.md](DATABASE.md).

## 8. Fehler und Datentypen

| Status | Typische Bedeutung |
|--------|--------------------|
| `400` | Eigenen Korb anfragen oder abholen |
| `401` | `X-API-Key` fehlt, ist unbekannt oder deaktiviert |
| `403` | Akteur darf den Status nicht setzen oder Geschäftsverifikation fehlt |
| `404` | Ressource nicht vorhanden oder Zielnutzer gehört nicht zum eigenen Team |
| `409` | Korb nicht verfügbar, Anfrage bereits vorhanden/geschlossen oder betroffener Zähler bei 2.147.483.647 |
| `422` | Ungültige Parameter oder Body-Felder; bei PATCH auch unzulässiges `null` |
| `503` | Dienst bei `/ready` nicht bereit |

Zeitstempel sind Zeichenketten im ISO-8601-Format, zum Beispiel
`2026-09-08T09:00:00Z`. Test-PATCHes erfordern eine explizite Zeitzone;
ein Offset wie `+02:00` ist ebenfalls zulässig.

Koordinaten müssen innerhalb `lat: -90…90`, `lon: -180…180` liegen. Die
bereitgestellten Standortdaten liegen im Raum Frankfurt; neu angebotene Körbe
sind nicht auf Frankfurt beschränkt.
`expires_at` ist die technische Verfügbarkeitsgrenze eines Korbs, keine Aussage
über die tatsächliche Genießbarkeit der Lebensmittel.
