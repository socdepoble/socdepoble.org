// core/edge_rag.mjs — Cercador semàntic local: TF-IDF + similitud cosinus. Zero dependències,
// zero vector DB extern, pura matemàtica. Índex invertit (terme -> llista de docs) perquè una
// consulta només toque els documents rellevants, no tot el corpus. A ~500 .md el corpus sencer
// (Maps dispersos, mai els fitxers originals sencers) cap folgadament dins la RAM d'un iPad A10:
// el text cru de cada fitxer es descarta tan bon punt es tokenitza, no es reté enlloc.
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
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
    if ((e.name.startsWith('.') && e.name !== '.agents') || e.name === 'node_modules') continue;
    
    // Filtres RAG canònics (Fase 1)
    if (e.name === 'vendor' || e.name === 'mirrors' || e.name.startsWith('90_') || e.name.toLowerCase().includes('petorreta')) continue;

    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (full.includes('bot/var') || full.includes('05_Escriptori') || full.includes('04_ARXIU')) continue;
      await walk(full, acc);
    } else if (e.name.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

// L'apòstrof actua de separador natural: "l'aigua" -> "l", "aigua" (el fragment "l" cau després
// per longitud mínima). Així "aigua" indexa igual amb elisió o sense — més recall real en català.
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
  for (const [k, v] of tf) tf.set(k, v / total); // normalitzat per longitud de document
  return tf;
}

/** Construeix l'índex invertit a partir d'una carpeta arrel. Reté només vectors dispersos. */
export async function buildIndex(root, options = {}) {
  const rules = await loadRules();
  const cfg = rules.edgeRag || {};
  const stopwords = new Set(cfg.stopwordsCa || []);
  const minLen = cfg.minTokenLength ?? 2;

  const files = options.files || (await walk(root));
  const meta = [];
  const df = new Map(); // terme -> nombre de documents que el contenen
  const perDocTf = [];

  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (parsed.malformed || parsed.errors.length) {
      throw new Error(`Frontmatter invàlid en ${relative(root, file)}: ${parsed.errors.join('; ') || 'bloc mal tancat'}`);
    }
    const body = parsed.body;
    const tokens = tokenize(body, stopwords, minLen);
    const tf = termFreq(tokens);
    for (const term of tf.keys()) df.set(term, (df.get(term) || 0) + 1);
    meta.push({ id: meta.length, path: relative(root, file), length: tokens.length });
    perDocTf.push(tf);
    // `raw`/`body`/`tokens` moren ací: res del text cru sobreviu fora del Map `tf`.
  }

  const N = meta.length || 1;
  const idf = new Map();
  for (const [term, count] of df) idf.set(term, Math.log((N + 1) / (count + 1)) + 1); // suavitzat, sempre > 0

  const inverted = new Map(); // terme -> [{ docId, weight }]
  const norms = new Array(meta.length).fill(0);
  perDocTf.forEach((tf, docId) => {
    let sumSq = 0;
    for (const [term, freq] of tf) {
      const weight = freq * (idf.get(term) || 0);
      sumSq += weight * weight;
      if (!inverted.has(term)) inverted.set(term, []);
      inverted.get(term).push({ docId, weight });
    }
    norms[docId] = Math.sqrt(sumSq) || 1e-9; // evita divisió per zero en cosinus
  });

  return { docs: meta, inverted, idf, norms, stopwords, minLen, docCount: meta.length };
}

/** Cerca les millors coincidències per a `query` dins l'índex de buildIndex(). */
export function search(index, query, topK) {
  const k = topK ?? 10;
  const qTokens = tokenize(query, index.stopwords, index.minLen);
  if (!qTokens.length) return [];

  const qTf = termFreq(qTokens);
  const qVec = new Map();
  let qSumSq = 0;
  for (const [term, freq] of qTf) {
    const idfVal = index.idf.get(term);
    if (idfVal === undefined) continue; // terme absent del corpus: no aporta senyal
    const weight = freq * idfVal;
    qVec.set(term, weight);
    qSumSq += weight * weight;
  }
  if (qVec.size === 0) return [];
  const qNorm = Math.sqrt(qSumSq) || 1e-9;

  const dot = new Map(); // docId -> producte escalar acumulat (només docs amb >=1 terme comú)
  for (const [term, qWeight] of qVec) {
    const postings = index.inverted.get(term);
    if (!postings) continue;
    for (const { docId, weight } of postings) dot.set(docId, (dot.get(docId) || 0) + qWeight * weight);
  }

  const results = [];
  for (const [docId, d] of dot) {
    const sim = d / (qNorm * index.norms[docId]);
    if (sim > 0) results.push({ path: index.docs[docId].path, score: sim });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}

export async function run(options) {
  if (!options.query) return { ok: false, summary: '[ERROR] Cal --query="text a buscar".', data: {} };
  const root = options.root || '.';
  const index = await buildIndex(root);
  const results = search(index, options.query, options.top ? Number(options.top) : undefined);
  return {
    ok: true,
    summary: `${results.length} resultats per a "${options.query}" (corpus: ${index.docCount} fitxers).`,
    data: { query: options.query, docCount: index.docCount, results },
  };
}
