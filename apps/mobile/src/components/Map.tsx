import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { MapProps } from './Map.types';
import { LEAFLET_CSS } from './leafletCss';

/**
 * Web-Karte auf Basis von OpenStreetMap + Leaflet (react-leaflet).
 * Wird nur im Browser gerendert; native Plattformen nutzen Map.native.tsx (react-native-maps).
 */
export default function Map(props: MapProps) {
  const [mods, setMods] = useState<any>(null);
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const l = document.createElement('style'); l.id = 'leaflet-css'; l.innerHTML = LEAFLET_CSS; document.head.appendChild(l);
      const s = document.createElement('style'); s.innerHTML = '.leaflet-container{font-family:inherit;background:#e9e6dc}.mm{display:flex;align-items:center;justify-content:center;border:3px solid #fff;border-radius:50%;box-shadow:0 6px 16px rgba(0,0,0,.18);font-size:16px}.leaflet-div-icon{background:transparent;border:0}.leaflet-control-attribution{font-size:9px}';
      document.head.appendChild(s);
    }
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => setMods({ rl, L: (L as any).default ?? L }));
  }, []);
  if (!mods) return <View style={[{ flex: 1, backgroundColor: '#E9E6DC' }, props.style]} />;
  return <Inner {...props} rl={mods.rl} L={mods.L} />;
}

function Inner({ center, spanKm = 4, markers = [], polylines = [], circles = [], heat = [], userLocation, style, interactive = true, onPress, follow, rl, L }: MapProps & { rl: any; L: any }) {
  const { MapContainer, TileLayer, Marker, Polyline, Circle, useMap, useMapEvents } = rl;
  const zoom = Math.round(14.2 - Math.log2(spanKm / 3));
  const icons = useMemo(() => {
    const cache: Record<string, any> = {};
    return (color: string, emoji: string, selected?: boolean) => {
      const k = color + emoji + (selected ? 's' : '');
      if (!cache[k]) {
        const size = selected ? 42 : 34;
        cache[k] = L.divIcon({ html: `<div class="mm" style="background:${color};width:${size}px;height:${size}px;font-size:${selected ? 20 : 16}px">${emoji}</div>`, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
      }
      return cache[k];
    };
  }, [L]);
  const userIcon = useMemo(() => L.divIcon({ html: '<div style="width:22px;height:22px;border-radius:11px;background:#2F6BFF;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,107,255,.25)"></div>', className: '', iconSize: [22, 22], iconAnchor: [11, 11] }), [L]);

  function Controller() {
    const map = useMap();
    useEffect(() => { if (follow) map.setView([follow.lat, follow.lon], Math.max(map.getZoom(), 15), { animate: true }); }, [follow?.lat, follow?.lon]);
    useEffect(() => { if (!follow) map.setView([center.lat, center.lon], zoom, { animate: true }); }, [center.lat, center.lon, zoom]);
    useMapEvents({ click: (e: any) => onPress?.(e.latlng.lat, e.latlng.lng) });
    return null;
  }

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapContainer center={[center.lat, center.lon]} zoom={zoom} style={{ width: '100%', height: '100%' }} zoomControl={false} dragging={interactive} scrollWheelZoom={interactive} doubleClickZoom={interactive} touchZoom={interactive} attributionControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap, &copy; CARTO' />
        <Controller />
        {heat.map((h, i) => <Circle key={`h${i}`} center={[h.lat, h.lon]} radius={80 + h.v * 320} pathOptions={{ color: 'transparent', fillColor: '#7C4DFF', fillOpacity: 0.08 + h.v * 0.35 }} />)}
        {circles.map((c, i) => <Circle key={`c${i}`} center={[c.lat, c.lon]} radius={c.radius} pathOptions={{ color: c.color, fillColor: c.color, fillOpacity: 0.2, weight: 2 }} />)}
        {polylines.map((p, i) => <Polyline key={`p${i}`} positions={p.points} pathOptions={{ color: p.color, weight: p.width ?? 4, dashArray: p.dashed ? '6 6' : undefined, lineCap: 'round' }} />)}
        {markers.map((m) => <Marker key={m.id} position={[m.lat, m.lon]} icon={icons(m.color, m.emoji ?? '●', m.selected)} eventHandlers={{ click: () => m.onPress?.() }} />)}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />}
      </MapContainer>
    </View>
  );
}
