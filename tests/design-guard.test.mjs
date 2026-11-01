import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { run, ESTRUCTURA_NATIVA, EMBOLCALLS_SEMANTICS } from '../tooling/gates/design_guard.mjs';

/* D-2 (assalt 10/10, 261101) · La regla div-soup del Design Guard mesura
   l'estructura de la interfície, no el text: els <div> de l'HTML de prosa
   (que sanitizeHtml no deixa ser section ni article) i de les fixtures de les
   proves no compten, i un <form>, un <fieldset>, un <dl> o un embolcall
   canònic de Pedra Seca sí que són estructura. Cap regla dura canvia. */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const onze = (fill = '<span />') => Array.from({ length: 11 }, () => `<div>${fill}</div>`).join('');

async function avisos(fitxers, t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-design-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, text] of Object.entries(fitxers)) {
    fs.mkdirSync(path.dirname(path.join(root, 'src', rel)), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', rel), text);
  }
  const { data } = await run({ root: path.join(root, 'src'), vocab: new Set() });
  return data.findings.filter((f) => f.rule === 'div-soup').map((f) => f.file).sort();
}

/* ── Lectura de l'AST per al registre d'embolcalls ── */
const SALTA = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments']);
const FUNCIO = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod', 'ClassMethod']);
/** Els noms JSX que el component pinta en el seu camí principal: la primera
 *  funció és el component (també dins de forwardRef o memo); no s'hi compten
 *  les funcions niuades (callbacks, .map) ni les branques d'un `? :` o d'un
 *  `&&`/`||`/`??`. Un `if (…) return` sí que hi compta: no és una expressió. */
function nomsJsx(node, acc = [], dinsDelComponent = false) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { for (const fill of node) nomsJsx(fill, acc, dinsDelComponent); return acc; }
  if (FUNCIO.has(node.type)) {
    if (dinsDelComponent) return acc;
    dinsDelComponent = true;
  }
  if (node.type === 'ConditionalExpression') return nomsJsx(node.test, acc, dinsDelComponent);
  if (node.type === 'LogicalExpression') return nomsJsx(node.left, acc, dinsDelComponent);
  if (node.type === 'JSXOpeningElement' && node.name?.type === 'JSXIdentifier') acc.push(node.name.name);
  for (const [clau, valor] of Object.entries(node)) if (!SALTA.has(clau)) nomsJsx(valor, acc, dinsDelComponent);
  return acc;
}
/** Els components de primer nivell d'un fitxer: nom → node (funció, forwardRef, memo…). */
function componentsDe(codi) {
  const mapa = new Map();
  for (const sentencia of parse(codi, { sourceType: 'module', plugins: ['jsx'] }).program.body) {
    const decl = /^Export(Named|Default)Declaration$/.test(sentencia.type) ? sentencia.declaration : sentencia;
    if (decl?.type === 'FunctionDeclaration' && decl.id) mapa.set(decl.id.name, decl);
    if (decl?.type === 'VariableDeclaration') {
      for (const d of decl.declarations) if (d.id.type === 'Identifier' && d.init) mapa.set(d.id.name, d.init);
    }
  }
  return mapa;
}
/** El component `nom` pinta sempre l'element `etiqueta`, ell o un component
 *  local del mateix fitxer que ell pinta (vegeu nomsJsx)? Un germà del fitxer
 *  que la pinte no compta. No vol dir que siga l'arrel del DOM: PageFrame pinta
 *  l'<article> dins d'un <div> contenidor, i per a div-soup n'hi ha prou. */
function pintaSempre(codi, nom, etiqueta) {
  const components = componentsDe(codi);
  const vistos = new Set();
  const cua = [nom];
  while (cua.length) {
    const actual = cua.shift();
    if (vistos.has(actual) || !components.has(actual)) continue;
    vistos.add(actual);
    for (const fill of nomsJsx(components.get(actual))) {
      if (fill === etiqueta) return true;
      if (components.has(fill)) cua.push(fill);
    }
  }
  return false;
}

test('div-soup continua avisant: onze <div> JSX sense cap estructura', async (t) => {
  assert.deepEqual(await avisos({ 'seccio/Sopa.jsx': `export const Sopa = () => <>${onze()}</>;` }, t), ['seccio/Sopa.jsx']);
});

test('el llindar no s’abaixa: deu <div> JSX (oberts i tancats) encara no avisen', async (t) => {
  /* Fixa el > 10 i que es compten les obertures, no les etiquetes de tancament. */
  const deu = Array.from({ length: 10 }, () => '<div></div>').join('');
  assert.deepEqual(await avisos({ 'seccio/Deu.jsx': `export const C = () => <>${deu}</>;` }, t), []);
});

test('un <x.div> (motion.div…) també és un <div>', async (t) => {
  const onzeMotion = Array.from({ length: 11 }, () => '<motion.div />').join('');
  assert.deepEqual(await avisos({ 'seccio/Moviment.jsx': `export const C = () => <>${onzeMotion}</>;` }, t), ['seccio/Moviment.jsx']);
});

test('una <section> dins d’un comentari o d’una cadena no és estructura', async (t) => {
  const text = `// <section> només en un comentari\nconst nota = '<section>';\nexport const Sopa = () => <>${onze()}</>;`;
  assert.deepEqual(await avisos({ 'seccio/Fals.jsx': text }, t), ['seccio/Fals.jsx']);
});

test('els <div> dins de cadenes (HTML de prosa sanejat) no compten', async (t) => {
  const prosa = `export const PAGINA = { cos: ${JSON.stringify(onze('<h4>x</h4><p>y</p>').repeat(5))} };`;
  assert.deepEqual(await avisos({ 'text/pageContent.js': prosa }, t), []);
});

test('les proves no són interfície: les fixtures de sanitize no avisen', async (t) => {
  const fixture = `const html = ${JSON.stringify(onze())};\nexport const Sopa = () => <>${onze()}</>;`;
  assert.deepEqual(await avisos({
    'utils/sanitize.test.js': fixture,
    'components/x/X.test.jsx': fixture,
    'components/x/__tests__/Y.jsx': fixture,
    /* Un nom que només conté «test» sí que és interfície. */
    'components/x/Testimonis.jsx': fixture
  }, t), ['components/x/Testimonis.jsx']);
});

test('les etiquetes semàntiques natives són estructura', async (t) => {
  const fitxers = Object.fromEntries(ESTRUCTURA_NATIVA.map((etiqueta) => [
    `natius/${etiqueta}.jsx`, `export const C = () => <${etiqueta}>${onze()}</${etiqueta}>;`
  ]));
  assert.deepEqual(await avisos(fitxers, t), []);
});

test('els embolcalls canònics documentats són estructura', async (t) => {
  const fitxers = Object.fromEntries(Object.keys(EMBOLCALLS_SEMANTICS).map((nom) => [
    `canon/${nom}.jsx`, `export const C = () => <${nom}>${onze()}</${nom}>;`
  ]));
  assert.deepEqual(await avisos(fitxers, t), []);
  /* Un component qualsevol no ho és, ni un <Section> que no siga l'etiqueta,
     ni un nom que només s'assembla als del registre. */
  assert.deepEqual(await avisos({
    'canon/Altre.jsx': `export const C = () => <Caixa>${onze()}</Caixa>;`,
    'canon/Majuscula.jsx': `export const C = () => <Section>${onze()}</Section>;`,
    'canon/Pagina.jsx': `export const C = () => <HomePage>${onze()}</HomePage>;`
  }, t), ['canon/Altre.jsx', 'canon/Majuscula.jsx', 'canon/Pagina.jsx']);
});

test('la lectura del registre mossega: ni un germà, ni un callback, ni una branca condicional salven el component', () => {
  const codi = [
    'function Interior() { return <article />; }',
    'export function Directe() { return <dialog />; }',
    'export function PerLocal() { return <div><Interior /></div>; }',
    'export function Germa() { return <fieldset />; }',
    'export function Buit() { return <div />; }',
    'export const Embolcallat = forwardRef(function Embolcallat() { return <section />; });',
    'export function PerVariable({ a }) { const cos = <Interior />; return a ? <div>{cos}</div> : cos; }',
    'export function AmbRetornPrevi({ a }) { if (!a) return null; return <dialog />; }',
    'export function EnCallback({ xs }) { return <div>{xs.map((x) => <article key={x} />)}</div>; }',
    'export function EnTernari({ a }) { return a ? <article /> : <div />; }',
    'export function EnI({ a }) { return <div>{a && <dialog />}</div>; }'
  ].join('\n');
  assert.equal(pintaSempre(codi, 'Directe', 'dialog'), true);
  assert.equal(pintaSempre(codi, 'PerLocal', 'article'), true);
  assert.equal(pintaSempre(codi, 'Embolcallat', 'section'), true);
  /* El patró de Dialeg: el contingut en una variable i el portal en un ternari. */
  assert.equal(pintaSempre(codi, 'PerVariable', 'article'), true);
  assert.equal(pintaSempre(codi, 'AmbRetornPrevi', 'dialog'), true);
  assert.equal(pintaSempre(codi, 'Buit', 'fieldset'), false);
  assert.equal(pintaSempre(codi, 'Absent', 'div'), false);
  assert.equal(pintaSempre(codi, 'EnCallback', 'article'), false);
  assert.equal(pintaSempre(codi, 'EnTernari', 'article'), false);
  assert.equal(pintaSempre(codi, 'EnI', 'dialog'), false);
});

test('el registre d’embolcalls no menteix: cada component pinta sempre la seua marca', () => {
  for (const [nom, { fitxer, marca }] of Object.entries(EMBOLCALLS_SEMANTICS)) {
    const codi = fs.readFileSync(path.join(ROOT, 'src', fitxer), 'utf8');
    const etiqueta = marca.replace(/^</, '').trim();
    assert.ok(pintaSempre(codi, nom, etiqueta), `${nom} (${fitxer}) ja no pinta sempre <${etiqueta}> (fora de callbacks i de branques condicionals)`);
  }
});

test('fora de JS (.html), el recompte de text sense comentaris', async (t) => {
  assert.deepEqual(await avisos({
    'a.html': onze(),
    'b.html': `<!-- <main> --> ${onze()}`,
    'c.html': `<main>${onze()}</main>`,
    /* Un comentari sense tancar s'emporta la resta (com al navegador). */
    'd.html': `${onze()}<!-- <main>`,
    'e.html': `<!-- ${onze()} --><p>prosa</p>`
  }, t), ['a.html', 'b.html', 'd.html']);
});
