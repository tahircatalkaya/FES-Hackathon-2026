import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, Divider, Pill, Row, SectionTitle, Sheet, T, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { DISTRICTS } from '@/data/mock';

const col = CONTEXT.home.color;
const PAYMENT_METHODS = ['Kreditkarte', 'PayPal', 'SEPA-Lastschrift'];
const PAYMENT_DETAILS: Record<string, string> = {
  Kreditkarte: 'Visa •••• 4242',
  PayPal: 'kai@beispiel.de',
  'SEPA-Lastschrift': 'IBAN •••• 6789',
};

/** Was die App speichert, was nicht, und was aggregiert an Frankfurt geht. */
export default function Daten() {
  const rt = useT();
  const localize = useLocalize();
  const s = useStore();
  const { setCtx } = useUI();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState(s.paymentMethod || 'Keine');
  const [paymentSaved, setPaymentSaved] = useState(false);
  useEffect(() => { setCtx('home'); }, []);
  const currentPaymentMethod = s.paymentMethod || 'Keine';

  function savePaymentMethod() {
    s.setProfile({ paymentMethod: draftPaymentMethod });
    setPaymentOpen(false);
    setPaymentSaved(true);
    haptic('success');
  }
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
      <Header title={rt('routes.my_data')} />
      <Card>
        <Text style={T.h3}>{rt('routes.personal_details')}</Text>
        <Text style={[T.small, { marginTop: 4 }]}>{rt('routes.these_details_are_stored_only_on_your_device')}</Text>
        <Text style={[T.label, { marginTop: 16 }]}>{rt('routes.district')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>{DISTRICTS.map((district) => <Pill key={district.name} label={district.name} active={s.district === district.name} color={col} onPress={() => s.setProfile({ district: district.name })} />)}</ScrollView>
        <Text style={[T.label, { marginTop: 16 }]}>{rt('routes.email')}</Text>
        <TextInput value={s.email} onChangeText={(email) => s.setProfile({ email })} placeholder="name@beispiel.de" keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>{rt('routes.phone_number')}</Text>
        <TextInput value={s.phone} onChangeText={(phone) => s.setProfile({ phone })} placeholder={rt('routes.your_phone_number')} keyboardType="phone-pad" autoComplete="tel" style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>{rt('routes.address')}</Text>
        <TextInput value={s.address} onChangeText={(address) => s.setProfile({ address })} placeholder={rt('routes.street_and_house_number')} autoComplete="street-address" style={inputStyle} />
        <Text style={[T.label, { marginTop: 16 }]}>{rt('routes.payment_method')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={rt('routes.manage_payment_method')} onPress={() => { setDraftPaymentMethod(currentPaymentMethod); setPaymentSaved(false); setPaymentOpen(true); }} style={{ marginTop: 8, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: C.bg }}>
          <Row>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="card-outline" size={21} color={col} /></View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{currentPaymentMethod === 'Keine' ? rt('routes.add_payment_method') : localize(currentPaymentMethod)}</Text>
              <Text style={T.small}>{PAYMENT_DETAILS[currentPaymentMethod] || rt('routes.no_payment_method_saved_yet')}</Text>
            </View>
            <Text style={{ color: col, fontWeight: '800' }}>{currentPaymentMethod === 'Keine' ? rt('routes.add') : rt('routes.change')}</Text>
          </Row>
        </Pressable>
        {paymentSaved && (
          <Row style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: C.success + '18' }}>
            <Ionicons name="checkmark-circle" size={19} color={C.success} />
            <Text style={[T.small, { color: C.success, fontWeight: '800' }]}>{rt('routes.payment_method_saved')}</Text>
          </Row>
        )}
      </Card>
      <SectionTitle title={rt('routes.other_stored_information')} />
      <Card>
        {rows.map((r, i) => (
          <View key={r.t}>
            <Row style={{ gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={r.i as any} size={18} color={C.ink} /></View>
              <View style={{ flex: 1 }}><Text style={T.h3}>{localize(r.t)}</Text><Text style={T.small}>{localize(r.v)}</Text></View>
            </Row>
            {i < rows.length - 1 && <Divider />}
          </View>
        ))}
      </Card>
      <Text style={[T.h2, { marginTop: S.xl }]}>{rt('routes.what_is_shared_with_frankfurt')}</Text>
      <Text style={[T.small, { marginTop: 6, color: C.muted }]}>{rt('routes.only_totals_route_hour_number_of_rides_never_your_name_or_persona', { p1: s.privacy.shareAggregates ? rt('routes.you_participate') : rt('routes.you_do_not_participate') })}</Text>
      <Sheet open={paymentOpen} onClose={() => setPaymentOpen(false)} title={rt('routes.set_up_payment_method')}>
        <Text style={[T.body, { marginBottom: 12 }]}>{rt('routes.choose_a_payment_method')}</Text>
        <View style={{ gap: 8 }}>
          {PAYMENT_METHODS.map((method) => (
            <Pressable key={method} accessibilityRole="radio" accessibilityState={{ selected: draftPaymentMethod === method }} onPress={() => setDraftPaymentMethod(method)} style={{ padding: 14, borderRadius: 14, borderWidth: 2, borderColor: draftPaymentMethod === method ? col : C.line, backgroundColor: draftPaymentMethod === method ? col + '12' : '#fff' }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View><Text style={T.h3}>{localize(method)}</Text><Text style={T.small}>{PAYMENT_DETAILS[method]}</Text></View>
                {draftPaymentMethod === method && <Ionicons name="checkmark-circle" size={22} color={col} />}
              </Row>
            </Pressable>
          ))}
        </View>
        <Button label={rt('routes.save_payment_method')} color={col} disabled={!PAYMENT_METHODS.includes(draftPaymentMethod)} onPress={savePaymentMethod} style={{ marginTop: 16 }} />
      </Sheet>
    </Screen>
  );
}
