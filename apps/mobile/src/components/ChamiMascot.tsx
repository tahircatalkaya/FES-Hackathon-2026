import React, { useEffect } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, R, S, shadow } from '@/theme';
import { T } from './ui';

const BODY = require('../../assets/chami-body.png');
const HAND = require('../../assets/chami-hand.png');
const CLIP = require('../../assets/chami-celebrate.mp4');
const CLIP_RATIO = 848 / 480;
const LID = 'rgb(148, 222, 13)';

/** Anteile im gerenderten Bild (contain in quadratischer Box, Vorlage 1208x1302). */
const WRIST = { x: -0.27, y: 0.085 };
const EYES = [
  { left: 0.214, top: 0.283, width: 0.176, height: 0.203 },
  { left: 0.566, top: 0.289, width: 0.173, height: 0.202 },
];

/** Maskottchen: steht ruhig, winkt mit der Hand und blinzelt. */
export function ChamiMascot({ size = 150, onPress }: { size?: number; onPress?: () => void }) {
  const wave = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    wave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
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
  }, []);

  const handStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: WRIST.x * size },
      { translateY: WRIST.y * size },
      { rotate: `${-6 + 20 * wave.value}deg` },
      { translateX: -WRIST.x * size },
      { translateY: -WRIST.y * size },
    ],
  }));
  const lidStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const body = (
    <View style={{ width: size, height: size }}>
      <Animated.Image source={BODY} style={{ width: size, height: size }} resizeMode="contain" />
      <Animated.Image source={HAND} style={[{ position: 'absolute', width: size, height: size }, handStyle]} resizeMode="contain" />
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
    </View>
  );

  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

/** Belohnung nach einer erledigten Tat: der Clip füllt seinen Rahmen, darunter steht die Gutschrift. */
export function CelebrationOverlay({ open, title, points, onClose }: { open: boolean; title?: string; points?: number; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });
  const boxWidth = Math.min(width - 2 * S.lg, 520);
  const earned = points ?? 0;

  useEffect(() => {
    if (!open) return;
    let done = false;
    const finish = () => { if (!done) { done = true; onClose(); } };
    const start = setTimeout(() => { player.currentTime = 0; player.play(); }, 50);
    const stop = setTimeout(finish, 7000);
    const sub = player.addListener('playToEnd', finish);
    return () => { clearTimeout(start); clearTimeout(stop); sub.remove(); player.pause(); };
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.72)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(15)} style={[{ width: boxWidth, backgroundColor: '#fff', borderRadius: R.xl, overflow: 'hidden' }, shadow(3)]}>
          <VideoView player={player} style={{ width: boxWidth, height: boxWidth / CLIP_RATIO }} contentFit="cover" nativeControls={false} />
          <Animated.View entering={FadeIn.delay(250)} style={{ padding: S.lg, alignItems: 'center' }}>
            {earned > 0 ? (
              <>
                <Text style={{ fontSize: 22, fontWeight: '900', color: C.success, textAlign: 'center' }}>Du bekommst {earned} {earned === 1 ? 'Punkt' : 'Punkte'}</Text>
                <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>{title}</Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink, textAlign: 'center' }}>Eingetragen, noch keine Punkte</Text>
                <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>{title} · Die Punkte kommen, sobald die Teilnahme bestätigt ist.</Text>
              </>
            )}
            <Text style={[T.small, { marginTop: 10, color: C.muted }]}>Tippen zum Schließen</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default ChamiMascot;
