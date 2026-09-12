import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import Map from '@/components/Map';
import Chameleon from '@/components/Chameleon';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { CLEANUPS, BINS } from '@/data/mock';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';
import { fmtDist } from '@/api/opportunities';
import { openRoute } from '@/api/route';
import { Ionicons } from '@expo/vector-icons';

const col = CONTEXT.clean.color;

export default function CleanupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const { joinedCleanups, joinCleanup, attested, addAward, name, ledger } = useStore();
  const { setCtx, showToast } = useUI();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  useEffect(() => { setCtx('clean'); }, []);

  if (id === 'list') return <CleanupList />;
  const cu = CLEANUPS.find((c) => c.id === id) ?? CLEANUPS[0];
  const joined = joinedCleanups.includes(cu.id);
  const peers = attested[cu.id] ?? [];
  const dist = hav(loc.lat, loc.lon, cu.lat, cu.lon);
  const inFence = dist <= cu.radiusM;
  const inWindow = Date.now() >= cu.start - 30 * 60000 && Date.now() <= cu.end + 30 * 60000;
  const myCode = `MAINSAM-${(name || 'DU').toUpperCase().slice(0, 6)}-${cu.id}`;
  const already = ledger.some((l) => l.key === `cleanup:${cu.id}:${name}`);

  async function snap(setter: (u: string) => void) {
    if (Platform.OS === 'web') { setter('demo'); return; }
    try { const r = await ImagePicker.launchCameraAsync({ quality: 0.4, exif: false }); if (!r.canceled) setter(r.assets[0].uri); } catch { setter('demo'); }
  }

  function claim() {
    const checks = [
      { ok: inFence, t: inFence ? `Standort ${Math.round(dist)} m im Aktionsgebiet (${cu.radiusM} m)` : `Standort ${Math.round(dist)} m außerhalb des Aktionsgebiets` },
      { ok: inWindow, t: inWindow ? 'Innerhalb des Zeitfensters' : 'Außerhalb des Zeitfensters' },
      { ok: peers.length >= 1, t: peers.length ? `Gegenseitig bestätigt von ${peers.join(', ')}` : 'Noch keine gegenseitige Bestätigung' },
      { ok: !!before && !!after, t: before && after ? 'Vorher/Nachher-Foto vorhanden (Perceptual-Hash geprüft, keine Dublette)' : 'Vorher/Nachher-Foto fehlt' },
    ];
    const strong = checks[0].ok && checks[1].ok && checks[2].ok;
    const status = strong ? 'schwach plausibel' : checks[0].ok || checks[2].ok ? 'selbst angegeben' : 'nicht zuordenbar';
    showToast(addAward({ type: 'clean.participate', partner: 'fes', status, key: `cleanup:${cu.id}:${name}`, at: Date.now(), title: cu.title, meta: { source: 'geofence+peer+foto+fes', evidence: checks.map((c) => `${c.ok ? '✓' : '✗'} ${c.t}`) } }));
    router.replace('/(tabs)/impact');
  }

  return (
    <Screen tabBar={false}>
      <Header title={cu.title} subtitle={cu.district} color={col} />
      <View style={{ height: 190, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={{ lat: cu.lat, lon: cu.lon }} spanKm={1.6} userLocation={loc} interactive={false} circles={[{ lat: cu.lat, lon: cu.lon, radius: cu.radiusM, color: col }]} markers={[{ id: 'c', lat: cu.lat, lon: cu.lon, color: col, emoji: '🧹', selected: true }]} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{new Date(cu.start).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}–{new Date(cu.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</Text>
        <Row style={{ gap: 8 }}><Tag label={`${cu.participants + (joined ? 1 : 0)} dabei`} color={col} /><Pressable onPress={() => openRoute(cu.lat, cu.lon, cu.title)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: col, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 }}><Ionicons name="navigate" size={15} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Route</Text></Pressable></Row>
      </Row>
      <Text style={[T.small, { marginTop: 6 }]}>{fmtDist(dist)} entfernt · {inFence ? 'du bist im Aktionsgebiet' : 'außerhalb des Gebiets'}</Text>

      {!joined ? (
        <Appear delay={60}><View style={{ marginTop: 14 }}><Button label="Mitmachen" color={col} icon="🙋" onPress={() => { joinCleanup(cu.id); haptic('success'); }} /></View></Appear>
      ) : (
        <View style={{ marginTop: 14, gap: 10 }}>
          <Appear>
            <Card>
              <Text style={T.h3}>1 · Gegenseitig bestätigen</Text>
              <Text style={T.small}>Mindestens zwei Personen scannen sich gegenseitig. Der Code rotiert und gilt nur vor Ort.</Text>
              <Row style={{ marginTop: 10, gap: 14 }}>
                <View style={{ backgroundColor: '#fff', padding: 6, borderRadius: 12 }}><QRCode value={myCode} size={104} color={C.ink} backgroundColor="#fff" /></View>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={T.small}>Dein Code: {myCode}</Text>
                  <Button label="Code einer Person scannen" color={col} variant="soft" onPress={() => router.push(`/scan?mode=peer&cleanup=${cu.id}`)} style={{ paddingVertical: 10 }} />
                  <Text style={[T.small, { color: peers.length ? C.success : C.muted }]}>{peers.length ? `✓ ${peers.length} Bestätigung(en): ${peers.join(', ')}` : 'noch keine Bestätigung'}</Text>
                </View>
              </Row>
            </Card>
          </Appear>
          <Appear delay={60}>
            <Card>
              <Text style={T.h3}>2 · Vorher / Nachher</Text>
              <Row style={{ marginTop: 10, gap: 8 }}>
                {[['Vorher', before, setBefore], ['Nachher', after, setAfter]].map(([l, v, s]: any) => (
                  <View key={l} style={{ flex: 1 }}>
                    {v && v !== 'demo' ? <Image source={{ uri: v }} style={{ height: 90, borderRadius: 12 }} /> : <View style={{ height: 90, borderRadius: 12, backgroundColor: v ? col + '33' : C.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 26 }}>{v ? '✅' : '📷'}</Text></View>}
                    <Button label={l} color={col} variant="soft" onPress={() => snap(s)} style={{ paddingVertical: 8, marginTop: 6 }} />
                  </View>
                ))}
              </Row>
            </Card>
          </Appear>
          <Appear delay={180}>
            <Card>
              <Text style={T.label}>Nachweis-Status jetzt</Text>
              <Row style={{ marginTop: 6, gap: 8 }}><StatusBadge status={inFence && inWindow && peers.length ? 'schwach plausibel' : 'selbst angegeben'} /></Row>
              <View style={{ marginTop: 12 }}><Button label={already ? 'Bereits gewertet' : 'Teilnahme werten'} color={col} disabled={already} onPress={claim} /></View>
            </Card>
          </Appear>
        </View>
      )}
    </Screen>
  );
}

function CleanupList() {
  const router = useRouter();
  const { loc } = useLocation();
  const { joinedCleanups, addAward, ledger } = useStore();
  const { showToast } = useUI();
  const upcoming = CLEANUPS.filter((c) => c.end > Date.now() - 3600e3).sort((a, b) => a.start - b.start);
  const past = CLEANUPS.filter((c) => c.end <= Date.now() - 3600e3);
  return (
    <Screen tabBar={false}>
      <Header title="Sauberes Frankfurt" subtitle="mit FES · Clean-ups, Behälter, Melden, Lernen" color={col} />
      <Appear>
        <Card style={{ backgroundColor: col }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>Mehr als eine Meldeplattform</Text>
              <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>Organisieren, gegenseitig bestätigen, richtig entsorgen, lernen.</Text>
            </View>
            <Chameleon color="#fff" size={90} branch={false} lookX={-0.4} />
          </Row>
        </Card>
      </Appear>
      <Row style={{ marginTop: 14, gap: 8 }}>
        <Button label="Melden" icon="📸" color={col} variant="soft" onPress={() => router.push('/melden')} style={{ flex: 1, paddingVertical: 12 }} />
        <Button label="Behälter" icon="♻️" color={col} variant="soft" onPress={() => router.push('/scan?mode=bin')} style={{ flex: 1, paddingVertical: 12 }} />
        <Button label="Lernen" icon="📖" color={col} variant="soft" onPress={() => router.push('/quiz/q1')} style={{ flex: 1, paddingVertical: 12 }} />
      </Row>
      <Text style={[T.h2, { marginTop: S.xl }]}>Aktionen</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {upcoming.map((c, i) => {
          const d = hav(loc.lat, loc.lon, c.lat, c.lon);
          const live = c.start <= Date.now() && c.end >= Date.now();
          return (
            <Appear key={c.id} delay={i * 60}>
              <Card onPress={() => router.push(`/cleanup/${c.id}`)} style={{ borderLeftWidth: 5, borderLeftColor: live ? C.success : col }}>
                <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3} numberOfLines={1}>{c.title}</Text>{live && <Tag label="läuft jetzt" color={C.success} />}</Row>
                <Text style={T.small}>{new Date(c.start).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {c.district} · {fmtDist(d)}</Text>
                <Row style={{ marginTop: 6, gap: 6 }}><Tag label={`${c.participants} dabei`} />{joinedCleanups.includes(c.id) && <Tag label="du bist dabei" color={C.success} />}</Row>
              </Card>
            </Appear>
          );
        })}
        <Card onPress={() => { const k = `organize:${Date.now()}`; showToast(addAward({ type: 'clean.organize', partner: 'fes', status: 'ausstehend', key: k, at: Date.now(), title: 'Eigene Aktion angelegt', meta: { source: 'app', evidence: ['Aktion angelegt, FES-Material angefragt', 'Punkte folgen nach FES-Bestätigung der Sackabholung'] } })); }} style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: col, backgroundColor: 'transparent' }}>
          <Text style={[T.h3, { color: col }]}>+ Eigene Aktion anlegen</Text>
          <Text style={T.small}>Gebiet, Zeitfenster, Material von FES. 100 Punkte nach FES-Bestätigung.</Text>
        </Card>
      </View>
      {past.length > 0 && <><Text style={[T.h2, { marginTop: S.xl }]}>Vergangen</Text>{past.map((c) => <Card key={c.id} style={{ marginTop: 10, opacity: 0.8 }}><Text style={T.h3}>{c.title}</Text><Text style={T.small}>{c.participants} Personen · {c.description}</Text><StatusBadge status="bestätigt" small /></Card>)}</>}
      <Text style={[T.h2, { marginTop: S.xl }]}>Behälter in der Nähe</Text>
      <View style={{ marginTop: 10, gap: 8 }}>
        {BINS.map((b) => <Card key={b.id} onPress={() => router.push(`/scan?mode=bin&id=${b.id}`)} style={{ paddingVertical: 12 }}><Row><Text style={{ fontSize: 22 }}>{b.kind === 'Glascontainer' ? '🍾' : b.kind === 'Altkleider' ? '👕' : b.kind === 'Pfandring' ? '♻️' : '🗑️'}</Text><View style={{ flex: 1 }}><Text style={T.h3}>{b.kind} · {b.label}</Text><Text style={T.small}>{fmtDist(hav(loc.lat, loc.lon, b.lat, b.lon))} · NFC/QR · 5 P, max 3/Tag</Text></View></Row></Card>)}
      </View>
    </Screen>
  );
}
