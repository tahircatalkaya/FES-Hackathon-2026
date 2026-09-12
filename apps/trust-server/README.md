# Mainsam: Abholungen und Rückgaben

Persistenter lokaler Server für Foodsharing-Zusagen, gemeinsame Regalmeldungen, Vytal-Rückgabebelege und Bewertungen. Node **22.18+**, keine kostenpflichtige API und keine zusätzlichen Server-Pakete. Daten bleiben in `data/trust.sqlite`; additive Migrationen erhalten vorhandene Konten, Zusagen und Belege.

## Start im privaten Hotspot/LAN

Mac und Handy ins gleiche private Netz. Terminal 1:

```bash
cd apps/mobile
npm install --include=optional
npm run trust:lan
```

Terminal 2 im selben Verzeichnis:

```bash
npm run start:lan
```

QR-Code mit Expo Go öffnen. Beide Prozesse laufen lassen. Die Entwicklungs-App findet Port 8787 unter der privaten Metro-IP. Bei blockierter Verbindung eingehende Node-Verbindungen in der Mac-Firewall prüfen. Kein öffentlicher Tunnel. Nur auf dem Rechner testen: `npm run trust:start` bindet 127.0.0.1.

`EXPO_PUBLIC_TRUST_URL` erlaubt eine abweichende Adresse. HTTP wird nur in Entwicklung für private Adressen akzeptiert; veröffentlichte Builds brauchen einen expliziten HTTPS-Endpunkt. Bestehende Google-Variablen bleiben unverändert.

## Foodsharing: verteilen ohne WhatsApp-Koordination

1. **Profil → Übergaben & Zuverlässigkeit** oder **Scan → Lebensmittel übergeben**. Jede Person verwendet ihren eigenen Zugang; derselbe Zugang gilt auch für Mehrweg.
2. **Anbieten**: Foto, Audio oder Texteingabe. Die Erfassung beschreibt die Menge **pro Abholung**. Einzelne Lebensmittelposten mit jeweils eigener Zahl verfügbarer Portionen oder gleiche gemischte Tüten wählen. Beispiel: 3 Laugenstangen pro Portion, 4 Portionen; dazu ein weiterer Posten mit 2 Äpfeln pro Portion, 6 Portionen. Eine Verteilung wird atomar gespeichert; bei einem ungültigen Posten wird nichts halb veröffentlicht.
3. Stadtteil, privaten Treffpunkt und Beginn wählen. Zwei Stunden lang gibt es Termine alle fünf Minuten, nur eine Person pro Termin, auch über mehrere Angebote desselben Anbieters hinweg. Die Karte verwendet einen öffentlichen Haltestellenpunkt im Stadtteil, keine Wohnkoordinate. Entfernung vor der Zusage ist entsprechend nur ungefähr.
4. Abholer wählen einen Posten und Termin. Eine Portion pro Person/Angebot, maximal eine offene Abholung je Konto. Der Bestand sinkt sofort für alle. Der Anbieter muss innerhalb von 15 Minuten zusagen; ansonsten wird die Portion wieder frei. Nach drei abgesagten/verfallenen Anfragen am Tag sind weitere Anfragen bis zum Ende der rollierenden 24 Stunden begrenzt.
5. Der private Treffpunkt erscheint nur nach Zusage ab 15 Minuten vor dem persönlichen Termin, bis zu dessen Ende. Bitte nicht unangekündigt erscheinen. Absagen geben Portion und Termin frei; abgelaufene Zusagen ebenso. Bereits abgeschlossene Termine werden nicht nochmals vergeben.
6. **Vor Ort:** Der Abholer prüft seine bereitliegende Portion und zeigt **seinen persönlichen Abhol-QR**. Der Anbieter scannt ihn über die zugehörige Zusage und bestätigt die tatsächliche Übergabe. Ein QR ist an diese beiden Konten und diesen Termin gebunden, höchstens fünf Minuten gültig und einmal wertbar. Er enthält keine Adresse. Ersatzweise lässt sich derselbe Textcode eingeben. Es gibt keinen universellen Beispiel-Code für Abschlüsse.
7. Punkte und Belege entstehen auf dem Server genau einmal. Bewertungen bleiben möglich: Zufriedenheit, Zuverlässigkeit, Respekt/Menge; einmal je Person und abgeschlossenem Vorgang, binnen 14 Tagen. Blind bis beide bewerten oder 14 Tage vergehen. Öffentliche Mittelwerte erst ab drei verschiedenen Gegenübern; derselbe Bewerter zählt nur einmal. Private Hinweise und Widerspruch bleiben erhalten, keine automatische öffentliche Beschuldigung.

Die bisherigen sechsstelligen Codes für schon bestehende Integrationen bleiben kompatibel: Anbieter-Code → Empfang → Abschluss. Neue Screens verwenden den kürzeren persönlichen QR-Ablauf. Ungeklärte alte Empfangsbestätigungen werden nach 24 Stunden nicht wieder als freier Bestand angeboten.

Die geöffnete Übergabenseite aktualisiert sich alle zehn Sekunden; neue Statusänderungen erscheinen im In-App-Postfach. Das ist kein Push-Dienst im Hintergrund. Nicht vorgaukeln, dass abgemeldete oder geschlossene Apps alle neuen Lebensmittelangebote erhalten.

## Offene Regale

Regal ansehen, Lebensmittel einstellen und mitnehmen bleiben per Kamera, Audio und Text zugänglich. Angemeldete Personen teilen ihre Meldungen auf dem Server; aktuelle Meldungen sind für alle lesbar und erscheinen auch am Kartenort. Zeitstempel, letzte Änderungen und Verbindungsfehler sind sichtbar. Ohne Zugang/Verbindung bleibt die Erfassung lokal und wird ausdrücklich so bezeichnet.

Nur ein vollständiger Regalblick ersetzt den zuletzt beobachteten Bestand. Teilmengen beim Einstellen oder Abholen überschreiben nicht das ganze Regal. Neuere Teilmeldungen markieren die ältere Momentaufnahme als geändert. Eine lokale Merkliste sperrt nichts für andere. Da auch Menschen ohne App zugreifen können, gibt es keine garantierte Regalreservierung und keine bestätigten Punkte für solche Eigenmeldungen. Fotos/Audio werden nicht vom lokalen Server gespeichert; dort liegen nur die bestätigten Eingabeangaben. Die bestehende KI-Erkennung ist separat.

## Vytal: Rückgabe und Schäden

1. **Mehrweg → Ausleihe scannen**. Der Behälter wird dem angemeldeten Konto zugeordnet. Mehrfaches Scannen erzeugt keine zweite offene Ausleihe. Die Erfassung alleine gibt keine Punkte und ist keine Buchung im Vytal-Konto.
2. **Schaden melden** direkt am offenen Behälter: Riss/Bruch, Deckel, undicht oder anderer Schaden, optionale Beschreibung. Bleibt am Behälter sichtbar und wird bei der Prüfung am Rücknahmetresen angezeigt. Eine Schadensmeldung schließt die Ausleihe nicht und wird nicht automatisch an Vytal versendet. Die App verlinkt die [offizielle Rückgabe-/Schadenshilfe](https://www.vytal.org/de/faq/return).
3. Das **freigegebene Personal** öffnet `/ruecknahmestelle`, prüft den Behältercode und Schäden und bestätigt die tatsächliche Annahme. Daraus entsteht ein QR-Beleg für genau diese Ausleihe, gültig für drei Minuten. Neue Ausgabe entwertet den vorherigen Code. Der Laden kann eigene Ausleihen nicht bestätigen.
4. Der Kunde öffnet **Rückgabe-QR scannen** an seinem Behälter oder über den zentralen Scan-Knopf. Nur der passende Beleg eines weiterhin freigegebenen Ladens wird akzeptiert. Statische Store-QRs, beliebige Behältercodes, abgelaufene Codes und fremde Ausleihen zählen nicht.
5. Erst jetzt erscheinen Rückgabebeleg und serverseitige Gutschrift. Wiederholte Anfragen sind idempotent. Der Schnellbonus zählt nicht nochmals Verpackung oder CO₂. Derselbe Behälter bringt innerhalb von 24 Stunden keine weiteren Punkte. Demo-Behälter haben grundsätzlich keine Punkte.
6. Lokale Rückgabe-Erinnerungen werden nach erfolgreicher Erfassung geplant und nach bestätigter Rückgabe aufgehoben, soweit das Gerät Benachrichtigungen unterstützt und erlaubt. In Expo Go/Web bleibt das In-App-Postfach verfügbar. Maßgeblich für echte Leihfristen bleibt das Vytal-Konto (App-Ausleihe und Bankkarten-Ausleihe haben unterschiedliche Regeln).

### Einmalige Freigabe einer lokalen Rücknahmestelle

Es gibt **keinen Selbstfreischaltknopf und keine voreingestellten Ladenkonten**. Das Personal legt zuerst einen normalen Zugang an. Ein Betreiber mit Zugriff auf diesen Server ordnet das Konto anschließend einem bekannten Store zu:

```bash
cd apps/trust-server
node merchant.mjs stores
node merchant.mjs grant <Benutzername> <Store-ID>
# Bei Bedarf wieder entziehen:
node merchant.mjs revoke <Benutzername> <Store-ID>
```

`TRUST_DB` muss beim Verwaltungsbefehl dieselbe Datenbank wie beim Server bezeichnen. Keine Passwörter oder Händler-Schlüssel in die App kopieren. Diese manuelle Zuordnung ist eine Betreiberentscheidung; ein passender Store-Name beweist keine offizielle Vytal-Autorisierung.

**Die geschützte Vytal-Händler-API ist nicht angebunden.** Im Repository fehlen ein nutzbarer Händlerzugang, ein zugewiesener Testbehälter und ein bestätigter Zielhost. Mainsam-Belege können lokal vollständig geprüft werden, buchen aber keine externe Rückgabe und beenden keine echte Vytal-Leihfrist. Dafür braucht es den autorisierten Store-Adapter zu `ContainerReturn` und die Prüfung des anschließenden Partnerzustands. Grundlagen: `docs/VERTRAEGE.md`, Vytal-Abschnitt. Die Notion-Dokumentation war bei dieser Bearbeitung nicht erneut abrufbar; API-Verträge werden nicht erfunden.

## Sicherheit, Grenzen und bestehende Daten

Passwörter: zufälliger Salt + scrypt. Sitzungen: zufällige Tokens, nur Hash serverseitig, 30 Tage oder bis Abmeldung. Native Speicherung in SecureStore, Web im Browserspeicher. Tokens sind an genau eine Server-URL gebunden. Es gibt keine Passwort-Wiederherstellung per E-Mail.

Alle direkten mobilen `food.*`- und `reuse.*`-Punkteaufrufe bleiben ohne Serverautorität bei 0 Punkten und 0 bestätigtem Impact. Alte Selbstgutschriften werden bei Migration unbestätigt; echte vorhandene `trust:`-Belege bleiben erhalten. Früher nur lokal erfasste Behälter können ausdrücklich dem eigenen Konto zugeordnet werden. Serverseitige Daten sind die Quelle, der mobile Store ist nur Anzeigecache. Die gemeinsame Berechnung bleibt `reward.ts`, einschließlich Tagesdeckel/Degression. Lebensmittelmengen sind Schätzungen und zählen einmal beim Abholer. Gewöhnliche wiederholte Übergaben mit demselben Gegenüber erhalten sieben Tage lang keine neuen Punkte.

Dies verhindert Selbstbestätigung und konkrete Replay-/Rollenfehler, beweist aber keine physische Übergabe gegen Absprachen mehrerer Konten oder eines unredlichen Ladenmitarbeiters. Für öffentliche Nutzung fehlen kontrollierte Kontenaufnahme, Moderation, Recovery/Löschung, HTTPS/Betrieb und serverseitige Einlösung echter Prämien. Die übrige Punktebörse bleibt lokal. Der HTTP-Server ist für das eigene private Netz eingerichtet, nicht für öffentliches Hosting.

SQLite nicht löschen, wenn Zusagen, Konten und Belege erhalten bleiben sollen. Vor Backups Server stoppen. `TRUST_PORT` und `TRUST_DB` können abweichende Werte setzen.

## Prüfung

```bash
cd apps/mobile
npm run trust:test
npm run typecheck
npx expo export --platform ios --platform android --platform web
```

13 Testgruppen: bestehende Foodsharing-Rollen/Privatsphäre/Bestand/Bewertungen plus Ladenberechtigung, Schäden, statische/fremde/abgelaufene/wiederholte QR-Codes, konkurrierende Rückgabe, Bonus-Impact, atomare Lebensmittelposten, Terminkollisionen, Reservierungsablauf, persönlicher Abhol-QR und gemeinsamer Regalstand. Ausschließlich isolierte Datenbanken und synthetische Konten.
