import { useT } from '@/i18n/useT';
import React from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { Button, Card, T } from '@/components/ui';
import { C, CONTEXT } from '@/theme';
import { useStore } from '@/store';
const col = CONTEXT.food.color;

export default function Saver() {
  const rt = useT();
  const router = useRouter();
  const quizDone = useStore(s => s.quizDone.includes('q3'));
  return <Screen tabBar={false}>
    <Header title={rt('routes.pass_on_food')} right={<FoodsharingLogo width={76} />} />
    <Card style={{ gap: 12, backgroundColor: '#EAF3E6' }}>
      <Text style={T.h1}>{rt('routes.sharing_you_can_rely_on')}</Text>
      <Text style={T.body}>{rt('routes.prepare_fair_portions_set_a_time_window_and_choose_which_requests')}</Text>
      <Button label={rt('routes.create_distribution')} color={col} onPress={() => router.push({ pathname: '/uebergaben', params: { create: '1' } })} />
      <Button label={rt('routes.my_handoffs_reviews')} color={col} variant="soft" onPress={() => router.push('/uebergaben')} />
    </Card>
    <View style={{ marginTop: 18, gap: 12 }}>
      <Text style={T.h2}>{rt('routes.rescue_food_from_businesses')}</Text>
      <Text style={T.body}>{rt('routes.foodsharing_authorises_foodsavers_entering_data_in_the_app_or_pas')}</Text>
      <Card style={{ gap: 10 }}><Text style={T.h3}>{rt('routes.1_share_food_safely')}</Text><Text style={T.body}>{quizDone ? rt('routes.you_completed_the_learning_chapter_in_mainsam') : rt('routes.learn_the_rules_for_hygiene_and_foodsharing_shelves')}</Text><Button label={quizDone ? rt('routes.repeat_chapter') : rt('routes.open_learning_chapter')} color={col} variant="soft" onPress={() => router.push('/quiz/q3')} /></Card>
      <Card style={{ gap: 8 }}><Text style={T.h3}>{rt('routes.2_introduction_authorisation')}</Text><Text style={T.body}>{rt('routes.introductory_collections_and_permissions_must_be_confirmed_by_the')}</Text></Card>
      <Button label={rt('routes.learn_more_at_foodsharing')} color={C.ink} variant="ghost" onPress={() => void Linking.openURL('https://foodsharing.de/')} />
    </View>
  </Screen>;
}
