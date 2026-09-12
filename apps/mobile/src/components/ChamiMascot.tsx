import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, R, S, shadow } from '@/theme';
import { FUN_FACTS } from '@/data/fes';
import { T } from './ui';

const CHAMI = require('../../assets/chami.png');
const CLIP = require('../../assets/chami-celebrate.mp4');
const CLIP_RATIO = 848 / 480;
const LID = 'rgb(148, 222, 13)';

/** Augenanteile im gerenderten Bild (contain in quadratischer Box, Vorlage 1208x1302). */
const EYES = [
  { left: 0.214, top: 0.283, width: 0.176, height: 0.203 },
  { left: 0.566, top: 0.289, width: 0.173, height: 0.202 },
];

/** Maskottchen: steht ruhig, atmet leicht und blinzelt. Die Hand bleibt, wie sie gezeichnet ist. */
export function ChamiMascot({ size = 150, onPress, style }: { size?: number; onPress?: () => void; style?: any }) {
  const blink = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withDelay(2800, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 110 }),
        withDelay(220, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 110 }),
      ),
      -1,
      false,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -0.012 * size * breath.value }, { scale: 1 + 0.012 * breath.value }] }));
  const lidStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const body = (
    <Animated.View style={[{ width: size, height: size }, bodyStyle, style]}>
      <Animated.Image source={CHAMI} style={{ width: size, height: size }} resizeMode="contain" />
      {EYES.map((e, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              left: e.left * size,
              top: e.top * size,
              width: e.width * size,
              height: e.height * size,
              borderRadius: (e.width * size) / 2,
              backgroundColor: LID,
              transformOrigin: 'top',
            },
            lidStyle,
          ]}
        />
      ))}
    </Animated.View>
  );

  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

const SPARK = ['#FFB300', '#FF6A00', '#FF3B30', '#7CCB4B', '#2F6BFF', '#FFD54F'];

/** Ein Konfettiteilchen, das aus der Mitte nach oben schießt und wieder fällt. */
function Confetti({ index, width }: { index: number; width: number }) {
  const p = useSharedValue(0);
  const conf = useMemo(() => {
    const rnd = (n: number) => ((Math.sin(index * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
    return {
      x: (rnd(1) - 0.5) * width * 0.9,
      rise: 90 + rnd(2) * 130,
      drift: (rnd(3) - 0.5) * 80,
      delay: rnd(4) * 420,
      size: 7 + rnd(5) * 7,
      spin: 240 + rnd(6) * 540,
      color: SPARK[Math.floor(rnd(7) * SPARK.length)],
      round: rnd(8) > 0.6,
    };
  }, [index, width]);

  useEffect(() => {
    p.value = withDelay(conf.delay, withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    /** Wurfparabel: erst hoch, dann runter. */
    const y = -conf.rise * (4 * t * (1 - t)) + 150 * t * t;
    return {
      opacity: t > 0.75 ? (1 - t) / 0.25 : 1,
      transform: [{ translateX: conf.x + conf.drift * t }, { translateY: y }, { rotate: `${conf.spin * t}deg` }, { scale: 0.6 + 0.4 * Math.min(1, t * 4) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: conf.size, height: conf.round ? conf.size : conf.size * 1.7, borderRadius: conf.round ? conf.size : 2, backgroundColor: conf.color },
        style,
      ]}
    />
  );
}

/** Flamme, die pulsiert. */
function Flame({ delay, size = 22 }: { delay: number; size?: number }) {
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 420 }), withTiming(0, { duration: 420 })), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.88 + 0.28 * f.value }, { translateY: -3 * f.value }] }));
  return <Animated.Text style={[{ fontSize: size }, style]}>🔥</Animated.Text>;
}

/** Belohnung nach einer erledigten Tat: Clip, Punkte mit Feuer, dazu ein Tipp für den Alltag. */
export function CelebrationOverlay({ open, title, points, onClose }: { open: boolean; title?: string; points?: number; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });
  const boxWidth = Math.min(width - 2 * S.lg, 520);
  const earned = points ?? 0;
  const [count, setCount] = useState(0);
  const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], [open]);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!open) { setCount(0); return; }
    const start = setTimeout(() => { player.currentTime = 0; player.play(); }, 50);
    /** Punkte zählen hoch, das macht die Gutschrift sichtbar. */
    let n = 0;
    const step = setInterval(() => {
      n += Math.max(1, Math.ceil(earned / 14));
      if (n >= earned) { n = earned; clearInterval(step); }
      setCount(n);
    }, 45);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1, false);
    const stop = setTimeout(onClose, 9000);
    return () => { clearTimeout(start); clearTimeout(stop); clearInterval(step); player.pause(); };
  }, [open]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + 0.35 * glow.value, transform: [{ scale: 1 + 0.12 * glow.value }] }));

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.72)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(15)} style={[{ width: boxWidth, backgroundColor: '#fff', borderRadius: R.xl, overflow: 'hidden' }, shadow(3)]}>
          <VideoView player={player} style={{ width: boxWidth, height: boxWidth / CLIP_RATIO }} contentFit="cover" nativeControls={false} />

          <View style={{ padding: S.lg, alignItems: 'center' }}>
            {earned > 0 ? (
              <>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={[{ position: 'absolute', width: boxWidth * 0.62, height: 74, borderRadius: 40, backgroundColor: '#FF6A00' }, glowStyle]} />
                  <Animated.View entering={ZoomIn.springify().damping(9).delay(150)}>
                    <LinearGradient
                      colors={['#FFB300', '#FF6A00', '#FF2D55']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 12, borderRadius: R.pill }}
                    >
                      <Flame delay={0} />
                      <Text style={{ fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>+{count}</Text>
                      <Flame delay={210} />
                    </LinearGradient>
                  </Animated.View>
                  {open && Array.from({ length: 16 }).map((_, i) => <Confetti key={i} index={i} width={boxWidth} />)}
                </View>
                <Text style={{ fontSize: 17, fontWeight: '900', color: C.ink, marginTop: 12, textAlign: 'center' }}>
                  {earned === 1 ? 'Punkt' : 'Punkte'} gutgeschrieben
                </Text>
                <Text style={[T.small, { marginTop: 2, textAlign: 'center' }]}>{title}</Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Eingetragen, noch keine Punkte</Text>
                <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>{title} · Die Punkte kommen, sobald die Teilnahme bestätigt ist.</Text>
              </>
            )}

            <Animated.View
              entering={FadeInDown.delay(500)}
              style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: S.lg, padding: S.md, borderRadius: R.md, backgroundColor: C.clean + '12' }}
            >
              <Text style={{ fontSize: 20 }}>{fact.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={T.label}>{fact.label}</Text>
                <Text style={[T.body, { marginTop: 2 }]}>{fact.text}</Text>
                {fact.source ? <Text style={[T.small, { marginTop: 4, color: C.muted }]}>Quelle: {fact.source}</Text> : null}
              </View>
            </Animated.View>

            <Animated.Text entering={FadeIn.delay(900)} style={[T.small, { marginTop: 10, color: C.muted }]}>Tippen zum Schließen</Animated.Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default ChamiMascot;
