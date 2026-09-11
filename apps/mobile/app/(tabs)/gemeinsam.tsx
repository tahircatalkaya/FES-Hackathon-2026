import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Line, Circle, Rect, Text as SText } from 'react-native-svg';
import Map from '@/components/Map';
import { Screen } from '@/components/Screen';
import { Appear, Card, Divider, Pill, Ring, Row, SectionTitle, Stat, T, Tag } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { DISTRICTS, FRANKFURT_GOAL } from '@/data/mock';
import haltestellen from '@/data/haltestellen.json';
import tagesgang from '@/data/tagesgang.json';
import afz from '@/data/afz.json';
import efa from '@/data/efa.json';
import sharingRaw from '@/data/sharing.json';
const sharing = sharingRaw as { source: string; stops: { n: string; bike: number; scooter: number }[]; vehicleTypes: string[] };
import { useLocation } from '@/hooks/useLocation';
import { useT } from '@/i18n/useT';

const col = CONTEXT.community.color;

export default function Together() {
  const router = useRouter();
  const t = useT();
  const { loc } = useLocation();
  const { friends, ledger, name, district, lose } = useStore();
  const { setCtx } = useUI();
  const [view, setView] = useState<'ziel' | 'daten'>('ziel');
  const [line, setLine] = useState<string>(Object.keys(afz.lines)[0]);
  useEffect(() => { setCtx('community'); }, []);
  const wk = weekStats(ledger);
  const goalPct = FRANKFURT_GOAL.weekSoFarKg / FRANKFURT_GOAL.weekTargetKg;
  const groupDays = friends.reduce((a, f) => a + f.activeDays, 0) + wk.activeDays, groupGoal = (friends.length + 1) * 3;
  const heat = useMemo(() => { const max = haltestellen.items[0].v; return haltestellen.items.slice(0, 120).map((h) => ({ lat: h.lat, lon: h.lon, v: Math.sqrt(h.v / max) })); }, []);
  const hours = tagesgang.hours; const maxH = Math.max(...hours); const nowH = new Date().getHours();
  const honor = useMemo(() => [...friends.filter((f) => f.activeDays >= f.goal).map((f) => f.name), ...(wk.activeDays >= 3 ? [name || 'Du'] : [])].sort(), [friends, wk.activeDays]);

  return (
    <Screen>
      <Text style={T.label}>traffiQ · Transdev · Stadt Frankfurt</Text>
      <Text style={[T.h1, { marginTop: 4 }]}>{t('together.title')}</Text>
      <Row style={{ marginTop: 12 }}>
        <Pill label="Gemeinsames Ziel" active={view === 'ziel'} color={col} onPress={() => setView('ziel')} />
        <Pill label="Frankfurts Mobilität" active={view === 'daten'} color={col} onPress={() => setView('daten')} />
      </Row>

      {view === 'ziel' ? (
        <>
          <Appear delay={40}>
            <Card style={{ marginTop: S.lg, backgroundColor: col }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>Frankfurt-Ziel der Woche</Text>
              <Text style={[T.h2, { color: '#fff', marginTop: 2 }]}>{(FRANKFURT_GOAL.weekSoFarKg / 1000).toFixed(1)} von {FRANKFURT_GOAL.weekTargetKg / 1000} t CO₂ vermieden</Text>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: '#ffffff33', marginTop: 12, overflow: 'hidden' }}><View style={{ width: `${Math.round(goalPct * 100)}%`, height: 14, backgroundColor: '#fff', borderRadius: 7 }} /></View>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}><Text style={{ color: '#ffffffcc', fontSize: 12 }}>{FRANKFURT_GOAL.participants.toLocaleString('de-DE')} Menschen · aggregiert, k ≥ 5</Text><Text style={{ color: '#fff', fontWeight: '800' }}>{Math.round(goalPct * 100)} %</Text></Row>
              <Text style={{ color: '#ffffffbb', fontSize: 12, marginTop: 6 }}>Wird das Ziel erreicht, pflanzt die Stadt 50 Bäume. Alle tragen bei, niemand wird gerankt. (Demo-Zahlen)</Text>
            </Card>
          </Appear>

          <SectionTitle title="Dein Kreis" />
          <Appear delay={80}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Text style={T.h3}>Gemeinsames Wochenziel</Text><Text style={T.small}>{friends.length + 1} Personen · {groupDays} von {groupGoal} aktiven Tagen. Kein Ranking untereinander: Jede Person hat ihr eigenes Ziel, ihr schafft es zusammen.</Text></View>
                <Ring progress={groupDays / groupGoal} size={64} stroke={8} color={col}><Text style={{ fontWeight: '900', fontSize: 13 }}>{Math.round((groupDays / groupGoal) * 100)}%</Text></Ring>
              </Row>
              <Divider />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row style={{ gap: 14 }}>
                  {[{ id: 'me', name: name || 'Du', emoji: '🦎', activeDays: wk.activeDays, goal: 3, district }, ...friends].map((f) => (
                    <View key={f.id} style={{ alignItems: 'center', width: 64 }}>
                      <Ring progress={f.activeDays / f.goal} size={58} stroke={6} color={f.activeDays >= f.goal ? C.success : col}><Text style={{ fontSize: 20 }}>{f.emoji}</Text></Ring>
                      <Text style={{ fontWeight: '700', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{f.name}</Text>
                      <Text style={T.small}>{f.activeDays}/{f.goal}</Text>
                    </View>
                  ))}
                  <Pressable style={{ alignItems: 'center', width: 64 }}><View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted, fontSize: 22 }}>+</Text></View><Text style={T.small}>einladen</Text></Pressable>
                </Row>
              </ScrollView>
              <Text style={[T.small, { marginTop: 10 }]}>Motivierend statt beschämend: Du siehst, wer diese Woche dran ist, nicht wer „besser“ ist. Anstupsen erlaubt, Auslachen nicht.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Ehrentafel der Woche" />
          <Appear delay={120}>
            <Card>
              <Text style={T.small}>Alle, die ihr Wochenziel geschafft haben, alphabetisch. Keine Plätze, keine Top 100. Jede Person hier hat ein Los für das Deutschlandticket.</Text>
              <Row style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>{honor.length ? honor.map((n) => <Tag key={n} label={`🎟️ ${n}`} color={col} />) : <Text style={T.body}>Diese Woche noch niemand. Drei aktive Tage, dann stehst du hier.</Text>}</Row>
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>Deine Lose: {lose}</Text><Pressable onPress={() => router.push('/belohnungen')}><Text style={{ color: col, fontWeight: '800' }}>Verlosung ›</Text></Pressable></Row>
              <Text style={T.small}>Max. 4 Lose im Monat. Wer zehnmal mehr sammelt, hat nicht zehnmal mehr Chancen.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Stadtteile: Fortschritt zur Vorwoche" />
          <Appear delay={160}>
            <Card>
              {DISTRICTS.map((d) => { const delta = (d.thisWeek - d.lastWeek) / d.lastWeek; const perCap = (d.thisWeek / d.pop) * 1000; return (
                <View key={d.name} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}><Text style={[T.body, { fontWeight: d.name === district ? '800' : '500', color: d.name === district ? C.ink : C.ink2 }]}>{d.name === district ? '📍 ' : ''}{d.name}</Text><Text style={{ fontWeight: '800', color: delta >= 0 ? C.success : C.danger }}>{delta >= 0 ? '+' : ''}{Math.round(delta * 100)} %</Text></Row>
                  <Row style={{ gap: 8 }}><View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, perCap * 1.2)}%`, height: 8, backgroundColor: col }} /></View><Text style={T.small}>{perCap.toFixed(0)} Aktionen je 1.000 Einw.</Text></Row>
                </View>
              ); })}
              <Text style={T.small}>Verglichen wird jeder Stadtteil mit sich selbst und pro Kopf. Die Innenstadt hat mehr Bahnen, das ist Infrastruktur, kein Verdienst. (Demo-Daten)</Text>
            </Card>
          </Appear>
        </>
      ) : (
        <>
          <Appear delay={40}>
            <Text style={[T.small, { marginTop: 12 }]}>Aggregierte Daten des Verkehrsverbunds. Teilweise synthetisch, im Repo dokumentiert. Keine Personendaten.</Text>
            <View style={{ height: 250, borderRadius: 22, overflow: 'hidden', marginTop: 10 }}>
              <Map center={{ lat: 50.1128, lon: 8.6768 }} spanKm={7} heat={heat} userLocation={loc} />
            </View>
            <Text style={[T.small, { marginTop: 6 }]}>Nachfrage-Heatmap: Auskunftsanfragen je Haltestelle und Monat (haltestellen_avg.csv). Spitze: {haltestellen.items[0].n} mit {haltestellen.items[0].v.toLocaleString('de-DE')}.</Text>
          </Appear>

          <SectionTitle title="Wann Frankfurt unterwegs ist" />
          <Appear delay={80}>
            <Card>
              <Svg width="100%" height={130} viewBox="0 0 240 130">
                {hours.map((v, h) => { const x = 8 + h * 9.6, bh = (v / maxH) * 90; return <Rect key={h} x={x} y={100 - bh} width={7} height={bh} rx={2} fill={h === nowH ? col : col + '55'} />; })}
                {[0, 6, 12, 18, 23].map((h) => <SText key={h} x={11 + h * 9.6} y={118} fontSize={9} fill={C.muted} textAnchor="middle">{h}</SText>)}
              </Svg>
              <Text style={T.small}>Verbindungsanfragen je Stunde (Durchschnittstag, tagesgang_avg.csv). Jetzt: {hours[nowH].toLocaleString('de-DE')}. Spitze {Math.max(...hours).toLocaleString('de-DE')} um {hours.indexOf(maxH)} Uhr.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Auslastung je Linie" />
          <Appear delay={120}>
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}><Row>{Object.keys(afz.lines).map((l) => <Pill key={l} label={l} active={line === l} color={col} onPress={() => setLine(l)} />)}</Row></ScrollView>
              <Svg width="100%" height={110} viewBox="0 0 240 110" style={{ marginTop: 8 }}>
                <Line x1={8} y1={90} x2={236} y2={90} stroke={C.line} />
                {(afz.lines as any)[line].map((v: number | null, h: number) => v === null ? null : <Rect key={h} x={8 + h * 9.6} y={90 - v * 0.8} width={7} height={v * 0.8} rx={2} fill={v > 60 ? C.danger : v > 35 ? C.warn : C.success} />)}
                {[0, 6, 12, 18, 23].map((h) => <SText key={h} x={11 + h * 9.6} y={105} fontSize={9} fill={C.muted} textAnchor="middle">{h}</SText>)}
              </Svg>
              <Text style={T.small}>Mittlere Auslastung in % je Stunde (BeispielAFZ.csv). Grün unter 35 %, rot über 60 %. Das ist die Sicht, die Transdev für Planung braucht: welche Fahrten leer laufen.</Text>
              <Divider />
              <Text style={T.label}>Meiste Einsteiger</Text>
              <Row style={{ flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{afz.topBoarding.slice(0, 6).map((b) => <Tag key={b.n} label={`${b.n} · ${b.v}`} color={col} />)}</Row>
            </Card>
          </Appear>

          <SectionTitle title="Häufigste Verbindungen" />
          <Appear delay={160}>
            <Card>
              {efa.top.slice(0, 6).map((r, i) => <Row key={i} style={{ justifyContent: 'space-between', marginBottom: 6 }}><Text style={[T.body, { flex: 1 }]} numberOfLines={1}>{r.from} → {r.to}</Text><Text style={{ fontWeight: '800', color: C.ink }}>{r.n}×</Text></Row>)}
              <Text style={T.small}>EFA-Anfragen, {efa.rows} Zeilen, davon 27 original. Tausenderpunkte in den Koordinaten wurden beim Import korrigiert.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Sharing-Starts je Standort" />
          <Appear delay={200}>
            <Card>
              {sharing.stops.slice(0, 5).map((s) => <Row key={s.n} style={{ justifyContent: 'space-between', marginBottom: 6 }}><Text style={[T.body, { flex: 1 }]} numberOfLines={1}>{s.n}</Text><Text style={T.small}>🚲 {s.bike} · 🛴 {s.scooter}</Text></Row>)}
              <Text style={T.small}>Radius 250 m, 7 simulierte Tage. Größenordnung laut Verbund: ca. 30.000 Nutzungen/Tag.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Datenexport für Transdev & traffiQ" action="Vorschau ›" onAction={() => router.push('/daten')} />
          <Appear delay={240}>
            <Card style={{ backgroundColor: C.ink }}>
              <Text style={[T.body, { color: '#fff' }]}>Aus erkannten Fahrten entsteht ein aggregierter Export: Linie, Stunde, Richtung, Anzahl. k-Anonymität mit k ≥ 5, keine Einzelprofile, keine Rohspuren. Genau die Daten, die für Auslastung und Streichung leerer Fahrten fehlen.</Text>
              <Row style={{ gap: 6, marginTop: 8 }}><Tag label="k ≥ 5" color="#fff" /><Tag label="opt-in" color="#fff" /><Tag label="CSV/JSON" color="#fff" /></Row>
            </Card>
          </Appear>
        </>
      )}
    </Screen>
  );
}
