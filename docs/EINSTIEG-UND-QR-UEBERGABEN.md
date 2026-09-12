# Gemeinsamer Einstieg und schnelle Übergaben

Stand: 12. September 2026, auf `imad2` umgesetzt. Kein externer Identitätsdienst und keine neue kostenpflichtige API erforderlich.

## App und Server starten

In `apps/mobile`: `npm run dev:lan`. Der Befehl startet den lokalen SQLite-Server auf Port 8787 und danach Expo Go im LAN. Ctrl+C beendet beide Prozesse. Vorher bereits laufende Expo- und Server-Terminals stoppen. Bei einem belegten Serverport startet der Befehl keine zweite App-Vorschau und beendet keine fremden Prozesse. Alternativ: `npm run trust:lan` und `npm run start:lan` in zwei Terminals.

Node 22.18+; Handy und Rechner im gleichen privaten WLAN/Hotspot. Keine öffentlichen Tunnel. Nur `npx expo start` startet weiterhin lediglich Expo, ohne Übergabeserver. Bei einem abweichenden Serverport muss `EXPO_PUBLIC_TRUST_URL` auf die private Serveradresse zeigen. Veröffentlichte Builds benötigen HTTPS.

## Ein Zugang am Anfang

Nach den drei Tutorialseiten kommt ein Formular für Benutzername, E-Mail und Passwort. Alternativ gibt es „Ohne Anmeldung weiter“. Das Anmeldeformular existiert ausschließlich am Einstieg, nicht bei einzelnen Foodsharing-/Mehrwegaktionen. Ausgelaufene reguläre Sitzungen führen zum gemeinsamen Einstieg. Bei Netzwerkproblemen erscheint eine Wiederverbindung, kein weiteres Passwortformular.

Bestehende Serverkonten bleiben nutzbar, auch wenn früher keine E-Mail hinterlegt wurde. Neue Registrierungen brauchen eine eindeutige E-Mail und ein Passwort mit 10–128 Zeichen. Login über E-Mail oder Benutzername. Passwörter werden mit scrypt abgeleitet; Sitzungstoken werden nativ im SecureStore abgelegt. E-Mail, Passwort und Passwortableitungen erscheinen nicht in öffentlichen Angeboten oder Regalmeldungen. Öffentlicher Name und pseudonyme ID genügen für die Zuordnung.

Gäste erhalten eine zufällige, auf dem Gerät gespeicherte Sitzung ohne Eingabe von E-Mail oder Passwort. Beim späteren Registrieren wird dieselbe Nutzer-ID übernommen; Zusagen und Meldungen bleiben erhalten. Frühere Gastbelege bekommen nicht rückwirkend Punkte. Nach Verlust/Abmeldung der Gastsitzung gibt es keine Wiederherstellung. Die E-Mail wird noch nicht verifiziert; E-Mail-Passwortreset ist nicht eingerichtet. Zusätzliche Kontakt-/Profilfelder in „Meine Daten“ ändern keine Server-Zugangsdaten.

## Welche QR-Codes wofür gelten

| Code | Bedeutung | Punkte beim Scan? |
| --- | --- | --- |
| `mainsam:shelf:<Regal-ID>` | Registriertes Regal öffnen | Nein |
| `mainsam:offer:<Angebots-ID>` | Bestimmtes Angebot öffnen | Nein |
| `mainsam:provider:<Nutzer-ID>` | Öffentliche Angebote eines Verteilers öffnen | Nein |
| `mainsam:store:<Store-ID>` | Rückgabe am Restaurant öffnen | Nein |
| Persönlicher QR oder vier Ziffern | Genau eine bereits ausgewählte Übergabe/Meldung/Rückgabe bestätigen | Erst nach serverseitiger Prüfung |

Die Ortscodes sind in der App an Regal/Angebot/Rücknahmestelle anzeigbar. Wer Angebote veröffentlicht, kann außerdem unter Übergaben den eigenen Verteiler-QR für alle Angebote zeigen. Sie werden unter „Scannen → Regal, Verteiler oder Restaurant scannen“ gelesen. Es sind interne Mainsam-Codes, keine universellen Links für die iPhone-Kamera und keine offiziellen foodsharing-/Vytal-Codes. Physische Aufkleber müssen die beteiligten Orte selbst bereitstellen. Der Scan lädt einen Ort, er beweist keine Anwesenheit.

## Persönliche Foodsharing-Übergabe

1. Ohne Passwortabfrage Angebot öffnen, Portion und ggf. Termin anfragen.
2. Verteiler sagt zu; Bestand und Termine bleiben serverseitig reserviert.
3. Abholende Person zeigt vor Ort ihren persönlichen QR oder nennt vier Ziffern.
4. Verteiler öffnet diese Zusage, prüft die Portion und bestätigt mit dem Code.
5. Beleg und Bewertungsmöglichkeit erscheinen. QR-Wiederholung erzeugt keinen zweiten Beleg. Dieselbe Personenkombination wird innerhalb von sieben Tagen nur einmal gewertet; Tagesgrenzen bleiben bestehen.

Gastübergaben geben **beiden Seiten null einlösbare Punkte**. Sonst könnten Verteiler durch immer neue Gastzugänge Punkte sammeln. Das Essen bleibt trotzdem ohne Registrierung zugänglich. Gastbewertungen werden nicht in die öffentliche Zuverlässigkeitsstatistik eingerechnet; bekannte neutrale/zeitversetzte Bewertungsregeln bleiben erhalten.

## Offenes Regal

Orts-QR scannen → Abholen, Einstellen oder Regal melden → Foto, Audio oder Texteingabe wie bisher. Die Meldung wird mit anderen geteilt, auch als Gast. Foto/Audio helfen bei der Erfassung; sie werden nicht als automatische Beweise einer Übergabe ausgegeben.

Ist eine freigegebene Betreuung vor Ort, zeigt die meldende Person innerhalb von 30 Minuten ihren persönlichen Code. Unter „Profil → Regalmeldungen & Betreuung“ prüft die Betreuung die konkrete Aktion und bestätigt mit QR oder vier Ziffern. Der Code selbst gilt höchstens fünf Minuten. Eigene Meldungen oder fremde Regale darf die Betreuung nicht bestätigen.

Ohne Betreuung bleibt der Eintrag unbestätigt, ohne Punkte. Für dieselbe Person, denselben Ort und dieselbe Aktion gibt es innerhalb von 24 Stunden höchstens eine gewertete Meldung. Das Einlösen eines alten QR ist idempotent. Mengen bleiben Schätzungen; Einstellen erzeugt keinen zusätzlichen geretteten Lebensmittel-Impact neben der Abholung.

Betreiberfreigabe im Serververzeichnis:

```bash
node merchant.mjs shelves
node merchant.mjs grant-shelf BENUTZERNAME REGAL_ID
node merchant.mjs revoke-shelf BENUTZERNAME REGAL_ID
```

Es werden keine bestehenden Konten automatisch zur Betreuung ernannt. Ohne diese einmalige Zuordnung entstehen keine bestätigten Regalpunkte.

## Restaurant-Rückgabe

Restaurant-QR öffnet die Rückgabe. Gast oder Mitglied wählt seinen offenen Behälter. Freigegebenes Personal nimmt ihn entgegen, prüft einen ggf. gemeldeten Schaden und erstellt einen frischen Beleg. Die abgebende Person scannt ihn oder gibt vier Ziffern ein. Der Code gilt drei Minuten und nur für diese Ausleihe und deren Besitzer. Derselbe Behälter gibt innerhalb von 24 Stunden keine erneuten Rückgabepunkte. Schäden bleiben bei der Rücknahme sichtbar.

Die bestehende Ladenfreigabe `node merchant.mjs grant BENUTZERNAME STORE_ID` bleibt erforderlich. Ein Mainsam-Beleg beendet weiterhin **keine echte Vytal-Leihfrist**; dafür fehlt der autorisierte externe Händleradapter.

## Missbrauchsschutz und Grenzen

Vierstellige Codes sind niemals globale Such- oder Anmeldecodes. Die App muss zuerst eine autorisierte Zusage, Regalmeldung oder Ausleihe öffnen. Fünf falsche PIN-Versuche sperren diese PIN-Prüfung; neue Codes setzen das Limit nicht zurück. Höchstens zehn PIN-Ausstellungen pro Aktion; der lange QR bleibt als Alternative nutzbar. Fehlversuche und Belege bleiben in SQLite über Neustarts erhalten. Rolle, Besitzer, Ablauf, Einmaligkeit und Belohnungsgrenzen werden auf dem Server geprüft.

Unregistrierte Besucher werden nicht vom Essen ausgeschlossen. Belohnungen setzen jedoch einen regulären Zugang und den passenden unabhängigen Beleg voraus. Kollusion mehrerer Konten, fingierte E-Mail-Adressen und unehrliche Betreuung sind damit nicht vollständig ausgeschlossen. Für einen öffentlichen Betrieb wären verifizierte Betreiber, Kontoverifizierung, Missbrauchsprüfung und sichere Bereitstellung nötig.

## Video-Absturz

Die bisherige Effektbereinigung rief `pause()` auf, nachdem `useVideoPlayer` das native Shared Object bereits freigegeben hatte. Die Wiedergabe startet jetzt im Setup des Hooks. Beim Unmount gibt es keinen nachträglichen Player-Aufruf und keinen verzögerten Start-Timer. Das Belohnungsoverlay erzeugt den Clip nur, wenn es geöffnet ist. Siehe [Expo Video SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/video/#usevideoplayersource-setup-playerbuilderoptions).

## Prüfung

- TypeScript und iOS-/Android-/Web-Export erfolgreich.
- 18 Server-Testgruppen, darunter E-Mail-Login, Gastmigration, Gast-Punktegrenzen, vierstellige Codes, Rollen, abgelaufene Belege, Neustart mit Fehlversuchen und Regal-Wiederholungen.
- Drei Client-Tests für parallele Gastsitzungen, Kontowechsel und verspätete 401-Antworten (`npm run test:session`).
- Vier Fotonachweis-Testgruppen und der KI-Adaptertest weiterhin erfolgreich.
- Gemeinsamer LAN-Start mit isolierter Testdatenbank: API-Health und Metro erreichbar.
- Browser: Tutorial bis zu den Zugangsfeldern, Regal-QR-Navigation, Foto-/Audio-/Textauswahl und manuelle Erfassung ohne Anmeldung, zentraler Gast-Einstieg, Gastanfrage, Wiederaufnahme ohne Login, Codeanzeige, E-Mail-Login des Gegenübers und erfolgreicher Abschluss per vier Ziffern.

Physische Kamera-/Audio-/GPS-Aufnahme und der konkrete Expo-Go-Absturz auf einem iPhone können hier nicht abschließend nachgestellt werden. Der unzulässige Player-Aufruf aus dem gemeldeten Stacktrace wurde entfernt; bitte den Fahrtstart nach Neustart mit Expo Go prüfen.
