import { base } from './base.ts';
import { data } from './data.ts';
import { tabs } from './tabs.ts';
import { routes } from './routes.ts';
import { components } from './components.ts';
import { proofs } from './proofs.ts';
import { updates } from './updates.ts';
import { errors } from './errors.ts';
import type { TranslationParams, TranslationRow } from './types';

export type Lang = 'de' | 'leicht' | 'en' | 'tr' | 'ar' | 'hr' | 'it';
export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

export const LOCALES: Record<Lang, string> = { de: 'de-DE', leicht: 'de-DE', en: 'en-GB', tr: 'tr-TR', ar: 'ar', hr: 'hr-HR', it: 'it-IT' };
const COLUMN: Record<Lang, number> = { de: 0, en: 1, tr: 2, ar: 3, hr: 4, it: 5, leicht: 6 };
export const TRANSLATIONS = { ...base, ...data, ...tabs, ...routes, ...components, ...proofs, ...errors, ...updates };
export type TKey = keyof typeof TRANSLATIONS;
export type { TranslationParams } from './types';

export function localeFor(lang: Lang): string { return LOCALES[lang] ?? LOCALES.de; }
function interpolate(value: string, params: TranslationParams = {}): string {
  return value.replace(/\{(\w+)\}/g, (match, name: string) => params[name] === undefined ? match : String(params[name]));
}
export function translate(lang: Lang, key: TKey, params?: TranslationParams): string {
  const row = TRANSLATIONS[key];
  if (!row) return key;
  return interpolate(row[COLUMN[lang] ?? 0], params);
}

// Built-in content (quizzes, rewards and persisted proof explanations) keeps its
// stable German source value. Translate only at display time, never identifiers
// or the values used by the award engine. Unknown external content is preserved.
const sourceRows = new Map<string, TranslationRow>();
for (const row of Object.values(TRANSLATIONS)) {
  if (!sourceRows.has(row[0])) sourceRows.set(row[0], row);
}
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = Object.values(TRANSLATIONS).filter(row => /\{\w+\}/.test(row[0])).map(row => {
  const names: string[] = [];
  const parts = row[0].split(/(\{\w+\})/g).map(part => {
    if (!/^\{\w+\}$/.test(part)) return escapeRegex(part);
    names.push(part.slice(1, -1));
    return '(.+?)';
  });
  return { row, names, pattern: new RegExp('^' + parts.join('') + '$'), specificity: row[0].replace(/\{\w+\}/g, '').length };
}).sort((a, b) => b.specificity - a.specificity);

export function localizeText(lang: Lang, text: string): string {
  return localizeBuiltIn(lang, text, 0);
}

function localizeBuiltIn(lang: Lang, text: string, depth: number): string {
  const column = COLUMN[lang] ?? 0;
  if (column === 0 || !text || depth > 5) return text;
  const row = sourceRows.get(text);
  if (row) return row[column];
  const prefix = /^([✓✗✔✘]\s*)(.+)$/s.exec(text);
  if (prefix) return prefix[1] + localizeBuiltIn(lang, prefix[2], depth + 1);
  for (const { row: template, names, pattern } of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const params = Object.fromEntries(names.map((name, index) => {
        const value = match[index + 1];
        return [name, localizeBuiltIn(lang, value, depth + 1)];
      }));
      return interpolate(template[column], params);
    }
  }
  // Composite labels retain their proper names and localize their known parts.
  if (text.includes(' · ')) return text.split(' · ').map(part => localizeBuiltIn(lang, part, depth + 1)).join(' · ');
  return text;
}
