import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Chameleon from '@/components/Chameleon';
import { Screen } from '@/components/Screen';
import { Button, Card, T } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';

const col = CONTEXT.home.color;
const inputStyle = {
  marginTop: 6,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderColor: C.line,
  borderRadius: 14,
  backgroundColor: C.bg,
  color: C.ink,
  fontSize: 16,
};

export default function Anmelden() {
  const router = useRouter();
  const setOnboarded = useStore((state) => state.setOnboarded);
  const setProfile = useStore((state) => state.setProfile);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const canSubmit = name.trim().length >= 2 && email.trim().includes('@');

  useEffect(() => {
    setOnboarded(false);
  }, [setOnboarded]);

  return (
    <Screen tabBar={false}>
      <View style={{ alignItems: 'center', marginTop: S.lg }}>
        <Chameleon pose="hello" size={220} />
      </View>
      <Text style={[T.h1, { marginTop: S.lg }]}>Willkommen zurück</Text>
      <Text style={[T.body, { marginTop: 8 }]}>Kai freut sich, dich wiederzusehen.</Text>
      <Card style={{ marginTop: S.xl }}>
        <Text style={T.label}>Benutzername</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Benutzername" placeholderTextColor={C.muted} autoCapitalize="none" autoComplete="username" maxLength={24} style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>E-Mail-Adresse</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="name@beispiel.de" placeholderTextColor={C.muted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={inputStyle} />
        <Button label="Anmelden" color={col} disabled={!canSubmit} onPress={() => {
          setProfile({ name: name.trim(), email: email.trim() });
          setOnboarded(true);
          router.replace('/(tabs)');
        }} style={{ marginTop: 20 }} />
      </Card>
    </Screen>
  );
}
