const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');

const files = {
  // SettingsPage - REMOVE 'Segera Hadir' badges
  'src/features/settings/SettingsPage.tsx': fs.readFileSync(path.join(root, 'src/features/settings/SettingsPage.tsx'), 'utf8'),
  // 4 functional components
  'src/features/settings/PrinterSettings.tsx': fs.readFileSync(path.join(root, 'src/features/settings/PrinterSettings.tsx'), 'utf8'),
  'src/features/settings/AIAssistantSettings.tsx': fs.readFileSync(path.join(root, 'src/features/settings/AIAssistantSettings.tsx'), 'utf8'),
  'src/features/settings/BackupSettings.tsx': fs.readFileSync(path.join(root, 'src/features/settings/BackupSettings.tsx'), 'utf8'),
  'src/features/settings/SubscriptionSettings.tsx': fs.readFileSync(path.join(root, 'src/features/settings/SubscriptionSettings.tsx'), 'utf8'),
  // API routes needed by Backup
  'src/app/api/settings/backup/route.ts': fs.readFileSync(path.join(root, 'src/app/api/settings/backup/route.ts'), 'utf8'),
  'src/app/api/reset/route.ts': fs.readFileSync(path.join(root, 'src/app/api/reset/route.ts'), 'utf8'),
};

const jsonStr = JSON.stringify(files);
const compressed = zlib.gzipSync(Buffer.from(jsonStr));
const b64 = compressed.toString('base64');

const script = `// fix-settings-complete.cjs
// Fixes ALL 'Segera Hadir' features + API routes
// Run: node fix-settings-complete.cjs
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const b64 = '${b64}';

try {
  const data = JSON.parse(zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));
  const root = process.cwd();
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const p = path.join(root, keys[i]);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, data[keys[i]], 'utf8');
    console.log('[' + (i+1) + '/' + keys.length + '] ' + keys[i]);
  }
  console.log('');
  console.log('Done! ' + keys.length + ' files fixed.');
  console.log('');
  console.log('NEXT:');
  console.log('  git add .');
  console.log('  git commit -m "fix: semua fitur settings fungsional"');
  console.log('  git push');
} catch(e) { console.error('ERROR:', e.message); process.exit(1); }
`;

const outPath = path.join(root, 'scripts', 'fix-settings-complete.cjs');
fs.writeFileSync(outPath, script, 'utf8');
console.log('Generated: fix-settings-complete.cjs (' + (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB)');
