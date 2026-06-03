#!/usr/bin/env node
/**
 * Regenerates the "en" section of content.json from the "fr" source via Gemini.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/translate.js
 *
 * Free key (no credit card): https://aistudio.google.com/app/apikey
 * Free tier: 15 req/min, 1 M tokens/day — more than enough for a portfolio.
 *
 * After running, review the output then commit content.json.
 * Only edit the "fr" section — "en" is fully overwritten each run.
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const CONTENT    = path.resolve(__dirname, '../assets/i18n/content.json');
const API_KEY    = process.env.GEMINI_API_KEY;
const BATCH_SIZE = 80; // strings per Gemini call (well within token limits)

if (!API_KEY) {
  console.error('Set GEMINI_API_KEY. Free key (no card) at https://aistudio.google.com/app/apikey');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Recursively collect every string leaf: [{path: [key|index, …], value}]
function collectLeaves(obj, path = []) {
  if (typeof obj === 'string') return [{ path, value: obj }];
  if (Array.isArray(obj))
    return obj.flatMap((v, i) => collectLeaves(v, [...path, i]));
  if (obj && typeof obj === 'object')
    return Object.entries(obj).flatMap(([k, v]) => collectLeaves(v, [...path, k]));
  return [];
}

function setByPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
  cur[path[path.length - 1]] = value;
}

// Returns true for strings that don't need translation
function skip(v) {
  if (!v.trim()) return true;
  if (/^[\d\s/–-]+$/.test(v)) return true;                 // years / periods
  if (/^https?:\/\//.test(v)) return true;                 // bare URL
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return true;  // email
  if (/^\(?\+?[\d\s()+-]+$/.test(v)) return true;         // phone
  if (/^&copy;/.test(v)) return true;                      // HTML entity
  return false;
}

// ── Gemini request ────────────────────────────────────────────────────────────

function geminiTranslate(texts) {
  return new Promise((resolve, reject) => {
    const prompt =
      `You are a professional translator. Translate the following French strings to English.\n` +
      `Rules:\n` +
      `- Return ONLY a valid JSON array with exactly ${texts.length} strings, same order\n` +
      `- Preserve all HTML tags and href attributes exactly as-is\n` +
      `- Keep proper nouns, institution names, and technical terms as-is\n` +
      `- Use a concise, professional tone (portfolio / CV context)\n\n` +
      `Input:\n${JSON.stringify(texts)}`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });

    const req = https.request(
      {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Gemini ${res.statusCode}: ${data}`));
            return;
          }
          try {
            const payload  = JSON.parse(data);
            const text     = payload.candidates[0].content.parts[0].text;
            const result   = JSON.parse(text);
            if (!Array.isArray(result) || result.length !== texts.length) {
              reject(new Error(`Gemini returned ${result.length} items, expected ${texts.length}`));
              return;
            }
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${e.message}\n${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
  const fr = content.fr;
  const en = deepClone(fr);

  const leaves      = collectLeaves(fr);
  const toTranslate = leaves.filter(l => !skip(l.value));
  const skipped     = leaves.length - toTranslate.length;

  console.log(`Found ${leaves.length} strings → translating ${toTranslate.length}, skipping ${skipped}`);

  const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch   = toTranslate.slice(i, i + BATCH_SIZE);
    const batchNo = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  batch ${batchNo}/${totalBatches}… `);

    const translated = await geminiTranslate(batch.map(l => l.value));
    batch.forEach((leaf, j) => setByPath(en, leaf.path, translated[j]));
    console.log('ok');
  }

  // Hard-coded values that aren't translations
  en.ui.langShort = 'EN';

  content.en = en;
  fs.writeFileSync(CONTENT, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log('✓  content.json updated — review then commit.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
