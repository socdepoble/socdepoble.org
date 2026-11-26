#!/usr/bin/env node
/** FN0 · Anella determinista. No inferència, xarxa, imports de l'app ni execució SQL.
 * PASS significa només que els predicats estàtics declarats no han trobat defectes.
 * INCOMPLET conserva explícitament allò que requerix navegador, proves SQL o build.
 * La porta no accepta rebuts externs ni comptadors aportats com a proves de salut.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { cssAnalitzable, blocsCssFulla } from '../lib/lexic-css.mjs';
/* v1.2.25 · K-FILTRE (CDX-14, CDX-37, C13) · La carpeta de la Wiki ve de CAMINS (la SSOT relativa de l'arrel, la
   mateixa de la qual tractor-rutes deriva el literal prohibit) i la guarda d'entrada és la canònica esMain, que
   tractor-arrel acredita i que resol els àlies del CLI amb el camí real. arrel.mjs no llança mai en importar-se. */
import { CAMINS, esMain } from '../lib/arrel.mjs';

export const RUTA_REGLES = 'tooling/gates/filtre-aprenentatge-node0.regles.json';
export const IDS = Object.freeze(Array.from({ length: 12 }, (_, i) => `FN0-${String(i + 1).padStart(3, '0')}`));
export const PRESSUPOSTOS_MS = Object.freeze({ scan_fred_ms: 8000, cache_sha256_ms: 450 });
export const RUTA_CACHE = 'tooling/gates/filtre-aprenentatge-node0.cache.json';
export const RUTA_BASELINE = 'tooling/gates/filtre-aprenentatge-node0.baseline.json';
export const TOTAL_BASELINE = 234;
const CACHE_SHA256 = '590f2b866812bade44b552ea42308f9c89fc3522c643ffbd519bbac82665d3e5';
const BASELINE_SHA256 = '5b48d8197ff5952db024384af910e0a52ca6e668ab11757abedbc51b33ee4e08';
const hash = text => createHash('sha256').update(text).digest('hex');
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const EXTENSIONS = /\.(?:jsx?|mjs|cjs|css|sql|json|py|sh|md)$/;
const PROVA = /(?:^|\/)(?:__tests__|fixtures|__fixtures__)(?:\/|$)|\.(?:test|spec)\.|\.d\.ts$/;
const ARRELS = ['src', 'tooling', 'scripts', 'supabase/migrations', `${CAMINS.wiki}/01_ser`, `${CAMINS.wiki}/02_saber`, `${CAMINS.wiki}/03_actuar`];
const LIMITS = Object.freeze({
  'FN0-001': 'Les destinacions calculades, sanititzadors i HTML generat requerixen les seues proves funcionals.',
  'FN0-002': 'La jerarquia entre components i les 6–8 negretes útils són criteris editorials; no es deduïxen de l’AST.',
  'FN0-003': 'L’alçària de les bandes i l’eina dins de la primera pantalla requerixen navegador a mòbil i escriptori.',
  'FN0-004': 'Els tokens i patrons CSS no acrediten el gap geomètric després de la cascada.',
  'FN0-005': 'La semàntica d’un avís i la visibilitat real de les marques requerixen render.',
  'FN0-006': 'Un controlador declarat no acredita que l’acció funcione ni la paritat amb un proveïdor remot.',
  'FN0-007': 'La presència d’un adaptador importat no acredita persistència ni quota en un iPad físic.',
  'FN0-008': 'La paritat de mapes literals no acredita qualitat lingüística ni diccionaris compostos dinàmicament.',
  'FN0-009': 'El pes real del nucli, els imports resolts i els cicles requerixen build WP i la porta LLEI_08.',
  'FN0-010': 'La propietat, RLS, índexs FK i preservació LSSI requerixen proves SQL; un nom al cos no és una prova.',
  'FN0-011': 'El codi font no és un registre exhaustiu de les comandes realment executades pels agents.',
  'FN0-012': 'L’absència de clear en títols no acredita la geometria al costat de flotants.'
});

export function validaRegles(regles) {
  if (!regles || regles.schema !== 'sdp.node0.filtre-aprenentatge.v1' || !Array.isArray(regles.regles_preventives)) throw new TypeError('FN0: esquema de regles invàlid');
  const ids = regles.regles_preventives.map(r => r?.id);
  if (ids.length !== 12 || new Set(ids).size !== 12 || IDS.some(id => !ids.includes(id))) throw new TypeError('FN0: calen les 12 regles exactes, sense omissions ni duplicats');
  for (const r of regles.regles_preventives) {
    if (typeof r.criteri_determinista !== 'string' || !r.criteri_determinista.trim() || !Array.isArray(r.ambit) || !r.ambit.length) throw new TypeError(`FN0: contracte incomplet ${r.id}`);
  }
  return regles;
}

/** Components dins de l'arrel física, sense seguir cap symlink, també si és trencat.
 * No és una transacció contra escriptors hostils que substituïsquen directoris alhora.
 */
function rutaRegular(arrel, rel, { tipus = 'fitxer', absent = false } = {}) {
  const parts = rel.split(path.sep);
  if (!rel || path.isAbsolute(rel) || parts.some(p => !p || p === '.' || p === '..')) throw new TypeError('FN0: ruta fora de l’arrel');
  let ple = arrel;
  for (let i = 0; i < parts.length; i++) {
    ple = path.join(ple, parts[i]);
    let stat;
    try { stat = fs.lstatSync(ple); }
    catch (error) { if (absent && error.code === 'ENOENT') return null; throw error; }
    if (stat.isSymbolicLink()) throw new TypeError(`FN0: symlink no certificable: ${rel}`);
    const directori = i < parts.length - 1 || tipus === 'directori';
    if (directori ? !stat.isDirectory() : !stat.isFile() || stat.nlink !== 1) throw new TypeError(`FN0: font no regular: ${rel}`);
  }
  return ple;
}

/** Inventari només de fonts regulars. Mai seguix symlinks, node_modules o arxiu històric. */
function inventariaFonts(arrel) {
  const fitxers = [];
  const visita = rel => {
    const abs = path.join(arrel, rel);
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ['node_modules', '90_arxiu_historic', '90_arxiu_historic_legacy', 'dist', 'coverage'].includes(ent.name)) continue;
      const nom = `${rel}/${ent.name}`;
      if (ent.isSymbolicLink()) throw new TypeError(`FN0: symlink no certificable: ${nom}`);
      if (ent.isDirectory()) visita(nom);
      else if (ent.isFile() && EXTENSIONS.test(ent.name) && !PROVA.test(nom) && ![RUTA_CACHE, RUTA_BASELINE].includes(nom)) fitxers.push(nom);
    }
  };
  for (const rel of ARRELS) if (rutaRegular(arrel, rel, { tipus: 'directori', absent: true })) visita(rel);
  return fitxers.sort();
}

function fontDeBytes(fitxer, bytes) {
  let descodificat;
  return { fitxer, bytes, get text() { return descodificat ??= new TextDecoder('utf-8', { fatal: true }).decode(bytes); } };
}

export function lligFonts(arrel) {
  return inventariaFonts(arrel).map(fitxer => fontDeBytes(fitxer, fs.readFileSync(path.join(arrel, fitxer))));
}

/** Lectura acotada: 32 descriptors com a màxim, ordre determinista i UTF-8 estricte.
 * No usa mtime com a prova de contingut: cada byte es torna a llegir i a hashejar.
 */
export async function lligFontsParalel(arrel) {
  const noms = inventariaFonts(arrel), fonts = [];
  for (let i = 0; i < noms.length; i += 32) {
    const lot = await Promise.all(noms.slice(i, i + 32).map(async fitxer => fontDeBytes(fitxer, await fs.promises.readFile(path.join(arrel, fitxer)))));
    fonts.push(...lot);
  }
  return fonts;
}

const META_AST = new Set(['loc', 'start', 'end', 'extra', 'comments', 'tokens']);
function visitaAST(node, fn, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') fn(node, parent);
  for (const key of Object.keys(node)) {
    if (META_AST.has(key)) continue;
    const value = node[key];
    if (Array.isArray(value)) for (const child of value) visitaAST(child, fn, node);
    else if (value && typeof value === 'object') visitaAST(value, fn, node);
  }
}
const keyOf = node => node?.name ?? node?.value;
const unwrap = node => node?.type === 'CallExpression' && node.callee?.object?.name === 'Object' && node.callee.property?.name === 'freeze' ? unwrap(node.arguments[0]) : node;
const literal = node => {
  node = unwrap(node);
  if (['StringLiteral', 'BooleanLiteral', 'NumericLiteral', 'NullLiteral'].includes(node?.type)) return node.value ?? null;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return undefined;
};
const propietat = (node, nom) => unwrap(node)?.properties?.find(p => p.type === 'ObjectProperty' && keyOf(p.key) === nom)?.value;
const atribut = (el, nom) => {
  const attrs = el.openingElement?.attributes ?? el.attributes ?? [];
  const a = attrs.find(p => p.type === 'JSXAttribute' && p.name.name === nom);
  return a ? a.value === null ? true : a.value.type === 'JSXExpressionContainer' ? literal(a.value.expression) : literal(a.value) : undefined;
};
const teAtribut = (el, nom) => (el.openingElement?.attributes ?? el.attributes ?? []).some(p => p.type === 'JSXAttribute' && p.name.name === nom);
const nomEl = el => el?.openingElement?.name?.name;
const fillsElements = el => el.children?.filter(c => c.type === 'JSXElement') ?? [];
const textEl = el => (el.children ?? []).filter(c => c.type === 'JSXText').map(c => c.value).join(' ').trim();

/** SQL: amaga comentaris (també niats) i cossos dollar-quoted abans d'inspeccionar opcions.
 * Les cometes d'identificadors/cadenes es conserven. Un cos no pot falsificar SET search_path.
 */
export function capcaleresSQL(sql) {
  const statements = [];
  let out = '', inici = 0;
  for (let i = 0; i < sql.length;) {
    if (sql.startsWith('--', i)) {
      const fi = sql.indexOf('\n', i + 2); const end = fi < 0 ? sql.length : fi;
      out += sql.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue;
    }
    if (sql.startsWith('/*', i)) {
      let depth = 1, j = i + 2;
      while (j < sql.length && depth) {
        if (sql.startsWith('/*', j)) { depth++; j += 2; }
        else if (sql.startsWith('*/', j)) { depth--; j += 2; }
        else j++;
      }
      if (depth) throw new TypeError('SQL: comentari sense tancar');
      out += sql.slice(i, j).replace(/[^\n]/g, ' '); i = j; continue;
    }
    if (sql[i] === '$') {
      const tag = /^\$(?:[A-Za-z_][\w]*)?\$/.exec(sql.slice(i))?.[0];
      if (tag) {
        const end = sql.indexOf(tag, i + tag.length);
        if (end < 0) throw new TypeError('SQL: cos dollar-quoted sense tancar');
        const j = end + tag.length; out += sql.slice(i, j).replace(/[^\n]/g, ' '); i = j; continue;
      }
    }
    if (sql[i] === "'" || sql[i] === '"') {
      const q = sql[i]; let j = i + 1, tancat = false;
      while (j < sql.length) {
        if (sql[j] === q) { if (sql[j + 1] === q) j += 2; else { j++; tancat = true; break; } }
        else if (sql[j] === '\\' && q === "'") j += 2;
        else j++;
      }
      if (!tancat) throw new TypeError('SQL: cadena sense tancar');
      out += sql.slice(i, j); i = j; continue;
    }
    out += sql[i];
    if (sql[i] === ';') { statements.push({ text: out, index: inici }); out = ''; inici = i + 1; }
    i++;
  }
  if (out.trim()) statements.push({ text: out, index: inici });
  return statements;
}

export function signaturaMotorDeBytes(codi, lexerCss) {
  // El pin és l'únic camp eliminat. El lexer local també forma part dels detectors.
  return hash(JSON.stringify({ motor: hash(codi.replace(/const CACHE_SHA256 = '[^']*';/, "const CACHE_SHA256 = '';")), lexerCss: hash(lexerCss) }));
}
const SIGNATURA_CARREGADA = signaturaMotorDeBytes(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8'), fs.readFileSync(new URL('../lib/lexic-css.mjs', import.meta.url)));
export function signaturaMotor() { return SIGNATURA_CARREGADA; }

export function contextCache(fonts, regles, lexic) {
  return hash(JSON.stringify({ regles, lexic, backendActiu: fonts.find(f => f.fitxer === 'src/data/backendPort.js')?.text.includes('carregaAccionsMissatges') ?? false, adaptadors: fonts.filter(f => f.fitxer.endsWith('/fontArxiusOpfs.js')).map(f => f.fitxer).sort() }));
}

export function validaBaseline(baseline) {
  if (baseline?.schema !== 'sdp.node0.filtre.baseline.v1' || baseline.total !== TOTAL_BASELINE || !Array.isArray(baseline.troballes) || baseline.troballes.length !== TOTAL_BASELINE
    || baseline.origen?.cacheSha256 !== '649d27e81492c2562b31769e05514d54c57fc36bfaf2757923801a24a44da840') throw new TypeError('FN0: baseline històric incomplet o origen divergent; calen les 234 troballes');
  for (const t of baseline.troballes) if (!IDS.includes(t?.id) || typeof t.fitxer !== 'string' || !t.fitxer || !Number.isSafeInteger(t.linia) || t.linia < 1
    || typeof t.codi !== 'string' || typeof t.detall !== 'string' || !/^[a-f0-9]{64}$/.test(t.ancla_sha256 ?? '') || !/^[a-f0-9]{64}$/.test(t.font_sha256 ?? '')) throw new TypeError('FN0: troballa històrica malformada');
  return baseline;
}

export function carregaBaseline(arrel) {
  const abs = rutaRegular(arrel, RUTA_BASELINE);
  const raw = fs.readFileSync(abs, 'utf8');
  if (hash(raw) !== BASELINE_SHA256) throw new TypeError('FN0: baseline alterat o truncat; cap deute ocultat');
  return validaBaseline(JSON.parse(raw));
}

const identitatTroballa = t => JSON.stringify([t.id, t.fitxer, t.codi, t.detall, t.ancla_sha256]);

/** Multiconjunt: un duplicat nou també és regressió; moure una línia no canvia el constructe. */
export function avaluaRegressions(troballes, baseline) {
  validaBaseline(baseline);
  const pendents = new Map();
  for (const t of baseline.troballes) {
    const key = identitatTroballa(t);
    if (!pendents.has(key)) pendents.set(key, []);
    pendents.get(key).push(t);
  }
  const noves = [], preexistents = [];
  for (const t of troballes) {
    const hist = pendents.get(identitatTroballa(t));
    if (hist?.length) { hist.pop(); preexistents.push(t); } else noves.push(t);
  }
  const resoltes = [...pendents.values()].flat();
  return { totalBaseline: TOTAL_BASELINE, totalActual: troballes.length, preexistents, noves, resoltes, valid: noves.length === 0 };
}

export function avaluaPressupost({ duradaMs, cache, hitsCache, fitxers }) {
  if (!Number.isFinite(duradaMs) || duradaMs < 0 || !Number.isSafeInteger(hitsCache) || !Number.isSafeInteger(fitxers) || hitsCache < 0 || hitsCache > fitxers) throw new TypeError('FN0: mesura de rendiment invàlida');
  const mode = cache === 'VERIFICADA' && fitxers > 0 && hitsCache === fitxers ? 'cache_sha256' : 'scan_fred';
  const clau = `${mode}_ms`, limit = PRESSUPOSTOS_MS[clau];
  return { modeRendiment: mode, duradaMs, pressupostosMs: PRESSUPOSTOS_MS, mesuresMs: { scan_fred_ms: mode === 'scan_fred' ? duradaMs : null, cache_sha256_ms: mode === 'cache_sha256' ? duradaMs : null }, pressupostMs: limit, pressupostComplert: duradaMs <= limit };
}

export function analitzaFonts(fonts, { regles, lexic = [], cache = null, recullCache = null, baseline = null } = {}) {
  validaRegles(regles);
  const troballes = [], avisos = [];
  const registra = (id, font, node, codi, detall) => {
    const index = typeof node === 'number' ? node : node?.index;
    const linia = node?.loc?.start?.line ?? (Number.isInteger(index) ? font.text.slice(0, index).split('\n').length : 1);
    const ancla = node?.ancla ?? (Number.isInteger(node?.start) && Number.isInteger(node?.end) ? font.text.slice(node.start, node.end) : font.text.split('\n')[linia - 1] ?? '').replace(/\r\n/g, '\n').trim();
    troballes.push({ id, fitxer: font.fitxer, linia, codi, detall, ancla_sha256: hash(ancla) });
  };
  const fontPerNom = new Map(fonts.map(f => [f.fitxer, f]));
  const lexicCompilat = lexic.map(r => ({ id: r.id, patro: new RegExp(r.patro, 'giu') }));
  const parsers = { ast: 0, css: 0, sql: 0 };
  let hitsCache = 0;
  for (const font of fonts) {
    const { fitxer } = font;
    const empremta = hash(fitxer === 'tooling/gates/filtre-aprenentatge-node0.mjs' ? font.text.replace(/const CACHE_SHA256 = '[^']*';/, "const CACHE_SHA256 = '';") : font.bytes ?? font.text);
    const entradaCache = cache?.[fitxer];
    if (entradaCache?.sha256 === empremta) {
      troballes.push(...entradaCache.troballes); avisos.push(...entradaCache.avisos); hitsCache++;
      if (recullCache) recullCache[fitxer] = entradaCache;
      continue;
    }
    const text = font.text;
    const t0 = troballes.length, a0 = avisos.length;
    const guardaCache = () => { if (recullCache) recullCache[fitxer] = { sha256: empremta, troballes: troballes.slice(t0), avisos: avisos.slice(a0) }; };
    if (fitxer.endsWith('.css')) {
      parsers.css++;
      try {
        for (const bloc of blocsCssFulla(cssAnalitzable(text))) {
          const origen = { index: bloc.index, ancla: `${bloc.selector.trim()}{${bloc.body.trim()}}`.replace(/\s+/g, ' ') };
          if (/(?:^|[^\w-])h[1-6](?![\w-])/.test(bloc.selector) && /(?:^|;)\s*clear\s*:\s*(?:both|left|right)\b/i.test(bloc.body)) registra('FN0-012', font, origen, 'TITOL_CLEAR', 'clear desplaça el títol davall de la flotant');
          if (/(?:^|[^\w-])h3(?![\w-])/.test(bloc.selector) && /(?:^|;)\s*margin(?:-top|-block-start)?\s*:\s*0(?:px|rem|em)?(?:\s*[;!]|\s*$)/i.test(bloc.body)) registra('FN0-004', font, origen, 'H3_MARGE_ZERO', 'Regla amb separació inicial zero; comprovar el context i la cascada');
        }
      } catch (error) { registra('FN0-012', font, null, 'CSS_NO_ANALITZABLE', error.message); }
      guardaCache(); continue;
    }
    if (fitxer.endsWith('.sql')) {
      parsers.sql++;
      try {
        for (const s of capcaleresSQL(text)) {
          if (/\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/i.test(s.text) && /\bSECURITY\s+DEFINER\b/i.test(s.text) && !/\bSET\s+(?:"search_path"|search_path)\s*(?:=|TO)\s*''\s*(?:;|LANGUAGE\b|AS\b|SECURITY\b|STABLE\b|VOLATILE\b|IMMUTABLE\b|PARALLEL\b|COST\b|ROWS\b|SET\b|$)/i.test(s.text)) registra('FN0-010', font, { index: s.index, ancla: s.text.replace(/\s+/g, ' ').trim() }, 'DEFINER_SEARCH_PATH', 'SECURITY DEFINER sense SET search_path buit explícit a les opcions');
        }
      } catch (error) { registra('FN0-010', font, null, 'SQL_NO_ANALITZABLE', error.message); }
      guardaCache(); continue;
    }
    if (fitxer.startsWith(`${CAMINS.wiki}/`) || fitxer.startsWith('src/')) {
      for (const r of lexicCompilat) {
        r.patro.lastIndex = 0;
        const m = r.patro.exec(text);
        if (m) registra('FN0-008', font, m.index, r.id, 'Lèxic prohibit pel mapa editorial canònic');
      }
    }
    if (!/\.(?:jsx?|mjs|cjs)$/.test(fitxer)) { guardaCache(); continue; }
    // Prefiltre només evita AST quan no hi ha cap constructe que els predicats inspeccionen.
    if (!/(?:<a\b|<h[2-6]\b|<button\b|<Navigate\b|<PortaAvis\b|showLogos|showDirectoryPicker|showOpenFilePicker|showSaveFilePicker|interruptors|VISTES_EN_CONSTRUCCIO|MODULS_GESTORIA|aria-label|placeholder|\btitle\s*=|TEXTOS_|\bi18n|\bca\s*:|exec(?:File)?(?:Sync)?\s*\(|spawn(?:Sync)?\s*\(|\bstream\s*:|\bnum_ctx\s*:)/.test(text)) { guardaCache(); continue; }
    let ast;
    try { ast = parse(text, { sourceType: 'unambiguous', plugins: ['jsx'], attachComment: false }); parsers.ast++; }
    catch (error) { registra('FN0-008', font, { loc: { start: { line: error.loc?.line ?? 1 } } }, 'JS_NO_ANALITZABLE', 'Font JS/JSX no analitzable; no es pot certificar'); guardaCache(); continue; }
    const imports = new Set(ast.program.body.filter(n => n.type === 'ImportDeclaration').map(n => n.source.value));
    let inputFitxer = false, magatzemLocal = false;
    const pickerCalls = [];
    visitaAST(ast, node => {
      if (node.type === 'JSXElement' && nomEl(node) === 'input' && atribut(node, 'type') === 'file') inputFitxer = true;
      if (node.type === 'AssignmentExpression' && node.left?.type === 'MemberExpression' && node.left.property?.name === 'type' && literal(node.right) === 'file') inputFitxer = true;
      if (node.type === 'CallExpression' && (node.callee?.property?.name === 'getDirectory' || node.callee?.object?.name === 'indexedDB' && node.callee.property?.name === 'open')) magatzemLocal = true;
      if (node.type === 'ImportDeclaration') imports.add(node.source.value);
      if (node.type === 'JSXElement') {
        const nom = nomEl(node);
        if (nom === 'a') {
          const href = atribut(node, 'href'), target = atribut(node, 'target'), rel = atribut(node, 'rel');
          const attrs = node.openingElement.attributes;
          const iTarget = attrs.findIndex(a => a.type === 'JSXAttribute' && a.name.name === 'target');
          const iRel = attrs.findIndex(a => a.type === 'JSXAttribute' && a.name.name === 'rel');
          const teSpread = attrs.some((a, i) => a.type === 'JSXSpreadAttribute' && (i > iTarget || i > iRel));
          const exempt = typeof href === 'string' && /^(?:\/(?!\/)|#|\?|mailto:|tel:)/i.test(href);
          if (!exempt && !teAtribut(node, 'download') && (target !== '_blank' || typeof rel !== 'string' || !['noopener', 'noreferrer'].every(t => rel.split(/\s+/).includes(t)) || teSpread)) registra('FN0-001', font, node, 'ENLLAC_NO_PROTEGIT', 'Destinació externa o calculada sense target/rel literals protegits (o amb spread que els pot substituir)');
        }
        if (/^h[2-6]$/.test(nom)) {
          if (nom === 'h3' && typeof atribut(node, 'className') === 'string' && atribut(node, 'className').split(/\s+/).includes('h2')) registra('FN0-002', font, node, 'H3_FALS_H2', 'h3 amb classe h2');
          const words = textEl(node).split(/\s+/).filter(Boolean);
          if (['h3', 'h4'].includes(nom) && words.length > 3 && textEl(node) === textEl(node).toLocaleUpperCase('ca') && /\p{Ll}/u.test(textEl(node).toLocaleLowerCase('ca'))) registra('FN0-002', font, node, 'TITOL_MAJUSCULES', 'Encapçalament llarg en majúscules');
        }
        const fills = fillsElements(node);
        let ultimNivell = null;
        for (let i = 0; i < fills.length; i++) {
          const n = nomEl(fills[i]);
          if (/^h[2-6]$/.test(n)) {
            const nivell = Number(n[1]);
            if (ultimNivell !== null && nivell > ultimNivell + 1) registra('FN0-002', font, fills[i], 'SALT_ENCAPCALAMENT', 'Salt de nivell entre encapçalaments germans');
            ultimNivell = nivell;
            if (n === 'h2' && !(typeof atribut(fills[i + 1] ?? {}, 'className') === 'string' && atribut(fills[i + 1], 'className').split(/\s+/).includes('lead') && nomEl(fills[i + 2]) === 'h3')) registra('FN0-002', font, fills[i], 'H2_SENSE_ENTRADETA', 'h2 sense germans immediats .lead i h3');
          }
        }
        if (fitxer.startsWith('src/apps/') && nom === 'Navigate') {
          const to = node.openingElement.attributes.find(a => a.type === 'JSXAttribute' && a.name.name === 'to')?.value?.expression;
          const rutaAvis = to?.type === 'CallExpression' && to.callee?.name === 'ruta' && literal(to.arguments[0]) === 'avis';
          if (rutaAvis || typeof atribut(node, 'to') === 'string' && /(?:^|\/)avis(?:[?#]|$)/.test(atribut(node, 'to'))) registra('FN0-003', font, node, 'REDIRECCIO_AVIS', 'Redirecció de l’app cap a una pantalla d’avís; revisar entrada contextual');
        }
        if (['MurSection', 'MercatSection', 'PoblesSection', 'CalendariSection'].some(x => fitxer.includes(x)) && atribut(node, 'showLogos') === false) registra('FN0-005', font, node, 'LOGOS_APAGATS', 'Secció troncal amb showLogos false');
        const classes = atribut(node, 'className');
        if (!/(?:Alerta|estats)\.jsx$/.test(fitxer) && typeof classes === 'string' && /(?:avis|buit|construccio|error)/i.test(classes) && fills.some(c => /^h[2-4]$/.test(nomEl(c))) && fills.some(c => nomEl(c) === 'p')) registra('FN0-005', font, node, 'AVIS_HTML_CRU', 'Contenidor d’avís o buit amb encapçalament i paràgraf manuals');
        if (nom === 'button' && !teAtribut(node, 'disabled') && !['onClick', 'onPointerDown', 'onMouseDown', 'onKeyDown'].some(n => teAtribut(node, n)) && atribut(node, 'type') !== 'submit' && !node.openingElement.attributes.some(a => a.type === 'JSXSpreadAttribute')) avisos.push({ id: 'FN0-006', fitxer, linia: node.loc.start.line, codi: 'BOTO_SENSE_CONTROLADOR_LOCAL', detall: 'Pot usar delegació o un formulari; verificar consumidor, no es declara inert per absència d’onClick' });
        for (const a of ['aria-label', 'title', 'placeholder']) if (typeof atribut(node, a) === 'string' && /\p{L}/u.test(atribut(node, a))) registra('FN0-008', font, node, 'ATRIBUT_MONOLINGUE', `Atribut literal ${a} pendent de diccionari de cinc llengües`);
      }
      if (/\/manifest\.js$/.test(fitxer) && node.type === 'ObjectProperty' && keyOf(node.key) === 'interruptors') {
        const values = unwrap(node.value)?.elements;
        if (!values) registra('FN0-006', font, node, 'INTERRUPTORS_DINAMICS', 'No es pot validar estàticament el manifest');
        else for (const interruptor of values) if (typeof literal(propietat(interruptor, 'actiuPerDefecte')) !== 'boolean') registra('FN0-006', font, interruptor ?? node, 'INTERRUPTOR_SENSE_DEFAULT', 'Cada interruptor requerix actiuPerDefecte booleà explícit');
      }
      if (node.type === 'VariableDeclarator' && node.id?.name === 'VISTES_EN_CONSTRUCCIO' && propietat(node.init, 'destacats') && fontPerNom.get('src/data/backendPort.js')?.text.includes('carregaAccionsMissatges')) registra('FN0-006', font, node, 'DESTACATS_TANCATS', 'Destacats continua en construcció amb el port d’accions declarat');
      if (node.type === 'ObjectExpression') {
        const keys = node.properties.filter(p => p.type === 'ObjectProperty').map(p => keyOf(p.key));
        if (keys.includes('ca') && keys.some(k => LLENGUES.includes(k) && k !== 'ca')) {
          if (!LLENGUES.every(k => keys.includes(k))) registra('FN0-008', font, node, 'LLENGUA_ABSENT', `Mapa multilingüe sense ${LLENGUES.filter(k => !keys.includes(k)).join(', ')}`);
          else {
            const conjunts = LLENGUES.map(l => unwrap(propietat(node, l))).map(n => n?.type === 'ObjectExpression' ? n.properties.filter(p => p.type === 'ObjectProperty').map(p => keyOf(p.key)).sort().join('\0') : null);
            if (conjunts.every(c => c !== null) && new Set(conjunts).size > 1) registra('FN0-008', font, node, 'CLAUS_ASIMETRIQUES', 'Els mapes literals de les cinc llengües tenen claus diferents');
          }
        }
        if (text.includes('/api/generate') || text.includes('/api/chat')) {
          if (propietat(node, 'stream') && literal(propietat(node, 'stream')) !== true) registra('FN0-011', font, node, 'OLLAMA_NO_STREAM', 'Crida Ollama sense stream true literal');
          if (propietat(node, 'num_ctx') && literal(propietat(node, 'num_ctx')) !== 4096) registra('FN0-011', font, node, 'OLLAMA_CONTEXT', 'Crida Ollama sense num_ctx 4096 literal');
        }
      }
      if (node.type === 'CallExpression') {
        const name = node.callee?.name ?? node.callee?.property?.name;
        if (/^(?:showDirectoryPicker|showOpenFilePicker|showSaveFilePicker)$/.test(name)) {
          pickerCalls.push(node);
        }
        if (/^(?:exec|execSync|execFile|execFileSync|spawn|spawnSync)$/.test(name)) {
          const cmd = literal(node.arguments[0]);
          const args = node.arguments[1]?.type === 'ArrayExpression' ? node.arguments[1].elements.map(literal) : [];
          const inline = typeof cmd === 'string' && (/\b(?:node|python3?|(?:ba|z)?sh)\s+-(?:[a-z]*[ecp])(?:\s|$)/.test(cmd) || /(?:^|\/)(?:node|python3?|(?:ba|z)?sh)$/.test(cmd) && args.some(a => typeof a === 'string' && /^-[a-z]*[ecp]$/.test(a)));
          if (inline) registra('FN0-011', font, node, 'INTERPRET_INLINE', 'Intèrpret inline en una crida de procés');
        }
      }
    });
    // Les capacitats s'han recollit en la mateixa passada. L'ordre del codi
    // no decidix si el fallback existeix; no cal un segon recorregut de cada AST.
    const fallback = [...imports].some(ref => ref.includes('fontArxiusOpfs') && fontPerNom.has(path.posix.normalize(path.posix.join(path.posix.dirname(fitxer), ref))));
    if (!fallback && !(inputFitxer && magatzemLocal)) for (const node of pickerCalls) {
      const name = node.callee?.name ?? node.callee?.property?.name;
      registra('FN0-007', font, node, 'PICKER_SENSE_ADAPTADOR', `${name} sense import resolt de fontArxiusOpfs ni input+magatzem local; retindre certificació Safari`);
    }
    guardaCache();
  }
  // FN0-009 no té un substitut textual fiable de la compilació ni del graf resolt.
  // El seu estat queda INCOMPLET si no hi ha un defecte material observat.
  for (const font of fonts) if (/^dist-(?:wp|standalone)\/soc-de-poble\.standalone\.js$/.test(font.fitxer) && Buffer.byteLength(font.text) >= 1_589_500) registra('FN0-009', font, null, 'NUCLI_SOBRE_SOSTRE', 'El carregador ja supera tot sol el sostre del nucli WP');
  const resultats = IDS.map(id => ({ id, estat: troballes.some(t => t.id === id) ? 'FAIL' : id === 'FN0-009' ? 'INCOMPLET' : 'PASS', abast: 'predicats_estatics', limit: LIMITS[id], errors: troballes.filter(t => t.id === id).length }));
  const regressions = baseline ? avaluaRegressions(troballes, baseline) : null;
  return { schema: 'sdp.node0.filtre.resultat.v1', senseIA: true, xarxa: false, remoteVerified: false, certificaProduccio: false,
    resultats, troballes, avisos, parsers, hitsCache, fitxers: fonts.length,
    baseline: baseline ? { ...baseline, sha256: BASELINE_SHA256 } : { estat: 'ABSENT', total: TOTAL_BASELINE }, regressions,
    validRegressions: regressions?.valid === true, complet: false, estatComplet: 'INCOMPLET',
    pendent: Object.entries(LIMITS).map(([id, detall]) => ({ id, detall })), validEstatics: troballes.length === 0, valid: false };
}

export async function executaFiltre({ arrel = process.cwd(), reglesPath = null } = {}) {
  const inici = performance.now();
  const root = fs.realpathSync(arrel);
  const baseline = carregaBaseline(root);
  const reglesRel = reglesPath ? path.relative(root, path.resolve(reglesPath)) : RUTA_REGLES;
  const regles = validaRegles(JSON.parse(fs.readFileSync(rutaRegular(root, reglesRel), 'utf8')));
  const mapa = rutaRegular(root, '.agents/coherencia-editorial-mapa.json');
  const lexic = JSON.parse(fs.readFileSync(mapa, 'utf8')).lexicProhibit;
  if (!Array.isArray(lexic) || !lexic.length) throw new TypeError('FN0: lèxic canònic absent o buit');
  const fonts = await lligFontsParalel(root);
  for (const rel of ['dist-wp/soc-de-poble.standalone.js', 'dist-standalone/soc-de-poble.standalone.js']) {
    const abs = rutaRegular(root, rel, { absent: true });
    if (abs) {
      fonts.push({ fitxer: rel, text: new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(abs)) });
    }
  }
  const cachePath = rutaRegular(root, RUTA_CACHE, { absent: true });
  let cache = null, estatCache = 'ABSENT';
  if (cachePath) {
    const raw = fs.readFileSync(cachePath, 'utf8');
    if (hash(raw) !== CACHE_SHA256) throw new TypeError('FN0: cache alterada o sense pin; cap resultat reutilitzat');
    const dada = JSON.parse(raw);
    if (dada.schema !== 'sdp.node0.filtre.cache.v1') throw new TypeError('FN0: esquema de cache invàlid');
    if (dada.motor === signaturaMotor() && dada.context === contextCache(fonts, regles, lexic)) { cache = dada.fitxers; estatCache = 'VERIFICADA'; }
    else estatCache = 'INVALIDADA';
  }
  const resultat = analitzaFonts(fonts, { regles, lexic, cache, baseline });
  resultat.cache = estatCache;
  Object.assign(resultat, avaluaPressupost({ duradaMs: performance.now() - inici, cache: estatCache, hitsCache: resultat.hitsCache, fitxers: resultat.fitxers }));
  return resultat;
}

export async function main(argv = process.argv.slice(2), { out = console.log, err = console.error } = {}) {
  try {
    let arrel = process.cwd(), reglesPath = null, json = false;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--sense-ia') continue;
      if (arg === '--json') json = true;
      else if (arg === '--arrel' || arg === '--regles') {
        if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new TypeError(`Falta valor de ${arg}`);
        if (arg === '--arrel') arrel = path.resolve(argv[++i]); else reglesPath = path.resolve(argv[++i]);
      } else if (arg === '--help') { out('Ús: node tooling/gates/filtre-aprenentatge-node0.mjs --sense-ia [--arrel RUTA] [--regles JSON] [--json]\nEixida 0: zero regressions noves i pressupost del mode; 1: regressió o pressupost; 2: entrada invàlida. No certifica salut global ni Producció.'); return 0; }
      else throw new TypeError(`Opció desconeguda: ${arg}`);
    }
    const r = await executaFiltre({ arrel, reglesPath });
    if (json) out(JSON.stringify(r, null, 2));
    else {
      for (const fila of r.resultats) out(`${fila.estat} ${fila.id} · ${fila.errors} defectes estàtics`);
      for (const t of r.troballes) out(`${t.id} ${t.fitxer}:${t.linia} ${t.codi} · ${t.detall}`);
      out(`${r.validRegressions ? 'PASS' : 'FAIL'} regressions · baseline ${r.baseline.total} · actuals ${r.troballes.length} · noves ${r.regressions.noves.length} · resoltes ${r.regressions.resoltes.length}`);
      out(`${r.pressupostComplert ? 'PASS' : 'FAIL'} ${r.modeRendiment} · ${r.duradaMs} ms / <= ${r.pressupostMs} ms · ${r.fitxers} fonts · pressupostos fred<=8000 / cache<=450 ms`);
      out('INCOMPLET global · completar les portes SQL, build WP, LLEI_08, navegador i dispositiu; l’anella estàtica no les substituïx.');
    }
    return r.validRegressions && r.pressupostComplert ? 0 : 1;
  } catch (error) { err(`FN0 ERROR: ${error.message}`); return 2; }
}

if (esMain(import.meta.url)) process.exitCode = await main();

// Ruta del mòdul exportada perquè el consumidor de proves no depenga del cwd.
export const ARREL_MODUL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
