import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Map from '@/components/Map';
import Chameleon from '@/components/Chameleon';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Pill, Ring, StatusBadge, T, Tag, Row, haptic, Divider } from '@/components/ui';
import { C, CONTEXT, S, shadow } from '@/theme';
import { useLocation, useTracker } from '@/hooks/useLocation';
import { STATIONS, PATTERNS, nearestStations, departuresAt, nowMinutes, fmtMin, matchTrace, type MatchResult, type MatchScore, type TracePoint, SERVICE_DAY } from '@/engine/matching';
import { statusFromConfidence } from '@/engine/reward';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import traces from '@/data/traces.json';
import { nfcAvailable, demoTag, type TagInfo } from '@/api/nfc';
import NfcSheet from '@/components/NfcSheet';

type Phase = 'pick' | 'track' | 'result';
const TR = traces as unknown as Record<string, { title: string; desc: string; expect: string; points: [number, number, number][] }>;
const col = CONTEXT.mobility.color;

export default function Ride() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ station?: string; tag?: string }>();
  const { loc, isDemo } = useLocation();
  const tracker = useTracker();
  const { addAward, addNfc } = useStore();
  const { setCtx, showToast } = useUI();
  const [phase, setPhase] = useState<Phase>('pick');
  const [stationId, setStationId] = useState<number | null>(params.station ? Number(params.station) : null);
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [nfcOk, setNfcOk] = useState(false);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [sim, setSim] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [manual, setManual] = useState(false);
  const simRef = useRef<any>(null);
  const simPts = useRef<TracePoint[]>([]);

  useEffect(() => { setCtx('mobility'); nfcAvailable().then(setNfcOk); }, []);
  useEffect(() => { if (params.tag) { const t = demoTag(String(params.tag)); t.source = 'qr'; setTag(t); } }, [params.tag]);
  useEffect(() => { if (phase === 'track') { const i = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000); return () => clearInterval(i); } }, [phase, startedAt]);

  const near = useMemo(() => nearestStations(loc.lat, loc.lon, 5, 2500), [loc.lat, loc.lon]);
  const station = stationId !== null ? STATIONS[stationId] : near[0];
  const deps = useMemo(() => (station ? departuresAt(station.id, nowMinutes()) : []), [station?.id]);

  function tapIn() { haptic(); setNfcOpen(true); }
  function onTag(t: TagInfo) { setTag(t); addNfc(t.vehicle); }

  async function start() {
    setStartedAt(Date.now()); setElapsed(0); setResult(null);
    await tracker.start();
    setPhase('track');
  }

  function playSim(key: string) {
    setSim(key); simPts.current = [];
    const pts = TR[key].points; let i = 0;
    clearInterval(simRef.current);
    simRef.current = setInterval(() => {
      if (i >= pts.length) { clearInterval(simRef.current); return; }
      const p = pts[i++]; simPts.current.push(p);
      tracker.feed({ lat: p[0], lon: p[1], t: p[2] * 1000 });
    }, 90);
  }

  function stop() {
    tracker.stop(); clearInterval(simRef.current);
    let tr: TracePoint[];
    if (sim) tr = simPts.current;
    else tr = tracker.points.map((p) => { const d = new Date(p.t); return [p.lat, p.lon, d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()] as TracePoint; });
    const r = matchTrace(tr);
    setResult(r); setPhase('result'); haptic(r.ok ? 'success' : 'warn');
  }

  function confirm(c: MatchScore | null, manualLine?: string) {
    const key = `ride:${startedAt}`;
    if (c) {
      let status = statusFromConfidence(c.confidence);
      const evidence = [...c.reasons];
      if (tag && tag.line === c.pattern.route) { status = 'bestätigt'; evidence.unshift(`NFC/QR-Tag im Fahrzeug ${tag.vehicle} (${tag.line}) stimmt mit der Fahrplan-Zuordnung überein`); }
      else if (tag) evidence.push(`Tag meldete ${tag.line}, Zuordnung ergab ${c.pattern.route}: Tag nicht gewertet`);
      const a = addAward({ type: 'ride.transit', partner: 'transdev', status, key, at: Date.now(), title: `${c.pattern.route} → ${c.pattern.headsign}`, meta: { km: +c.km.toFixed(2), mode: c.pattern.kind, confidence: +c.confidence.toFixed(2), source: tag ? 'nfc+gps+gtfs' : 'gps+gtfs', evidence, from: STATIONS[c.pattern.stops[c.fromIdx]].name, to: STATIONS[c.pattern.stops[c.toIdx]].name } });
      showToast(a);
    } else if (manualLine) {
      const km = result?.traceKm ?? 1;
      const a = addAward({ type: 'ride.transit', partner: 'transdev', status: 'selbst angegeben', key, at: Date.now(), title: `${manualLine} (manuell angegeben)`, meta: { km: +km.toFixed(2), mode: manualLine.startsWith('S') ? 'S' : manualLine.startsWith('U') ? 'U' : 'T', source: 'user', evidence: ['Keine Fahrplan-Zuordnung, Linie selbst angegeben'] } });
      showToast(a);
    }
    router.replace('/(tabs)/impact');
  }

  const last = tracker.points[tracker.points.length - 1];
  const tracePoly = tracker.points.map((p) => [p.lat, p.lon] as [number, number]);

  /* ---------- Phase: Auswahl ---------- */
  if (phase === 'pick') {
    return (
      <Screen tabBar={false}>
        <Header title="Fahrt starten" subtitle="Ride2Impact · mit Transdev" color={col} />
        <Appear>
          <Card style={{ backgroundColor: col, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[T.label, { color: '#ffffffaa' }]}>Nachweis-Kette</Text>
                <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>Antippen, einsteigen, aussteigen. Den Rest prüft die App.</Text>
                <Text style={[T.small, { color: '#ffffffcc', marginTop: 6 }]}>Standort nur während der Fahrt, nur auf deinem Gerät.</Text>
              </View>
              <Chameleon color="#fff" size={96} branch={false} lookX={-0.6} />
            </View>
          </Card>
        </Appear>

        <Text style={[T.h3, { marginTop: S.xl }]}>1 · Haltestelle {isDemo ? '(Demo-Standort)' : 'in deiner Nähe'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {near.map((s) => <Pill key={s.id} label={`${s.name} · ${Math.round(s.d)} m`} active={station?.id === s.id} color={col} onPress={() => setStationId(s.id)} />)}
        </ScrollView>

        <Text style={[T.h3, { marginTop: S.xl }]}>2 · Nächste Abfahrten {station ? `ab ${station.name}` : ''}</Text>
        <Text style={T.small}>Fahrplan RMV (GTFS), Demo-Tag {SERVICE_DAY.split(' ')[0]}.</Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          {deps.length === 0 && <Text style={T.body}>Keine Abfahrten in den nächsten 90 Minuten in den bereitgestellten Linien (U, S, Tram).</Text>}
          {deps.map((d, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 40)}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 12 }, shadow(1)]}>
                <View style={{ backgroundColor: d.color, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 48, alignItems: 'center' }}><Text style={{ color: d.route === 'U9' ? '#222' : '#fff', fontWeight: '900' }}>{d.route}</Text></View>
                <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{d.headsign}</Text><Text style={T.small}>{d.kind === 'U' ? 'U-Bahn' : d.kind === 'S' ? 'S-Bahn' : 'Straßenbahn'} · Gleis lt. Aushang</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={{ fontWeight: '900', fontSize: 18, color: C.ink }}>{fmtMin(d.minute)}</Text><Text style={T.small}>{Math.max(0, d.minute - nowMinutes())} min</Text></View>
              </View>
            </Animated.View>
          ))}
        </View>

        <Text style={[T.h3, { marginTop: S.xl }]}>3 · Bewusst starten</Text>
        <Card style={{ marginTop: 10, gap: 10 }}>
          <Row>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: tag ? C.success + '22' : col + '15', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>{tag ? '✅' : '📡'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{tag ? `Tag gelesen: ${tag.line} · ${tag.vehicle}` : 'Tag im Fahrzeug antippen'}</Text>
              <Text style={T.small}>{tag ? 'Nachweis wird „bestätigt“, wenn der Tag zur Fahrt passt.' : 'Mit Tag volle Punkte, ohne Tag 70 %.'}</Text>
            </View>
          </Row>
          <Row style={{ gap: 8 }}>
            <Button label={tag ? 'Erneut antippen' : 'NFC antippen'} icon="📡" color={col} onPress={tapIn} style={{ flex: 1, paddingVertical: 12 }} />
            <Button label="QR" icon="▣" color={col} variant="soft" onPress={() => router.push('/scan?mode=ride')} style={{ paddingVertical: 12, paddingHorizontal: 18 }} />
          </Row>
        </Card>
        <View style={{ marginTop: 14 }}>
          <Button label={tag ? 'Fahrt starten' : 'Ohne Tag starten (nur GPS)'} icon="▶️" color={col} onPress={start} />
        </View>
        <NfcSheet open={nfcOpen} onClose={() => setNfcOpen(false)} onRead={onTag} color={col} demoLine={deps[0]?.route ?? 'U4'} />
      </Screen>
    );
  }

  /* ---------- Phase: Tracking ---------- */
  if (phase === 'track') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Map center={last ? { lat: last.lat, lon: last.lon } : loc} follow={last ? { lat: last.lat, lon: last.lon } : null} spanKm={1.4} userLocation={last ? { lat: last.lat, lon: last.lon } : loc} polylines={tracePoly.length > 1 ? [{ points: tracePoly, color: col, width: 6 }] : []} style={{ flex: 1 }} />
        <RecordingBanner top={insets.top} />
        <View style={{ position: 'absolute', left: S.lg, right: S.lg, bottom: insets.bottom + 16 }}>
          <Card style={{ gap: 10 }}>
            <Row>
              <Chameleon color={col} size={70} lookX={0.8} mood="thinking" />
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{station?.name ?? 'Unterwegs'} {tag ? `· ${tag.line}` : ''}</Text>
                <Text style={T.small}>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} · {tracker.points.length} GPS-Punkte · nur auf dem Gerät</Text>
              </View>
            </Row>
            {!sim && (
              <View>
                <Text style={[T.label, { marginBottom: 6 }]}>Demo: Fahrt simulieren</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.entries(TR).map(([k, v]) => <Pill key={k} label={v.title} color={k.includes('car') ? C.danger : col} onPress={() => playSim(k)} />)}
                </ScrollView>
              </View>
            )}
            {sim && <Text style={T.small}>▶ {TR[sim].title}: {TR[sim].desc}</Text>}
            <Button label="Fahrt beenden & prüfen" color={C.ink} icon="⏹" onPress={stop} />
          </Card>
        </View>
      </View>
    );
  }

  /* ---------- Phase: Ergebnis ---------- */
  const best = result?.candidates[0] ?? null;
  const status = best ? (tag && tag.line === best.pattern.route ? 'bestätigt' : statusFromConfidence(best.confidence)) : 'nicht zuordenbar';
  return (
    <Screen tabBar={false}>
      <Header title="Fahrt prüfen" subtitle={`${(result?.traceKm ?? 0).toFixed(1)} km Spur · ${result?.gaps ?? 0} Lücken`} color={col} />
      {best ? (
        <Appear>
          <Card>
            <Row style={{ gap: 14 }}>
              <Ring progress={best.confidence} size={96} stroke={11} color={status === 'bestätigt' ? C.success : status === 'plausibel' ? col : status === 'schwach plausibel' ? C.warn : C.muted}>
                <Text style={{ fontWeight: '900', fontSize: 20, color: C.ink }}>{Math.round(best.confidence * 100)}%</Text>
              </Ring>
              <View style={{ flex: 1 }}>
                <Row style={{ gap: 8 }}><View style={{ backgroundColor: best.pattern.color, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}><Text style={{ color: best.pattern.route === 'U9' ? '#222' : '#fff', fontWeight: '900' }}>{best.pattern.route}</Text></View><Text style={T.h3} numberOfLines={1}>→ {best.pattern.headsign}</Text></Row>
                <Text style={[T.small, { marginTop: 4 }]}>{STATIONS[best.pattern.stops[best.fromIdx]].name} → {STATIONS[best.pattern.stops[best.toIdx]].name} · {best.km.toFixed(1)} km</Text>
                <View style={{ marginTop: 6 }}><StatusBadge status={status} /></View>
              </View>
            </Row>
            <Divider />
            <Text style={T.label}>Konfidenz-Bausteine</Text>
            {[['Haltestellen getroffen', best.parts.stops, 0.35], ['Zeitliche Übereinstimmung', best.parts.time, 0.25], ['Streckenähnlichkeit', best.parts.shape, 0.25], ['Geschwindigkeitsprofil', best.parts.speed, 0.15]].map(([l, v, w]) => (
              <View key={String(l)} style={{ marginTop: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}><Text style={T.body}>{l}</Text><Text style={T.small}>{Math.round(Number(v) * 100)} % · Gewicht {w}</Text></Row>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: C.line, marginTop: 4, overflow: 'hidden' }}><Animated.View entering={FadeIn.delay(200)} style={{ width: `${Math.round(Number(v) * 100)}%`, height: 8, backgroundColor: col }} /></View>
              </View>
            ))}
            <Divider />
            <Text style={T.label}>Begründung</Text>
            {best.reasons.map((r, i) => <Text key={i} style={[T.body, { marginTop: 4 }]}>• {r}</Text>)}
            {tag && <Text style={[T.body, { marginTop: 4, color: tag.line === best.pattern.route ? C.success : C.warn }]}>• Tag {tag.line} {tag.line === best.pattern.route ? 'bestätigt die Zuordnung → Multiplikator 1,0' : 'passt nicht zur Zuordnung → nicht gewertet'}</Text>}
            {result!.candidates.length > 1 && (
              <View style={{ marginTop: 10 }}>
                <Text style={T.label}>Alternativen</Text>
                {result!.candidates.slice(1).map((c, i) => <Text key={i} style={T.small}>{c.pattern.route} → {c.pattern.headsign}: {Math.round(c.confidence * 100)} %</Text>)}
              </View>
            )}
          </Card>
          <View style={{ marginTop: 14, gap: 10 }}>
            <Button label={`Bestätigen · ${status === 'bestätigt' ? '20' : status === 'plausibel' ? '14' : status === 'schwach plausibel' ? '8' : '0'} Punkte + Impact`} color={col} onPress={() => confirm(best)} />
            <Button label="Das war nicht meine Fahrt" variant="ghost" color={C.ink} onPress={() => router.replace('/(tabs)')} />
          </View>
        </Appear>
      ) : (
        <Appear>
          <Card style={{ borderLeftWidth: 6, borderLeftColor: C.muted }}>
            <Row><Chameleon color={C.muted} size={80} mood="thinking" /><View style={{ flex: 1 }}><Text style={T.h3}>Nicht zuordenbar</Text><Text style={T.small}>{result?.reason}</Text></View></Row>
            <Divider />
            <Text style={T.body}>Das ist Absicht: Eine Autofahrt neben der Linie, eine zu kurze Spur oder eine Fahrt außerhalb des Fahrplans bekommen keine Punkte. Du kannst die Linie manuell angeben (Nachweis „selbst angegeben“, ×0,3).</Text>
            <StatusBadge status="nicht zuordenbar" />
          </Card>
          <View style={{ marginTop: 14, gap: 10 }}>
            {!manual ? <Button label="Linie manuell angeben" color={col} variant="soft" onPress={() => setManual(true)} /> : (
              <Card>
                <Text style={T.label}>Welche Linie war es?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {Array.from(new Set(PATTERNS.map((p) => p.route))).sort().map((r) => <Pill key={r} label={r} color={col} onPress={() => confirm(null, r)} />)}
                </ScrollView>
              </Card>
            )}
            <Button label="Verwerfen" variant="ghost" color={C.ink} onPress={() => router.replace('/(tabs)')} />
          </View>
        </Appear>
      )}
    </Screen>
  );
}

function RecordingBanner({ top }: { top: number }) {
  const o = useSharedValue(1);
  useEffect(() => { o.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true); }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={[{ position: 'absolute', top: top + 10, left: S.lg, right: S.lg, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 12 }, shadow(2)]}>
      <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.danger }, st]} />
      <Text style={{ fontWeight: '800', color: C.ink, flex: 1 }}>Aufzeichnung läuft · nur während dieser Fahrt</Text>
      <Tag label="on-device" color={C.success} />
    </View>
  );
}
