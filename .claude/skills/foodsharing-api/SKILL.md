---
name: foodsharing-api
description: Endpunkte, Regeln und Flows der Foodsharing-Hackathon-API sowie das Save2Share-Produktkonzept. Laden bei Fairteiler, Korb, Reservierung, Abholung, Saver, Verifikation, Regal, Lebensmittel retten.
---

# Save2Share: Foodsharing-API und Produktflow

Basis: `https://app-foodsharing-hackathon.azurewebsites.net`
Auth: Header `X-API-Key` (Key in `Foodsharing API/KEYS.txt`), optional `X-User-ID`.
Swagger `/docs`, Spec `/openapi.json`. Volle Doku in `Foodsharing API/`.

## Endpunkte, die wir nutzen

| Zweck | Aufruf |
|---|---|
| Fairteiler im Umkreis | `GET /food-share-points?lat=&lon=&distance_km=` (Default 10, max 100) |
| Freie Körbe im Umkreis | `GET /baskets/nearby?lat=&lon=&distance_km=` (Default 5, max 50, lat+lon Pflicht) |
| Korbdetail inkl. Anfragen | `GET /baskets/{id}` |
| Korb anbieten | `POST /baskets` mit `title`, `lat`, `lon`, optional `description`, `food_types`, `expires_in_hours` (1-168) |
| Reservieren | `POST /baskets/{id}/requests` mit `{}` oder `{"message": "..."}` |
| Status ändern | `PATCH /baskets/{id}/requests/{requester_id}/status` |
| Abholung buchen | `POST /pickups` mit genau einem von `basket_id` oder `food_share_point_id` |
| Eigene Historie | `GET /users/me/pickups` |
| Beispielhistorien | `GET /pickups/sample?source=basket\|food_share_point\|business` |
| Geschäftsrettung | `POST /businesses/{id}/pickups` (nur verifiziert) |
| Verifikation | `GET\|PATCH /users/{id}/verification`, `POST /users/me/approve` |

## Wichtige Regeln der API

- Erste Anfrage reserviert den Korb exklusiv, auch gegenüber dem eigenen Team.
- Endzustände `rejected`, `cancelled`, `picked_up`. Weitere Änderung gibt 409.
- Ein Nutzer kann pro Korb nur eine Anfrage stellen, auch nach Abbruch.
- Eigenen Korb anfragen oder abholen gibt 400.
- Ein Korb kann nur einmal abgeholt werden, auch bei parallelen Aufrufen.
- Fairteiler-Abholungen sind beliebig oft möglich, jeder POST ist ein Ereignis.
- Nur Geschäftsrettungen brauchen `is_verified`.
- `expires_at` ist nur die technische Grenze, keine Aussage über Geniessbarkeit.
- Fairteiler haben oft `null` bei Beschreibung, Adresse und Öffnungszeiten.
  Kein Feld erfinden, sondern im UI sauber als "keine Angabe" behandeln.

## Produktflow, den wir bauen

1. **Karte** mit Fairteilern und Körben, sortiert nach Distanz.
2. **Regal-Status melden**: Foto + Kategorien + Füllgrad, Zeitstempel sichtbar
   ("vor 20 Min gemeldet"). Verhindert Leerfahrten. 15 Punkte, max 1 je Ort/6 h.
3. **Reservierung**: max 1 offene pro Person, TTL 45 min, Teilmengen möglich.
   Zwei No-Shows in 30 Tagen geben 24 h Reservierungssperre, keine Punktstrafe.
4. **Saver-Verteilung**: Event mit Zeitfenster, Postenliste, Foto, 5-min-Slots.
   Ersetzt die WhatsApp-Gruppe und löst das Problem der zu früh Erscheinenden.
5. **Adress-Unschärfe**: 300-m-Kreis mit zufälligem Mittelpunkt. Exakte Adresse
   erst nach bestätigter Reservierung und frühestens 15 min vor dem Slot.
6. **Saver-Onboarding digital**: `PATCH /users/{id}/verification` mit
   `quiz_passed`, `trial_pickups_completed` (Schwelle 3), `mentor_approved`,
   danach `POST /users/me/approve`. Das ist der echte Prozess und in der Demo zeigbar.
7. **Benachrichtigungen** im Radius, mit Ruhezeit 22-7 Uhr.

## Punkte in diesem Baustein

Einstellen 40, Regal melden 15, Korb anbieten 25, Verteilung als Saver 60,
für Dritte mitnehmen 15, Reservierung eingehalten 5, **Abholen 0**.
Abholen zeigt vollen Impact in kg, aber keine Punkte. Begründung: Punkte fürs
Nehmen wäre der Hamster-Fehlanreiz, den die Aufgabenstellung ausschliesst.

## Fehlercodes

400 eigener Korb, 401 Key fehlt, 403 Verifikation oder Rolle,
404 nicht vorhanden oder fremdes Team, 409 Zustandskonflikt, 422 ungültige Parameter.
Jeder Fehler bekommt im UI einen verständlichen deutschen Satz, keinen Statuscode.
