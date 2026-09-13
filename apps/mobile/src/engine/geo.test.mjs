import test from 'node:test';
import assert from 'node:assert/strict';
import { haversine } from './geo.ts';

test('distances use meters, are symmetric, and cross the date line by the short path', () => {
  assert.equal(haversine(50.11, 8.68, 50.11, 8.68), 0);
  assert.ok(Math.abs(haversine(0, 0, 0, 1) - 111195) < 1);
  const frankfurtBerlin = haversine(50.11, 8.68, 52.52, 13.4);
  assert.ok(frankfurtBerlin > 420000 && frankfurtBerlin < 430000);
  assert.equal(frankfurtBerlin, haversine(52.52, 13.4, 50.11, 8.68));
  assert.ok(Math.abs(haversine(0, 179, 0, -179) - 222390) < 1);
});
