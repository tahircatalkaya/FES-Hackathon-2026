import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { fs, DEMO_BASKETS, hav, type Basket } from '@/api/foodsharing';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { fmtDist, walkMin } from '@/api/opportunities';
import { remind } from '@/api/notify';
import { openRoute } from '@/api/route';
import { Ionicons } from '@expo/vector-icons';

const col = CONTEXT.food.color;
const TTL_MIN = 45;

/** Kreismittelpunkt bewusst versetzt (deterministisch je Korb), Radius 300 m. Exakte Position erst nach Zusage. */
function fuzz(lat: number, lon: number, seed: number) {
  const a = (seed * 9301 + 49297) % 233280 / 233280 * Math.PI * 2, r = 120 + ((seed * 7) % 100);
  return { lat: lat + (Math.sin(a) * r) / 110540, lon: lon + (Math.cos(a) * r) / 70000 };
}

export default function KorbScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const [b, setB] = useState<Basket | null>(null);
  const [src, setSrc] = useState<'api' | 'demo'>('demo');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slot, setSlot] = useState('gleich');
  const [grams, setGrams] = useState(1500);
  const { reservations, addReservation, updateReservation, addAward } = useStore();
  const { setCtx, showToast } = useUI();
  const res = reservations.find((r) => r.basketId === Number(id));

  useEffect(() => {
    setCtx('food');
    const demo = DEMO_BASKETS.find((x) => String(x.id) === id);
    if (demo) setB(demo);
    fs.basket(Number(id)).then((x) => { setB(x); setSrc('api'); }).catch(() => { if (!demo) setErr('Korb nicht gefunden oder API nicht erreichbar.'); });
  }, [id]);

  const circle = useMemo(() => (b ? fuzz(b.lat, b.lon, b.id) : null), [b?.id]);
  if (!b) return <Screen tabBar={false}><Header title="Korb" /><Text style={T.body}>{err ?? 'Lade…'}</Text></Screen>;
  const dist = hav(loc.lat, loc.lon, b.lat, b.lon);
  const expired = b.expires_at ? new Date(b.expires_at).getTime() < Date.now() : false;
  const revealed = res && (res.status === 'accepted' || res.status === 'picked_up');
  const ttlLeft = res ? Math.max(0, Math.round((res.expiresAt - Date.now()) / 60000)) : 0;
  const openCount = reservations.filter((r) => r.status === 'pending' || r.status === 'accepted').length;

  async function request() {
    if (openCount >= 1 && !res) { setErr('Nur eine offene Reservierung gleichzeitig. So bleibt für alle etwas übrig.'); return; }
    setBusy(true); haptic(); setErr(null);
    let status: 'pending' | 'accepted' = 'pending'; let note = '';
    try { await fs.requestBasket(b!.id, `Ich könnte ${slot} vorbeikommen.`); note = ''; }
    catch (e: any) { note = ''; }
    addReservation({ basketId: b!.id, title: b!.title, at: Date.now(), expiresAt: Date.now() + TTL_MIN * 60000, status });
    await remind('Anfrage gesendet', `${b!.title}: Die anbietende Person entscheidet. Reservierung verfällt in ${TTL_MIN} min.`, 'food');
    // Demo: Anbieter sagt nach kurzer Zeit zu
    setTimeout(() => { updateReservation(b!.id, { status: 'accepted', addressRevealed: 'Leipziger Str. 48, 2. Stock, Klingel Brinkmann' }); remind('Zusage!', `${b!.title} ist für dich reserviert. Die genaue Adresse ist jetzt sichtbar.`, 'food'); }, 6000);
    setBusy(false); setErr(note);
  }

  async function cancel() {
    haptic('warn');
    try { const me = await fs.me(); await fs.setRequestStatus(b!.id, me.id, 'cancelled'); } catch {}
    updateReservation(b!.id, { status: 'cancelled' });
  }

  async function pickedUp() {
    setBusy(true); haptic('success');
    let status: 'bestätigt' | 'selbst angegeben' = 'selbst angegeben'; const ev: string[] = [];
    try { await fs.pickup({ basket_id: b!.id }); status = 'bestätigt'; ev.push('Übergabe bestätigt'); }
    catch (e: any) { ev.push('Ohne Bestätigung der anbietenden Person'); }
    updateReservation(b!.id, { status: 'picked_up' });
    showToast(addAward({ type: 'food.pickup', partner: 'foodsharing', status, key: `pickup:basket:${b!.id}`, at: Date.now(), title: `Abgeholt: ${b!.title}`, meta: { food_g: grams, source: status === 'bestätigt' ? 'api' : 'user', evidence: ev } }));
    setTimeout(() => showToast(addAward({ type: 'food.reservation_kept', partner: 'foodsharing', status: 'bestätigt', key: `kept:${b!.id}`, at: Date.now(), title: 'Reservierung eingehalten', meta: { source: 'app', evidence: ['Innerhalb des Zeitfensters abgeholt'] } })), 4500);
    setBusy(false);
    router.replace('/(tabs)/impact');
  }

  return (
    <Screen tabBar={false}>
      <Header title={b.title} subtitle="Korb aus der Nachbarschaft" color={col} />
      <View style={{ height: 210, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={circle!} spanKm={1.4} userLocation={loc} interactive={false}
          circles={revealed ? [] : [{ lat: circle!.lat, lon: circle!.lon, radius: 300, color: col }]}
          markers={revealed ? [{ id: 'b', lat: b.lat, lon: b.lon, color: col, emoji: '🧺', selected: true }] : []} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{revealed ? `${fmtDist(dist)} · ${walkMin(dist)} min` : `ca. ${fmtDist(Math.round(dist / 100) * 100)} entfernt`}</Text>
        {revealed ? <Pressable onPress={() => openRoute(b.lat, b.lon, b.title)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: col, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}><Ionicons name="navigate" size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Route</Text></Pressable> : <Tag label={expired ? 'abgelaufen' : b.status === 'available' ? 'offen' : b.status} color={expired ? C.danger : b.status === 'available' ? C.success : C.warn} />}
      </Row>
      <Text style={[T.small, { marginTop: 4 }]}>{revealed ? '📍 Genaue Position sichtbar, nur für dich und nur solange die Zusage gilt.' : '🔒 Nur der ungefähre Bereich. Die genaue Adresse bekommst du nach der Zusage.'}</Text>

      <Appear delay={60}>
        <Card style={{ marginTop: 14 }}>
          <Text style={T.body}>{b.description || 'Keine Beschreibung hinterlegt.'}</Text>
          <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>{(b.food_types ?? []).map((f) => <Tag key={f} label={f} color={col} />)}</Row>
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}><Text style={T.small}>Verfügbar bis</Text><Text style={T.body}>{b.expires_at ? new Date(b.expires_at).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '–'}</Text></Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 4 }}><Text style={T.small}>Anfragen bisher</Text><Text style={T.body}>{b.requests?.length ?? 0}</Text></Row>
        </Card>
      </Appear>

      {!res || res.status === 'cancelled' || res.status === 'expired' ? (
        <Appear delay={120}>
          <Card style={{ marginTop: 14, gap: 10 }}>
            <Text style={T.h3}>Anfragen statt Sofort-Reservieren</Text>
            <Text style={T.small}>Die anbietende Person entscheidet. Wer zuerst tippt, gewinnt nicht automatisch. Max. 1 offene Anfrage, {TTL_MIN} min Frist, 2 No-Shows in 30 Tagen = 24 h Pause.</Text>
            <Row style={{ gap: 6, flexWrap: 'wrap' }}>{['gleich', 'in 1 Stunde', 'heute Abend'].map((s) => <Pill key={s} label={s} active={slot === s} color={col} onPress={() => setSlot(s)} />)}</Row>
            <Button label={busy ? 'Sende…' : 'Anfrage senden'} color={col} disabled={busy || expired} onPress={request} />
            {err && <Text style={[T.small, { color: C.warn }]}>{err}</Text>}
          </Card>
        </Appear>
      ) : (
        <Appear delay={120}>
          <Card style={{ marginTop: 14, gap: 10, borderLeftWidth: 5, borderLeftColor: res.status === 'accepted' ? C.success : C.warn }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={T.h3}>{res.status === 'pending' ? 'Anfrage läuft' : res.status === 'accepted' ? 'Zusage erhalten' : 'Abgeholt'}</Text>
              <Tag label={res.status === 'picked_up' ? 'erledigt' : `${ttlLeft} min`} color={ttlLeft < 10 ? C.danger : C.muted} />
            </Row>
            {res.status === 'pending' && <Text style={T.body}>Die anbietende Person entscheidet gerade.</Text>}
            {res.status === 'accepted' && (
              <View style={{ backgroundColor: C.ink, borderRadius: 16, padding: 14 }}>
                <Text style={[T.label, { color: '#ffffff99' }]}>Adresse freigegeben</Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17, marginTop: 4 }}>{res.addressRevealed}</Text>
                <Text style={{ color: '#ffffffbb', fontSize: 12, marginTop: 4 }}>Nur für dich sichtbar, nur solange die Zusage gilt. Wird bei Storno wieder eingezogen.</Text>
              </View>
            )}
            {res.status !== 'picked_up' && (
              <>
                <Row style={{ gap: 6 }}>{[500, 1500, 3000].map((g) => <Pill key={g} label={`ca. ${g / 1000} kg`} active={grams === g} color={col} onPress={() => setGrams(g)} />)}</Row>
                <Button label="Abholung bestätigen" color={col} disabled={res.status !== 'accepted' || busy} onPress={pickedUp} />
                <Button label="Anfrage zurückziehen" variant="ghost" color={C.muted} onPress={cancel} style={{ paddingVertical: 10 }} />
              </>
            )}
            <Row style={{ gap: 6 }}><StatusBadge status="bestätigt" small /><Text style={T.small}>Abholung 15 P · Reservierung eingehalten +5</Text></Row>
          </Card>
        </Appear>
      )}
    </Screen>
  );
}
