#!/usr/bin/env node
/**
 * tractor-fitxa-gestor.mjs — PORTA DE LA FITXA DE GESTOR
 *
 * LLEI DURA. Zero deute. Sense sostre. Sense `--baseline`.
 *
 * PER QUÈ EXISTIX (dictamen Seient Núm. 5, 260911)
 *   La llista de l'UniversalManager es va desestructurar fins a parèixer un
 *   article: entradilles de dues línies, tres línies de text, 20 estils en
 *   línia, 8 tokens fantasma i un <button> dins d'un <li role="button">. La
 *   causa no era cap component: era `renderItem`, una porta del darrere per on
 *   cada consumidor pintava el que volia. Esta porta tanca la FORMA: el gestor
 *   només pinta ManagerItemCard, i la fitxa només té títol (≤ 2 línies) i
 *   subtítol (≤ 1 línia) al costat d'una media quadrada.
 *
 * SUPERFÍCIE
 *   · src/components/universal/manager/**             el mòdul del gestor
 *   · tot fitxer de src/ que pinte <UniversalManager>    els consumidors
 *   · tota definició de `getItemCard` a src/             les projeccions
 *   · tots els fulls .css de src/                        el bloc canònic i les restes
 *
 * LLEIS
 *   F1 · Contracte tancat. ManagerItemCard només desestructura
 *        {titol, subtitol, imatge, icona, actiu, onSelecciona}. Ni `...resta`,
 *        ni `props`, ni `children`. `titol` és obligatori: és el rol H1.
 *   F2 · Botó natiu. La fitxa retorna un sol <button type="button">. Cap
 *        element porta `role`, `tabIndex` ni tecles, i cap altre element fa
 *        clic: el navegador ja fa focus, Intro i Espai.
 *   F3 · Sense forma d'article. Ni a la fitxa ni a la llista hi ha <h1>–<h6>,
 *        <article>, <header>, <footer>, <p>, `dangerouslySetInnerHTML` ni cap
 *        targeta d'article (UniversalCard, EventCard, SectionItemCard). La
 *        fitxa només usa .sdp-gestor-fitxa i els seus sis elements.
 *   F4 · Sense porta del darrere. `renderItem` no existix a la superfície, i
 *        ManagerList importa i pinta ManagerItemCard.
 *   F5 · Projecció tancada. Tota `getItemCard` retorna literals d'objecte amb
 *        `titol` i, com a molt, subtitol, imatge i icona. Una difusió (`...x`),
 *        una clau calculada o un retorn no literal són opacs: no passen.
 *   F6 · Zero estils en línia a tota la superfície. Cap `style=`.
 *   F7 · Llista neta. Cap <li> de ManagerList és interactiu (role, tabIndex,
 *        onClick, tecles): l'única acció és el botó de la fitxa.
 *   F8 · Bloc canònic. src/css/index.css declara --sdp-fitxa-mida: 96px al
 *        :root, el títol a -webkit-line-clamp: 2, el subtítol en una línia,
 *        la media quadrada, el marcador actiu amb --sdp-accent-text i un
 *        pressupost vertical que cap en la mida amb interlineat ≥ 1,3 (la «ç»
 *        de Noto Sans). Cap altre full declara .sdp-gestor-*, i cap selector
 *        inventa elements de fitxa fora dels sis.
 *   F9 · Classes jubilades. Les classes de la fila vella no tornen: ni en els
 *        fulls de src/ ni en el JSX de la superfície. Mentre les seues regles
 *        continuen als fulls, esta llei continua roja: s'esborren a mà.
 *
 * Ús:
 *   node tooling/gates/tractor-fitxa-gestor.mjs
 *   node tooling/gates/tractor-fitxa-gestor.mjs --nomes F5
 *   node tooling/gates/tractor-fitxa-gestor.mjs --arrel=/ruta/al/repo
 *
 * Eixides: 0 net · 1 infracció · 2 error d'execució (no es pot certificar).
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { R, rel, EXCLOSOS, ErrorArrel } from '../lib/arrel.mjs';
import { senseComentarisCSS } from '../lib/codi.mjs';

/* ═══════════════════════ Contracte de la llei ═══════════════════════ */

const MODUL = 'src/components/universal/manager';
const FITXA = `${MODUL}/ManagerItemCard.jsx`;
const LLISTA = `${MODUL}/ManagerList.jsx`;
const FULL_CANONIC = 'src/css/modules.css';

const MIDA_LLEI = 96;          /* px · costat de la media i alçada mínima de la fitxa */
const ARREL_PX = 16;           /* px · valor d'1rem si <html> no en declara cap */
const SOL_INTERLINEAT = 1.3;   /* Noto Sans: àrea de contingut 1,362em; per davall, la «ç» es retalla */

const PROPS_FITXA = new Set(['titol', 'subtitol', 'imatge', 'icona', 'actiu', 'onSelecciona']);
const CLAUS_PROJECCIO = new Set(['titol', 'subtitol', 'imatge', 'icona']);
const ELEMENTS_FITXA = new Set(['media', 'imatge', 'inicial', 'text', 'titol', 'subtitol']);
const ETIQUETES_ARTICLE = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'header', 'footer', 'p']);
const TARGETES_ARTICLE = new Set(['UniversalCard', 'EventCard', 'SectionItemCard']);
const POSTISSOS = new Set(['role', 'tabIndex', 'tabindex', 'onKeyDown', 'onKeyUp', 'onKeyPress']);

/* La fila vella. JUBILADES_CSS són les que tenien regla pròpia en algun full;
   JUBILADES_JSX hi afig els embolcalls i les classes que mai es van declarar. */
const JUBILADES_CSS = new Set([
  'manager-item-card',
  'univ-manager-list-item', 'univ-manager-list-item--active', 'univ-manager-empty',
  'perfil-ajust', 'perfil-ajust-cos', 'perfil-ajust-titol', 'perfil-ajust-valor', 'perfil-ajust-motiu',
]);
const JUBILADES_JSX = new Set([
  ...JUBILADES_CSS,
  'conversation-meta', 'conversation-preview', 'notes-page', 'perfil-page',
]);

/* Exigències literals del bloc canònic. Selector normalitzat → propietat → valor. */
const EXIGENCIES = [
  ['.sdp-gestor-fitxa', { 'min-height': 'var(--sdp-fitxa-mida)' }],
  ['.sdp-gestor-fitxa__media', {
    flex: '0 0 var(--sdp-fitxa-mida)',
    width: 'var(--sdp-fitxa-mida)',
    height: 'var(--sdp-fitxa-mida)',
  }],
  ['.sdp-gestor-fitxa__titol', {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': '2',
    overflow: 'hidden',
  }],
  ['.sdp-gestor-fitxa__subtitol', {
    'white-space': 'nowrap',
    overflow: 'hidden',
    'text-overflow': 'ellipsis',
  }],
  ['.sdp-gestor-fitxa[aria-current=true]', { 'border-left-color': 'var(--sdp-accent-text)' }],
];

const LLEIS = {
  F1: 'Contracte tancat de la fitxa',
  F2: 'Botó natiu, sense rols postissos',
  F3: "Sense forma d'article",
  F4: 'Sense porta del darrere (renderItem)',
  F5: 'Projecció tancada (getItemCard)',
  F6: 'Zero estils en línia al gestor',
  F7: 'Llista neta',
  F8: 'Bloc canònic de la fitxa a index.css',
  F9: 'Classes jubilades',
};

const PROVA = /\.(test|spec)\.[cm]?[jt]sx?$/;
const FUNCIONS = new Set([
  'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
  'ObjectMethod', 'ClassMethod', 'ClassPrivateMethod',
]);
const CLAUS_SALTADES = new Set([
  'loc', 'start', 'end', 'extra', 'range',
  'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens',
]);

/* ═══════════════════════ Estat ═══════════════════════ */

/** Error que impedix certificar: eixida 2, mai 0. */
class ErrorPorta extends Error {}

/* Es llig dins de principal(): un flag dolent ha d'eixir amb 2, no amb una traça. */
let NOMES = null;
function llegeixNomes() {
  const i = process.argv.indexOf('--nomes');
  if (i === -1) return null;
  const codi = String(process.argv[i + 1] || '').toUpperCase();
  if (!LLEIS[codi]) throw new ErrorPorta(`--nomes «${codi}» no és cap llei (${Object.keys(LLEIS).join(', ')})`);
  return codi;
}

const infraccions = [];
const falla = (llei, fitxer, linia, missatge) => {
  if (NOMES && NOMES !== llei) return;
  infraccions.push({ llei, fitxer, linia: linia || 1, missatge });
};

/* ═══════════════════════ Recorregut i AST ═══════════════════════ */

function arbre(relDir, patro, eixida = []) {
  const base = R(relDir);
  if (!fs.existsSync(base)) return eixida;
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (EXCLOSOS.has(e.name) || e.name.startsWith('.')) continue;
    const abs = path.join(base, e.name);
    if (e.isDirectory()) arbre(path.join(relDir, e.name), patro, eixida);
    else if (patro.test(e.name)) eixida.push(abs);
  }
  return eixida;
}

const fonts = new Map();
const llig = (abs) => {
  if (!fonts.has(abs)) fonts.set(abs, fs.readFileSync(abs, 'utf8'));
  return fonts.get(abs);
};

const asts = new Map();
function ast(abs) {
  if (asts.has(abs)) return asts.get(abs);
  let arrelAST;
  try {
    arrelAST = parse(llig(abs), { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    throw new ErrorPorta(`${rel(abs)} no es pot analitzar (${e.message}). Sense AST no es pot certificar la llei.`);
  }
  asts.set(abs, arrelAST);
  return arrelAST;
}

/**
 * Recorre l'AST en profunditat. `visita(node, pare)` pot tornar `false`
 * per no baixar dins del node.
 */
function camina(node, visita, pare = null) {
  if (!node || typeof node.type !== 'string') return;
  if (visita(node, pare) === false) return;
  for (const clau of Object.keys(node)) {
    if (CLAUS_SALTADES.has(clau)) continue;
    const fill = node[clau];
    if (Array.isArray(fill)) {
      for (const f of fill) camina(f, visita, node);
    } else if (fill && typeof fill.type === 'string') {
      camina(fill, visita, node);
    }
  }
}

const linia = (node) => node?.loc?.start?.line ?? 1;
const claueDe = (k) => (k?.type === 'Identifier' ? k.name : k?.type === 'StringLiteral' ? k.value : null);

function nomJSX(n) {
  if (!n) return '';
  if (n.type === 'JSXIdentifier') return n.name;
  if (n.type === 'JSXMemberExpression') return `${nomJSX(n.object)}.${nomJSX(n.property)}`;
  if (n.type === 'JSXNamespacedName') return `${n.namespace.name}:${n.name.name}`;
  return '';
}

const nomAtribut = (a) => (a.type === 'JSXAttribute' ? nomJSX(a.name) : null);

function elementsJSX(arrelAST) {
  const eixida = [];
  camina(arrelAST, (n) => {
    if (n.type === 'JSXOpeningElement') eixida.push(n);
  });
  return eixida;
}

const esConsumidor = (arrelAST) => elementsJSX(arrelAST).some((o) => nomJSX(o.name) === 'UniversalManager');

/** Classes d'un element: literals verificables, o una marca d'opacitat. */
function classesDe(obert) {
  const eixida = [];
  const trosseja = (text, lin, parcial = false) => {
    for (const token of text.split(/\s+/).filter(Boolean)) eixida.push({ token, linia: lin, parcial });
  };
  for (const a of obert.attributes) {
    const nom = nomAtribut(a);
    if (nom !== 'className' && nom !== 'class') continue;
    const v = a.value;
    if (!v) continue;
    if (v.type === 'StringLiteral') { trosseja(v.value, linia(a)); continue; }
    if (v.type !== 'JSXExpressionContainer') continue;
    const e = v.expression;
    if (e.type === 'StringLiteral') {
      trosseja(e.value, linia(a));
    } else if (e.type === 'TemplateLiteral') {
      for (const q of e.quasis) trosseja(q.value.cooked ?? q.value.raw, linia(a), true);
      if (e.expressions.length) eixida.push({ token: null, linia: linia(a), opac: true });
    } else {
      eixida.push({ token: null, linia: linia(a), opac: true });
    }
  }
  return eixida;
}

function resolFuncio(arrelAST, nom) {
  let trobada = null;
  camina(arrelAST, (n) => {
    if (trobada) return false;
    if (n.type === 'FunctionDeclaration' && n.id?.name === nom) { trobada = n; return false; }
    if (n.type === 'VariableDeclarator' && n.id?.type === 'Identifier' && n.id.name === nom
        && n.init && FUNCIONS.has(n.init.type)) { trobada = n.init; return false; }
    return undefined;
  });
  return trobada;
}

function funcioPerDefecte(arrelAST) {
  const decl = arrelAST.program.body.find((n) => n.type === 'ExportDefaultDeclaration')?.declaration;
  if (!decl) return null;
  if (FUNCIONS.has(decl.type)) return decl;
  if (decl.type === 'Identifier') return resolFuncio(arrelAST, decl.name);
  return null;
}

/** Arguments de tots els `return` d'una funció, sense baixar a funcions niades. */
function retorns(fn) {
  if (fn.type === 'ArrowFunctionExpression' && fn.body.type !== 'BlockStatement') return [fn.body];
  const eixida = [];
  camina(fn.body, (n) => {
    if (FUNCIONS.has(n.type)) return false;
    if (n.type === 'ReturnStatement') eixida.push(n.argument);
    return undefined;
  });
  return eixida;
}

/* ═══════════════════════ F1 · Contracte tancat ═══════════════════════ */

function lleiF1(arrelAST, r) {
  const fn = funcioPerDefecte(arrelAST);
  if (!fn) {
    falla('F1', r, 1, 'no hi ha cap export per defecte analitzable: la fitxa ha de ser una funció amb props desestructurades');
    return null;
  }
  const [props] = fn.params;
  if (!props || props.type !== 'ObjectPattern') {
    falla('F1', r, linia(fn), 'les props no es desestructuren: amb `props` sencer o sense paràmetre el contracte és opac');
    return fn;
  }
  const vistes = new Set();
  for (const p of props.properties) {
    if (p.type === 'RestElement') {
      falla('F1', r, linia(p), '`...resta` obri la fitxa a qualsevol prop: per ací entraria un cos o una entradilla');
      continue;
    }
    const clau = p.computed ? null : claueDe(p.key);
    if (!clau) { falla('F1', r, linia(p), 'prop amb clau calculada: contracte opac'); continue; }
    vistes.add(clau);
    if (!PROPS_FITXA.has(clau)) {
      falla('F1', r, linia(p), `prop «${clau}» fora del contracte (${[...PROPS_FITXA].join(', ')})`);
    }
  }
  if (!vistes.has('titol')) falla('F1', r, linia(props), 'la fitxa no rep `titol`: el rol H1 és obligatori');
  camina(arrelAST, (n) => {
    if ((n.type === 'Identifier' || n.type === 'JSXIdentifier') && n.name === 'children') {
      falla('F1', r, linia(n), '`children` és un forat per on entra un cos sense forma');
    }
  });
  return fn;
}

/* ═══════════════════════ F2 · Botó natiu ═══════════════════════ */

function lleiF2(arrelAST, r, fn) {
  const oberts = elementsJSX(arrelAST);
  const botons = oberts.filter((o) => nomJSX(o.name) === 'button');
  if (botons.length !== 1) {
    falla('F2', r, linia(botons[1] ?? fn), `la fitxa ha de pintar exactament un <button> (en pinta ${botons.length})`);
  }
  for (const b of botons) {
    const tipus = b.attributes.find((a) => nomAtribut(a) === 'type');
    if (tipus?.value?.type !== 'StringLiteral' || tipus.value.value !== 'button') {
      falla('F2', r, linia(b), 'el botó ha de dur type="button" literal: dins d\'un formulari, sense tipus, envia');
    }
  }
  for (const o of oberts) {
    const nom = nomJSX(o.name);
    for (const a of o.attributes) {
      const at = nomAtribut(a);
      if (at && POSTISSOS.has(at)) falla('F2', r, linia(a), `\`${at}\` a <${nom}>: el botó natiu ja fa focus, Intro i Espai`);
      if (at === 'onClick' && nom !== 'button') falla('F2', r, linia(a), `clic a <${nom}>: l'única acció de la fitxa és el botó natiu`);
    }
  }
  if (fn) {
    const arrels = retorns(fn).map((e) => (e?.type === 'JSXElement' ? nomJSX(e.openingElement.name) : (e?.type ?? 'res')));
    if (!arrels.length || arrels.some((n) => n !== 'button')) {
      falla('F2', r, linia(fn), `la fitxa ha de retornar el <button> com a arrel (retorna: ${arrels.join(', ') || 'res'})`);
    }
  }
}

/* ═══════════════════════ F3 · Sense forma d'article ═══════════════════════ */

function esClasseDeFitxa(token) {
  if (token === 'sdp-gestor-fitxa') return true;
  const m = /^sdp-gestor-fitxa__([a-z]+)$/.exec(token);
  return Boolean(m && ELEMENTS_FITXA.has(m[1]));
}

function lleiF3(arrelAST, r, esFitxa) {
  for (const n of arrelAST.program.body) {
    if (n.type !== 'ImportDeclaration') continue;
    const locals = n.specifiers.map((s) => s.local.name);
    const perNom = locals.find((x) => TARGETES_ARTICLE.has(x));
    const perCami = [...TARGETES_ARTICLE].find((t) => new RegExp(`(^|/)${t}(\\.jsx?)?$`).test(n.source.value));
    const targeta = perNom || perCami;
    if (targeta) falla('F3', r, linia(n), `importa ${targeta}: una targeta d'article no entra a la llista del gestor`);
  }
  for (const o of elementsJSX(arrelAST)) {
    const nom = nomJSX(o.name);
    if (ETIQUETES_ARTICLE.has(nom)) {
      falla('F3', r, linia(o), `<${nom}>: forma d'article (encapçalament, entradilla o cos) dins de la llista`);
    }
    if (TARGETES_ARTICLE.has(nom)) falla('F3', r, linia(o), `<${nom}>: targeta d'article dins de la llista`);
    for (const a of o.attributes) {
      if (nomAtribut(a) === 'dangerouslySetInnerHTML') falla('F3', r, linia(a), 'HTML cru: és un cos sense forma');
    }
    if (!esFitxa) continue;
    for (const c of classesDe(o)) {
      if (c.opac) { falla('F3', r, c.linia, 'className no literal a la fitxa: no es pot verificar'); continue; }
      if (!esClasseDeFitxa(c.token)) {
        falla('F3', r, c.linia, `classe «${c.token}» fora de la fitxa (sdp-gestor-fitxa i __${[...ELEMENTS_FITXA].join(', __')})`);
      }
    }
  }
}

/* ═══════════════════════ F4 · Sense porta del darrere ═══════════════════════ */

function lleiF4(arrelAST, r) {
  camina(arrelAST, (n) => {
    if ((n.type === 'Identifier' || n.type === 'JSXIdentifier') && n.name === 'renderItem') {
      falla('F4', r, linia(n), '`renderItem` és la porta del darrere: la llista pinta ManagerItemCard a partir de getItemCard');
    }
  });
}

function lleiF4Llista(arrelAST, r) {
  const importa = arrelAST.program.body.some((n) => n.type === 'ImportDeclaration'
    && /(^|\/)ManagerItemCard(\.jsx)?$/.test(n.source.value));
  const pinta = elementsJSX(arrelAST).some((o) => nomJSX(o.name) === 'ManagerItemCard');
  if (!importa || !pinta) {
    falla('F4', r, 1, "ManagerList no importa i pinta ManagerItemCard: la llista ha de ser l'única que pinta fitxes");
  }
}

/* ═══════════════════════ F5 · Projecció tancada ═══════════════════════ */

function llocsDeProjeccio(arrelAST) {
  const llocs = [];
  camina(arrelAST, (n, pare) => {
    if (n.type === 'ObjectProperty' && pare?.type !== 'ObjectPattern' && !n.computed && claueDe(n.key) === 'getItemCard') {
      llocs.push({ valor: n.value, node: n });
    } else if (n.type === 'ObjectMethod' && !n.computed && claueDe(n.key) === 'getItemCard') {
      llocs.push({ valor: n, node: n });
    } else if (n.type === 'JSXAttribute' && nomJSX(n.name) === 'getItemCard') {
      llocs.push({ valor: n.value?.type === 'JSXExpressionContainer' ? n.value.expression : n.value, node: n });
    } else if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression'
        && !n.left.computed && claueDe(n.left.property) === 'getItemCard') {
      llocs.push({ valor: n.right, node: n });
    }
  });
  return llocs;
}

function examinaObjecte(e, r, lin) {
  if (!e) {
    falla('F5', r, lin, 'getItemCard pot retornar buit: la fitxa necessita almenys `titol`');
    return;
  }
  if (e.type === 'ConditionalExpression') {
    examinaObjecte(e.consequent, r, lin);
    examinaObjecte(e.alternate, r, lin);
    return;
  }
  if (e.type !== 'ObjectExpression') {
    falla('F5', r, linia(e) || lin, `retorn no literal (${e.type}): la projecció ha de ser un objecte visible`);
    return;
  }
  let teTitol = false;
  for (const p of e.properties) {
    if (p.type === 'SpreadElement') {
      falla('F5', r, linia(p), 'difusió `...` dins la projecció: hi pot entrar un cos o una entradilla');
      continue;
    }
    if (p.type === 'ObjectMethod') { falla('F5', r, linia(p), 'mètode dins la projecció: una fitxa només porta dades'); continue; }
    const clau = p.computed ? null : claueDe(p.key);
    if (!clau) { falla('F5', r, linia(p), 'clau calculada dins la projecció: opaca'); continue; }
    if (clau === 'titol') teTitol = true;
    if (!CLAUS_PROJECCIO.has(clau)) {
      falla('F5', r, linia(p), `clau «${clau}» fora de la fitxa: només ${[...CLAUS_PROJECCIO].join(', ')}`);
    }
  }
  if (!teTitol) falla('F5', r, linia(e), 'projecció sense `titol`: el rol H1 és obligatori');
}

function examinaFuncio(fn, r) {
  const rets = retorns(fn);
  if (!rets.length) { falla('F5', r, linia(fn), 'getItemCard no retorna res'); return; }
  for (const e of rets) examinaObjecte(e, r, linia(fn));
}

/** Torna 'definicio' si ha examinat una funció; 'relleu' si només passa la prop. */
function analitzaProjeccio(valor, arrelAST, r, lin) {
  if (!valor) { falla('F5', r, lin, 'getItemCard sense valor'); return 'relleu'; }
  if (FUNCIONS.has(valor.type)) { examinaFuncio(valor, r); return 'definicio'; }
  if (valor.type === 'Identifier') {
    if (valor.name === 'getItemCard' || valor.name === 'undefined') return 'relleu';
    const fn = resolFuncio(arrelAST, valor.name);
    if (fn) { examinaFuncio(fn, r); return 'definicio'; }
    falla('F5', r, lin, `getItemCard apunta a «${valor.name}», que no es definix en aquest fitxer: projecció opaca`);
    return 'relleu';
  }
  if (valor.type === 'MemberExpression' && !valor.computed && claueDe(valor.property) === 'getItemCard') {
    return 'relleu'; /* es verifica on es definix la propietat */
  }
  if (valor.type === 'NullLiteral') return 'relleu';
  falla('F5', r, lin, `getItemCard és una expressió opaca (${valor.type}): ha de ser una funció que retorne un literal`);
  return 'relleu';
}

/* ═══════════════════════ F6 · Zero estils en línia ═══════════════════════ */

function lleiF6(arrelAST, r) {
  camina(arrelAST, (n) => {
    if (n.type === 'JSXAttribute' && nomJSX(n.name) === 'style') {
      falla('F6', r, linia(n), "estil en línia: el gestor només es vestix des d'index.css");
    }
  });
}

/* ═══════════════════════ F7 · Llista neta ═══════════════════════ */

function lleiF7(arrelAST, r) {
  for (const o of elementsJSX(arrelAST)) {
    if (nomJSX(o.name) !== 'li') continue;
    for (const a of o.attributes) {
      const at = nomAtribut(a);
      if (at && (POSTISSOS.has(at) || at === 'onClick')) {
        falla('F7', r, linia(a), `\`${at}\` a <li>: la fila no és un control, ho és la fitxa`);
      }
    }
  }
}

/* ═══════════════════════ F8 i F9 · Fulls ═══════════════════════ */

const normalitzaSelector = (s) => s.trim().replace(/\s+/g, ' ').replace(/["']/g, '');

/** Regles CSS internes (també les de dins de @media), amb línia i declaracions. */
function reglesCSS(font) {
  const net = senseComentarisCSS(font);
  const regles = [];
  for (const m of net.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelud = m[1].split(';').pop();
    const sel = prelud.trim();
    if (!sel || sel.startsWith('@')) continue;
    const posicio = m.index + m[1].length - prelud.length + prelud.search(/\S/);
    const decls = new Map();
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      const prop = d.slice(0, i).trim().toLowerCase();
      if (prop) decls.set(prop, d.slice(i + 1).trim().replace(/\s+/g, ' '));
    }
    regles.push({
      selectors: sel.split(',').map(normalitzaSelector),
      decls,
      linia: net.slice(0, posicio).split('\n').length,
    });
  }
  return regles;
}

function lleiF8(regles, r) {
  const tokensCode = fs.readFileSync(R('src/css/tokens.css'), 'utf8');
  const tokensRegles = reglesCSS(tokensCode);
  const tokens = new Map();
  for (const rg of tokensRegles) {
    if (!rg.selectors.includes(':root')) continue;
    for (const [p, v] of rg.decls) if (p.startsWith('--') && !tokens.has(p)) tokens.set(p, v);
  }

  const troba = (selector) => {
    let decls = null;
    let lin = 0;
    for (const rg of regles) {
      if (!rg.selectors.includes(selector)) continue;
      if (!decls) { decls = new Map(); lin = rg.linia; }
      for (const [p, v] of rg.decls) decls.set(p, v);
    }
    return decls ? { decls, linia: lin } : null;
  };

  const mida = tokens.get('--sdp-fitxa-mida');
  if (!mida) {
    falla('F8', r, 1, '--sdp-fitxa-mida no es declara al bloc :root: la llei de la mida no té font única');
  } else if (mida !== `${MIDA_LLEI}px`) {
    falla('F8', r, 1, `--sdp-fitxa-mida val «${mida}»: la llei diu ${MIDA_LLEI}px`);
  }

  for (const [selector, props] of EXIGENCIES) {
    const regla = troba(selector);
    if (!regla) { falla('F8', r, 1, `falta la regla «${selector}» del bloc canònic`); continue; }
    for (const [prop, esperat] of Object.entries(props)) {
      const real = regla.decls.get(prop);
      if (real !== esperat) {
        falla('F8', r, regla.linia, `${selector} { ${prop}: ${real ?? '—'} } · la llei exigix «${esperat}»`);
      }
    }
  }

  /* Pressupost vertical: 2 línies de títol + 1 de subtítol + separació + coixí ≤ mida. */
  const html = troba('html');
  const numero = (v) => (/^\d*\.?\d+$/.test(v ?? '') ? Number(v) : null);
  const resol = (v, profunditat = 0) => {
    const m = /^var\((--[\w-]+)\)$/.exec(v ?? '');
    if (!m) return v ?? null;
    if (profunditat > 12 || !tokens.has(m[1])) return null;
    return resol(tokens.get(m[1]), profunditat + 1);
  };
  const arrelPx = (() => {
    const fs0 = resol(html?.decls.get('font-size'));
    if (!fs0) return ARREL_PX;
    const px0 = /^(\d*\.?\d+)px$/.exec(fs0);
    return px0 ? Number(px0[1]) : null;
  })();
  const px = (v) => {
    const r0 = resol(v);
    if (r0 === '0') return 0;
    const m = /^(\d*\.?\d+)(px|rem)$/.exec(r0 ?? '');
    if (!m || arrelPx === null) return null;
    return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * arrelPx;
  };
  /* padding: 1 valor = tots · 2 = bloc inline · 3 = dalt inline baix · 4 = dalt dreta baix esquerra */
  const coixiVertical = (decls) => {
    const parts = (decls.get('padding') ?? '0').split(' ');
    let d = px(parts[0]);
    let b = px(parts.length >= 3 ? parts[2] : parts[0]);
    const bloc = decls.get('padding-block');
    if (bloc) { const [a1, a2 = a1] = bloc.split(' '); d = px(a1); b = px(a2); }
    if (decls.has('padding-top')) d = px(decls.get('padding-top'));
    if (decls.has('padding-bottom')) b = px(decls.get('padding-bottom'));
    return d === null || b === null ? null : d + b;
  };

  const titol = troba('.sdp-gestor-fitxa__titol');
  const subtitol = troba('.sdp-gestor-fitxa__subtitol');
  const text = troba('.sdp-gestor-fitxa__text');
  if (titol && subtitol && text) {
    const fsT = px(titol.decls.get('font-size'));
    const lhT = numero(resol(titol.decls.get('line-height')));
    const fsS = px(subtitol.decls.get('font-size'));
    const lhS = numero(resol(subtitol.decls.get('line-height')));
    const separacio = px(text.decls.get('gap') ?? text.decls.get('row-gap') ?? '0');
    const coixi = coixiVertical(text.decls);
    const mesures = {
      'font-size del títol': fsT,
      'line-height del títol': lhT,
      'font-size del subtítol': fsS,
      'line-height del subtítol': lhS,
      'gap del text': separacio,
      'coixí vertical del text': coixi,
    };
    const opacs = Object.entries(mesures).filter(([, v]) => v === null).map(([k]) => k);
    if (opacs.length) {
      falla('F8', r, text.linia, `pressupost vertical no verificable (${opacs.join(', ')}): cal un token o un valor literal en px/rem`);
    } else {
      for (const [qui, lh, lin] of [['títol', lhT, titol.linia], ['subtítol', lhS, subtitol.linia]]) {
        if (lh < SOL_INTERLINEAT) {
          falla('F8', r, lin, `interlineat del ${qui} ${lh} per davall de ${SOL_INTERLINEAT}: la cua de la «ç» de Noto Sans es retalla`);
        }
      }
      const alcada = 2 * fsT * lhT + fsS * lhS + separacio + coixi;
      if (alcada > MIDA_LLEI + 1e-9) {
        falla('F8', r, text.linia, `pressupost vertical ${alcada.toFixed(1)}px > ${MIDA_LLEI}px: amb la lletra per defecte la fitxa ja no fa la mida de la llei`);
      }
    }
  }
}

function lleiFulls(fullsCSS) {
  for (const abs of fullsCSS) {
    const r = rel(abs);
    const regles = reglesCSS(llig(abs));
    if (r === FULL_CANONIC) lleiF8(regles, r);
    for (const rg of regles) {
      for (const s of rg.selectors) {
        for (const m of s.matchAll(/\.(sdp-gestor-[\w-]+)/g)) {
          if (r !== FULL_CANONIC) falla('F8', r, rg.linia, `«.${m[1]}» declarada fora d'${FULL_CANONIC}: la fitxa té un sol full`);
          const element = /^sdp-gestor-fitxa__(.+)$/.exec(m[1]);
          if (element && !ELEMENTS_FITXA.has(element[1])) {
            falla('F8', r, rg.linia, `element «__${element[1]}» inventat: la fitxa només té __${[...ELEMENTS_FITXA].join(', __')}`);
          }
        }
        for (const m of s.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
          if (JUBILADES_CSS.has(m[1])) falla('F9', r, rg.linia, `regla de la classe jubilada «.${m[1]}»: esborra-la a mà`);
        }
      }
    }
  }
}

function lleiF9JSX(arrelAST, r) {
  for (const o of elementsJSX(arrelAST)) {
    for (const c of classesDe(o)) {
      if (c.token && JUBILADES_JSX.has(c.token)) falla('F9', r, c.linia, `classe jubilada «${c.token}» de la fila vella`);
    }
  }
}

/* ═══════════════════════ Informe ═══════════════════════ */

function informe({ superficie, projeccions, fulls }) {
  const vistes = new Set();
  const uniques = infraccions.filter((i) => {
    const clau = `${i.llei}|${i.fitxer}|${i.linia}|${i.missatge}`;
    if (vistes.has(clau)) return false;
    vistes.add(clau);
    return true;
  });
  const perLlei = new Map(Object.keys(LLEIS).map((k) => [k, []]));
  for (const i of uniques) perLlei.get(i.llei).push(i);

  console.log('\n🪪 TRACTOR DE LA FITXA DE GESTOR — títol ≤ 2 línies · subtítol ≤ 1 · cap porta del darrere');
  console.log(`   ${superficie} fitxers de superfície · ${projeccions} projeccions · ${fulls} fulls CSS`);
  console.log('─'.repeat(72));
  for (const [codi, nom] of Object.entries(LLEIS)) {
    if (NOMES && NOMES !== codi) continue;
    const n = perLlei.get(codi).length;
    console.log(`  ${n ? '❌' : '✅'} ${codi} · ${nom}${n ? `  (${n})` : ''}`);
  }

  if (!uniques.length) {
    console.log('\nLa llista del gestor té la forma de la fitxa. El mur aguanta.\n');
    return 0;
  }

  console.log(`\n❌ INFRACCIONS (${uniques.length})`);
  console.log('─'.repeat(72));
  for (const [codi, llista] of perLlei) {
    if (!llista.length) continue;
    console.log(`\n  ${codi} · ${LLEIS[codi]}  (${llista.length})`);
    llista.sort((a, b) => a.fitxer.localeCompare(b.fitxer) || a.linia - b.linia);
    for (const i of llista) {
      console.log(`    ${i.fitxer}:${i.linia}`);
      console.log(`      ↳ ${i.missatge}`);
    }
  }
  console.log(`\n${'─'.repeat(72)}`);
  console.log('PARAT. La llista del gestor no té la forma de la fitxa. Esta llei no admet sostre de deute.\n');
  return 1;
}

/* ═══════════════════════ Principal ═══════════════════════ */

function principal() {
  NOMES = llegeixNomes();
  for (const cami of [FITXA, LLISTA, FULL_CANONIC]) {
    if (!fs.existsSync(R(cami))) {
      throw new ErrorPorta(`falta ${cami}: la superfície de la llei no existix i no es pot certificar res`);
    }
  }

  const fontsJS = arbre('src', /\.(m?jsx?|cjs)$/).filter((abs) => !PROVA.test(abs));
  const fullsCSS = arbre('src', /\.css$/);
  const modul = fontsJS.filter((abs) => rel(abs).startsWith(`${MODUL}/`));
  const consumidors = fontsJS
    .filter((abs) => !modul.includes(abs) && /<UniversalManager\b/.test(llig(abs)))
    .filter((abs) => esConsumidor(ast(abs)));

  /* F1–F3 · la fitxa */
  const astFitxa = ast(R(FITXA));
  const fn = lleiF1(astFitxa, FITXA);
  lleiF2(astFitxa, FITXA, fn);
  lleiF3(astFitxa, FITXA, true);

  /* F3, F4, F7 · la llista */
  const astLlista = ast(R(LLISTA));
  lleiF3(astLlista, LLISTA, false);
  lleiF4Llista(astLlista, LLISTA);
  lleiF7(astLlista, LLISTA);

  /* F4, F6, F9 · tota la superfície */
  for (const abs of [...modul, ...consumidors]) {
    const arrelAST = ast(abs);
    const r = rel(abs);
    lleiF4(arrelAST, r);
    lleiF6(arrelAST, r);
    lleiF9JSX(arrelAST, r);
  }

  /* F5 · projeccions, on siguen */
  let projeccions = 0;
  for (const abs of fontsJS.filter((f) => /\bgetItemCard\b/.test(llig(f)))) {
    const arrelAST = ast(abs);
    for (const lloc of llocsDeProjeccio(arrelAST)) {
      if (analitzaProjeccio(lloc.valor, arrelAST, rel(abs), linia(lloc.node)) === 'definicio') projeccions += 1;
    }
  }

  /* F8, F9 · fulls */
  lleiFulls(fullsCSS);

  return informe({ superficie: modul.length + consumidors.length, projeccions, fulls: fullsCSS.length });
}

try {
  process.exit(principal());
} catch (err) {
  if (err instanceof ErrorArrel) {
    console.error(err.informe());
    process.exit(2);
  }
  if (err instanceof ErrorPorta) {
    console.error(`\n❌ [TRACTOR-FITXA] ${err.message}\n`);
    process.exit(2);
  }
  console.error(`\n❌ [TRACTOR-FITXA] Error inesperat: ${err.stack || err.message}\n`);
  process.exit(2);
}
