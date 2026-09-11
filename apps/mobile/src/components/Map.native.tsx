import React, { useEffect, useRef } from 'react';
import { Platform, Text, View } from 'react-native';
import LeafletWebView from './LeafletWebView';
import MapView, { Circle, Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapProps } from './Map.types';
import { shadow } from '@/theme';

/**
 * Native Karte: Apple Maps auf iOS (kein Key nötig). Android braucht für Google Maps einen API-Key,
 * deshalb dort Leaflet/OSM in einer WebView, identisch zur Web-Version und ohne Key.
 */
export default function Map(props: MapProps) {
  if (Platform.OS !== 'ios') return <LeafletWebView {...props} />;
  return <AppleMap {...props} />;
}

function AppleMap({ center, spanKm = 4, markers = [], polylines = [], circles = [], heat = [], userLocation, style, interactive = true, onPress, follow }: MapProps) {
  const ref = useRef<MapView>(null);
  const delta = spanKm / 111;
  useEffect(() => {
    if (follow && ref.current) ref.current.animateToRegion({ latitude: follow.lat, longitude: follow.lon, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
  }, [follow?.lat, follow?.lon]);
  useEffect(() => {
    if (ref.current && !follow) ref.current.animateToRegion({ latitude: center.lat, longitude: center.lon, latitudeDelta: delta, longitudeDelta: delta }, 500);
  }, [center.lat, center.lon, spanKm]);
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_DEFAULT}
      style={[{ flex: 1 }, style]}
      initialRegion={{ latitude: center.lat, longitude: center.lon, latitudeDelta: delta, longitudeDelta: delta }}
      scrollEnabled={interactive} zoomEnabled={interactive} pitchEnabled={false} rotateEnabled={false}
      showsUserLocation={!!userLocation} showsPointsOfInterests={false} showsCompass={false}
      onPress={(e) => onPress?.(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
    >
      {heat.map((h, i) => (
        <Circle key={`h${i}`} center={{ latitude: h.lat, longitude: h.lon }} radius={80 + h.v * 320} fillColor={`rgba(124,77,255,${0.08 + h.v * 0.35})`} strokeColor="transparent" />
      ))}
      {circles.map((c, i) => (
        <Circle key={`c${i}`} center={{ latitude: c.lat, longitude: c.lon }} radius={c.radius} fillColor={c.color + '33'} strokeColor={c.color} strokeWidth={2} />
      ))}
      {polylines.map((p, i) => (
        <Polyline key={`p${i}`} coordinates={p.points.map(([la, lo]) => ({ latitude: la, longitude: lo }))} strokeColor={p.color} strokeWidth={p.width ?? 4} lineDashPattern={p.dashed ? [6, 6] : undefined} />
      ))}
      {markers.map((m) => (
        <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lon }} onPress={m.onPress} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <View style={{ alignItems: 'center' }}>
            <View style={[{ backgroundColor: m.color, borderRadius: 18, width: m.selected ? 42 : 34, height: m.selected ? 42 : 34, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' }, shadow(2)]}>
              <Text style={{ fontSize: m.selected ? 20 : 16 }}>{m.emoji ?? '●'}</Text>
            </View>
            <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff', marginTop: -2 }} />
          </View>
        </Marker>
      ))}
      {userLocation && (
        <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lon }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#2F6BFF', borderWidth: 3, borderColor: '#fff' }} />
        </Marker>
      )}
    </MapView>
  );
}
