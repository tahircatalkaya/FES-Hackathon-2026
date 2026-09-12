import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { C, S, shadow } from '@/theme';
import { haptic } from './ui';

/** Feste Stufen statt freier Werte: eine Stufe ist auf dem Handy sicher zu treffen. */
export const RADIUS_STEPS = [0.5, 1, 2, 3, 5, 10];

export function fmtRadius(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${String(km).replace('.', ',')} km`;
}

export function nearestStep(km: number) {
  let best = 0;
  RADIUS_STEPS.forEach((s, i) => { if (Math.abs(s - km) < Math.abs(RADIUS_STEPS[best] - km)) best = i; });
  return best;
}

interface Props {
  /** Aktuell geladener Radius in km. */
  value: number;
  color: string;
  title: string;
  hint: string;
  footer: string;
  /** Waehrend des Ziehens: nur den Ring auf der Karte mitziehen, noch nicht neu laden. */
  onPreview: (km: number) => void;
  /** Losgelassen oder Stufe getippt: jetzt wirklich mit diesem Radius laden. */
  onChange: (km: number) => void;
}

/**
 * Umkreis-Regler auf der Karte. Legt fest, wie weit um den eigenen Standort
 * Angebote geladen werden. Gezogen wird live, geladen wird erst beim Loslassen,
 * damit ein Zug ueber die Skala nicht sechs API-Runden ausloest.
 */
export default function RadiusControl({ value, color, title, hint, footer, onPreview, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const idx = drag ?? nearestStep(value);
  const last = RADIUS_STEPS.length - 1;

  function pick(x: number) {
    if (w <= 0) return;
    const i = Math.max(0, Math.min(last, Math.round((x / w) * last)));
    if (i !== idx) { haptic(); setDrag(i); onPreview(RADIUS_STEPS[i]); }
    else if (drag === null) setDrag(i);
  }
  function commit() {
    const i = drag;
    setDrag(null);
    if (i != null && RADIUS_STEPS[i] !== value) onChange(RADIUS_STEPS[i]);
  }
  function select(i: number) {
    haptic();
    setDrag(null);
    onPreview(RADIUS_STEPS[i]);
    if (RADIUS_STEPS[i] !== value) onChange(RADIUS_STEPS[i]);
  }

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(pick)(e.x))
    .onUpdate((e) => runOnJS(pick)(e.x))
    .onFinalize(() => runOnJS(commit)());

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${fmtRadius(value)}`}
        onPress={() => { haptic(); setOpen(true); }}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, shadow(1)]}
      >
        <Ionicons name="locate" size={15} color={color} />
        <Text style={{ fontWeight: '900', fontSize: 13, color: C.ink }}>{fmtRadius(value)}</Text>
        <Ionicons name="chevron-down" size={13} color={C.muted} />
      </Pressable>
    );
  }

  return (
    <View style={[{ width: 244, backgroundColor: '#fff', borderRadius: 20, padding: 14 }, shadow(2)]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="locate" size={15} color={color} />
        <Text style={{ fontWeight: '800', fontSize: 13, color: C.ink, flex: 1 }}>{title}</Text>
        <Text style={{ fontWeight: '900', fontSize: 15, color }}>{fmtRadius(RADIUS_STEPS[idx])}</Text>
        <Pressable onPress={() => { haptic(); setOpen(false); }} hitSlop={10} style={{ marginLeft: 4 }}>
          <Ionicons name="close" size={16} color={C.muted} />
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ height: 34, justifyContent: 'center', marginTop: 8, marginHorizontal: 16 }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: C.line }} />
          <View style={{ position: 'absolute', left: 0, height: 6, width: w ? (idx / last) * w : 0, borderRadius: 3, backgroundColor: color }} />
          <View style={{ position: 'absolute', left: w ? (idx / last) * w - 11 : -11, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 3, borderColor: color }} />
        </View>
      </GestureDetector>

      {/* Stufen sitzen genau unter ihrer Position auf der Schiene und sind einzeln antippbar. */}
      <View style={{ height: 16, marginTop: 2, marginHorizontal: 16 }}>
        {RADIUS_STEPS.map((s, i) => (
          <Pressable key={s} onPress={() => select(i)} hitSlop={8} style={{ position: 'absolute', left: w ? (i / last) * w - 16 : -16, width: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: i === idx ? color : C.muted }}>{s < 1 ? '500 m' : `${s} km`}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ fontSize: 11, color: C.muted, marginTop: S.sm }}>{hint}</Text>
      <Text style={{ fontSize: 11, color: C.ink2, fontWeight: '700', marginTop: 2 }}>{footer}</Text>
    </View>
  );
}
