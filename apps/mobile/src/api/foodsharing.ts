import { isNetworkError } from './network';
import { haversine as hav } from '../engine/geo.ts';
export { haversine as hav } from '../engine/geo.ts';
import fairteilerSnapshot from '@/data/fairteiler.json';

/**
 * Foodsharing-Hackathon-API (Sandbox). Der Team-Key liegt für den Hackathon im Client;
 * in Produktion gehört er serverseitig hinter einen eigenen Endpunkt.
 */
export const FS_BASE = 'https://app-foodsharing-hackathon.azurewebsites.net';
export const FS_KEY = 'team_01_82a18acf2b7ff59986a00306f8af8939';

export interface FoodSharePoint { id: number; name: string; description: string | null; address: string | null; lat: number; lon: number; opening_hours: string | null; region_id?: number; distance_km: number | null }
export interface Basket { id: number; title: string; description?: string | null; food_types?: string[] | null; lat: number; lon: number; status: string; created_by_user_id?: number; created_at?: string; expires_at?: string; distance_km?: number | null; requests?: { requester_id: number; status: string; requested_at: string }[] }
export interface FsUser { id: number; display_name: string; team_id: number; team_name?: string; is_default: boolean; joined_at?: string; pickups_completed?: number; trial_pickups_completed?: number; verification?: Verification }
export interface Verification { status?: string; quiz_passed?: boolean; trial_pickups_completed?: number; trial_pickups_required?: number; mentor_approved?: boolean; is_verified?: boolean; may_pick_up?: boolean; may_pick_up_from_business?: boolean; may_earn_rewards?: boolean }
export interface Pickup { id?: number; person?: string; source: 'basket' | 'food_share_point' | 'business'; picked_up_at: string; was_trial: boolean; food_share_point_id?: number | null; food_share_point_name?: string | null; basket_id?: number | null; basket_title?: string | null; business_id?: number | null; business_name?: string | null; lat?: number; lon?: number }

export type ApiSource = 'api' | 'snapshot' | 'demo';

async function call<T>(path: string, init: RequestInit = {}, userId?: number, timeoutMs = 7000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(FS_BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: { 'X-API-Key': FS_KEY, 'Content-Type': 'application/json', ...(userId ? { 'X-User-ID': String(userId) } : {}), ...(init.headers ?? {}) },
    });
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) {
      const err: any = new Error(humanError(res.status, body));
      err.status = res.status; err.body = body;
      throw err;
    }
    return body as T;
  } catch(error:unknown) {
    if(isNetworkError(error,ctrl.signal))throw new Error('Foodsharing gerade nicht erreichbar. Bitte Verbindung prüfen und neu laden. Foto, Audio und eigene Eingaben bleiben verfügbar.');
    throw error;
  } finally { clearTimeout(t); }
}

export function humanError(status: number, body: any) {
  const detail = body?.detail?.message ?? body?.detail?.error ?? (typeof body?.detail === 'string' ? body.detail : null);
  const map: Record<number, string> = {
    400: 'Das ist dein eigener Korb. Eigene Körbe kann man nicht anfragen.',
    401: 'Team-Schlüssel fehlt oder ist ungültig.',
    403: 'Dafür fehlt die Verifikation oder die Rolle.',
    404: 'Nicht (mehr) vorhanden.',
    409: 'Zustand hat sich geändert: schon reserviert, abgeholt oder abgelaufen.',
    422: 'Ungültige Eingabe.',
  };
  return `${map[status] ?? `Fehler ${status}`}${detail ? ` (${detail})` : ''}`;
}

export const fs = {
  async foodSharePoints(lat?: number, lon?: number, distance_km = 10): Promise<{ items: FoodSharePoint[]; source: ApiSource }> {
    try {
      const q = lat !== undefined && lon !== undefined ? `?lat=${lat}&lon=${lon}&distance_km=${distance_km}` : '';
      const items = await call<FoodSharePoint[]>(`/food-share-points${q}`);
      return { items, source: 'api' };
    } catch {
      const items = (fairteilerSnapshot as FoodSharePoint[]).map((p) => ({ ...p, distance_km: lat !== undefined && lon !== undefined ? +(hav(lat, lon, p.lat, p.lon) / 1000).toFixed(2) : null }));
      items.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
      return { items, source: 'snapshot' };
    }
  },
  async basketsNearby(lat: number, lon: number, distance_km = 10): Promise<{ items: Basket[]; source: ApiSource }> {
    try {
      const items = await call<Basket[]>(`/baskets/nearby?lat=${lat}&lon=${lon}&distance_km=${distance_km}`);
      return { items, source: 'api' };
    } catch {
      return { items: DEMO_BASKETS, source: 'demo' };
    }
  },
  basket: (id: number) => call<Basket>(`/baskets/${id}`),
  users: () => call<FsUser[]>('/users'),
  me: (userId?: number) => call<FsUser & { verification?: Verification }>('/users/me', {}, userId),
  createBasket: (b: { title: string; lat: number; lon: number; description?: string; food_types?: string[]; expires_in_hours?: number }, userId?: number) => call<Basket>('/baskets', { method: 'POST', body: JSON.stringify(b) }, userId),
  requestBasket: (id: number, message?: string, userId?: number) => call<any>(`/baskets/${id}/requests`, { method: 'POST', body: JSON.stringify(message ? { message } : {}) }, userId),
  setRequestStatus: (id: number, requesterId: number, status: 'accepted' | 'rejected' | 'cancelled' | 'picked_up', userId?: number) => call<any>(`/baskets/${id}/requests/${requesterId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, userId),
  pickup: (src: { basket_id: number } | { food_share_point_id: number }, userId?: number) => call<Pickup>('/pickups', { method: 'POST', body: JSON.stringify(src) }, userId),
  myPickups: (userId?: number) => call<Pickup[]>('/users/me/pickups?limit=50', {}, userId),
  sample: (source?: string) => call<Pickup[]>(`/pickups/sample?limit=200${source ? `&source=${source}` : ''}`),
  verification: (userId: number) => call<Verification>(`/users/${userId}/verification`),
  patchVerification: (userId: number, patch: Partial<Verification>) => call<Verification>(`/users/${userId}/verification`, { method: 'PATCH', body: JSON.stringify(patch) }),
  approve: (userId?: number) => call<any>('/users/me/approve', { method: 'POST' }, userId),
  businesses: () => call<{ id: number; name: string; lat: number; lon: number }[]>('/businesses'),
  businessPickup: (id: number, userId?: number) => call<Pickup>(`/businesses/${id}/pickups`, { method: 'POST' }, userId),
};

export const DEMO_BASKETS: Basket[] = [
  { id: 9001, title: 'Bio-Kiste: Möhren, Lauch, Sellerie', description: 'Abokiste war zu groß. Alles einwandfrei, ungewaschen.', food_types: ['Obst & Gemüse'], lat: 50.1219, lon: 8.6612, status: 'available', expires_at: new Date(Date.now() + 5 * 3600e3).toISOString(), distance_km: 0.6 },
  { id: 9002, title: '8 Brötchen und ein Landbrot', description: 'Vom Samstag, noch weich.', food_types: ['Backwaren'], lat: 50.1156, lon: 8.6721, status: 'available', expires_at: new Date(Date.now() + 20 * 3600e3).toISOString(), distance_km: 1.2 },
  { id: 9003, title: 'Joghurt & Frischkäse, MHD heute', description: 'Gekühlt, ungeöffnet.', food_types: ['Milchprodukte'], lat: 50.1093, lon: 8.6784, status: 'available', expires_at: new Date(Date.now() + 3 * 3600e3).toISOString(), distance_km: 1.6 },
];
