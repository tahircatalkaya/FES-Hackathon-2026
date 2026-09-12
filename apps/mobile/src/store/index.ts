import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ActionEvent, Award, Impact } from '@/engine/types';
import { award as computeAward } from '@/engine/reward';
import { addImpact, emptyImpact } from '@/engine/impact';
import type { Lang } from '@/i18n';
import type { Cleanup } from '@/data/mock';

export interface Container { code: string; storeId: string; storeName: string; borrowedAt: number; returnedAt?: number; txId: string; kind: 'bowl' | 'cup' }
export interface Reservation { basketId: number; title: string; at: number; expiresAt: number; status: 'pending' | 'accepted' | 'picked_up' | 'cancelled' | 'expired'; addressRevealed?: string }
export interface ShelfReport { pointId: number; at: number; fill: 'leer' | 'wenig' | 'mittel' | 'voll'; categories: string[]; photo?: string; items?: { name: string; qty: string; cat: string; grams: number }[] }
export interface CleanReport { id: string; at: number; kind: string; lat: number; lon: number; ticket: string; status: 'eingegangen' | 'in Bearbeitung' | 'erledigt'; photo?: string }
export interface Notice { id: string; at: number; title: string; body: string; ctx: string; read?: boolean }
export interface Friend { id: string; name: string; emoji: string; activeDays: number; goal: number; district: string }
export interface ItemReservation { id: string; placeId: string; placeTitle: string; item: string; qty: string; at: number; expiresAt: number; kind: 'fairteiler' | 'verteilung'; href: string }
export interface Redemption { id: string; at: number; title: string; cost: number }
/** Offener Vorher/Nachher-Nachweis. Ueberlebt das Schliessen der App, sonst waere das Zeitfenster nutzlos. */
export interface LitterProof { at: number; lat: number; lon: number; hash: string; kind: 'ahash' | 'digest' }

interface State {
  onboarded: boolean;
  name: string;
  lang: Lang;
  district: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  chameleonName: string;
  privacy: { tripOnlyLocation: boolean; notifications: boolean; quietHours: boolean; shareAggregates: boolean };
  ledger: Award[];
  spent: number;
  lose: number;
  redemptions: Redemption[];
  containers: Container[];
  reservations: Reservation[];
  itemReservations: ItemReservation[];
  shelfReports: ShelfReport[];
  cleanReports: CleanReport[];
  joinedCleanups: string[];
  ownCleanups: Cleanup[];
  attested: Record<string, string[]>; // cleanupId -> peer ids
  quizDone: string[];
  notices: Notice[];
  friends: Friend[];
  litterThanks: number;
  litterProof: LitterProof | null;
  /** Fingerabdruecke abgeschlossener Nachweise, gegen Wiedervorlage. */
  photoHashes: string[];
  demoMode: boolean;
  nfcSeen: string[];

  setOnboarded: (v: boolean) => void;
  setProfile: (p: Partial<Pick<State, 'name' | 'lang' | 'district' | 'email' | 'phone' | 'address' | 'paymentMethod' | 'chameleonName'>>) => void;
  setPrivacy: (p: Partial<State['privacy']>) => void;
  addAward: (e: ActionEvent) => Award;
  redeem: (r: Omit<Redemption, 'id' | 'at'>) => boolean;
  addContainer: (c: Container) => void;
  returnContainer: (code: string, returnedAt: number) => Container | undefined;
  addReservation: (r: Reservation) => void;
  updateReservation: (id: number, patch: Partial<Reservation>) => void;
  reserveItem: (r: Omit<ItemReservation, 'id' | 'at'>) => void;
  releaseItem: (id: string) => void;
  addShelfReport: (r: ShelfReport) => void;
  addCleanReport: (r: CleanReport) => void;
  joinCleanup: (id: string) => void;
  addCleanup: (c: Cleanup) => void;
  attest: (cleanupId: string, peer: string) => void;
  finishQuiz: (id: string) => void;
  notify: (n: Omit<Notice, 'id' | 'at'>) => void;
  markRead: () => void;
  thankLitter: () => void;
  startLitterProof: (p: LitterProof) => void;
  finishLitterProof: (hashes: string[]) => void;
  cancelLitterProof: () => void;
  setDemoMode: (v: boolean) => void;
  addNfc: (id: string) => void;
  resetAll: () => void;
}

const DEFAULT_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Amal', emoji: '🌻', activeDays: 3, goal: 3, district: 'Bornheim' },
  { id: 'f2', name: 'Rania', emoji: '🚲', activeDays: 2, goal: 3, district: 'Sachsenhausen' },
  { id: 'f3', name: 'Tahir', emoji: '🥦', activeDays: 1, goal: 3, district: 'Gallus' },
  { id: 'f4', name: 'Tabarek', emoji: '🌍', activeDays: 3, goal: 3, district: 'Nordend' },
  { id: 'f5', name: 'Laroussi', emoji: '⚡', activeDays: 0, goal: 3, district: 'Höchst' },
];

const initial = {
  onboarded: false,
  name: '',
  lang: 'de' as Lang,
  district: 'Bockenheim',
  email: '',
  phone: '',
  address: '',
  paymentMethod: 'Keine',
  chameleonName: 'Kai',
  privacy: { tripOnlyLocation: true, notifications: true, quietHours: true, shareAggregates: true },
  ledger: [] as Award[],
  spent: 0,
  lose: 0,
  redemptions: [] as Redemption[],
  containers: [] as Container[],
  reservations: [] as Reservation[],
  itemReservations: [] as ItemReservation[],
  shelfReports: [] as ShelfReport[],
  cleanReports: [] as CleanReport[],
  joinedCleanups: [] as string[],
  ownCleanups: [] as Cleanup[],
  attested: {} as Record<string, string[]>,
  quizDone: [] as string[],
  notices: [] as Notice[],
  friends: DEFAULT_FRIENDS,
  litterThanks: 0,
  litterProof: null as LitterProof | null,
  photoHashes: [] as string[],
  demoMode: true,
  nfcSeen: [] as string[],
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      setOnboarded: (v) => set({ onboarded: v }),
      setProfile: (p) => set(p),
      setPrivacy: (p) => set({ privacy: { ...get().privacy, ...p } }),
      addAward: (e) => {
        const a = computeAward(e, get().ledger);
        if (!a.duplicate) {
          set({ ledger: [a, ...get().ledger] });
          // Wochenziel prüfen
          const s = get();
          const wk = weekStats(s.ledger);
          if (wk.activeDays >= 3 && !s.ledger.some((l) => l.type === 'rhythm.weekly_goal' && l.key === `week:${wk.weekKey}`)) {
            const w = computeAward({ type: 'rhythm.weekly_goal', partner: 'mainsam', status: 'bestätigt', key: `week:${wk.weekKey}`, at: Date.now(), title: 'Wochenziel erreicht' }, get().ledger);
            set({ ledger: [w, ...get().ledger], lose: get().lose + 1 });
            get().notify({ title: 'Wochenziel geschafft', body: 'Drei aktive Tage. Du hast ein Los für die Deutschlandticket-Verlosung bekommen.', ctx: 'community' });
          }
        }
        return a;
      },
      redeem: (r) => {
        const s = get();
        if (balance(s) < r.cost) return false;
        set({ spent: s.spent + r.cost, redemptions: [{ ...r, id: `${Date.now()}`, at: Date.now() }, ...s.redemptions] });
        return true;
      },
      addContainer: (c) => set({ containers: [c, ...get().containers] }),
      returnContainer: (code, returnedAt) => {
        const c = get().containers.find((x) => x.code === code && !x.returnedAt);
        if (!c) return undefined;
        set({ containers: get().containers.map((x) => (x === c ? { ...x, returnedAt } : x)) });
        return { ...c, returnedAt };
      },
      addReservation: (r) => set({ reservations: [r, ...get().reservations] }),
      updateReservation: (id, patch) => set({ reservations: get().reservations.map((r) => (r.basketId === id ? { ...r, ...patch } : r)) }),
      reserveItem: (r) => set({ itemReservations: [{ ...r, id: `${Date.now()}-${Math.random()}`, at: Date.now() }, ...get().itemReservations] }),
      releaseItem: (id) => set({ itemReservations: get().itemReservations.filter((r) => r.id !== id) }),
      addShelfReport: (r) => set({ shelfReports: [r, ...get().shelfReports] }),
      addCleanReport: (r) => set({ cleanReports: [r, ...get().cleanReports] }),
      joinCleanup: (id) => set({ joinedCleanups: Array.from(new Set([...get().joinedCleanups, id])) }),
      addCleanup: (c) => set({ ownCleanups: [c, ...get().ownCleanups], joinedCleanups: Array.from(new Set([...get().joinedCleanups, c.id])) }),
      attest: (cleanupId, peer) => set({ attested: { ...get().attested, [cleanupId]: Array.from(new Set([...(get().attested[cleanupId] ?? []), peer])) } }),
      finishQuiz: (id) => set({ quizDone: Array.from(new Set([...get().quizDone, id])) }),
      notify: (n) => set({ notices: [{ ...n, id: `${Date.now()}-${Math.random()}`, at: Date.now() }, ...get().notices].slice(0, 50) }),
      markRead: () => set({ notices: get().notices.map((n) => ({ ...n, read: true })) }),
      thankLitter: () => set({ litterThanks: get().litterThanks + 1 }),
      startLitterProof: (litterProof) => set({ litterProof }),
      // Beide Fingerabdruecke merken, damit keines der Fotos noch einmal durchgeht. Deckel bei 200.
      finishLitterProof: (hashes) => set({ litterProof: null, photoHashes: [...hashes, ...get().photoHashes].slice(0, 200) }),
      cancelLitterProof: () => set({ litterProof: null }),
      setDemoMode: (v) => set({ demoMode: v }),
      addNfc: (id) => set({ nfcSeen: [...get().nfcSeen, id] }),
      resetAll: () => set({ ...initial }),
    }),
    { name: 'mainsam-v1', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function balance(s: Pick<State, 'ledger' | 'spent'>) {
  return s.ledger.reduce((a, l) => a + l.points, 0) - s.spent;
}

export function totalImpact(ledger: Award[]): Impact {
  return ledger.reduce((acc, l) => addImpact(acc, l.impact), emptyImpact());
}

export function weekKeyOf(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day);
  return x.toISOString().slice(0, 10);
}

export function weekStats(ledger: Award[]) {
  const weekKey = weekKeyOf();
  // Montag lokal rechnen statt aus weekKey zu parsen: "YYYY-MM-DD" gilt als UTC-Mitternacht
  // und liegt in Zeitzonen hinter UTC einen Tag zu frueh.
  const monday = new Date(); monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const start = monday.getTime();
  const days = new Set<string>();
  let points = 0;
  for (const l of ledger) {
    if (l.at >= start && l.points > 0) { days.add(new Date(l.at).toDateString()); points += l.points; }
  }
  // Montag bis Sonntag: an welchen Tagen dieser Woche gab es eine Gutschrift?
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return days.has(d.toDateString());
  });
  const todayIdx = (new Date().getDay() + 6) % 7;
  return { weekKey, activeDays: days.size, goal: 3, points, week, todayIdx };
}

/**
 * Die vier Stufen mit ihrer Pose. Steht hier und nicht im Screen, damit Profil und
 * Impact-Tab dieselbe Figur zeigen: Die Figur kennt keine Wachstumsstufen mehr,
 * unterschieden wird ueber die Pose.
 */
export const STAGES = [
  { name: 'Schlüpfling', pose: 'calm' as const },
  { name: 'Entdecker', pose: 'hello' as const },
  { name: 'Kletterer', pose: 'backpack' as const },
  { name: 'Stadt', pose: 'cool' as const },
];

/** Entwicklungsstufe des Chamäleons: nach aktiven Wochen, nicht nach Punktemenge. */
export function chameleonStage(ledger: Award[]) {
  const weeks = new Set(ledger.filter((l) => l.points > 0).map((l) => weekKeyOf(new Date(l.at)))).size;
  const actions = ledger.filter((l) => l.points > 0).length;
  if (weeks >= 4) return { stage: 4, label: 'Stadtchamäleon', next: null as null | string };
  if (weeks >= 2) return { stage: 3, label: 'Kletterer', next: 'vier aktive Wochen' };
  if (actions >= 3) return { stage: 2, label: 'Entdecker', next: 'zwei aktive Wochen' };
  return { stage: 1, label: 'Schlüpfling', next: 'drei Aktionen' };
}
