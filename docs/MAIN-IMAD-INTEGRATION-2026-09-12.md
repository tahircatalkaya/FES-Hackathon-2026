# Main und imad · Integrationsprotokoll vom 12. September 2026

## Ausgangspunkte und Sicherungen

- `imad`: `3ebd27c`, Arbeitsverzeichnis zu Beginn sauber.
- Abgerufenes `origin/main`: `f45ce3a` (neun noch nicht in imad enthaltene Commits).
- Sicherungen: `codex/backup-imad-before-team-merge-20260912` und `codex/backup-main-before-team-merge-20260912`.

Main wurde zuerst in imad integriert und dort geprüft. Der gemeinsame Stand wird anschließend ohne Überschreiben vorhandener Historie nach main übernommen. Die alten Commits bleiben erreichbar; kein Rebase, Squash oder Force-Push.

## Zusammengeführte Bereiche

| Bereich | Ergebnis |
| --- | --- |
| Navigation | Einheitliches Navy-Design und positionsunabhängige Tab-Einheiten aus Main; zeitgesteuerte Bewegung, Begrenzung, Clipping und native Web-Schaltflächen aus imad |
| Profil | Neues Profil samt Sprachmenü, Daten, Wochen-/Entwicklungszustand; Foodsharing-, Partner- und Journal-Zugänge erhalten |
| Scanner | Neuer Müll-Fotonachweis und Vytal-Marke aus Main; persönliche Foodsharing-/Rückgabe-QRs und serverseitige Ausleihen aus imad; vorhandene Fahrt-/Behälter-/Peer-Routen erhalten |
| Mehrweg | Rückgabe nur über geprüften Ladenbeleg. Erinnerungen erst nach erfasster Ausleihe; keine vorschnelle Erinnerung nur beim Öffnen des Scanners |
| Erscheinen | Kurze zeitgesteuerte Animation mit begrenzter Verschiebung und Systemoption „Bewegung reduzieren“; Container bleiben im Layout, statt sich im Web zu überlagern |
| Store | Neue Profil- und Fotozustände, Wochenberechnung und Entwicklungsstufen aus Main; bestätigte Serverbelege und Behältercache aus imad |
| Weitere Main-Seiten | Neues Onboarding, Impact, Frankfurt/Globus, Datenexport und Mobilitätsexport übernommen |

Der bisherige Lastenrad-Kartenfilter wurde auf Main bewusst entfernt; dessen Entfernung bleibt bestehen. Die Initiative bleibt auf der Partnerseite erreichbar. Main-Inhalte wurden nicht pauschal durch die alte Branch-Version ersetzt.

## Behobene Anschlussfehler

- Profil-Ausloggen beendet auch die Foodsharing-/Mehrweg-Serversitzung und leert deren Anzeigecache. Bei Nichterreichbarkeit werden die lokalen Zugangsdaten trotzdem entfernt.
- „Lokale Daten löschen“ nennt ihren tatsächlichen Umfang; Serverkonten und Belege werden nicht als gelöscht dargestellt.
- Der Müll-Nachweis liest für jedes Foto einen neuen, ausreichend genauen Standort. Der Demo-Kartenpunkt, ungültige Zahlen, fehlende Genauigkeit und veraltete Messungen zählen nicht.
- Kamera-/Standortfehler werden als Meldung angezeigt. Native Bildfingerabdrücke benötigen echte Bilddaten statt nur einer Datei-URI.
- Die gemeinsame Web-Schaltfläche verwendet native Browser-Klick-/Tastatur- und Disabled-Semantik; native Apps behalten ihre Pressable-Animation.
- Die Start-Navigation wartet auf das geladene Geräteprofil und die React-Hydrierung. Ein Neuladen einer Unterseite führt bei vorhandenem Profil nicht mehr kurz über das Onboarding zurück zur Karte.

## Validierung

- TypeScript-Prüfung bestanden.
- Foodsharing-/Mehrweg-Server: 13/13 Testgruppen bestanden, isolierte Datenbanken.
- Müll-Nachweis: 4/4 Testgruppen bestanden (Zeitgrenzen, Ort, Bildwiederverwendung, ungültige/alte Nachweise; keine Müllstück-Punkte).
- Vorhandene Python-Integrationsdemo: 18/18 Tests bestanden.
- KI-Adapterprüfung bestanden, ohne echte KI-Anfragen.
- Expo-Exporte für iOS, Android und Web bestanden.
- Expo-Abhängigkeitsprüfung offline: vorhandene SDK-Zuordnung meldet passende Versionen; keine Online-Registry-Prüfung.
- Browserprüfung bei 390 × 844 Pixeln bestanden: Onboarding bis zur Hauptseite, Profilkarten ohne Überlagerung, Impact, Foodsharing-Zugang, Partnerseite, Scanner-Auswahl, Müll-Fotonachweis und Ausloggen.
- Sechs aufeinanderfolgende Tab-Wechsel: jeweils das richtige Tab ausgewählt und die Markierung innerhalb ihrer Begrenzung. Unterseite nach Neuladen mit gespeichertem Profil erhalten.

## Teamstart und Grenzen

[README im Repository](../README.md) und [Server-Anleitung](../apps/trust-server/README.md) erklären die beiden Terminalprozesse, private Netzverbindung und einmalige Ladenfreigabe. Bestehende `.env` und `data/trust.sqlite` erhalten. Keine öffentlichen Tunnel oder neue externen Dienste eingerichtet.

Ein Mainsam-Rückgabebeleg ist noch keine echte Buchung im Vytal-Konto. Fotonachweise sind lokale Plausibilitätsprüfungen, keine externe FES-Bestätigung. Physische Kamera, Mikrofon und GPS sowie gleichzeitige Bedienung auf zwei Handys sind durch Browser und Export nicht abschließend geprüft.
