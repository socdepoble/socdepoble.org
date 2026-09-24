#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tractor-graella.mjs — La porta del Framework de Graella

   Per què existix: ja hi ha DUES fonts de veritat de disseny
   (disseny_pedra_seca.html, 3146 línies; DesignSection.jsx, 1263).
   Cap gate comprova que el que prometen existisca al codi. design_guard
   només toca disseny_pedra_seca.html per a EXCEPTUAR-lo de la regla d'H1.
   Això és "Saber ≠ Fer" en estat pur: la petorreta d'esta sessió afirmava
   que les columnes s'amaguen amb `data-visible`, i `data-visible` no
   existix enlloc del repositori.

   Esta porta no documenta res. Comprova que la fitxa de contracte i el
   codi diuen el mateix, i falla quan divergixen.

   Ús:  node tooling/gates/tractor-graella.mjs [--arrel=.]
   ═══════════════════════════════════════════════════════════════════ */

import { CAMINS } from '../lib/arrel.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const arrel = (process.argv.find((a) => a.startsWith('--arrel=')) || '--arrel=.').split('=')[1];
const P = (...t) => join(arrel, ...t);

const FITXA = P(CAMINS.escriptori, '01_produccio', 'contracte_graella.md');
const SHELL = P('src', 'components', 'layout', 'AppGridShell.jsx');
const COLUMNA = P('src', 'components', 'layout', 'AppGridColumn.jsx');
const CSS = P('src', 'components', 'layout', 'AppGridShell.css');

const faltes = [];
const nota = (regla, msg) => faltes.push({ regla, msg });
const llig = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null);

/* ── 1. La fitxa ha d'existir ────────────────────────────────────── */
const fitxa = llig(FITXA);
if (!fitxa) {
  nota('fitxa-absent', `No hi ha fitxa de contracte a ${FITXA}. El framework no es documenta a si mateix.`);
}

/* ── 2. Props documentades == props reals ────────────────────────── */
function propsReals(fitxer) {
  const src = llig(fitxer);
  if (!src) return null;
  const m = src.match(/export default function \w+\(\s*\{([\s\S]*?)\}\s*\)/);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map((l) => l.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/, '').trim())
    .join(' ')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.split(/[:=]/)[0].trim().replace(/^'|'$/g, ''))
    .filter((t) => /^[\w'\-[\]]+$/.test(t));
}

function propsDocumentades(text, component) {
  if (!text) return [];
  const bloc = text.split(new RegExp(`^##+\\s*${component}\\b`, 'm'))[1];
  if (!bloc) return null;
  const taula = bloc.split(/^##\s/m)[0];
  return [...taula.matchAll(/^\|\s*`([^`]+)`/gm)].map((m) => m[1]);
}

for (const [nom, fitxer] of [['AppGridShell', SHELL], ['AppGridColumn', COLUMNA]]) {
  const reals = propsReals(fitxer);
  if (!reals) { nota('signatura-illegible', `No he pogut llegir la signatura de ${nom}.`); continue; }
  const docs = propsDocumentades(fitxa, nom);
  if (docs === null) { nota('component-no-documentat', `${nom} no té secció a la fitxa de contracte.`); continue; }
  for (const p of reals) if (!docs.includes(p)) nota('prop-no-documentada', `${nom}: la prop \`${p}\` existix al codi i no a la fitxa.`);
  for (const p of docs) if (!reals.includes(p)) nota('prop-fantasma', `${nom}: la fitxa documenta \`${p}\` i el codi no la té.`);
}

/* ── 3. Els punts de tall documentats == els del codi ────────────── */
const shell = llig(SHELL) || '';
const tallsReals = [...shell.matchAll(/w\s*<\s*(\d+)/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
const tallsDocs = fitxa
  ? [...(fitxa.match(/\b(\d{3,4})\s*px\b/g) || [])].map((s) => Number(s.replace(/\D/g, '')))
  : [];
for (const t of tallsReals) {
  if (!tallsDocs.includes(t)) nota('tall-no-documentat', `El punt de tall ${t}px viu a AppGridShell.jsx i no a la fitxa.`);
}

/* ── 4. Cap capçalera de columna feta a mà fora d'AppGridColumn ──── */
const VELLES = ['notes-column-header', 'perfil-columna-capcalera', 'notes-column-title', 'perfil-columna-titol'];
import { readdirSync, statSync } from 'node:fs';
function* jsx(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* jsx(p);
    else if (/\.jsx?$/.test(e)) yield p;
  }
}
if (existsSync(P('src'))) {
  for (const f of jsx(P('src'))) {
    /* Els comentaris no pinten res: si no els llevem, esta porta es
       denuncia a si mateixa per anomenar les classes que prohibix. */
    const txt = readFileSync(f, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const cls of VELLES) {
      if (txt.includes(cls)) {
        const ln = txt.slice(0, txt.indexOf(cls)).split('\n').length;
        nota('capcalera-a-ma', `${f}:${ln} encara usa \`${cls}\`. La capçalera de columna és AppGridColumn.`);
      }
    }
  }
}

/* ── 5. Cap columna sense `inert` quan està tancada ──────────────── */
if (!shell.includes('inert')) {
  nota('columna-focusable', 'AppGridShell no marca `inert` les columnes tancades: el focus hi pot caure fora de pantalla.');
}

/* ── 6. Tots els tokens del CSS han d'existir de veres ───────────── */
const css = llig(CSS) || '';
const tokensCanon = new Set();
for (const f of ['src/css/tokens.css', 'src/css/design-tokens.css', 'src/css/index.css']) {
  const t = llig(P(f));
  if (t) for (const m of t.matchAll(/--(sdp-[\w-]+)\s*:/g)) tokensCanon.add(m[1]);
}
if (tokensCanon.size) {
  for (const m of css.matchAll(/var\(\s*--(sdp-[\w-]+)/g)) {
    if (!tokensCanon.has(m[1])) nota('token-inventat', `AppGridShell.css usa \`--${m[1]}\`, que no està definit enlloc.`);
  }
}

/* ── Veredicte ───────────────────────────────────────────────────── */
if (faltes.length === 0) {
  console.log('✅ porta:graella — el contracte i el codi diuen el mateix.');
  process.exit(0);
}
console.error(`❌ porta:graella — ${faltes.length} divergència(es):\n`);
for (const f of faltes) console.error(`  [${f.regla}] ${f.msg}`);
console.error('\nO s\'arregla el codi, o s\'arregla la fitxa. Les dos coses no poden ser certes.');
process.exit(1);
