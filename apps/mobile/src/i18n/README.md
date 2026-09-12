# Übersetzungen

Die App bietet Deutsch, Englisch, Türkisch, Arabisch, Kroatisch (`hr`, Hrvatski) und
Italienisch (`it`, Italiano) im Onboarding und Profil an. Die Auswahl wird mit dem
Profil gespeichert. Bestehende Profile mit `leicht` behalten ihre einfache
deutsche Übersetzung; diese Variante ist wie bisher nicht im Sprachmenü sichtbar.

`base.ts`, `tabs.ts`, `routes.ts`, `components.ts`, `data.ts`, `proofs.ts` und `errors.ts` enthalten
die Sprachtabellen. Jede Zeile enthält **alle sieben** Texte in dieser Reihenfolge:

```ts
'bereich.schluessel': [de, en, tr, ar, hr, it, leicht]
```

`TranslationTable` erzwingt vollständige Zeilen. Neue UI-Texte werden über `useT()`
angezeigt. Für dynamische Werte stehen benannte Platzhalter zur Verfügung:
`t('data.stageNext', { points: 25, stage: 'Diamante' })`. Namen und Mengen dürfen
nicht durch das Zusammensetzen übersetzter Satzfragmente eingebaut werden.

`useLocale()` liefert die Locale für `Intl`-Zahlen- und Datumsformatierung.
`useLocalize()` übersetzt bekannte integrierte Inhalte und gespeicherte deutsche
App-Meldungen beim Anzeigen. Fachliche Statuswerte, IDs, Rechenregeln, Ortsnamen
und unbekannte externe Texte bleiben erhalten. App-generierte Journal-Texte in
Deutsch speichern (`translate('de', key, params)`), damit ein späterer Sprachwechsel
auch die Historie übersetzen kann. Freitext von Nutzerinnen und Nutzern bleibt
unverändert.

Prüfen: `npm run test:i18n` und `npm run typecheck`. Die Tests erkennen leere oder
fehlende Übersetzungen, abweichende Platzhalter, doppelte Schlüssel und fehlende
integrierte Lern-, Belohnungs- und Aktionstexte.
