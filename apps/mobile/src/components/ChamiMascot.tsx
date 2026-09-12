import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
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

/** Zwei Ringe laufen ruhig nach außen. Reicht als Signal, ohne zu blinken. */
function Pulse({ children }: { children: React.ReactNode }) {
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    a.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false);
    b.value = withDelay(1100, withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1, false));
  }, []);
  const ringA = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - a.value), transform: [{ scale: 0.62 + 0.75 * a.value }] }));
  const ringB = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - b.value), transform: [{ scale: 0.62 + 0.75 * b.value }] }));
  const ring = { position: 'absolute' as const, width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: C.clean };
  return (
    <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={[ring, ringA]} />
      <Animated.View pointerEvents="none" style={[ring, ringB]} />
      <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: C.clean + '14', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** Belohnung nach einer erledigten Tat: Clip, Punkte, dazu ein Tipp für den Alltag. */
export function CelebrationOverlay({ open, points, duplicate, onClose }: { open: boolean; points?: number; duplicate?: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });
  const boxWidth = Math.min(width - 2 * S.lg, 520);
  const earned = points ?? 0;
  const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], [open]);

  useEffect(() => {
    if (!open) return;
    const start = setTimeout(() => { player.currentTime = 0; player.play(); }, 50);
    const stop = setTimeout(onClose, 9000);
    return () => { clearTimeout(start); clearTimeout(stop); player.pause(); };
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.72)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(15)} style={[{ width: boxWidth, backgroundColor: '#fff', borderRadius: R.xl, overflow: 'hidden' }, shadow(3)]}>
          <VideoView player={player} style={{ width: boxWidth, height: boxWidth / CLIP_RATIO }} contentFit="cover" nativeControls={false} />

          <View style={{ padding: S.lg, alignItems: 'center' }}>
            {duplicate ? (
              <>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Heute schon eingetragen</Text>
                <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>Diese Challenge zählt einmal pro Tag. Morgen wieder.</Text>
              </>
            ) : earned > 0 ? (
              <>
                <Pulse>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: C.ink, letterSpacing: -0.5 }}>+{earned}</Text>
                </Pulse>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Eingetragen, noch keine Punkte</Text>
                <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>Die Punkte kommen, sobald die Teilnahme bestätigt ist.</Text>
              </>
            )}

            <Animated.View
              entering={FadeIn.delay(420)}
              style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: S.lg, padding: S.md, borderRadius: R.md, backgroundColor: C.clean + '12' }}
            >
              <Text style={{ fontSize: 18 }}>{fact.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={T.label}>{fact.label}</Text>
                <Text style={[T.body, { marginTop: 2 }]}>{fact.text}</Text>
                {fact.source ? <Text style={[T.small, { marginTop: 4, color: C.muted }]}>Quelle: {fact.source}</Text> : null}
              </View>
            </Animated.View>

            <Text style={[T.small, { marginTop: 10, color: C.muted }]}>Tippen zum Schließen</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default ChamiMascot;
