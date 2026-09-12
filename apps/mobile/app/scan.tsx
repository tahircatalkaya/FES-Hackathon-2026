import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Button, Card, T, Row, haptic } from '@/components/ui';
import { C, CONTEXT } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { BINS, CLEANUPS } from '@/data/mock';
import ProofScanner from '@/components/ProofScanner';
import TrustAccount from '@/components/TrustAccount';
import { syncReuse } from '@/components/ReuseInventory';
import { trust, reuseTrust } from '@/api/trust';
import { scheduleReturnReminder } from '@/api/notify';
import { parseContainerCode, demoContainerCode } from '@/api/vytal';
import { parseTag } from '@/api/nfc';
import { useLocation } from '@/hooks/useLocation';
import NfcSheet from '@/components/NfcSheet';
import { hav } from '@/api/foodsharing';

type Mode = 'ride' | 'bin' | 'peer' | 'vytal' | 'vytal-return' | 'food-handover' | 'litter';
const TITLES: Record<Mode, { title: string; sub: string; ctx: keyof typeof CONTEXT; hint: string }> = {
  ride: { title: 'Fahrzeug-Code scannen', sub: 'QR-Code am Türbereich', ctx: 'mobility', hint: 'Der Code am Türbereich bestätigt deine Fahrt. Die Punkte gibt es beim Check-in.' },
  bin: { title: 'FES-Behälter', sub: 'NFC/QR am Papierkorb oder Container', ctx: 'clean', hint: 'Richtig entsorgt am FES-Behälter: 5 Punkte, bis zu dreimal am Tag.' },
  peer: { title: 'Gegenseitig bestätigen', sub: 'Code vom Display einer anderen Person', ctx: 'clean', hint: 'Ihr bestätigt euch gegenseitig vor Ort.' },
  vytal: { title: 'Vytal-Behälter', sub: 'Code auf Schale oder Becher', ctx: 'reuse', hint: 'Ausleihe erfassen. Beim Zurückbringen gibt es die Punkte.' },
  'vytal-return': {title:'Rückgabe-QR scannen',sub:'Frischer Code vom Personal',ctx:'reuse',hint:'Gib den Behälter ab. Das Personal stellt danach einen einmaligen Rückgabe-QR für genau diesen Behälter aus.'},
  'food-handover': {title:'Abholcode scannen',sub:'Code vom Handy der abholenden Person',ctx:'food',hint:'Prüfe die vereinbarte Portion. Scanne den persönlichen QR-Code und bestätige erst, wenn du sie übergeben hast.'},
  litter: { title: 'Müll aufgehoben', sub: 'Danke, ohne Punkte', ctx: 'clean', hint: 'Dafür gibt es keine Punkte, aber ein Dankeschön von Kai.' },
};

export default function Scan() {
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string }>();
  if (!p.mode || !(p.mode in TITLES)) return <Chooser />;
  if(p.mode==='food-handover'||p.mode==='vytal-return')return <ProofScanner key={`${p.mode}:${p.id}`} kind={p.mode==='food-handover'?'food':'return'} id={p.id||''}/>;
  return <ScanInner key={`${p.mode}:${p.id??''}`} />;
}

function Chooser() {
  const router = useRouter();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('home'); }, []);
  const items: { mode: Mode; icon: string; t: string; s: string; href?: string }[] = [
    { mode: 'ride', icon: 'train', t: 'Bus & Bahn', s: 'Am Terminal einchecken', href: '/fahrt?nfc=1' },
    { mode: 'vytal', icon: 'cafe', t: 'Mehrweg-Schale', s: 'Code auf der Schale scannen' },
    { mode: 'vytal-return', icon: 'return-down-back', t: 'Mehrweg zurückgeben', s: 'Rückgabe-QR vom Personal scannen', href:'/rueckgabe' },
    { mode: 'food-handover', icon:'basket', t:'Lebensmittel übergeben', s:'Abholung & persönlichen QR-Code öffnen', href:'/uebergaben?mine=1' },
    { mode: 'bin', icon: 'trash', t: 'FES-Behälter', s: 'Aufkleber am Papierkorb antippen' },
    { mode: 'peer', icon: 'people', t: 'Clean-up-Partner', s: 'Code vom anderen Handy scannen' },
    { mode: 'litter', icon: 'heart', t: 'Müll aufgehoben', s: 'Danke sagen' },
  ];
  return (
    <Screen tabBar={false}>
      <Header title="Scannen" subtitle="Was hast du vor dir?" />
      <View style={{ gap: 10 }}>
        {items.map((it, i) => (
          <Card key={it.mode} onPress={() => router.replace((it.href ?? `/scan?mode=${it.mode}`) as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: CONTEXT[TITLES[it.mode].ctx].color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={it.icon as any} size={26} color="#fff" /></View>
            <View style={{ flex: 1 }}><Text style={T.h3}>{it.t}</Text><Text style={T.small}>{it.s}</Text></View>
            <Text style={{ color: C.muted, fontWeight: '900', fontSize: 18 }}>›</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function ScanInner() {
  const router = useRouter();
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string }>();
  const mode = ((p.mode as Mode) ?? 'ride');
  const cfg = TITLES[mode];
  const color = CONTEXT[cfg.ctx].color;
  const [perm, requestPerm] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [nfcOpen, setNfcOpen] = useState(false);
  const lock = useRef(false);
  const [signed,setSigned]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const needsAccount=mode==='vytal';
  async function loadAccount(){try{setSigned(await trust.hasSession());}catch(e:any){setError(e.message);}}
  useEffect(()=>{if(needsAccount)void loadAccount();},[mode,p.id]);

  const { addAward, attest, thankLitter, nfcSeen } = useStore();
  const { setCtx, showToast } = useUI();
  const { loc } = useLocation();

  useEffect(() => { setCtx(cfg.ctx); if (Platform.OS !== 'web' && !perm?.granted) requestPerm(); }, [mode]);

  async function handle(raw: string, demo=false) {
    if (lock.current||done) return; lock.current = true; setError('');setBusy(true);
    try {
    switch (mode) {
      case 'ride': {
        const t = parseTag(raw) ?? { line: raw.slice(0, 3).toUpperCase(), vehicle: raw };
        router.replace(`/fahrt?tag=${encodeURIComponent(t.line)}`); return;
      }
      case 'bin': {
        const bin = BINS.find((b) => raw.includes(b.id)) ?? BINS.find((b) => b.id === p.id) ?? BINS[0];
        const d = hav(loc.lat, loc.lon, bin.lat, bin.lon);
        const a = addAward({ type: 'clean.bin_checkin', partner: 'fes', status: d < 150 ? 'bestätigt' : 'schwach plausibel', key: `bin:${bin.id}:${Math.floor(Date.now() / 3600e3)}`, at: Date.now(), title: `${bin.kind} ${bin.label}`, meta: { source: 'nfc/qr', evidence: [`Behälter ${bin.id} registriert`, d < 150 ? `Standort ${Math.round(d)} m vom Behälter entfernt` : `Standort ${Math.round(d)} m entfernt, Geofence nicht erfüllt`] } });
        showToast(a); setDone(`${bin.kind} ${bin.label} erfasst.`); break;
      }
      case 'peer': {
        const cu = CLEANUPS.find((c) => c.id === p.cleanup) ?? CLEANUPS[0];
        const peer = raw.replace(/[^A-Za-z0-9]/g, '').slice(-6) || 'PEER';
        attest(cu.id, peer); setDone(`Bestätigung von ${peer} für „${cu.title}“ gespeichert.`); break;
      }
      case 'vytal': {
        const c=parseContainerCode(raw);if(!c)throw new Error('Kein gültiger Behälter-Code. Bitte den Code auf Becher oder Schale verwenden.');
        const l=await reuseTrust.borrow({code:c.code,kind:c.kind,storeId:p.store,demo});
        await syncReuse();await scheduleReturnReminder(l.id,l.code,l.borrowedAt);
        setDone(`${c.kind==='cup'?'Becher':'Schale'} ${c.code} erfasst. ${l.demo?'Demo ohne Punkte. ':''}Die Rückgabe zählt erst nach Annahme durch das Personal und deinem Scan des Rückgabebelegs.`);break;
      }
      case 'litter': {
        thankLitter();
        const a = addAward({ type: 'clean.litter_solo', partner: 'fes', status: 'selbst angegeben', key: `litter:${Date.now()}`, at: Date.now(), title: 'Müll aufgehoben', meta: { source: 'user' } });
        showToast(a); setDone('Danke! Kai hat sich gefreut. Für Punkte: bei einer Clean-up-Aktion mitmachen.'); break;
      }
    }
    haptic('success');
    } catch(e:any) {setError(e.message);haptic('warn');}
    finally {lock.current=false;setBusy(false);}
  }

  if(needsAccount&&signed!==true)return <Screen tabBar={false}><Header title={cfg.title}/>{signed===null?<Text>Lade Zugang…</Text>:<TrustAccount color={color} onReady={()=>void loadAccount()}/>}</Screen>;
  const cameraOk = Platform.OS !== 'web' && perm?.granted && !done && !busy && mode !== 'litter';

  return (
    <Screen tabBar={false}>
      <Header title={cfg.title} subtitle={cfg.sub} color={color} />
      {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger,marginBottom:12}]}>{error}</Text>}
      {cameraOk ? (
        <View style={{ height: 320, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={(e) => void handle(e.data)} />
          <View style={{ position: 'absolute', left: '15%', right: '15%', top: '15%', bottom: '15%', borderWidth: 3, borderColor: color, borderRadius: 24 }} />
        </View>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Chameleon pose={done ? 'thumbs' : mode === 'vytal' ? 'coffee' : mode === 'ride' ? 'run' : 'leaf'} size={140} />
          <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>{done ?? (mode === 'litter' ? 'Tippe unten, wenn du etwas aufgehoben und richtig entsorgt hast.' : Platform.OS === 'web' ? 'Kamera-Scan läuft auf dem Handy. Alternativ kannst du den Textcode eingeben.' : 'Kamera-Freigabe fehlt. Du kannst den Textcode eingeben.')}</Text>
        </Card>
      )}
      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>Gut zu wissen</Text>
        <Text style={[T.body, { marginTop: 4 }]}>{cfg.hint}</Text>
      </Card>
      {!done && mode !== 'litter' && (
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Text style={T.label}>Code manuell</Text>
          <TextInput accessibilityLabel="QR- oder Textcode" value={manual} onChangeText={setManual} onSubmitEditing={()=>{if(manual.trim())void handle(manual);}} returnKeyType="done" autoCorrect={false} placeholder={mode === 'ride' ? 'z. B. U4|1234' : mode === 'vytal' ? 'z. B. B7K2M9QX' : 'Code'} placeholderTextColor={C.muted} autoCapitalize={mode==='vytal'?'characters':'none'} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, fontWeight: '700', color: C.ink }} />
          <Row style={{ gap: 8 }}>
            <Button label="Prüfen" color={color} disabled={busy||!manual.trim()} onPress={() => void handle(manual)} style={{ flex: 1, paddingVertical: 12 }} />
            {mode === 'bin' ? <Button label="NFC antippen" icon="radio" color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => setNfcOpen(true)} /> : <Button label="Demo-Code" color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => handle(mode === 'vytal' ? demoContainerCode() : mode === 'ride' ? 'U4|4711' : 'PEER-7F3K2Q',true)} />}
          </Row>
        </Card>
      )}
      <NfcSheet open={nfcOpen} onClose={() => setNfcOpen(false)} onRead={(t) => handle(p.id ?? t.raw)} color={color} title="Handy an den Behälter halten" label="Der Tag sitzt am FES-Aufkleber des Behälters. Hier simuliert." />
      {mode === 'litter' && !done && <View style={{ marginTop: 14 }}><Button label="Ja, aufgehoben und entsorgt" color={color} icon="checkmark-circle" onPress={() => handle('litter')} /></View>}
      {done && <View style={{ marginTop: 14 }}><Button label="Fertig" color={color} onPress={() => mode==='vytal'?router.replace('/mehrweg'):(router.canGoBack()?router.back():router.replace('/(tabs)/handeln'))} /></View>}
      {mode === 'bin' && nfcSeen.length > 0 && <Text style={[T.small, { marginTop: 10 }]}>Zuletzt gelesene Tags: {nfcSeen.slice(-3).join(', ')}</Text>}
    </Screen>
  );
}
