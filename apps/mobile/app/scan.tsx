import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Button, Card, T, Tag, Row, haptic, StatusBadge } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { BINS, CLEANUPS } from '@/data/mock';
import { parseContainerCode, demoContainerCode } from '@/api/vytal';
import { parseTag } from '@/api/nfc';
import { useLocation } from '@/hooks/useLocation';
import { hav } from '@/api/foodsharing';

type Mode = 'ride' | 'bin' | 'peer' | 'vytal' | 'litter';
const TITLES: Record<Mode, { title: string; sub: string; ctx: keyof typeof CONTEXT; hint: string }> = {
  ride: { title: 'Fahrzeug-Code scannen', sub: 'QR-Code am Türbereich', ctx: 'mobility', hint: 'Der Code enthält Linie und Fahrzeugnummer. Er hebt den Nachweis auf „bestätigt“, wenn er zur erkannten Fahrt passt.' },
  bin: { title: 'FES-Behälter', sub: 'NFC/QR am Papierkorb oder Container', ctx: 'clean', hint: 'Registrierter Behälter = fester Ort, an dem etwas endet. 5 Punkte, max. 3 am Tag, 60 min Cooldown je Behälter.' },
  peer: { title: 'Gegenseitig bestätigen', sub: 'Code vom Display einer anderen Person', ctx: 'clean', hint: 'Zwei Personen bestätigen sich gegenseitig vor Ort. Aus der Ferne nicht fälschbar.' },
  vytal: { title: 'Vytal-Behälter', sub: 'Code auf Schale oder Becher', ctx: 'reuse', hint: 'Ausleihe erfassen. Die Rückgabe bestätigt später der Store, genau einmal.' },
  litter: { title: 'Müll aufgehoben', sub: 'Danke, ohne Punkte', ctx: 'clean', hint: 'Ein einzelnes Müllstück ist nicht prüfbar, deshalb gibt es keine Punkte. Anerkennung schon.' },
};

export default function Scan() {
  const router = useRouter();
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string }>();
  const mode = ((p.mode as Mode) ?? 'ride');
  const cfg = TITLES[mode];
  const color = CONTEXT[cfg.ctx].color;
  const [perm, requestPerm] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const lock = useRef(false);
  const { addAward, addContainer, attest, thankLitter, nfcSeen } = useStore();
  const { setCtx, showToast } = useUI();
  const { loc } = useLocation();

  useEffect(() => { setCtx(cfg.ctx); if (Platform.OS !== 'web' && !perm?.granted) requestPerm(); }, [mode]);

  function handle(raw: string) {
    if (lock.current) return; lock.current = true; haptic('success');
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
        const c = parseContainerCode(raw);
        if (!c) { setDone('Kein gültiger Behälter-Code.'); lock.current = false; return; }
        addContainer({ code: c.code, storeId: p.store ?? 'str_demo', storeName: p.store ? 'Vytal-Partner' : 'Demo-Store Hauptwache', borrowedAt: Date.now(), txId: `tx_${Date.now()}`, kind: c.kind });
        setDone(`${c.kind === 'cup' ? 'Becher' : 'Schale'} ${c.code} ausgeliehen. 14 Tage Zeit, +10 Punkte bei Rückgabe in 48 h.`); break;
      }
      case 'litter': {
        thankLitter();
        const a = addAward({ type: 'clean.litter_solo', partner: 'fes', status: 'selbst angegeben', key: `litter:${Date.now()}`, at: Date.now(), title: 'Müll aufgehoben', meta: { source: 'user' } });
        showToast(a); setDone('Danke! Kai hat sich gefreut. Für Punkte: bei einer Clean-up-Aktion mitmachen.'); break;
      }
    }
    setTimeout(() => (lock.current = false), 1500);
  }

  const cameraOk = Platform.OS !== 'web' && perm?.granted && !done && mode !== 'litter';

  return (
    <Screen tabBar={false}>
      <Header title={cfg.title} subtitle={cfg.sub} color={color} />
      {cameraOk ? (
        <View style={{ height: 320, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={(e) => handle(e.data)} />
          <View style={{ position: 'absolute', left: '15%', right: '15%', top: '15%', bottom: '15%', borderWidth: 3, borderColor: color, borderRadius: 24 }} />
        </View>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Chameleon color={color} size={140} mood={done ? 'excited' : 'happy'} />
          <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>{done ?? (mode === 'litter' ? 'Tippe unten, wenn du etwas aufgehoben und richtig entsorgt hast.' : Platform.OS === 'web' ? 'Kamera-Scan läuft auf dem Handy. Hier: Code eingeben oder Demo.' : 'Kamera-Freigabe fehlt. Code eingeben oder Demo.')}</Text>
        </Card>
      )}
      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>Warum so</Text>
        <Text style={[T.body, { marginTop: 4 }]}>{cfg.hint}</Text>
      </Card>
      {!done && mode !== 'litter' && (
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Text style={T.label}>Code manuell</Text>
          <TextInput value={manual} onChangeText={setManual} placeholder={mode === 'ride' ? 'z. B. U4|1234' : mode === 'vytal' ? 'z. B. B7K2M9QX' : 'Code'} placeholderTextColor={C.muted} autoCapitalize="characters" style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, fontWeight: '700', color: C.ink }} />
          <Row style={{ gap: 8 }}>
            <Button label="Prüfen" color={color} onPress={() => manual && handle(manual)} style={{ flex: 1, paddingVertical: 12 }} />
            <Button label="Demo-Code" color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => handle(mode === 'vytal' ? demoContainerCode() : mode === 'ride' ? 'U4|4711' : mode === 'bin' ? (p.id ?? BINS[0].id) : 'PEER-7F3K2Q')} />
          </Row>
        </Card>
      )}
      {mode === 'litter' && !done && <View style={{ marginTop: 14 }}><Button label="Ja, aufgehoben und entsorgt" color={color} icon="🫶" onPress={() => handle('litter')} /></View>}
      {done && <View style={{ marginTop: 14 }}><Button label="Fertig" color={color} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/handeln'))} /></View>}
      {mode === 'bin' && nfcSeen.length > 0 && <Text style={[T.small, { marginTop: 10 }]}>Zuletzt gelesene Tags: {nfcSeen.slice(-3).join(', ')}</Text>}
    </Screen>
  );
}
