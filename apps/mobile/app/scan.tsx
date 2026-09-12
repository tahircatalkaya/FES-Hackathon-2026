import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Button, Card, FeeText, T, Row, haptic, StatusBadge, Divider } from '@/components/ui';
import { C, CONTEXT } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { CLEANUPS } from '@/data/mock';
import ProofScanner from '@/components/ProofScanner';
import BorrowScanner from '@/components/BorrowScanner';
import CleanupProof from '@/components/CleanupProof';
import TrustAccount from '@/components/TrustAccount';
import { syncReuse } from '@/components/ReuseInventory';
import { trust, reuseTrust } from '@/api/trust';
import { scheduleReturnReminder } from '@/api/notify';
import { parseContainerCode, demoContainerCode } from '@/api/vytal';
import { fmtDue, loanStatus, LOAN_SOURCE, LOAN_TERMS } from '@/engine/loan';
import { parseTag } from '@/api/nfc';
import { useLocation } from '@/hooks/useLocation';
import NfcSheet from '@/components/NfcSheet';
import VytalMark from '@/components/VytalMark';
import { hav } from '@/api/foodsharing';
import { photoFingerprint } from '@/api/photohash';
import { checkLitterProof, PROOF, type LitterVerdict } from '@/engine/litterproof';

type Mode = 'ride' | 'peer' | 'vytal' | 'vytal-return' | 'food-handover' | 'litter';
const TITLES: Record<Mode, { title: string; sub: string; ctx: keyof typeof CONTEXT; hint: string }> = {
  ride: { title: 'Fahrzeug-Code scannen', sub: 'QR-Code am Türbereich', ctx: 'mobility', hint: 'Der Code am Türbereich bestätigt deine Fahrt. Die Punkte gibt es beim Check-in.' },
  peer: { title: 'Gegenseitig bestätigen', sub: 'Code vom Display einer anderen Person', ctx: 'clean', hint: 'Ihr bestätigt euch gegenseitig vor Ort.' },
  vytal: { title: 'Mehrweg-Behälter', sub: 'Code auf dem Behälter', ctx: 'reuse', hint: `Ausleihe erfassen. Beim Zurückbringen gibt es die Punkte. ${LOAN_TERMS}` },
  'vytal-return': {title:'Rückgabe-QR scannen',sub:'Frischer Code vom Personal',ctx:'reuse',hint:`Gib den Behälter ab. Das Personal stellt danach einen einmaligen Rückgabe-QR für genau diesen Behälter aus. ${LOAN_TERMS}`},
  'food-handover': {title:'Abholcode scannen',sub:'Code vom Handy der verteilenden Person',ctx:'food',hint:'Prüfe die vereinbarte Portion. Scanne den persönlichen QR-Code und bestätige erst, wenn du sie erhalten hast.'},
  litter: { title: 'Müll aufgehoben', sub: 'Vorher/Nachher-Nachweis', ctx: 'clean', hint: 'Der Nachweis dokumentiert deine Aktion. Es gibt keine Punkte je Müllstück.' },
};

export default function Scan() {
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string; proof?: string }>();
  if(p.mode==='vytal')return <BorrowScanner/>;
  if(p.mode==='peer')return <CleanupProof key={`${p.cleanup}:${p.proof}`} id={p.cleanup||''} initialProof={p.proof||''}/>;
  if (!p.mode || !(p.mode in TITLES)) return <Chooser />;
  if(p.mode==='food-handover'||p.mode==='vytal-return')return <ProofScanner key={`${p.mode}:${p.id}`} kind={p.mode==='food-handover'?'food':'return'} id={p.id||''}/>;
  if(p.mode==='litter')return <LitterProofScreen />;
  return <ScanInner key={`${p.mode}:${p.id??''}`} />;
}

function Chooser() {
  const rt = useT();
  const localize = useLocalize();
  const router = useRouter();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('home'); }, []);
  const items: { mode: Mode; icon: string; t: string; s: string; href?: string }[] = [
    { mode: 'peer', icon:'people', t:rt('updates.scanPeer'), s:rt('updates.cleanupScanHint') },
    { mode: 'ride', icon: 'train', t: 'Bus & Bahn', s: 'Am Terminal einchecken', href: '/fahrt?nfc=1' },
    { mode: 'vytal', icon: 'cafe', t: 'Mehrweg-Behälter', s: 'Code auf dem Behälter scannen' },
    { mode: 'food-handover', icon:'basket', t:'Lebensmittel übergeben', s:'Abholung & persönlichen QR-Code öffnen', href:'/uebergaben?mine=1' },
  ];
  return (
    <Screen tabBar={false}>
      <Header title={rt('routes.scan')} subtitle={rt('routes.what_is_in_front_of_you')} />
      <Button label="Regal, Verteiler oder Restaurant scannen" icon="qr-code" color={C.food} onPress={()=>router.push('/ort-scannen')} style={{marginBottom:14}}/>
      <View style={{ gap: 10 }}>
        {items.map((it, i) => (
          <Card key={it.mode} onPress={() => router.replace((it.href ?? `/scan?mode=${it.mode}`) as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {it.mode === 'vytal'
              ? <VytalMark size={52} radius={16} />
              : <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: CONTEXT[TITLES[it.mode].ctx].color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={it.icon as any} size={26} color="#fff" /></View>}
            <View style={{ flex: 1 }}><Text style={T.h3}>{localize(it.t)}</Text><Text style={T.small}>{localize(it.s)}</Text></View>
            <Text style={{ color: C.muted, fontWeight: '900', fontSize: 18 }}>›</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function ScanInner() {
  const rt = useT();
  const localize = useLocalize();
  const router = useRouter();
  const p = useLocalSearchParams<{ mode?: string; id?: string; cleanup?: string; store?: string; proof?: string }>();
  const mode = ((p.mode as Mode) ?? 'ride');
  const cfg = TITLES[mode];
  const color = CONTEXT[cfg.ctx].color;
  const [perm, requestPerm] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const lock = useRef(false);
  const [signed,setSigned]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const needsAccount=mode==='vytal';
  async function loadAccount(){try{setSigned(await trust.hasSession());}catch(e:any){setSigned(false);setError(e.message);}}
  useEffect(()=>{if(needsAccount)void loadAccount();},[mode,p.id]);

  const { addAward } = useStore();
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
      case 'vytal': {
        const c=parseContainerCode(raw);if(!c)throw new Error('Kein gültiger Behälter-Code. Bitte den Code auf Becher oder Schale verwenden.');
        const l=await reuseTrust.borrow({code:c.code,kind:c.kind,storeId:p.store,demo});
        await syncReuse();await scheduleReturnReminder(l.id,l.code,l.borrowedAt);
        setDone(rt('routes.value_value_recorded_valuethe_return_counts_only_after_staff_acce', { p1: rt(c.kind === 'cup' ? 'components.common.cup' : 'components.common.bowl'), p2: c.code, p3: l.demo ? rt('routes.demo_without_points') : '' }));break;
      }
    }
    haptic('success');
    } catch(e:any) {setError(e.message);haptic('warn');}
    finally {lock.current=false;setBusy(false);}
  }

  if(needsAccount&&signed!==true)return <Screen tabBar={false}><Header title={localize(cfg.title)}/>{signed===null?<Text>{rt('routes.loading_account')}</Text>:<TrustAccount color={color} onReady={()=>void loadAccount()}/>}</Screen>;
  const cameraOk = Platform.OS !== 'web' && perm?.granted && !done && !busy && mode !== 'litter';

  return (
    <Screen tabBar={false}>
      <Header title={localize(cfg.title)} subtitle={localize(cfg.sub)} color={color} />
      {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger,marginBottom:12}]}>{localize(error)}</Text>}
      {cameraOk ? (
        <View style={{ height: 320, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={(e) => void handle(e.data)} />
          <View style={{ position: 'absolute', left: '15%', right: '15%', top: '15%', bottom: '15%', borderWidth: 3, borderColor: color, borderRadius: 24 }} />
        </View>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Chameleon pose={done ? 'thumbs' : mode === 'vytal' ? 'coffee' : mode === 'ride' ? 'run' : 'leaf'} size={140} />
          <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>{done ?? (mode === 'litter' ? rt('routes.tap_below_when_you_have_picked_up_and_properly_disposed_of_litter') : Platform.OS === 'web' ? rt('routes.camera_scanning_works_on_your_phone_you_can_also_enter_the_text_c') : rt('routes.camera_permission_is_missing_you_can_enter_the_text_code'))}</Text>
        </Card>
      )}
      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>{rt('routes.good_to_know')}</Text>
        <FeeText text={localize(cfg.hint)} style={[T.body, { marginTop: 4 }]} />
        {mode === 'vytal' && <Text style={[T.small, { marginTop: 6 }]}>{LOAN_SOURCE}</Text>}
      </Card>
      {!done && (
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Text style={T.label}>{rt('routes.enter_code_manually')}</Text>
          <TextInput accessibilityLabel={rt('routes.qr_or_text_code')} value={manual} onChangeText={setManual} onSubmitEditing={()=>{if(manual.trim())void handle(manual);}} returnKeyType="done" autoCorrect={false} placeholder={mode === 'ride' ? rt('components.scan.rideExample') : mode === 'vytal' ? rt('routes.eg_b7k2m9qx') : rt('components.scan.code')} placeholderTextColor={C.muted} autoCapitalize={mode==='vytal'?'characters':'none'} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, fontWeight: '700', color: C.ink }} />
          <Row style={{ gap: 8 }}>
            <Button label={rt('routes.check')} color={color} disabled={busy||!manual.trim()} onPress={() => void handle(manual)} style={{ flex: 1, paddingVertical: 12 }} />
            <Button label={rt('routes.demo_code')} color={color} variant="soft" style={{ flex: 1, paddingVertical: 12 }} onPress={() => handle(mode === 'vytal' ? demoContainerCode() : mode === 'ride' ? 'U4|4711' : 'PEER-7F3K2Q',true)} />
          </Row>
        </Card>
      )}

      {done && <View style={{ marginTop: 14 }}><Button label={rt('routes.done_2')} color={color} onPress={() => mode==='vytal'?router.replace('/mehrweg'):(router.canGoBack()?router.back():router.replace('/(tabs)/handeln'))} /></View>}
    </Screen>
  );
}

/* ------------------------------------------------------------------ Müll aufgehoben */

/**
 * Vorher/Nachher-Nachweis. Punkte gibt es bewusst keine: ein Punkt je Müllstück
 * würde zum Sammeln statt zum Vermeiden verleiten. Geprüft wird trotzdem streng,
 * als lokale Plausibilitätsprüfung. Eine externe FES-Bestätigung ist das nicht.
 */
function LitterProofScreen() {
  const rt = useT();
  const localize = useLocalize();
  const router = useRouter();
  const color = CONTEXT.clean.color;
  const { addAward, thankLitter, litterProof, startLitterProof, finishLitterProof, cancelLitterProof, photoHashes } = useStore();
  const { setCtx } = useUI();
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
    const at = Date.now();
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error('Für den Ortsnachweis braucht jedes Foto eine aktuelle Standortfreigabe.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Standort nicht rechtzeitig verfügbar. Bitte erneut versuchen.')), 20000); }),
      ]);
      const { latitude: lat, longitude: lon, accuracy } = location.coords;
      if (accuracy == null || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > PROOF.geofenceM || Math.abs(Date.now() - location.timestamp) > 60000) {
        throw new Error('Standort noch zu ungenau. Bitte draußen kurz warten und erneut aufnehmen.');
      }
      return { at, lat, lon, accuracy, ...fp };
    } finally { if (timer) clearTimeout(timer); }
  }

  async function vorher() {
    setBusy(true); setFehler(null);
    try {
      const shot = await shoot();
      if (!shot) return;
      if (photoHashes.some((h) => h === shot.hash)) { setFehler('Dieses Foto wurde schon einmal eingereicht.'); return; }
      startLitterProof(shot); haptic();
    } catch (e: any) { setFehler(e?.message || 'Aufnahme konnte nicht geprüft werden. Bitte erneut versuchen.'); } finally { setBusy(false); }
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
    } catch (e: any) { setFehler(e?.message || 'Aufnahme konnte nicht geprüft werden. Bitte erneut versuchen.'); } finally { setBusy(false); }
  }

  const wartezeit = litterProof ? (Date.now() - litterProof.at) / 60000 : 0;
  const bereit = wartezeit >= PROOF.minMinutes;
  const abgelaufen = wartezeit > PROOF.maxMinutes;

  return (
    <Screen tabBar={false}>
      <Header title={rt('routes.litter_picked_up')} subtitle={rt('routes.beforeafter_evidence')} color={color} />

      <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Chameleon pose={verdict?.ok ? 'thumbs' : litterProof ? 'think' : 'leaf'} size={132} />
        <Text style={[T.body, { textAlign: 'center', marginTop: 8 }]}>
          {verdict?.ok
            ? rt('routes.plausibly_documented_thank_you_your_entry_is_saved_in_mainsam')
            : litterProof
              ? abgelaufen
                ? rt('routes.the_valueminute_time_window_has_ended_please_start_again', { p1: PROOF.maxMinutes })
                : bereit
                  ? rt('routes.now_take_the_after_photo_of_the_same_spot')
                  : rt('routes.value_min_left_before_the_after_photo', { p1: Math.max(1, Math.ceil(PROOF.minMinutes - wartezeit)) })
              : rt('routes.first_photograph_the_spot_then_clean_up_then_photograph_the_same_')}
        </Text>
      </Card>

      {fehler && <Card style={{ marginTop: 12, borderLeftWidth: 5, borderLeftColor: C.danger }}><Text style={T.body}>{localize(fehler)}</Text></Card>}

      {verdict && (
        <Card style={{ marginTop: 12, borderLeftWidth: 5, borderLeftColor: verdict.ok ? C.success : C.danger }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={T.h3}>{verdict.ok ? rt('routes.evidence_requirements_met') : rt('routes.evidence_requirements_not_met')}</Text>
            <StatusBadge status={verdict.status} small />
          </Row>
          <Divider />
          {verdict.reasons.map((r, i) => <Text key={i} style={[T.body, { marginTop: 3 }]}>• {localize(r)}</Text>)}
          {verdict.ok && <Text style={[T.small, { marginTop: 8 }]}>{rt('routes.no_points_are_awarded_a_point_per_piece_of_litter_would_encourage')}</Text>}
        </Card>
      )}

      {!verdict?.ok && (
        <View style={{ marginTop: 14, gap: 10 }}>
          {!litterProof ? (
            <Button label={busy ? rt('routes.one_moment') : rt('routes.take_before_photo')} icon="📷" color={color} disabled={busy} onPress={vorher} />
          ) : (
            <>
              <Button label={busy ? rt('routes.one_moment') : rt('routes.take_after_photo')} icon="📷" color={color} disabled={busy || !bereit || abgelaufen} onPress={nachher} />
              <Button label={rt('routes.cancel')} variant="ghost" color={C.ink} onPress={() => { cancelLitterProof(); setVerdict(null); setFehler(null); }} />
            </>
          )}
        </View>
      )}

      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>{rt('routes.how_your_evidence_is_checked')}</Text>
        <Text style={[T.body, { marginTop: 4 }]}>{rt('routes.an_i_picked_something_up_button_could_be_pressed_endlessly_only_v')}</Text>
        <Text style={[T.body, { marginTop: 6 }]}>{rt('routes.value_to_value_minutes_between_photos', { p1: PROOF.minMinutes, p2: PROOF.maxMinutes })}</Text>
        <Text style={T.body}>{rt('routes.fresh_location_for_each_photo_both_within_value_m', { p1: PROOF.geofenceM })}</Text>
        <Text style={T.body}>{rt('routes.two_different_photos_directly_from_the_camera')}</Text>
        <Text style={T.body}>{rt('routes.no_previously_submitted_photos')}</Text>
        <Text style={[T.small, { marginTop: 8 }]}>{rt('routes.local_plausibility_check_no_external_fes_confirmation_in_a_browse')}</Text>
      </Card>

      {verdict?.ok && (
        <View style={{ marginTop: 14 }}>
          <Button label={rt('routes.done_2')} color={color} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/handeln'))} />
        </View>
      )}
    </Screen>
  );
}
