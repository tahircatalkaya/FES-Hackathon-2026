import React from 'react';
import { Image, View } from 'react-native';

/** Original aus der offiziellen foodsharing-Mediendatenbank, lokal für Offline-Anzeige. */
export default function FoodsharingLogo({ width = 94 }: { width?: number }) {
  return (
    <View style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, flexShrink: 0 }}>
      <Image accessibilityLabel="foodsharing" source={require('../../assets/partners/foodsharing.png')} resizeMode="contain" style={{ width, height: width * 0.37 }} />
    </View>
  );
}
