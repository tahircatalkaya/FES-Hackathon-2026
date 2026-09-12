import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, R, S, shadow } from '@/theme';
import { FUN_FACTS } from '@/data/fes';
import { T } from './ui';

const CLIP = require('../../assets/chami-celebrate.mp4');
const CLIP_RATIO = 848 / 480;

/**
 * Die Posen aus dem Maskottchen-Sheet. `ratio` ist Breite durch Höhe der Datei,
 * `eyes` sind die Augenweiß-Flächen als Anteil des gerenderten Bildes (aus der Vorlage
 * gemessen), `lid` ist die Gesichtsfarbe an der Stelle, mit der das Lid zufällt.
 * Posen mit geschlossenen Augen oder Sonnenbrille haben keine Lider.
 */
const POSES = {
  classic: {
    src: require('../../assets/chami.png'),
    ratio: 1208 / 1302,
    lid: 'rgb(148, 222, 13)',
    lively: false,
    eyes: [
      { left: 0.1918, top: 0.283, width: 0.1897, height: 0.203 },
      { left: 0.5711, top: 0.289, width: 0.1864, height: 0.202 },
    ],
  },
  stand: { src: require('../../assets/chami/stand.png'), ratio: 253 / 318, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.0711, top: 0.3019, width: 0.2134, height: 0.195 }, { left: 0.5415, top: 0.3082, width: 0.2174, height: 0.1981 }] },
  wave: { src: require('../../assets/chami/wave.png'), ratio: 278 / 320, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.2014, top: 0.3062, width: 0.1942, height: 0.1938 }, { left: 0.6151, top: 0.3312, width: 0.1942, height: 0.1969 }] },
  cheer: { src: require('../../assets/chami/cheer.png'), ratio: 274 / 327, lid: undefined, lively: true, eyes: [] },
  thumbs: { src: require('../../assets/chami/thumbs.png'), ratio: 253 / 316, lid: 'rgb(153, 219, 14)', lively: true, eyes: [{ left: 0.0751, top: 0.2911, width: 0.2174, height: 0.2025 }] },
  heart: { src: require('../../assets/chami/heart.png'), ratio: 250 / 319, lid: 'rgb(157, 221, 16)', lively: false, eyes: [{ left: 0.076, top: 0.3135, width: 0.216, height: 0.1944 }, { left: 0.532, top: 0.3166, width: 0.22, height: 0.1975 }] },
  think: { src: require('../../assets/chami/think.png'), ratio: 251 / 309, lid: 'rgb(154, 220, 16)', lively: false, eyes: [{ left: 0.2709, top: 0.3398, width: 0.2151, height: 0.1974 }, { left: 0.6972, top: 0.2718, width: 0.2032, height: 0.1974 }] },
  hello: { src: require('../../assets/chami/hello.png'), ratio: 276 / 309, lid: undefined, lively: true, eyes: [] },
  calm: { src: require('../../assets/chami/calm.png'), ratio: 240 / 308, lid: undefined, lively: false, eyes: [] },
  coffee: { src: require('../../assets/chami/coffee.png'), ratio: 285 / 305, lid: 'rgb(155, 219, 15)', lively: false, eyes: [{ left: 0.2491, top: 0.2754, width: 0.1895, height: 0.2066 }, { left: 0.6491, top: 0.3377, width: 0.1965, height: 0.2066 }] },
  globe: { src: require('../../assets/chami/globe.png'), ratio: 257 / 309, lid: undefined, lively: false, eyes: [] },
  leaf: { src: require('../../assets/chami/leaf.png'), ratio: 292 / 293, lid: 'rgb(153, 220, 15)', lively: false, eyes: [{ left: 0.2295, top: 0.3038, width: 0.1747, height: 0.2082 }, { left: 0.6096, top: 0.2867, width: 0.1952, height: 0.2116 }] },
  backpack: { src: require('../../assets/chami/backpack.png'), ratio: 242 / 291, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.3264, top: 0.2543, width: 0.2355, height: 0.2062 }, { left: 0.781, top: 0.3024, width: 0.1653, height: 0.1959 }] },
  run: { src: require('../../assets/chami/run.png'), ratio: 289 / 291, lid: 'rgb(154, 219, 15)', lively: true, eyes: [{ left: 0.4671, top: 0.354, width: 0.1903, height: 0.2027 }, { left: 0.8339, top: 0.323, width: 0.128, height: 0.1959 }] },
  shock: { src: require('../../assets/chami/shock.png'), ratio: 222 / 282, lid: 'rgb(155, 221, 18)', lively: false, eyes: [{ left: 0.1622, top: 0.2979, width: 0.2477, height: 0.2128 }, { left: 0.6667, top: 0.2979, width: 0.2477, height: 0.2128 }] },
  cool: { src: require('../../assets/chami/cool.png'), ratio: 259 / 291, lid: undefined, lively: false, eyes: [] },
} as const;

export type Pose = keyof typeof POSES;

/** Maskottchen: steht ruhig, atmet, blinzelt. Lebhafte Posen wippen zusätzlich leicht. */
export function ChamiMascot({ pose = 'classic', size = 150, onPress, style }: { pose?: Pose; size?: number; onPress?: () => void; style?: any }) {
  const p = POSES[pose] ?? POSES.classic;
  const width = size * p.ratio;
  const blink = useSharedValue(0);
  const idle = useSharedValue(0);

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
    /** Grundbewegung: wiegt sich langsam hin und her. */
    idle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const swing = p.lively ? 7 : 4;
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (p.lively ? 0.04 : 0.02) * size * (idle.value - 0.5) * 2 },
      { translateY: -0.06 * size * idle.value },
      { rotate: `${-swing / 2 + swing * idle.value}deg` },
      { scale: 1 + 0.03 * idle.value },
    ],
  }));
  const lidStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const body = (
    <Animated.View style={[{ width, height: size }, bodyStyle, style]}>
      <Animated.Image source={p.src} style={{ width, height: size }} resizeMode="contain" />
      {p.eyes.map((e, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              left: e.left * width,
              top: e.top * size,
              width: e.width * width,
              height: e.height * size,
              borderRadius: (e.width * width) / 2,
              backgroundColor: p.lid,
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
