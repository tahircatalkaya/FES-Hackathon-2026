import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { Appear, Button, Card, Row, T, Tag, haptic } from '@/components/ui';
import { FoodActionSheet, type ActionResult } from '@/components/FoodActionSheet';
import { C, CONTEXT, S } from '@/theme';
import { fs, hav, type FoodSharePoint } from '@/api/foodsharing';
import fairteilerSnapshot from '@/data/fairteiler.json';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { fmtDist, walkMin } from '@/api/opportunities';
import { openRoute } from '@/api/route';
import { remind } from '@/api/notify';

const col = CONTEXT.food.color;
const HOLD_MIN = 30;

export default function Fairteiler() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const [pt, setPt] = useState<FoodSharePoint | null>(null);
  const [sheet, setSheet] = useState<null | 'shelf' | 'stock' | 'pickup'>(null);
  const { shelfReports, addShelfReport, addAward, itemReservations, reserveItem, releaseItem, name } = useStore();
  const { setCtx, showToast } = useUI();

  useEffect(() => {
    setCtx('food');
    setPt((fairteilerSnapshot as FoodSharePoint[]).find((p) => String(p.id) === id) ?? null);
    fs.foodSharePoints().then((r) => { const live = r.items.find((p) => String(p.id) === id); if (live) setPt(live); }).catch(() => {});
  }, [id]);

  if (!pt) return <Screen tabBar={false}><Header right={<FoodsharingLogo width={76} />} title="Fairteiler" /><Text style={T.body}>Lade…</Text></Screen>;
  const dist = hav(loc.lat, loc.lon, pt.lat, pt.lon);
  const near = dist < 200;
  const reports = shelfReports.filter((r) => r.pointId === pt.id).sort((a, b) => b.at - a.at);
  const latest = reports[0];
  const title = pt.name.replace(/^Abgabestelle\s*/i, '').replace(/"/g, '');
  const ageMin = latest ? Math.round((Date.now() - latest.at) / 60000) : null;
  const myRes = itemReservations.filter((r) => r.placeId === `fsp-${pt.id}` && r.expiresAt > Date.now());
  const proof = (r: ActionResult) => [
    r.photo ? 'Foto als eigene Dokumentation gespeichert' : r.audio ? 'Sprachnotiz als eigene Dokumentation gespeichert' : 'Selbst eingetragen',
    r.ai ? (r.method === 'photo' ? 'Inhalt per Bilderkennung erfasst, von dir bestätigt' : 'Sprachnotiz transkribiert, von dir bestätigt') : null,
    near ? `Standort ${Math.round(dist)} m vom Fairteiler` : `Standort ${Math.round(dist)} m entfernt`,
  ].filter(Boolean) as string[];
  const status = (r: ActionResult): 'plausibel' | 'schwach plausibel' | 'selbst angegeben' => (r.photo && near ? 'plausibel' : r.photo || r.audio ? 'schwach plausibel' : 'selbst angegeben');
  const srcOf = (r: ActionResult) => (r.method === 'photo' ? (r.ai ? 'foto+ki' : 'foto') : r.method === 'voice' ? (r.ai ? 'sprachnotiz+ki' : 'sprachnotiz') : 'user');
  function onReport(r: ActionResult) {
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: r.fill, categories: Array.from(new Set(r.items.map((i) => i.cat))), photo: r.photo, items: r.items });
    showToast(addAward({ type: 'food.report', partner: 'foodsharing', status: status(r), key: `shelf:${pt!.id}:${Math.floor(Date.now() / (6 * 3600e3))}`, at: Date.now(), title: `Regal-Status: ${title}`, meta: { source: srcOf(r), evidence: [`Inhalt: ${r.items.map((i) => i.name).join(', ') || 'leer'} · Füllstand ${r.fill}`, ...proof(r)] } }));
  }
  function onStock(r: ActionResult) {
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: 'mittel', categories: Array.from(new Set(r.items.map((i) => i.cat))), photo: r.photo, items: r.items });
    showToast(addAward({ type: 'food.stock', partner: 'foodsharing', status: status(r), key: `stock:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Eingestellt: ${r.items.map((i) => i.name).join(', ')}`, meta: { food_g: r.grams, source: srcOf(r), evidence: [`ca. ${(r.grams / 1000).toFixed(1)} kg für andere bereitgestellt`, ...proof(r)] } }));
  }
  async function onPickup(r: ActionResult) {
    let st = status(r); const ev = [`Mitgenommen: ${r.items.map((i) => i.name).join(', ')} (ca. ${(r.grams / 1000).toFixed(1)} kg)`, ...proof(r)];
    try { await fs.pickup({ food_share_point_id: pt!.id }); ev.push('Eigene Meldung beim verbundenen Dienst; kein unabhängiger Nachweis'); } catch { ev.push('Nur auf diesem Gerät gespeichert'); }
    myRes.forEach((x) => releaseItem(x.id));
    showToast(addAward({ type: 'food.pickup', partner: 'foodsharing', status: st, key: `pickup:fsp:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Abgeholt: ${title}`, meta: { food_g: r.grams, source: srcOf(r), evidence: ev } }));
  }
  function hold(item: { name: string; qty: string }) {
    haptic('success');
    reserveItem({ placeId: `fsp-${pt!.id}`, placeTitle: title, item: item.name, qty: item.qty, expiresAt: Date.now() + HOLD_MIN * 60000, kind: 'fairteiler', href: `/fairteiler/${pt!.id}` });
    remind('Merkliste', `${item.name} am ${title} ist für ${HOLD_MIN} Minuten auf deiner lokalen Merkliste. Es ist nicht für andere gesperrt.`, 'food');
  }

  return (
    <Screen tabBar={false}>
      <Header right={<FoodsharingLogo width={76} />} title={title} subtitle={pt.name.toLowerCase().includes('abgabe') ? 'Abgabestelle' : 'Fairteiler'} color={col} />
      <View style={{ height: 190, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={{ lat: pt.lat, lon: pt.lon }} spanKm={1.2} userLocation={loc} markers={[{ id: 'p', lat: pt.lat, lon: pt.lon, color: col, emoji: '🥕', selected: true }]} interactive={false} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{fmtDist(dist)} · {walkMin(dist)} min zu Fuß</Text>
        <Pressable onPress={() => openRoute(pt.lat, pt.lon, title)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: col, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
          <Ionicons name="navigate" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Route</Text>
        </Pressable>
      </Row>

      <Appear delay={60}>
        <Card style={{ marginTop: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={T.h3}>Was ist gerade drin?</Text>
            {latest ? <Tag label={`vor ${ageMin! < 60 ? `${ageMin} min` : `${Math.round(ageMin! / 60)} h`}`} color={ageMin! < 120 ? C.success : C.muted} /> : null}
          </Row>
          {latest ? (
            <View style={{ marginTop: 8 }}>
              <Row style={{ gap: 6 }}>{(['leer', 'wenig', 'mittel', 'voll'] as const).map((f, i) => <View key={f} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i <= ['leer', 'wenig', 'mittel', 'voll'].indexOf(latest.fill) ? col : C.line }} />)}</Row>
              <Text style={[T.small, { marginTop: 4 }]}>Füllstand {latest.fill}</Text>
              {latest.photo && latest.photo !== 'demo' && <Image source={{ uri: latest.photo }} style={{ height: 120, borderRadius: 12, marginTop: 8 }} />}
              <View style={{ marginTop: 8, gap: 6 }}>
                {(latest.items ?? []).map((it) => {
                  const held = itemReservations.find((r) => r.item === it.name && r.placeId === `fsp-${pt.id}` && r.expiresAt > Date.now());
                  return (
                    <Row key={it.name} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 10 }}>
                      <View style={{ flex: 1 }}><Text style={[T.body, { fontWeight: '700', color: C.ink }]}>{it.name}</Text><Text style={T.small}>{it.qty} · {it.cat}</Text></View>
                      {held ? <Tag label={`für dich bis ${new Date(held.expiresAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`} color={C.success} /> : <Pressable onPress={() => hold(it)} style={{ backgroundColor: col + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Text style={{ color: col, fontWeight: '800' }}>{HOLD_MIN} min merken</Text></Pressable>}
                    </Row>
                  );
                })}
              </View>
            </View>
          ) : <Text style={[T.body, { marginTop: 6 }]}>Heute hat noch niemand gemeldet. Ein kurzer Blick ins Regal hilft allen, die danach kommen.</Text>}
        </Card>
      </Appear>

      <Text style={[T.label, { marginTop: 18, marginBottom: 8 }]}>Was machst du gerade?</Text>
      <Row style={{ gap: 10 }}>
        <ActionTile icon="bag-handle" label="Abholen" pts={15} color={col} onPress={() => setSheet('pickup')} />
        <ActionTile icon="add-circle" label="Einstellen" pts={40} color={col} onPress={() => setSheet('stock')} />
        <ActionTile icon="eye" label="Regal melden" pts={15} color={col} onPress={() => setSheet('shelf')} />
      </Row>
      <Text style={[T.small, { marginTop: 8, textAlign: 'center' }]}>Foto, Audio und Texteingabe bleiben verfügbar. Deine Erfassung ist noch kein Übergabenachweis und gibt allein keine Punkte.</Text>

      <Card style={{ marginTop: 16, gap: 10 }}><Text style={T.h3}>Mit einer Person übergeben</Text><Text style={T.body}>Für persönliche Übergaben gibt es feste Portionen, Zusagen und einen Übergabecode. Am offenen Regal ohne Gegenüber bleibt deine Meldung eine Eigenangabe.</Text><Button label="Übergaben & Zuverlässigkeit" color={col} onPress={() => router.push({ pathname: '/uebergaben', params: { area: title } })} /></Card>
      <FoodActionSheet open={sheet === 'shelf'} mode="shelf" onClose={() => setSheet(null)} onDone={onReport} color={col} />
      <FoodActionSheet open={sheet === 'stock'} mode="stock" onClose={() => setSheet(null)} onDone={onStock} color={col} />
      <FoodActionSheet open={sheet === 'pickup'} mode="pickup" onClose={() => setSheet(null)} onDone={onPickup} color={col} />
    </Screen>
  );
}

function ActionTile({ icon, label, pts, color, onPress }: { icon: any; label: string; pts: number; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} style={({ pressed }) => [{ flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 6, borderWidth: 1.5, borderColor: pressed ? color : C.line, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={26} color="#fff" /></View>
      <Text style={[T.h3, { marginTop: 8, fontSize: 14 }]} numberOfLines={1}>{label}</Text>
      <Text style={{ color, fontWeight: '800', fontSize: 12, marginTop: 2 }}>Erfassen</Text>
    </Pressable>
  );
}
