#!/usr/bin/env node
/**
 * tractor-frontmatter.mjs — PORTA DE L'ESQUEMA CANÒNIC (v2)
 *
 * FONT DE VERITAT ÚNICA
 * ─────────────────────
 *   tooling/wiki/schema.json  ·  wiki-frontmatter-v2.1
 *   L'esquema v1 (esquema_frontmatter.json) queda obsolet i NO es llig ací.
 *   Este fitxer no declara cap clau, cap enum ni cap límit: tot ho deriva
 *   del JSON Schema. Si voleu canviar la llei, canvieu l'esquema.
 *
 * LLEIS
 *   F1 OBLIGATÒRIA  falta una clau de `required`  → UNA per clau absent
 *   F2 FORASTERA    clau fora de `properties` amb additionalProperties:false
 *   F3 ENUM         valor fora del domini declarat
 *   F4 VOCABULARI   tag fora de properties.tags.items.enum (dorment si no existix)
 *   F5 ENTROPIA     clau no obligatòria amb un únic valor en tot el corpus
 *   F6 DUPLICADA    la mateixa clau dos vegades al mateix frontmatter
 *   F7 FORMAT       tipus, longitud, cardinalitat, unicitat o YAML il·legible
 *   F8 MARCADOR     placeholder {…} fora d'una plantilla declarada
 *
 *   F1 es compta per clau absent i no per document. Amb el recompte antic,
 *   esborrar el frontmatter sencer valia 1 punt i deixar-lo incomplet en
 *   valia 3: la mesura premiava la mutilació. Ara no.
 *
 *   F8 substituïx l'antiga exempció per contingut. Abans, qualsevol `{x}` en
 *   qualsevol valor feia saltar el document sencer per damunt de les sis
 *   lleis. Ara el marcador només es tolera si el document declara
 *   `tipus: plantilla`, mai en `tipus` ni en `estat`, i mai eximix ni la
 *   presència de claus (F1) ni les claus forasteres (F2).
 *
 * BLINDATGES (ixen amb codi 2, no amb avís)
 *   · Esquema absent.
 *   · Esquema amb una construcció que este tractor no sap fer complir.
 *   · schemaSha256 del pany de migració que no quadra amb l'esquema real.
 *   · Deute segellat amb un esquema o un mètode de recompte distint de l'actual.
 *
 * ÚS
 *   node tooling/wiki/tractor-frontmatter.mjs
 *   node tooling/wiki/tractor-frontmatter.mjs --json
 *   node tooling/wiki/tractor-frontmatter.mjs --estricte      # zero tolerància
 *   node tooling/wiki/tractor-frontmatter.mjs --baseline      # segella el deute
 *   node tooling/wiki/tractor-frontmatter.mjs --segella-esquema
 *   node tooling/wiki/tractor-frontmatter.mjs --arrels=src,docs
 *
 * Pedra Seca: zero dependències, ESM, fail-closed. El lector de frontmatter
 * és intern a propòsit: una porta que depén del parser que vigila hereta els
 * seus errors i deixa de ser una porta.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const METODE = 'F1-per-clau/v2';

/* ──────────────────────────── Arguments ──────────────────────────── */

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const TE = (n) => process.argv.includes(`--${n}`);

const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = TE('json');
const BASELINE = TE('baseline');
const SEGELLA_ESQ = TE('segella-esquema');
const ESTRICTE = TE('estricte');
const MOSTRA = Number(ARG('mostra') ?? 6);

const ESQUEMA = path.join(ARREL, 'tooling/wiki/schema.json');
const PANY = path.join(ARREL, 'tooling/wiki/schema-cutover.lock.json');
const ABAST = path.join(ARREL, 'tooling/wiki/frontmatter-abast.json');
const DEUTE = path.join(ARREL, '.agents/deute/.frontmatter-deute.json');

const mor = (msg, detall = []) => {
  console.error(`❌ [FRONTMATTER] ${msg}`);
  for (const d of detall) console.error(`   ${d}`);
  process.exit(2);
};

/* ──────────────────────────── Esquema ──────────────────────────── */

if (!fs.existsSync(ESQUEMA)) {
  mor(`Falta l'esquema canònic: ${ESQUEMA}`, ['Sense esquema no hi ha llei. Fallem tancat.']);
}

const BRUT = fs.readFileSync(ESQUEMA);
const SHA = crypto.createHash('sha256').update(BRUT).digest('hex');

let S;
try { S = JSON.parse(BRUT.toString('utf8')); }
catch (e) { mor(`L'esquema no és JSON vàlid: ${e.message}`); }

/* El pany de migració declara el SHA de l'esquema. Si el declara i no quadra,
 * algú ha tocat la llei sense tornar a segellar-la. */
if (SEGELLA_ESQ) {
  if (!fs.existsSync(PANY)) mor(`No hi ha pany per a segellar: ${PANY}`);
  const p = JSON.parse(fs.readFileSync(PANY, 'utf8'));
  p.schemaSha256 = SHA;
  fs.writeFileSync(PANY, JSON.stringify(p, null, 2) + '\n');
  console.log(`🔒 [FRONTMATTER] Pany actualitzat: schemaSha256 = ${SHA}`);
  process.exit(0);
}
if (fs.existsSync(PANY)) {
  const p = JSON.parse(fs.readFileSync(PANY, 'utf8'));
  if (p.schemaSha256 && p.schemaSha256 !== SHA) {
    mor('El pany de migració no quadra amb l\'esquema real.', [
      `declarat : ${p.schemaSha256}`,
      `real     : ${SHA}`,
      'Reconcilieu-ho: node tooling/wiki/tractor-frontmatter.mjs --segella-esquema',
    ]);
  }
} else {
  console.error(`⚠️  [FRONTMATTER] Sense pany a ${PANY}. L'esquema circula sense segell.`);
}

/* Anti-deriva: si l'esquema creix amb una construcció que no sabem fer
 * complir, callar seria pitjor que caure. */
const ARREL_OK = new Set(['$schema', '$id', 'title', 'description', '$comment', 'type',
  'additionalProperties', 'required', 'properties']);
const PROP_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength',
  'minItems', 'maxItems', 'uniqueItems', 'items', 'description', '$comment']);
const ITEM_OK = new Set(['type', 'enum', 'const', 'pattern', 'minLength', 'maxLength']);

const desconegudes = [];
for (const k of Object.keys(S)) if (!ARREL_OK.has(k)) desconegudes.push(`(arrel) ${k}`);
for (const [nom, def] of Object.entries(S.properties ?? {})) {
  for (const k of Object.keys(def)) if (!PROP_OK.has(k)) desconegudes.push(`${nom}.${k}`);
  for (const k of Object.keys(def.items ?? {})) if (!ITEM_OK.has(k)) desconegudes.push(`${nom}.items.${k}`);
}
if (desconegudes.length) {
  mor('L\'esquema usa construccions que este tractor no sap fer complir.', [
    ...desconegudes.map((d) => `· ${d}`),
    'Amplieu el tractor o simplifiqueu l\'esquema. No validem a mitges.',
  ]);
}

const PROPS = S.properties ?? {};
const REQ = S.required ?? [];
const TANCAT = S.additionalProperties === false;
const VOC = PROPS.tags?.items?.enum ?? null;

/* ──────────────────────────── Abast ──────────────────────────── */

const aRegex = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\//g, '\u0001')
  .replace(/\*\*/g, '\u0000')
  .replace(/\*/g, '[^/]*')
  .replace(/\u0000/g, '.*')
  .replace(/\u0001/g, '(?:.*/)?') + '$');

const PER_DEFECTE = {
  arrels: ['.'],
  exclou: ['node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'coverage',
    '.vite', '.next', '.nuxt', '.cache', '.turbo', '.obsidian', '.sdp-paperera',
    '90_historic', '90_arxiu_historic', '.quarantena-*', 'bot'],
  immutables: [],
  perfils: [],
};

const CFG = fs.existsSync(ABAST)
  ? { ...PER_DEFECTE, ...JSON.parse(fs.readFileSync(ABAST, 'utf8')) }
  : PER_DEFECTE;

const ARRELS = (ARG('arrels') ?? CFG.arrels.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const EXCLOU = CFG.exclou.map((p) => aRegex(p.includes('/') ? p : `**/${p}`));
const IMMUTABLES = CFG.immutables.map(aRegex);
const PERFILS = CFG.perfils.map((p) => ({ re: aRegex(p.abast), exigix: p.exigix ?? [] }));

function recorre(rel, acc) {
  const abs = rel ? path.join(ARREL, rel) : ARREL;
  let entrades;
  try { entrades = fs.readdirSync(abs, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrades) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (EXCLOU.some((re) => re.test(r))) continue;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) recorre(r, acc);
    else if (e.name.toLowerCase().endsWith('.md')) acc.push(r);
  }
  return acc;
}

const cru = [];
for (const a of ARRELS) recorre(a === '.' ? '' : a.replace(/^\.\//, '').replace(/\/+$/, ''), cru);

const TOTS = [...new Set(cru)].sort();
const EXEMPTS = TOTS.filter((n) => IMMUTABLES.some((re) => re.test(n)));
const NODES = TOTS.filter((n) => !EXEMPTS.includes(n));

if (NODES.length === 0) {
  mor(`Cap document a ${ARRELS.join(', ')} des de ${ARREL}.`, ['Reviseu --arrel o frontmatter-abast.json.']);
}

/* ──────────────────────────── Lector de frontmatter ──────────────────────────── */

const MARCADOR = /\{[^}\n]+\}/;

function escalar(s) {
  const t = s.trim();
  if (t === '') return null;
  const q = /^"([\s\S]*)"$/.exec(t) ?? /^'([\s\S]*)'$/.exec(t);
  if (q) return q[1];
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;
  if (/^-?\d+$/.test(t)) return Number(t);
  return t;
}

function flux(s) {
  const t = s.trim();
  if (!/^\[[\s\S]*\]$/.test(t)) return { mal: true, valor: t };
  const dins = t.slice(1, -1);
  if (!dins.trim()) return { mal: false, valor: [] };
  const out = []; let buf = ''; let q = null;
  for (const c of dins) {
    if (q) { if (c === q) q = null; else buf += c; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === ',') { out.push(escalar(buf)); buf = ''; continue; }
    buf += c;
  }
  out.push(escalar(buf));
  return { mal: false, valor: out };
}

function parteix(txt) {
  const t = txt.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!t.startsWith('---\n')) return null;
  const fi = t.indexOf('\n---', 3);
  const fi2 = t.indexOf('\n...', 3);
  const tall = fi === -1 ? fi2 : (fi2 === -1 ? fi : Math.min(fi, fi2));
  if (tall === -1) return null;
  return t.slice(4, tall + 1);
}

function llig(cos) {
  const linies = cos.split('\n');
  const valors = new Map();
  const claus = [];
  const avisos = [];
  let i = 0;
  while (i < linies.length) {
    const l = linies[i];
    if (!l.trim() || /^\s*#/.test(l)) { i++; continue; }
    const m = /^([A-Za-z_][\w.$-]*)\s*:\s*(.*)$/.exec(l);
    if (!m) {
      avisos.push({ codi: 'F7', detall: `línia ${i + 1} il·legible: «${l.trim().slice(0, 48)}»` });
      i++; continue;
    }
    const clau = m[1];
    const resta = m[2].trim();
    let valor;
    if (resta === '') {
      const items = []; let j = i + 1; let nidat = false;
      while (j < linies.length) {
        const n = linies[j];
        if (!n.trim()) { j++; continue; }
        const li = /^\s+-\s*(.*)$/.exec(n);
        if (li) { items.push(escalar(li[1])); j++; continue; }
        if (/^\s+\S/.test(n)) { nidat = true; j++; continue; }
        break;
      }
      if (nidat) { avisos.push({ codi: 'F7', detall: `«${clau}» conté un mapa nidat` }); valor = undefined; }
      else valor = items.length ? items : null;
      i = j;
    } else if (resta.startsWith('[')) {
      const f = flux(resta);
      if (f.mal) avisos.push({ codi: 'F7', detall: `«${clau}» té una llista en línia mal tancada` });
      valor = f.valor; i++;
    } else { valor = escalar(resta); i++; }
    claus.push(clau);
    if (valors.has(clau)) avisos.push({ codi: 'F6', detall: clau });
    else valors.set(clau, valor);
  }
  return { valors, claus, avisos };
}

/* ──────────────────────────── Anàlisi ──────────────────────────── */

const f = { F1: [], F2: [], F3: [], F4: [], F5: [], F6: [], F7: [], F8: [] };
const usPerClau = new Map();
const valsPerClau = new Map();

const esMarcador = (v) => typeof v === 'string' && MARCADOR.test(v);
const teMarcador = (v) => Array.isArray(v) ? v.some(esMarcador) : esMarcador(v);

function comprovaEscalar(n, clau, v, def) {
  if (def.type === 'string' && typeof v !== 'string') {
    f.F7.push({ n, clau, detall: `s'esperava text i és ${v === null ? 'buit' : typeof v}` }); return;
  }
  if (def.type === 'boolean' && typeof v !== 'boolean') { f.F7.push({ n, clau, detall: 'no és booleà' }); return; }
  if (def.type === 'integer' && !Number.isInteger(v)) { f.F7.push({ n, clau, detall: 'no és enter' }); return; }
  if (typeof v === 'string') {
    if (def.enum && !def.enum.includes(v)) f.F3.push({ n, clau, valor: v });
    if (def.const !== undefined && v !== def.const) f.F3.push({ n, clau, valor: v });
    if (def.minLength != null && v.length < def.minLength) f.F7.push({ n, clau, detall: `${v.length} < mín ${def.minLength}` });
    if (def.maxLength != null && v.length > def.maxLength) f.F7.push({ n, clau, detall: `${v.length} > màx ${def.maxLength}` });
    if (def.pattern && !new RegExp(def.pattern).test(v)) f.F7.push({ n, clau, detall: 'no casa amb el patró' });
  }
}

for (const n of NODES) {
  let txt;
  try { txt = fs.readFileSync(path.join(ARREL, n), 'utf8'); } catch { continue; }
  const cos = parteix(txt);

  if (cos === null) {
    for (const k of REQ) f.F1.push({ n, clau: k });
    continue;
  }

  const { valors, claus, avisos } = llig(cos);
  for (const a of avisos) f[a.codi].push({ n, clau: a.detall });

  const plantilla = valors.get('tipus') === 'plantilla' || valors.get('type') === 'plantilla';

  const exigides = [...new Set([
    ...REQ,
    ...PERFILS.filter((p) => p.re.test(n)).flatMap((p) => p.exigix),
  ])];
  for (const k of exigides) if (!valors.has(k)) f.F1.push({ n, clau: k });

  const hasType = valors.has('type');
  const hasTipus = valors.has('tipus');
  if (!hasType && !hasTipus) f.F1.push({ n, clau: 'type|tipus' });
  if (hasType && hasTipus && valors.get('type') !== valors.get('tipus')) {
    f.F1.push({ n, clau: 'type_contra_tipus' });
  }

  const hasStatus = valors.has('status');
  const hasEstat = valors.has('estat');
  if (!hasStatus && !hasEstat) f.F1.push({ n, clau: 'status|estat' });
  if (hasStatus && hasEstat && valors.get('status') !== valors.get('estat')) {
    f.F1.push({ n, clau: 'status_contra_estat' });
  }

  for (const k of new Set(claus)) {
    usPerClau.set(k, (usPerClau.get(k) ?? 0) + 1);
    const v = valors.get(k);
    if (!valsPerClau.has(k)) valsPerClau.set(k, new Set());
    for (const x of Array.isArray(v) ? v : [v]) if (x != null) valsPerClau.get(k).add(String(x));

    const def = PROPS[k];
    if (!def) { if (TANCAT) f.F2.push({ n, clau: k }); continue; }
    if (v === undefined) continue;

    if (teMarcador(v)) {
      if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status' || !plantilla) {
        f.F8.push({ n, clau: k, valor: String(Array.isArray(v) ? v.find(esMarcador) : v) });
      }
      if (k === 'tipus' || k === 'estat' || k === 'type' || k === 'status') continue;
      if (plantilla) continue;
    }

    if (def.type === 'array') {
      if (!Array.isArray(v)) { f.F7.push({ n, clau: k, detall: 'no és una llista' }); continue; }
      if (def.minItems != null && v.length < def.minItems) f.F7.push({ n, clau: k, detall: `${v.length} < mín ${def.minItems} elements` });
      if (def.maxItems != null && v.length > def.maxItems) f.F7.push({ n, clau: k, detall: `${v.length} > màx ${def.maxItems} elements` });
      if (def.uniqueItems && new Set(v.map(String)).size !== v.length) f.F7.push({ n, clau: k, detall: 'elements repetits' });
      for (const it of v) {
        if (def.items) comprovaEscalar(n, `${k}[]`, it, def.items);
        if (k === 'tags' && VOC && typeof it === 'string' && !VOC.includes(it)) f.F4.push({ n, tag: it });
      }
      continue;
    }
    comprovaEscalar(n, k, v, def);
  }
}

/* F5 — entropia zero. Les obligatòries queden fora: `tipus` o `estat` poden
 * tindre legítimament un únic valor en un corpus jove. */
for (const [k, vals] of valsPerClau) {
  if (REQ.includes(k)) continue;
  if (vals.size === 1 && (usPerClau.get(k) ?? 0) >= 2) {
    f.F5.push({ clau: k, usos: usPerClau.get(k), valor: [...vals][0] });
  }
}

/* ──────────────────────────── Veredicte ──────────────────────────── */

const LLEIS = Object.keys(f);
const compte = Object.fromEntries(LLEIS.map((k) => [k, f[k].length]));
const segell = { esquema: S.$id ?? 'sense-id', esquemaSha256: SHA, metode: METODE };

if (BASELINE) {
  fs.mkdirSync(path.dirname(DEUTE), { recursive: true });
  fs.writeFileSync(DEUTE, JSON.stringify({ generat: new Date().toISOString(), ...segell, max: compte }, null, 2) + '\n');
  console.log(`🔒 [FRONTMATTER] Deute segellat a ${DEUTE}`);
  console.log(JSON.stringify(compte));
  console.log('   El deute només pot baixar. Si puja, la porta cau.');
  process.exit(0);
}

let max = Object.fromEntries(LLEIS.map((k) => [k, 0]));
if (ESTRICTE) {
  // sostre zero
} else if (fs.existsSync(DEUTE)) {
  const d = JSON.parse(fs.readFileSync(DEUTE, 'utf8'));
  if (d.esquema !== segell.esquema || d.esquemaSha256 !== segell.esquemaSha256 || d.metode !== segell.metode) {
    mor('El deute segellat és d\'una altra llei.', [
      `deute : ${d.esquema ?? '?'} · ${d.metode ?? '?'} · ${(d.esquemaSha256 ?? '?').slice(0, 12)}`,
      `ara   : ${segell.esquema} · ${segell.metode} · ${SHA.slice(0, 12)}`,
      'Un sostre heretat d\'un esquema mort deixa la porta verda sobre un corpus brut.',
      'Torneu a segellar: node tooling/wiki/tractor-frontmatter.mjs --baseline',
    ]);
  }
  max = { ...max, ...d.max };
}

if (JSON_OUT) {
  console.log(JSON.stringify({ arrel: ARREL, documents: NODES.length, exempts: EXEMPTS.length, ...segell, compte, max, fallades: f }, null, 1));
} else {
  const noms = {
    F1: 'OBLIGATÒRIA — falta una clau de `required`',
    F2: 'FORASTERA — clau fora de l\'esquema',
    F3: 'ENUM — valor fora del domini',
    F4: 'VOCABULARI — tag fora del vocabulari tancat',
    F5: 'ENTROPIA — clau amb un únic valor: cerimònia',
    F6: 'DUPLICADA — clau repetida al frontmatter',
    F7: 'FORMAT — tipus, longitud, cardinalitat o YAML il·legible',
    F8: 'MARCADOR — placeholder fora d\'una plantilla declarada',
  };
  console.log('\n📋 TRACTOR FRONTMATTER — esquema canònic');
  console.log('─'.repeat(72));
  console.log(`  ${NODES.length} documents · ${EXEMPTS.length} immutables · ${S.$id ?? 'sense-id'}`);
  console.log(`  ${REQ.length} obligatòries · ${Object.keys(PROPS).length} claus declarades · tancat: ${TANCAT ? 'sí' : 'no'}`);
  if (!VOC) console.log('  F4 dorment: l\'esquema no declara properties.tags.items.enum\n');
  else console.log(`  vocabulari tancat: ${VOC.length} termes\n`);
  for (const llei of LLEIS) {
    const items = f[llei];
    const sostre = max[llei] ?? 0;
    const icona = items.length > sostre ? '❌' : items.length ? '·' : '✅';
    console.log(`${icona} ${llei} · ${noms[llei]} — ${items.length} màx ${sostre}`);
    for (const it of items.slice(0, MOSTRA)) {
      if (llei === 'F5') { console.log(`      ${it.clau} = «${it.valor}» ×${it.usos}`); continue; }
      const cua = [it.clau && `→ ${it.clau}`, it.valor && `= «${it.valor}»`, it.tag && `→ #${it.tag}`, it.detall].filter(Boolean).join(' ');
      console.log(`      ${it.n}  ${cua}`);
    }
    if (items.length > MOSTRA) console.log(`      … i ${items.length - MOSTRA} més`);
  }
  console.log('─'.repeat(72));
}

const pujat = LLEIS.filter((k) => compte[k] > (max[k] ?? 0));
if (pujat.length) {
  console.error(`\n❌ [FRONTMATTER] El deute ha pujat: ${pujat.map((k) => `${k} ${max[k] ?? 0}→${compte[k]}`).join(', ')}`);
  console.error('   Arregla-ho: node tooling/wiki/codemod_frontmatter.mjs --escriu');
  process.exit(1);
}
console.log(`\n✅ [FRONTMATTER] Esquema respectat. Deute no ha pujat.${ESTRICTE ? ' (estricte)' : ''}`);
process.exit(0);
