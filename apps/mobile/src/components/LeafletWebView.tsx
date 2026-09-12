import { useT } from '@/i18n/useT';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { MapProps } from './Map.types';
import { LEAFLET_CSS } from './leafletCss';
import { LEAFLET_JS } from './leafletJs';

/**
 * Karte in einer WebView (Leaflet + OpenStreetMap/CARTO-Kacheln). Braucht keinen Google-Maps-Key,
 * läuft in Expo Go auf Android und iOS identisch zur Web-Version.
 */
export default function LeafletWebView({ center, spanKm = 4, markers = [], polylines = [], circles = [], heat = [], userLocation, userColor = '#2F6BFF', style, interactive = true, onPress, follow, onUserPan, recenterKey }: MapProps) {
  const t = useT();
  const attribution = t('components.map.attribution');
  const ref = useRef<WebView>(null);
  const handlers = useRef<Record<string, (() => void) | undefined>>({});
  handlers.current = Object.fromEntries(markers.map((m) => [m.id, m.onPress]));
  const zoom = Math.round(14.2 - Math.log2(spanKm / 3));

  const html = useMemo(() => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>${LEAFLET_CSS}</style>
<style>html,body,#m{margin:0;height:100%;background:#e9e6dc;font-family:-apple-system,Roboto,sans-serif}.mm{display:flex;align-items:center;justify-content:center;border:3px solid #fff;border-radius:50%;box-shadow:0 6px 16px rgba(0,0,0,.18);font-size:16px}.leaflet-div-icon{background:transparent;border:0}.leaflet-control-attribution{font-size:9px}.u{width:22px;height:22px;border-radius:11px;background:#2F6BFF;border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,107,255,.25)}.sd{box-sizing:border-box;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);position:relative}.sdl{position:absolute;left:15px;top:50%;transform:translateY(-50%);white-space:nowrap;font-size:11px;font-weight:700;line-height:1.3;color:#141A14;background:rgba(255,255,255,.9);border-radius:5px;padding:1px 5px;box-shadow:0 1px 3px rgba(0,0,0,.18)}</style>
</head><body><div id="m"></div><script>${LEAFLET_JS}</script>
<script>
var map=L.map('m',{zoomControl:false,attributionControl:true,dragging:${interactive},scrollWheelZoom:${interactive},doubleClickZoom:${interactive},touchZoom:${interactive},tap:${interactive}}).setView([${center.lat},${center.lon}],${zoom});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:${JSON.stringify(attribution)},maxZoom:19}).addTo(map);
var layer=L.layerGroup().addTo(map);var userM=null;var post=function(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o))};
var lastRk=0,lastC=null,lastF='';
function move(lat,lon,z){map.setView([lat,lon],z==null?map.getZoom():z,{animate:true})}
// Nur Ereignisse, die es ausschliesslich bei echter Eingabe gibt. movestart/zoomstart feuern
// auch bei setView und waeren waehrend einer Fahrt dauernd aktiv.
var el=map.getContainer();var userPan=function(){post({type:'userpan'})};
map.on('dragstart',userPan);
map.on('dblclick',userPan);
el.addEventListener('wheel',userPan,{passive:true});
el.addEventListener('touchstart',function(e){if(e.touches&&e.touches.length>1)userPan()},{passive:true});
map.on('click',function(e){post({type:'press',lat:e.latlng.lat,lon:e.latlng.lng})});
function icon(c,e,s){var z=s?42:34;return L.divIcon({html:'<div class="mm" style="background:'+c+';width:'+z+'px;height:'+z+'px;font-size:'+(s?20:16)+'px">'+e+'</div>',className:'',iconSize:[z,z],iconAnchor:[z/2,z/2]})}
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
// Kleiner Punkt mit Namensschild, z. B. fuer Haltestellen entlang der Strecke.
function dot(c,l){return L.divIcon({html:'<div class="sd" style="background:'+c+'">'+(l?'<span class="sdl">'+esc(l)+'</span>':'')+'</div>',className:'',iconSize:[12,12],iconAnchor:[6,6]})}
window.update=function(d){layer.clearLayers();
 d.heat.forEach(function(h){L.circle([h.lat,h.lon],{radius:80+h.v*320,color:'transparent',fillColor:'#7C4DFF',fillOpacity:0.08+h.v*0.35}).addTo(layer)});
 d.circles.forEach(function(c){L.circle([c.lat,c.lon],{radius:c.radius,color:c.color,fillColor:c.color,fillOpacity:0.2,weight:2}).addTo(layer)});
 d.polylines.forEach(function(p){L.polyline(p.points,{color:p.color,weight:p.width||4,dashArray:p.dashed?'6 6':null,lineCap:'round'}).addTo(layer)});
 d.markers.forEach(function(m){if(m.dot){L.marker([m.lat,m.lon],{icon:dot(m.color,m.label),interactive:false}).addTo(layer)}else{L.marker([m.lat,m.lon],{icon:icon(m.color,m.emoji||'●',m.selected)}).on('click',function(){post({type:'marker',id:m.id})}).addTo(layer)}});
 if(d.user){L.marker([d.user.lat,d.user.lon],{icon:L.divIcon({html:'<div class="u" style="background:'+d.userColor+';box-shadow:0 0 0 6px '+d.userColor+'40"></div>',className:'',iconSize:[22,22],iconAnchor:[11,11]}),interactive:false}).addTo(layer)}
 // center bei JEDEM Paket mitschreiben. Sonst gilt es beim ersten Paket ohne follow
 // als veraendert und die Kamera springt zurueck, obwohl gerade jemand selbst geschoben hat.
 var kc=d.center.lat+','+d.center.lon+','+d.zoom;var moved=lastC!==null&&kc!==lastC;lastC=kc;
 if(d.recenterKey&&d.recenterKey!==lastRk){lastRk=d.recenterKey;var t=d.follow||d.center;move(t.lat,t.lon)}
 else if(d.follow){var kf=d.follow.lat+','+d.follow.lon;if(kf!==lastF){lastF=kf;move(d.follow.lat,d.follow.lon)}}
 else if(moved){move(d.center.lat,d.center.lon,d.zoom)}
};
post({type:'ready'});
</script></body></html>`, [attribution]);

  const payload = JSON.stringify({ center, zoom, markers: markers.map(({ onPress: _o, ...m }) => m), polylines, circles, heat, user: userLocation ?? null, userColor, follow: follow ?? null, recenterKey: recenterKey ?? 0 });
  useEffect(() => { ref.current?.injectJavaScript(`window.update && window.update(${payload}); true;`); }, [payload]);

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <WebView
        ref={ref}
        source={{ html, baseUrl: 'https://mainsam.local/' }}
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: '#e9e6dc' }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'ready') ref.current?.injectJavaScript(`window.update && window.update(${payload}); true;`);
            else if (msg.type === 'marker') handlers.current[msg.id]?.();
            else if (msg.type === 'press') onPress?.(msg.lat, msg.lon);
            else if (msg.type === 'userpan') onUserPan?.();
          } catch {}
        }}
      />
    </View>
  );
}
