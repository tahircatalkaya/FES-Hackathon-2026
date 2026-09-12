# Bestätigte Übergaben und Erfahrungen

Lokaler, persistenter Dienst für persönliche Foodsharing-Übergaben. Node **22.18+** ist erforderlich (SQLite und TypeScript-Unterstützung sind eingebaut). Keine kostenpflichtigen Dienste, keine zusätzlichen Server-Pakete, keine voreingestellten Konten.

## Start im privaten Hotspot/LAN

Mac und Handy müssen im selben privaten Netz sein. Im App-Verzeichnis:

```bash
cd apps/mobile
npm install --include=optional
npm run trust:lan
```

In einem zweiten Terminal im selben Verzeichnis:

```bash
npm run start:lan
```

QR-Code mit Expo Go öffnen. Die Entwicklungs-App findet den Übergaben-Dienst unter derselben privaten IP wie Metro auf Port 8787. Beide Terminalprozesse müssen laufen. Nur zum Testen auf dem Mac reicht `npm run trust:start` (bindet 127.0.0.1). Kein öffentlicher Tunnel erforderlich.

Ein abweichender Server lässt sich mit `EXPO_PUBLIC_TRUST_URL` einstellen; bei veröffentlichten Builds ist ein expliziter HTTPS-Endpunkt erforderlich. Die bestehenden Google-Variablen bleiben unverändert. Nach Änderungen Expo neu starten. Falls die Verbindung im privaten Netz ausbleibt: eingehende Verbindungen für Node auf Port 8787 in den Mac-Firewall-Einstellungen erlauben.

## Ablauf mit zwei Personen / Geräten

1. Profil → **Übergaben & Zuverlässigkeit**. Jede Person legt einen eigenen Zugang mit Benutzername und Passwort an; E-Mail, Telefonnummer und amtliche Identitätsdaten sind nicht erforderlich.
2. **Anbieten**: eine Portion per bestehender Kamera-, Audio- oder Texteingabe erfassen. Anzahl gleich zusammengestellter Portionen, Stadtteil, privaten Treffpunkt und Zeitfenster wählen. Veröffentlichen vergibt keine Punkte.
3. Zweite Person fragt eine Portion an. Der Server reserviert diese atomar. Es gibt maximal eine offene Abholung je Konto und eine Portion je Person und Angebot.
4. Anbieter entscheidet über die Zusage. Es gibt keine automatische Annahme. Der Treffpunkt wird erst nach Zusage ab 15 Minuten vor dem Zeitfenster und nur bis zum Ende gezeigt.
5. Vor Ort erzeugt nur der Anbieter einen sechsstelligen Code. Gültigkeit: höchstens zehn Minuten und nie nach Ende des vereinbarten Fensters. Ein neuer Code ersetzt den alten. Maximal fünf Code-Ausgaben und fünf Fehlversuche je Übergabe; Neu-Anmelden setzt die Grenzen nicht zurück.
6. Abholer prüft die vereinbarte Portion und bestätigt den Empfang durch Eingabe des Codes. Erst jetzt kann der Anbieter die tatsächliche Übergabe bestätigen. Beide Aktionen prüfen unterschiedliche authentifizierte Konten. Wiederholte Abschlussanfragen erzeugen keine weiteren Belege oder Punkte.
7. Jeder kann genau eine Bewertung abgeben: Zufriedenheit, Zuverlässigkeit, Respekt / vereinbarte Menge (je 1–5). Nur abgeschlossene Übergaben, höchstens 14 Tage danach. Sichtbarkeit erst nach beiden Bewertungen oder nach 14 Tagen; öffentliche Werte erst ab drei unterschiedlichen Gegenübern. Eine Person zählt unabhängig von der Zahl gemeinsamer Übergaben einmal.
8. Probleme wie frühes Erscheinen, zusätzliche Mitnahme oder respektloses Verhalten können beide privat zur Übergabe vermerken und widersprechen. Ein Nichterscheinen setzt eine tatsächliche Zusage und 15 Minuten Nachfrist voraus. Es gibt keine automatische öffentliche Beschuldigung oder Sperre; eine Moderationsstelle ist noch nicht angebunden.

Nach dem Empfang hat der Anbieter 24 Stunden zum Abschluss. Ungeklärte Fälle bleiben ohne Punkte als ungeklärt sichtbar. Nicht abgeschlossene Anfragen/Zusagen verfallen nach dem Zeitfenster und geben die Portion wieder frei. Ein bereits bestätigter Empfang wird dabei nicht als wieder verfügbar angeboten.

## Nachweise, Punkte und Bestand

- Kamera / Audio / GPS und die externe Foodsharing-Test-API allein gelten nicht als Übergabenachweis. Offene Fairteiler ohne Gegenüber bleiben als Erfassung nutzbar, aber ohne Punkte oder bestätigten Impact.
- Alle direkten `food.*`-Aufrufe der mobilen Punktefunktion liefern ohne Server-Autorität 0 Punkte und 0 Impact. Das betrifft auch vermeintlich „bestätigte“ Client-Metadaten.
- Erst der Server erstellt aus dem abgeschlossenen Vorgang Ereignisse. Er verwendet dieselbe `reward.ts` wie die App; es gibt keine zweite Berechnungsformel. Wiederholungen mit demselben Gegenüber innerhalb von sieben Tagen erhalten keine weiteren Punkte, pro Rolle maximal zwei gewertete Übergaben am Tag. Die übrigen Deckel und Degression gelten ebenfalls.
- Die App übernimmt die Serverbelege als Anzeigecache ins Journal. Bei Abmeldung werden die Belege des abgemeldeten Kontos aus diesem Cache entfernt. Eigenmeldungen bleiben sichtbar. Vorhandene alte Foodsharing-Gutschriften aus Selbstbestätigungen werden beim Store-Upgrade zu unbestätigten Erfassungen ohne Punkte/Impact.
- Lebensmittelmengen bleiben **Schätzungen**. Sie zählen pro Übergabe einmal beim Abholer; der Anbieter bekommt Anerkennung für die Weitergabe, keine zweite Kopie derselben Masse.
- Der Server verwaltet die eigenen Mainsam-Angebote. Externe Essenskörbe haben keine automatisch zuordenbare Anbieter-Identität für diesen Dienst. Deren bestehende Anfragen bleiben nutzbar, erzeugen aber keine falschen Belege. Beispiel-Verteilungen sind als Beispiele markiert; reale Zusagen laufen über Übergaben.

## Grenzen und Weiterbetrieb

Dies verhindert Selbstbestätigungen und mehrere konkrete Manipulationswege, ist aber kein Beweis für den physischen Inhalt einer Übergabe. Zwei Personen können sich absprechen oder eine Person mehrere Konten anlegen. Für einen öffentlichen Betrieb sind kontrollierte Kontoaufnahme/Identitätsbindung, Moderation und die Verknüpfung mit einem autorisierten Anbieter-Backend erforderlich. Die Lernseite vergibt keine Foodsaver- oder Mentor-Freigaben mehr selbst.

Der lokale Server nutzt HTTP im privaten Netz. Er ist **nicht für öffentliches Hosting eingerichtet**. Für einen öffentlichen Betrieb: HTTPS, explizite `TRUST_ORIGIN`, zuverlässige Konto-Wiederherstellung, serverseitige Einlösung echter Prämien, Datenschutz-/Löschverfahren und Betriebsüberwachung ergänzen. Die übrige Punktebörse der App ist weiterhin lokal; serverseitige Foodsharing-Belege allein machen sie nicht zu einer manipulationssicheren Prämienplattform.

Passwörter werden mit zufälligem Salt und scrypt gespeichert; Session-Tokens nur gehasht. Auf dem Handy liegen Sitzungstokens in Expo SecureStore, im Browser im lokalen Browserspeicher. Ein Token wird nur an den Server gesendet, zu dem er gehört. Die Sitzung endet nach 30 Tagen oder beim Abmelden. Es gibt keine Passwort-Wiederherstellung über E-Mail. Rohfotos und Audio werden von diesem Dienst nicht gespeichert; übermittelt werden die geprüften Lebensmittelangaben. Die bestehende KI-Verarbeitung bei Google bleibt separat.

SQLite liegt in `apps/trust-server/data/trust.sqlite` (gitignored). Nicht löschen, wenn Konten, Zusagen und Bewertungen erhalten bleiben sollen. Vor Sicherungen den Server stoppen. `TRUST_DB` erlaubt einen anderen Speicherort, `TRUST_PORT` einen anderen Port. Neue Deployments dürfen keine getrennten SQLite-Dateien für dieselben Nutzer verwenden.

## Prüfen

```bash
cd apps/mobile
npm run trust:test
npm run typecheck
```

HTTP-Tests benutzen isolierte Datenbanken und ausschließlich Testkonten: Selbstbelohnung, getrennte Rollen, Fremdzugriff, versteckter Treffpunkt, Idempotenz, parallele Reservierungen, Code-Ablauf/Fehlversuche, Bewertungsgrenzen, neutrale neue Konten und Persistenz nach Neustart.

Technische Quellen: [Node TypeScript](https://nodejs.org/docs/latest-v22.x/api/typescript.html), [Node SQLite](https://nodejs.org/docs/latest-v22.x/api/sqlite.html), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/). Grenzen der verbundenen Test-API: `Foodsharing API/API-GUIDE.md`, Abschnitte 2 und 6.
