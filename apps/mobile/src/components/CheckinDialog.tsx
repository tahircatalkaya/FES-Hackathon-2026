import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { C, CONTEXT, RIDE, shadow } from '@/theme';
import { T, haptic } from './ui';
import { nfcAvailable, readTag, demoTag, type TagInfo } from '@/api/nfc';
import type { Award } from '@/engine/types';
import { BASE } from '@/engine/reward';

const TERMINAL = require('../../assets/checkin/terminal.png');
const PHONE = require('../../assets/checkin/phone.png');
const ACCENT = CONTEXT.mobility.color;
/** Fester Betrag fuer den Check-in. Quelle bleibt die Engine, damit UI und Buchung nie auseinanderlaufen. */
const CHECKIN_POINTS = BASE['ride.checkin'];

/**
 * Terminal-Check-in als Pop-up (portiert aus dem Web-Prototyp).
 * Stufe 1: Handy ans Lesefeld halten, Terminal und Handy animiert.
 * Stufe 2: Konfetti, gelesener Tag, fester Punktbetrag fuer den Check-in.
 * Gebucht wird ueber onCheckin, das intern award() aufruft. Angezeigt wird, was wirklich gutgeschrieben wurde.
 * Echtes NFC wird im Hintergrund gelesen, wenn das Gerät es kann, sonst Simulation.
 */
export default function CheckinDialog({
  open, onClose, onCheckin, onContinue, demoLine = 'U4', headsign, stopName, continueLabel = 'Fahrt starten',
}: {
  open: boolean;
  onClose: () => void;
  /** Bucht den Check-in und gibt die Gutschrift zurueck. Einzige Punktquelle bleibt award(). */
  onCheckin: (t: TagInfo) => Award;
  onContinue: () => void;
  demoLine?: string;
  headsign?: string;
  stopName?: string;
  continueLabel?: string;
}) {
  const [stage, setStage] = useState<'terminal' | 'success'>('terminal');
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [award, setAward] = useState<Award | null>(null);
  const [real, setReal] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage('terminal');
    setTag(null);
    setAward(null);
    let alive = true;
    (async () => {
      const has = await nfcAvailable();
      if (!alive) return;
      setReal(has);
      if (!has) return;
      const t = await readTag();
      if (alive && t) succeed(t);
    })();
    return () => { alive = false; };
  }, [open]);

  function succeed(t: TagInfo) { setTag(t); setAward(onCheckin(t)); setStage('success'); haptic('success'); }

  if (!open) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(16,43,84,0.43)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Klick auf den Hintergrund schliesst, wie beim <dialog>-Backdrop im Web. */}
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} accessibilityLabel="Schliessen" />
        <Appear>
          <View style={[{ backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: C.line, padding: 24 }, shadow(3)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: stage === 'success' ? 0 : 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1.4, color: ACCENT }}>
                {stage === 'success' ? 'SIMULATION' : 'NFC-CHECK-IN'}
              </Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Schliessen"
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 26, lineHeight: 30, color: C.ink2 }}>×</Text>
              </Pressable>
            </View>

            {stage === 'terminal' ? (
              <Terminal
                real={real}
                demoLine={demoLine}
                headsign={headsign}
                stopName={stopName}
                onSimulate={() => succeed(demoTag(demoLine))}
                onCancel={onClose}
              />
            ) : (
              <Success tag={tag!} award={award} label={continueLabel} onContinue={() => { onClose(); onContinue(); }} />
            )}
          </View>
        </Appear>
      </View>
    </Modal>
  );
}

/* ---------- Stufe 1: Terminal ---------- */
function Terminal({ real, demoLine, headsign, stopName, onSimulate, onCancel }: { real: boolean; demoLine: string; headsign?: string; stopName?: string; onSimulate: () => void; onCancel: () => void }) {
  return (
    <View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.6, lineHeight: 31, marginBottom: 12 }}>Bitte am Terminal einchecken</Text>
      <Text style={{ fontSize: 16, lineHeight: 25, color: C.ink2 }}>
        {real ? 'Halte dein Smartphone nah an das Lesefeld des Terminals.' : 'Halte dein Smartphone nah an das Lesefeld des Terminals. Hier simuliert.'}
      </Text>

      <View style={{ marginTop: 22, marginBottom: 18, borderRadius: 20, backgroundColor: C.bg, overflow: 'hidden', alignItems: 'center' }}>
        <Scene />
        <Text style={{ paddingHorizontal: 12, paddingBottom: 16, fontSize: 14, lineHeight: 20, color: C.ink2, textAlign: 'center' }}>Handy kurz ans Lesefeld halten</Text>
      </View>

      <Text style={{ textAlign: 'center', fontSize: 14, lineHeight: 20, color: C.ink2, marginBottom: 18 }}>
        Teste den Check-in mit einer simulierten Fahrt.{'\n'}
        <Text style={{ color: C.muted }}>Simuliertes Terminal: {demoLine}{headsign ? ` Richtung ${headsign}` : ''}{stopName ? ` · ${stopName}` : ''}</Text>
      </Text>

      <Pressable onPress={onSimulate} style={({ pressed }) => ({ backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Check-in simulieren</Text>
      </Pressable>
      <Pressable onPress={onCancel} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: C.muted, fontWeight: '700' }}>Abbrechen</Text>
      </Pressable>
    </View>
  );
}

/** Terminal steht links, das Handy wandert zum Lesefeld, der Ring pulst im Takt (checkin-phone-tap / checkin-reader-pulse). */
function Scene() {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.quad) }), -1, false); }, []);

  const phone = useAnimatedStyle(() => {
    const k = [0, 0.12, 0.4, 0.65, 1];
    return {
      transform: [
        { translateX: interpolate(p.value, k, [12, 12, -34, -34, 12]) },
        { translateY: interpolate(p.value, k, [14, 14, -12, -12, 14]) },
        { rotate: `${interpolate(p.value, k, [8, 8, -9, -9, 8])}deg` },
      ],
    };
  });
  const signal = useAnimatedStyle(() => {
    const k = [0, 0.3, 0.43, 0.65, 0.8, 1];
    return {
      opacity: interpolate(p.value, k, [0, 0, 0.55, 0, 0, 0]),
      transform: [{ scale: interpolate(p.value, k, [0.65, 0.65, 0.75, 1.35, 0.65, 0.65]) }],
    };
  });

  return (
    <View style={{ width: 280, maxWidth: '100%', height: 210 }}>
      <Image source={TERMINAL} style={{ position: 'absolute', width: 150, height: 190, left: 24, top: 12 }} resizeMode="contain" />
      <Animated.View style={[{ position: 'absolute', width: 72, height: 72, left: 60, top: 64, borderWidth: 2, borderColor: RIDE.grey, borderRadius: 36 }, signal]} />
      <Animated.View style={[{ position: 'absolute', left: 166, top: 44 }, phone]}>
        <Image source={PHONE} style={{ width: 92, height: 146 }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

/* ---------- Stufe 2: Erfolg ---------- */
const CONFETTI = [RIDE.red, RIDE.grey, C.gold, RIDE.graphite];

function Success({ tag, award, label, onContinue }: { tag: TagInfo; award: Award | null; label: string; onContinue: () => void }) {
  const pieces = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    x: 5 + ((i * 37) % 90), drift: ((i * 29) % 80) - 40, turn: (i % 2 ? 1 : -1) * (180 + i * 21),
    delay: (i % 6) * 65, color: CONFETTI[i % 4], round: i % 3 === 2,
  })), []);
  const pop = useSharedValue(0.8);
  useEffect(() => { pop.value = withSpring(1, { damping: 9, stiffness: 190 }); }, []);
  const popSt = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ height: 112, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <View style={{ position: 'absolute', top: -12, left: 0, right: 0, height: 160, overflow: 'hidden' }} pointerEvents="none">
          {pieces.map((c, i) => <Confetti key={i} {...c} />)}
        </View>
        <Animated.View style={[{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#EDF5E8', borderWidth: 8, borderColor: '#F6F9F2', alignItems: 'center', justifyContent: 'center' }, popSt]}>
          <Text style={{ fontSize: 40, color: '#3C6B3A', fontWeight: '600' }}>✓</Text>
        </Animated.View>
      </View>

      <Text style={{ fontSize: 25, fontWeight: '800', color: C.ink, letterSpacing: -0.5, textAlign: 'center', marginBottom: 10 }}>Erfolgreich eingecheckt</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: C.ink2, textAlign: 'center', maxWidth: 270 }}>Danke, dass du mit Bus und Bahn unterwegs bist.</Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: C.ink2, textAlign: 'center', marginTop: 10 }}>
        Terminal erkannt: <Text style={{ fontWeight: '800', color: C.ink }}>{tag.line}</Text> · Fahrzeug {tag.vehicle}
      </Text>

      <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 2, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14, marginTop: 22, marginBottom: 10 }}>
        <Text style={{ fontSize: 48, lineHeight: 52, fontWeight: '800', letterSpacing: -2, color: C.success }}>+{award?.points ?? CHECKIN_POINTS}</Text>
        <Text style={{ fontSize: 15, color: C.ink2, textAlign: 'center' }}>Punkte für den Check-in</Text>
      </View>
      <Text style={[T.small, { textAlign: 'center', marginBottom: 16 }]}>
        {award && award.points < CHECKIN_POINTS ? award.formula : `Fester Betrag, unabhängig von Strecke und Dauer. Der Impact deiner Fahrt kommt am Ende dazu.`}
      </Text>

      <Pressable onPress={onContinue} style={({ pressed }) => ({ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{label}</Text>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>→</Text>
      </Pressable>
    </View>
  );
}

function Confetti({ x, drift, turn, delay, color, round }: { x: number; drift: number; turn: number; delay: number; color: string; round: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withDelay(delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) })); }, []);
  const st = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 0.65, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: interpolate(p.value, [0, 1], [0, drift]) },
      { translateY: interpolate(p.value, [0, 1], [-12, 170]) },
      { rotate: `${interpolate(p.value, [0, 1], [0, turn])}deg` },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', top: 0, left: `${x}%`, width: round ? 7 : 6, height: round ? 7 : 11, borderRadius: round ? 4 : 2, backgroundColor: color }, st]} />;
}

/** checkin-appear: 180 ms, leicht von unten. */
function Appear({ children }: { children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }); }, []);
  const st = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: interpolate(p.value, [0, 1], [8, 0]) }] }));
  return <Animated.View style={[{ width: '100%', maxWidth: 392 }, st]}>{children}</Animated.View>;
}
