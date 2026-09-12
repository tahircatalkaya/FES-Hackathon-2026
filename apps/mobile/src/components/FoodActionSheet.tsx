import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C, R, S, shadow } from '@/theme';
import VoiceStep from './VoiceStep';
import { Button, Pill, Row, T, haptic } from './ui';
import { CATS, aiProvider, analyzeAudio, analyzePhoto, estimateGrams, type AiMode, type Fill, type FoodItem } from '@/api/ai';

export type { FoodItem, Fill, AiMode };
export interface ActionResult { items: FoodItem[]; fill: Fill; grams: number; photo?: string; audio?: string; transcript?: string; method: 'photo' | 'voice' | 'manual'; ai: boolean }

type Step = 'method' | 'photo' | 'voice' | 'manual' | 'working' | 'result';
type Method = 'photo' | 'voice' | 'manual';

const COPY: Record<AiMode, { title: string; hint: string; photo: string; voice: string; manual: string }> = {
  pickup: { title: 'Was nimmst du mit?', hint: 'Damit andere wissen, was noch da ist.', photo: 'Fotografiere, was du in der Hand hast', voice: 'Sag kurz, was du mitnimmst', manual: 'Posten selbst eintragen' },
  stock: { title: 'Welche Lebensmittel teilst du?', hint: 'Erfasse die Lebensmittel und prüfe die vorgeschlagenen Mengen.', photo: 'Fotografiere deine Lebensmittel', voice: 'Sag kurz, welche Lebensmittel du teilst', manual: 'Posten selbst eintragen' },
  shelf: { title: 'Was ist im Regal?', hint: 'Ein aktueller Stand erspart anderen den Weg umsonst.', photo: 'Fotografiere das Regal', voice: 'Sag kurz, was drin ist', manual: 'Inhalt selbst eintragen' },
};

/**
 * Ein Sheet für Abholen, Einstellen und Regal melden. Drei Wege zum selben Ergebnis:
 * Foto (Bilderkennung), Sprachnotiz (Transkription) oder selbst eintragen.
 * Jede Stufe hat einen Zurück-Pfeil. Das Ergebnis ist immer editierbar.
 */
export function FoodActionSheet({ open, onClose, onDone, mode, color = C.food }: { open: boolean; onClose: () => void; onDone: (r: ActionResult) => void; mode: AiMode; color?: string }) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<Method>('manual');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [fill, setFill] = useState<Fill>('mittel');
  const [photo, setPhoto] = useState<string | undefined>();
  const [audio, setAudio] = useState<string | undefined>();
  const [transcript, setTranscript] = useState<string | undefined>();
  const [note, setNote] = useState<string | undefined>();
  const [usedAi, setUsedAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[mode];
  const ai = aiProvider();

  useEffect(() => { if (open) { setStep('method'); setItems([]); setFill('mittel'); setPhoto(undefined); setAudio(undefined); setTranscript(undefined); setNote(undefined); setUsedAi(false); setError(null); } }, [open]);

  function back() {
    haptic();
    setError(null);
    if (step === 'result') setStep(method);
    else setStep('method');
  }

  function choose(m: Method) { haptic(); setMethod(m); setError(null); setStep(m); }

  async function takePhoto(camera: boolean) {
    haptic(); setError(null);
    let asset: ImagePicker.ImagePickerAsset | null = null;
    try {
      if (camera && Platform.OS !== 'web') { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) { setError('Ohne Kamerazugriff geht nur die Galerie oder die manuelle Eingabe.'); return; } }
      const opts: ImagePicker.ImagePickerOptions = { quality: 0.35, base64: true, exif: false, mediaTypes: ['images'] };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (r.canceled || !r.assets?.[0]) return;
      asset = r.assets[0];
    } catch (e: any) { setError('Kamera konnte nicht geöffnet werden.'); return; }
    setPhoto(asset.uri);
    if (!ai) { setStep('result'); return; }
    setStep('working');
    try {
      const b64 = asset.base64 ?? '';
      if (!b64) throw new Error('Kein Bild');
      const res = await analyzePhoto(b64, asset.mimeType ?? 'image/jpeg', mode);
      setItems(res.items); setFill(res.fill); setNote(res.foodVisible ? res.note : 'Auf dem Foto sind keine Lebensmittel zu erkennen. Trag ein, was du siehst.'); setUsedAi(true);
      haptic('success');
    } catch (e: any) {
      setNote(`Bilderkennung: ${String(e?.message ?? e)} Du kannst den Inhalt selbst eintragen.`);
    }
    setStep('result');
  }

  async function onVoiceDone(uri: string | undefined, mime: string) {
    setAudio(uri);
    if (!uri) { setError('Aufnahme hat nicht geklappt. Versuch es nochmal oder trag es selbst ein.'); return; }
    if (!ai) { setStep('result'); return; }
    setStep('working');
    try {
      const res = await analyzeAudio(uri, mime, mode);
      setItems(res.items); setFill(res.fill); setTranscript(res.transcript || undefined); setUsedAi(true);
      setNote(res.items.length ? res.note : 'Ich habe keine Lebensmittel verstanden. Trag sie kurz selbst ein.');
      haptic('success');
    } catch (e: any) {
      setNote(`Spracherkennung: ${String(e?.message ?? e)} Du kannst den Inhalt selbst eintragen.`);
    }
    setStep('result');
  }

  const grams = items.reduce((a, b) => a + b.grams, 0);
  const canFinish = items.length > 0 || (mode === 'shelf' && fill === 'leer');
  const titles: Record<Step, string> = { method: copy.title, photo: 'Foto', voice: 'Sprachnotiz', manual: 'Selbst eintragen', working: 'Einen Moment', result: 'Passt das so?' };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={step === 'method' ? onClose : back}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.6)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={[{ backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: S.xl, paddingTop: 10, paddingBottom: 30, maxHeight: '88%' }, shadow(3)]}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: 'center', marginBottom: 10 }} />
            <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
              {step !== 'method' && step !== 'working' ? (
                <Pressable onPress={back} hitSlop={10} accessibilityLabel="Zurück" accessibilityRole="button" style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={22} color={C.ink} /></Pressable>
              ) : <View style={{ width: 38 }} />}
              <Text style={[T.h2, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>{titles[step]}</Text>
              <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Schließen" accessibilityRole="button" style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={22} color={C.ink} /></Pressable>
            </Row>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {step === 'method' && (
                <Animated.View key="method" entering={FadeIn}>
                  <Text style={[T.body, { textAlign: 'center', marginBottom: 14 }]}>{copy.hint}</Text>
                  <MethodRow icon="camera" label="Foto" sub={copy.photo} color={color} onPress={() => choose('photo')} />
                  <MethodRow icon="mic" label="Sprache" sub={copy.voice} color={color} onPress={() => choose('voice')} />
                  <MethodRow icon="create" label="Eintragen" sub={copy.manual} color={color} onPress={() => choose('manual')} />
                </Animated.View>
              )}

              {step === 'photo' && (
                <Animated.View key="photo" entering={FadeIn}>
                  <Text style={[T.body, { textAlign: 'center', marginBottom: 14 }]}>{ai ? 'Die Bilderkennung schlägt vor, was drin ist und wie viel. Du prüfst nur noch.' : 'Das Foto wird als Nachweis gespeichert. Den Inhalt trägst du danach ein.'}</Text>
                  <View style={{ gap: 10 }}>
                    <Button label="Kamera öffnen" color={color} onPress={() => takePhoto(true)} />
                    <Button label="Aus der Galerie" color={color} variant="soft" onPress={() => takePhoto(false)} />
                  </View>
                  {error && <Text style={[T.small, { color: C.warn, marginTop: 10, textAlign: 'center' }]}>{error}</Text>}
                </Animated.View>
              )}

              {open && step === 'voice' && <VoiceStep key="voice" color={color} ai={!!ai} error={error} onDone={onVoiceDone} />}

              {step === 'manual' && (
                <Animated.View key="manual" entering={FadeIn}>
                  <Text style={[T.small, { marginBottom: 10 }]}>Kostenlos ohne KI: Du kannst auch das Mikrofon deiner Handy-Tastatur zum Diktieren nutzen.</Text>
                  <ItemEditor items={items} setItems={setItems} color={color} autoFocus />
                  {mode === 'shelf' && <FillPicker fill={fill} setFill={setFill} color={color} />}
                  <View style={{ marginTop: 14 }}><Button label={items.length ? `Weiter · ${items.length} Posten` : 'Weiter'} color={color} disabled={!canFinish} onPress={() => { haptic(); setStep('result'); }} /></View>
                </Animated.View>
              )}

              {step === 'working' && (
                <View key="working" style={{ alignItems: 'center', paddingVertical: 18 }}>
                  <View style={{ width: 220, height: 150, borderRadius: 18, overflow: 'hidden', backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                    {photo ? <Image source={{ uri: photo }} style={{ width: 220, height: 150 }} /> : <Bars active color={color} />}
                    {photo ? <ScanLine color={color} /> : null}
                  </View>
                  <Row style={{ marginTop: 14, gap: 8 }}><ActivityIndicator color={color} /><Text style={T.h3}>{photo ? 'Bild wird ausgewertet' : 'Sprachnotiz wird ausgewertet'}</Text></Row>
                  <Text style={T.small}>Lebensmittel, Mengen{mode === 'shelf' ? ', Füllstand' : ''}</Text>
                </View>
              )}

              {step === 'result' && (
                <Animated.View key="result" entering={FadeInDown.duration(240)}>
                  <Row style={{ gap: 10, marginBottom: 8 }}>
                    {photo ? <Image source={{ uri: photo }} style={{ width: 64, height: 64, borderRadius: 12 }} /> : <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={method === 'voice' ? 'mic' : 'create'} size={28} color={color} /></View>}
                    <View style={{ flex: 1 }}>
                      <Text style={T.h3}>{items.length ? `${items.length} Posten, ca. ${(grams / 1000).toFixed(1)} kg` : 'Noch nichts eingetragen'}</Text>
                      <Text style={T.small}>{usedAi ? 'Von der Erkennung vorgeschlagen. Du kannst alles ändern.' : 'Du kannst noch ergänzen oder entfernen.'}</Text>
                    </View>
                  </Row>
                  {transcript ? <View style={{ backgroundColor: C.bg, borderRadius: 14, padding: 12, marginBottom: 8 }}><Text style={[T.body, { fontStyle: 'italic' }]}>„{transcript}“</Text></View> : null}
                  {note ? <View style={{ backgroundColor: C.warn + '1A', borderRadius: 12, padding: 10, marginBottom: 8 }}><Text style={[T.small, { color: C.ink }]}>{note}</Text></View> : null}
                  <ItemEditor items={items} setItems={setItems} color={color} />
                  {mode === 'shelf' && <FillPicker fill={fill} setFill={setFill} color={color} />}
                  <View style={{ marginTop: 14 }}>
                    <Button label="Stimmt so" color={color} disabled={!canFinish} onPress={() => { onDone({ items, fill, grams, photo, audio, transcript, method, ai: usedAi }); onClose(); }} />
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MethodRow({ icon, label, sub, color, onPress }: { icon: any; label: string; sub: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: pressed ? color + '22' : C.bg, borderRadius: 18, padding: 14, marginBottom: 10 }]}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={24} color="#fff" /></View>
      <View style={{ flex: 1 }}><Text style={T.h3}>{label}</Text><Text style={T.small}>{sub}</Text></View>
      <Ionicons name="chevron-forward" size={20} color={C.muted} />
    </Pressable>
  );
}

function FillPicker({ fill, setFill, color }: { fill: Fill; setFill: (f: Fill) => void; color: string }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[T.label, { marginBottom: 6 }]}>Wie voll ist das Regal?</Text>
      <Row style={{ gap: 6 }}>{(['leer', 'wenig', 'mittel', 'voll'] as const).map((f) => <Pill key={f} label={f} active={fill === f} color={color} onPress={() => setFill(f)} />)}</Row>
    </View>
  );
}

/** Editierbare Postenliste mit Eingabezeile. Wird für manuelle Eingabe und zum Korrigieren der Erkennung benutzt. */
function ItemEditor({ items, setItems, color, autoFocus }: { items: FoodItem[]; setItems: (i: FoodItem[]) => void; color: string; autoFocus?: boolean }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [cat, setCat] = useState(CATS[0]);
  const nameRef = useRef<TextInput>(null);
  function add() {
    const n = name.trim(); if (!n) return;
    const q = qty.trim() || '1 Stück';
    haptic(); setItems([...items, { name: n, qty: q, cat, grams: estimateGrams(q, cat) }]);
    setName(''); setQty(''); nameRef.current?.focus();
  }
  return (
    <View>
      {items.length > 0 && (
        <View style={{ gap: 6, marginBottom: 10 }}>
          {items.map((it, i) => (
            <Row key={`${it.name}-${i}`} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 10 }}>
              <Ionicons name="checkmark-circle" size={20} color={color} />
              <View style={{ flex: 1 }}><Text style={[T.body, { color: C.ink, fontWeight: '700' }]}>{it.name}</Text><Text style={T.small}>{it.qty} · {it.cat}</Text></View>
              <Pressable hitSlop={8} onPress={() => { haptic(); setItems(items.filter((_, j) => j !== i)); }} style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close-circle" size={22} color={C.muted} /></Pressable>
            </Row>
          ))}
        </View>
      )}
      <View style={{ backgroundColor: C.bg, borderRadius: 14, padding: 10, gap: 8 }}>
        <Row style={{ gap: 8 }}>
          <TextInput ref={nameRef} autoFocus={autoFocus} value={name} onChangeText={setName} placeholder="Was? z. B. Brötchen" placeholderTextColor={C.muted} returnKeyType="next" onSubmitEditing={add} style={{ flex: 1.4, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, color: C.ink, fontWeight: '700' }} />
          <TextInput value={qty} onChangeText={setQty} placeholder="Menge, z. B. 6" placeholderTextColor={C.muted} returnKeyType="done" onSubmitEditing={add} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, color: C.ink }} />
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"><Row style={{ gap: 6 }}>{CATS.map((c) => <Pill key={c} label={c} active={cat === c} color={color} onPress={() => setCat(c)} />)}</Row></ScrollView>
        <Pressable onPress={add} disabled={!name.trim()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: name.trim() ? color : C.line, borderRadius: 10, paddingVertical: 10 }}>
          <Ionicons name="add" size={18} color="#fff" /><Text style={{ color: '#fff', fontWeight: '800' }}>Posten hinzufügen</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScanLine({ color }: { color: string }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withTiming(140, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: 6, backgroundColor: color, opacity: 0.85, borderRadius: 3 }, st]} />;
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
