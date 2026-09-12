import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Map from '@/components/Map';
import Chameleon from '@/components/Chameleon';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Pill, T, Tag, Row, haptic } from '@/components/ui';
import { C, CONTEXT, RIDE, S, shadow } from '@/theme';
import { useLocation, useTracker } from '@/hooks/useLocation';
import { STATIONS, nearestStations, departuresAt, nowMinutes, fmtMin, matchTrace, remainingStops, haversine, type Departure, type TracePoint, SERVICE_DAY } from '@/engine/matching';
import { statusFromConfidence } from '@/engine/reward';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import traces from '@/data/traces.json';
import { nfcAvailable, demoTag, type TagInfo } from '@/api/nfc';
import NfcSheet from '@/components/NfcSheet';
import CheckinDialog from '@/components/CheckinDialog';
import { CelebrationOverlay } from '@/components/ChamiMascot';
import { fmtCo2 } from '@/engine/impact';
import type { Award } from '@/engine/types';

type Phase = 'pick' | 'track';
const TR = traces as unknown as Record<string, { title: string; desc: string; expect: string; points: [number, number, number][] }>;
/** Auswahl im Demo-Streifen. Die Autofahrt-Spur bleibt in traces.json, wird aber nicht mehr angeboten. */
const SIM_TRACES = Object.entries(TR).filter(([k]) => k !== 'car_parallel');
const col = CONTEXT.mobility.color;

export default function Ride() {
  const rt = useT();
  const localize = useLocalize();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ station?: string; tag?: string; nfc?: string }>();
  const { loc, isDemo } = useLocation();
  const tracker = useTracker();
  const { addAward, addNfc, notify } = useStore();
  /** Belohnung am Ende der Fahrt: Clip läuft, danach geht es zum Impact. */
  const [rideDone, setRideDone] = useState<Award | null>(null);
  const { setCtx } = useUI();
  const [phase, setPhase] = useState<Phase>('pick');
  const [stationId, setStationId] = useState<number | null>(params.station ? Number(params.station) : null);
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [nfcOk, setNfcOk] = useState(false);
  const [nfcOpen, setNfcOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [sim, setSim] = useState<string | null>(null);
  const [trip, setTrip] = useState<Departure | null>(null);
  const [allStops, setAllStops] = useState(false);
  const [following, setFollowing] = useState(true);
  const [recenterKey, setRecenterKey] = useState(0);
  const [camera, setCamera] = useState(loc);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const simRef = useRef<any>(null);
  const simPts = useRef<TracePoint[]>([]);

  useEffect(() => { setCtx('mobility'); nfcAvailable().then(setNfcOk); }, []);
  useEffect(() => { if (params.nfc) setTimeout(() => setCheckinOpen(true), 350); }, [params.nfc]);
  useEffect(() => { if (params.tag) { const t = demoTag(String(params.tag)); t.source = 'qr'; setTag(t); } }, [params.tag]);
  useEffect(() => { if (phase === 'track') { const i = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000); return () => clearInterval(i); } }, [phase, startedAt]);

  const near = useMemo(() => nearestStations(loc.lat, loc.lon, 5, 2500), [loc.lat, loc.lon]);
  const station = stationId !== null ? STATIONS[stationId] : near[0];
  const deps = useMemo(() => (station ? departuresAt(station.id, nowMinutes()) : []), [station?.id]);

  function tapIn() { haptic(); setCheckinOpen(true); }
  function onTag(t: TagInfo) { setTag(t); addNfc(t.vehicle); }

  /** Der Check-in selbst ist die Punktgutschrift: fester Betrag, unabhaengig von Strecke und Nachweis. */
  function checkin(t: TagInfo) {
    onTag(t);
    const real = t.source === 'nfc';
    return addAward({
      type: 'ride.checkin', partner: 'transdev', status: real ? 'bestätigt' : 'selbst angegeben',
      key: `checkin:${t.vehicle}:${Math.floor(Date.now() / 6e5)}`, at: Date.now(),
      title: `Check-in ${t.line} · ${t.vehicle}`,
      meta: { source: real ? 'nfc' : 'demo', evidence: [real ? `NFC-Tag ${t.vehicle} am Terminal gelesen` : `Check-in simuliert (Demo-Terminal ${t.line})`] },
    });
  }

  async function start() {
    setStartedAt(Date.now()); setElapsed(0); setSim(null); setAllStops(false);
    setFollowing(true); setCamera(loc); setRecenterKey((k) => k + 1);
    // Die Fahrt, auf der man sitzt: passend zum gelesenen Tag, sonst die naechste ab dieser Haltestelle.
    setTrip(deps.find((d) => tag && d.route === tag.line) ?? deps[0] ?? null);
    await tracker.start();
    setPhase('track');
  }

  function playSim(key: string) {
    setSim(key); simPts.current = [];
    const pts = TR[key].points; let i = 0;
    // Die simulierte Spur durch dieselbe Zuordnung schicken wie am Ende der Fahrt.
    // So zeigen Karte und Haltestellenliste die Linie, die gerade abgespielt wird.
    const c = matchTrace(pts as TracePoint[]).candidates[0];
    if (c) setTrip({ route: c.pattern.route, kind: c.pattern.kind, color: c.pattern.color, headsign: c.pattern.headsign, minute: c.departure + c.pattern.offsets[c.fromIdx], pattern: c.pattern, stopIndex: c.fromIdx });
    clearInterval(simRef.current);
    simRef.current = setInterval(() => {
      if (i >= pts.length) { clearInterval(simRef.current); return; }
      const p = pts[i++]; simPts.current.push(p);
      tracker.feed({ lat: p[0], lon: p[1], t: p[2] * 1000 });
    }, 90);
  }

  /**
   * Fahrt beenden. Die Zuordnung gegen den Fahrplan laeuft im Hintergrund und bucht
   * Nachweis und Impact. Einen Auswertungs-Screen gibt es nicht mehr: Die Punkte
   * sind beim Check-in gefallen, hier bleibt nur die Physik.
   */
  function stop() {
    tracker.stop(); clearInterval(simRef.current);
    const tr: TracePoint[] = sim
      ? simPts.current
      : tracker.points.map((p) => { const d = new Date(p.t); return [p.lat, p.lon, d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()] as TracePoint; });
    const r = matchTrace(tr);
    const c = r.candidates[0] ?? null;
    const status = !c ? 'nicht zuordenbar' : tag && tag.line === c.pattern.route ? 'bestätigt' : statusFromConfidence(c.confidence);
    // Ohne belastbare Zuordnung wird nichts gebucht. Eine Autofahrt neben der Linie
    // darf keine eingesparten Gramm erzeugen, auch wenn niemand mehr hinsieht.
    const counts = !!c && status !== 'nicht zuordenbar';
    haptic(counts ? 'success' : 'warn');

    if (counts && c) {
      const evidence = [...c.reasons];
      if (status === 'bestätigt' && tag) evidence.unshift(`NFC/QR-Tag im Fahrzeug ${tag.vehicle} (${tag.line}) stimmt mit der Fahrplan-Zuordnung überein`);
      else if (tag) evidence.push(`Tag meldete ${tag.line}, Zuordnung ergab ${c.pattern.route}: Tag nicht gewertet`);
      // Punkte gab es schon beim Check-in. Hier werden nur Nachweis und Impact gebucht,
      // ohne Banner: der Impact-Screen zeigt das Ergebnis ohnehin direkt an.
      const a = addAward({
        type: 'ride.transit', partner: 'transdev', status, key: `ride:${startedAt}`, at: Date.now(),
        title: `${c.pattern.route} → ${c.pattern.headsign}`,
        meta: { km: +c.km.toFixed(2), mode: c.pattern.kind, confidence: +c.confidence.toFixed(2), source: tag ? 'nfc+gps+gtfs' : 'gps+gtfs', evidence, from: STATIONS[c.pattern.stops[c.fromIdx]].name, to: STATIONS[c.pattern.stops[c.toIdx]].name },
      });
      setRideDone(a);
      return; // Weiter zum Impact erst, wenn die Belohnung weggetippt ist
    } else {
      // Ohne Zuordnung gibt es keinen Impact. Das sagen wir, statt es zu verschlucken.
      const why = r.reason ?? `Die Spur passt nur zu ${Math.round((c?.confidence ?? 0) * 100)} % zu ${c?.pattern.route}. Das reicht nicht als Nachweis.`;
      notify({ title: 'Fahrt nicht zuordenbar', body: `${why} Deine Punkte vom Check-in bleiben, der Impact wird ohne Nachweis nicht gutgeschrieben.`, ctx: 'mobility' });
    }
    router.replace('/(tabs)/impact');
  }

  /** Kamera zurueck auf den eigenen Standort und wieder mitlaufen lassen. */
  function recenter() {
    haptic();
    const p = tracker.points[tracker.points.length - 1] ?? loc;
    setCamera({ lat: p.lat, lon: p.lon });
    setFollowing(true);
    setRecenterKey((k) => k + 1);
  }

  const last = tracker.points[tracker.points.length - 1];
  const tracePoly = tracker.points.map((p) => [p.lat, p.lon] as [number, number]);

  /** Haltestellen bis zum Ziel: kleiner roter Punkt mit Namensschild auf der Karte. */
  const stopMarkers = useMemo(
    () => (trip ? remainingStops(trip).map((st) => ({ id: `stop-${st.id}`, lat: st.lat, lon: st.lon, color: RIDE.red, label: st.name, dot: true })) : []),
    [trip],
  );

  /**
   * Der noch zu fahrende Weg: die Linienform ab dem Formpunkt, der dem aktuellen
   * Standort am naechsten liegt. Die Form ist in Fahrtrichtung sortiert, deshalb
   * ist alles danach der Rest der Strecke. Schrumpft mit jedem GPS-Punkt.
   */
  const aheadPoly = useMemo(() => {
    const shape = trip?.pattern.shape;
    if (!shape || shape.length < 2) return null;
    const here = last ?? loc;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < shape.length; i++) {
      const d = haversine(here.lat, here.lon, shape[i][0], shape[i][1]);
      if (d < bestD) { bestD = d; best = i; }
    }
    const rest = shape.slice(best) as [number, number][];
    return rest.length > 1 ? rest : null;
  }, [trip, last?.lat, last?.lon, loc.lat, loc.lon]);

  /* ---------- Phase: Auswahl ---------- */
  if (phase === 'pick') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen tabBar={false} style={{ paddingBottom: insets.bottom + 120 }}>
        <Header title={rt('routes.start_ride')} color={col} right={<Partners />} />
        <Appear>
          <Card style={{ backgroundColor: RIDE.graphite, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[T.label, { color: '#ffffffaa' }]}>{rt('routes.evidence_chain')}</Text>
                <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>{rt('routes.tap_board_get_off_the_app_checks_the_rest')}</Text>
                <Text style={[T.small, { color: '#ffffffcc', marginTop: 6 }]}>{rt('routes.location_only_during_the_ride_only_on_your_device')}</Text>
              </View>
              <Chameleon pose="run" size={96} />
            </View>
          </Card>
        </Appear>

        <Text style={[T.h3, { marginTop: S.xl }]}>{rt('routes.1_stop_value', { p1: isDemo ? rt('routes.demo_location') : rt('routes.near_you') })}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {near.map((s) => <Pill key={s.id} label={`${s.name} · ${Math.round(s.d)} m`} active={station?.id === s.id} color={col} onPress={() => setStationId(s.id)} />)}
        </ScrollView>

        <Text style={[T.h3, { marginTop: S.xl }]}>{rt('routes.2_next_departures_value', { p1: station ? rt('routes.from_value', { p1: station.name }) : '' })}</Text>
        <Text style={T.small}>{rt('routes.rmv_timetable_gtfs_demo_date_value', { p1: SERVICE_DAY.split(' ')[0] })}</Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          {deps.length === 0 && <Text style={T.body}>{rt('routes.no_departures_in_the_next_90_minutes_on_the_available_lines_u_s_t')}</Text>}
          {deps.map((d, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 40)}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, gap: 12 }, shadow(1)]}>
                <View style={{ backgroundColor: d.color, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, minWidth: 48, alignItems: 'center' }}><Text style={{ color: d.route === 'U9' ? '#222' : '#fff', fontWeight: '900' }}>{d.route}</Text></View>
                <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{d.headsign}</Text><Text style={T.small}>{rt('routes.value_platform_as_posted', { p1: d.kind === 'U' ? rt('routes.metro') : d.kind === 'S' ? rt('routes.suburban_train') : rt('routes.tram') })}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={{ fontWeight: '900', fontSize: 18, color: C.ink }}>{fmtMin(d.minute)}</Text><Text style={T.small}>{Math.max(0, d.minute - nowMinutes())} min</Text></View>
              </View>
            </Animated.View>
          ))}
        </View>

      </Screen>

      {/* Fester Fuss: NFC-Check-in auf voller Breite, Fahrtstart erst mit Tag. */}
      <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, paddingTop: S.md, paddingBottom: insets.bottom + S.md }, shadow(2)]}>
        <Row style={{ gap: 10, paddingHorizontal: S.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button label={tag ? 'Erneut antippen' : 'NFC antippen'} icon="📡" color={col} variant={tag ? 'soft' : 'solid'} onPress={tapIn} style={{ paddingVertical: 14, paddingHorizontal: 8 }} />
          </View>
          {tag && (
            <View style={{ flex: 1 }}>
              <Button label="Fahrt starten" icon="▶️" color={col} onPress={start} style={{ paddingVertical: 14, paddingHorizontal: 8 }} />
            </View>
          )}
        </Row>
      </View>

      <NfcSheet open={nfcOpen} onClose={() => setNfcOpen(false)} onRead={onTag} color={col} demoLine={deps[0]?.route ?? 'U4'} />
      <CheckinDialog open={checkinOpen} onClose={() => setCheckinOpen(false)} onCheckin={checkin} onContinue={start} demoLine={deps[0]?.route ?? 'U4'} headsign={deps[0]?.headsign} stopName={station?.name} />
      <RideReward award={rideDone} onClose={() => { setRideDone(null); router.replace('/(tabs)/impact'); }} />
      </View>
    );
  }

  /* ---------- Phase: Tracking ---------- */
  return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Map center={camera} follow={following && last ? { lat: last.lat, lon: last.lon } : null} onUserPan={() => setFollowing(false)} recenterKey={recenterKey} spanKm={1.4} markers={stopMarkers} userLocation={last ? { lat: last.lat, lon: last.lon } : loc} userColor={RIDE.graphite} polylines={[...(aheadPoly ? [{ points: aheadPoly, color: trip!.pattern.color, width: 5, dashed: true }] : []), ...(tracePoly.length > 1 ? [{ points: tracePoly, color: RIDE.graphite, width: 6 }] : [])]} style={{ flex: 1 }} />
        <RecordingBanner top={insets.top} />
        <View style={{ position: 'absolute', left: S.lg, right: S.lg, bottom: insets.bottom + 16 }}>
          <Pressable
            onPress={recenter}
            accessibilityRole="button"
            accessibilityLabel={rt('routes.centre_on_my_location')}
            style={[{ alignSelf: 'flex-end', width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, shadow(2)]}>
            <Ionicons name={following ? 'locate' : 'locate-outline'} size={22} color={following ? col : C.ink} />
          </Pressable>
          <Card style={{ gap: 10 }}>
            <Row>
              <Chameleon pose="think" size={70} />
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{station?.name ?? rt('routes.on_the_way')} {tag ? `· ${tag.line}` : ''}</Text>
                <Text style={T.small}>{rt('routes.valuevalue_value_gps_points_on_device_only', { p1: Math.floor(elapsed / 60), p2: String(elapsed % 60).padStart(2, '0'), p3: tracker.points.length })}</Text>
              </View>
            </Row>
            {trip && <NextStops trip={trip} all={allStops} onToggle={() => setAllStops((v) => !v)} />}
            {!sim && (
              <View>
                <Text style={[T.label, { marginBottom: 6 }]}>{rt('routes.demo_simulate_ride')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SIM_TRACES.map(([k, v]) => <Pill key={k} label={localize(v.title)} color={col} onPress={() => playSim(k)} />)}
                </ScrollView>
              </View>
            )}
            {sim && <Text style={T.small}>▶ {localize(TR[sim].title)}: {localize(TR[sim].desc)}</Text>}
            <Button label={rt('routes.end_ride_verify')} color={C.ink} icon="stop" onPress={stop} />
          </Card>
        </View>
        <RideReward award={rideDone} onClose={() => { setRideDone(null); router.replace('/(tabs)/impact'); }} />
    </View>
  );
}

/** Belohnung für eine zugeordnete Fahrt: derselbe Ablauf wie in den anderen Bereichen. */
function RideReward({ award, onClose }: { award: Award | null; onClose: () => void }) {
  const rt = useT();
  const locale = useLocale();
  const km = Number(award?.meta?.km ?? 0);
  return (
    <CelebrationOverlay
      open={!!award}
      clip="ride"
      headline={rt('routes.ride_confirmed')}
      tileLabel={rt('routes.co2_saved')}
      tileValue={fmtCo2(award?.impact.co2_g ?? 0, locale)}
      note={rt('routes.value_km_matched_points_were_awarded_at_checkin', { p1: km.toFixed(1) })}
      onClose={onClose}
    />
  );
}

/**
 * Partner im Header. Logos liegen freigestellt unter assets/partner/ (Quelle: thumbnails/).
 * Breite und Hoehe folgen dem Seitenverhaeltnis der Datei, damit nichts verzerrt.
 */
const PARTNERS = [
  { name: 'traffiQ', logo: require('../assets/partner/traffiq.png'), w: 63, h: 24 },
  { name: 'Transdev', logo: require('../assets/partner/transdev.png'), w: 38, h: 30 },
];

/** Die restlichen Halte der Fahrt. Zwei sind sichtbar, der Rest klappt bis zur Endstation auf. */
function NextStops({ trip, all, onToggle }: { trip: Departure; all: boolean; onToggle: () => void }) {
  const rt = useT();
  const stops = remainingStops(trip);
  if (!stops.length) return null;
  const shown = all ? stops : stops.slice(0, 2);
  const hidden = stops.length - shown.length;
  return (
    <View>
      <Text numberOfLines={1} style={[T.label, { marginBottom: 6 }]}>{rt('routes.next_stops_value_value', { p1: trip.route, p2: trip.headsign })}</Text>
      <ScrollView style={{ maxHeight: 168 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {shown.map((st, i) => (
          <View key={st.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 26 }}>
            <View style={{ width: 12, alignItems: 'center', alignSelf: 'stretch' }}>
              {i < shown.length - 1 && <View style={{ position: 'absolute', top: 13, bottom: -13, width: 2, backgroundColor: C.line }} />}
              <View style={{ marginTop: 8, width: st.last ? 11 : 9, height: st.last ? 11 : 9, borderRadius: 6, borderWidth: st.last ? 3 : 0, borderColor: col, backgroundColor: st.last ? '#fff' : col }} />
            </View>
            <Text numberOfLines={1} style={[T.body, { flex: 1, color: C.ink, fontWeight: '700' }]}>{st.name}</Text>
            <Text style={T.small}>{fmtMin(st.minute)}{st.last ? rt('routes.terminus') : ''}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 6, gap: 8 }}>
        {(hidden > 0 || all) ? (
          <Pressable onPress={onToggle} hitSlop={6} style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: col, fontWeight: '800', fontSize: 13 }}>
              {all ? rt('routes.show_less') : rt('routes.show_all_value_stops', { p1: hidden })}
            </Text>
          </Pressable>
        ) : <View style={{ flex: 1 }} />}
        <Text style={[T.small, { fontSize: 11 }]}>{rt('routes.according_to_timetable')}</Text>
      </View>
    </View>
  );
}

function Partners() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {PARTNERS.map((p) => (
        <Image key={p.name} source={p.logo} style={{ width: p.w, height: p.h }} resizeMode="contain" accessibilityLabel={p.name} />
      ))}
    </View>
  );
}

function RecordingBanner({ top }: { top: number }) {
  const rt = useT();
  const o = useSharedValue(1);
  useEffect(() => { o.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true); }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={[{ position: 'absolute', top: top + 10, left: S.lg, right: S.lg, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 12 }, shadow(2)]}>
      <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: C.danger }, st]} />
      <Text style={{ fontWeight: '800', color: C.ink, flex: 1 }}>{rt('routes.recording_only_during_this_ride')}</Text>
      <Tag label={rt('routes.on_device')} color={C.success} />
    </View>
  );
}
