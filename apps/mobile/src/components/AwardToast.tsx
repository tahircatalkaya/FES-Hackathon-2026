import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import type { Award } from '@/engine/types';
import { C, R, S, shadow } from '@/theme';
import { StatusBadge, T, haptic } from './ui';
import { fmtCo2 } from '@/engine/impact';

/** Feier-Toast nach einer Gutschrift, mit Konfetti-Blättern. Tippen öffnet die Begründung. */
export default function AwardToast({ award, onWhy, onDone, color = C.success }: { award: Award | null; onWhy: (a: Award) => void; onDone: () => void; color?: string }) {
  const [a, setA] = useState<Award | null>(null);
  useEffect(() => {
    if (award) { setA(award); haptic(award.points > 0 ? 'success' : 'light'); const t = setTimeout(() => { setA(null); onDone(); }, 4200); return () => clearTimeout(t); }
  }, [award]);
  if (!a) return null;
  return (
    <Animated.View entering={FadeInUp.springify().damping(14)} exiting={FadeOutUp} style={{ position: 'absolute', top: 54, left: S.lg, right: S.lg, zIndex: 50 }}>
      {a.points > 0 && <Leaves color={color} />}
      <Pressable onPress={() => { setA(null); onWhy(a); }} style={[{ backgroundColor: '#fff', borderRadius: R.lg, padding: S.lg, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 6, borderLeftColor: color }, shadow(3)]}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: color + '1A', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color }}>{a.points > 0 ? `+${a.points}` : a.duplicate ? '↺' : '♥'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={T.h3} numberOfLines={1}>{a.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <StatusBadge status={a.status} small />
            {a.impact.co2_g > 0 && <Text style={T.small}>{fmtCo2(a.impact.co2_g)} CO₂e</Text>}
            {a.impact.food_g > 0 && <Text style={T.small}>{(a.impact.food_g / 1000).toFixed(1)} kg gerettet</Text>}
          </View>
          <Text style={[T.small, { marginTop: 2 }]}>{a.duplicate ? 'Bereits gewertet, keine Doppelbelohnung' : a.points === 0 ? 'Anerkennung ohne Punkte · Tippen für Warum' : 'Tippen: Warum diese Punkte?'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Leaves({ color }: { color: string }) {
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: -10, height: 160 }}>{Array.from({ length: 14 }).map((_, i) => <Leaf key={i} i={i} color={i % 3 === 0 ? C.leaf : i % 3 === 1 ? color : C.gold} />)}</View>;
}

function Leaf({ i, color }: { i: number; color: string }) {
  const y = useSharedValue(0), x = useSharedValue(0), rot = useSharedValue(0), op = useSharedValue(0);
  useEffect(() => {
    const d = i * 40;
    op.value = withDelay(d, withSequence(withTiming(1, { duration: 120 }), withDelay(900, withTiming(0, { duration: 700 }))));
    y.value = withDelay(d, withTiming(120 + (i % 4) * 25, { duration: 1700, easing: Easing.out(Easing.quad) }));
    x.value = withDelay(d, withTiming((i % 2 ? 1 : -1) * (20 + (i * 13) % 60), { duration: 1700 }));
    rot.value = withDelay(d, withTiming(360 * (i % 2 ? 1 : -1), { duration: 1700 }));
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: y.value }, { translateX: x.value }, { rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[{ position: 'absolute', left: `${8 + ((i * 37) % 84)}%`, top: 0, width: 10, height: 14, borderRadius: 7, borderTopLeftRadius: 1, backgroundColor: color }, st]} />;
}
