import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C, R, S, shadow } from '@/theme';
import { Button, Pill, Row, T, haptic } from './ui';

export interface FoodItem { name: string; qty: string; cat: string; grams: number }
export interface AiResult { items: FoodItem[]; fill: 'leer' | 'wenig' | 'mittel' | 'voll'; grams: number; photo?: string; audio?: string; transcript?: string }

const CATS = ['Backwaren', 'Obst & Gemüse', 'Milchprodukte', 'Konserven', 'Gekochtes', 'Getränke'];
const POOL: FoodItem[] = [
  { name: 'Laugenstangen', qty: '6 Stück', cat: 'Backwaren', grams: 480 },
  { name: 'Vollkornbrot', qty: '1 Laib', cat: 'Backwaren', grams: 750 },
  { name: 'Äpfel', qty: 'ca. 1,2 kg', cat: 'Obst & Gemüse', grams: 1200 },
  { name: 'Möhren', qty: '1 Bund', cat: 'Obst & Gemüse', grams: 500 },
  { name: 'Joghurt 500 g', qty: '3 Becher', cat: 'Milchprodukte', grams: 1500 },
  { name: 'Kichererbsen (Dose)', qty: '2 Dosen', cat: 'Konserven', grams: 800 },
  { name: 'Bananen', qty: '5 Stück', cat: 'Obst & Gemüse', grams: 600 },
  { name: 'Salatkopf', qty: '2 Stück', cat: 'Obst & Gemüse', grams: 600 },
  { name: 'Brötchen', qty: '8 Stück', cat: 'Backwaren', grams: 400 },
];

function pick(n: number, seed = Date.now()): FoodItem[] {
  const arr = [...POOL]; const out: FoodItem[] = [];
  let s = seed;
  for (let i = 0; i < n && arr.length; i++) { s = (s * 9301 + 49297) % 233280; out.push(arr.splice(s % arr.length, 1)[0]); }
  return out;
}

/** Foto machen → Bilderkennung schlägt Inhalt, Füllstand und Menge vor → Person bestätigt. */
export function AiPhotoSheet({ open, onClose, onDone, color = C.food, title = 'Was ist im Regal?', mode = 'shelf' }: { open: boolean; onClose: () => void; onDone: (r: AiResult) => void; color?: string; title?: string; mode?: 'shelf' | 'stock' | 'pickup' }) {
  const [phase, setPhase] = useState<'camera' | 'analyzing' | 'result'>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [fill, setFill] = useState<AiResult['fill']>('mittel');

  useEffect(() => { if (open) { setPhase('camera'); setPhoto(null); setItems([]); } }, [open]);

  async function snap(useCamera: boolean) {
    haptic();
    let uri: string | null = null;
    if (Platform.OS !== 'web') {
      try {
        const r = useCamera ? await ImagePicker.launchCameraAsync({ quality: 0.5, exif: false }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, exif: false });
        if (r.canceled) return; uri = r.assets[0].uri;
      } catch { uri = null; }
    }
    setPhoto(uri); setPhase('analyzing');
    setTimeout(() => {
      const n = mode === 'pickup' ? 1 + (Date.now() % 2) : 2 + (Date.now() % 3);
      const it = pick(n); setItems(it);
      const g = it.reduce((a, b) => a + b.grams, 0);
      setFill(g > 2500 ? 'voll' : g > 1200 ? 'mittel' : g > 400 ? 'wenig' : 'leer');
      setPhase('result'); haptic('success');
    }, 2200);
  }

  const grams = items.reduce((a, b) => a + b.grams, 0);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[{ backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, paddingBottom: 36 }, shadow(3)]}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: 'center', marginBottom: S.lg }} />
          <Text style={T.h2}>{title}</Text>
          {phase === 'camera' && (
            <Animated.View entering={FadeIn}>
              <Text style={[T.body, { marginTop: 6 }]}>Ein Foto reicht. Die Bilderkennung schlägt vor, was drin ist und wie viel. Du bestätigst nur noch.</Text>
              <View style={{ marginTop: 16, gap: 10 }}>
                <Button label="Foto aufnehmen" icon="📷" color={color} onPress={() => snap(true)} />
                <Button label={Platform.OS === 'web' ? 'Beispielfoto nutzen' : 'Aus Galerie'} variant="soft" color={color} onPress={() => snap(false)} />
              </View>
            </Animated.View>
          )}
          {phase === 'analyzing' && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ width: 200, height: 140, borderRadius: 18, overflow: 'hidden', backgroundColor: C.bg }}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 200, height: 140 }} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="image" size={44} color={C.line} /></View>}
                <ScanLine color={color} />
              </View>
              <Text style={[T.h3, { marginTop: 14 }]}>Bilderkennung läuft…</Text>
              <Text style={T.small}>Lebensmittel, Mengen, Füllstand</Text>
            </View>
          )}
          {phase === 'result' && (
            <Animated.View entering={FadeInDown.springify().damping(16)}>
              <Row style={{ marginTop: 8, gap: 10 }}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 64, height: 64, borderRadius: 12 }} /> : <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark-circle" size={30} color={color} /></View>}
                <View style={{ flex: 1 }}><Text style={T.h3}>Erkannt: {items.length} Posten, ca. {(grams / 1000).toFixed(1)} kg</Text><Text style={T.small}>Tippe auf einen Posten, um ihn zu entfernen.</Text></View>
              </Row>
              <View style={{ marginTop: 12, gap: 6 }}>
                {items.map((it) => (
                  <Pressable key={it.name} onPress={() => setItems(items.filter((x) => x !== it))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, padding: 10, gap: 10 }}>
                    <Ionicons name="checkmark-circle" size={20} color={color} />
                    <Text style={[T.body, { flex: 1, color: C.ink, fontWeight: '700' }]}>{it.name}</Text>
                    <Text style={T.small}>{it.qty} · {it.cat}</Text>
                  </Pressable>
                ))}
              </View>
              {mode === 'shelf' && <Row style={{ marginTop: 12, gap: 6 }}>{(['leer', 'wenig', 'mittel', 'voll'] as const).map((f) => <Pill key={f} label={f} active={fill === f} color={color} onPress={() => setFill(f)} />)}</Row>}
              <View style={{ marginTop: 14 }}><Button label="Stimmt so" color={color} onPress={() => { onDone({ items, fill, grams, photo: photo ?? 'demo' }); onClose(); }} /></View>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ScanLine({ color }: { color: string }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withTiming(130, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 6, backgroundColor: color, opacity: 0.85, borderRadius: 3 }, st]} />;
}

/** Sprachnotiz: gedrückt halten, sprechen, loslassen. Wird transkribiert und in Posten zerlegt. */
export function VoiceSheet({ open, onClose, onDone, color = C.food, title = 'Sag, was du eingestellt hast' }: { open: boolean; onClose: () => void; onDone: (r: AiResult) => void; color?: string; title?: string }) {
  const [phase, setPhase] = useState<'idle' | 'rec' | 'transcribing' | 'result'>('idle');
  const [transcript, setTranscript] = useState('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const recorder = useRef<any>(null);
  const audioUri = useRef<string | undefined>(undefined);
  useEffect(() => { if (open) { setPhase('idle'); setTranscript(''); setItems([]); } }, [open]);

  async function start() {
    haptic(); setPhase('rec');
    if (Platform.OS === 'web') return;
    try {
      const A = require('expo-audio');
      await A.requestRecordingPermissionsAsync?.();
      await A.setAudioModeAsync?.({ allowsRecording: true, playsInSilentMode: true });
      const rec = new A.AudioRecorder(A.RecordingPresets.HIGH_QUALITY);
      await rec.prepareToRecordAsync(); rec.record(); recorder.current = rec;
    } catch { recorder.current = null; }
  }
  async function stop() {
    haptic(); setPhase('transcribing');
    try { if (recorder.current) { await recorder.current.stop(); audioUri.current = recorder.current.uri ?? undefined; } } catch {}
    setTimeout(() => {
      const it = pick(2 + (Date.now() % 2), Date.now() + 7); setItems(it);
      setTranscript(`Ich habe gerade ${it.map((x) => `${x.qty} ${x.name}`).join(' und ')} eingestellt, alles noch gut.`);
      setPhase('result'); haptic('success');
    }, 1800);
  }
  const grams = items.reduce((a, b) => a + b.grams, 0);
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[{ backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, paddingBottom: 36, alignItems: 'center' }, shadow(3)]}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: S.lg }} />
          <Text style={T.h2}>{title}</Text>
          {(phase === 'idle' || phase === 'rec') && (
            <>
              <Text style={[T.body, { textAlign: 'center', marginTop: 6 }]}>{phase === 'rec' ? 'Ich höre zu…' : 'Gedrückt halten und sprechen. Zum Beispiel: „Zwei Tüten Brötchen und drei Joghurt.“'}</Text>
              <Bars active={phase === 'rec'} color={color} />
              <Pressable onPressIn={start} onPressOut={stop} style={[{ width: 92, height: 92, borderRadius: 46, backgroundColor: phase === 'rec' ? C.danger : color, alignItems: 'center', justifyContent: 'center' }, shadow(2)]}>
                <Ionicons name="mic" size={40} color="#fff" />
              </Pressable>
              <Text style={[T.small, { marginTop: 10 }]}>{phase === 'rec' ? 'Loslassen zum Beenden' : 'Halten zum Aufnehmen'}</Text>
            </>
          )}
          {phase === 'transcribing' && (<View style={{ paddingVertical: 24, alignItems: 'center' }}><Bars active color={color} /><Text style={T.h3}>Wird transkribiert…</Text></View>)}
          {phase === 'result' && (
            <Animated.View entering={FadeInDown.springify().damping(16)} style={{ width: '100%' }}>
              <View style={{ backgroundColor: C.bg, borderRadius: 14, padding: 12, marginTop: 8 }}><Text style={[T.body, { fontStyle: 'italic' }]}>„{transcript}“</Text></View>
              <View style={{ marginTop: 10, gap: 6 }}>
                {items.map((it) => (
                  <Row key={it.name} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 10 }}><Ionicons name="checkmark-circle" size={20} color={color} /><Text style={[T.body, { flex: 1, color: C.ink, fontWeight: '700' }]}>{it.name}</Text><Text style={T.small}>{it.qty}</Text></Row>
                ))}
              </View>
              <View style={{ marginTop: 14 }}><Button label="Stimmt so" color={color} onPress={() => { onDone({ items, fill: 'mittel', grams, audio: audioUri.current ?? 'demo', transcript }); onClose(); }} /></View>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Bars({ active, color }: { active: boolean; color: string }) {
  return <View style={{ flexDirection: 'row', gap: 5, height: 46, alignItems: 'center', marginVertical: 16 }}>{Array.from({ length: 14 }).map((_, i) => <Bar key={i} i={i} active={active} color={color} />)}</View>;
}
function Bar({ i, active, color }: { i: number; active: boolean; color: string }) {
  const h = useSharedValue(8);
  useEffect(() => { h.value = active ? withRepeat(withSequence(withTiming(14 + ((i * 7) % 30), { duration: 260 + (i % 4) * 60 }), withTiming(6, { duration: 300 })), -1, true) : withTiming(8, { duration: 300 }); }, [active]);
  const st = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ width: 5, borderRadius: 3, backgroundColor: active ? color : C.line }, st]} />;
}
