import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Header } from '@/components/Screen';
import { Card, Divider, Row, T, Tag } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { SERVICE_DAY } from '@/engine/matching';
import { FS_BASE } from '@/api/foodsharing';
import { VYTAL_GRAPHQL } from '@/api/vytal';

/** Transparenz: was woher kommt, was die App speichert, was aggregiert exportiert wird. */
export default function Daten() {
  const s = useStore();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('home'); }, []);

  const exportRows = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of s.ledger) if (l.type === 'ride.transit' && l.meta?.mode) { const k = `${String(l.title).split(' ')[0]}|${new Date(l.at).getHours()}`; m[k] = (m[k] ?? 0) + 1; }
    return Object.entries(m).map(([k, n]) => ({ line: k.split('|')[0], hour: k.split('|')[1], n }));
  }, [s.ledger]);
  const json = JSON.stringify({ profile: { name: s.name, district: s.district, lang: s.lang }, ledger: s.ledger.length, containers: s.containers.length, reservations: s.reservations.length, reports: s.cleanReports.length, gps_raw_traces: 0 }, null, 1);

  return (
    <Screen tabBar={false}>
      <Header title="Daten & Quellen" subtitle="bestätigt · Nutzereingabe · geschätzt · Demo" />
      <Card>
        <Text style={T.h3}>Vier Arten von Daten, immer gekennzeichnet</Text>
        <View style={{ marginTop: 8, gap: 6 }}>
          {[['bestätigt', 'Ereignis aus einer Partner-Schnittstelle (foodsharing-Pickup, Vytal-Rückgabe, FES-Ticket)'], ['plausibel', 'Aus Daten abgeleitet, mit Konfidenz (GPS-Spur gegen GTFS)'], ['selbst angegeben', 'Nutzereingabe ohne externen Beleg'], ['geschätzt', 'Impact-Werte aus dokumentierten Faktoren, nie gemessen']].map(([k, v]) => (
            <Row key={k} style={{ alignItems: 'flex-start' }}><Tag label={k} color={k === 'bestätigt' ? C.success : k === 'plausibel' ? C.mobility : k === 'geschätzt' ? C.community : C.muted} /><Text style={[T.small, { flex: 1 }]}>{v}</Text></Row>
          ))}
        </View>
      </Card>

      <Text style={[T.h2, { marginTop: S.xl }]}>Quellen</Text>
      <View style={{ marginTop: 10, gap: 8 }}>
        {[
          { p: 'Frankfurt foodsharing', ctx: 'food', d: `Live-API ${FS_BASE} (v2.4.0): Fairteiler, Körbe, Anfragen, Abholungen, Verifikation. Fallback: Snapshot vom 11.09. Beschreibung/Adresse/Öffnungszeiten sind in der API leer und werden nicht erfunden.` },
          { p: 'Vytal', ctx: 'reuse', d: `Store-Suche per GraphQL (${VYTAL_GRAPHQL}, ANONYMOUS). Ausleihe/Rückgabe laut Vytal-Doku (Containers/Checkout, Container/ContainerReturn, Store-JWT). Im Prototyp simuliert; Bestätigung wird genau einmal je transactionId gewertet.` },
          { p: 'Transdev / RMV', ctx: 'mobility', d: `GTFS Frankfurt+30 km, Fahrplan ${SERVICE_DAY}: U1–U9, S1–S9, Tram 11–21 als Muster mit Abfahrten. Matching läuft on-device. GPS-Testspuren synthetisch aus shapes.txt, inkl. einer bewusst falschen Autofahrt.` },
          { p: 'traffiQ', ctx: 'community', d: 'haltestellen_avg.csv, tagesgang_avg.csv, BeispielAFZ.csv (4 Originalfahrten, Rest synthetisch), BeispielDataSetEFA.csv (27 original), e-scooter-beispiel.csv (20 original). Im UI als Demo-Daten markiert.' },
          { p: 'FES', ctx: 'clean', d: 'Keine verbindlichen Daten geliefert. Clean-ups, Behälter, Tickets sind simuliert. Konzept: Anwesenheit + Peer-Attestierung + Vorher/Nachher + FES-Bestätigung.' },
          { p: 'MainLastenrad', ctx: 'mobility', d: 'Mock: drei Räder mit Verfügbarkeit als Kartenlayer.' },
          { p: 'Emissionsfaktoren', ctx: 'community', d: 'UBA/TREMOD-Richtwerte (Pkw 154, Bus 83, Schiene 55, E-Scooter 95 g/Pkm). Vor Produktivbetrieb gegenprüfen. Lebensmittel 2 kg CO₂e/kg, Einwegschale 60 g (Schätzungen).' },
        ].map((x) => (
          <Card key={x.p} style={{ borderLeftWidth: 4, borderLeftColor: (CONTEXT as any)[x.ctx].color, paddingVertical: 12 }}>
            <Text style={T.h3}>{x.p}</Text><Text style={T.small}>{x.d}</Text>
          </Card>
        ))}
      </View>

      <Text style={[T.h2, { marginTop: S.xl }]}>Was die App über dich speichert</Text>
      <Card style={{ marginTop: 10 }}>
        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: C.ink2 }}>{json}</Text>
        <Divider />
        <Text style={T.small}>Alles lokal auf dem Gerät. Keine E-Mail, keine Telefonnummer, keine Adresse, keine GPS-Rohspuren (Spuren werden nach dem Matching verworfen).</Text>
      </Card>

      <Text style={[T.h2, { marginTop: S.xl }]}>Aggregierter Export (Vorschau)</Text>
      <Card style={{ marginTop: 10 }}>
        <Text style={T.small}>Für Transdev/traffiQ: Linie, Stunde, Anzahl erkannter Fahrten. Zeilen mit weniger als 5 Personen würden produktiv unterdrückt (k ≥ 5). Opt-in in den Einstellungen: {s.privacy.shareAggregates ? 'an' : 'aus'}.</Text>
        <View style={{ marginTop: 8, backgroundColor: C.bg, borderRadius: 12, padding: 10 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 12, color: C.ink }}>line,hour,count,k_ok{'\n'}{exportRows.length ? exportRows.map((r) => `${r.line},${r.hour},${r.n},${r.n >= 5 ? 'true' : 'false'}`).join('\n') : '(noch keine erkannten Fahrten)'}</Text>
        </View>
      </Card>
    </Screen>
  );
}
