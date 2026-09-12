import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { trust, type SharedShelfUpdate } from '@/api/trust';
import PlaceCode from '@/components/PlaceCode';
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
  const rt = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const [shared,setShared]=useState<SharedShelfUpdate[]>([]),[syncError,setSyncError]=useState(''),[receiptId,setReceiptId]=useState('');
  const refresh=useCallback(async()=>{try{setShared(await trust.shelf(Number(id)));setSyncError('');}catch{setSyncError('Gemeinsamer Regalstand gerade nicht erreichbar. Lokale Meldungen bleiben erhalten.');}},[id]);
  useFocusEffect(useCallback(()=>{void refresh();const t=setInterval(()=>void refresh(),15000);return()=>clearInterval(t);},[refresh]));
  async function publish(kind:'shelf'|'stock'|'pickup',r:ActionResult){
    try{if(!await trust.hasSession())return;const result=await trust.updateShelf(Number(id),{kind,fill:r.fill,items:r.items,requestKey:`shelf-${Date.now()}-${Math.random().toString(36).slice(2)}`});setReceiptId(result.id);await refresh();}catch(e:any){setSyncError(`Lokal gespeichert. Teilen fehlgeschlagen: ${e.message}`);}
  }
  const [pt, setPt] = useState<FoodSharePoint | null>(null);
  const [sheet, setSheet] = useState<null | 'shelf' | 'stock' | 'pickup'>(null);
  const { shelfReports, addShelfReport, addAward, itemReservations, reserveItem, releaseItem, name } = useStore();
  const { setCtx, showToast } = useUI();

  useEffect(() => {
    setCtx('food');
    setPt((fairteilerSnapshot as FoodSharePoint[]).find((p) => String(p.id) === id) ?? null);
    fs.foodSharePoints().then((r) => { const live = r.items.find((p) => String(p.id) === id); if (live) setPt(live); }).catch(() => {});
  }, [id]);

  if (!pt) return <Screen tabBar={false}><Header right={<FoodsharingLogo width={76} />} title={rt('routes.foodsharing_shelf')} /><Text style={T.body}>{rt('routes.loading')}</Text></Screen>;
  const dist = hav(loc.lat, loc.lon, pt.lat, pt.lon);
  const near = dist < 200;
  const reports = shelfReports.filter((r) => r.pointId === pt.id).sort((a, b) => b.at - a.at);
  const sharedLatest=shared.find(r=>r.kind==='shelf');
  const local=reports[0];
  const latest=sharedLatest&&(!local||sharedLatest.at>=local.at)?sharedLatest:local;
  const changed=!!latest&&shared.some(r=>r.kind!=='shelf'&&r.at>latest.at);
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
    void publish('shelf',r);
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: r.fill, categories: Array.from(new Set(r.items.map((i) => i.cat))), photo: r.photo, items: r.items });
    showToast(addAward({ type: 'food.report', partner: 'foodsharing', status: status(r), key: `shelf:${pt!.id}:${Math.floor(Date.now() / (6 * 3600e3))}`, at: Date.now(), title: `Regal-Status: ${title}`, meta: { source: srcOf(r), evidence: [`Inhalt: ${r.items.map((i) => i.name).join(', ') || 'leer'} · Füllstand ${r.fill}`, ...proof(r)] } }));
  }
  function onStock(r: ActionResult) {
    void publish('stock',r);

    showToast(addAward({ type: 'food.stock', partner: 'foodsharing', status: status(r), key: `stock:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Eingestellt: ${r.items.map((i) => i.name).join(', ')}`, meta: { food_g: r.grams, source: srcOf(r), evidence: [`ca. ${(r.grams / 1000).toFixed(1)} kg für andere bereitgestellt`, ...proof(r)] } }));
  }
  async function onPickup(r: ActionResult) {
    void publish('pickup',r);
    let st = status(r); const ev = [`Mitgenommen: ${r.items.map((i) => i.name).join(', ')} (ca. ${(r.grams / 1000).toFixed(1)} kg)`, ...proof(r)];
    ev.push('Eigene Meldung; ein Orts-QR allein bestätigt keine Abholung.');
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
      <Header right={<FoodsharingLogo width={76} />} title={title} subtitle={pt.name.toLowerCase().includes('abgabe') ? rt('routes.dropoff_point') : rt('routes.foodsharing_shelf')} color={col} />
      <View style={{ height: 190, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={{ lat: pt.lat, lon: pt.lon }} spanKm={1.2} userLocation={loc} markers={[{ id: 'p', lat: pt.lat, lon: pt.lon, color: col, emoji: '🥕', selected: true }]} interactive={false} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{rt('routes.value_value_min_walk', { p1: fmtDist(dist, locale), p2: walkMin(dist) })}</Text>
        <Pressable onPress={() => openRoute(pt.lat, pt.lon, title)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: col, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
          <Ionicons name="navigate" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>{rt('routes.directions')}</Text>
        </Pressable>
      </Row>

      {!!syncError&&<Text accessibilityRole="alert" style={[T.small,{marginTop:12,color:C.warn}]}>{localize(syncError)}</Text>}
      <View style={{marginTop:12}}><PlaceCode value={`mainsam:shelf:${pt.id}`} label="Regal-QR anzeigen"/></View>
      {!!receiptId&&<Card style={{marginTop:12,gap:8}}><Text style={T.h3}>Meldung geteilt</Text><Text style={T.body}>Eine Regalbetreuung ist vor Ort? Zeige ihr deinen persönlichen Code. Ohne Betreuung bleibt dein Eintrag eine Meldung ohne Punkte.</Text><Button label="Meinen Übergabecode öffnen" color={col} onPress={()=>router.push({pathname:'/regalnachweise',params:{id:receiptId}})}/></Card>}
      <Appear delay={60}>
        <Card style={{ marginTop: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={T.h3}>{rt('routes.last_seen_on_the_shelf')}</Text>
            {latest ? <Tag label={rt('routes.value_ago', { p1: ageMin! < 60 ? `${ageMin} min` : `${Math.round(ageMin! / 60)} h` })} color={ageMin! < 120 ? C.success : C.muted} /> : null}
          </Row>
          {latest ? (
            <View style={{ marginTop: 8 }}>
              <Row style={{ gap: 6 }}>{(['leer', 'wenig', 'mittel', 'voll'] as const).map((f, i) => <View key={f} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: i <= ['leer', 'wenig', 'mittel', 'voll'].indexOf(latest.fill) ? col : C.line }} />)}</Row>
              <Text style={[T.small, { marginTop: 4 }]}>{rt('routes.fill_level_value_value', { p1: localize(latest.fill), p2: sharedLatest?.at===latest.at?rt('routes.shared_report'):rt('routes.reported_on_this_device') })}</Text><Text style={[T.small,{marginTop:4,color:changed?C.warn:C.muted}]}>{changed?rt('routes.food_has_been_added_or_taken_since_then_please_check_the_current_'):rt('routes.a_snapshot_not_a_stock_guarantee_people_without_the_app_can_also_')}</Text>
              {'photo' in latest && latest.photo && latest.photo !== 'demo' && <Image source={{ uri: latest.photo }} style={{ height: 120, borderRadius: 12, marginTop: 8 }} />}
              <View style={{ marginTop: 8, gap: 6 }}>
                {(latest.items ?? []).map((it) => {
                  const held = itemReservations.find((r) => r.item === it.name && r.placeId === `fsp-${pt.id}` && r.expiresAt > Date.now());
                  return (
                    <Row key={it.name} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 10 }}>
                      <View style={{ flex: 1 }}><Text style={[T.body, { fontWeight: '700', color: C.ink }]}>{it.name}</Text><Text style={T.small}>{it.qty} · {localize(it.cat)}</Text></View>
                      {held ? <Tag label={rt('routes.for_you_until_value', { p1: new Date(held.expiresAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })} color={C.success} /> : <Pressable onPress={() => hold(it)} style={{ backgroundColor: col + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}><Text style={{ color: col, fontWeight: '800' }}>{rt('routes.save_for_value_min', { p1: HOLD_MIN })}</Text></Pressable>}
                    </Row>
                  );
                })}
              </View>
            </View>
          ) : <Text style={[T.body, { marginTop: 6 }]}>{rt('routes.no_reports_today_yet_a_quick_look_at_the_shelf_helps_everyone_com')}</Text>}
        </Card>
      </Appear>

      {!!shared.length&&<Card style={{marginTop:12,gap:8}}><Text style={T.h3}>{rt('routes.recent_local_reports')}</Text>{shared.slice(0,5).map(r=><Text key={r.id} style={T.small}>{new Date(r.at).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})} · {r.kind==='stock'?rt('routes.added'):r.kind==='pickup'?rt('routes.collected'):rt('routes.shelf_checked')}: {r.items.map(i=>`${i.qty} ${i.name}`).join(', ')||localize(r.fill)}</Text>)}</Card>}
      <Button label="Meine Regalmeldungen & Betreuung" variant="soft" color={col} onPress={()=>router.push('/regalnachweise')} style={{ marginTop: 12 }}/>
      <Text style={[T.label, { marginTop: 18, marginBottom: 8 }]}>{rt('routes.what_are_you_doing')}</Text>
      <Row style={{ gap: 10 }}>
        <ActionTile icon="bag-handle" label={rt('routes.collect')} pts={15} color={col} onPress={() => setSheet('pickup')} />
        <ActionTile icon="add-circle" label={rt('routes.add_food')} pts={40} color={col} onPress={() => setSheet('stock')} />
        <ActionTile icon="eye" label={rt('routes.report_shelf_status')} pts={15} color={col} onPress={() => setSheet('shelf')} />
      </Row>
      <Text style={[T.small, { marginTop: 8, textAlign: 'center' }]}>{rt('routes.photo_audio_and_text_entry_remain_available_your_entry_is_not_pro')}</Text>

      <Card style={{ marginTop: 16, gap: 10 }}><Text style={T.h3}>{rt('routes.hand_food_to_a_person')}</Text><Text style={T.body}>{rt('routes.personal_handoffs_use_fixed_portions_acceptance_and_a_handoff_cod')}</Text><Button label={rt('routes.handoffs_reliability')} color={col} onPress={() => router.push({ pathname: '/uebergaben', params: { area: title } })} /></Card>
      <FoodActionSheet open={sheet === 'shelf'} mode="shelf" onClose={() => setSheet(null)} onDone={onReport} color={col} />
      <FoodActionSheet open={sheet === 'stock'} mode="stock" onClose={() => setSheet(null)} onDone={onStock} color={col} />
      <FoodActionSheet open={sheet === 'pickup'} mode="pickup" onClose={() => setSheet(null)} onDone={onPickup} color={col} />
    </Screen>
  );
}

function ActionTile({ icon, label, pts, color, onPress }: { icon: any; label: string; pts: number; color: string; onPress: () => void }) {
  const rt = useT();
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} style={({ pressed }) => [{ flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 6, borderWidth: 1.5, borderColor: pressed ? color : C.line, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={26} color="#fff" /></View>
      <Text style={[T.h3, { marginTop: 8, fontSize: 14 }]} numberOfLines={1}>{label}</Text>
      <Text style={{ color, fontWeight: '800', fontSize: 12, marginTop: 2 }}>{rt('routes.record')}</Text>
    </Pressable>
  );
}
