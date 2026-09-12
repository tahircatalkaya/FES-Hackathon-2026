import snapshot from '@/data/vytal-stores.json';
import { hav } from './foodsharing';

/**
 * Vytal (laut Vytal x FES Technical Documentation):
 * - Öffentliche Store-Suche: GraphQL `storeSearch` / `nearestVytalStores` an https://colugo.vytal.org/, Header Authorization: ANONYMOUS
 * - Nutzerzuordnung: POST /api/3/ReferencedAnonUser/Create?userId=...
 * - Checkout: POST /api/3/Containers/Checkout (userId, QR-Liste, transactionId)
 * - Historie: GET /api/3/ContainerHistory/GetUserContainers (showActive/showReturned)
 * - Code prüfen: GET /api/3/Container/CheckCode?code=...
 * - Rückgabe: POST /api/3/Container/ContainerReturn (Store-JWT, codes, transactionId)  → nur Store-seitig, nie vom Endnutzer
 * - Wirkung: GET /api/3/Sustainability/GetUserCo2SavingsForStore?userId=...
 * Die Rückgabe-Bestätigung kommt vom Store. Der Client wertet sie genau einmal je transactionId.
 */
export const VYTAL_GRAPHQL = 'https://colugo.vytal.org/';
export const VYTAL_REST = 'https://merchantapi-dev.vytal.org'; // Doku nennt beide Hosts, dev = Sandbox-Annahme

export interface VytalStore { id: string; name: string; lat: number; lon: number; type: string; address: string; distance_km?: number }

export async function vytalStores(lat: number, lon: number): Promise<{ items: VytalStore[]; source: 'api' | 'snapshot' }> {
  const withDist = (items: VytalStore[]) => items.map((s) => ({ ...s, distance_km: +(hav(lat, lon, s.lat, s.lon) / 1000).toFixed(2) })).sort((a, b) => a.distance_km! - b.distance_km!);
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(VYTAL_GRAPHQL, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'ANONYMOUS' },
      body: JSON.stringify({
        query: 'query ($query: String!, $user_location: LonLatIn, $limit: Int) { storeSearch(query: $query, user_location: $user_location, limit: $limit) { id name lonlat { latitude longitude } store { type location_name } } }',
        variables: { query: '', user_location: { latitude: lat, longitude: lon }, limit: 30 },
      }),
    });
    clearTimeout(t);
    const j = await res.json();
    if (j.errors || !j.data?.storeSearch?.length) throw new Error('graphql');
    return { items: withDist(j.data.storeSearch.map((s: any) => ({ id: s.id, name: s.name, lat: s.lonlat.latitude, lon: s.lonlat.longitude, type: s.store?.type ?? '', address: s.store?.location_name ?? '' }))), source: 'api' };
  } catch {
    return { items: withDist(snapshot as VytalStore[]), source: 'snapshot' };
  }
}

/** Behälter-Code prüfen. Formate laut Doku: Legacy-Codes und URLs; wir akzeptieren beides und normalisieren. */
export function parseContainerCode(raw: string): { code: string; kind: 'bowl' | 'cup' } | null {
  const s = raw.trim();
  const m = s.match(/([A-Z0-9]{6,})$/i);
  if (!m) return null;
  const code = m[1].toUpperCase();
  return { code, kind: /C/.test(code[0]) ? 'cup' : 'bowl' };
}

export function demoContainerCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'B';
  for (let i = 0; i < 7; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
