import { useT } from '@/i18n/useT';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { C } from '@/theme';
import { haptic } from './ui';

/** Umschalter oben im Impact-Tab: mein Beitrag oder Frankfurt gemeinsam. */
export default function ScopeToggle({ active, color }: { active: 'me' | 'city'; color: string }) {
  const t = useT();
  const router = useRouter();
  const items = [{ k: 'me', l: t('impact.title'), h: '/impact' }, { k: 'city', l: t('together.title'), h: '/gemeinsam' }] as const;
  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 999, padding: 4, marginBottom: 14 }}>
      {items.map((it) => (
        <Pressable key={it.k} onPress={() => { if (active !== it.k) { haptic(); router.replace(it.h as any); } }} style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: active === it.k ? color : 'transparent', alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: active === it.k ? '#fff' : C.muted }}>{it.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}
