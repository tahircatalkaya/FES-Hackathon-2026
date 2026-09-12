import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Button, Card, T, Tag, Row, haptic, StatusBadge, Divider } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { BINS, CLEANUPS } from '@/data/mock';
import { parseContainerCode, demoContainerCode } from '@/api/vytal';
import { parseTag } from '@/api/nfc';
import { useLocation } from '@/hooks/useLocation';
import NfcSheet from '@/components/NfcSheet';
import VytalMark from '@/components/VytalMark';
import { hav } from '@/api/foodsharing';
import { photoFingerprint } from '@/api/photohash';
import { checkLitterProof, PROOF, type LitterVerdict } from '@/engine/litterproof';

type Mode = 'ride' | 'bin' | 'peer' | 'vytal' | 'litter';
const TITLES: Record<Mode, { title: string; sub: string; ctx: keyof typeof CONTEXT; hint: string }> = {
  ride: { title: 'Fahrzeug-Code scannen', sub: 'QR-Code am Türbereich', ctx: 'mobility', hint: 'Der Code am Türbereich bestätigt deine Fahrt. Die Punkte gibt es beim Check-in.' },
  bin: { title: 'FES-Behälter', sub: 'NFC/QR am Papierkorb oder Container', ctx: 'clean', hint: 'Richtig entsorgt am FES-Behälter: 5 Punkte, bis zu dreimal am Tag.' },
  peer: { title: 'Gegenseitig bestätigen', sub: 'Code vom Display einer anderen Person', ctx: 'clean', hint: 'Ihr bestätigt euch gegenseitig vor Ort.' },
  vytal: { title: 'Mehrweg-Behälter', sub: 'Code auf dem Behälter', ctx: 'reuse', hint: 'Ausleihe erfassen. Beim Zurückbringen gibt es die Punkte.' },
  litter: { title: 'Müll aufgehoben', sub: 'Vorher/Nachher-Nachweis', ctx: 'clean', hint: 'Kein Punkt je Müllstück, das wäre nicht prüfbar und würde zum Sammeln verleiten. Der Nachweis zählt für die Statistik und für FES.' },
};

export default function Scan() {
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string }>();
  if (!p.mode) return <Chooser />;
  if (p.mode === 'litter') return <LitterProofScreen />;
  return <ScanInner />;
}

function Chooser() {
  const router = useRouter();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('home'); }, []);
  const items: { mode: Mode; icon: string; t: string; s: string; href?: string }[] = [
    { mode: 'ride', icon: 'train', t: 'Bus & Bahn', s: 'Am Terminal einchecken', href: '/fahrt?nfc=1' },
    { mode: 'vytal', icon: 'cafe', t: 'Mehrweg-Behälter', s: 'Code auf dem Behälter scannen' },
    { mode: 'litter', icon: 'camera', t: 'Müll aufgehoben', s: 'Vorher/Nachher belegen' },
  ];
  return (
    <Screen tabBar={false}>
      <Header title="Scannen" subtitle="Was hast du vor dir?" />
      <View style={{ gap: 10 }}>
        {items.map((it, i) => (
          <Card key={it.mode} onPress={() => router.replace((it.href ?? `/scan?mode=${it.mode}`) as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {it.mode === 'vytal'
              ? <VytalMark size={52} radius={16} />
              : <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: CONTEXT[TITLES[it.mode].ctx].color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={it.icon as any} size={26} color="#fff" /></View>}
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
  const { addAward, addContainer, attest, nfcSeen } = useStore();
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
    }
    setTimeout(() => (lock.current = false), 1500);
  }

  const cameraOk = Platform.OS !== 'web' && perm?.granted && !done;

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
          <Chameleon pose={done ? 'thumbs' : mode === 'vytal' ? 'coffee' : mode === 'ride' ? 'run' : 'leaf'} size={140} />
          <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>{done ?? (Platform.OS === 'web' ? 'Kamera-Scan läuft auf dem Handy. Hier: Code eingeben oder Demo.' : 'Kamera-Freigabe fehlt. Code eingeben oder Demo.')}</Text>
        </Card>
      )}
      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>Gut zu wissen</Text>
        <Text style={[T.body, { marginTop: 4 }]}>{cfg.hint}</Text>
      </Card>
      {!done && (
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Text style={T.label}>Code manuell</Text>
          <TextInput value={manual} onChangeText={setManual} placeholder={mode === 'ride' ? 'z. B. U4|1234' : mode === 'vytal' ? 'z. B. B7K2M9QX' : 'Code'} placeholderTextColor={C.muted} autoCapitalize="characters" style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, fontWeight: '700', color: C.ink }} />
          <Row style={{ gap: 8 }}>
            <Button label="Prüfen" color={color} onPress={() => manual && handle(manual)} style={{ flex: 1, paddingVertical: 12 }} />
            {mode === 'bin' ? <Button label="NFC antippen" icon="📡" color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => setNfcOpen(true)} /> : <Button label="Demo-Code" color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => handle(mode === 'vytal' ? demoContainerCode() : mode === 'ride' ? 'U4|4711' : 'PEER-7F3K2Q')} />}
          </Row>
        </Card>
      )}
      <NfcSheet open={nfcOpen} onClose={() => setNfcOpen(false)} onRead={(t) => handle(p.id ?? t.raw)} color={color} title="Handy an den Behälter halten" label="Der Tag sitzt am FES-Aufkleber des Behälters. Hier simuliert." />
      {done && <View style={{ marginTop: 14 }}><Button label="Fertig" color={color} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/handeln'))} /></View>}
      {mode === 'bin' && nfcSeen.length > 0 && <Text style={[T.small, { marginTop: 10 }]}>Zuletzt gelesene Tags: {nfcSeen.slice(-3).join(', ')}</Text>}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Müll aufgehoben */

/**
 * Vorher/Nachher-Nachweis. Punkte gibt es bewusst keine: ein Punkt je Müllstück
 * würde zum Sammeln statt zum Vermeiden verleiten. Geprüft wird trotzdem streng,
 * damit der Eintrag als Beleg taugt und nicht erfunden werden kann.
 */
function LitterProofScreen() {
  const router = useRouter();
  const color = CONTEXT.clean.color;
  const { addAward, thankLitter, litterProof, startLitterProof, finishLitterProof, cancelLitterProof, photoHashes } = useStore();
  const { setCtx } = useUI();
  const { loc } = useLocation();
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<LitterVerdict | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => { setCtx('clean'); }, []);
  // Die Wartezeit soll sichtbar laufen, sonst weiß niemand, wann das Nachher-Foto dran ist.
  useEffect(() => { const i = setInterval(() => setTick((t) => t + 1), 20000); return () => clearInterval(i); }, []);

  /** Immer die Kamera, nie die Galerie: ein altes Bild aus der Mediathek wäre kein Beleg. */
  async function shoot() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setFehler('Ohne Kamera-Freigabe gibt es keinen Nachweis.'); return null; }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true, exif: false });
    if (r.canceled || !r.assets?.[0]) return null;
    const a = r.assets[0];
    const fp = await photoFingerprint(a.uri, a.base64 ?? undefined);
    return { at: Date.now(), lat: loc.lat, lon: loc.lon, ...fp };
  }

  async function vorher() {
    setBusy(true); setFehler(null);
    try {
      const shot = await shoot();
      if (!shot) return;
      if (photoHashes.some((h) => h === shot.hash)) { setFehler('Dieses Foto wurde schon einmal eingereicht.'); return; }
      startLitterProof(shot); haptic();
    } finally { setBusy(false); }
  }

  async function nachher() {
    if (!litterProof) return;
    setBusy(true); setFehler(null);
    try {
      const shot = await shoot();
      if (!shot) return;
      const v = checkLitterProof(litterProof, shot, photoHashes);
      setVerdict(v);
      haptic(v.ok ? 'success' : 'warn');
      if (v.ok) {
        thankLitter();
        // Basispunkte für diese Aktion sind 0. Der Nachweis hebt den Status, nicht die Punkte.
        addAward({
          type: 'clean.litter_solo', partner: 'fes', status: v.status,
          key: `litter:${litterProof.hash}:${shot.hash}`, at: Date.now(), title: 'Müll aufgehoben, Vorher/Nachher belegt',
          meta: { source: 'foto+geofence', evidence: v.reasons },
        });
        finishLitterProof([litterProof.hash, shot.hash]);
      }
    } finally { setBusy(false); }
  }

  const wartezeit = litterProof ? (Date.now() - litterProof.at) / 60000 : 0;
  const bereit = wartezeit >= PROOF.minMinutes;
  const abgelaufen = wartezeit > PROOF.maxMinutes;

  return (
    <Screen tabBar={false}>
      <Header title="Müll aufgehoben" subtitle="Vorher/Nachher-Nachweis" color={color} />

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Chameleon pose={verdict?.ok ? 'thumbs' : litterProof ? 'think' : 'leaf'} size={132} />
        <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>
          {verdict?.ok
            ? 'Belegt. Danke, das zählt für die Statistik von FES.'
            : litterProof
              ? abgelaufen
                ? `Das Zeitfenster von ${PROOF.maxMinutes} Minuten ist vorbei. Bitte neu anfangen.`
                : bereit
                  ? 'Jetzt das Nachher-Foto von derselben Stelle.'
                  : `Noch ${Math.max(1, Math.ceil(PROOF.minMinutes - wartezeit))} min, dann ist das Nachher-Foto dran.`
              : 'Erst ein Foto von der Stelle, dann aufräumen, dann dieselbe Stelle noch einmal.'}
        </Text>
      </Card>

      {fehler && <Card style={{ marginTop: 12, borderLeftWidth: 5, borderLeftColor: C.danger }}><Text style={T.body}>{fehler}</Text></Card>}

      {verdict && (
        <Card style={{ marginTop: 12, borderLeftWidth: 5, borderLeftColor: verdict.ok ? C.success : C.danger }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={T.h3}>{verdict.ok ? 'Nachweis erfüllt' : 'Nachweis nicht erfüllt'}</Text>
            <StatusBadge status={verdict.status} small />
          </Row>
          <Divider />
          {verdict.reasons.map((r, i) => <Text key={i} style={[T.body, { marginTop: 3 }]}>• {r}</Text>)}
          {verdict.ok && <Text style={[T.small, { marginTop: 8 }]}>Punkte gibt es dafür keine. Ein Punkt je Müllstück würde zum Sammeln verleiten statt zum Vermeiden.</Text>}
        </Card>
      )}

      {!verdict?.ok && (
        <View style={{ marginTop: 14, gap: 10 }}>
          {!litterProof ? (
            <Button label={busy ? 'Moment …' : 'Vorher-Foto aufnehmen'} icon="📷" color={color} disabled={busy} onPress={vorher} />
          ) : (
            <>
              <Button label={busy ? 'Moment …' : 'Nachher-Foto aufnehmen'} icon="📷" color={color} disabled={busy || !bereit || abgelaufen} onPress={nachher} />
              <Button label="Abbrechen" variant="ghost" color={C.ink} onPress={() => { cancelLitterProof(); setVerdict(null); setFehler(null); }} />
            </>
          )}
        </View>
      )}

      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>Warum so umständlich</Text>
        <Text style={[T.body, { marginTop: 4 }]}>
          Ein Knopf „hab was aufgehoben“ ließe sich beliebig oft drücken. Deshalb zählt nur, was sich prüfen lässt:
        </Text>
        <Text style={[T.body, { marginTop: 6 }]}>• {PROOF.minMinutes} bis {PROOF.maxMinutes} Minuten zwischen den Fotos</Text>
        <Text style={T.body}>• beide Aufnahmen im Umkreis von {PROOF.geofenceM} m</Text>
        <Text style={T.body}>• zwei verschiedene Bilder, direkt aus der Kamera</Text>
        <Text style={T.body}>• kein Foto, das schon einmal eingereicht wurde</Text>
      </Card>

      {verdict?.ok && (
        <View style={{ marginTop: 14 }}>
          <Button label="Fertig" color={color} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/handeln'))} />
        </View>
      )}
    </Screen>
  );
}
