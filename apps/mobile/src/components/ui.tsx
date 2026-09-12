import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp, useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { C, R, S, shadow, STATUS_COLORS } from '@/theme';

const ACircle = Animated.createAnimatedComponent(Circle);

export function haptic(kind: 'light' | 'success' | 'warn' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (kind === 'warn') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export const T = {
  h1: { fontSize: 30, fontWeight: '800', color: C.ink, letterSpacing: -0.6 } as TextStyle,
  h2: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.4 } as TextStyle,
  h3: { fontSize: 17, fontWeight: '700', color: C.ink } as TextStyle,
  body: { fontSize: 15, color: C.ink2, lineHeight: 21 } as TextStyle,
  small: { fontSize: 13, color: C.muted, lineHeight: 18 } as TextStyle,
  label: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 } as TextStyle,
};

export function Card({ children, style, onPress, tint }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; onPress?: () => void; tint?: string }) {
  const sc = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const inner = (
    <Animated.View style={[styles.card, shadow(1), tint ? { backgroundColor: tint } : null, st, style]}>{children}</Animated.View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPressIn={() => (sc.value = withSpring(0.975))} onPressOut={() => (sc.value = withSpring(1))} onPress={() => { haptic(); onPress(); }}>
      {inner}
    </Pressable>
  );
}

export function Pill({ label, color = C.ink, active, onPress, icon }: { label: string; color?: string; active?: boolean; onPress?: () => void; icon?: string }) {
  return (
    <Pressable onPress={onPress ? () => { haptic(); onPress(); } : undefined} style={[styles.pill, { borderColor: active ? color : C.line, backgroundColor: active ? color : '#fff' }]}>
      {icon ? <Text style={{ fontSize: 13 }}>{icon} </Text> : null}
      <Text style={{ color: active ? '#fff' : C.ink2, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, color = C.ink, variant = 'solid', disabled, icon, style }: { label: string; onPress?: () => void; color?: string; variant?: 'solid' | 'ghost' | 'soft'; disabled?: boolean; icon?: string; style?: ViewStyle }) {
  const sc = useSharedValue(1);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const bg = variant === 'solid' ? color : variant === 'soft' ? color + '1A' : 'transparent';
  const fg = variant === 'solid' ? '#fff' : color;
  return (
    <Pressable disabled={disabled} onPressIn={() => (sc.value = withSpring(0.96))} onPressOut={() => (sc.value = withSpring(1))} onPress={() => { haptic(); onPress?.(); }}>
      <Animated.View style={[styles.btn, { backgroundColor: bg, borderColor: variant === 'ghost' ? color : 'transparent', opacity: disabled ? 0.45 : 1 }, st, style]}>
        {icon ? <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text> : null}
        <Text style={{ color: fg, fontWeight: '800', fontSize: 16 }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const col = STATUS_COLORS[status] ?? C.muted;
  return (
    <View style={[styles.badge, { backgroundColor: col + '1F', paddingVertical: small ? 2 : 4 }]}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: col, marginRight: 6 }} />
      <Text style={{ color: col, fontWeight: '800', fontSize: small ? 11 : 12 }}>{status}</Text>
    </View>
  );
}

export function Tag({ label, color = C.muted }: { label: string; color?: string }) {
  return <View style={[styles.badge, { backgroundColor: color + '1A' }]}><Text style={{ color, fontWeight: '700', fontSize: 11 }}>{label}</Text></View>;
}

export function SectionTitle({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: S.md, marginTop: S.xl }, style]}>
      <Text style={T.h2}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={{ color: C.info, fontWeight: '700' }}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function Ring({ progress, size = 88, stroke = 10, color = C.info, track = '#EDEBE3', children }: { progress: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 1100, easing: Easing.out(Easing.cubic) }); }, [progress]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <ACircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
      </Svg>
      {children}
    </View>
  );
}

export function Counter({ value, style, suffix = '', decimals = 0 }: { value: number; style?: TextStyle; suffix?: string; decimals?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf: any; const start = Date.now(); const from = shown; const dur = 900;
    const tick = () => { const k = Math.min(1, (Date.now() - start) / dur); const e = 1 - Math.pow(1 - k, 3); setShown(from + (value - from) * e); if (k < 1) raf = setTimeout(tick, 16); };
    tick();
    return () => clearTimeout(raf);
  }, [value]);
  return <Text style={style}>{shown.toFixed(decimals)}{suffix}</Text>;
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View entering={FadeInUp.springify().damping(18)} style={[styles.sheet, shadow(3)]}>
        <View style={styles.grip} />
        {title ? <Text style={[T.h2, { marginBottom: S.md }]}>{title}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>{children}</ScrollView>
      </Animated.View>
    </Modal>
  );
}

export function Row({ children, style, gap = S.sm }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Appear({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  return <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={style}>{children}</Animated.View>;
}

export function Divider() { return <View style={{ height: 1, backgroundColor: C.line, marginVertical: S.md }} />; }

export function Stat({ label, value, color = C.ink, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[T.label]}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color, marginTop: 2 }}>{value}</Text>
      {sub ? <Text style={T.small}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: S.lg },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, borderWidth: 1.5, marginRight: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 22, borderRadius: R.md, borderWidth: 1.5 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 9, borderRadius: R.pill, paddingVertical: 4 },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(15,20,15,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: S.xl, paddingTop: S.md, maxHeight: '88%' },
  grip: { width: 44, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: 'center', marginBottom: S.lg },
});
