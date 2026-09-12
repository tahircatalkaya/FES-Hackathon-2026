import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BLUE = '#17427F';

/** Nachbau der FES-Wortmarke: kursive Lettern mit Schwung darunter. Kein Originalasset, Markenfreigabe steht aus. */
export function FesLogo({ width = 96 }: { width?: number }) {
  const h = width * 0.53;
  return (
    <View style={{ width, height: h, justifyContent: 'center' }} accessibilityRole="image" accessibilityLabel="FES">
      <Svg width={width} height={h} viewBox="0 0 660 350" style={{ position: 'absolute' }}>
        <Path d="M 632,52 A 348,302 0 0 1 92,300 A 362,280 0 0 0 572,18 Z" fill={BLUE} />
      </Svg>
      <Text
        style={{
          fontSize: width * 0.39,
          fontWeight: '900',
          fontStyle: 'italic',
          color: BLUE,
          letterSpacing: -width * 0.012,
          marginTop: -h * 0.16,
          marginLeft: width * 0.02,
        }}
      >
        FES
      </Text>
    </View>
  );
}

export default FesLogo;
