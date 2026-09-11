import React, { useEffect, useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';

const col = CONTEXT.clean.color;
const KINDS = ['Volle Tonne', 'Wilde Müllkippe', 'Sperrmüll', 'Scherben', 'Graffiti', 'Anderes'];

export default function Melden() {
  const router = useRouter();
  const { loc } = useLocation();
  const [kind, setKind] = useState(KINDS[0]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [pos, setPos] = useState(loc);
  const { cleanReports, addCleanReport, addAward } = useStore();
  const { setCtx, showToast } = useUI();
  useEffect(() => { setCtx('clean'); setPos(loc); }, [loc.lat]);

  async function snap() {
    if (Platform.OS === 'web') { setPhoto('demo'); return; }
    try { const r = await ImagePicker.launchCameraAsync({ quality: 0.4, exif: false }); if (!r.canceled) setPhoto(r.assets[0].uri); } catch { setPhoto('demo'); }
  }

  function submit() {
    // Dublettenschutz: gleiche Art im Umkreis 60 m in den letzten 72 h → keine neue Meldung, nur Bestätigung
    const dup = cleanReports.find((r) => r.kind === kind && hav(r.lat, r.lon, pos.lat, pos.lon) < 60 && Date.now() - r.at < 72 * 3600e3);
    const ticket = dup ? dup.ticket : `FES-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`;
    if (!dup) addCleanReport({ id: `${Date.now()}`, at: Date.now(), kind, lat: pos.lat, lon: pos.lon, ticket, status: 'eingegangen', photo: photo ?? undefined });
    const a = addAward({ type: 'clean.report', partner: 'fes', status: dup ? 'nicht zuordenbar' : photo ? 'plausibel' : 'selbst angegeben', key: `report:${ticket}`, at: Date.now(), title: `${kind} gemeldet · ${ticket}`, meta: { source: photo ? 'foto+gps' : 'user', evidence: dup ? [`Bereits gemeldet (${dup.ticket}), deine Meldung wurde als Bestätigung angehängt`] : ['Meldung wird zu einem FES-Ticket', 'Punkte werden gutgeschrieben, wenn FES das Ticket bearbeitet (hier direkt gewertet, Demo)', 'Erste Meldung je Ort in 72 h zählt'] } });
    showToast(a); haptic('success');
    router.replace('/cleanup/list');
  }

  return (
    <Screen tabBar={false}>
      <Header title="Melden" subtitle="wird zu einem FES-Ticket" color={col} />
      <Appear>
        <View style={{ height: 200, borderRadius: 22, overflow: 'hidden' }}>
          <Map center={pos} spanKm={0.9} userLocation={loc} onPress={(la, lo) => setPos({ lat: la, lon: lo })} markers={[{ id: 'p', lat: pos.lat, lon: pos.lon, color: col, emoji: '📍', selected: true }, ...cleanReports.slice(0, 20).map((r) => ({ id: r.id, lat: r.lat, lon: r.lon, color: C.muted, emoji: '🎫' }))]} />
        </View>
        <Text style={[T.small, { marginTop: 6 }]}>Tippe auf die Karte, um den Ort zu korrigieren. Bestehende Tickets in grau.</Text>
      </Appear>
      <Card style={{ marginTop: 14, gap: 12 }}>
        <Text style={T.h3}>Was ist los?</Text>
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>{KINDS.map((k) => <Pill key={k} label={k} active={kind === k} color={col} onPress={() => setKind(k)} />)}</Row>
        {photo && photo !== 'demo' ? <Image source={{ uri: photo }} style={{ height: 140, borderRadius: 14 }} /> : null}
        <Row style={{ gap: 8 }}>
          <Button label={photo ? 'Foto ✓' : 'Foto (ohne EXIF)'} color={col} variant="soft" onPress={snap} style={{ flex: 1, paddingVertical: 12 }} />
          <Button label="Absenden" color={col} onPress={submit} style={{ flex: 1, paddingVertical: 12 }} />
        </Row>
        <Row style={{ gap: 6 }}><StatusBadge status={photo ? 'plausibel' : 'selbst angegeben'} small /><Text style={T.small}>{photo ? 'Foto + Standort ×0,7' : 'Ohne Foto ×0,3'} · 25 Basispunkte · Dubletten im Umkreis 60 m werden zusammengeführt</Text></Row>
      </Card>
      {cleanReports.length > 0 && (
        <View style={{ marginTop: S.xl }}>
          <Text style={T.h2}>Deine Tickets</Text>
          {cleanReports.slice(0, 5).map((r) => (
            <Card key={r.id} style={{ marginTop: 10, paddingVertical: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>{r.kind}</Text><Tag label={r.status} color={r.status === 'erledigt' ? C.success : C.warn} /></Row>
              <Text style={T.small}>{r.ticket} · {new Date(r.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
