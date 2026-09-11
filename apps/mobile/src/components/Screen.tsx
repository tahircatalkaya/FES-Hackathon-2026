import React from 'react';
import { Pressable, ScrollView, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '@/theme';
import { T } from './ui';

export function Screen({ children, style, tabBar = true, scroll = true, bg = C.bg, refreshControl }: { children: React.ReactNode; style?: ViewStyle; tabBar?: boolean; scroll?: boolean; bg?: string; refreshControl?: React.ReactElement<any> }) {
  const insets = useSafeAreaInsets();
  const padBottom = tabBar ? 110 + insets.bottom : 30 + insets.bottom;
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: bg, paddingTop: insets.top }, style]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={[{ paddingTop: insets.top + 8, paddingHorizontal: S.lg, paddingBottom: padBottom, maxWidth: 560, width: '100%', alignSelf: 'center' }, style]} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
      {children}
    </ScrollView>
  );
}

export function Header({ title, subtitle, back = true, right, color = C.ink }: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode; color?: string }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.lg, gap: 12 }}>
      {back && (
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[T.h2, { color }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={T.small}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
