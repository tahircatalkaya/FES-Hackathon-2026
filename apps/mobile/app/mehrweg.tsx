import { useT, useLocale } from '@/i18n/useT';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openRoute } from '@/api/route';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Map from '@/components/Map';
import ReuseInventory from '@/components/ReuseInventory';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, Divider, Pill, Row, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useLocation } from '@/hooks/useLocation';
import { vytalStores, type VytalStore } from '@/api/vytal';
import { reuseTrust } from '@/api/trust';
import { useUI } from '@/store/ui';
import { fmtDist } from '@/api/opportunities';

const col = CONTEXT.reuse.color;

export default function Reuse() {
  const rt = useT();
  const locale = useLocale();
  const router = useRouter();
  const p = useLocalSearchParams<{ store?: string }>();
  const { loc } = useLocation();
  const [stores, setStores] = useState<VytalStore[]>([]);
  const [source, setSource] = useState<'api' | 'snapshot'>('snapshot');
  const [sel, setSel] = useState<string | null>(p.store ?? null);
  const [filter, setFilter] = useState<'alle' | 'RESTAURANT' | 'NATIONAL_CHAIN' | 'SELF_OPERATED_CANTEEN'>('alle');
  const [returnStores,setReturnStores]=useState<string[]>([]);
  const { setCtx } = useUI();

  useEffect(() => { setCtx('reuse'); vytalStores(loc.lat, loc.lon).then((r) => { setStores(r.items); setSource(r.source); }); }, [loc.lat, loc.lon]);
  const shown = useMemo(() => stores.filter((s) => filter === 'alle' || s.type === filter).slice(0, 25), [stores, filter]);
  useEffect(()=>{const refresh=()=>void reuseTrust.stores().then(setReturnStores).catch(()=>{});refresh();const t=setInterval(refresh,15000);return()=>clearInterval(t);},[]);
  const store = stores.find((s) => s.id === sel) ?? null;

  async function borrowDemo(s: VytalStore | null) {
    router.push(`/scan?mode=vytal${s ? `&store=${s.id}` : ''}`);

  }

  return (
    <Screen tabBar={false}>
      <Header title={rt('routes.smart_reusables')} subtitle={rt('routes.with_vytal')} color={col} />
      <ReuseInventory />

      <Text style={[T.h3, { marginTop: S.xl }]}>{rt('routes.nearby_partners')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {(['alle', 'RESTAURANT', 'NATIONAL_CHAIN', 'SELF_OPERATED_CANTEEN'] as const).map((f) => <Pill key={f} label={f === 'alle' ? rt('routes.all') : f === 'RESTAURANT' ? rt('routes.restaurants') : f === 'NATIONAL_CHAIN' ? rt('routes.chains') : rt('routes.canteens')} active={filter === f} color={col} onPress={() => setFilter(f)} />)}
      </ScrollView>
      <View style={{ height: 240, borderRadius: 22, overflow: 'hidden', marginTop: 12 }}>
        <Map center={store ? { lat: store.lat, lon: store.lon } : shown.length ? { lat: (loc.lat + shown[0].lat) / 2, lon: (loc.lon + shown[0].lon) / 2 } : loc} spanKm={store ? 1.2 : 4.5} userLocation={loc} markers={shown.map((s) => ({ id: s.id, lat: s.lat, lon: s.lon, color: col, emoji: '🥡', selected: s.id === sel, onPress: () => { haptic(); setSel(s.id); } }))} />
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {shown.slice(0, 8).map((s, i) => (
          <Card key={s.id} onPress={() => setSel(s.id)} style={{ paddingVertical: 12, borderWidth: 2, borderColor: s.id === sel ? col : 'transparent' }}>
            <Row>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CONTEXT.reuse.soft, alignItems: 'center', justifyContent: 'center' }}><Text>{s.type === 'RESTAURANT' ? '🍽️' : s.type === 'SELF_OPERATED_CANTEEN' ? '🏢' : '🏪'}</Text></View>
              <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{s.name}</Text><Text style={T.small}>{s.address} · {fmtDist((s.distance_km ?? 0) * 1000, locale)}</Text></View>
              <Pressable onPress={() => openRoute(s.lat, s.lon, s.name)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col + '18', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="navigate" size={18} color={col} /></Pressable>
            </Row>
            {returnStores.includes(s.id)&&<Tag label={rt('routes.mainsam_returns_available')} color={col}/>}
            {s.id === sel && (
              <View style={{ marginTop: 10 }}>
                <Divider />
                <Row style={{ gap: 8 }}>
                  <Button label={rt('routes.scan_loan')} color={col} onPress={() => borrowDemo(s)} style={{ flex: 1, paddingVertical: 12 }} />
                  <Button label={rt('routes.return_here')} color={col} variant="soft" disabled={!returnStores.includes(s.id)} onPress={() => router.push('/rueckgabe')} style={{ flex: 1, paddingVertical: 12 }} />
                </Row>
                {!returnStores.includes(s.id)&&<Text style={[T.small,{marginTop:8}]}>{rt('routes.this_partner_has_no_mainsam_return_station_yet_please_make_actual')}</Text>}
              </View>
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
