import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C, R, S } from '@/theme';
import { BIN_FINDINGS, dayKey } from '@/data/fes';
import { useStore } from '@/store';
import { Button, Ring, Sheet, T, haptic } from './ui';

type Phase = 'start' | 'analyzing' | 'result';

/** Biotonnen-Check: Foto der eigenen Biotonne, Bilderkennung schlägt Fehlwürfe vor, Person bestätigt. */
export function BinCheckSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ledger, addAward } = useStore();
  const [phase, setPhase] = useState<Phase>('start');
  const [photo, setPhoto] = useState<string | null>(null);
  const [findings, setFindings] = useState<typeof BIN_FINDINGS>([]);
  const [score, setScore] = useState(0);

  const doneToday = ledger.some((l) => l.key === `bincheck:${dayKey()}`);
  useEffect(() => { if (open) { setPhase('start'); setPhoto(null); setFindings([]); } }, [open]);

  async function snap() {
    haptic();
    let uri: string | null = null;
    if (Platform.OS !== 'web') {
      try {
        const r = await ImagePicker.launchCameraAsync({ quality: 0.5, exif: false });
        if (r.canceled) return;
        uri = r.assets[0].uri;
      } catch { uri = null; }
    }
    setPhoto(uri);
    setPhase('analyzing');
    setTimeout(() => {
      const n = Date.now() % 3; // 0 bis 2 Fehlwürfe
      const found = n === 0 ? [] : BIN_FINDINGS.slice(Date.now() % 3, (Date.now() % 3) + n);
      setFindings(found);
      setScore(found.length === 0 ? 94 + (Date.now() % 6) : Math.max(35, 78 - found.length * 18));
      setPhase('result');
      haptic(found.length ? 'warn' : 'success');
    }, 1800);
  }

  function claim() {
    const a = addAward({
      type: 'clean.bin_quality',
      partner: 'fes',
      status: 'selbst angegeben',
      key: `bincheck:${dayKey()}`,
      at: Date.now(),
      title: 'Biotonne geprüft',
      meta: { source: 'user', evidence: [`Bilderkennung: Trennqualität ${score} von 100`, 'Foto nur auf dem Gerät ausgewertet'] },
    });
    haptic(a.duplicate ? 'warn' : 'success');
    onClose();
  }

  const good = findings.length === 0;
  return (
    <Sheet open={open} onClose={onClose} title="Biotonnen-Check">
      {phase === 'start' && (
        <Animated.View entering={FadeIn}>
          <Text style={[T.body, { marginTop: 4 }]}>
            Fotografiere deine offene Biotonne von oben. Die Bilderkennung schlägt vor, was nicht hineingehört. Du entscheidest, ob der Vorschlag stimmt.
          </Text>
          <Pressable onPress={snap} style={{ marginTop: S.lg, height: 170, borderRadius: R.md, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, backgroundColor: '#FAFAF7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera" size={30} color={C.muted} />
            <Text style={{ fontWeight: '800', color: C.muted, marginTop: 8 }}>Foto der Biotonne</Text>
          </Pressable>
          <Text style={[T.small, { marginTop: 10 }]}>Das Bild wird auf dem Gerät ausgewertet und nicht hochgeladen. Im Pilot ersetzt ein trainiertes Modell diese Vorschlagslogik.</Text>
          {doneToday ? <Text style={[T.small, { color: C.warn, marginTop: 8 }]}>Heute schon geprüft. Ein zweiter Check gibt keine Punkte mehr.</Text> : null}
        </Animated.View>
      )}

      {phase === 'analyzing' && (
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', paddingVertical: S.xl }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 150, borderRadius: R.md, marginBottom: S.lg }} /> : null}
          <Ring progress={0.7} size={78} color={C.clean}><Ionicons name="scan" size={26} color={C.clean} /></Ring>
          <Text style={[T.h3, { marginTop: 14 }]}>Bild wird ausgewertet …</Text>
        </Animated.View>
      )}

      {phase === 'result' && (
        <Animated.View entering={FadeIn}>
          {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 140, borderRadius: R.md, marginTop: 4 }} /> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: S.lg }}>
            <Ring progress={score / 100} size={84} color={good ? C.success : C.warn}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.ink }}>{score}</Text>
            </Ring>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{good ? 'Sauber getrennt' : 'Da ist Fremdmaterial drin'}</Text>
              <Text style={T.small}>Trennqualität, Vorschlag der Bilderkennung</Text>
            </View>
          </View>

          {findings.length > 0 && (
            <View style={{ gap: 8, marginTop: S.lg }}>
              {findings.map((f) => (
                <View key={f.label} style={{ flexDirection: 'row', gap: 10, padding: S.md, borderRadius: R.md, backgroundColor: C.warn + '14' }}>
                  <Ionicons name="alert-circle" size={20} color={C.warn} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: C.ink }}>{f.label}</Text>
                    <Text style={T.small}>{f.hint}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Button label={good ? 'Stimmt so, Punkte holen' : 'Verstanden, Punkte holen'} onPress={claim} color={C.clean} style={{ marginTop: S.lg }} />
          <Button label="Neues Foto" variant="ghost" color={C.ink} onPress={() => setPhase('start')} style={{ marginTop: 8 }} />
          <Text style={[T.small, { marginTop: 10 }]}>Punkte gibt es für das Prüfen und Lernen, nicht für ein gutes Ergebnis. Einmal pro Tag.</Text>
        </Animated.View>
      )}
    </Sheet>
  );
}
