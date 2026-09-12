// Runs the app's actual AI adapter in Node; no handset microphone is accessed.
// Default: deterministic error/upload checks. --live: small Gemini requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadAI(fetchImpl, key = 'test-key-never-sent') {
  const filename = path.join(__dirname, '../src/api/ai.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  const context = {
    exports: mod.exports, module: mod, fetch: fetchImpl, AbortController, FormData, TypeError, Error, FileReader: undefined,
    setTimeout, clearTimeout, process: { env: { EXPO_PUBLIC_GEMINI_KEY: key } },
    require: (name) => {
      if (name === './network') return require('../src/api/network.ts');
      if (name === 'react-native') return { Platform: { OS: 'ios' } };
      if (name === 'expo-file-system') return { File: class {
        constructor(uri) { this.path = uri.replace(/^file:\/\//, ''); }
        get exists() { return fs.existsSync(this.path); }
        get size() { return fs.statSync(this.path).size; }
        async base64() { return fs.readFileSync(this.path).toString('base64'); }
      } };
      throw new Error(`Unexpected dependency ${name}`);
    },
  };
  vm.runInNewContext(code, context, { filename });
  return mod.exports;
}

async function checks() {
  const good = { items: [{ name: 'Äpfel', qty: '2 Stück', cat: 'Obst & Gemüse', grams: 360 }], fill: 'mittel', food_visible: true, transcript: 'Zwei Äpfel' };
  const calls = [];
  const ai = loadAI(async (url, init) => {
    calls.push({ url, init });
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(good) }] } }] });
  });
  assert.equal((await ai.analyzeText('Zwei Äpfel', 'stock')).items[0].name, 'Äpfel');
  assert(calls[0].url.includes('gemini-3.6-flash'));
  assert(!calls[0].url.includes('test-key'));
  assert.equal(calls[0].init.headers['x-goog-api-key'], 'test-key-never-sent');
  const result = await ai.analyzePhoto('abc', 'image/jpeg', 'shelf');
  assert.equal(result.items[0].grams, 360);
  const fixture = path.join(require('node:os').tmpdir(), 'mainsam-audio-unit.txt');
  fs.writeFileSync(fixture, 'fixture');
  try {
    assert.equal((await ai.analyzeAudio(`file://${fixture}`, 'audio/m4a', 'stock')).transcript, 'Zwei Äpfel');
    const upload = JSON.parse(calls.at(-1).init.body).contents[0].parts[1].inlineData;
    assert.equal(upload.mimeType, 'audio/m4a');
    assert.equal(upload.data, Buffer.from('fixture').toString('base64'));
    fs.writeFileSync(fixture, '');
    await assert.rejects(ai.analyzeAudio(`file://${fixture}`, 'audio/m4a', 'stock'), /leer/);
  } finally { fs.unlinkSync(fixture); }
  for (const [status, message] of [[429, 'API-Limit'], [403, 'Berechtigung'], [404, 'Modell'], [400, 'nicht unterstützt'], [503, 'nicht verfügbar']]) {
    const broken = loadAI(async () => new Response('SECRET_SERVER_DETAIL', { status }));
    await assert.rejects(broken.analyzeText('Test', 'stock'), (e) => e.message.includes(message) && !e.message.includes('SECRET'));
  }
  const offline = loadAI(async () => { throw new TypeError('fetch failed'); });
  await assert.rejects(offline.analyzeText('Test', 'stock'), /Verbindung/);
  const nativeOffline = loadAI(async () => { throw new Error('fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)'); });
  await assert.rejects(nativeOffline.analyzeText('Test', 'stock'), e => e.message.includes('Verbindung') && !e.message.includes('Swift'));
  assert.equal(loadAI(() => { throw new Error('No network expected'); }, '').aiProvider(), null);
  console.log('PASS: Text, Bild, native Audiodatei, MIME, leere Aufnahme, 400/403/404/429/503, Netzfehler, kein Schlüssel.');
}

async function live() {
  process.loadEnvFile(path.join(__dirname, '../.env'));
  const ai = loadAI(fetch, process.env.EXPO_PUBLIC_GEMINI_KEY);
  const text = await ai.analyzeText('Ich habe zwei Äpfel und drei Brötchen eingestellt.', 'stock');
  assert(text.items.length >= 2, 'Textauswertung enthält zu wenige Posten');
  console.log('LIVE Text:', JSON.stringify(text));
  const audioArg = process.argv.indexOf('--audio');
  if (audioArg !== -1) {
    const audio = await ai.analyzeAudio(process.argv[audioArg + 1], 'audio/m4a', 'stock');
    assert(audio.transcript.length > 5 && audio.items.length >= 2, 'Audio wurde nicht korrekt erkannt');
    console.log('LIVE Audio:', JSON.stringify(audio));
  }
  const imagePath = path.join(__dirname, '../assets/partners/foodsharing.png');
  const logo = await ai.analyzePhoto(fs.readFileSync(imagePath).toString('base64'), 'image/png', 'shelf');
  assert.equal(logo.foodVisible, false, 'Logo darf nicht als Lebensmittel erkannt werden');
  assert.equal(logo.items.length, 0);
  console.log('LIVE Bild: Logo korrekt als kein Lebensmittel erkannt.');
}

(process.argv.includes('--live') ? live() : checks()).catch((error) => {
  // No request headers, environment values, or server response dumps.
  console.error(error.message);
  process.exitCode = 1;
});
