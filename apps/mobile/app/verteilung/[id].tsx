import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { SAVER_DISTRIBUTIONS } from '@/data/mock';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';
import { fmtDist, walkMin } from '@/api/opportunities';
import { remind } from '@/api/notify';

const col = CONTEXT.food.color;

export default function Verteilung() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const d = SAVER_DISTRIBUTIONS.find((x) => x.id === id) ?? SAVER_DISTRIBUTIONS[0];
  const [slot, setSlot] = useState<number | null>(null);
  const [booked, setBooked] = useState(false);
  const [wants, setWants] = useState<string[]>([]);
  const { addAward } = useStore();
  const { setCtx, showToast } = useUI();
  useEffect(() => { setCtx('food'); }, []);

  const dist = hav(loc.lat, loc.lon, d.lat, d.lon);
  const slotLen = (d.end - d.start) / d.slots;
  const slots = Array.from({ length: d.slots }).map((_, i) => ({ i, t: d.start + i * slotLen, taken: i < d.taken }));
  const minsToStart = Math.round((d.start - Date.now()) / 60000);
  const revealed = booked && minsToStart <= 15;
  const circle = { lat: d.lat + 0.0012, lon: d.lon - 0.0015 };

  async function book() {
    if (slot === null) return;
    setBooked(true); haptic('success');
    await remind('Slot reserviert', `${d.saver}: ${new Date(slots[slot].t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr. Adresse erscheint 15 Minuten vorher.`, 'food');
  }
  function pickedUp() {
    showToast(addAward({ type: 'food.pickup', partner: 'foodsharing', status: 'plausibel', key: `dist:${d.id}:${slot}`, at: Date.now(), title: `Abholung bei ${d.saver}`, meta: { food_g: 1200, source: 'saver-bestätigung', evidence: [`Slot ${new Date(slots[slot!].t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} eingehalten`, 'Saver hat die Übergabe bestätigt'] } }));
    setTimeout(() => showToast(addAward({ type: 'food.reservation_kept', partner: 'foodsharing', status: 'bestätigt', key: `kept:dist:${d.id}`, at: Date.now(), title: 'Slot eingehalten', meta: { source: 'app' } })), 4500);
    router.replace('/(tabs)/impact');
  }

  return (
    <Screen tabBar={false}>
      <Header title={`Verteilung bei ${d.saver}`} subtitle={`${d.district} · ${d.badge}`} color={col} />
      <View style={{ height: 190, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={circle} spanKm={1.3} userLocation={loc} interactive={false} circles={revealed ? [] : [{ lat: circle.lat, lon: circle.lon, radius: 300, color: col }]} markers={revealed ? [{ id: 'd', lat: d.lat, lon: d.lon, color: col, emoji: '🏠', selected: true }] : []} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{revealed ? `${fmtDist(dist)} · ${walkMin(dist)} min` : `ca. ${fmtDist(Math.round(dist / 100) * 100)} entfernt`}</Text>
        <Tag label={d.taken >= d.slots ? 'ausgebucht' : `${d.slots - d.taken} Slots frei`} color={d.taken >= d.slots ? C.danger : C.success} />
      </Row>
      <Text style={[T.small, { marginTop: 4 }]}>🔒 Saver verteilen oft von zu Hause. Die genaue Adresse erscheint erst 15 Minuten vor deinem Slot. Früher kommen geht nicht, und das ist Absicht.</Text>

      <Appear delay={60}>
        <Card style={{ marginTop: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>Gerettet bei {d.source}</Text><Tag label={`${new Date(d.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}–${new Date(d.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`} color={col} /></Row>
          <View style={{ marginTop: 8, gap: 6 }}>
            {d.items.map((it) => (
              <Row key={it.n} style={{ justifyContent: 'space-between' }}>
                <Text style={T.body}>{it.n}</Text>
                <Row style={{ gap: 6 }}><Text style={T.small}>{it.q}</Text><Pill label={wants.includes(it.n) ? '✓ möchte ich' : 'möchte ich'} active={wants.includes(it.n)} color={col} onPress={() => setWants(wants.includes(it.n) ? wants.filter((x) => x !== it.n) : [...wants, it.n])} /></Row>
              </Row>
            ))}
          </View>
          <Text style={[T.small, { marginTop: 8 }]}>Angaben vom Saver. Wer Wünsche markiert, hilft beim fairen Aufteilen: nicht alles für eine Person.</Text>
        </Card>
      </Appear>

      {!booked ? (
        <Appear delay={120}>
          <Card style={{ marginTop: 14, gap: 10 }}>
            <Text style={T.h3}>Slot wählen (5 Minuten)</Text>
            <Row style={{ flexWrap: 'wrap', gap: 6 }}>
              {slots.map((s) => <Pill key={s.i} label={new Date(s.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} active={slot === s.i} color={s.taken ? C.muted : col} onPress={s.taken ? undefined : () => setSlot(s.i)} />)}
            </Row>
            <Button label="Slot reservieren" color={col} disabled={slot === null || d.taken >= d.slots} onPress={book} />
            <Text style={T.small}>Ersetzt „Ich komme dann mal vorbei“ in der WhatsApp-Gruppe. Der Saver sieht, wer wann kommt und was noch da ist.</Text>
          </Card>
        </Appear>
      ) : (
        <Appear>
          <Card style={{ marginTop: 14, gap: 10, borderLeftWidth: 5, borderLeftColor: C.success }}>
            <Text style={T.h3}>Dein Slot: {new Date(slots[slot!].t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</Text>
            {revealed ? <View style={{ backgroundColor: C.ink, borderRadius: 16, padding: 14 }}><Text style={[T.label, { color: '#ffffff99' }]}>Adresse</Text><Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Oeder Weg 112, EG links</Text></View> : <Text style={T.body}>Die Adresse erscheint {minsToStart > 15 ? `in ${minsToStart - 15} Minuten` : 'jetzt gleich'}.</Text>}
            <Divider />
            <Button label="Übergabe bestätigen (Demo)" color={col} onPress={pickedUp} />
            <Row style={{ gap: 6 }}><StatusBadge status="plausibel" small /><Text style={T.small}>Saver-Bestätigung ×0,7 · Abholung 0 P, Impact voll · Slot eingehalten +5</Text></Row>
          </Card>
        </Appear>
      )}
      <View style={{ marginTop: S.xl }}><Button label="Selbst Saver werden" variant="soft" color={col} icon="🦸" onPress={() => router.push('/saver')} /></View>
    </Screen>
  );
}
