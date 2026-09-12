import { useCallback } from 'react';
import { useStore } from '@/store';
import { localeFor, localizeText, translate, type TKey, type TranslationParams } from './index';

export function useT() {
  const lang = useStore((s) => s.lang);
  return useCallback((key: TKey, params?: TranslationParams) => translate(lang, key, params), [lang]);
}
export function useLocalize() {
  const lang = useStore((s) => s.lang);
  return useCallback((text: string) => localizeText(lang, text), [lang]);
}
export function useLocale() { return localeFor(useStore((s) => s.lang)); }
export function useIsRTL() { return useStore((s) => s.lang) === 'ar'; }
