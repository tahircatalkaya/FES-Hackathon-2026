import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Map from '@/components/Map';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { fs, type FoodSharePoint } from '@/api/foodsharing';
import fairteilerSnapshot from '@/data/fairteiler.json';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';
import { fmtDist, walkMin } from '@/api/opportunities';

const col = CONTEXT.food.color;
const CATS = ['Backwaren', 'Obst & Gemüse', 'Milchprodukte', 'Konserven', 'Gekochtes', 'Getränke'];
const FILLS = ['leer', 'wenig', 'mittel', 'voll'] as const;

export default function Fairteiler() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { loc } = useLocation();
  const [pt, setPt] = useState<FoodSharePoint | null>(null);
  const [src, setSrc] = useState<'api' | 'snapshot'>('snapshot');
  const [mode, setMode] = useState<'view' | 'report' | 'stock' | 'pickup'>('view');
  const [fill, setFill] = useState<(typeof FILLS)[number]>('mittel');
  const [cats, setCats] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [grams, setGrams] = useState(800);
  const [busy, setBusy] = useState(false);
  const { shelfReports, addShelfReport, addAward } = useStore();
  const { setCtx, showToast } = useUI();

  useEffect(() => {
    setCtx('food');
    const snap = (fairteilerSnapshot as FoodSharePoint[]).find((p) => String(p.id) === id) ?? null;
    setPt(snap);
    fs.foodSharePoints().then((r) => { const live = r.items.find((p) => String(p.id) === id); if (live) { setPt(live); setSrc(r.source === 'api' ? 'api' : 'snapshot'); } }).catch(() => {});
  }, [id]);

  if (!pt) return <Screen tabBar={false}><Header title="Fairteiler" /><Text style={T.body}>Lade…</Text></Screen>;
  const dist = hav(loc.lat, loc.lon, pt.lat, pt.lon);
  const reports = shelfReports.filter((r) => r.pointId === pt.id).sort((a, b) => b.at - a.at);
  const latest = reports[0];
  const title = pt.name.replace(/^Abgabestelle\s*/i, '').replace(/^"|"$/g, '');
  const ageMin = latest ? Math.round((Date.now() - latest.at) / 60000) : null;

  async function pickPhoto() {
    try {
      const r = await ImagePicker.launchCameraAsync({ quality: 0.4, exif: false });
      if (!r.canceled) setPhoto(r.assets[0].uri);
    } catch { setPhoto('demo'); }
  }

  function submitReport() {
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill, categories: cats, photo: photo ?? undefined });
    const a = addAward({ type: 'food.report', partner: 'foodsharing', status: photo ? 'schwach plausibel' : 'selbst angegeben', key: `shelf:${pt!.id}:${Math.floor(Date.now() / (6 * 3600e3))}`, at: Date.now(), title: `Regal-Status: ${title}`, meta: { source: photo ? 'foto+gps' : 'user', evidence: [`Füllstand „${fill}“, ${cats.length ? cats.join(', ') : 'keine Kategorien'}`, dist < 200 ? `Standort ${Math.round(dist)} m vom Fairteiler` : `Standort ${Math.round(dist)} m entfernt (Geofence 200 m nicht erfüllt)`, 'Max. eine Meldung je Fairteiler und 6 Stunden'] } });
    showToast(a); setMode('view'); setPhoto(null); setCats([]);
  }

  function submitStock() {
    const a = addAward({ type: 'food.stock', partner: 'foodsharing', status: photo ? 'schwach plausibel' : 'selbst angegeben', key: `stock:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Eingestellt: ${title}`, meta: { food_g: grams, source: photo ? 'foto+gps' : 'user', evidence: [`ca. ${grams} g ${cats.join(', ') || 'Lebensmittel'} eingestellt`, 'Angebot für andere geschaffen'] } });
    addShelfReport({ pointId: pt!.id, at: Date.now(), fill: 'mittel', categories: cats, photo: photo ?? undefined });
    showToast(a); setMode('view'); setPhoto(null);
  }

  async function submitPickup() {
    setBusy(true); haptic();
    let status: 'bestätigt' | 'selbst angegeben' = 'selbst angegeben'; const ev: string[] = [];
    try { const r = await fs.pickup({ food_share_point_id: pt!.id }); status = 'bestätigt'; ev.push(`Abholung in der foodsharing-API erfasst (${r.picked_up_at})`); }
    catch (e: any) { ev.push(`API nicht erreichbar oder abgelehnt: ${e.message}. Als Eigenangabe gewertet.`); }
    const a = addAward({ type: 'food.pickup', partner: 'foodsharing', status, key: `pickup:fsp:${pt!.id}:${Date.now()}`, at: Date.now(), title: `Abgeholt: ${title}`, meta: { food_g: grams, source: status === 'bestätigt' ? 'api' : 'user', evidence: ev } });
    showToast(a); setBusy(false); setMode('view');
  }

  return (
    <Screen tabBar={false}>
      <Header title={title} subtitle={`${pt.name.toLowerCase().includes('abgabe') ? 'Abgabestelle' : 'Fairteiler'} · ${src === 'api' ? 'foodsharing-API' : 'Snapshot'}`} color={col} />
      <View style={{ height: 200, borderRadius: 22, overflow: 'hidden' }}>
        <Map center={{ lat: pt.lat, lon: pt.lon }} spanKm={1.2} userLocation={loc} markers={[{ id: 'p', lat: pt.lat, lon: pt.lon, color: col, emoji: '🥕', selected: true }]} interactive={false} />
      </View>
      <Row style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '800', color: col, fontSize: 16 }}>{fmtDist(dist)} · {walkMin(dist)} min zu Fuß</Text>
        <Tag label={src === 'api' ? 'API-Daten' : 'Snapshot 11.09.'} color={src === 'api' ? C.success : C.community} />
      </Row>
      <Text style={[T.small, { marginTop: 4 }]}>{pt.address ?? 'Adresse laut API nicht hinterlegt'} · {pt.opening_hours ?? 'Öffnungszeiten laut API nicht hinterlegt'}</Text>

      <Appear delay={80}>
        <Card style={{ marginTop: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={T.h3}>Was ist gerade drin?</Text>
            {latest ? <Tag label={`vor ${ageMin! < 60 ? `${ageMin} min` : `${Math.round(ageMin! / 60)} h`}`} color={ageMin! < 120 ? C.success : C.muted} /> : <Tag label="keine Meldung" />}
          </Row>
          {latest ? (
            <View style={{ marginTop: 8 }}>
              <Row style={{ gap: 6 }}>{FILLS.map((f) => <View key={f} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: FILLS.indexOf(f) <= FILLS.indexOf(latest.fill) ? col : C.line }} />)}</Row>
              <Text style={[T.body, { marginTop: 6 }]}>Füllstand <Text style={{ fontWeight: '800' }}>{latest.fill}</Text>{latest.categories.length ? ` · ${latest.categories.join(', ')}` : ''}</Text>
              {latest.photo && latest.photo !== 'demo' && <Image source={{ uri: latest.photo }} style={{ height: 120, borderRadius: 12, marginTop: 8 }} />}
              <Text style={T.small}>Nutzereingabe, keine bestätigten Daten. Bilderkennung schlägt Kategorien vor, der Mensch bestätigt.</Text>
            </View>
          ) : <Text style={[T.body, { marginTop: 6 }]}>Niemand hat heute gemeldet. Wer meldet, verhindert Leerfahrten anderer und bekommt 15 Punkte.</Text>}
        </Card>
      </Appear>

      {mode === 'view' && (
        <View style={{ marginTop: 14, gap: 10 }}>
          <Button label="Regal-Status melden · 15 P" color={col} icon="📸" onPress={() => setMode('report')} />
          <Button label="Ich habe etwas eingestellt · 40 P" color={col} variant="soft" icon="🫙" onPress={() => setMode('stock')} />
          <Button label="Ich habe etwas abgeholt · 0 P, voller Impact" color={C.ink} variant="ghost" icon="🥕" onPress={() => setMode('pickup')} />
          <Text style={[T.small, { textAlign: 'center' }]}>Abholen gibt keine Punkte: Wer Essen mitnimmt, bekommt bereits Essen. Der Impact zählt trotzdem.</Text>
        </View>
      )}

      {(mode === 'report' || mode === 'stock') && (
        <Appear>
          <Card style={{ marginTop: 14, gap: 12 }}>
            <Text style={T.h3}>{mode === 'report' ? 'Regal-Status' : 'Was hast du eingestellt?'}</Text>
            {mode === 'report' && <Row style={{ gap: 6 }}>{FILLS.map((f) => <Pill key={f} label={f} active={fill === f} color={col} onPress={() => setFill(f)} />)}</Row>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><Row>{CATS.map((c) => <Pill key={c} label={c} active={cats.includes(c)} color={col} onPress={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])} />)}</Row></ScrollView>
            {mode === 'stock' && <Row style={{ gap: 6 }}>{[300, 800, 1500, 3000].map((g) => <Pill key={g} label={`ca. ${g >= 1000 ? `${g / 1000} kg` : `${g} g`}`} active={grams === g} color={col} onPress={() => setGrams(g)} />)}</Row>}
            <Row style={{ gap: 8 }}>
              <Button label={photo ? 'Foto ✓' : 'Foto (ohne EXIF)'} color={col} variant="soft" onPress={Platform.OS === 'web' ? () => setPhoto('demo') : pickPhoto} style={{ flex: 1, paddingVertical: 12 }} />
              <Button label="Senden" color={col} onPress={mode === 'report' ? submitReport : submitStock} style={{ flex: 1, paddingVertical: 12 }} />
            </Row>
            <Row style={{ gap: 6 }}><StatusBadge status={photo ? 'schwach plausibel' : 'selbst angegeben'} small /><Text style={T.small}>{photo ? 'Foto + Standort: ×0,4' : 'Ohne Foto: ×0,3'}</Text></Row>
            <Button label="Abbrechen" variant="ghost" color={C.muted} onPress={() => setMode('view')} style={{ paddingVertical: 10 }} />
          </Card>
        </Appear>
      )}

      {mode === 'pickup' && (
        <Appear>
          <Card style={{ marginTop: 14, gap: 12 }}>
            <Text style={T.h3}>Abholung erfassen</Text>
            <Text style={T.body}>Die Abholung wird in der foodsharing-API gebucht (POST /pickups). Menge ist eine Schätzung für den Impact.</Text>
            <Row style={{ gap: 6 }}>{[300, 800, 1500, 3000].map((g) => <Pill key={g} label={`ca. ${g >= 1000 ? `${g / 1000} kg` : `${g} g`}`} active={grams === g} color={col} onPress={() => setGrams(g)} />)}</Row>
            <Button label={busy ? 'Buche…' : 'In API erfassen'} color={col} onPress={submitPickup} disabled={busy} />
            <Button label="Abbrechen" variant="ghost" color={C.muted} onPress={() => setMode('view')} style={{ paddingVertical: 10 }} />
          </Card>
        </Appear>
      )}

      <Card style={{ marginTop: S.xl }}>
        <Text style={T.label}>Datenherkunft</Text>
        <Text style={[T.body, { marginTop: 4 }]}>Name und Koordinaten: <Text style={{ fontWeight: '800' }}>GET /food-share-points</Text>. Beschreibung, Adresse, Öffnungszeiten sind in der API nicht hinterlegt und werden hier nicht erfunden. Regal-Status: Nutzereingaben mit Zeitstempel.</Text>
      </Card>
    </Screen>
  );
}
