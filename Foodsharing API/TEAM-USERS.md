# Zwei Testnutzer pro Team

Jedes Team erhält zwei Testnutzer mit einem gemeinsamen API-Key:

- **User 1:** Standardnutzer des Keys; kann bereits gutgeschriebene Probeabholungen
  und die zugehörige Historie enthalten.
- **User 2:** zusätzlicher Testnutzer, der zunächst mit leeren Zählern und nicht
  bestandenem Quiz bereitsteht.

Flags, Zähler, Namen und Zeitstempel sind editierbar. Den aktuellen Zustand beider
Nutzer liefert `GET /users`; zum Anlegen weiterer Nutzer gibt es keinen Endpunkt.

## Nutzer finden und auswählen

Die folgenden Beispiele verwenden Bash. `KEY` ist ein Platzhalter für den
vergebenen Team-Key, `USER2_ID` für die tatsächliche ID aus der Nutzerliste.

```bash
BASE=https://app-foodsharing-hackathon.azurewebsites.net
KEY=team_01_...
curl -H "X-API-Key: $KEY" "$BASE/users"
```

Die Antwort listet die Teamnutzer nach ID. Jeder Eintrag enthält `id`,
`display_name`, `team_id`, `team_name`, `is_default`, `joined_at`, beide Zähler und
`verification`. `team_name` ist das Label des verwendeten Keys. `is_default: true`
kennzeichnet den Nutzer, der ohne Auswahlheader aktiv ist.

Der optionale Header `X-User-ID` wählt einen handelnden Nutzer für den jeweiligen
Request. Ohne Header gilt erneut der Standardnutzer; eine frühere Auswahl wird
nicht gespeichert.

```bash
USER2_ID=22  # Beispiel-ID; tatsächlichen Wert aus GET /users einsetzen
curl -H "X-API-Key: $KEY" -H "X-User-ID: $USER2_ID" "$BASE/users/me"
```

Die Auswahl gilt für `/users/me`, `/users/me/approve`, `/users/me/pickups`, das
Anbieten von Körben, Anfragen, Anfrage-Statusänderungen und Abholungen,
auch `POST /businesses/{business_id}/pickups`.
Berechtigungen beziehen sich auf den ausgewählten Nutzer: Ein Korb von User 1
ist für User 2 ein fremder Korb, auch bei identischem Team-Key.

`GET /users/{user_id}` liest gezielt einen Nutzer des eigenen Teams. Fremde Nutzer
und fiktive Beispielpersonen ergeben `404`, auch bei Auswahl über `X-User-ID`. Der Auswahlheader
verlangt eine ganze Zahl ab 1, sonst `422`.

Nutzerlisten, Sample und lesende Korb-Endpunkte verwenden `X-User-ID` nicht.
Bei Endpunkten mit konkreter Nutzer-ID im Pfad bestimmt allein diese den Zielnutzer.

## Testzustände frei bearbeiten

Der Bereich **Verification** in Swagger enthält:

- `GET /users/{user_id}/verification`: Verifikationszustand eines eigenen Teamnutzers.
- `PATCH /users/{user_id}/verification`: Teständerung dieses Verifikationszustands.

Die Pfad-ID stammt aus `GET /users`. `X-User-ID` wird hier nicht verwendet.
Swagger übernimmt den Team-Key über **Authorize** ohne Präfix; **Try it out** führt
den jeweiligen Request aus. Beispielbody für die Standardschwelle drei:

```json
{
  "quiz_passed": true,
  "trial_pickups_completed": 3,
  "mentor_approved": true
}
```

Die Antwort enthält direkt einen `VerificationState`, ohne umgebenden
`verification`-Block. `trial_pickups_required` enthält die erforderliche
Probeabholungszahl; dieses Feld ist über die API nicht editierbar.
In der Sandbox wird das Erfüllen der Einführungsabholungen hier über
`trial_pickups_completed` simuliert. Körbe und Fairteiler sind ohne Verifikation
zugänglich und erhöhen diesen Zähler nicht. Für Geschäftsrettungen muss
`may_pick_up_from_business` beziehungsweise `is_verified` true sein.

`PATCH /users/{user_id}` und `PATCH /users/me` erlauben zusätzlich Name,
Beitrittszeitpunkt und regulären Abholzähler. Beispiel:

```bash
curl -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"display_name":"Abholer B","is_verified":true,"pickups_completed":20}' \
  "$BASE/users/$USER2_ID"
```

| Feld | Erlaubte Werte | Verification-PATCH |
|------|----------------|--------------------|
| `display_name` | Text bis 100 Zeichen oder `null` | nein |
| `joined_at` | Zeitstempel mit Zeitzone, z. B. `2026-09-08T09:00:00Z` | nein |
| `quiz_passed`, `mentor_approved`, `is_verified` | `true` oder `false` | ja |
| `quiz_passed_at`, `mentor_approved_at`, `verified_at` | Zeitstempel mit Zeitzone oder `null` | ja |
| `trial_pickups_completed` | Ganze Zahl von 0 bis 2.147.483.647 | ja |
| `pickups_completed` | Ganze Zahl von 0 bis 2.147.483.647 | nein |

Alle Felder sind optional. Explizites `null` ist nur bei `display_name` und den drei
Zeitstempeln mit erlaubtem Leerwert möglich, nicht bei Flags, Zählern oder `joined_at`.
Alternativ akzeptiert die API `trial_pickups_count` für `trial_pickups_completed`
und `pickups_completed_count` für `pickups_completed`.
`id`, `team_id`, Keys und andere unbekannte Felder ergeben `422`.

Nicht angegebene Eingabefelder bleiben erhalten; automatisch abgeleitete Werte
können sich nach folgenden Regeln ändern:

- Ein geändertes Quiz- oder Freigabe-Flag setzt beziehungsweise löscht seinen
  Zeitstempel, sofern kein expliziter Zeitstempel einschließlich `null` vorliegt.
- Ein PATCH mit Quiz-, Freigabe- oder Probeabholzähler-Feld berechnet die
  Verifikation neu, auch wenn der übermittelte Feldwert dem gespeicherten entspricht.
- Ein explizites `is_verified` hat im selben PATCH Vorrang. Ein Wechsel auf true
  setzt normalerweise `verified_at`; ein Wechsel auf false löscht es. Ein explizites
  `verified_at`, auch `null`, hat Vorrang vor dieser Automatik.
- Ein PATCH nur mit `verified_at` erhält `is_verified`. Reine Änderungen von Name,
  Beitrittszeit oder regulärem Zähler lösen ebenfalls keine Neuberechnung aus.
- Eine spätere Freigabe oder ein weiterer PATCH mit Verifikationseingaben
  berechnet die Verifikation wieder regulär.

Damit sind auch widersprüchliche Testzustände möglich. Bei `is_verified: true`
gilt der Nutzer unabhängig von Quiz und Probeabholzähler als für Geschäftsrettungen berechtigt.
Das Antwortfeld `may_earn_rewards` entspricht diesem Flag; es löst keine
Belohnungsvergabe aus.

**Zähleränderungen verändern keine Abholhistorie.** Sie erzeugen und löschen keine
Ereignisse. Spätere Abholungen erhöhen den regulären Zähler `pickups_completed`; bei dessen
Maximum wird eine neue Abholung mit `409` abgelehnt. Die tatsächlichen Ereignisse
stehen unter `/users/me/pickups` für die jeweilige Nutzerauswahl.

Beide Teamnutzer bleiben aus dem Sample ausgeschlossen. Körbe und ihre
Anfrageübersichten sind dagegen für alle gültigen Team-Keys lesbar. Die Isolation
von Nutzerprofilen und Historien bedeutet keine vollständige Unsichtbarkeit von
Korb-Aktivitäten. Berechtigungen: [API-GUIDE.md](API-GUIDE.md#6-berechtigungen-bei-statuswechseln).

Beispiel zum Zurücksetzen von Onboarding-Flags und Zählern:

```bash
curl -X PATCH -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"quiz_passed":false,"mentor_approved":false,"is_verified":false,"trial_pickups_completed":0,"pickups_completed":0}' \
  "$BASE/users/$USER2_ID"
```

Die Historie bleibt dabei erhalten. Ausdrücklich zu löschende Zeitstempel können
zusätzlich als `null` mitgegeben werden, insbesondere bei zuvor widersprüchlichen
Testzuständen mit bereits auf false stehenden Flags.
