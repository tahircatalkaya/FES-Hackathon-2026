// A partially installed optional ngrok binary otherwise fails with "file ... null".
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const packageName = `@expo/ngrok-bin-${process.platform}-${process.arch}`;
const binary = process.platform === 'win32' ? 'ngrok.exe' : 'ngrok';
const root = path.resolve(__dirname, '..');
function available() {
  try { return fs.existsSync(require.resolve(`${packageName}/${binary}`)); }
  catch { return false; }
}
if (!available()) {
  console.log('Expo-Tunnelhelfer unvollständig. Installiere die optionale Programmdatei für diesen Rechner neu…');
  // Only remove this generated dependency, never project data or another platform's install.
  const incomplete = path.join(root, 'node_modules', ...packageName.split('/'));
  fs.rmSync(incomplete, { recursive: true, force: true });
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['install', '--include=optional'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0 || !available()) {
    console.error('Tunnelhelfer fehlt weiterhin. Im Projektordner npm ci --include=optional ausführen und erneut npm run start:phone starten.');
    process.exit(1);
  }
}
