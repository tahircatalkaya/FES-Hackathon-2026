import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, FadeOut, FadeOutUp, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { Award } from '@/engine/types';
import { C, R, S, shadow } from '@/theme';
import { StatusBadge, T, haptic, Counter, Button } from './ui';
import { fmtCo2 } from '@/engine/impact';
import Chameleon from './Chameleon';
import { CelebrationOverlay } from './ChamiMascot';

/**
 * Bestätigung nach jeder Aktion.
 * Punkte > 0: große Feier-Karte mit Kai, Zähler, Blätter-Regen. 0 Punkte oder Duplikat: kleiner Hinweis oben.
 */
export default function AwardToast({ award, onWhy, onDone, color = C.success }: { award: Award | null; onWhy: (a: Award) => void; onDone: () => void; color?: string }) {
  const t = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const [a, setA] = useState<Award | null>(null);
  useEffect(() => {
    if (award) { setA(award); haptic(award.points > 0 ? 'success' : 'light'); }
  }, [award]);
  useEffect(() => {
    if (a && a.points === 0) { const t = setTimeout(() => { setA(null); onDone(); }, 3800); return () => clearTimeout(t); }
  }, [a]);
  if (!a) return null;
  const close = () => { setA(null); onDone(); };

  /** Foodsharing, Vytal und der ÖPNV haben je einen Clip, der wie im FES-Bereich als Belohnung läuft. */
  const clip = a.partner === 'foodsharing' ? 'food' : a.partner === 'vytal' ? 'cup' : a.partner === 'transdev' ? 'ride' : null;
  if (clip) {
    return <CelebrationOverlay open points={a.points} duplicate={a.duplicate} pending={a.status === 'ausstehend'} note={a.points===0&&!a.duplicate ? a.reasons.at(-1)||a.formula : undefined} clip={clip} onClose={close} />;
  }

  if (a.points === 0) {
    return (
      <Animated.View entering={FadeInUp.duration(240)} exiting={FadeOutUp} style={{ position: 'absolute', top: 54, left: S.lg, right: S.lg, zIndex: 50 }}>
        <Pressable onPress={() => { setA(null); onWhy(a); }} style={[{ backgroundColor: '#fff', borderRadius: R.lg, padding: S.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 6, borderLeftColor: a.duplicate ? C.muted : color }, shadow(3)]}>
          <Chameleon pose={a.duplicate ? 'calm' : 'thumbs'} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={T.h3} numberOfLines={1}>{a.duplicate ? t('components.award.already') : t('components.award.thanks')}</Text>
            <Text style={T.small} numberOfLines={2}>{a.duplicate ? t('components.award.duplicate') : t('components.award.counted', { title: localize(a.title) })}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.55)', justifyContent: 'center', padding: S.xl }}>
        <Pressable style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} onPress={close} />
        <Leaves color={color} />
        <Pop>
          <View style={[{ backgroundColor: '#fff', borderRadius: R.xl, padding: S.xl, alignItems: 'center', maxWidth: 420, width: '100%', alignSelf: 'center' }, shadow(3)]}>
            <Chameleon pose="cheer" size={170} />
            <Text style={[T.label, { marginTop: 4 }]}>{t('components.award.done')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 56, fontWeight: '900', color, letterSpacing: -2 }}>+</Text>
              <Counter value={a.points} style={{ fontSize: 56, fontWeight: '900', color, letterSpacing: -2 }} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, marginBottom: 12 }}>🍃</Text>
            </View>
            <Text style={[T.h3, { textAlign: 'center' }]} numberOfLines={2}>{localize(a.title)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <StatusBadge status={a.status} />
              {a.impact.co2_g > 0 && <Text style={T.body}>🌍 {fmtCo2(a.impact.co2_g, locale)} CO₂e</Text>}
              {a.impact.food_g > 0 && <Text style={T.body}>🥕 {(a.impact.food_g / 1000).toFixed(1)} kg</Text>}
              {a.impact.packaging > 0 && <Text style={T.body}>🥡 {t('components.award.singleUse', { count: a.impact.packaging })}</Text>}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, width: '100%' }}>
              <Button label={t('why.title')} variant="soft" color={color} onPress={() => { setA(null); onWhy(a); }} style={{ flex: 1, paddingVertical: 12 }} />
              <Button label={t('common.next')} color={color} onPress={close} style={{ flex: 1, paddingVertical: 12 }} />
            </View>
          </View>
        </Pop>
      </Animated.View>
    </Modal>
  );
}

function Pop({ children }: { children: React.ReactNode }) {
  const sc = useSharedValue(0.6), op = useSharedValue(0);
  useEffect(() => { sc.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }); op.value = withTiming(1, { duration: 180 }); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: op.value }));
  return <Animated.View style={st}>{children}</Animated.View>;
}

function Leaves({ color }: { color: string }) {
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 400 }}>{Array.from({ length: 22 }).map((_, i) => <Leaf key={i} i={i} color={i % 3 === 0 ? C.leaf : i % 3 === 1 ? color : C.gold} />)}</View>;
}

function Leaf({ i, color }: { i: number; color: string }) {
  const y = useSharedValue(-20), x = useSharedValue(0), rot = useSharedValue(0), op = useSharedValue(0);
  useEffect(() => {
    const d = i * 45;
    op.value = withDelay(d, withSequence(withTiming(1, { duration: 120 }), withDelay(1400, withTiming(0, { duration: 800 }))));
    y.value = withDelay(d, withTiming(360 + (i % 5) * 40, { duration: 2400, easing: Easing.out(Easing.quad) }));
    x.value = withDelay(d, withTiming((i % 2 ? 1 : -1) * (20 + (i * 13) % 70), { duration: 2400 }));
    rot.value = withDelay(d, withTiming(420 * (i % 2 ? 1 : -1), { duration: 2400 }));
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: y.value }, { translateX: x.value }, { rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[{ position: 'absolute', left: `${4 + ((i * 37) % 92)}%`, top: 0, width: 12, height: 17, borderRadius: 8, borderTopLeftRadius: 1, backgroundColor: color }, st]} />;
}
