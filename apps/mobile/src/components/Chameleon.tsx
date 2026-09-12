import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, interpolateColor, useAnimatedProps, useSharedValue, withDelay, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';

const APath = Animated.createAnimatedComponent(Path);
const AEllipse = Animated.createAnimatedComponent(Ellipse);
const ACircle = Animated.createAnimatedComponent(Circle);
const ALine = Animated.createAnimatedComponent(Line);

export function shade(hex: string, amt: number) {
  'worklet';
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface Props {
  color: string;
  size?: number;
  stage?: 1 | 2 | 3 | 4;
  mood?: 'happy' | 'sleepy' | 'excited' | 'thinking';
  lookX?: number; // -1..1
  style?: any;
  branch?: boolean;
  /** Zähler: jede Änderung löst einen Zungenschlag aus */
  poke?: number;
}

/** Kai, das Chamäleon. Nimmt die Farbe des aktiven Kontexts an, blinzelt, atmet, wedelt mit dem Schwanz. */
export default function Chameleon({ color, size = 180, stage = 1, mood = 'happy', lookX = 0.3, style, branch = true, poke = 0 }: Props) {
  const prev = useRef(color);
  const from = useSharedValue(color);
  const to = useSharedValue(color);
  const t = useSharedValue(1);
  const breath = useSharedValue(0);
  const blink = useSharedValue(1);
  const tail = useSharedValue(0);
  const bounce = useSharedValue(0);
  const tongue = useSharedValue(0);

  useEffect(() => {
    from.value = prev.current; to.value = color; t.value = 0;
    t.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    prev.current = color;
  }, [color]);

  useEffect(() => {
    breath.value = withRepeat(withSequence(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) })), -1, false);
    blink.value = withRepeat(withSequence(withDelay(2600, withTiming(0.06, { duration: 90 })), withTiming(1, { duration: 150 }), withDelay(500, withTiming(0.06, { duration: 80 })), withTiming(1, { duration: 150 })), -1, false);
    tail.value = withRepeat(withSequence(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), withTiming(-1, { duration: 2400, easing: Easing.inOut(Easing.quad) })), -1, true);
  }, []);

  useEffect(() => {
    if (poke > 0) tongue.value = withSequence(withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }), withDelay(120, withTiming(0, { duration: 220 })));
  }, [poke]);

  useEffect(() => {
    if (mood === 'excited') bounce.value = withSequence(withTiming(-16, { duration: 170 }), withTiming(0, { duration: 420, easing: Easing.bounce }));
  }, [mood]);

  const fillMain = useAnimatedProps(() => ({ fill: interpolateColor(t.value, [0, 1], [from.value, to.value]) }));
  const fillDark = useAnimatedProps(() => ({ fill: interpolateColor(t.value, [0, 1], [shade(from.value, -0.3), shade(to.value, -0.3)]) }));
  const fillLight = useAnimatedProps(() => ({ fill: interpolateColor(t.value, [0, 1], [shade(from.value, 0.5), shade(to.value, 0.5)]) }));
  const strokeMain = useAnimatedProps(() => ({ stroke: interpolateColor(t.value, [0, 1], [from.value, to.value]) }));
  const strokeDark = useAnimatedProps(() => ({ stroke: interpolateColor(t.value, [0, 1], [shade(from.value, -0.3), shade(to.value, -0.3)]) }));
  const eyeProps = useAnimatedProps(() => ({ ry: 8.5 * blink.value }));
  const tongueProps = useAnimatedProps(() => ({ x2: 186 + tongue.value * 46, opacity: tongue.value > 0.05 ? 1 : 0 }));
  const tongueTipProps = useAnimatedProps(() => ({ cx: 186 + tongue.value * 46, opacity: tongue.value > 0.05 ? 1 : 0 }));
  const pupilProps = useAnimatedProps(() => ({ r: 4.2 * Math.max(0.15, blink.value) }));
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }, { scale: 1 + breath.value * 0.016 }] }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -0.3 * size }, { translateY: 0.08 * size }, { rotate: `${tail.value * 6}deg` }, { translateX: 0.3 * size }, { translateY: -0.08 * size }] }));

  const w = size, h = size * 0.8;
  const px = 168 + lookX * 4;
  const smile = mood === 'sleepy' ? 'M150,86 Q168,88 186,82' : mood === 'excited' ? 'M148,84 Q168,100 188,80' : 'M148,85 Q168,95 188,81';

  return (
    <View style={[{ width: w, height: h }, style]}>
      {/* Schwanz (eigene Ebene, wedelt) */}
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, tailStyle]}>
        <Svg width={w} height={h} viewBox="0 0 200 160">
          <APath animatedProps={strokeMain} d="M62,102 C44,104 26,112 28,128 C30,144 56,146 60,130 C62,118 46,114 42,122 C39,128 46,132 50,129" fill="none" strokeWidth={11} strokeLinecap="round" />
          <APath animatedProps={strokeDark} d="M62,102 C44,104 26,112 28,128 C30,144 56,146 60,130 C62,118 46,114 42,122 C39,128 46,132 50,129" fill="none" strokeWidth={3.5} strokeLinecap="round" opacity={0.5} strokeDasharray="1 9" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, bodyStyle]}>
        <Svg width={w} height={h} viewBox="0 0 200 160">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFE58A" stopOpacity={stage >= 4 ? 0.9 : 0} />
              <Stop offset="100%" stopColor="#FFE58A" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {stage >= 4 && <Circle cx={116} cy={84} r={80} fill="url(#glow)" />}
          {/* Ast */}
          {branch && <G><Line x1={12} y1={140} x2={196} y2={143} stroke="#8B5A2B" strokeWidth={9} strokeLinecap="round" /><Line x1={12} y1={140} x2={196} y2={143} stroke="#A9743F" strokeWidth={3} strokeLinecap="round" opacity={0.6} /></G>}
          {/* Beine */}
          <APath animatedProps={strokeDark} d="M94,116 L86,138" fill="none" strokeWidth={9} strokeLinecap="round" />
          <APath animatedProps={strokeDark} d="M134,114 L140,138" fill="none" strokeWidth={9} strokeLinecap="round" />
          <APath animatedProps={strokeMain} d="M104,118 L98,138" fill="none" strokeWidth={9} strokeLinecap="round" />
          <APath animatedProps={strokeMain} d="M146,112 L152,137" fill="none" strokeWidth={9} strokeLinecap="round" />
          <APath animatedProps={fillDark} d="M80,136 h12 a5,5 0 0 1 0,8 h-12 a5,5 0 0 1 0,-8 Z" />
          <APath animatedProps={fillDark} d="M134,136 h12 a5,5 0 0 1 0,8 h-12 a5,5 0 0 1 0,-8 Z" />
          <APath animatedProps={fillMain} d="M92,136 h12 a5,5 0 0 1 0,8 h-12 a5,5 0 0 1 0,-8 Z" />
          <APath animatedProps={fillMain} d="M146,135 h12 a5,5 0 0 1 0,8 h-12 a5,5 0 0 1 0,-8 Z" />
          {/* Körper */}
          <APath animatedProps={fillMain} d="M58,100 C56,70 92,46 130,50 C154,52 164,68 160,90 C156,112 128,128 96,126 C72,124 60,114 58,100 Z" />
          {/* Rückenkamm */}
          <APath animatedProps={fillDark} d="M78,62 L84,50 L90,60 L98,47 L104,58 L112,45 L118,56 L126,47 L130,58 Z" opacity={0.9} />
          {/* Bauch */}
          <AEllipse animatedProps={fillLight} cx={108} cy={108} rx={36} ry={12} opacity={0.8} />
          {/* Streifen */}
          <APath animatedProps={fillDark} d="M84,66 C90,80 88,98 80,112 L72,108 C80,96 82,80 78,68 Z" opacity={0.5} />
          <APath animatedProps={fillDark} d="M108,56 C114,74 112,96 102,116 L94,114 C104,96 106,76 102,60 Z" opacity={0.5} />
          <APath animatedProps={fillDark} d="M132,56 C136,74 134,92 126,112 L118,110 C126,92 128,74 126,58 Z" opacity={0.4} />
          {/* Kopf */}
          <APath animatedProps={fillMain} d="M138,72 C138,50 160,38 178,46 C194,54 196,78 184,90 C172,100 148,98 140,84 Z" />
          {/* Helm (Casque) */}
          <APath animatedProps={fillDark} d="M144,58 C150,38 172,30 190,44 C182,48 166,50 150,60 Z" />
          {/* Zunge */}
          <ALine animatedProps={tongueProps} x1={184} y1={84} y2={84} stroke="#FF6B8A" strokeWidth={4} strokeLinecap="round" />
          <ACircle animatedProps={tongueTipProps} cy={84} r={3.6} fill="#FF4D73" />
          {/* Mund */}
          <Path d={smile} stroke="#2A1F14" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* Auge (Turm) */}
          <APath animatedProps={fillLight} d="M152,68 C152,54 180,54 180,68 C180,82 152,82 152,68 Z" />
          <AEllipse animatedProps={eyeProps} cx={166} cy={68} rx={8} fill="#FFFFFF" />
          <ACircle animatedProps={pupilProps} cx={px} cy={67} fill="#1E1A14" />
          <Circle cx={px + 1.6} cy={65.5} r={1.5} fill="#fff" />
          <Circle cx={186} cy={76} r={1.6} fill="#2A1F14" opacity={0.6} />
          {/* Stufen-Extras */}
          {stage >= 2 && <G><Path d="M118,44 C114,32 122,26 130,30 C128,38 124,42 118,44 Z" fill="#7CCB4B" /><Path d="M119,43 C122,36 126,32 129,31" stroke="#4C8F2B" strokeWidth={1.2} fill="none" /></G>}
          {stage >= 3 && <G><Path d="M98,46 C92,36 98,28 106,32 C104,40 102,44 98,46 Z" fill="#7CCB4B" /><Path d="M140,42 C142,30 152,28 156,36 C150,40 146,42 140,42 Z" fill="#9BD86B" /></G>}
          {stage >= 4 && <G><Path d="M166,30 L170,20 L174,30 Z" fill="#F5B301" /><Path d="M156,34 L158,25 L163,33 Z" fill="#F5B301" /><Path d="M176,33 L181,25 L183,34 Z" fill="#F5B301" /></G>}
        </Svg>
      </Animated.View>
    </View>
  );
}
