#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'path';
/**
 * tractor-vocabulari.mjs — EL CIMENT ARMAT
 *
 * PREMISSA (auditoria 260829):
 * Llistar infraccions no impedix que se'n creen de noves. El que ho impedix
 * és tancar el vocabulari. `termodinamic.mjs` ja fa això amb els noms de
 * fitxer: una llista tancada de CATEGORIES i un sol regex. Aquest tractor
 * aplica la mateixa forma al CSS.
 *
 * LLEI: dins de l'ABAST (src/sections, src/components, src/app, src/pages i
 * src/apps), tota classe usada ha d'estar declarada al vocabulari. Si no hi
 * és, la compilació falla. No hi ha `className` lliure. Construir una vista
 * fora de l'estàndard deixa de ser possible.
 *
 * Onada R29 · vocab-abast-apps · El vocabulari d'arrencada ja no és una llista
 * a mà: és la cadena d'@import de src/css/index.css (el que servix de debò el
 * paquet), més els fulls diferits (src/css/diferit-*.css) i els fulls de l'abast.
 * Onada R29 · vocab-comentaris · Els comentaris CSS no declaren cap classe.
 *
 * CINC REGLES:
 *   V1 · classe-forastera      Classe usada que no existix al vocabulari. LLEI DURA.
 *   V2 · classe-opaca          `className={`x--${cond}`}` — no verificable estàticament.
 *                              Admet deute; ha de baixar cap a mapes explícits.
 *   V3 · css-de-seccio         Cap fitxer .css pot viure sota l'abast.  LLEI DURA.
 *   V4 · classe-diferida-orfe  Onada R29 · css-diferit-04 · Classe que només declara
 *                              un full diferit, pintada en un fitxer que no l'adopta
 *                              (useFullDiferit amb la seua clau) ni n'hereta l'arrel
 *                              (HERENCIA_DIFERIDA). LLEI DURA.
 *   V5 · full-diferit-trencat  Onada R29 · css-diferit-04 · Un full diferit a la cadena
 *                              d'arrencada, sense cap adoptant, amb regles fora de
 *                              `@layer components`, o una crida amb una clau que no
 *                              casa amb el full ?inline importat. LLEI DURA.
 *
 * ÚS:
 *   node tooling/gates/tractor-vocabulari.mjs
 *   node tooling/gates/tractor-vocabulari.mjs --baseline
 *   node tooling/gates/tractor-vocabulari.mjs --detall
 *   node tooling/gates/tractor-vocabulari.mjs --fantasmes   # classes declarades buides
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { parse } from '@babel/parser';

const ARREL = process.cwd();
const DEUTE_PATH = join(ARREL, '.agents/deute/.vocabulari-deute.json');

/** Onada R29 · vocab-abast-apps · L'arrel de la cascada. El vocabulari d'arrencada és ell i tot el que
 *  importa (recursivament), en el mateix ordre que el servixen main.jsx, PedraSecaEmbed.jsx i natiu. */
const FULL_ARRENCADA = 'src/css/index.css';

/** Onada R28 · D-R27-1, opció (b) aprovada pel Mestre (pla 261115_0135 §1) · fulls diferits: són vocabulari,
 *  però no entren a index.css; la peça que els usa els adopta en muntar-se (src/config/fullDiferit.js).
 *  Onada R29 · Es descobrixen per nom (src/css/diferit-<clau>.css), no per una llista a mà. */
const DIR_DIFERITS = 'src/css';
const FULL_DIFERIT = /^diferit-([a-z0-9]+(?:-[a-z0-9]+)*)\.css$/;
const CARREGADOR_DIFERIT = 'src/config/fullDiferit.js';
const FUNCIONS_ADOPCIO = new Set(['useFullDiferit', 'adoptaFullDiferit']);

/** Onada R29 · css-diferit-04 · Herència tancada: fitxers que pinten classes només diferides sense adoptar
 *  el full perquè sempre es pinten dins de la peça que l'adopta. Els detalls del catàleg de /disseny es
 *  munten dins d'<Especimen>, que adopta `especimens`. Afegir-hi una entrada és una decisió, no un pedaç. */
const HERENCIA_DIFERIDA = Object.freeze({
  especimens: Object.freeze(['src/sections/disseny/cataleg/detalls/'])
});

/**
 * Fulls en transició. Les seues classes s'accepten HUI, però el deute
 * V2/legacy ha de baixar fins que aquest array quede buit i el fitxer
 * es puga esborrar. Objectiu declarat: suprimir legacy-components.css.
 */
const FULLS_TRANSICIO = ['src/css/legacy-components.css'];

/** Directoris on la llei s'aplica. La resta del projecte queda fora.
 *  Onada R29 · vocab-abast-apps · src/apps (Plataforma d'Apps, Bar, Nevera, Lector) també viatja al paquet. */
const ABAST = ['src/sections', 'src/components', 'src/app', 'src/pages', 'src/apps'];

const LLEIS_DURES = new Set(['classe-forastera', 'css-de-seccio', 'classe-diferida-orfe', 'full-diferit-trencat']);

const ON_ES_DECLARA = `al vocabulari (${FULL_ARRENCADA} i els seus @import, els fulls ${DIR_DIFERITS}/diferit-*.css i els fulls de l'abast)`;

/* ─────────────────────────── Utilitats ─────────────────────────── */

const posix = (rel) => rel.split(path.sep).join('/');

function arbre(arrel, dir, exts, acc = []) {
  const abs = join(arrel, dir);
  if (!existsSync(abs)) return acc;
  for (const nom of readdirSync(abs)) {
    if (nom === 'node_modules' || nom.startsWith('.')) continue;
    const rel = join(dir, nom);
    if (statSync(join(arrel, rel)).isDirectory()) arbre(arrel, rel, exts, acc);
    else if (exts.includes(extname(nom))) acc.push(rel);
  }
  return acc;
}

/** Onada R29 · vocab-comentaris · Un `.x` escrit dins d'un comentari no és cap regla. */
export const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const IMPORT_CSS = /@import\s+(?:url\(\s*)?(['"]?)([^'"()\s;]+)\1\s*\)?/g;

/** Onada R29 · vocab-abast-apps · La cadena d'@import d'index.css, recursiva i sense comentaris.
 *  Torna { fulls, absents } amb camins relatius POSIX; un @import cap a un full absent va a `absents`. */
export function fullsArrencada(arrel = process.cwd()) {
  const fulls = [];
  const absents = [];
  const vistos = new Set();
  const visita = (rel) => {
    if (vistos.has(rel)) return;
    vistos.add(rel);
    const abs = join(arrel, rel);
    if (!existsSync(abs)) { absents.push(rel); return; }
    fulls.push(rel);
    for (const m of senseComentaris(readFileSync(abs, 'utf8')).matchAll(IMPORT_CSS)) {
      const desti = m[2];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(desti)) continue;   // http:, data:, //cdn: fora del repositori
      visita(path.posix.normalize(path.posix.join(path.posix.dirname(rel), desti)));
    }
  };
  visita(FULL_ARRENCADA);
  return { fulls, absents };
}

/** Onada R29 · css-diferit-04 · Els fulls diferits: [{ clau, full }], per ordre de nom. */
export function fullsDiferits(arrel = process.cwd()) {
  const abs = join(arrel, DIR_DIFERITS);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).sort()
    .map((nom) => FULL_DIFERIT.exec(nom))
    .filter(Boolean)
    .map((m) => ({ clau: m[1], full: `${DIR_DIFERITS}/${m[0]}` }));
}

/** Onada R29 · css-diferit-04 · Cert si el full té alguna cosa fora d'un bloc `@layer components { … }`.
 *  Una regla sense capa, adoptada darrere de tota la cascada, guanyaria fins i tot les utilitats. */
export function teReglesForaDeCapa(css) {
  const esEspaiCss = (c) => c !== undefined && /[ \t\r\n\f]/.test(c);
  const esNomCss = (c) => c !== undefined && (/[a-z0-9_-]/i.test(c) || c.charCodeAt(0) >= 0x80);
  /* CSS Syntax §4.3.7: consumir l'escape complet evita tractar un parèntesi
     escapat com a tancament i permet reconéixer noms com u\72l(...). */
  const escapeCss = (inici) => {
    let fi = inici + 1;
    if (fi >= css.length || /[\r\n\f]/.test(css[fi])) return null;
    if (/[0-9a-f]/i.test(css[fi])) {
      const principi = fi;
      while (fi - principi < 6 && fi < css.length && /[0-9a-f]/i.test(css[fi])) fi++;
      const valor = Number.parseInt(css.slice(principi, fi), 16);
      if (css[fi] === '\r' && css[fi + 1] === '\n') fi += 2;
      else if (esEspaiCss(css[fi])) fi++;
      const caracter = valor === 0 || valor > 0x10ffff || (valor >= 0xd800 && valor <= 0xdfff)
        ? '\ufffd' : String.fromCodePoint(valor);
      return { caracter, fi };
    }
    return { caracter: css[fi], fi: fi + 1 };
  };
  const identificadorCss = (inici) => {
    const anterior = css[inici - 1];
    if (esNomCss(anterior) || anterior === '\\' || anterior === '#' || anterior === '@') return null;
    if (!esNomCss(css[inici]) && css[inici] !== '\\') return null;
    let fi = inici;
    let nom = '';
    while (fi < css.length) {
      if (esNomCss(css[fi])) nom += css[fi++];
      else if (css[fi] === '\\') {
        const escape = escapeCss(fi);
        if (!escape) break;
        nom += escape.caracter;
        fi = escape.fi;
      } else break;
    }
    return fi > inici ? { nom, fi } : null;
  };
  /* CSS Syntax §4.3.6: en URL sense cometes, /* és text del token.
     Només el parèntesi no escapat el tanca; una URL malformada es rebutja. */
  const finalUrlSenseCometes = (inici) => {
    let fi = inici;
    while (esEspaiCss(css[fi])) fi++;
    while (fi < css.length) {
      const c = css[fi++];
      if (c === ')') return fi;
      if (esEspaiCss(c)) {
        while (esEspaiCss(css[fi])) fi++;
        return css[fi] === ')' ? fi + 1 : -1;
      }
      if (c === '\\') {
        const escape = escapeCss(fi - 1);
        if (!escape) return -1;
        fi = escape.fi;
      } else if (c === '"' || c === "'" || c === '(' || /[\x01-\x08\x0b\x0e-\x1f\x7f]/.test(c)) return -1;
    }
    return -1;
  };
  let i = 0;
  const saltaTrivia = () => {
    while (i < css.length) {
      if (/\s/.test(css[i])) { i++; continue; }
      if (css[i] !== '/' || css[i + 1] !== '*') break;
      const fi = css.indexOf('*/', i + 2);
      i = fi < 0 ? css.length : fi + 2;
    }
  };
  while (i < css.length) {
    saltaTrivia();
    if (i >= css.length) return false;
    if (!css.startsWith('@layer', i)) return true;
    i += 6;
    const separador = i;
    saltaTrivia();
    if (i === separador || !css.startsWith('components', i)) return true;
    i += 10;
    saltaTrivia();
    if (css[i++] !== '{') return true;
    /* R29-D1: les claus en cadenes, escapes i funcions CSS són valors,
       no tanquen la capa. Els comentaris només es reconeixen fora de cadenes. */
    let cometa = null;
    let parentesis = 0;
    for (let profunditat = 1; profunditat > 0;) {
      if (i >= css.length) return true;
      const c = css[i++];
      if (cometa) {
        if (c === '\\') {
          if (css[i] === '\r' && css[i + 1] === '\n') i += 2;
          else i++;
        }
        else if (c === '\n' || c === '\r' || c === '\f') return true;
        else if (c === cometa) cometa = null;
      } else if (c === '"' || c === "'") cometa = c;
      else if (c === '/' && css[i] === '*') {
        const fi = css.indexOf('*/', i + 1);
        if (fi < 0) return true;
        i = fi + 2;
      } else {
        const identificador = identificadorCss(i - 1);
        if (identificador) {
          i = identificador.fi;
          if (identificador.nom.toLowerCase() === 'url' && css[i] === '(') {
            let inici = i + 1;
            while (esEspaiCss(css[inici])) inici++;
            if (css[inici] !== '"' && css[inici] !== "'") {
              const fi = finalUrlSenseCometes(inici);
              if (fi < 0) return true;
              i = fi;
            }
          }
        } else if (c === '\\') i++;
        else if (c === '(') parentesis++;
        else if (c === ')' && parentesis > 0) parentesis--;
        else if (parentesis === 0) {
          if (c === '{') profunditat++;
          else if (c === '}') profunditat--;
        }
      }
    }
  }
  return false;
}

function llegirVocabulari(arrel) {
  const vocab = new Set();
  const buides = new Set();
  const llig = (full, desti) => {
    const abs = join(arrel, full);
    if (!existsSync(abs)) return;
    const css = senseComentaris(readFileSync(abs, 'utf8'));
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) { vocab.add(m[1]); desti.add(m[1]); }
    // classes fantasma: declarades amb cos buit
    for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)\s*\{\s*\}/g)) buides.add(m[1]);
  };

  const { fulls: arrencada, absents } = fullsArrencada(arrel);
  const diferits = fullsDiferits(arrel);
  const comuns = new Set();
  const fitxersComuns = new Set([...arrencada, ...FULLS_TRANSICIO, ...ABAST.flatMap((dir) => arbre(arrel, dir, ['.css']).map(posix))]);
  for (const full of fitxersComuns) llig(full, comuns);

  /* Onada R29 · css-diferit-04 · Classe només diferida → claus dels fulls diferits que la declaren. */
  const nomesDiferides = new Map();
  for (const { clau, full } of diferits) {
    const propies = new Set();
    llig(full, propies);
    for (const c of propies) {
      if (comuns.has(c)) continue;
      if (!nomesDiferides.has(c)) nomesDiferides.set(c, new Set());
      nomesDiferides.get(c).add(clau);
    }
  }
  return { vocab, buides, nomesDiferides, diferits, arrencada, absents };
}

/* ───────────────── Extracció de classes per AST ───────────────── */

function tokens(str) {
  return str.split(/\s+/).filter(t => /^-?[_a-zA-Z][\w-]*$/.test(t));
}

/**
 * Recull les classes d'una expressió JSX de `className`.
 * Retorna { estatiques: [], dinamiques: [] }.
 *
 * ESTÀTIC:  "a b"  ·  {'a'}  ·  {cond ? 'a' : 'b'}  ·  {`a ${x ? 'b' : 'c'}`}
 * DINÀMIC:  {`x--${y}`}  — la interpolació toca un token a mitges.
 */
function classesDe(node) {
  const estatiques = [];
  const dinamiques = [];

  const visita = (n) => {
    if (!n || typeof n !== 'object') return;
    switch (n.type) {
      case 'StringLiteral':
        estatiques.push(...tokens(n.value));
        return;
      case 'TemplateLiteral': {
        n.quasis.forEach((q, i) => {
          const text = q.value.cooked ?? q.value.raw ?? '';
          const seguent = n.expressions[i];
          // Si el tros acaba sense espai i encara ve una interpolació,
          // el token queda partit: no es pot verificar.
          const partitDreta = seguent && text.length > 0 && !/\s$/.test(text);
          const anterior = i > 0 ? (n.quasis[i - 1].value.cooked ?? '') : null;
          const partitEsquerra = anterior !== null && text.length > 0 && !/^\s/.test(text);
          const trossos = tokens(text);
          if (partitDreta && trossos.length) {
            dinamiques.push(trossos[trossos.length - 1] + '${…}');
            estatiques.push(...trossos.slice(0, -1));
          } else if (partitEsquerra && trossos.length) {
            dinamiques.push('${…}' + trossos[0]);
            estatiques.push(...trossos.slice(1));
          } else {
            estatiques.push(...trossos);
          }
          if (seguent) visita(seguent);
        });
        return;
      }
      case 'ConditionalExpression':
        visita(n.consequent); visita(n.alternate); return;
      case 'LogicalExpression':
        visita(n.left); visita(n.right); return;
      case 'BinaryExpression':
        visita(n.left); visita(n.right); return;
      case 'JSXExpressionContainer':
        visita(n.expression); return;
      case 'CallExpression':
        n.arguments.forEach(visita); return;
      case 'ArrayExpression':
        n.elements.forEach(visita); return;
      case 'Identifier':
      case 'MemberExpression':
      case 'NumericLiteral':
        return; // no és una classe: és una variable. No la comptem.
      default:
        for (const k of Object.keys(n)) {
          const v = n[k];
          if (Array.isArray(v)) v.forEach(visita);
          else if (v && typeof v === 'object' && v.type) visita(v);
        }
    }
  };

  visita(node);
  return { estatiques, dinamiques };
}

function recorreJSX(ast, cb) {
  const visita = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'JSXAttribute' && n.name?.name === 'className' && n.value) {
      cb(n.value, n.loc?.start?.line ?? 0);
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visita);
      else if (v && typeof v === 'object' && v.type) visita(v);
    }
  };
  visita(ast);
}

/* Onada R29 · css-diferit-04 · Les adopcions d'un fitxer. Un import per defecte de
   `…/diferit-<clau>.css?inline` que resol a src/css/diferit-<clau>.css, i una crida
   `useFullDiferit(ref, '<clau>', <eixe import>)` (o adoptaFullDiferit) importada del carregador.
   Torna { adoptades: Set(clau), trencades: [{ linia, token }] }. Una crida amb una clau que no
   és literal o que no casa amb el full importat és trencada: dues crides amb la mateixa clau i un
   CSS distint es reescriurien l'una a l'altra (actualitza() de fullDiferit.js). */
function adopcionsDe(ast, fitxer) {
  const dirFitxer = path.posix.dirname(fitxer);
  const resol = (font) => path.posix.normalize(path.posix.join(dirFitxer, font));
  const fulls = new Map();      // nom local → clau
  const funcions = new Set();   // noms locals de useFullDiferit / adoptaFullDiferit
  for (const n of ast.program?.body ?? []) {
    if (n.type !== 'ImportDeclaration' || typeof n.source?.value !== 'string') continue;
    const font = n.source.value;
    const inline = /^(\.{1,2}\/.*)\?inline$/.exec(font);
    if (inline) {
      const m = FULL_DIFERIT.exec(path.posix.basename(inline[1]));
      if (m && resol(inline[1]) === `${DIR_DIFERITS}/${m[0]}`) {
        for (const s of n.specifiers) if (s.type === 'ImportDefaultSpecifier') fulls.set(s.local.name, m[1]);
      }
    } else if (font.startsWith('.') && resol(font.replace(/\.js$/, '') + '.js') === CARREGADOR_DIFERIT) {
      for (const s of n.specifiers) {
        if (s.type === 'ImportSpecifier' && FUNCIONS_ADOPCIO.has(s.imported?.name)) funcions.add(s.local.name);
      }
    }
  }

  const adoptades = new Set();
  const trencades = [];
  const visita = (n) => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'CallExpression' && n.callee?.type === 'Identifier' && funcions.has(n.callee.name)) {
      const [, clau, css] = n.arguments;
      const literal = clau?.type === 'StringLiteral' ? clau.value : null;
      const delFull = css?.type === 'Identifier' ? fulls.get(css.name) ?? null : null;
      if (literal && delFull && literal === delFull) adoptades.add(literal);
      else trencades.push({ linia: n.loc?.start?.line ?? 0, token: `clau:${literal ?? '?'}≠full:${delFull ?? '?'}` });
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visita);
      else if (v && typeof v === 'object' && v.type) visita(v);
    }
  };
  visita(ast.program);
  return { adoptades, trencades };
}

/* ─────────────────────────── Escaneig ─────────────────────────── */

export function escaneja({ arrel = process.cwd() } = {}) {
  const { vocab, buides, nomesDiferides, diferits, arrencada } = llegirVocabulari(arrel);
  const infraccions = [];
  const adoptants = new Map(diferits.map(({ clau }) => [clau, 0]));

  // V3 — cap CSS sota l'abast
  for (const dir of ABAST) {
    for (const f of arbre(arrel, dir, ['.css'])) {
      infraccions.push({
        regla: 'css-de-seccio', fitxer: f, linia: 1, token: f,
        missatge: `Full de secció prohibit. L'única porta al Shadow DOM és ${FULL_ARRENCADA} (amb els seus @import) i els fulls diferits de ${DIR_DIFERITS}.`
      });
    }
  }

  // V1, V2 i V4 — classes al JSX
  for (const dir of ABAST) {
    for (const f of arbre(arrel, dir, ['.jsx', '.js'])) {
      if (/\.(?:test|spec)\.[jt]sx?$/.test(f)) continue;
      const codi = readFileSync(join(arrel, f), 'utf8');
      let ast;
      try {
        ast = parse(codi, { sourceType: 'module', plugins: ['jsx'], errorRecovery: true });
        if (ast.errors && ast.errors.length > 0) {
          infraccions.push({
            regla: 'classe-forastera', fitxer: f, linia: ast.errors[0].loc?.line || 1, token: '<parse-error>',
            missatge: `Errors sintàctics detectats durant el parseig (${ast.errors[0].message}).`
          });
          continue;
        }
      } catch (e) {
        infraccions.push({
          regla: 'classe-forastera', fitxer: f, linia: 1, token: '<parse-error>',
          missatge: `No s'ha pogut analitzar: ${e.message}`
        });
        continue;
      }

      const rel = posix(f);
      const { adoptades, trencades } = adopcionsDe(ast, rel);
      for (const clau of adoptades) if (adoptants.has(clau)) adoptants.set(clau, adoptants.get(clau) + 1);
      for (const { linia, token } of trencades) {
        infraccions.push({
          regla: 'full-diferit-trencat', fitxer: f, linia, token,
          missatge: `La clau de l'adopció no casa amb el full diferit ?inline importat (${token}). Cada crida porta la clau literal del seu full.`
        });
      }
      const hereta = (clau) => (HERENCIA_DIFERIDA[clau] ?? []).some((prefix) => rel.startsWith(prefix));

      recorreJSX(ast, (valor, linia) => {
        const { estatiques, dinamiques } = classesDe(valor);
        for (const t of new Set(estatiques)) {
          if (!vocab.has(t)) {
            infraccions.push({
              regla: 'classe-forastera', fitxer: f, linia, token: t,
              missatge: `Classe «${t}» no declarada ${ON_ES_DECLARA}.`
            });
          } else if (nomesDiferides.has(t)) {
            const claus = [...nomesDiferides.get(t)];
            if (!claus.some((clau) => adoptades.has(clau) || hereta(clau))) {
              infraccions.push({
                regla: 'classe-diferida-orfe', fitxer: f, linia, token: t,
                missatge: `Classe «${t}» només declarada al full diferit ${claus.join(', ')}: el fitxer no l'adopta (useFullDiferit amb eixa clau i el seu ?inline) ni és a HERENCIA_DIFERIDA.`
              });
            }
          }
        }
        for (const d of new Set(dinamiques)) {
          infraccions.push({
            regla: 'classe-opaca', fitxer: f, linia, token: d,
            missatge: `Classe construïda en temps d'execució («${d}»). Usa un mapa explícit.`
          });
        }
      });
    }
  }

  // V5 — cada full diferit: fora de l'arrencada, dins de @layer components i amb algun adoptant
  const aArrencada = new Set(arrencada);
  for (const { clau, full } of diferits) {
    const css = readFileSync(join(arrel, full), 'utf8');
    if (aArrencada.has(full)) {
      infraccions.push({ regla: 'full-diferit-trencat', fitxer: full, linia: 1, token: `${clau}:a-l-arrencada`,
        missatge: `El full diferit «${clau}» entra per la cadena d'@import de ${FULL_ARRENCADA}: o és diferit o és d'arrencada.` });
    }
    if (teReglesForaDeCapa(css)) {
      infraccions.push({ regla: 'full-diferit-trencat', fitxer: full, linia: 1, token: `${clau}:fora-de-capa`,
        missatge: `El full diferit «${clau}» té regles fora de @layer components: adoptat darrere de la cascada, guanyaria les utilitats.` });
    }
    if (!adoptants.get(clau)) {
      infraccions.push({ regla: 'full-diferit-trencat', fitxer: full, linia: 1, token: `${clau}:sense-adoptant`,
        missatge: `Cap fitxer de l'abast no adopta el full diferit «${clau}» (useFullDiferit(ref, '${clau}', <import ?inline>)).` });
    }
  }

  return { infraccions, vocab, buides, nomesDiferides, arrencada, diferits };
}

/* ────────────────────── Ratchet i entrada CLI ────────────────────── */

const identitat = (i) => `${i.regla}|${i.fitxer}|${i.token}`;

function comptaPerRegla(infraccions) {
  const acc = {};
  for (const i of infraccions) {
    acc[i.regla] = acc[i.regla] || { max: 0, identitats: [] };
    acc[i.regla].max += 1;
    acc[i.regla].identitats.push(identitat(i));
  }
  for (const r of Object.values(acc)) r.identitats = [...new Set(r.identitats)].sort();
  return acc;
}

function cli() {
  const args = process.argv.slice(2);
  const BASELINE = args.includes('--baseline');
  const DETALL = args.includes('--detall');
  const FANTASMES = args.includes('--fantasmes');

  /* Onada R29 · La porta falla tancada si l'arrel de la cascada falta o si un dels seus @import no existix. */
  const { absents } = fullsArrencada(ARREL);
  if (absents.length > 0) {
    console.error(`PARAT. No es troben els fulls de la cadena d'arrencada següents: ${absents.join(', ')}. La porta falla tancada.`);
    process.exit(1);
  }

  const { infraccions, vocab, buides } = escaneja({ arrel: ARREL });

  if (FANTASMES) {
    console.log(`Vocabulari: ${vocab.size} classes declarades.`);
    console.log(`Fantasmes (declarades amb cos buit): ${buides.size}`);
    for (const b of [...buides].sort()) console.log(`  .${b} {}`);
    process.exit(0);
  }

  if (DETALL) {
    for (const i of infraccions) {
      console.log(`  ${i.regla.padEnd(18)} ${i.fitxer}:${i.linia}  ${i.missatge}`);
    }
    console.log('');
  }

  const actual = comptaPerRegla(infraccions);
  console.log(`Vocabulari Pedra Seca: ${vocab.size} classes canòniques. ${infraccions.length} infraccions.`);

  if (BASELINE) {
    writeFileSync(DEUTE_PATH, JSON.stringify(actual, null, 2) + '\n', 'utf8');
    console.log('Deute congelat a .vocabulari-deute.json:');
    for (const [r, d] of Object.entries(actual)) console.log(`  ${r.padEnd(20)}: ${d.max}`);
    process.exit(0);
  }

  if (!existsSync(DEUTE_PATH)) {
    console.error('\nPARAT. No hi ha .vocabulari-deute.json.');
    console.error('Executa una vegada: node tooling/gates/tractor-vocabulari.mjs --baseline\n');
    process.exit(1);
  }

  const previ = JSON.parse(readFileSync(DEUTE_PATH, 'utf8'));
  let trencat = false;

  for (const [regla, d] of Object.entries(actual)) {
    const base = previ[regla] || { max: 0, identitats: [] };
    const conegudes = new Set(base.identitats);
    const noves = d.identitats.filter(i => !conegudes.has(i));

    if (LLEIS_DURES.has(regla) && noves.length > 0) {
      console.error(`LLEI DURA · ${regla}: ${noves.length} infraccions NOVES.`);
      for (const i of noves) console.error(`    ${i}`);
      trencat = true;
    } else if (d.max > base.max || noves.length > 0) {
      console.error(`DEUTE PUJA · ${regla}: ${base.max} -> ${d.max}`);
      for (const i of noves) console.error(`    NOVA: ${i}`);
      trencat = true;
    } else if (d.max < base.max) {
      console.log(`  ${regla.padEnd(20)}: ${base.max} -> ${d.max}  (baixa)`);
    }
  }

  if (trencat) {
    console.error(`\nPARAT. Vocabulari trencat. Declara la classe ${ON_ES_DECLARA}, usa una existent o adopta el full diferit on es pinta.`);
    process.exit(1);
  }
  console.log('PASSA. Cap classe forastera nova.');
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  cli();
}
