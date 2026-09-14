import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { parseFrontmatter } from '../lib/frontmatter.mjs';

const RULES_URL = new URL('../rules/trellat-rules.json', import.meta.url);
let rulesCache = null;

async function loadRules() {
  if (!rulesCache) rulesCache = JSON.parse(await readFile(RULES_URL, 'utf8'));
  return rulesCache;
}

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if ((e.name.startsWith('.') && e.name !== '.agents' && !dir.includes('.agents/skills')) || e.name === 'node_modules') continue;
    if (e.name === 'vendor' || e.name === 'mirrors' || e.name.startsWith('90_') || e.name.toLowerCase().includes('petorreta')) continue;

    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (full.includes('bot/var') || full.includes('04_ARXIU')) continue;
      await walk(full, acc);
    } else if (e.name.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

const WORD_RE = /[a-zà-ÿ0-9]+/g;

function tokenize(text, stopwords, minLen) {
  const raw = text.toLowerCase().match(WORD_RE) || [];
  const out = [];
  for (const t of raw) {
    if (t.length < minLen || stopwords.has(t)) continue;
    out.push(t);
  }
  return out;
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const total = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / total);
  return tf;
}

export async function buildIndex(root, options = {}) {
  const rules = await loadRules();
  const cfg = rules.edgeRag || {};
  const stopwords = new Set(cfg.stopwordsCa || []);
  const minLen = cfg.minTokenLength ?? 2;

  const files = options.files || (await walk(root));
  const meta = [];
  const df = new Map();
  const perDocTf = [];

  let malformedCount = 0;
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (parsed.malformed || parsed.errors.length) {
      console.warn(`[WARN] Frontmatter trencat o parsat amb errors a ${file}`);
      malformedCount++;
      continue;
    }
    let indexableText = parsed.body;
    const attr = parsed.attributes || {};
    if (attr.tags) {
      const tagsStr = Array.isArray(attr.tags) ? attr.tags.join(' ') : String(attr.tags);
      indexableText += ' ' + tagsStr;
    }
    if (attr.aliases) {
      const aliasesStr = Array.isArray(attr.aliases) ? attr.aliases.join(' ') : String(attr.aliases);
      indexableText += ' ' + aliasesStr;
    }
    
    const tokens = tokenize(indexableText, stopwords, minLen);
    const tf = termFreq(tokens);
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
    meta.push({ id: meta.length, path: relative(root, file), length: tokens.length });
    perDocTf.push(tf);
  }

  const N = meta.length || 1;
  const idf = {};
  for (const [term, count] of df) idf[term] = Math.log((N + 1) / (count + 1)) + 1;

  const inverted = Object.create(null);
  const norms = new Array(meta.length).fill(0);
  perDocTf.forEach((tf, docId) => {
    let sumSq = 0;
    for (const [term, freq] of tf) {
      const weight = freq * (idf[term] || 0);
      sumSq += weight * weight;
      if (!inverted[term]) inverted[term] = [];
      inverted[term].push({ docId, weight });
    }
    norms[docId] = Math.sqrt(sumSq) || 1e-9;
  });

  return { docs: meta, inverted, idf, norms, stopwords: [...stopwords], minLen, docCount: meta.length, malformedCount };
}

export async function run(options) {
  const root = options.root || '.';
  console.log('Construint índex RAG...');
  const index = await buildIndex(root);
  if (index.malformedCount > 0) {
    console.error(`[FATAL] S'han detectat ${index.malformedCount} fitxers amb frontmatter trencat. Corregiu-los.`);
    process.exit(1);
  }
  const outFile = join(root, 'public', 'rag-index.json');
  await writeFile(outFile, JSON.stringify(index), 'utf8');
  console.log(`Índex construït amb ${index.docCount} documents a ${outFile}`);
  return { ok: true, summary: `Índex RAG construït.`, data: {} };
}
