import React, { useEffect } from 'react';
import { Image, Pressable, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { R } from '@/theme';

const STILL = require('../../assets/chami.jpeg');
const CLIP = require('../../assets/chami-celebrate.mp4');

/** Maskottchen als Standbild. */
export function ChamiMascot({ size = 150, onPress }: { size?: number; onPress?: () => void }) {
  const body = <Image source={STILL} style={{ width: size, height: size }} resizeMode="contain" />;
  if (!onPress) return <View style={{ width: size, height: size }}>{body}</View>;
  return <Pressable onPress={onPress} style={{ width: size, height: size }}>{body}</Pressable>;
}

/** Feier-Clip nach einer Aktion. Querformat, deshalb über die volle Breite. */
export function ChamiClip({ height = 160, onDone }: { height?: number; onDone?: () => void }) {
  const player = useVideoPlayer(CLIP, (p) => { p.loop = false; p.muted = true; });

  useEffect(() => {
    let done = false;
    const start = setTimeout(() => { player.currentTime = 0; player.play(); }, 50);
    const stop = setTimeout(() => { if (!done) { done = true; player.pause(); onDone?.(); } }, 6000);
    const sub = player.addListener('playToEnd', () => { if (!done) { done = true; onDone?.(); } });
    return () => { clearTimeout(start); clearTimeout(stop); sub.remove(); };
  }, []);

  return (
    <View style={{ height, borderRadius: R.md, overflow: 'hidden', backgroundColor: '#fff' }}>
      <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />
    </View>
  );
}

export default ChamiMascot;
