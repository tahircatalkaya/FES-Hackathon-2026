import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, R, S, shadow } from '@/theme';
import { FUN_FACTS } from '@/data/fes';
import { T } from './ui';

/** Belohnungsclips je Bereich. Ratio ist Breite durch Höhe der Datei. */
const CLIPS = {
  clean: { src: require('../../assets/chami-celebrate.mp4'), ratio: 848 / 480 },
  food: { src: require('../../assets/chami-food.mp4'), ratio: 1 },
  cup: { src: require('../../assets/chami-cup.mp4'), ratio: 1 },
  ride: { src: require('../../assets/chami-ride.mp4'), ratio: 848 / 480 },
} as const;
export type ClipName = keyof typeof CLIPS;

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
  globe: {
    src: require('../../assets/chami/globe-base.png'),
    /** Der Globus liegt samt Händen auf einer eigenen Ebene und wackelt leicht. */
    hand: { src: require('../../assets/chami/globe-hands.png'), pivotX: 0.6479, pivotY: 0.6845, swing: 4 },
    ratio: 257 / 309,
    lid: undefined,
    lively: false,
    eyes: [],
  },
  leaf: { src: require('../../assets/chami/leaf.png'), ratio: 292 / 293, lid: 'rgb(153, 220, 15)', lively: false, eyes: [{ left: 0.2295, top: 0.3038, width: 0.1747, height: 0.2082 }, { left: 0.6096, top: 0.2867, width: 0.1952, height: 0.2116 }] },
  backpack: { src: require('../../assets/chami/backpack.png'), ratio: 242 / 291, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.3264, top: 0.2543, width: 0.2355, height: 0.2062 }, { left: 0.781, top: 0.3024, width: 0.1653, height: 0.1959 }] },
  run: { src: require('../../assets/chami/run.png'), ratio: 289 / 291, lid: 'rgb(154, 219, 15)', lively: true, eyes: [{ left: 0.4671, top: 0.354, width: 0.1903, height: 0.2027 }, { left: 0.8339, top: 0.323, width: 0.128, height: 0.1959 }] },
  shock: { src: require('../../assets/chami/shock.png'), ratio: 222 / 282, lid: 'rgb(155, 221, 18)', lively: false, eyes: [{ left: 0.1622, top: 0.2979, width: 0.2477, height: 0.2128 }, { left: 0.6667, top: 0.2979, width: 0.2477, height: 0.2128 }] },
  car: {
    src: require('../../assets/chami/car.png'),
    ratio: 560 / 371,
    lid: 'rgb(155, 219, 11)',
    lively: false,
    eyes: [
      { left: 0.4786, top: 0.1806, width: 0.0821, height: 0.1348 },
      { left: 0.65, top: 0.2291, width: 0.0839, height: 0.1429 },
    ],
  },
  cool: { src: require('../../assets/chami/cool.png'), ratio: 259 / 291, lid: undefined, lively: false, eyes: [] },
} as const;

export type Pose = keyof typeof POSES;

/** Maskottchen: steht ruhig, atmet, blinzelt. Lebhafte Posen wippen zusätzlich leicht. */
export function ChamiMascot({ pose = 'classic', size = 150, onPress, style }: { pose?: Pose; size?: number; onPress?: () => void; style?: any }) {
  const p = POSES[pose] ?? POSES.classic;
  const width = size * p.ratio;
  const blink = useSharedValue(0);
  const hand = useSharedValue(0);
  const swing = 'hand' in p ? (p as any).hand.swing : 0;

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
    hand.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, []);

  const handStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-swing / 2 + swing * hand.value}deg` }] }));
  const lidStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const layer = 'hand' in p ? (p as any).hand : null;
  const body = (
    <View style={[{ width, height: size }, style]}>
      <Animated.Image source={p.src} style={{ width, height: size }} resizeMode="contain" />
      {layer ? (
        <Animated.Image
          source={layer.src}
          resizeMode="contain"
          style={[
            { position: 'absolute', width, height: size, transformOrigin: `${layer.pivotX * width}px ${layer.pivotY * size}px` },
            handStyle,
          ]}
        />
      ) : null}
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
    </View>
  );

  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

/** Belohnungsclip zum Einbauen in andere Karten, spielt einmal ab. */
export function ClipPlayer({ clip = 'clean', style }: { clip?: ClipName; style?: any }) {
  const c = CLIPS[clip];
  // Expo owns release/unmount. A later effect cleanup must not touch the released player.
  const player = useVideoPlayer(c.src, (p) => { p.loop = false; p.muted = true; p.play(); });
  return <VideoView player={player} style={[{ width: '100%', aspectRatio: c.ratio }, style]} contentFit="cover" nativeControls={false} />;
}

/** Kachel im Stil einer Lernapp: farbiger Rahmen, Label oben, Wert groß. */
function StatTile({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <Animated.View entering={ZoomIn.duration(240).delay(delay)} style={{ flex: 1, borderRadius: 18, backgroundColor: color, padding: 2 }}>
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
  pending,
  note,
  headline: headlineOverride,
  tileLabel,
  tileValue,
  clip = 'clean',
  onClose,
}: {
  open: boolean;
  points?: number;
  duplicate?: boolean;
  /** Gutschrift wartet auf eine Bestätigung, statt am Tagesdeckel zu hängen. */
  pending?: boolean;
  /** Eigene Erklärung, wenn null Punkte keinen der beiden Standardgründe haben. */
  note?: string;
  /** Eigene Überschrift und Kachel, etwa für eine bestätigte Fahrt ohne neue Punkte. */
  headline?: string;
  tileLabel?: string;
  tileValue?: string;
  clip?: ClipName;
  onClose: () => void;
}) {
  const t = useT();
  const localize = useLocalize();
  const { width } = useWindowDimensions();
  const c = CLIPS[clip];
  const boxWidth = Math.min(width - 2 * S.lg, 520);
  const earned = points ?? 0;
  /** Tipp zum Bereich der Gutschrift, allgemeine Tipps passen überall. */
  const fact = useMemo(() => {
    const pool = FUN_FACTS.filter((f) => !f.topic || f.topic === clip);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [open, clip]);
  const headline = headlineOverride ?? (duplicate ? t('components.celebration.already') : earned > 0 ? t('components.celebration.great') : t('components.celebration.saved'));
  const tile = tileValue ? { label: tileLabel ?? t('components.why.impact'), value: tileValue } : { label: t('components.why.points'), value: duplicate ? '+0' : `+${earned}` };

  useEffect(() => {
    if (!open) return;
    const stop = setTimeout(onClose, 9000);
    return () => clearTimeout(stop);
  }, [open, onClose]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,20,15,0.72)', alignItems: 'center', justifyContent: 'center', padding: S.lg }}>
        <Animated.View entering={ZoomIn.duration(240)} style={[{ width: boxWidth, backgroundColor: '#fff', borderRadius: R.xl, overflow: 'hidden' }, shadow(3)]}>
          {open && <ClipPlayer key={clip} clip={clip} style={{ width: boxWidth, height: boxWidth / c.ratio }} />}

          <View style={{ padding: S.lg, alignItems: 'center' }}>
            <Animated.Text entering={FadeIn.delay(120)} style={{ fontSize: 24, fontWeight: '900', color: C.ink, letterSpacing: -0.4, textAlign: 'center' }}>
              {localize(headline)}
            </Animated.Text>

            <View style={{ flexDirection: 'row', width: 172, marginTop: S.md }}>
              <StatTile label={localize(tile.label)} value={tile.value} color="#FF6A00" delay={180} />
            </View>

            {tileValue ? (
              note ? <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>{localize(note)}</Text> : null
            ) : duplicate ? (
              <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>{t('components.celebration.once')}</Text>
            ) : earned > 0 ? null : (
              <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>
                {note
                  ? localize(note)
                  : pending
                    ? t('components.celebration.pending')
                    : t('components.celebration.cap')}
              </Text>
            )}

            <Animated.View
              entering={FadeIn.delay(460)}
              style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: S.md, padding: S.md, borderRadius: R.md, backgroundColor: C.clean + '12' }}
            >
              <Text style={{ fontSize: 18 }}>{fact.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={T.label}>{localize(fact.label)}</Text>
                <Text style={[T.body, { marginTop: 2 }]}>{localize(fact.text)}</Text>
                {fact.source ? <Text style={[T.small, { marginTop: 4, color: C.muted }]}>{t('components.why.source', { source: localize(fact.source) })}</Text> : null}
              </View>
            </Animated.View>

            <Text style={[T.small, { marginTop: 10, color: C.muted }]}>{t('components.celebration.close')}</Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default ChamiMascot;
