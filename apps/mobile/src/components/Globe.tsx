import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Defs, RadialGradient, Stop, ClipPath } from 'react-native-svg';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Chameleon from './Chameleon';
import { C } from '@/theme';

/** Globus, auf dem Kai reist. Zeigt, wie weit Frankfurt diese Woche gemeinsam nachhaltig unterwegs war. */
export default function Globe({ km, size = 220, color = C.community, label }: { km: number; size?: number; color?: string; label?: string }) {
  const rot = useSharedValue(0);
  useEffect(() => { rot.value = withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1, false); }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const r = size / 2 - 8;
  const circumference = 40075;
  const laps = km / circumference;
  return (
    <View style={{ width: size, height: size + 30, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 30, width: size, height: size }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sea" cx="40%" cy="35%" r="70%"><Stop offset="0%" stopColor="#8FD3FF" /><Stop offset="100%" stopColor="#1F5DB8" /></RadialGradient>
            <ClipPath id="clip"><Circle cx={size / 2} cy={size / 2} r={r} /></ClipPath>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={r + 6} fill={color} opacity={0.12} />
          <Circle cx={size / 2} cy={size / 2} r={r} fill="url(#sea)" />
        </Svg>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, st]}>
          <Svg width={size} height={size}>
            <G clipPath="url(#clip)">
              {/* stilisierte Kontinente */}
              <Path d={`M${size * 0.30},${size * 0.30} c20,-14 46,-10 58,4 c8,10 -2,24 -14,30 c-14,8 -34,6 -44,-6 c-6,-8 -10,-20 0,-28 Z`} fill="#6FCF7A" />
              <Path d={`M${size * 0.55},${size * 0.55} c14,-6 30,0 34,14 c4,14 -8,26 -22,26 c-14,0 -26,-10 -24,-24 c1,-8 6,-13 12,-16 Z`} fill="#6FCF7A" />
              <Path d={`M${size * 0.18},${size * 0.62} c10,-8 26,-6 30,6 c4,12 -8,20 -20,18 c-10,-2 -18,-14 -10,-24 Z`} fill="#8BDC92" />
              <Ellipse cx={size / 2} cy={size / 2} rx={r} ry={r * 0.35} fill="none" stroke="#ffffff55" strokeWidth={1} />
              <Ellipse cx={size / 2} cy={size / 2} rx={r * 0.35} ry={r} fill="none" stroke="#ffffff55" strokeWidth={1} />
            </G>
          </Svg>
        </Animated.View>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff88" strokeWidth={2} />
          <Circle cx={size * 0.35} cy={size * 0.3} r={r * 0.5} fill="#ffffff" opacity={0.08} />
        </Svg>
      </View>
      <View style={{ position: 'absolute', top: -6, left: size / 2 - 40 }}><Chameleon color={color} size={80} branch={false} lookX={0.8} /></View>
      <View style={{ position: 'absolute', bottom: -4, alignItems: 'center' }}>
        <Text style={{ fontWeight: '900', fontSize: 20, color: C.ink }}>{km.toLocaleString('de-DE', { maximumFractionDigits: 0 })} km</Text>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '700' }}>{label ?? `${laps.toFixed(2)}× um die Erde`}</Text>
      </View>
    </View>
  );
}
