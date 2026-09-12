import React, { useMemo, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { C, R, S } from '@/theme';
import { BINGO, bingoIndexFor, dayKey } from '@/data/fes';
import { useStore } from '@/store';
import { Button, Sheet, T, haptic } from './ui';

/** Bingo-Karte: 16 Felder, ein Feld je Kalendertag. Melden braucht die Entsorgung an einem Mülleimer. */
export function BingoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ledger, addAward } = useStore();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [hint, setHint] = useState('');

  const today = bingoIndexFor();
  const { filled, doneToday } = useMemo(() => {
    const days = ledger.filter((l) => l.type === 'clean.bin_checkin' && l.key.startsWith('bingo:')).map((l) => l.key.slice(6));
    return {
      filled: new Set(days.map((d) => bingoIndexFor(new Date(d)))),
      doneToday: days.includes(dayKey()),
    };
  }, [ledger]);

  async function snap(which: 'before' | 'after') {
    haptic();
    if (Platform.OS === 'web') return;
    try {
      const r = await ImagePicker.launchCameraAsync({ quality: 0.4, exif: false });
      if (r.canceled) return;
      (which === 'before' ? setBefore : setAfter)(r.assets[0].uri);
    } catch {
      /* Kamera nicht verfügbar: Fotos sind freiwillig, der Ablauf geht weiter. */
    }
  }

  function report() {
    if (!confirmed) { setHint('Bitte bestätige, dass du es an einem Mülleimer entsorgt hast.'); return; }
    const a = addAward({
      type: 'clean.bin_checkin',
      partner: 'fes',
      status: 'selbst angegeben',
      key: `bingo:${dayKey()}`,
      at: Date.now(),
      title: BINGO[today].title,
      meta: { source: 'user', evidence: ['Eigene Angabe am Mülleimer', before || after ? 'Foto auf dem Gerät behalten, nicht übertragen' : 'Ohne Foto gemeldet'] },
    });
    haptic(a.duplicate ? 'warn' : 'success');
    setBefore(null); setAfter(null); setConfirmed(false); setHint('');
  }

  return (
    <Sheet open={open} onClose={onClose} title="Mülleimer-Bingo">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.clean + '14', borderRadius: R.md, padding: S.md }}>
        <Text style={{ fontSize: 34 }}>{BINGO[today].icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={T.label}>Heutige Challenge</Text>
          <Text style={T.h3}>{BINGO[today].title}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.lg, marginHorizontal: -4 }}>
        {BINGO.map((c, i) => {
          const done = filled.has(i);
          return (
            <Animated.View key={c.short} entering={FadeIn.delay(i * 25)} style={{ width: '25%', padding: 4 }}>
              <View style={{ aspectRatio: 1, borderRadius: R.sm, borderWidth: i === today ? 2.5 : 1.5, borderColor: i === today ? C.clean : done ? C.leaf : C.line, backgroundColor: done ? C.leaf + '1F' : '#fff', alignItems: 'center', justifyContent: 'center', opacity: done || i === today ? 1 : 0.5 }}>
                <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                <Text style={{ fontSize: 9, fontWeight: '800', color: done ? '#3F7A25' : C.muted, marginTop: 2 }} numberOfLines={1}>{c.short}</Text>
                {done && (
                  <Animated.View entering={ZoomIn} style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Text style={[T.small, { marginTop: S.md }]}>{filled.size} von {BINGO.length} Feldern gefüllt</Text>
      <View style={{ height: 9, borderRadius: 6, backgroundColor: C.line, marginTop: 6, overflow: 'hidden' }}>
        <View style={{ width: `${(filled.size / BINGO.length) * 100}%`, height: '100%', backgroundColor: C.clean }} />
      </View>

      {doneToday ? (
        <View style={{ marginTop: S.lg, borderRadius: R.md, borderWidth: 2, borderColor: C.leaf, backgroundColor: C.leaf + '1A', padding: S.md, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Ionicons name="checkmark-circle" size={20} color={C.success} />
          <Text style={{ fontWeight: '800', color: '#3F7A25' }}>Heute erledigt</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: S.lg }}>
            {([['before', before, 'Vorher', 'camera'], ['after', after, 'Nachher', 'sparkles']] as const).map(([k, uri, label, icon]) => (
              <Pressable key={k} onPress={() => snap(k)} style={{ flex: 1, height: 108, borderRadius: R.md, borderWidth: 2, borderStyle: uri ? 'solid' : 'dashed', borderColor: uri ? C.leaf : C.line, backgroundColor: '#FAFAF7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} /> : (
                  <>
                    <Ionicons name={icon as any} size={24} color={C.muted} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: C.muted, marginTop: 6 }}>{label}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
          <Text style={[T.small, { marginTop: 8 }]}>Fotos bleiben auf deinem Gerät. Freiwillig, sie verändern die Punkte nicht.</Text>

          <Pressable onPress={() => { haptic(); setConfirmed((v) => !v); setHint(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: S.md, padding: S.md, borderRadius: R.md, borderWidth: 2, borderColor: confirmed ? C.leaf : C.line, backgroundColor: confirmed ? C.leaf + '14' : '#fff' }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: confirmed ? C.success : C.line, backgroundColor: confirmed ? C.success : '#fff', alignItems: 'center', justifyContent: 'center' }}>
              {confirmed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[T.body, { flex: 1 }]}>Ich habe es an einem Frankfurter Straßenmülleimer entsorgt</Text>
          </Pressable>
          {hint ? <Text style={[T.small, { color: C.warn, marginTop: 6 }]}>{hint}</Text> : null}
          <Button label="Aktion melden" onPress={report} color={C.clean} style={{ marginTop: S.md }} />
          <Text style={[T.small, { marginTop: 8 }]}>Selbst angegeben, deshalb 30 Prozent der Basispunkte. Ein Feld pro Tag.</Text>
        </>
      )}
    </Sheet>
  );
}
