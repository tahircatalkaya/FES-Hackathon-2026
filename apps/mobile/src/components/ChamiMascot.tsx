import React, { useEffect } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, R, S, shadow } from '@/theme';
import { T } from './ui';

const STILL = require('../../assets/chami.png');
const CLIP = require('../../assets/chami-celebrate.mp4');
const CLIP_RATIO = 848 / 480;

/** Maskottchen als Standbild mit ruhiger Leerlauf-Bewegung. */
export function ChamiMascot({ size = 150, onPress }: { size?: number; onPress?: () => void }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.quad) })), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * t.value },
      { rotate: `${-2.5 + 5 * t.value}deg` },
      { scaleY: 1 + 0.02 * t.value },
    ],
  }));

  const body = <Animated.Image source={STILL} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
  if (!onPress) return <View style={{ width: size, height: size }}>{body}</View>;
  return <Pressable onPress={onPress} style={{ width: size, height: size }}>{body}</Pressable>;
}

/** Belohnung nach einer erledigten Tat: der Clip öffnet sich als Overlay und füllt die Breite. */
export function CelebrationOverlay({ open, title, points, onClose }: { open: boolean; title?: string; points?: number; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });
  const boxWidth = Math.min(width - 2 * S.lg, 520);

  useEffect(() => {
    if (!open) return;
    let done = false;
    const finish = () => { if (!done) { done = true; onClose(); } };
    const start = setTimeout(() => { player.currentTime = 0; player.play(); }, 50);
    const stop = setTimeout(finish, 6500);
    const sub = player.addListener('playToEnd', finish);
    return () => { clearTimeout(start); clearTimeout(stop); sub.remove(); player.pause(); };
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.72)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.springify().damping(15)} style={[{ width: boxWidth, backgroundColor: '#fff', borderRadius: R.xl, overflow: 'hidden' }, shadow(3)]}>
          <VideoView player={player} style={{ width: boxWidth, height: boxWidth / CLIP_RATIO }} contentFit="cover" nativeControls={false} />
          <Animated.View entering={FadeIn.delay(250)} style={{ padding: S.lg, alignItems: 'center' }}>
            {typeof points === 'number' && points > 0 ? (
              <Text style={{ fontSize: 30, fontWeight: '900', color: C.success }}>+{points}</Text>
            ) : null}
            <Text style={[T.h3, { marginTop: 2, textAlign: 'center' }]}>{title ?? 'Stark gemacht'}</Text>
            <Text style={[T.small, { marginTop: 4, textAlign: 'center' }]}>Tippen zum Schließen</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default ChamiMascot;
