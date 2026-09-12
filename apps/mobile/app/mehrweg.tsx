import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openRoute } from '@/api/route';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Map from '@/components/Map';
import Chameleon from '@/components/Chameleon';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useLocation } from '@/hooks/useLocation';
import { vytalStores, type VytalStore } from '@/api/vytal';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { remind } from '@/api/notify';
import { fmtDist } from '@/api/opportunities';

const col = CONTEXT.reuse.color;

export default function Reuse() {
  const router = useRouter();
  const p = useLocalSearchParams<{ store?: string }>();
  const { loc } = useLocation();
  const [stores, setStores] = useState<VytalStore[]>([]);
  const [source, setSource] = useState<'api' | 'snapshot'>('snapshot');
  const [sel, setSel] = useState<string | null>(p.store ?? null);
  const [filter, setFilter] = useState<'alle' | 'RESTAURANT' | 'NATIONAL_CHAIN' | 'SELF_OPERATED_CANTEEN'>('alle');
  const { containers, returnContainer, addAward, ledger } = useStore();
  const { setCtx, showToast } = useUI();

  useEffect(() => { setCtx('reuse'); vytalStores(loc.lat, loc.lon).then((r) => { setStores(r.items); setSource(r.source); }); }, [loc.lat, loc.lon]);
  const shown = useMemo(() => stores.filter((s) => filter === 'alle' || s.type === filter).slice(0, 25), [stores, filter]);
  const open = containers.filter((c) => !c.returnedAt);
  const returned = containers.filter((c) => c.returnedAt).length;
  const store = stores.find((s) => s.id === sel) ?? null;

  function doReturn(code: string) {
    const c = returnContainer(code, Date.now());
    if (!c) return;
    // Der Store bestätigt die Rückgabe (POST /api/3/Container/ContainerReturn, Store-JWT). Wir werten das Event genau einmal je transactionId.
    const a = addAward({ type: 'reuse.return', partner: 'vytal', status: 'bestätigt', key: `vytal:return:${c.txId}`, at: Date.now(), title: `Rückgabe ${c.kind === 'cup' ? 'Becher' : 'Schale'} ${c.code}`, meta: { containers: 1, source: 'store', evidence: [`Ausleihe ${new Date(c.borrowedAt).toLocaleString('de-DE')} bei ${c.storeName}`, `Rückgabe bestätigt durch ${store?.name ?? 'Vytal-Partner'}`, `Transaktion ${c.txId} nur einmal wertbar`] } });
    showToast(a);
    if (Date.now() - c.borrowedAt < 48 * 3600e3) {
      setTimeout(() => showToast(addAward({ type: 'reuse.return_fast', partner: 'vytal', status: 'bestätigt', key: `vytal:fast:${c.txId}`, at: Date.now(), title: 'Schnelle Rückgabe unter 48 h', meta: { source: 'api', evidence: ['Schneller Umlauf, mehr Nutzungen je Behälter'] } })), 4500);
    }
  }

  async function borrowDemo(s: VytalStore | null) {
    router.push(`/scan?mode=vytal${s ? `&store=${s.id}` : ''}`);
    await remind('Vytal-Erinnerung', 'Dein Behälter möchte in 14 Tagen zurück. Rückgabe in 48 h gibt +10 Punkte.', 'reuse', 60);
  }

  return (
    <Screen tabBar={false}>
      <Header title="Smart Mehrweg" subtitle="mit Vytal" color={col} />
      <Appear>
        <Card style={{ backgroundColor: col }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>Dein Kreislauf</Text>
              <Text style={[T.h2, { color: '#fff' }]}>{open.length} unterwegs · {returned} zurück</Text>
              <Text style={[T.small, { color: '#ffffffcc' }]}>Zurückbringen ist die Leistung, nicht Ausleihen. Jede bestätigte Rückgabe genau einmal.</Text>
            </View>
            <Chameleon pose="coffee" size={90} />
          </Row>
        </Card>
      </Appear>

      {open.length > 0 && (
        <View style={{ marginTop: 14, gap: 10 }}>
          <Text style={T.h3}>Unterwegs</Text>
          {open.map((c) => {
            const hrs = (Date.now() - c.borrowedAt) / 3600e3;
            const left = Math.max(0, 14 * 24 - hrs);
            return (
              <Appear key={c.code}>
                <Card style={{ borderLeftWidth: 5, borderLeftColor: col }}>
                  <Row>
                    <Text style={{ fontSize: 30 }}>{c.kind === 'cup' ? '☕' : '🥡'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={T.h3}>{c.kind === 'cup' ? 'Becher' : 'Schale'} {c.code}</Text>
                      <Text style={T.small}>seit {new Date(c.borrowedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · {c.storeName}</Text>
                      <Text style={[T.small, { color: hrs < 48 ? C.success : left < 48 ? C.danger : C.muted, fontWeight: '700' }]}>{hrs < 48 ? `Noch ${Math.round(48 - hrs)} h für den Schnell-Bonus` : left < 48 ? `Nur noch ${Math.round(left)} h Frist` : `${Math.floor(left / 24)} Tage Frist`}</Text>
                    </View>
                  </Row>
                  <View style={{ marginTop: 10 }}><Button label="Rückgabe am Store bestätigen" color={col} onPress={() => doReturn(c.code)} style={{ paddingVertical: 12 }} /></View>
                  <Text style={[T.small, { marginTop: 6 }]}>Der Store bestätigt die Rückgabe, du bekommst die Punkte sofort.</Text>
                </Card>
              </Appear>
            );
          })}
        </View>
      )}

      <Text style={[T.h3, { marginTop: S.xl }]}>Partner in der Nähe</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {(['alle', 'RESTAURANT', 'NATIONAL_CHAIN', 'SELF_OPERATED_CANTEEN'] as const).map((f) => <Pill key={f} label={f === 'alle' ? 'Alle' : f === 'RESTAURANT' ? 'Restaurants' : f === 'NATIONAL_CHAIN' ? 'Ketten' : 'Kantinen'} active={filter === f} color={col} onPress={() => setFilter(f)} />)}
      </ScrollView>
      <View style={{ height: 240, borderRadius: 22, overflow: 'hidden', marginTop: 12 }}>
        <Map center={store ? { lat: store.lat, lon: store.lon } : shown.length ? { lat: (loc.lat + shown[0].lat) / 2, lon: (loc.lon + shown[0].lon) / 2 } : loc} spanKm={store ? 1.2 : 4.5} userLocation={loc} markers={shown.map((s) => ({ id: s.id, lat: s.lat, lon: s.lon, color: col, emoji: '🥡', selected: s.id === sel, onPress: () => { haptic(); setSel(s.id); } }))} />
      </View>
      <View style={{ marginTop: 12, gap: 8 }}>
        {shown.slice(0, 8).map((s, i) => (
          <Card key={s.id} onPress={() => setSel(s.id)} style={{ paddingVertical: 12, borderWidth: 2, borderColor: s.id === sel ? col : 'transparent' }}>
            <Row>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CONTEXT.reuse.soft, alignItems: 'center', justifyContent: 'center' }}><Text>{s.type === 'RESTAURANT' ? '🍽️' : s.type === 'SELF_OPERATED_CANTEEN' ? '🏢' : '🏪'}</Text></View>
              <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{s.name}</Text><Text style={T.small}>{s.address} · {fmtDist((s.distance_km ?? 0) * 1000)}</Text></View>
              <Pressable onPress={() => openRoute(s.lat, s.lon, s.name)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: col + '18', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="navigate" size={18} color={col} /></Pressable>
            </Row>
            {s.id === sel && (
              <View style={{ marginTop: 10 }}>
                <Divider />
                <Row style={{ gap: 8 }}>
                  <Button label="Ausleihe scannen" color={col} onPress={() => borrowDemo(s)} style={{ flex: 1, paddingVertical: 12 }} />
                  <Button label="Rückgabe hier" color={col} variant="soft" disabled={!open.length} onPress={() => open[0] && doReturn(open[0].code)} style={{ flex: 1, paddingVertical: 12 }} />
                </Row>
              </View>
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
