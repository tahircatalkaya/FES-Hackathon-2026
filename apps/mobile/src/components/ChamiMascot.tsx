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

/** Flamme neben der Gutschrift: die einzige Bewegung im Belohnungsfenster. */
function Flame({ size = 26 }: { size?: number }) {
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.92 + 0.16 * f.value }, { translateY: -2 * f.value }, { rotate: `${-4 + 8 * f.value}deg` }] }));
  return <Animated.Text style={[{ fontSize: size }, style]}>🔥</Animated.Text>;
}

/** Belohnung nach einer erledigten Tat: Clip, Punkte, dazu ein Tipp für den Alltag. */
export function CelebrationOverlay({ open, points, onClose }: { open: boolean; title?: string; points?: number; onClose: () => void }) {
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
            {earned > 0 ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Flame />
                  <Text style={{ fontSize: 32, fontWeight: '900', color: C.ink, letterSpacing: -0.5 }}>+{earned}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: C.ink, marginTop: 6, textAlign: 'center' }}>
                  {earned === 1 ? 'Punkt' : 'Punkte'} gutgeschrieben
                </Text>
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
