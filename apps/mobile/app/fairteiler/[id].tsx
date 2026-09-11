import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { AiPhotoSheet, VoiceSheet, type AiResult } from '@/components/AiSheets';
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
  const [sheet, setSheet] = useState<null | 'report' | 'stock' | 'pickup' | 'voice'>(null);
  const { shelfReports, addShelfReport, addAward, itemReservations, reserveItem, releaseItem, name } = useStore();
  const { setCtx, showToast } = useUI();

  useEffect(() => {
    setCtx('food');
    setPt((fairteilerSnapshot as FoodSharePoint[]).find((p) => String(p.id) === id) ?? null);
    fs.foodSharePoints().then((r) => { const live = r.items.find((p) => String(p.id) === id); if (live) setPt(live); }).catch(() => {});
  }, [id]);

  if (!pt) return <Screen tabBar={false}><Header title="Fairteiler" /><Text style={T.body}>Lade…</Text></Screen>;
  const dist = hav(loc.lat, loc.lon, pt.lat, pt.lon);
  const near = dist < 200;
  const reports = shelfReports.filter((r) => r.pointId === pt.id).sort((a, b) => b.at - a.at);
  const latest = reports[0];
  const title = pt.name.replace(/^Abgabestelle\s*/i, '').replace(/"/g, '');
  const ageMin = latest ? Math.round((Date.now() - latest.at) / 60000) : null;
  const myRes = itemReservations.filter((r) => r.placeId === `fsp-${pt.id}` && r.expiresAt > Date.now());
  const proof = (r: AiResult) => [r.photo ? 'Foto mit Zeitstempel gespeichert' : r.audio ? 'Sprachnotiz gespeichert' : 'Ohne Foto', near ? `Standort ${Math.round(dist)} m vom Fairteiler` : `Standort ${Math.round(dist)} m entfernt`];
  const status = (r: AiResult): 'plausibel' | 'schwach plausibel' | 'selbst angegeben' => (r.photo && near ? 'plausibel' : r.photo || r.audio ? 'schwach plausibel' : 'selbst angegeben');

  function onReport(r: AiResult) {
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: r.fill, categories: Array.from(new Set(r.items.map((i) => i.cat))), photo: r.photo, items: r.items });
    showToast(addAward({ type: 'food.report', partner: 'foodsharing', status: status(r), key: `shelf:${pt!.id}:${Math.floor(Date.now() / (6 * 3600e3))}`, at: Date.now(), title: `Regal-Status: ${title}`, meta: { source: 'foto+ki', evidence: [`Erkannt: ${r.items.map((i) => i.name).join(', ') || 'nichts'} · Füllstand ${r.fill}`, ...proof(r)] } }));
  }
  function onStock(r: AiResult) {
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: 'mittel', categories: Array.from(new Set(r.items.map((i) => i.cat))), photo: r.photo, items: r.items });
    showToast(addAward({ type: 'food.stock', partner: 'foodsharing', status: status(r), key: `stock:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Eingestellt: ${r.items.map((i) => i.name).join(', ')}`, meta: { food_g: r.grams, source: r.audio ? 'sprachnotiz+ki' : 'foto+ki', evidence: [`ca. ${(r.grams / 1000).toFixed(1)} kg für andere bereitgestellt`, ...proof(r)] } }));
  }
  async function onPickup(r: AiResult) {
    let st = status(r); const ev = [`Mitgenommen: ${r.items.map((i) => i.name).join(', ')} (ca. ${(r.grams / 1000).toFixed(1)} kg)`, ...proof(r)];
    try { await fs.pickup({ food_share_point_id: pt!.id }); st = 'plausibel'; ev.push('Abholung bei foodsharing registriert'); } catch {}
    myRes.forEach((x) => releaseItem(x.id));
    showToast(addAward({ type: 'food.pickup', partner: 'foodsharing', status: st, key: `pickup:fsp:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Abgeholt: ${title}`, meta: { food_g: r.grams, source: 'foto+ki', evidence: ev } }));
  }
  function hold(item: { name: string; qty: string }) {
    haptic('success');
    reserveItem({ placeId: `fsp-${pt!.id}`, placeTitle: title, item: item.name, qty: item.qty, expiresAt: Date.now() + HOLD_MIN * 60000, kind: 'fairteiler', href: `/fairteiler/${pt!.id}` });
    remind('Reserviert', `${item.name} am ${title} ist ${HOLD_MIN} Minuten für dich markiert.`, 'food');
  }

  return (
    <Screen tabBar={false}>
      <Header title={title} subtitle={pt.name.toLowerCase().includes('abgabe') ? 'Abgabestelle' : 'Fairteiler'} color={col} />
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
                      {held ? <Tag label={`für dich bis ${new Date(held.expiresAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`} color={C.success} /> : <Pressable onPress={() => hold(it)} style={{ backgroundColor: col + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Text style={{ color: col, fontWeight: '800' }}>{HOLD_MIN} min halten</Text></Pressable>}
                    </Row>
                  );
                })}
              </View>
            </View>
          ) : <Text style={[T.body, { marginTop: 6 }]}>Heute hat noch niemand gemeldet. Ein Foto reicht, die App erkennt den Rest. 15 Punkte.</Text>}
        </Card>
      </Appear>

      <View style={{ marginTop: 14, gap: 10 }}>
        <Button label="Regal fotografieren · 15 P" color={col} icon="📷" onPress={() => setSheet('report')} />
        <Row style={{ gap: 10 }}>
          <Button label="Eingestellt · 40 P" color={col} variant="soft" icon="🫙" onPress={() => setSheet('stock')} style={{ flex: 1 }} />
          <Button label="Per Sprache" color={col} variant="soft" icon="🎙️" onPress={() => setSheet('voice')} style={{ flex: 1 }} />
        </Row>
        <Button label="Abgeholt · 15 P" color={C.ink} variant="ghost" icon="🥕" onPress={() => setSheet('pickup')} />
      </View>
      <Row style={{ marginTop: 10, gap: 6, flexWrap: 'wrap' }}><StatusBadge status="plausibel" small /><Text style={T.small}>mit Foto vor Ort · </Text><StatusBadge status="selbst angegeben" small /><Text style={T.small}>ohne Nachweis</Text></Row>

      <AiPhotoSheet open={sheet === 'report'} onClose={() => setSheet(null)} onDone={onReport} color={col} mode="shelf" title="Was ist im Regal?" />
      <AiPhotoSheet open={sheet === 'stock'} onClose={() => setSheet(null)} onDone={onStock} color={col} mode="stock" title="Was hast du eingestellt?" />
      <AiPhotoSheet open={sheet === 'pickup'} onClose={() => setSheet(null)} onDone={onPickup} color={col} mode="pickup" title="Was nimmst du mit?" />
      <VoiceSheet open={sheet === 'voice'} onClose={() => setSheet(null)} onDone={onStock} color={col} />
    </Screen>
  );
}
