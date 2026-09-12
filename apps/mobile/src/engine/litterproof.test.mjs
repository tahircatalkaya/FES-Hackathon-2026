import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLitterProof } from './litterproof.ts';
import { award } from './reward.ts';

const before = { at: 1_800_000_000_000, lat: 50.12, lon: 8.65, accuracy: 8, hash: '0000000000000000' };
const after = { ...before, at: before.at + 10 * 60000, hash: 'ffffffffffffffff' };

test('Fresh accurate photos pass at the minimum and maximum time boundaries, with no litter points', () => {
  assert.equal(checkLitterProof(before, after).ok, true);
  assert.equal(checkLitterProof(before, { ...after, at: before.at + 120 * 60000 }).ok, true);
  const result = award({ type: 'clean.litter_solo', partner: 'fes', status: 'plausibel', key: 'litter:test', at: after.at, title: 'Test' }, []);
  assert.equal(result.points, 0);
});

test('Early, expired or geographically distant photos fail', () => {
  for (const patch of [{ at: before.at + 599999 }, { at: before.at + 120 * 60000 + 1 }, { lat: 50.13 }]) {
    assert.equal(checkLitterProof(before, { ...after, ...patch }).ok, false);
  }
});

test('Identical photos and previously submitted images cannot be reused', () => {
  assert.equal(checkLitterProof(before, { ...after, hash: before.hash }).ok, false);
  assert.equal(checkLitterProof(before, after, [before.hash]).ok, false);
  assert.equal(checkLitterProof(before, after, [after.hash]).ok, false);
});

test('Missing, inaccurate or malformed location evidence fails closed, including old demo proofs', () => {
  for (const patch of [{ accuracy: undefined }, { accuracy: 51 }, { accuracy: -1 }, { lat: NaN }, { lon: Infinity }, { lat: 91 }, { lon: 181 }, { at: NaN }, { hash: '' }, { hash: 'not-a-photo-hash!' }]) {
    assert.equal(checkLitterProof({ ...before, ...patch }, after).ok, false);
    assert.equal(checkLitterProof(before, { ...after, ...patch }).ok, false);
  }
});
