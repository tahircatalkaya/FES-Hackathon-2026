// Run the real client adapter with delayed network/storage responses; no real accounts.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function client(fetchImpl, options = {}) {
  let saved = null;
  const state = { accessMode: 'guest', sessionExpired: false,
    setProfile: data => Object.assign(state, data), syncFoodAwards() {}, syncContainers() {} };
  const storage = { getItem: async () => saved, setItem: async (_, value) => { saved = value; }, removeItem: async () => { saved = null; } };
  const filename = path.join(__dirname, '../src/api/trust.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    exports: mod.exports, module: mod, __DEV__: true, fetch: fetchImpl, URL, AbortController,
    setTimeout, clearTimeout, TypeError, Error,
    process: { env: { EXPO_PUBLIC_TRUST_URL: options.url ?? 'http://127.0.0.1:8787' } },
    require(name) {
      if (name === './network') return require('../src/api/network.ts');
      if (name === 'expo-constants') return options.constants || {};
      if (name === 'react-native') return { Platform: { OS: options.os || 'web' } };
      if (name === '@react-native-async-storage/async-storage') return storage;
      if (name === 'expo-secure-store') return {getItemAsync:storage.getItem,setItemAsync:storage.setItem,deleteItemAsync:storage.removeItem};
      if (name === '@/store') return { useStore: { getState: () => state, setState: data => Object.assign(state, data) } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename });
  return { trust: mod.exports.trust, state, saved: () => JSON.parse(saved || '{}').token };
}
const member = { id: 'member', name: 'test', email: 'test@example.test', guest: false };

test('concurrent guest requests create only one session; upgrading waits for and preserves it', async () => {
  const started = deferred(), release = deferred(); let guests = 0, registerAuth;
  const c = client(async (url, init) => {
    if (url.endsWith('/guest')) { guests++; started.resolve(); await release.promise; return Response.json({ token: 'guest-token' }); }
    assert.ok(url.endsWith('/register')); registerAuth = init.headers.Authorization;
    return Response.json({ token: 'member-token', user: member });
  });
  const first = c.trust.hasSession(), second = c.trust.hasSession(); await started.promise;
  const upgrade = c.trust.login('test', 'password-test', true, member.email);
  release.resolve(); await Promise.all([first, second, upgrade]);
  assert.equal(guests, 1); assert.equal(registerAuth, 'Bearer guest-token');
  assert.equal(c.saved(), 'member-token'); assert.equal(c.state.accessMode, 'member');
});

test('a delayed 401 from an old session cannot sign out the new account', async () => {
  const started = deferred(), release = deferred();
  const c = client(async url => {
    if (url.endsWith('/guest')) return Response.json({ token: 'guest-token' });
    if (url.endsWith('/handoffs')) { started.resolve(); await release.promise; return Response.json({ error: 'old session expired' }, { status: 401 }); }
    return Response.json({ token: 'member-token', user: member });
  });
  await c.trust.hasSession(); const oldRequest = c.trust.handoffs(); await started.promise;
  await c.trust.login('test', 'password-test', false); release.resolve();
  await assert.rejects(oldRequest, /old session expired/);
  assert.equal(c.saved(), 'member-token'); assert.equal(c.state.sessionExpired, false);
});

test('continuing as an existing guest preserves outstanding handoffs', async () => {
  let guests = 0;
  const c = client(async () => { guests++; return Response.json({ token: 'guest-token' }); });
  await c.trust.hasSession(); await c.trust.guest(); await c.trust.hasSession();
  assert.equal(c.saved(), 'guest-token'); assert.equal(guests, 1);
});


test('Expo native connection failures retry reads once without losing the session',async()=>{
  let reads=0;
  const c=client(async url=>{
    if(url.endsWith('/guest'))return Response.json({token:'guest-token'});
    if(++reads===1)throw new Error('fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)');
    return Response.json([]);
  });
  await c.trust.hasSession();assert.deepEqual(await c.trust.handoffs(),[]);assert.equal(reads,2);assert.equal(c.saved(),'guest-token');
});
test('failed native writes are not replayed and report an unknown save status',async()=>{
  let writes=0;
  const c=client(async()=>{writes++;throw new Error('fetch failed: UnexpectedException: Could not connect to the server.');});
  await assert.rejects(c.trust.cleanupConfirm('test','proof',{}),e=>e.code==='NETWORK_UNAVAILABLE'&&e.uncertain&&!e.message.includes('Swift'));
  assert.equal(writes,1);
});
test('native localhost uses the private Metro address and manifest fallback',async()=>{
  let called='';const c=client(async url=>{called=url;return Response.json([]);},{os:'ios',constants:{manifest2:{extra:{expoClient:{hostUri:'172.20.10.11:8081'}}}}});
  await c.trust.handoffs();assert.equal(called,'http://172.20.10.11:8787/handoffs');
});
