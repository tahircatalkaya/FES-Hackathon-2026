import { fs, hav, type ApiSource } from './foodsharing';
import { trust } from './trust';
import { vytalStores } from './vytal';
import { STATIONS } from '@/engine/matching';
import { CLEANUPS, BINS, SAVER_DISTRIBUTIONS } from '@/data/mock';
import type { ContextKey } from '@/theme';

export type Layer = 'food' | 'reuse' | 'mobility' | 'clean';

export interface Opportunity {
  id: string;
  layer: Layer;
  ctx: ContextKey;
  partner: string;
  title: string;
  sub: string;
  lat: number; lon: number;
  distance_m: number;
  emoji: string;
  icon: string; // Ionicons
  href: string;
  availability: 'offen' | 'reserviert' | 'voll' | 'jetzt' | 'bald' | 'unbekannt';
  source: ApiSource | 'gtfs' | 'mock' | 'mainsam';
  verification: 'API' | 'Fahrplan' | 'Simuliert';
}

export interface OppResult { items: Opportunity[]; sources: Record<string, string>; fetchedAt: number }

/** Canonical display names; provider identifiers remain unchanged. */
const STORE_TYPE_LABELS: Record<string, string> = {
  INTERNATIONAL_CHAIN: 'Internationale Gastronomiekette',
  NATIONAL_CHAIN: 'Nationale Gastronomiekette',
  RESTAURANT: 'Restaurant',
  SELF_OPERATED_CANTEEN: 'Selbst betriebene Kantine',
};

export async function getOpportunities(lat: number, lon: number, radiusKm = 3, locale = 'de-DE'): Promise<OppResult> {
  const sources: Record<string, string> = {};
  const items: Opportunity[] = [];
  const d = (a: number, b: number) => Math.round(hav(lat, lon, a, b));

  const joint=Promise.all([trust.hasSession().then(has=>has?trust.offers(2000):[]).catch(()=>[]),trust.shelves(2000).catch(()=>[])]);
  const [fsp, baskets, vytal] = await Promise.all([fs.foodSharePoints(lat, lon, radiusKm * 2), fs.basketsNearby(lat, lon, radiusKm * 2), vytalStores(lat, lon)]);
  sources.foodsharing = fsp.source; sources.baskets = baskets.source; sources.vytal = vytal.source;

  const [offers,shelves]=await joint;
  for(const o of offers.filter(o=>o.endsAt>Date.now())) {
    const centers:Record<string,string>={Bockenheim:'Bockenheimer Warte',Sachsenhausen:'Südbahnhof',Nordend:'Glauburgstraße',Bornheim:'Bornheim Mitte',Gallus:'Galluswarte','Höchst':'Höchst Bahnhof',Ostend:'Ostendstraße',Innenstadt:'Hauptwache'};
    const district=STATIONS.find(d=>d.name===centers[o.area])??STATIONS.find(d=>centers[o.area]&&d.name.includes(centers[o.area]));if(!district)continue;
    items.push({id:`trust-${o.id}`,layer:'food',ctx:'food',partner:'foodsharing',title:o.title,sub:`${o.remaining} von ${o.portions} Portionen frei · ${o.area} · ungefährer Ort`,lat:district.lat,lon:district.lon,distance_m:d(district.lat,district.lon),icon:'people',emoji:'🥕',href:`/uebergaben?area=${encodeURIComponent(o.area)}`,availability:o.remaining?'offen':'voll',source:'mainsam',verification:'API'});
  }
  sources.handoffs=offers.length?'Mainsam · gemeinsame Verteilungen':'Keine gemeinsamen Verteilungen geladen';
  for (const p of fsp.items) items.push({ id: `fsp-${p.id}`, layer: 'food', ctx: 'food', partner: 'foodsharing', title: p.name.replace(/^Abgabestelle\s*/i, '').replace(/"/g, ''), sub: p.name.toLowerCase().includes('abgabe') ? 'Abgabestelle' : 'Fairteiler', lat: p.lat, lon: p.lon, distance_m: d(p.lat, p.lon), icon: 'nutrition', emoji: '🥕', href: `/fairteiler/${p.id}`, availability: 'unbekannt', source: fsp.source, verification: fsp.source === 'api' ? 'API' : 'Simuliert' });
  for(const item of items.filter(i=>i.id.startsWith('fsp-'))) {const report=shelves.find(r=>`fsp-${r.pointId}`===item.id);if(report)item.sub+=` · ${report.fill}, gemeldet ${new Date(report.at).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}`;}
  for (const b of baskets.items) items.push({ id: `bk-${b.id}`, layer: 'food', ctx: 'food', partner: 'foodsharing', title: b.title, sub: `Korb · bis ${b.expires_at ? new Date(b.expires_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '–'}`, lat: b.lat, lon: b.lon, distance_m: d(b.lat, b.lon), icon: 'basket', emoji: '🧺', href: `/korb/${b.id}`, availability: b.status === 'available' ? 'offen' : 'reserviert', source: baskets.source, verification: baskets.source === 'api' ? 'API' : 'Simuliert' });
  for (const s of SAVER_DISTRIBUTIONS) items.push({ id: `dist-${s.id}`, layer: 'food', ctx: 'food', partner: 'foodsharing', title: `Verteilung bei ${s.saver}`, sub: `${new Date(s.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} · ${s.slots - s.taken} Slots frei`, lat: s.lat, lon: s.lon, distance_m: d(s.lat, s.lon), icon: 'people', emoji: '🛒', href: `/verteilung/${s.id}`, availability: s.taken >= s.slots ? 'voll' : s.start < Date.now() + 3600e3 ? 'bald' : 'offen', source: 'mock', verification: 'Simuliert' });
  for (const v of vytal.items) items.push({ id: `vy-${v.id}`, layer: 'reuse', ctx: 'reuse', partner: 'vytal', title: v.name, sub: `${v.address} · ${STORE_TYPE_LABELS[v.type] ?? v.type.replace(/_/g, ' ').toLowerCase()}`, lat: v.lat, lon: v.lon, distance_m: d(v.lat, v.lon), icon: 'cafe', emoji: '🥡', href: `/mehrweg?store=${v.id}`, availability: 'jetzt', source: vytal.source, verification: vytal.source === 'api' ? 'API' : 'Simuliert' });
  for (const s of STATIONS) {
    const dm = d(s.lat, s.lon);
    if (dm <= radiusKm * 1000) items.push({ id: `st-${s.id}`, layer: 'mobility', ctx: 'mobility', partner: 'transdev', title: s.name, sub: 'Haltestelle · Abfahrten ansehen', lat: s.lat, lon: s.lon, distance_m: dm, icon: 'train', emoji: '🚇', href: `/fahrt?station=${s.id}`, availability: 'jetzt', source: 'gtfs', verification: 'Fahrplan' });
  }
  for (const c of CLEANUPS) items.push({ id: `cu-${c.id}`, layer: 'clean', ctx: 'clean', partner: 'fes', title: c.title, sub: `${new Date(c.start).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })} ${new Date(c.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} · ${c.participants} dabei`, lat: c.lat, lon: c.lon, distance_m: d(c.lat, c.lon), icon: 'sparkles', emoji: '🤝', href: `/cleanup/${c.id}`, availability: c.fesConfirmed ? 'unbekannt' : c.start < Date.now() && c.end > Date.now() ? 'jetzt' : 'bald', source: 'mock', verification: 'Simuliert' });
  for (const b of BINS) items.push({ id: `bin-${b.id}`, layer: 'clean', ctx: 'clean', partner: 'fes', title: `${b.kind} ${b.label}`, sub: 'FES-Behälter mit NFC/QR', lat: b.lat, lon: b.lon, distance_m: d(b.lat, b.lon), icon: b.kind === 'Altkleider' ? 'shirt' : 'trash', emoji: b.kind === 'Glascontainer' ? '🍾' : b.kind === 'Altkleider' ? '👕' : b.kind === 'Pfandring' ? '♻️' : '🗑️', href: `/scan?mode=bin&id=${b.id}`, availability: 'jetzt', source: 'mock', verification: 'Simuliert' });

  items.sort((a, b) => a.distance_m - b.distance_m);
  return { items, sources, fetchedAt: Date.now() };
}

export function fmtDist(m: number, locale = 'de-DE') {
  return m < 950
    ? `${(Math.round(m / 10) * 10).toLocaleString(locale)} m`
    : `${(m / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}
export function walkMin(m: number) { return Math.max(1, Math.round(m / 80)); }
