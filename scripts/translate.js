#!/usr/bin/env node
/**
 * Regenerates the "en" section of content.json from the "fr" source via MyMemory.
 *
 * Usage:
 *   node scripts/translate.js
 *   node scripts/translate.js --email you@example.com   (higher daily quota)
 *
 * MyMemory is free with no account or credit card.
 * Quota: ~5 000 chars/day anonymous, ~50 000 chars/day with --email.
 * https://mymemory.translated.net/doc/spec.php
 *
 * Only edit the "fr" section — "en" is fully overwritten each run.
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const CONTENT    = path.resolve(__dirname, '../assets/i18n/content.json');
const email      = (() => { const i = process.argv.indexOf('--email'); return i !== -1 ? process.argv[i + 1] : ''; })();
const DELAY_MS   = 120; // polite delay between requests

// ── Helpers ──────────────────────────────────────────────────────────────────

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function sleep(ms)      { return new Promise(r => setTimeout(r, ms)); }

function collectLeaves(obj, path = []) {
  if (typeof obj === 'string') return [{ path, value: obj }];
  if (Array.isArray(obj))     return obj.flatMap((v, i) => collectLeaves(v, [...path, i]));
  if (obj && typeof obj === 'object')
    return Object.entries(obj).flatMap(([k, v]) => collectLeaves(v, [...path, k]));
  return [];
}

function setByPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
}

function skip(v) {
  if (!v.trim()) return true;
  if (/^[\d\s/–-]+$/.test(v)) return true;                // years / periods
  if (/^https?:\/\//.test(v)) return true;                // bare URL
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true; // email
  if (/^\(?\+?[\d\s()+-]+$/.test(v)) return true;        // phone
  if (/^&copy;/.test(v)) return true;                     // HTML entity
  return false;
}

// ── MyMemory request ──────────────────────────────────────────────────────────

function translate(text) {
  return new Promise((resolve, reject) => {
    const q  = encodeURIComponent(text.slice(0, 500));
    const de = email ? `&de=${encodeURIComponent(email)}` : '';
    https.get(
      `https://api.mymemory.translated.net/get?q=${q}&langpair=fr|en${de}`,
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.responseStatus === 200 || parsed.responseStatus === '200') {
              resolve(parsed.responseData.translatedText);
            } else {
              reject(new Error(`MyMemory: ${parsed.responseDetails || parsed.responseStatus}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}\n${data}`));
          }
        });
      }
    ).on('error', reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const content     = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  const fr          = content.fr;
  const en          = deepClone(fr);
  const leaves      = collectLeaves(fr);
  const toTranslate = leaves.filter(l => !skip(l.value));

  console.log(`Found ${leaves.length} strings → translating ${toTranslate.length}, skipping ${leaves.length - toTranslate.length}`);
  if (email) console.log(`Using email quota: ${email}`);

  for (let i = 0; i < toTranslate.length; i++) {
    const leaf = toTranslate[i];
    process.stdout.write(`  [${i + 1}/${toTranslate.length}] `);
    const result = await translate(leaf.value);
    setByPath(en, leaf.path, result);
    process.stdout.write(`${result.slice(0, 60).replace(/\n/g, ' ')}…\n`);
    if (i < toTranslate.length - 1) await sleep(DELAY_MS);
  }

  en.ui.langShort = 'EN';

  content.en = en;
  fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log('\n✓  content.json updated — review then commit.');
}

main().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
