import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANGS, LOCALES, TRANSLATIONS, translate, localizeText, localeFor } from './index.ts';
import { base } from './base.ts';
import { data } from './data.ts';
import { tabs } from './tabs.ts';
import { routes } from './routes.ts';
import { components } from './components.ts';
import { proofs } from './proofs.ts';
import { errors } from './errors.ts';
import { CHAPTERS, CLEANUPS, REWARDS } from '../data/mock.ts';
import { ACTION_TYPES, BINGO, BIN_FINDINGS, FUN_FACTS, dayOptions } from '../data/fes.ts';
import { PARTNERS } from '../data/partners.ts';

const languages = ['de', 'en', 'tr', 'ar', 'hr', 'it', 'leicht'];
const placeholders = text => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]))].sort();

test('Croatian and Italian are selectable and each locale has a formatter', () => {
  assert.deepEqual(LANGS.map(language => language.code), ['de', 'en', 'tr', 'ar', 'hr', 'it']);
  assert.equal(LANGS.find(language => language.code === 'hr').label, 'Hrvatski');
  assert.equal(LANGS.find(language => language.code === 'it').label, 'Italiano');
  for (const language of languages) assert.doesNotThrow(() => new Intl.DateTimeFormat(LOCALES[language]));
  assert.equal(translate('hr', 'common.next'), 'Dalje');
  assert.equal(translate('it', 'common.next'), 'Avanti');
});

test('Every translation row is complete and preserves its interpolation parameters', () => {
  for (const [key, row] of Object.entries(TRANSLATIONS)) {
    assert.equal(row.length, languages.length, key);
    const expected = placeholders(row[0]);
    for (const [column, language] of languages.entries()) {
      assert.equal(typeof row[column], 'string', `${key}: ${language}`);
      assert.ok(row[column].trim(), `${key}: ${language} is blank`);
      assert.deepEqual(placeholders(row[column]), expected, `${key}: ${language} placeholders`);
      assert.equal(translate(language, key), row[column], `${key}: ${language} uses its own translation`);
    }
  }
});

test('Table keys cannot silently overwrite one another', () => {
  const tables = [base, data, tabs, routes, components, proofs, errors];
  const keys = tables.flatMap(table => Object.keys(table));
  assert.equal(new Set(keys).size, keys.length);
});

test('Interpolation preserves numbers, Unicode, repeated parameters and literal replacement characters', () => {
  assert.equal(translate('it', 'data.stageNext', { points: 25, stage: 'Diamante' }), '25 punti per raggiungere Diamante');
  assert.equal(translate('hr', 'data.distribution', { name: 'Ana $&' }), 'Podjela kod Ana $&');
  assert.equal(translate('it', 'data.stageNext', { points: 0 }), '0 punti per raggiungere {stage}');
  assert.ok(translate('hr', 'onb.1.body').includes('\n'));
});

test('Built-in content changes language at display time without mutating canonical data', () => {
  const canonical = structuredClone(CHAPTERS);
  const texts = [
    ...CHAPTERS.flatMap(chapter => [chapter.title, chapter.intro, ...chapter.questions.flatMap(q => [q.q, q.why, ...q.options])]),
    ...CLEANUPS.flatMap(cleanup => [cleanup.title, cleanup.material, cleanup.description]).filter(text => text !== 'FES'),
    ...REWARDS.flatMap(reward => [reward.title, reward.desc]),
    ...BINGO.flatMap(item => [item.title, item.short]),
    ...BIN_FINDINGS.flatMap(item => [item.label, item.hint]),
    ...ACTION_TYPES.flatMap(item => [item.title, item.short]),
    ...FUN_FACTS.flatMap(item => [item.label, item.text]),
    ...PARTNERS.flatMap(partner => [partner.theme, partner.category, partner.description]),
  ];
  const sourceRows = new Map(Object.values(TRANSLATIONS).map(row => [row[0], row]));
  for (const text of texts) {
    assert.ok(sourceRows.has(text), `Missing built-in content: ${text}`);
    for (const language of languages) assert.ok(localizeText(language, text).length);
  }
  assert.equal(localizeText('it', '25 Punkte bis Entdecker'), '25 punti per raggiungere Esploratore');
  assert.equal(localizeText('hr', 'Papierkorb Hauptwache Nord'), 'Koš za otpad Hauptwache Nord');
  assert.equal(localizeText('de', '25 Punkte bis Entdecker'), '25 Punkte bis Entdecker');
  assert.deepEqual(CHAPTERS, canonical);
});

test('Unknown external content and proper names remain unchanged; unsupported locales fall back safely', () => {
  for (const language of languages) {
    assert.equal(localizeText(language, 'Ada-Kantine'), 'Ada-Kantine');
    assert.equal(localizeText(language, 'Mein selbst geschriebener Text 123'), 'Mein selbst geschriebener Text 123');
  }
  assert.equal(translate('unknown', 'common.next'), translate('de', 'common.next'));
  assert.equal(localeFor('unknown'), 'de-DE');
  assert.equal(translate('it', 'missing.key'), 'missing.key');
});

test('Action day suggestions use the chosen locale without changing their dates', () => {
  const date = new Date(2026, 8, 12, 12);
  const german = dayOptions(date, 'de-DE');
  const italian = dayOptions(date, 'it-IT');
  assert.deepEqual(german.map(day => +day.date), italian.map(day => +day.date));
  assert.notEqual(german[1].label, italian[1].label);
  assert.equal(localizeText('hr', german[0].label), 'Sutra');
});


test('Decorated proof messages and nested action titles follow the active language', () => {
  assert.equal(localizeText('it', '✓ Innerhalb des Zeitfensters'), '✓ ' + localizeText('it', 'Innerhalb des Zeitfensters'));
  assert.notEqual(localizeText('it', 'Innerhalb des Zeitfensters'), 'Innerhalb des Zeitfensters');
  const title = 'Angemeldet: Clean-up · Bockenheimer Warte';
  const translated = localizeText('it', title);
  assert.ok(translated.includes('Bockenheimer Warte'));
  assert.ok(translated.includes(localizeText('it', 'Clean-up')));
  assert.ok(!translated.includes('Angemeldet'));
});

test('Each built-in award explanation has a complete translation', async () => {
  const { WHY_BASE, award } = await import('../engine/reward.ts');
  const sourceTexts = new Set(Object.values(TRANSLATIONS).map(row => row[0]));
  for (const explanation of Object.values(WHY_BASE)) assert.ok(sourceTexts.has(explanation), explanation);
  const action = { type: 'clean.quiz', partner: 'fes', status: 'plausibel', key: 'quiz:test', title: 'Test', at: Date.now() };
  const result = award(action, []);
  const before = structuredClone(result);
  for (const reason of result.reasons) {
    assert.notEqual(localizeText('it', reason), reason, `Untranslated proof: ${reason}`);
    assert.notEqual(localizeText('hr', reason), reason, `Untranslated proof: ${reason}`);
  }
  assert.deepEqual(result, before, 'Translating proof text cannot change points or evidence');
});

test('Distance and CO₂ displays use locale decimal separators', async () => {
  const { fmtCo2 } = await import('../engine/impact.ts');
  assert.equal(fmtCo2(1500, 'it-IT'), '1,5 kg');
  assert.equal(fmtCo2(1500, 'hr-HR'), '1,5 kg');
  assert.equal(fmtCo2(1500, 'en-GB'), '1.5 kg');
});
