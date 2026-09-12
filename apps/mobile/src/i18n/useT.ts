import { useStore } from '@/store';
import { translate, type TKey } from './index';

export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: TKey) => translate(lang, key);
}
export function useIsRTL() {
  return useStore((s) => s.lang) === 'ar';
}
