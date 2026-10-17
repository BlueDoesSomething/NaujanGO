import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'src');
const LOCALES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de'];

const ctxPath = path.join(SRC, 'context', 'LanguageContext.jsx');
const ctx = fs.readFileSync(ctxPath, 'utf8');
const lines = ctx.split(/\r?\n/);

// Walk each locale block by brace counting so keys can never be mis-attributed.
const dict = {};
const blockEnds = {};
for (const loc of LOCALES) {
  const start = lines.findIndex((l) => new RegExp(`^  ${loc}: \\{`).test(l));
  if (start < 0) {
    console.error(`FATAL: locale block "${loc}" not found in LanguageContext.jsx`);
    process.exit(2);
  }
  let depth = 0, end = -1;
  for (let i = start; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth === 0 && i > start) { end = i; break; }
  }
  blockEnds[loc] = end;
  const set = new Set();
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(/^\s+([A-Za-z_$][\w$]*)\s*:\s*/);
    if (m) set.add(m[1]);
  }
  dict[loc] = set;
}

// Collect every t('key') / t("key") call across the app.
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const usage = new Map();
for (const f of walk(SRC)) {
  if (f.endsWith('LanguageContext.jsx')) continue;
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, idx) => {
    for (const re of [/\bt\(\s*'([A-Za-z_$][\w$]*)'\s*\)/g, /\bt\(\s*"([A-Za-z_$][\w$]*)"\s*\)/g]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const k = m[1];
        if (!usage.has(k)) usage.set(k, new Set());
        usage.get(k).add(`${path.basename(f)}:${idx + 1}`);
      }
    }
  });
}

const missingInEn = [...usage.keys()].filter((k) => !dict.en.has(k)).sort();
const gaps = [...usage.keys()]
  .filter((k) => dict.en.has(k))
  .map((k) => [k, LOCALES.filter((l) => !dict[l].has(k))])
  .filter(([, m]) => m.length);

const cells = gaps.reduce((s, [, m]) => s + m.length, 0);

console.log('Locale key counts');
for (const loc of LOCALES) {
  const pct = Math.round((dict[loc].size / dict.en.size) * 100);
  const bar = '#'.repeat(Math.round(pct / 5)).padEnd(20, '.');
  console.log(`  ${loc}  ${String(dict[loc].size).padStart(5)}  ${bar} ${pct}%`);
}

console.log(`\nt() keys used in code: ${usage.size}`);

if (missingInEn.length) {
  console.error(`\nFAIL  ${missingInEn.length} key(s) used in code have NO English entry.`);
  console.error('      These render as literal key text to every user:');
  for (const k of missingInEn) {
    console.error(`      t('${k}')  ->  ${[...usage.get(k)].slice(0, 3).join(', ')}`);
  }
  console.error('');
}

console.log(`WARN  ${gaps.length} key(s) fall back to English; ${cells} empty locale slot(s).`);

if (missingInEn.length) {
  console.error('\nAdd an English entry for every key above. Run "npm run i18n:check" to re-verify.\n');
  process.exit(1);
}

console.log('\nPASS  Every t("key") used in code resolves in English.\n');