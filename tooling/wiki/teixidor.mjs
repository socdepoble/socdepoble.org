#!/usr/bin/env node
/**
 * teixidor.mjs — MESURA HONESTA DE LA COHESIÓ DEL GRAF
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   La wiki sembla cosida i no ho està del tot. L'auditoria 260831 va comptar
 *   396 enllaços `[[...]]` al bundle. 91 d'eixos (23%) no són enllaços: són
 *   etiquetes del bloc «## Taxonomia» (`[[Graf]]` ×46, `[[Maquina]]` ×22,
 *   `[[Identitat]]` ×16). Cap d'eixes destinacions existix com a document.
 *   Inflen el graf d'Obsidian i el compte d'orfes ix bonic sense ser-ho.
 *
 *   A més va trobar que `.agents/` (22 fitxers: AGENTS, BIOS, LEDGER i les 12
 *   SKILL.md) és una illa perfecta: zero enllaços d'entrada, zero d'eixida.
 *   El cervell no forma part del graf que el cervell ha de navegar.
 *
 * LLEIS
 *   T1 ORFE          document que ningú enllaça (etiquetes no compten)
 *   T2 PENJAT        `[[destí]]` que no resol a cap fitxer
 *   T3 ILLA          component connex que no toca l'àncora declarada
 *   T4 ETIQUETA-FALSA `[[X]]` dins del bloc Taxonomia sense fitxer darrere:
 *                    o es crea la nota d'etiqueta o s'escriu com a `#tag`
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, deute amb cadenat.
 *
 *   node tooling/wiki/teixidor.mjs
 *   node tooling/wiki/teixidor.mjs --json
 *   node tooling/wiki/teixidor.mjs --baseline
 *   node tooling/wiki/teixidor.mjs --dot > graf.dot   # per a Graphviz
 */

import fs from 'node:fs';
import {isExecutionEvidence} from '../lib/corpus-scope.mjs';
import path from 'node:path';
import { construeixIndex, resol } from './lib/resolutor.mjs';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = process.argv.includes('--json');
const DOT = process.argv.includes('--dot');
const BASELINE = process.argv.includes('--baseline');
const DEUTE = path.join(ARREL, '.agents/deute/.teixit-deute.json');

const ANCORA = ARG('ancora') ?? '00_index_escriptori';
/* Arrels del graf. `.agents` hi entra a posta: el cervell també és wiki. */
const ARRELS = (ARG('arrels') ?? '_wiki_de_poble,.agents').split(',');

const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|90_historic|90_arxiu_historic|\.quarantena-260830|\.agents\/deute|\.sdp-paperera)(\/|$)/;

/* ───────────────────────────── Recollida ───────────────────────────── */

function md(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (isExecutionEvidence(rel) || EXCLOU.test(rel)) continue;
    if (e.isDirectory()) md(rel, acc);
    else if (e.name.endsWith('.md')) acc.push(rel);
  }
  return acc;
}

const NODES = ARRELS.flatMap((d) => md(d)).sort();
if (NODES.length === 0) {
  console.error(`❌ [TEIXIDOR] Cap document a ${ARRELS.join(', ')} des de ${ARREL}. Usa --arrel=.`);
  process.exit(2);
}

const idx = construeixIndex(NODES);

/* ─────────────────────────── Construcció del graf ─────────────────────────── */

const ENLLAC = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
/* Línia d'etiqueta: «- **Categoria:** [[X]]» / «- **Etiquetes:** [[Y]]» */
const LINIA_ETIQUETA = /^\s*[-*]?\s*\*{0,2}(Categoria|Etiquetes|Etiqueta|Tags?|Tema)\*{0,2}\s*:/i;

const ix = new Map(NODES.map((n) => [n, new Set()]));
const entra = new Map(NODES.map((n) => [n, new Set()]));
const penjats = [];
const etiquetesFalses = new Map();
let arestesReals = 0;
let pseudo = 0;

for (const n of NODES) {
  const linies = fs.readFileSync(path.join(ARREL, n), 'utf8').split('\n');
  let dinsCodi = false;
  linies.forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { dinsCodi = !dinsCodi; return; }
    if (dinsCodi) return;
    const esEtiqueta = LINIA_ETIQUETA.test(ln);
    for (const m of ln.matchAll(ENLLAC)) {
      const brut = m[1].trim();
      const resolucio = resol(idx, brut);
      const clau = path.basename(brut).replace(/\.md$/, '');
      if (esEtiqueta) {
        pseudo += 1;
        if (!resolucio.ok) {
          if (!etiquetesFalses.has(clau)) etiquetesFalses.set(clau, []);
          etiquetesFalses.get(clau).push(`${n}:${i + 1}`);
        }
        continue; /* una etiqueta no és una aresta */
      }
      if (!resolucio.ok) { penjats.push({ font: n, linia: i + 1, desti: brut, motiu: resolucio.motiu }); continue; }
      arestesReals += 1;
      const d = resolucio.node;
      if (d !== n) {
        ix.get(n).add(d);
        entra.get(d).add(n);
      }
    }
  });
}

/* ───────────────────────── Components connexos ───────────────────────── */

const veins = new Map(NODES.map((n) => [n, new Set([...ix.get(n), ...entra.get(n)])]));
const comp = new Map();
let nComp = 0;
for (const n of NODES) {
  if (comp.has(n)) continue;
  const id = nComp++;
  const cua = [n];
  while (cua.length) {
    const x = cua.pop();
    if (comp.has(x)) continue;
    comp.set(x, id);
    for (const v of veins.get(x)) if (!comp.has(v)) cua.push(v);
  }
}
const membres = new Map();
for (const [n, c] of comp) {
  if (!membres.has(c)) membres.set(c, []);
  membres.get(c).push(n);
}
const nodeAncora = NODES.find((n) => path.basename(n, '.md') === ANCORA);
if (!nodeAncora) {
  /* Sense àncora, «illa» no vol dir res: tot component seria una illa i el
   * número eixiria alarmant sense informar. Fallem tancat i ho diem. */
  console.error(`❌ [TEIXIDOR] L'àncora «${ANCORA}» no és a ${ARRELS.join(', ')}.`);
  console.error('   Sense àncora no es pot decidir què és una illa. Opcions:');
  console.error(`     · --ancora=<nom-sense-extensio>   (ex.: --ancora=00_INDEX)`);
  console.error(`     · --arrels=<dir1,dir2>            (potser l'Escriptori queda fora de l'abast)`);
  process.exit(2);
}
const compAncora = comp.get(nodeAncora);

/* ──────────────────────────────── Eixida ──────────────────────────────── */

const orfes = NODES.filter((n) => entra.get(n).size === 0 && path.basename(n, '.md') !== ANCORA);
const illes = [...membres.entries()]
  .filter(([c]) => c !== compAncora)
  .map(([, m]) => m)
  .sort((a, b) => b.length - a.length);

if (DOT) {
  console.log('digraph teixit {\n  rankdir=LR;\n  node [shape=box,fontsize=9];');
  for (const n of NODES) {
    const c = comp.get(n);
    const color = c === compAncora ? 'black' : 'red';
    console.log(`  "${n}" [color=${color}];`);
  }
  for (const [f, ds] of ix) for (const d of ds) console.log(`  "${f}" -> "${d}";`);
  console.log('}');
  process.exit(0);
}

const compte = {
  orfes: orfes.length,
  penjats: penjats.length,
  illes: illes.reduce((a, m) => a + m.length, 0),
  etiquetesFalses: etiquetesFalses.size,
};

if (BASELINE) {
  fs.writeFileSync(DEUTE, `${JSON.stringify({ generat: new Date().toISOString(), max: compte }, null, 2)}\n`);
  console.log(`Deute de teixit congelat: ${JSON.stringify(compte)}`);
  console.log('A partir d\'ara només pot baixar.');
  process.exit(0);
}

const previ = fs.existsSync(DEUTE) ? JSON.parse(fs.readFileSync(DEUTE, 'utf8')) : null;
const puja = previ ? Object.keys(compte).filter((k) => compte[k] > (previ.max[k] ?? 0)) : [];

if (JSON_OUT) {
  console.log(JSON.stringify({
    ok: previ !== null && puja.length === 0, compte, orfes, penjats,
    illes, etiquetesFalses: [...etiquetesFalses].map(([k, v]) => ({ etiqueta: k, on: v })),
  }, null, 2));
  process.exit(previ !== null && puja.length === 0 ? 0 : 1);
}

const dens = (arestesReals / NODES.length).toFixed(2);
console.log('\n🧶 TEIXIDOR — cohesió del graf');
console.log('─'.repeat(72));
console.log(`  ${NODES.length} documents · ${arestesReals} arestes reals (${dens}/doc) · ${pseudo} etiquetes (no compten)`);
console.log(`  Àncora: ${nodeAncora}`);

console.log(`\n${compte.orfes === 0 ? '✅' : '·'} T1 · ORFE — ${compte.orfes}${previ ? ` màx ${previ.max.orfes}` : ''}`);
for (const o of orfes.slice(0, 10)) console.log(`      ${o}`);
if (orfes.length > 10) console.log(`      … i ${orfes.length - 10} més`);

console.log(`\n${compte.penjats === 0 ? '✅' : '·'} T2 · PENJAT — ${compte.penjats}${previ ? ` màx ${previ.max.penjats}` : ''}`);
const perDesti = new Map();
for (const p of penjats) perDesti.set(p.desti, (perDesti.get(p.desti) ?? 0) + 1);
for (const [d, n] of [...perDesti].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`      ${String(n).padStart(3)}×  [[${d}]]`);
}

console.log(`\n${illes.length === 0 ? '✅' : '❌'} T3 · ILLA — ${illes.length} component(s) fora de l'àncora, ${compte.illes} document(s)`);
for (const m of illes.slice(0, 6)) {
  console.log(`      ${m.length} doc(s) · arrel comuna «${path.dirname(m[0])}»`);
  for (const x of m.slice(0, 4)) console.log(`        · ${x}`);
  if (m.length > 4) console.log(`        · … i ${m.length - 4} més`);
}

console.log(`\n${compte.etiquetesFalses === 0 ? '✅' : '·'} T4 · ETIQUETA-FALSA — ${compte.etiquetesFalses}${previ ? ` màx ${previ.max.etiquetesFalses}` : ''}`);
for (const [k, v] of [...etiquetesFalses].sort((a, b) => b[1].length - a[1].length).slice(0, 8)) {
  console.log(`      ${String(v.length).padStart(3)}×  [[${k}]]  → o crea la nota, o escriu-ho «#${k.toLowerCase()}»`);
}

console.log(`\n${'─'.repeat(72)}`);
if (!previ) {
  console.error(`PARAT. No hi ha ${path.basename(DEUTE)}. Executa una vegada: --baseline`);
  process.exit(1);
}
if (illes.length > 0 && compte.illes > (previ.max.illes ?? 0)) {
  console.error("PARAT. Hi ha documents que no s'abasten des de l'àncora.");
  process.exit(1);
}
if (puja.length) {
  console.error(`PARAT. El deute de teixit puja: ${puja.join(', ')}.`);
  process.exit(1);
}
console.log('PASSA. El teixit no s\'afluixa.');
process.exit(0);
