import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { SAVER_DISTRIBUTIONS } from '@/data/mock';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';
import { fmtDist, walkMin } from '@/api/opportunities';
import { openRoute } from '@/api/route';
import { remind } from '@/api/notify';

const col = CONTEXT.food.color;
const TTL_MIN = 45;
const EXACT = { d1: 'Oeder Weg 112, EG links', d2: 'Schweizer Str. 61, Hinterhaus', d3: 'Leipziger Str. 48, 2. Stock' } as Record<string, string>;

export default function Verteilung() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const d = SAVER_DISTRIBUTIONS.find((x) => x.id === id) ?? SAVER_DISTRIBUTIONS[0];
  const [slot, setSlot] = useState<number | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const { addAward, itemReservations, reserveItem, releaseItem } = useStore();
  const { setCtx, showToast } = useUI();
  useEffect(() => { setCtx('food'); }, []);

  const dist = hav(loc.lat, loc.lon, d.lat, d.lon);
  const slotLen = (d.end - d.start) / d.slots;
  const slots = Array.from({ length: d.slots }).map((_, i) => ({ i, t: d.start + i * slotLen, taken: i < d.taken }));
  const mine = itemReservations.filter((r) => r.placeId === `dist-${d.id}` && r.expiresAt > Date.now());
  const booked = mine.length > 0;
  const mySlot = booked ? Number(mine[0].qty.split('|')[1] ?? -1) : null;
  const minsToStart = Math.round(((mySlot !== null && mySlot >= 0 ? slots[mySlot].t : d.start) - Date.now()) / 60000);
  const revealed = booked && minsToStart <= 15;
  const circle = { lat: d.lat + 0.0012, lon: d.lon - 0.0015 };
  // Simulierte Reservierungen anderer Personen, damit der Rest sichtbar wird
  const others: Record<string, number> = { [d.items[0].n]: 1 };
  const totalOf = (q: string) => parseInt(q, 10) || 0;

  async function book() {
    if (slot === null) return;
    const chosen = d.items.filter((it) => (qty[it.n] ?? 0) > 0);
    if (!chosen.length) return;
    haptic('success');
    chosen.forEach((it) => reserveItem({ placeId: `dist-${d.id}`, placeTitle: `Verteilung bei ${d.saver}`, item: it.n, qty: `${qty[it.n]}|${slot}`, expiresAt: slots[slot].t + slotLen + TTL_MIN * 60000, kind: 'verteilung', href: `/verteilung/${d.id}` }));
    await remind('Reserviert', `${chosen.map((c) => `${qty[c.n]}× ${c.n}`).join(', ')} bei ${d.saver}, Slot ${new Date(slots[slot].t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}. Adresse erscheint 15 Minuten vorher.`, 'food');
  }
  function cancel() { haptic('warn'); mine.forEach((m) => releaseItem(m.id)); }
  function pickedUp() {
    router.push('/uebergaben');
  }

  return (
    <Screen tabBar={false}>
      <Header right={<FoodsharingLogo width={76} />} title={`Verteilung bei ${d.saver}`} subtitle={`${d.district} · ${d.badge}`} color={col} />
      <Card style={{ marginBottom: 14, gap: 10 }}><Tag label="Beispielangebot" color={C.muted} /><Text style={T.body}>Dieses Beispiel hat keine angebundene anbietende Person. Echte Anfragen, Zusagen und Bewertungen findest du unter Übergaben.</Text><Button label="Echte Übergabe vereinbaren" color={col} onPress={() => router.push('/uebergaben')} /></Card>
      <View style={{ height: 180, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={circle} spanKm={1.3} userLocation={loc} interactive={false} circles={revealed ? [] : [{ lat: circle.lat, lon: circle.lon, radius: 300, color: col }]} markers={revealed ? [{ id: 'd', lat: d.lat, lon: d.lon, color: col, emoji: '🏠', selected: true }] : []} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{revealed ? `${fmtDist(dist)} · ${walkMin(dist)} min` : `ca. ${fmtDist(Math.round(dist / 100) * 100)} entfernt`}</Text>
        {revealed ? (
          <Pressable onPress={() => openRoute(d.lat, d.lon, d.saver)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: col, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}><Ionicons name="navigate" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Route</Text></Pressable>
        ) : <Tag label={d.taken >= d.slots ? 'ausgebucht' : `${d.slots - d.taken} Slots frei`} color={d.taken >= d.slots ? C.danger : C.success} />}
      </Row>
      <Text style={[T.small, { marginTop: 4 }]}>{revealed ? 'Genaue Adresse freigegeben.' : '🔒 Die genaue Adresse erscheint 15 Minuten vor deinem Slot.'}</Text>

      <Appear delay={60}>
        <Card style={{ marginTop: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>Gerettet bei {d.source}</Text><Tag label={`${new Date(d.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}–${new Date(d.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`} color={col} /></Row>
          <Text style={[T.small, { marginTop: 2 }]}>Wähle, was du brauchst. Andere sehen, was übrig bleibt.</Text>
          <View style={{ marginTop: 10, gap: 8 }}>
            {d.items.map((it) => {
              const total = totalOf(it.q) || 3; const left = Math.max(0, total - (others[it.n] ?? 0) - (booked ? totalOf(mine.find((m) => m.item === it.n)?.qty ?? '0') : 0));
              const my = booked ? totalOf(mine.find((m) => m.item === it.n)?.qty ?? '0') : (qty[it.n] ?? 0);
              return (
                <View key={it.n} style={{ backgroundColor: C.bg, borderRadius: 14, padding: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}><Text style={[T.body, { fontWeight: '700', color: C.ink }]}>{it.n}</Text><Text style={T.small}>{it.q} · noch {left} frei{(others[it.n] ?? 0) ? ` · ${others[it.n]} reserviert` : ''}</Text></View>
                    {booked ? (my > 0 ? <Tag label={`${my}× für dich`} color={C.success} /> : null) : (
                      <Row style={{ gap: 6 }}>
                        <Pressable onPress={() => { haptic(); setQty({ ...qty, [it.n]: Math.max(0, (qty[it.n] ?? 0) - 1) }); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: C.ink }}>−</Text></Pressable>
                        <Text style={{ fontWeight: '900', width: 20, textAlign: 'center' }}>{qty[it.n] ?? 0}</Text>
                        <Pressable onPress={() => { haptic(); setQty({ ...qty, [it.n]: Math.min(left, Math.min(2, (qty[it.n] ?? 0) + 1)) }); }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '900', color: '#fff' }}>+</Text></Pressable>
                      </Row>
                    )}
                  </Row>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: '#fff', marginTop: 8, overflow: 'hidden' }}><View style={{ width: `${Math.round((left / total) * 100)}%`, height: 6, backgroundColor: col }} /></View>
                </View>
              );
            })}
          </View>
          <Text style={[T.small, { marginTop: 8 }]}>Max. 2 je Posten, damit für alle etwas da ist.</Text>
        </Card>
      </Appear>

      {!booked ? (
        <Appear delay={120}>
          <Card style={{ marginTop: 14, gap: 10 }}>
            <Text style={T.h3}>Wann kommst du?</Text>
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {slots.map((s) => <Pill key={s.i} label={new Date(s.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} active={slot === s.i} color={s.taken ? C.muted : col} onPress={s.taken ? undefined : () => setSlot(s.i)} />)}
            </Row>
            <Button label="Beispiel-Reservierung ansehen" color={col} disabled={slot === null || !Object.values(qty).some((v) => v > 0) || d.taken >= d.slots} onPress={book} />
            <Text style={T.small}>Gilt bis {TTL_MIN} Minuten nach deinem Slot. Eine bestätigte Übergabe braucht eine Zusage von beiden Personen.</Text>
          </Card>
        </Appear>
      ) : (
        <Appear>
          <Card style={{ marginTop: 14, gap: 10, borderLeftWidth: 5, borderLeftColor: C.success }}>
            <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>Dein Slot: {mySlot !== null && mySlot >= 0 ? new Date(slots[mySlot].t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–'} Uhr</Text><Tag label="reserviert" color={C.success} /></Row>
            {revealed ? <View style={{ backgroundColor: C.ink, borderRadius: 16, padding: 14 }}><Text style={[T.label, { color: '#ffffff99' }]}>Adresse</Text><Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{EXACT[d.id]}</Text></View> : <Text style={T.body}>Die Adresse erscheint {minsToStart > 15 ? `in ${minsToStart - 15} Minuten` : 'jetzt gleich'}.</Text>}
            <Divider />
            <Button label="Echte Übergabe vereinbaren" color={col} onPress={pickedUp} />
            <Button label="Reservierung aufheben" variant="ghost" color={C.muted} onPress={cancel} style={{ paddingVertical: 10 }} />
            <Text style={[T.small, { textAlign: 'center' }]}>Keine Punkte ohne beidseitige Bestätigung.</Text>
          </Card>
        </Appear>
      )}
      <View style={{ marginTop: S.xl }}><Button label="Selbst Saver werden" variant="soft" color={col} icon="people" onPress={() => router.push('/saver')} /></View>
    </Screen>
  );
}
