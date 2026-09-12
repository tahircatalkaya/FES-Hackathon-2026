import { Platform } from 'react-native';

/** Kontextfarben. Das Chamäleon nimmt die Farbe des aktiven Kontexts an. */
export const CONTEXT = {
  home: { color: '#0F2A5C', soft: '#E3E9F7', name: 'Mainsam' },
  mobility: { color: '#2F6BFF', soft: '#E4ECFF', name: 'Ride2Impact' },
  food: { color: '#2FB55C', soft: '#E1F6E8', name: 'Save2Share' },
  reuse: { color: '#12B5B0', soft: '#DDF6F4', name: 'Smart Mehrweg' },
  clean: { color: '#17427F', soft: '#E4EAF6', name: 'Sauberes Frankfurt' },
  community: { color: '#7C4DFF', soft: '#ECE5FF', name: 'Gemeinsam' },
} as const;
export type ContextKey = keyof typeof CONTEXT;

export const C = {
  bg: '#F6F5EF',
  card: '#FFFFFF',
  ink: '#141A14',
  ink2: '#3F4A44',
  muted: '#7C857F',
  line: '#E6E4DB',
  success: '#1E9E5A',
  warn: '#E0A100',
  danger: '#E5484D',
  leaf: '#7CCB4B',
  gold: '#F5B301',
  home: CONTEXT.home.color,
  mobility: CONTEXT.mobility.color,
  food: CONTEXT.food.color,
  reuse: CONTEXT.reuse.color,
  clean: CONTEXT.clean.color,
  community: CONTEXT.community.color,
};

export const R = { sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  family: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }) as string,
};

export const shadow = (depth: 1 | 2 | 3 = 1) =>
  Platform.select({
    web: { boxShadow: depth === 1 ? '0 4px 14px rgba(20,26,20,0.08)' : depth === 2 ? '0 10px 30px rgba(20,26,20,0.12)' : '0 20px 50px rgba(20,26,20,0.18)' } as any,
    default: {
      shadowColor: '#141A14',
      shadowOpacity: depth === 1 ? 0.08 : depth === 2 ? 0.12 : 0.18,
      shadowRadius: depth === 1 ? 10 : depth === 2 ? 18 : 28,
      shadowOffset: { width: 0, height: depth * 4 },
      elevation: depth * 3,
    },
  }) as object;

export const STATUS_COLORS: Record<string, string> = {
  bestätigt: '#1E9E5A',
  plausibel: '#2F6BFF',
  'schwach plausibel': '#E0A100',
  'selbst angegeben': '#9A7B00',
  'nicht zuordenbar': '#7C857F',
  geschätzt: '#7C4DFF',
  ausstehend: '#E0A100',
};
