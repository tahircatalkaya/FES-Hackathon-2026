import assert from 'node:assert/strict';
import test from 'node:test';
import { isNetworkError } from './network.ts';

test('recognizes Expo/native, browser, and aborted connections without masking HTTP errors', () => {
  const native = new Error('fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)');
  assert.equal(isNetworkError(native), true);
  assert.equal(isNetworkError(new TypeError('Network request failed')), true);
  assert.equal(isNetworkError(new TypeError('Failed to fetch')), true);
  assert.equal(isNetworkError(new Error('Request failed', { cause: { code: 'ECONNREFUSED' } })), true);
  assert.equal(isNetworkError(new Error('Native request cancelled'), { aborted: true }), true);
  assert.equal(isNetworkError(Object.assign(new Error('Dieser Behälter ist gerade ausgeliehen.'), { status: 409 })), false);
  assert.equal(isNetworkError(Object.assign(new Error('Network request failed'), { status: 503 }), { aborted: true }), false);
  assert.equal(isNetworkError(new Error('Gemini: API-Limit erreicht.')), false);
  assert.equal(isNetworkError(new TypeError('Cannot read properties of undefined')), false);
});
