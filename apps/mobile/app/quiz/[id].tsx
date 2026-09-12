import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import Chameleon from '@/components/Chameleon';
import { Screen, Header } from '@/components/Screen';
import { Appear, Button, Card, Row, T, Tag, haptic, StatusBadge } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { CHAPTERS } from '@/data/mock';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';

/** Gamebook: Kai erzählt, du entscheidest. Jede Frage erklärt danach das Warum. */
export default function Quiz() {
  const rt = useT();
  const localize = useLocalize();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ch = CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
  const col = CONTEXT[ch.ctx].color;
  const [step, setStep] = useState(-1); // -1 intro
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const { quizDone, finishQuiz, addAward, chameleonName } = useStore();
  const { setCtx, showToast } = useUI();
  useEffect(() => { setCtx(ch.ctx); }, [ch.id]);
  const q = ch.questions[step];
  const done = step >= ch.questions.length;
  const wasDone = quizDone.includes(ch.id);

  function next() {
    if (step >= 0 && picked === q.answer) setCorrect((c) => c + 1);
    setPicked(null);
    if (step + 1 >= ch.questions.length) {
      finishQuiz(ch.id);
      const n = correct + (step >= 0 && picked === q.answer ? 1 : 0);
      const a = addAward({ type: 'clean.quiz', partner: 'fes', status: 'bestätigt', key: `quiz:${ch.id}`, at: Date.now(), title: `${ch.title} · ${n}/${ch.questions.length} richtig`, meta: { source: 'app', evidence: [`${n} von ${ch.questions.length} Fragen richtig`, 'Ein Kapitel zählt einmal, max. 3 Kapitel am Tag'] } });
      // Basis 5 je Frage: wir vergeben ein Ereignis je Kapitel mit n Fragen als Multiplikator über Titel; Punkte = 5 × richtig (vereinfacht über mehrere Events)
      for (let i = 1; i < n; i++) addAward({ type: 'clean.quiz', partner: 'fes', status: 'bestätigt', key: `quiz:${ch.id}:${i}`, at: Date.now(), title: `${ch.title} · Frage ${i + 1}`, meta: { source: 'app' } });
      showToast(a);
    }
    setStep(step + 1);
  }
  const nextCh = CHAPTERS[(CHAPTERS.indexOf(ch) + 1) % CHAPTERS.length];

  return (
    <Screen tabBar={false}>
      <Header title={localize(ch.title)} subtitle={rt('routes.learn_with_value_chapter_valuevalue', { p1: chameleonName, p2: CHAPTERS.indexOf(ch) + 1, p3: CHAPTERS.length })} color={col} />
      <Row style={{ gap: 6, marginBottom: 12 }}>{ch.questions.map((_, i) => <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < step || done ? col : i === step ? col + '88' : C.line }} />)}</Row>

      {step === -1 && (
        <Appear>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Chameleon pose="think" size={190} />
            <View style={{ backgroundColor: col + '18', borderRadius: 18, padding: 14, marginTop: 8 }}><Text style={[T.body, { fontSize: 16, lineHeight: 23 }]}>{localize(ch.intro)}</Text></View>
            {wasDone && <Tag label={rt('routes.already_completed_no_additional_points')} />}
            <View style={{ marginTop: 16, width: '100%' }}><Button label={rt('routes.go')} color={col} onPress={next} /></View>
          </Card>
        </Appear>
      )}

      {q && (
        <Animated.View key={step} entering={FadeInRight.duration(240)}>
          <Card>
            <Row style={{ alignItems: 'flex-start' }}>
              <Chameleon pose={picked === null ? 'think' : picked === q.answer ? 'cheer' : 'shock'} size={70} />
              <Text style={[T.h3, { flex: 1, fontSize: 18 }]}>{localize(q.q)}</Text>
            </Row>
            <View style={{ marginTop: 14, gap: 8 }}>
              {q.options.map((o, i) => {
                const chosen = picked === i, isRight = i === q.answer, reveal = picked !== null;
                return (
                  <Pressable key={i} disabled={reveal} onPress={() => { setPicked(i); haptic(i === q.answer ? 'success' : 'warn'); }} style={{ padding: 14, borderRadius: 16, borderWidth: 2, borderColor: reveal ? (isRight ? C.success : chosen ? C.danger : C.line) : C.line, backgroundColor: reveal && isRight ? C.success + '14' : '#fff' }}>
                    <Text style={[T.body, { fontWeight: '700', color: C.ink }]}>{String.fromCharCode(65 + i)} · {localize(o)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {picked !== null && (
              <Animated.View entering={FadeInDown} style={{ marginTop: 12, backgroundColor: C.bg, borderRadius: 14, padding: 12 }}>
                <Text style={[T.label, { color: picked === q.answer ? C.success : C.danger }]}>{picked === q.answer ? rt('routes.correct') : rt('routes.not_quite')}</Text>
                <Text style={[T.body, { marginTop: 4 }]}>{localize(q.why)}</Text>
                <View style={{ marginTop: 10 }}><Button label={step + 1 >= ch.questions.length ? rt('routes.finish_chapter') : rt('routes.next')} color={col} onPress={next} /></View>
              </Animated.View>
            )}
          </Card>
        </Animated.View>
      )}

      {done && (
        <Appear>
          <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Chameleon pose="cheer" size={170} />
            <Text style={[T.h2, { marginTop: 8 }]}>{rt('routes.valuevalue_correct', { p1: correct, p2: ch.questions.length })}</Text>
            <Row style={{ marginTop: 6, gap: 6 }}><Text style={T.small}>{rt('routes.2_points_per_correct_answer_max_3_chaptersday')}</Text></Row>
            <View style={{ marginTop: 16, width: '100%', gap: 8 }}>
              <Button label={rt('routes.next_value', { p1: localize(nextCh.title) })} color={col} onPress={() => { setStep(-1); setCorrect(0); router.replace(`/quiz/${nextCh.id}`); }} />
              <Button label={rt('routes.back')} variant="ghost" color={C.muted} onPress={() => router.replace('/(tabs)/handeln')} />
            </View>
          </Card>
        </Appear>
      )}
    </Screen>
  );
}
