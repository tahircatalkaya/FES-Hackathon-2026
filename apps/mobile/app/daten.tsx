import React, { useEffect } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import { Card, Divider, Pill, Row, SectionTitle, T, Tag } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { DISTRICTS } from '@/data/mock';

const col = CONTEXT.home.color;

/** Was die App speichert, was nicht, und was aggregiert an Frankfurt geht. */
export default function Daten() {
  const s = useStore();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('home'); }, []);
  const rows = [
    { i: 'journal', t: 'Gutschriften', v: `${s.ledger.length} Einträge, jede mit Begründung` },
    { i: 'cafe', t: 'Mehrweg-Behälter', v: `${s.containers.length} erfasst` },
    { i: 'bookmark', t: 'Reservierungen', v: `${s.reservations.length + s.itemReservations.length}` },
    { i: 'camera', t: 'Fotos und Sprachnotizen', v: 'nur als Nachweis, ohne Ortsdaten im Bild' },
    { i: 'navigate', t: 'GPS-Rohspuren', v: 'keine. Nach der Prüfung einer Fahrt gelöscht' },
  ];
  const inputStyle = { marginTop: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.bg, color: C.ink };
  return (
    <Screen tabBar={false}>
      <Header title="Meine Daten" />
      <Card>
        <Text style={T.h3}>Persönliche Angaben</Text>
        <Text style={[T.small, { marginTop: 4 }]}>Diese Angaben werden nur auf deinem Gerät gespeichert.</Text>
        <Text style={[T.label, { marginTop: 16 }]}>Stadtteil</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>{DISTRICTS.map((district) => <Pill key={district.name} label={district.name} active={s.district === district.name} color={col} onPress={() => s.setProfile({ district: district.name })} />)}</ScrollView>
        <Text style={[T.label, { marginTop: 16 }]}>E-Mail</Text>
        <TextInput value={s.email} onChangeText={(email) => s.setProfile({ email })} placeholder="name@beispiel.de" keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>Telefonnummer</Text>
        <TextInput value={s.phone} onChangeText={(phone) => s.setProfile({ phone })} placeholder="Deine Telefonnummer" keyboardType="phone-pad" autoComplete="tel" style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>Adresse</Text>
        <TextInput value={s.address} onChangeText={(address) => s.setProfile({ address })} placeholder="Straße und Hausnummer" autoComplete="street-address" style={inputStyle} />
      </Card>
      <SectionTitle title="Weitere gespeicherte Informationen" />
      <Card>
        {rows.map((r, i) => (
          <View key={r.t}>
            <Row style={{ gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={r.i as any} size={18} color={C.ink} /></View>
              <View style={{ flex: 1 }}><Text style={T.h3}>{r.t}</Text><Text style={T.small}>{r.v}</Text></View>
            </Row>
            {i < rows.length - 1 && <Divider />}
          </View>
        ))}
      </Card>
      <Text style={[T.h2, { marginTop: S.xl }]}>So kennzeichnen wir Angaben</Text>
      <Card style={{ marginTop: 10 }}>
        {[['bestätigt', 'Von einem Partner bestätigt, zum Beispiel Rückgabe im Laden', C.success], ['plausibel', 'Von der App geprüft, zum Beispiel Fahrt gegen den Fahrplan', C.info], ['selbst angegeben', 'Deine Angabe ohne Beleg', C.muted], ['geschätzt', 'CO₂-Werte aus Durchschnittsfaktoren', C.community]].map(([k, v, c]) => (
          <Row key={k} style={{ alignItems: 'flex-start', marginBottom: 8 }}><Tag label={k} color={c} /><Text style={[T.small, { flex: 1 }]}>{v}</Text></Row>
        ))}
      </Card>
      <Text style={[T.h2, { marginTop: S.xl }]}>Was an Frankfurt geht</Text>
      <Text style={[T.small, { marginTop: 6, color: C.muted }]}>Nur Summen: Linie, Stunde, Anzahl Fahrten. Nie dein Name, nie deine Route. Erst ab fünf Personen pro Gruppe. {s.privacy.shareAggregates ? 'Du machst mit.' : 'Du machst nicht mit.'}</Text>
    </Screen>
  );
}
