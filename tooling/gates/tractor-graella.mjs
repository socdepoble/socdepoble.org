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
import { parse } from '@babel/parser';
import { fontUTF8, cssAnalitzable, declaracionsTokensCSS } from '../lib/lexic-css.mjs';
import { existsSync, readdirSync, lstatSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

function principal() {
const args = process.argv.slice(2);
if (args.length > 1 || args.some(a => !a.startsWith('--arrel=') || !a.slice('--arrel='.length).trim())) throw new Error('Ús: [--arrel=DIR]');
const arrel = resolve(args.length ? args[0].slice('--arrel='.length) : '.');
const P = (...t) => join(arrel, ...t);

const FITXA = P(CAMINS.escriptori, '01_produccio', 'contracte_graella.md');
const SHELL = P('src', 'components', 'layout', 'AppGridShell.jsx');
const COLUMNA = P('src', 'components', 'layout', 'AppGridColumn.jsx');
const CSS = P('src', 'components', 'layout', 'AppGridShell.css');

const faltes = [];
const nota = (regla, msg) => faltes.push({ regla, msg });
const llig = (f, opcional = false) => {
  let cursor = arrel;
  for (const segment of relative(arrel, f).split('/')) {
    cursor = join(cursor, segment);
    let s;
    try { s = lstatSync(cursor); }
    catch (error) { if (opcional && error.code === 'ENOENT') return null; throw new Error(`Font absent o il·legible: ${f} (${error.code})`); }
    if (s.isSymbolicLink()) throw new Error(`Symlink en font: ${f}`);
  }
  if (!lstatSync(f).isFile()) throw new Error(`Font no regular: ${f}`);
  const text = fontUTF8(f, 'utf8');
  if (!text.trim()) throw new Error(`Font buida: ${f}`);
  return text;
};

/* ── 1. La fitxa ha d'existir ────────────────────────────────────── */
const fitxa = llig(FITXA);
if (!fitxa) {
  nota('fitxa-absent', `No hi ha fitxa de contracte a ${FITXA}. El framework no es documenta a si mateix.`);
}

/* ── 2. Props documentades == props reals ────────────────────────── */
const asts = new Map();
function astFont(fitxer) {
  if (!asts.has(fitxer)) asts.set(fitxer, parse(llig(fitxer), { sourceType: 'module', plugins: ['jsx'] }));
  return asts.get(fitxer);
}
function camina(node, visita) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visita(node);
  for (const [key, value] of Object.entries(node)) {
    if (['comments', 'leadingComments', 'trailingComments', 'innerComments', 'loc', 'extra'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(n => camina(n, visita));
    else if (value && typeof value === 'object') camina(value, visita);
  }
}
function propsReals(fitxer) {
  const defaults = astFont(fitxer).program.body.filter(n => n.type === 'ExportDefaultDeclaration');
  const fn = defaults[0]?.declaration;
  if (defaults.length !== 1 || fn?.type !== 'FunctionDeclaration' || fn.params.length !== 1 || fn.params[0].type !== 'ObjectPattern') throw new Error(`Signatura no certificable: ${fitxer}`);
  return fn.params[0].properties.map(p => {
    if (p.type !== 'ObjectProperty' || p.computed || !['Identifier', 'StringLiteral'].includes(p.key.type)) throw new Error(`Prop opaca: ${fitxer}`);
    return p.key.name ?? p.key.value;
  });
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
astFont(SHELL);
const tallsReals = [];
camina(astFont(SHELL), n => { if (n.type === 'BinaryExpression' && n.operator === '<' && n.left.type === 'Identifier' && n.left.name === 'w' && n.right.type === 'NumericLiteral') tallsReals.push(n.right.value); });
const tallsDocs = fitxa
  ? [...(fitxa.match(/\b(\d{3,4})\s*px\b/g) || [])].map((s) => Number(s.replace(/\D/g, '')))
  : [];
for (const t of tallsReals) {
  if (!tallsDocs.includes(t)) nota('tall-no-documentat', `El punt de tall ${t}px viu a AppGridShell.jsx i no a la fitxa.`);
}

/* ── 4. Cap capçalera de columna feta a mà fora d'AppGridColumn ──── */
const VELLES = ['notes-column-header', 'perfil-columna-capcalera', 'notes-column-title', 'perfil-columna-titol'];
function* jsx(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = lstatSync(p);
    if (s.isSymbolicLink()) throw new Error(`Symlink en font: ${p}`);
    if (s.isDirectory()) yield* jsx(p);
    else if (/\.jsx?$/.test(e)) yield p;
  }
}
if (existsSync(P('src'))) {
  for (const f of jsx(P('src'))) {
    /* Els comentaris no pinten res: si no els llevem, esta porta es
       denuncia a si mateixa per anomenar les classes que prohibix. */
    const txt = llig(f)
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
let teInert = false;
camina(astFont(SHELL), n => { if (n.type === 'JSXAttribute' && n.name.name === 'inert' && !(n.value?.expression?.type === 'BooleanLiteral' && n.value.expression.value === false)) teInert = true; });
if (!teInert) {
  nota('columna-focusable', 'AppGridShell no marca `inert` les columnes tancades: el focus hi pot caure fora de pantalla.');
}

/* ── 6. Tots els tokens del CSS han d'existir de veres ───────────── */
const css = llig(CSS) || '';
const tokensCanon = new Set();
for (const f of ['src/css/tokens.css', 'src/css/design-tokens.css', 'src/css/index.css']) {
  const t = llig(P(f), f !== 'src/css/tokens.css');
  if (t) for (const d of declaracionsTokensCSS(t)) if (d.nom.startsWith('--sdp-')) tokensCanon.add(d.nom.slice(2));
}
if (!tokensCanon.size) throw new Error('Cap token declarat a les fonts canòniques: no es pot certificar AppGridShell.css');
{
  for (const m of cssAnalitzable(css).matchAll(/var\(\s*--(sdp-[\w-]+)/g)) {
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
}

try { principal(); }
catch (error) { console.error(`❌ [TRACTOR-GRAELLA] ${error.message}`); process.exit(2); }
