import React from 'react';
import { View } from 'react-native';
import { ChamiMascot, type Pose } from './ChamiMascot';

export function shade(hex: string, amt: number) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  r = f(r); g = f(g); b = f(b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface Props {
  color?: string;
  size?: number;
  stage?: 1 | 2 | 3 | 4;
  mood?: 'happy' | 'sleepy' | 'excited' | 'thinking';
  lookX?: number;
  style?: any;
  branch?: boolean;
  poke?: number;
  /** Pose aus dem Maskottchen-Sheet, passend zum Screen gewählt. */
  pose?: Pose;
}

/**
 * Chami, das Maskottchen. Es gibt nur noch eine Figur in der App: die gezeichneten Posen
 * aus assets/chami. Farbe und Blickrichtung stecken im Bild, die alten Props bleiben nur
 * erhalten, damit die Aufrufstellen unverändert bleiben.
 */
export default function Chameleon({ size = 180, style, pose = 'stand' }: Props) {
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <ChamiMascot pose={pose} size={size} />
    </View>
  );
}
