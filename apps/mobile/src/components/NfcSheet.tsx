import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { C, R, S, shadow } from '@/theme';
import { T, haptic } from './ui';
import { nfcAvailable, readTag, demoTag, type TagInfo } from '@/api/nfc';

/**
 * NFC-Tap: Handy an den Tag halten. Echtes Lesen, wenn das Gerät NFC hat (Dev-Build),
 * sonst Simulation mit derselben Animation. Ergebnis ist in beiden Fällen ein TagInfo.
 */
export default function NfcSheet({ open, onClose, onRead, color = C.mobility, title = 'Handy an den Tag halten', demoLine = 'U4', label }: { open: boolean; onClose: () => void; onRead: (t: TagInfo) => void; color?: string; title?: string; demoLine?: string; label?: string }) {
  const [phase, setPhase] = useState<'scan' | 'ok'>('scan');
  const [real, setReal] = useState(false);
  useEffect(() => {
    if (!open) return;
    setPhase('scan');
    let alive = true;
    (async () => {
      const has = await nfcAvailable(); setReal(has);
      let t: TagInfo | null = null;
      if (has) t = await readTag();
      if (!has) await new Promise((r) => setTimeout(r, 1900));
      if (!alive) return;
      const tag = t ?? demoTag(demoLine);
      setPhase('ok'); haptic('success');
      setTimeout(() => { if (alive) { onRead(tag); onClose(); } }, 900);
    })();
    return () => { alive = false; };
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[{ backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, paddingBottom: 40, alignItems: 'center' }, shadow(3)]}>
          <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, marginBottom: S.lg }} />
          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
            {phase === 'scan' && [0, 1, 2].map((i) => <Pulse key={i} delay={i * 500} color={color} />)}
            <Animated.View style={{ position: 'absolute' }}>
              {phase === 'scan' ? <Phone color={color} /> : <Check color={color} />}
            </Animated.View>
          </View>
          <Text style={[T.h2, { marginTop: 8, textAlign: 'center' }]}>{phase === 'scan' ? title : 'Tag gelesen'}</Text>
          <Text style={[T.body, { textAlign: 'center', marginTop: 6 }]}>{phase === 'scan' ? (real ? 'Oben am Gerät, ohne zu bewegen.' : label ?? 'Der Tag sitzt im Türbereich des Fahrzeugs. In dieser Demo wird das Lesen simuliert.') : 'Passt. Weiter geht es automatisch.'}</Text>
          {phase === 'scan' && <Pressable onPress={onClose} style={{ marginTop: 16 }}><Text style={{ color: C.muted, fontWeight: '700' }}>Abbrechen</Text></Pressable>}
        </Animated.View>
      </View>
    </Modal>
  );
}

function Pulse({ delay, color }: { delay: number; color: string }) {
  const s = useSharedValue(0.3), o = useSharedValue(0.6);
  useEffect(() => {
    s.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1, false));
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(0.55, { duration: 100 }), withTiming(0, { duration: 1400 })), -1, false));
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: color }, st]} />;
}

function Phone({ color }: { color: string }) {
  const y = useSharedValue(0);
  useEffect(() => { y.value = withRepeat(withSequence(withTiming(-10, { duration: 700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) })), -1, false); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ width: 64, height: 110, borderRadius: 16, backgroundColor: C.ink, borderWidth: 4, borderColor: '#2b332b', alignItems: 'center', justifyContent: 'center' }, st]}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color + '33', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 18 }}>📡</Text></View>
    </Animated.View>
  );
}

function Check({ color }: { color: string }) {
  const s = useSharedValue(0.2);
  useEffect(() => { s.value = withSpring(1, { damping: 10, stiffness: 180 }); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[{ width: 110, height: 110, borderRadius: 55, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }, st]}><Text style={{ color: '#fff', fontSize: 56, fontWeight: '900' }}>✓</Text></Animated.View>;
}
