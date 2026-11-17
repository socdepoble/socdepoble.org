#!/usr/bin/env node
/**
 * tractor-tokens.mjs — PORTA DE VOCABULARI DEL SISTEMA DE DISSENY
 *
 * LLEI DURA. Zero deute. Sense sostre. Sense `--baseline`.
 *
 * PER QUÈ EXISTIX (auditoria Seient Núm. 5, 260831):
 *   `tractor-pedra-seca.mjs` compta els tokens fantasma amb sostre
 *   (`LLEI_02_TOKEN_FANTASMA  32  màx 32`). Un sostre igual a la realitat
 *   actual no és una llei: és una fotografia. La premissa de Pedra Seca
 *   («tot està centralitzat») no es pot fer VERITAT amb una porta
 *   calibrada per acceptar la mentida.
 *
 *   Esta porta no té sostre. O el vocabulari és tancat o no passa.
 *
 * LLEIS
 *   T1 · Cap `var(--sdp-*)` sense definició. Sense fallback la declaració
 *        s'anul·la sencera: el component no es degrada, desapareix.
 *   T2 · Cap `var(--sdp-*, fallback)` tampoc. El fallback és una còpia
 *        privada del sistema de disseny dins d'un component.
 *   T3 · Un sol lloc de definició. Els tokens `--sdp-*` només es declaren
 *        als blocs de tema de src/css/tokens.css.
 *   T4 · Dos capes. Cap component pot citar una primitiva
 *        (`--sdp-pedra-*`, `--sdp-primary-*`, `--sdp-secondary-*`,
 *        `--sdp-error|avis|exit-<num>`) directament: només semàntics.
 *
 * Ús:
 *   node tooling/gates/tractor-tokens.mjs
 *   node tooling/gates/tractor-tokens.mjs --root ../
 *   node tooling/gates/tractor-tokens.mjs --nomes T1   # una llei
 *
 * Eixides: 0 net · 1 infracció · 2 error d'execució.
 */

import { parse } from '@babel/parser';
import { fontUTF8, cssAnalitzable, declaracionsTokensCSS } from '../lib/lexic-css.mjs';
// Parse JS/TS before scanning: template-expression comments and malformed input cannot disappear.
function senseComentaris(text, ruta) {
  if (ruta.endsWith('.css')) return cssAnalitzable(text);
  const ast = parse(text, { sourceType: 'unambiguous', plugins: ['jsx', ...( /\.tsx?$/.test(ruta) ? ['typescript'] : [])] });
  let cursor = 0, out = '';
  for (const c of ast.comments ?? []) { out += text.slice(cursor, c.start) + text.slice(c.start, c.end).replace(/[^\n]/g, ' '); cursor = c.end; }
  return out + text.slice(cursor);
}
import { analitzaJsx } from '../lib/jsx-class-values.mjs';
import { existsSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';

function principal() {
const args = process.argv.slice(2);
const opcions = new Map();
for (let i = 0; i < args.length; i++) {
  const flag = args[i];
  if (!['--root', '--nomes'].includes(flag) || opcions.has(flag)) throw new Error(`Ús invàlid: ${flag}`);
  const valor = args[++i];
  if (!valor?.trim() || valor.startsWith('--')) throw new Error(`Falta valor de ${flag}`);
  opcions.set(flag, valor);
}
if (opcions.has('--nomes') && !/^T[1-6]$/.test(opcions.get('--nomes'))) throw new Error('--nomes ha de ser T1, T2, T3, T4, T5 o T6');

const ROOT = (() => {
  return path.resolve(opcions.get('--root') ?? process.cwd());
})();

const NOMES = (() => {
  return opcions.get('--nomes') ?? null;
})();

const R = (rel) => path.join(ROOT, rel);
const FONT_TOKENS = 'src/css/tokens.css';
/* CAPA 0 · generada des de design-tokens.json. Declara constants de marca
   i mínims físics; res més. És un lloc de declaració LEGÍTIM per a T3,
   i les seues constants són intocables per als components (T5). */
const FONT_CANON = 'src/css/design-tokens.css';
const SALTA = new Set(['node_modules', 'dist', 'build', 'coverage']);
const EXT = /\.(css|js|jsx|ts|tsx)$/;

/* Primitives: escales numèriques. Un component mai les cita. */
const PRIMITIVA =
  /^--sdp-(pedra|primary|secondary|error|avis|exit)-\d+$|^--sdp-(blanc|negre)(-pur)?$/;

/* Fitxers on SÍ que és legítim citar primitives: la pròpia capa de tema
   i la pantalla que documenta el sistema (mostrari de colors). */
const EXEMPTS_T4 = new Set([
  'src/css/tokens.css',
  'src/sections/disseny/DesignSection.jsx'
]);

const infraccions = [];
const OK = [];
const falla = (llei, fitxer, linia, missatge) =>
  infraccions.push({ llei, fitxer, linia, missatge });
const passa = (llei) => OK.push(llei);
const actiu = (llei) => !NOMES || NOMES === llei.split(' ')[0];

function arbre(rel, eixida = []) {
  const base = R(rel);
  const estat = lstatSync(base);
  if (estat.isSymbolicLink() || !estat.isDirectory()) throw new Error(`Font no certificable (directori o symlink): ${rel}`);
  for (const nom of readdirSync(base)) {
    if (SALTA.has(nom) || nom.startsWith('.')) continue;
    const abs = path.join(base, nom);
    const sub = path.join(rel, nom);
    const s = lstatSync(abs);
    if (s.isSymbolicLink()) throw new Error(`Symlink en fonts: ${sub}`);
    if (s.isDirectory()) arbre(sub, eixida);
    else if (EXT.test(nom)) {
      if (!s.isFile()) throw new Error(`Font no regular: ${sub}`);
      eixida.push(sub);
    }
  }
  return eixida;
}

/* ══════════════════════════════════════════════════════════════════
   Extracció dels tokens declarats + límits dels blocs de tema
   ══════════════════════════════════════════════════════════════════ */
// Valida tota la superfície abans de llegir el primer CSS (inclou els ancestres).
const FITXERS = arbre('src');
if (!existsSync(R(FONT_TOKENS))) {
  console.error(`PARAT. No existix ${FONT_TOKENS}. Arrel equivocada?`);
  process.exit(2);
}

const cssFont = fontUTF8(R(FONT_TOKENS), 'utf8');
if (lstatSync(R(FONT_TOKENS)).isSymbolicLink() || !cssFont.trim()) throw new Error(`Font de tokens buida o symlink: ${FONT_TOKENS}`);
const liniesFont = cssAnalitzable(cssFont).split('\n');

/* Els tokens de la capa 0 existixen de veres: T1 no els pot cridar fantasmes. */
const CANON = new Set();
if (existsSync(R(FONT_CANON))) {
  for (const d of declaracionsTokensCSS(fontUTF8(R(FONT_CANON), 'utf8'))) {
    if (d.nom.startsWith('--sdp-')) CANON.add(d.nom);
  }
}

/* Blocs on és legítim DECLARAR un token: qualsevol selector que continga
   :root, :host o .sdp-root, i els @media de tema/contrast. */
const OBRE_TEMA = /(:root|:host|\.sdp-root|@media\s*\((?:prefers-color-scheme|prefers-contrast|forced-colors))/;

const liniesTema = new Set();
{
  let dins = false;
  let prof = 0;
  liniesFont.forEach((l, i) => {
    if (!dins && OBRE_TEMA.test(l) && l.includes('{')) {
      dins = true;
      prof = 0;
    }
    if (dins) {
      liniesTema.add(i + 1);
      prof += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
      if (prof <= 0) dins = false;
    }
  });
}

const DEFINITS = new Set(CANON);
for (const { match: m, linia } of coincidenciesAmbLinia(senseComentaris(cssFont, FONT_TOKENS), /(--[\w-]+)\s*:/g)) {
  if (liniesTema.has(linia)) DEFINITS.add(m[1]);
}

/* Els tokens d'escala z viuen al mateix bloc però amb prefix `--z-`. */
for (const d of declaracionsTokensCSS(cssFont)) if (d.nom.startsWith('--z-')) DEFINITS.add(d.nom);
if (!DEFINITS.size) throw new Error(`Cap token declarat a ${FONT_TOKENS}: no es pot certificar el vocabulari`);

/* El CSS pot separar var(), el nom i el delimitador amb salts de línia.
   Escaneja la font completa sense perdre les línies originals del diagnòstic. */
function* coincidenciesAmbLinia(codi, patro) {
  let cursor = 0;
  let linia = 1;
  for (const match of codi.matchAll(patro)) {
    while (cursor < match.index) if (codi[cursor++] === '\n') linia++;
    yield { match, linia };
  }
}

/* ══════════════════════════════════════════════════════════════════
   T1 · CAP var(--sdp-*) SENSE DEFINICIÓ
   ══════════════════════════════════════════════════════════════════ */
if (actiu('T1 · Token inexistent')) {
  const LLEI = 'T1 · Token inexistent';
  let net = true;
  for (const rel of FITXERS) {
    const codi = senseComentaris(fontUTF8(R(rel), 'utf8'), rel);
    for (const { match: m, linia } of coincidenciesAmbLinia(codi, /var\(\s*(--(?:sdp|z)-[\w-]+)\s*[,)]/g)) {
      const t = m[1];
      if (DEFINITS.has(t)) continue;
      net = false;
      falla(LLEI, rel, linia,
        `\`${t}\` no es declara enlloc. Sense fallback el navegador anul·la la declaració sencera: el component no es degrada, desapareix.`);
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   T2 · CAP FALLBACK DINS DE var()
   ══════════════════════════════════════════════════════════════════ */
if (actiu('T2 · Fallback prohibit')) {
  const LLEI = 'T2 · Fallback prohibit';
  let net = true;
  for (const rel of FITXERS) {
    const codi = senseComentaris(fontUTF8(R(rel), 'utf8'), rel);
    // La coma ja declara el fallback, també si és buit o conté var() niats.
    // No recorre tot el valor cercant un parèntesi final per a cada coincidència.
    for (const { match: m, linia } of coincidenciesAmbLinia(codi, /var\(\s*(--sdp-[\w-]+)\s*,/g)) {
      net = false;
      falla(LLEI, rel, linia,
        `\`var(${m[1]}, …)\`: el fallback és una còpia privada del sistema de disseny. Si el token existix, sobra; si no existix, l'has d'afegir al tema.`);
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   T3 · UN SOL LLOC DE DEFINICIÓ
   ══════════════════════════════════════════════════════════════════ */
/* Ronda 1 del 31-10-2026 (ordre del Mestre: tancar la Porta Tokens) · El
   text que la interfície pinta no declara res: un JSXText, o una cadena dins
   d'un fill o d'un atribut JSX (fora de style i de <style>), que diu «amb
   --sdp-x: …» és prosa d'un espècimen, no un segon sistema de disseny. És el
   criteri de propietatsFixades (jsx-class-values.mjs, Decisió del Mestre del
   30-10-2026): «una cadena '--x' en un text no declara res». Una plantilla
   (CSS de veres), una cadena fora de JSX o dins d'una funció continuen
   comptant. Si la font no s'analitza, no es descompta res: mai s'audita a
   mitges cap a la banda verda. */
const JS_FAMILIA = /\.(js|jsx)$/;
/* Atributs que porten codi o un document sencer (CSS, HTML), no text pintat:
   s'hi declara de veres, i T3 hi continua comptant (revisió adversarial 261031). */
const ATRIBUTS_DE_CODI = new Set(['style', 'srcDoc', 'dangerouslySetInnerHTML']);
const TALLA_PINTAT = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration',
  'CallExpression', 'NewExpression', 'AssignmentExpression', 'TaggedTemplateExpression']);
function rangsDeTextPintat(text) {
  let ast;
  try { ast = analitzaJsx(text); } catch { return []; }
  const rangs = [];
  const visita = (node, pintat) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) visita(n, pintat); return; }
    if (node.type === 'JSXElement') {
      if (node.openingElement?.name?.name === 'style') return;
      visita(node.openingElement, false);
      visita(node.children, true);
      return;
    }
    if (node.type === 'JSXFragment') { visita(node.children, true); return; }
    if (node.type === 'JSXAttribute') {
      if (!ATRIBUTS_DE_CODI.has(node.name?.name)) visita(node.value, true);
      return;
    }
    if (pintat && (node.type === 'JSXText' || node.type === 'StringLiteral')) {
      rangs.push([node.start, node.end]);
      return;
    }
    const segueix = pintat && !TALLA_PINTAT.has(node.type);
    for (const [clau, fill] of Object.entries(node)) {
      if (['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments'].includes(clau)) continue;
      if (fill && typeof fill === 'object') visita(fill, segueix);
    }
  };
  visita(ast.program, false);
  return rangs;
}

if (actiu('T3 · Font única')) {
  const LLEI = 'T3 · Font única';
  let net = true;
  for (const rel of FITXERS) {
    const norm3 = rel.replace(/\\/g, '/');
    if (norm3 === FONT_CANON) continue;   // capa 0 · generada, declaració legítima
    const esFont = norm3 === FONT_TOKENS;
    const brut = fontUTF8(R(rel), 'utf8');
    let pintat = null;   // els rangs del text pintat, només si cal
    const codi = senseComentaris(brut, rel);
    for (const { match: m, linia } of coincidenciesAmbLinia(codi, /(--sdp-[\w-]+)\s*:/g)) {
        if (esFont && liniesTema.has(linia)) continue;
        if (JS_FAMILIA.test(norm3)) {
          pintat ??= rangsDeTextPintat(brut);
          const on = m.index;
          if (pintat.some(([a, b]) => on >= a && on < b)) continue;
        }
        net = false;
        falla(LLEI, rel, linia,
          `\`${m[1]}\` es declara fora dels blocs de tema de ${FONT_TOKENS}. Dues definicions són dos sistemes de disseny.`);
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   T4 · DOS CAPES (primitiva → semàntic → component)
   ══════════════════════════════════════════════════════════════════ */
if (actiu('T4 · Dos capes')) {
  const LLEI = 'T4 · Dos capes';
  let net = true;
  for (const rel of FITXERS) {
    const norm = rel.replace(/\\/g, '/');
    if (EXEMPTS_T4.has(norm)) continue;
    const codi = senseComentaris(fontUTF8(R(rel), 'utf8'), rel);
    for (const { match: m, linia } of coincidenciesAmbLinia(codi, /var\(\s*(--sdp-[\w-]+)\s*[,)]/g)) {
        if (!PRIMITIVA.test(m[1])) continue;
        net = false;
        falla(LLEI, rel, linia,
          `\`${m[1]}\` és una primitiva. Un component cita semàntics (--sdp-text-*, --sdp-fons-*, --sdp-accio-*…), mai l'escala crua: la primitiva no canvia amb el tema fosc.`);
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   T5 · LA CAPA 0 NO ES CITA
   El cànon el consumix la rampa d'index.css, no els components. Un botó
   que cita --sdp-canon-taronja es queda taronja al tema fosc.
   ══════════════════════════════════════════════════════════════════ */
if (actiu('T5 · Capa 0 intocable')) {
  const LLEI = 'T5 · Capa 0 intocable';
  let net = true;
  for (const rel of FITXERS) {
    const norm = rel.replace(/\\/g, '/');
    if (norm === FONT_TOKENS || norm === FONT_CANON) continue;
    const codi = senseComentaris(fontUTF8(R(rel), 'utf8'), rel);
    for (const { match: m, linia } of coincidenciesAmbLinia(codi, /var\(\s*(--sdp-canon-[\w-]+)\s*[,)]/g)) {
        net = false;
        falla(LLEI, rel, linia,
          `\`${m[1]}\` és capa 0: una constant de marca, no un color d'interfície. ` +
          `Només la rampa d'${FONT_TOKENS} la pot ancorar. Un component que la cita ` +
          `no es mou amb el tema fosc ni amb l'alt contrast.`);
    }
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   T6 · ZERO TAILWIND TÒXIC (bg-[#hex], text-[#hex])
   Els colors fixos trencarien l'accessibilitat i el mode fosc.
   ══════════════════════════════════════════════════════════════════ */
if (actiu('T6 · Zero Tailwind Tòxic')) {
  const LLEI = 'T6 · Zero Tailwind Tòxic';
  let net = true;
  for (const rel of FITXERS) {
    if (!rel.endsWith('.jsx') && !rel.endsWith('.tsx')) continue;
    senseComentaris(fontUTF8(R(rel), 'utf8'), rel).split('\n').forEach((l, i) => {
      const match = l.match(/(?:bg|text|border)-\[#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]/);
      if (match) {
        net = false;
        falla(LLEI, rel, i + 1,
          `Has hardcodejat el color \`#${match[1]}\` amb classes tòxiques de Tailwind. S'han d'utilitzar variables CSS semàntiques de la Capa 2 (Pedra Seca).`);
      }
    });
  }
  if (net) passa(LLEI);
}

/* ══════════════════════════════════════════════════════════════════
   INFORME
   ══════════════════════════════════════════════════════════════════ */
const banda = '─'.repeat(72);
console.log(`\n🪨 TRACTOR DE TOKENS — vocabulari tancat, zero deute\n   ${DEFINITS.size} tokens declarats · ${FITXERS.length} fonts revisades\n${banda}`);

for (const l of OK) console.log(`  ✅ ${l}`);

if (infraccions.length) {
  const perLlei = new Map();
  for (const i of infraccions) {
    if (!perLlei.has(i.llei)) perLlei.set(i.llei, []);
    perLlei.get(i.llei).push(i);
  }
  console.log(`\n❌ INFRACCIONS (${infraccions.length})\n${banda}`);
  for (const [llei, llista] of perLlei) {
    console.log(`\n  ${llei}  (${llista.length})`);
    const vistes = new Set();
    for (const i of llista) {
      const clau = `${i.fitxer}|${i.missatge.slice(0, 40)}`;
      if (vistes.has(clau)) continue;
      vistes.add(clau);
      if (vistes.size > 12) break;
      console.log(`    ${i.fitxer}:${i.linia}`);
      console.log(`      ↳ ${i.missatge}`);
    }
    if (llista.length > vistes.size) {
      console.log(`    … i ${llista.length - vistes.size} ocurrències més.`);
    }
  }
  console.log(`\n${banda}`);
  console.log('El vocabulari no és tancat. Esta llei no admet sostre de deute.\n');
  process.exit(1);
}

console.log(`\n${banda}\nVocabulari tancat. Cap component s'inventa res.\n`);
process.exit(0);
}

try { principal(); }
catch (error) { console.error(`❌ [TRACTOR-TOKENS] ${error.message}`); process.exit(2); }
