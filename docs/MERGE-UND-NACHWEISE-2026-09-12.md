# Zusammenführung und Nachweise · 12. September 2026

## Git-Stand

- Zielbranch: `imad`, vorher `42d2c35`.
- Abgerufenes `origin/main`: `d83d3c0`.
- Merge: `e4eba99`, beide obigen Commits als Eltern. Beide Historien sind Vorfahren des aktuellen HEAD.
- Sicherung des ursprünglichen Branches: `codex/backup-imad-before-main-20260912`.
- Kein Push. Die nachfolgenden Funktionsänderungen liegen zusätzlich im Arbeitsverzeichnis.

Die fünf Konflikte wurden inhaltlich zusammengeführt: Audio/SecureStore und Video in der Expo-Konfiguration; neue FES-Handeln-Seite aus Main mit Links zum bisherigen Aktionsüberblick (`aktionen.tsx`) und Foodsharing; Fahrtansicht samt Clips und Haltestellen aus Main; sichere Foodsharing-Zusagen aus imad; Kartensteuerung aus Main zusammen mit OpenStreetMap-Kacheln. Es wurde kein Branch pauschal über den anderen gelegt.

## Neue Abläufe

Foodsharing unterstützt Lebensmittelposten mit getrennten Portionszahlen, feste Abholtermine, Zusagen und einen persönlichen QR des Abholers. Der Anbieter prüft die Portion und scannt diesen Code bei der Übergabe. Gemeinsamer Bestand, geschützter Treffpunkt, Reservierungsablauf und Bewertungen werden vom lokalen Server verwaltet. Foto, Audio und manuelles Erfassen bleiben erhalten. Offene Regale teilen zeitlich gekennzeichnete Beobachtungen; diese sind keine garantierten Reservierungen oder bestätigten Rettungsnachweise.

Mehrweg-Rückgaben benötigen den einmaligen, drei Minuten gültigen Beleg eines vom Betreiber freigegebenen Ladenkontos. Das Personal kann nur fremde offene Ausleihen bestätigen. Ein statischer Store-Aufkleber oder die eigene Bestätigung reichen nicht. Schäden lassen sich am Behälter melden und sind bei der Rücknahme für das Personal sichtbar. Rückgaben und Boni werden ausschließlich nach serverseitiger Prüfung gutgeschrieben.

Karten und Dialoge erscheinen mit kurzen zeitgesteuerten Animationen. Die Tab-Markierung bricht alte Bewegungen ab, begrenzt ihre Position und wird innerhalb der Leiste beschnitten. Die Web-Navigation verwendet native Browser-Schaltflächen; der zentrale Scan-Zugang ist ebenfalls darüber erreichbar.

## Erfolgreiche Prüfungen

- TypeScript: `npm run typecheck`.
- 13 Testgruppen: `npm run trust:test`, 13 bestanden, 0 fehlgeschlagen. Rollen, Privatsphäre, Bestand/Konkurrenz, Codes/Verfall, Bewertungen, Wiederholungen, Neustart-Persistenz, Händlerfreigaben/Widerruf, Schäden, einmalige Rückgaben, Bonus-Impact, Verteilung/Termine und Regalmeldungen.
- KI-Adapter: `node tools/check-ai.cjs` (Text/Bild/Audio, MIME und Fehlerfälle; keine neue kostenpflichtige Anfrage).
- Erfolgreiche Expo-Exporte für iOS, Android und Web nach den finalen UI-Änderungen.
- `git diff --check`; beide Git-Vorfahren geprüft.
- Browser mit synthetischen Konten und separater Datenbank: Ausleihe, Schadensmeldung, vom Laden ausgestellter Beleg und bestätigte Rückgabe; Foodsharing-Angebot, Anfrage/Zusage, persönlicher QR-Abschluss; Ladenansicht zeigt Schäden und QR-Ausgabe mit Ablaufzeit.
- Wiederholte Tabwechsel über alle vier Tabs, einschließlich Kartenansicht. Bei 390 px Breite blieb der Indikator innerhalb seines Containers (rechts 375,999 px bei Containergrenze 376 px). Zentraler Scan-Knopf von der Karte aus geprüft.

## Betriebsgrenzen

Start und einmalige Freigabe eines Ladenkontos: [Server-Anleitung](../apps/trust-server/README.md). Zwei Prozesse im privaten Hotspot/LAN: `npm run trust:lan` und `npm run start:lan` aus `apps/mobile`. Keine öffentliche Freigabe eingerichtet. Testkonten und Testbelege wurden nur in einer separaten temporären Datenbank angelegt; die vorhandene Datenbank bleibt erhalten.

Ein Mainsam-Beleg beendet keine echte Vytal-Leihfrist: Der geschützte Händleradapter ist mangels autorisiertem Zugang und verifiziertem Testbehälter nicht angeschlossen. Schadensmeldungen bleiben ebenfalls in Mainsam. Mehrere kolludierende Konten oder unehrliches Personal können auch ein gegenseitiges Verfahren täuschen. Native Kamera, Mikrofon und schnelles Tippen müssen zusätzlich auf dem physischen Handy geprüft werden; Exporte und Browserprüfung ersetzen diesen Gerätetest nicht.
