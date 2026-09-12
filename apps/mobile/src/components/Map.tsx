import React, { useEffect, useMemo, useRef, useState } from 'react';
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
      const s = document.createElement('style'); s.innerHTML = '.leaflet-container{font-family:inherit;background:#e9e6dc}.mm{display:flex;align-items:center;justify-content:center;border:3px solid #fff;border-radius:50%;box-shadow:0 6px 16px rgba(0,0,0,.18);font-size:16px}.leaflet-div-icon{background:transparent;border:0}.leaflet-control-attribution{font-size:9px}.sd{box-sizing:border-box;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);position:relative}.sdl{position:absolute;left:15px;top:50%;transform:translateY(-50%);white-space:nowrap;font-size:11px;font-weight:700;line-height:1.3;color:#141A14;background:rgba(255,255,255,.9);border-radius:5px;padding:1px 5px;box-shadow:0 1px 3px rgba(0,0,0,.18)}';
      document.head.appendChild(s);
    }
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => setMods({ rl, L: (L as any).default ?? L }));
  }, []);
  if (!mods) return <View style={[{ flex: 1, backgroundColor: '#E9E6DC' }, props.style]} />;
  return <Inner {...props} rl={mods.rl} L={mods.L} />;
}

/**
 * Steuert die Kamera. Muss auf Modulebene stehen: waere sie in Inner verschachtelt,
 * entstuende bei jedem Render ein neuer Komponententyp, React wuerde neu mounten und
 * Ref und Effekt-Abhaengigkeiten faenden bei jedem GPS-Punkt von vorn an.
 */
function Controller({ rl, center, zoom, follow, recenterKey, onPress, onUserPan }: {
  rl: any; center: { lat: number; lon: number }; zoom: number;
  follow?: { lat: number; lon: number } | null; recenterKey?: number;
  onPress?: (lat: number, lon: number) => void; onUserPan?: () => void;
}) {
  const map = rl.useMap();
  const move = (lat: number, lon: number, z?: number) => map.setView([lat, lon], z ?? map.getZoom(), { animate: true });
  useEffect(() => { if (follow) move(follow.lat, follow.lon); }, [follow?.lat, follow?.lon]);
  useEffect(() => { if (!follow) move(center.lat, center.lon, zoom); }, [center.lat, center.lon, zoom]);
  useEffect(() => { if (recenterKey) { const t = follow ?? center; move(t.lat, t.lon); } }, [recenterKey]);

  /*
   * Eigene Kamerafahrten von echter Eingabe zu trennen, geht nicht ueber ein Zeitfenster:
   * waehrend einer Fahrt kommen GPS-Punkte im Sekundentakt, das Fenster waere immer offen.
   * Deshalb nur Ereignisse, die es ausschliesslich bei Eingabe gibt: Ziehen, Doppeltippen,
   * Mausrad und Zwei-Finger-Geste. `zoomstart`/`movestart` taugen nicht, die feuern auch bei setView.
   */
  const cb = useRef(onUserPan);
  cb.current = onUserPan;
  useEffect(() => {
    const el = map.getContainer();
    const pan = () => cb.current?.();
    const pinch = (e: TouchEvent) => { if (e.touches.length > 1) pan(); };
    map.on('dragstart', pan);
    map.on('dblclick', pan);
    el.addEventListener('wheel', pan, { passive: true });
    el.addEventListener('touchstart', pinch, { passive: true });
    return () => {
      map.off('dragstart', pan);
      map.off('dblclick', pan);
      el.removeEventListener('wheel', pan);
      el.removeEventListener('touchstart', pinch);
    };
  }, [map]);

  rl.useMapEvents({ click: (e: any) => onPress?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Inner({ center, spanKm = 4, markers = [], polylines = [], circles = [], heat = [], userLocation, userColor = '#2F6BFF', style, interactive = true, onPress, follow, onUserPan, recenterKey, rl, L }: MapProps & { rl: any; L: any }) {
  const { MapContainer, TileLayer, Marker, Polyline, Circle } = rl;
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
  // Kleiner Punkt mit Namensschild, z. B. fuer Haltestellen entlang der Strecke.
  const dotIcon = useMemo(() => {
    const cache: Record<string, any> = {};
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return (color: string, label?: string) => {
      const k = color + '|' + (label ?? '');
      if (!cache[k]) cache[k] = L.divIcon({
        html: `<div class="sd" style="background:${color}">${label ? `<span class="sdl">${esc(label)}</span>` : ''}</div>`,
        className: '', iconSize: [12, 12], iconAnchor: [6, 6],
      });
      return cache[k];
    };
  }, [L]);
  const userIcon = useMemo(() => L.divIcon({ html: `<div style="width:22px;height:22px;border-radius:11px;background:${userColor};border:3px solid #fff;box-shadow:0 0 0 6px ${userColor}40"></div>`, className: '', iconSize: [22, 22], iconAnchor: [11, 11] }), [L, userColor]);

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapContainer center={[center.lat, center.lon]} zoom={zoom} style={{ width: '100%', height: '100%' }} zoomControl={false} dragging={interactive} scrollWheelZoom={interactive} doubleClickZoom={interactive} touchZoom={interactive} attributionControl>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap-Mitwirkende' />
        <Controller rl={rl} center={center} zoom={zoom} follow={follow} recenterKey={recenterKey} onPress={onPress} onUserPan={onUserPan} />
        {heat.map((h, i) => <Circle key={`h${i}`} center={[h.lat, h.lon]} radius={80 + h.v * 320} pathOptions={{ color: 'transparent', fillColor: '#7C4DFF', fillOpacity: 0.08 + h.v * 0.35 }} />)}
        {circles.map((c, i) => <Circle key={`c${i}`} center={[c.lat, c.lon]} radius={c.radius} pathOptions={{ color: c.color, fillColor: c.color, fillOpacity: 0.2, weight: 2 }} />)}
        {polylines.map((p, i) => <Polyline key={`p${i}`} positions={p.points} pathOptions={{ color: p.color, weight: p.width ?? 4, dashArray: p.dashed ? '6 6' : undefined, lineCap: 'round' }} />)}
        {markers.map((m) => <Marker key={m.id} position={[m.lat, m.lon]} icon={m.dot ? dotIcon(m.color, m.label) : icons(m.color, m.emoji ?? '●', m.selected)} interactive={!m.dot} eventHandlers={{ click: () => m.onPress?.() }} />)}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />}
      </MapContainer>
    </View>
  );
}
