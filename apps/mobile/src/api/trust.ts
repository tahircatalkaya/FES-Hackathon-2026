import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { FoodItem } from './ai';
import type { Award } from '@/engine/types';

export interface Reputation { count: number; visible: boolean; satisfaction?: number; reliability?: number; respect?: number }
export interface TrustOffer { id: string; ownerId: string; ownerName: string; title: string; items: FoodItem[]; portions: number; remaining: number; area: string; address?: string; startsAt: number; endsAt: number; reputation: Reputation }
export interface Handoff { id: string; status: 'pending' | 'accepted' | 'received' | 'completed' | 'cancelled' | 'expired' | 'disputed'; role: 'provider' | 'receiver'; offer: TrustOffer; counterpart: { id: string; name: string; reputation: Reputation }; completedAt?: number; reviewed: boolean; concern: { mine: boolean; reason: string; disputed: boolean }[] }
export interface TrustProfile { user: { id: string; name: string }; reputation: Reputation; awards: Award[] }
const STORAGE_KEY = 'mainsam.trust.session.v1';
const configured = process.env.EXPO_PUBLIC_TRUST_URL?.trim().replace(/\/$/, '');
const isPrivate = (host: string) => /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(host);
function serverUrl() {
  if (configured) {
    try { const url = new URL(configured); if (!url.username && !url.password && (url.protocol === 'https:' || (__DEV__ && url.protocol === 'http:' && isPrivate(url.hostname)))) return configured; } catch {}
    return null;
  }
  // Same private LAN as Metro; do not infer or create a public tunnel.
  const host = Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.location.hostname : 'localhost') : Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && host && isPrivate(host)) return `http://${host}:8787`;
  return null;
}
export const TRUST_URL = serverUrl();
let memory: string | null | undefined;
async function token() {
  if (memory !== undefined) return memory;
  const saved = Platform.OS === 'web' ? await AsyncStorage.getItem(STORAGE_KEY) : await SecureStore.getItemAsync(STORAGE_KEY);
  // Sessions belong to one server. Never forward a saved credential to a changed endpoint.
  try { const s = JSON.parse(saved || '{}'); memory = s.url === TRUST_URL ? s.token : null; } catch { memory = null; }
  return memory;
}
async function saveToken(value: string | null) {
  memory = value;
  if (!value) { if (Platform.OS === 'web') await AsyncStorage.removeItem(STORAGE_KEY); else await SecureStore.deleteItemAsync(STORAGE_KEY); }
  else { const data = JSON.stringify({ url: TRUST_URL, token: value }); if (Platform.OS === 'web') await AsyncStorage.setItem(STORAGE_KEY, data); else await SecureStore.setItemAsync(STORAGE_KEY, data); }
}
async function call<T>(path: string, body?: object, method = body ? 'POST' : 'GET', anonymous = false): Promise<T> {
  if (!TRUST_URL) throw new Error('Für bestätigte Übergaben ist noch kein Server verbunden.');
  const session = anonymous ? null : await token();
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const response = await fetch(TRUST_URL + path, { method, signal: ctrl.signal, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !anonymous) await saveToken(null);
      throw Object.assign(new Error(result.error || 'Die Anfrage konnte nicht abgeschlossen werden.'), { status: response.status });
    }
    return result;
  } catch (e: any) {
    if (e.name === 'AbortError' || e instanceof TypeError) throw new Error('Übergaben gerade nicht erreichbar. Bitte Verbindung prüfen. Deine Anfrage wurde nicht als bestätigt gewertet.');
    throw e;
  } finally { clearTimeout(timer); }
}
export const trust = {
  hasSession: async () => !!await token(),
  async login(name: string, password: string, register: boolean) { const result = await call<{token:string}>(register ? '/register' : '/login', { name, password }, 'POST', true); await saveToken(result.token); },
  async logout() { try { await call('/session', undefined, 'DELETE'); } finally { await saveToken(null); } },
  me: () => call<TrustProfile>('/me'),
  offers: () => call<TrustOffer[]>('/offers'),
  handoffs: () => call<Handoff[]>('/handoffs'),
  create: (draft: {title:string;items:FoodItem[];portions:number;area:string;address:string;startsAt:number;endsAt:number;requestKey:string}) => call<TrustOffer>('/offers', draft),
  request: (id: string) => call<Handoff>(`/offers/${id}/request`, {}),
  action: (id: string, action: 'accept'|'cancel'|'receive'|'complete'|'review'|'concern'|'dispute', data: object = {}) => call<Handoff>(`/handoffs/${id}/${action}`, data),
  code: (id: string) => call<{code:string;expiresAt:number}>(`/handoffs/${id}/code`, {}),
};
