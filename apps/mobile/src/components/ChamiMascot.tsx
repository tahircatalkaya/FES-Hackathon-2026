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

/** Kachel im Stil einer Lernapp: farbiger Rahmen, Label oben, Wert groß. */
function StatTile({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <Animated.View entering={ZoomIn.springify().damping(13).delay(delay)} style={{ flex: 1, borderRadius: 18, backgroundColor: color, padding: 2 }}>
      <View style={{ borderRadius: 16, backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color, letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ fontSize: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.5, marginTop: 2 }}>{value}</Text>
      </View>
    </Animated.View>
  );
}

/** Belohnung nach einer erledigten Tat: Clip, Bilanz in Kacheln, dazu ein Tipp für den Alltag. */
export function CelebrationOverlay({
  open,
  points,
  duplicate,
  onClose,
}: {
  open: boolean;
  points?: number;
  duplicate?: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });
  const boxWidth = Math.min(width - 2 * S.lg, 520);
  const earned = points ?? 0;
  const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], [open]);
  const headline = duplicate ? 'Heute schon eingetragen' : earned > 0 ? 'Stark gemacht!' : 'Eingetragen';

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
            <Animated.Text entering={FadeIn.delay(120)} style={{ fontSize: 24, fontWeight: '900', color: C.ink, letterSpacing: -0.4, textAlign: 'center' }}>
              {headline}
            </Animated.Text>

            <View style={{ flexDirection: 'row', width: 172, marginTop: S.md }}>
              <StatTile label="PUNKTE" value={duplicate ? '+0' : `+${earned}`} color="#FF6A00" delay={180} />
            </View>

            {duplicate ? (
              <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>Diese Challenge zählt einmal pro Tag. Morgen wieder.</Text>
            ) : earned > 0 ? null : (
              <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>Die Punkte kommen, sobald die Teilnahme bestätigt ist.</Text>
            )}

            <Animated.View
              entering={FadeIn.delay(460)}
              style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: S.md, padding: S.md, borderRadius: R.md, backgroundColor: C.clean + '12' }}
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
