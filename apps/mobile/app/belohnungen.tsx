import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Row, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, balance } from '@/store';
import { useUI } from '@/store/ui';
import { REWARDS, type Reward } from '@/data/mock';

/** Kleine Belohnungen sind in Tagen drin, große Ziele brauchen Wochen bis Monate. */
const SMALL = REWARDS.filter((r) => r.cost < 1000);
const BIG = REWARDS.filter((r) => r.cost >= 1000);

const col = CONTEXT.home.color;

export default function Rewards() {
  const rt = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const s = useStore();
  const { setCtx } = useUI();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setCtx('home'); }, []);
  const bal = balance(s);
  function redeem(r: Reward) {
    if (!s.redeem({ title: r.title, cost: r.cost })) return;
    haptic('success');
    setMsg(`${r.title} eingelöst. Code kommt ins Postfach.`);
    s.notify({ title: 'Eingelöst', body: `${r.title}: Dein Code MAIN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, ctx: 'home' });
  }
  const nextDraw = new Date(); nextDraw.setMonth(nextDraw.getMonth() + 1, 1); nextDraw.setHours(12, 0, 0, 0);

  return (
    <Screen tabBar={false}>
      <Header title={rt('routes.rewards')} color={col} />
      <Appear>
        <Card style={{ backgroundColor: col }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>{rt('routes.balance')}</Text>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff' }}>{bal} 🍃</Text>
              <Text style={[T.small, { color: '#ffffffcc' }]}>{rt('routes.points_never_expire_weekly_goals_reset')}</Text>
            </View>
            <Chameleon pose="heart" size={96} />
          </Row>
        </Card>
      </Appear>

      <Appear delay={60}>
        <Card style={{ marginTop: 14, borderWidth: 2, borderColor: C.gold }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>{rt('routes.deutschlandticket_raffle')}</Text><Tag label={rt('routes.value_raffle_tickets', { p1: s.lose })} color={C.gold} /></Row>
          <Text style={[T.body, { marginTop: 6 }]}>{rt('routes.each_week_you_reach_your_goal_earns_one_raffle_ticket_draw_on_val', { p1: nextDraw.toLocaleDateString(locale, { day: '2-digit', month: 'long' }) })}</Text>
          <Text style={[T.small, { marginTop: 6 }]}>{rt('routes.choose_your_prize_a_deutschlandticket_for_one_month_or_a_20_vouch')}</Text>
        </Card>
      </Appear>

      <Text style={[T.h2, { marginTop: S.xl }]}>{rt('routes.redeem_now')}</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {SMALL.map((r, i) => <RewardCard key={r.id} r={r} bal={bal} delay={100 + i * 50} onRedeem={redeem} />)}
      </View>

      <Text style={[T.h2, { marginTop: S.xl }]}>{rt('routes.big_goals')}</Text>
      <Text style={[T.small, { marginTop: 4 }]}>{rt('routes.points_never_expire_these_goals_take_weeks_and_months_rather_than')}</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {BIG.map((r, i) => <RewardCard key={r.id} r={r} bal={bal} delay={100 + i * 50} progress onRedeem={redeem} />)}
      </View>

      {msg && <Card style={{ marginTop: 12, backgroundColor: C.success + '15' }}><Text style={[T.body, { color: C.success, fontWeight: '700' }]}>{localize(msg)}</Text></Card>}
      {s.redemptions.length > 0 && (<><Divider /><Text style={T.label}>{rt('routes.already_redeemed')}</Text>{s.redemptions.map((r) => <Text key={r.id} style={[T.small, { marginTop: 4 }]}>{new Date(r.at).toLocaleDateString(locale)} · {localize(r.title)} · −{r.cost}</Text>)}</>)}
    </Screen>
  );
}

/** Eine Belohnung. Bei großen Zielen zeigt ein Balken, wie weit das Guthaben ist. */
function RewardCard({ r, bal, delay, progress, onRedeem }: { r: Reward; bal: number; delay: number; progress?: boolean; onRedeem: (r: Reward) => void }) {
  const rt = useT();
  const localize = useLocalize();
  const ok = bal >= r.cost;
  return (
    <Appear delay={delay}>
      <Card style={{ opacity: ok ? 1 : 0.85 }}>
        <Row>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>{r.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>{localize(r.title)}</Text>
            <Text style={T.small}>{localize(r.desc)}</Text>
            <Tag label={r.partner} color={col} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontWeight: '900', fontSize: 18, color: ok ? C.success : C.muted }}>{r.cost}</Text>
            <Button
              label={ok ? rt('routes.redeem') : rt('routes.value_to_go_2', { p1: r.cost - bal })}
              color={col}
              variant={ok ? 'solid' : 'soft'}
              disabled={!ok}
              onPress={() => onRedeem(r)}
              style={{ paddingVertical: 8, paddingHorizontal: 12, marginTop: 4 }}
            />
          </View>
        </Row>
        {progress && !ok && (
          <View style={{ height: 8, borderRadius: 5, backgroundColor: C.line, marginTop: 12, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, (bal / r.cost) * 100)}%`, height: '100%', backgroundColor: col }} />
          </View>
        )}
      </Card>
    </Appear>
  );
}
