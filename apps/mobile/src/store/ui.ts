import { create } from 'zustand';
import type { ContextKey } from '@/theme';
import type { Award } from '@/engine/types';

interface UI {
  ctx: ContextKey;
  setCtx: (c: ContextKey) => void;
  toast: Award | null;
  showToast: (a: Award | null) => void;
  why: Award | null;
  showWhy: (a: Award | null) => void;
  mood: 'happy' | 'sleepy' | 'excited' | 'thinking';
  setMood: (m: UI['mood']) => void;
}

export const useUI = create<UI>((set) => ({
  ctx: 'home',
  setCtx: (ctx) => set({ ctx }),
  toast: null,
  showToast: (toast) => set({ toast, mood: toast && toast.points > 0 ? 'excited' : 'happy' }),
  why: null,
  showWhy: (why) => set({ why }),
  mood: 'happy',
  setMood: (mood) => set({ mood }),
}));
