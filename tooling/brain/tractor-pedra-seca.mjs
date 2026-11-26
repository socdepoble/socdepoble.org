#!/usr/bin/env node
/**
 * tractor-pedra-seca.mjs — porta mecànica del Sistema de Disseny Pedra Seca.
 * ---------------------------------------------------------------------------
 * Zero dependències. Només builtins de Node. ESM.
 *
 * PRINCIPI: una norma sense `exit 1` és una preferència.
 *
 * Este tractor no demana perfecció el primer dia: usa un CRIQUET (ratchet).
 * `--baseline` escriu el deute actual a '.agents/deute/.pedra-seca-deute.json'.
 * Les execucions posteriors fallen si el deute PUJA. El deute només pot baixar.
 * Les lleis marcades DURA no admeten deute: fallen sempre que es violen.
 *
 * Ús:
 *   node tooling/tractor-pedra-seca.mjs              # verifica (exit 1 si falla)
 *   node tooling/tractor-pedra-seca.mjs --baseline   # congela el deute actual
 *   node tooling/tractor-pedra-seca.mjs --detall     # llista cada infracció
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, extname } from 'node:path';
import { cromStyleOffsets } from '../lib/design-contracts.mjs';
import { analitzaJsx, codiSenseComentaris, jsxClassValues, propietatsFixades, prosaIComparacions } from '../lib/jsx-class-values.mjs';
import { blocsCssFulla } from '../lib/lexic-css.mjs';

/* ─────────────────────────── Configuració ─────────────────────────── */

const ARREL = process.cwd();
const DEUTE_PATH = join(ARREL, '.agents/deute/.pedra-seca-deute.json');
const DETALL = process.argv.includes('--detall');
const BASELINE = process.argv.includes('--baseline');

/** L'ÚNICA porta al Shadow DOM. Si un full no entra per ací, no existix. */
const FULL_OMBRA = 'src/css/index.css';

/** Entrades reals del graf de mòduls: el lloc (index.html), el paquet enxufable
 *  (vite.standalone.config.js, lib.entry), l'app nativa (vite.natiu.config.js,
 *  ENTRADA_NATIVA) i la Consola. P1-08 (pla 261028_1526) · Fora src/wp-standalone.js,
 *  que ja no existix i el graf descartava sense dir res. No s'importen els configs:
 *  porten vite. La paritat la fixa tests/pedra-debt.test.mjs. */
const ENTRADES = ['src/main.jsx', 'src/embed.jsx', 'src/natiu/entrada.jsx', 'tooling/brain/mapa-consola.mjs'];

/** Pedra Seca, part C (proposta 261031) · Els configs de Vite també són arrels
 *  del graf, però només per a la LLEI 8: el codi de src/ que importen s'executa
 *  en construir (la política de mitjans del paquet, les guardes del cos d'un
 *  mòdul), no és codi mort. Es lligen com a text, igual que la resta del graf:
 *  no s'importen (porten vite). No són UI: no fixen tokens (L02) ni fan
 *  auditable cap prova (L06). La paritat la fixa tests/pedra-debt.test.mjs. */
const ENTRADES_DE_BUILD = ['vite.config.js', 'vite.modul.config.js', 'vite.natiu.config.js', 'vite.standalone.config.js'];

/** R30-LLEI08-LLEI01 · Els scripts que els serveis systemd del Node 0 executen
 *  (ExecStart de nix/node0.nix: la porta de l'esquema i el servidor) també són
 *  arrels de la LLEI 8: el codi de src/ que importen (pontMastodon.js) corre al
 *  servidor, no és codi mort. Com els configs de Vite, només compten per a la
 *  LLEI 8 i es lligen com a text. La paritat la fixa tests/pedra-debt.test.mjs. */
const ENTRADES_DE_SERVIDOR = ['nix/bootstrap-node0.mjs', 'nix/start-node0.mjs'];

/** Fitxers autoritzats a tocar el document amfitrió. */
const PERMIS_DOCUMENT = ['src/PedraSecaEmbed.jsx', 'src/config/theme.js',
  // Propietari únic SEO: registerSeo exigix manageDocumentHead i rebutja embed/iframe.
  'src/hooks/seoHead.js',
  /* Decisió del Mestre (31-10-2026, part C) · Entrades amos del document
     (manageDocumentHead: true): munten el full d'estils a <head>. */
  'src/main.jsx', 'src/natiu/entrada.jsx',
  /* Decisió del Mestre (31-10-2026, part C) · El visor d'imatges és un
     createPortal al <body> de la SPA, com PageFrame.jsx. */
  'src/sections/detail/VisorDePublicacio.jsx',
  /* Decisió del Mestre (31-10-2026, part C) · Còpia d'impressió penjada del
     <body> i classe a <html> mentre la vista és oberta (modules.css, @media print). */
  'src/sections/gestoria/facturar/ImpressioFactura.jsx'];

/** Permisos acotats: el fitxer continua auditat i només se li perdonen tants
 *  accessos de cada tipus com diu la quota; el que sobra es registra.
 *  D-R30-LLEI06 (proposta 261118, pendent de la signatura del Mestre) · PageFrame
 *  és la porta única del <body> de la SPA: destiDeLIndex (l'Índex i capaDeDalt)
 *  hi penja la capa; encastat va a .sdp-root, mai al body de l'amfitrió. Un sol
 *  document.body; cap head ni documentElement. */
const PERMIS_DOCUMENT_ACOTAT = {
  'src/components/universal/PageFrame.jsx': { body: 1 }
};

/** Selectors de control sotmesos a la Llei de Vida. */
const CONTROLS = [
  'button', '.btn', '.nav-item', '.sp-card-action', '.page-btn',
  '.download-card-btn', '.audio-play-btn', '.file-item-action',
  '.sp-card-connect', '.sdp-top-bar-btn', 'summary.accordion-header'
];

const IDIOMES = ['ca', 'es', 'en', 'eu', 'gl'];

/* ──────────────────────────── Utilitats ───────────────────────────── */

const llig = (p) => { try { return readFileSync(join(ARREL, p), 'utf8'); } catch { return null; } };
const senseComentaris = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

function arbre(dir, ext, acc = []) {
  const abs = join(ARREL, dir);
  if (!existsSync(abs)) return acc;
  for (const nom of readdirSync(abs)) {
    if (nom === 'node_modules' || (nom.startsWith('.') && nom !== '.agents')) continue;
    const rel = join(dir, nom);
    if (statSync(join(ARREL, rel)).isDirectory()) arbre(rel, ext, acc);
    else if (ext.includes(extname(nom))) acc.push(rel);
  }
  return acc;
}

/** Talla un objecte/bloc equilibrant claus a partir d'una posició. */
function bloc(text, inici, obrir = '{', tancar = '}') {
  let prof = 0;
  for (let i = inici; i < text.length; i++) {
    if (text[i] === obrir) prof++;
    else if (text[i] === tancar) { prof--; if (prof === 0) return text.slice(inici, i + 1); }
  }
  return text.slice(inici);
}

function liniaDe(text, index) {
  return text.slice(0, index).split('\n').length;
}

/** Decisió del Mestre (30-10-2026), deute CSS «la part segura ara» · Una sola
 *  anàlisi per font de src: el text, el codi sense comentaris (L01 i L06: una
 *  classe o un document.body nomenats en un comentari no són codi), les classes
 *  de les expressions JSX i les propietats --x que la font fixa (L02). */
const FONTS = new Map();
function font(f) {
  if (!FONTS.has(f)) {
    const brut = llig(f);
    if (brut === null) FONTS.set(f, null);
    else {
      const ast = analitzaJsx(brut);
      const net = codiSenseComentaris(brut, ast);
      FONTS.set(f, { brut, net, classes: jsxClassValues(brut, ast), propietats: propietatsFixades(brut, ast),
        ...prosaIComparacions(brut, ast), estilsPropis: classesDelsEstilsPropis(net) });
    }
  }
  return FONTS.get(f);
}

/** Pedra Seca, part C (proposta 261031) · Les classes que defineix el full
 *  <style> d'un document autònom escrit dins de la mateixa font (el paper
 *  A4 de DocumentPrintPreview.jsx, un iframe amb CSP pròpia on el full de
 *  l'app no arriba). Hi tenen regla, però només per a eixa font. Les
 *  interpolacions ${…} del full no són claus de CSS. */
function classesDelsEstilsPropis(net) {
  const classes = new Set();
  for (const m of net.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const full = m[1].replace(/\$\{[^}]*\}/g, '0');
    for (const r of blocsCssFulla(full))
      r.selector.match(/\.(-?[_a-zA-Z][\w-]*)/g)?.forEach((c) => classes.add(c.slice(1)));
  }
  return classes;
}

/* ──────────────── Extracció: classes escrites al JSX ──────────────── */

function classesEscrites(fitxers) {
  const mapa = new Map(); // classe -> [ "fitxer:línia" ]
  for (const f of fitxers) {
    const fo = font(f);
    if (fo === null) continue;
    const { brut: t, net, prosa } = fo;
    const afig = (c, idx, htmlDelPaper = false) => {
      if (!c || c.includes('$') || c.includes('{')) return;
      // R30-LLEI08-LLEI01 · Un operador d'una expressió tallada («?», «:») no és cap classe.
      if (!/^-?[_a-zA-Z][\w-]*$/.test(c)) return;
      // Part C · El full <style> propi d'un document autònom d'esta font dona regla a
      // l'HTML d'eixe document (class="…"), mai al className del JSX de la mateixa font.
      if (htmlDelPaper && fo.estilsPropis.has(c)) return;
      if (!mapa.has(c)) mapa.set(c, []);
      mapa.get(c).push(`${f}:${liniaDe(t, idx)}`);
    };
    // Part C · Una frase de la pantalla («la maqueta de <div class='tab'>») no és cap classe.
    const esProsa = (idx) => prosa.some(([a, b]) => idx >= a && idx < b);
    // className="..."  |  class="..."  |  className: '...'
    for (const m of net.matchAll(/(className|class)\s*[=:]\s*["']([^"']*)["']/g))
      if (!esProsa(m.index)) m[2].split(/\s+/).forEach((c) => afig(c, m.index, m[1] === 'class'));
    // className={`... ${x} ...`}
    for (const m of net.matchAll(/(?:className|class)\s*=\s*\{\s*`([^`]*)`/g))
      if (!esProsa(m.index)) m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach((c) => afig(c, m.index));
    // Només valors de les expressions: una comparació amb 'intens' no és una classe.
    for (const { value, index } of fo.classes)
      value.split(/\s+/).forEach(c => afig(c, index));
  }
  return mapa;
}

/* ──────────────── Extracció: selectors i tokens del CSS ───────────── */

function analitzaCss(rutes) {
  const classes = new Set();
  const tokensDefinits = new Set();
  const tokensUsats = new Map();
  const regles = []; // { selector, cos, fitxer, linia }
  for (const r of rutes) {
    const brut = llig(r);
    if (brut === null) continue;
    const t = senseComentaris(brut);
    for (const m of blocsCssFulla(t)) {
      const selector = m.selector.trim();
      if (selector.startsWith('@')) continue;
      selector.match(/\.(-?[_a-zA-Z][\w-]*)/g)?.forEach((c) => classes.add(c.slice(1)));
      regles.push({ selector, cos: m.body, fitxer: r, linia: liniaDe(t, m.index) });
    }
    for (const m of t.matchAll(/(--[\w-]+)\s*:/g)) tokensDefinits.add(m[1]);
    for (const m of t.matchAll(/var\(\s*(--[\w-]+)/g)) {
      if (!tokensUsats.has(m[1])) tokensUsats.set(m[1], []);
      tokensUsats.get(m[1]).push(`${r}:${liniaDe(t, m.index)}`);
    }
  }
  return { classes, tokensDefinits, tokensUsats, regles };
}

/* ──────────────── Graf de mòduls (accessibilitat) ─────────────────── */

function resolMod(desDe, spec) {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(join(ARREL, desDe)), spec);
  const cand = [base, base + '.js', base + '.jsx', join(base, 'index.js'), join(base, 'index.jsx')];
  for (const c of cand) if (existsSync(c) && statSync(c).isFile()) return relative(ARREL, c);
  return null;
}

function grafDesDe(entrades) {
  const vistos = new Set();
  const cua = entrades.filter((e) => existsSync(join(ARREL, e)));
  while (cua.length) {
    const f = cua.shift();
    if (vistos.has(f)) continue;
    vistos.add(f);
    const t = llig(f);
    if (t === null) continue;
    const specs = [
      ...t.matchAll(/import\s+[^'"]*from\s*['"]([^'"]+)['"]/g),
      // Reexportacions (barrils: components/ui/index.js). Sense açò, un barril deixa orfe tot el que reexporta.
      ...t.matchAll(/export\s+(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/g),
      ...t.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
      ...t.matchAll(/import\s*['"]([^'"]+)['"]/g)
    ].map((m) => m[1]);
    // Els fulls de l'orquestrador també formen part del graf: CSS @import url().
    if (extname(f) === '.css') {
      for (const m of senseComentaris(t).matchAll(/@import\s+(?:url\(\s*(['"]?)([^'"\s)]+)\1\s*\)|(['"])([^'"]+)\3)/g))
        specs.push(m[2] || m[4]);
    }
    for (const s of specs) {
      const r = resolMod(f, s.split('?')[0]);
      if (r && !vistos.has(r)) cua.push(r);
    }
  }
  return vistos;
}
const grafAccessible = () => grafDesDe(ENTRADES);

/* ──────────────────────────── Les vuit lleis ──────────────────────── */

const infraccions = {};
/** La identitat ignora els números de línia: el deute no ha de "créixer"
 *  perquè algú afija una línia en blanc a dalt del fitxer. */
const identitat = (m) => m.replace(/:\d+/g, '').replace(/\s+\(\+\d+\)/, '').trim();
const registra = (llei, missatge) => (infraccions[llei] ||= []).push(missatge);

const accessible = grafAccessible();
// Les entrades de test aïllades no són UI; si producció les importa, sí que s’auditen.
const JSX = arbre('src', ['.js', '.jsx']).filter(f => !/\.(?:test|spec)\.[jt]sx?$/.test(f) || accessible.has(f));
const CSS_TOTS = arbre('src', ['.css']);
const escrites = classesEscrites(JSX);
const ombra = analitzaCss([FULL_OMBRA]);
const totCss = analitzaCss(CSS_TOTS);

/* LLEI 1 · CLASSE ÒRFENA — classe al JSX sense regla a cap full d'estils.
   Part C (proposta 261031) · Convencions de l'HTML que no són ganxos d'estil:
   cada una porta la seua font. */
const CONVENCIONS_DE_CLASSE = {
  'language-': 'WHATWG HTML, element <code>: la llengua del codi es marca amb una classe «language-…» per als ressaltadors i els lectors de diagrames'
};
const esConvencio = (c) => Object.keys(CONVENCIONS_DE_CLASSE).some((prefix) => c.startsWith(prefix));
/* R30-LLEI08-LLEI01 · `sdp-ombra-${eleva}` deixa el prefix «sdp-ombra-»: la família
   té regla si algun full definix una classe més llarga que comença igual (.sdp-ombra-1).
   Un prefix sense cap membre amb regla continua sent orfe. */
const familiaAmbRegla = (c) => c.endsWith('-') && [...totCss.classes].some((k) => k.length > c.length && k.startsWith(c));
/* Decisió del Mestre (31-10-2026, part C) · Classes d'estat que cap full no estila,
   amb el seu motiu escrit: es retiren quan passen a atribut data-. */
const EXCEPCIONS_CLASSE = {
  'sdp-workspace--compacte': "ganxo d'estat del mode compacte de UniversalWorkspace (proves i documentació del component); passar-lo a data-compacte demana una prop nova d'AppGridShell i la fitxa contracte_graella.md és de la zona humana"
};
for (const [c, ocurrencies] of escrites)
  if (!totCss.classes.has(c) && !familiaAmbRegla(c) && !esConvencio(c) && !EXCEPCIONS_CLASSE[c])
    registra('LLEI_01_CLASSE_ORFENA', `.${c}  →  ${ocurrencies[0]}${ocurrencies.length > 1 ? ` (+${ocurrencies.length - 1})` : ''}`);

/* LLEI 2 · TOKEN FANTASMA — var(--x) sense declaració enlloc. */
const tokensJsx = new Map();
for (const f of JSX) {
  const t = llig(f);
  if (t === null) continue;
  for (const m of t.matchAll(/var\(\s*(--[\w-]+)/g)) {
    if (!tokensJsx.has(m[1])) tokensJsx.set(m[1], []);
    tokensJsx.get(m[1]).push(`${f}:${liniaDe(t, m.index)}`);
  }
}
/* Decisió del Mestre (30-10-2026) · Una propietat que el JSX fixa al node
   (usePropietatsCss, setProperty, style) és declarada: el full la llig amb
   var() i el número només el sap el JavaScript. Només el codi que penja d'una
   entrada fixa res: un mòdul orfe o una fixture no declaren cap token. */
const fixadesPelJsx = new Set(JSX.filter((f) => accessible.has(f)).flatMap((f) => font(f)?.propietats ?? []));
for (const [tok, on] of [...totCss.tokensUsats, ...tokensJsx])
  if (!totCss.tokensDefinits.has(tok) && !fixadesPelJsx.has(tok) && !tok.match(/-$/))
    registra('LLEI_02_TOKEN_FANTASMA', `${tok}  →  ${on[0]}`);

/* LLEI 3 · ESTIL EN LÍNIA — cap valor literal dins de style={{}}.
   Un style en línia només pot ser un conducte de tokens, mai un valor. */
for (const f of JSX) {
  const t = llig(f);
  if (t === null) continue;
  const cromContracts = cromStyleOffsets(t, f);
  for (const m of t.matchAll(/style\s*=\s*\{\{/g)) {
    if (cromContracts.has(m.index)) continue;
    const obj = bloc(t, m.index + 'style='.length);
    const literal = obj.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    const etiqueta = `${f}:${liniaDe(t, m.index)}`;
    if (literal) registra('LLEI_03_COLOR_EN_LINIA', `${etiqueta}  →  ${literal[0]}`);
    registra('LLEI_03_ESTIL_EN_LINIA', etiqueta);
  }
}

/* LLEI 4 · LLEI DE VIDA — cap control per davall de --sdp-touch. */
const touchDecl = ombra.regles.flatMap((r) => [...r.cos.matchAll(/--sdp-touch\s*:\s*(?:var\([^,]+,\s*)?(\d+)px/g)]).map((m) => +m[1]);
const TOUCH = touchDecl.length ? touchDecl[0] : 44;
for (const r of ombra.regles) {
  // Només el SUBJECTE del selector (l'última part) és el control. Una icona
  // de 22px dins d'un botó de 44px és legítima; el botó de 36px no ho és.
  const subjectes = r.selector.split(',').map((s) => s.trim().split(/[\s>+~]+/).pop() || '');
  const toca = subjectes.some((s) =>
    CONTROLS.some((c) => s === c || s.startsWith(c + ':') || s.startsWith(c + '[') || s.startsWith(c + '.')));
  if (!toca) continue;
  for (const m of r.cos.matchAll(/\b(min-height|min-width|height|width)\s*:\s*(\d+)px/g))
    if (+m[2] < TOUCH)
      registra('LLEI_04_VIDA', `${r.fitxer}:${r.linia}  ${r.selector.slice(0, 60)}  ${m[1]}:${m[2]}px < ${TOUCH}px`);
}

/* LLEI 5 · PORTA ÚNICA — cap import de CSS que no siga `?inline`. */
for (const f of JSX) {
  const t = llig(f);
  if (t === null) continue;
  for (const m of t.matchAll(/import\s+(?:[^'"]*from\s*)?['"]([^'"]+\.css[^'"]*)['"]/g))
    if (!m[1].endsWith('?inline'))
      registra('LLEI_05_PORTA_UNICA', `${f}:${liniaDe(t, m.index)}  →  ${m[1]}`);
}

/* LLEI 6 · ENCAPSULAMENT — la UI no toca el document amfitrió. */
for (const f of JSX) {
  // Les proves manipulen el DOM del runner; no són UI de l'amfitrió.
  if (PERMIS_DOCUMENT.includes(f) || (/\.(?:test|spec)\.[jt]sx?$/.test(f) && !accessible.has(f))) continue;
  const fo = font(f);
  if (fo === null) continue;
  const t = fo.brut;
  const quota = { ...PERMIS_DOCUMENT_ACOTAT[f] };
  for (const m of fo.net.matchAll(/document\.(documentElement|head|body)/g)) {
    // Part C · «actiu === document.body» pregunta on és el focus: compara, no toca.
    if (fo.comparacions.has(m.index)) continue;
    if (quota[m[1]] > 0) { quota[m[1]] -= 1; continue; }
    registra('LLEI_06_ENCAPSULAMENT', `${f}:${liniaDe(t, m.index)}  →  document.${m[1]}`);
  }
}

/* LLEI 7 · PARITAT D'IDIOMES.
   Fase D (261020, tasca 4.1) · Lectura doble mentre conviuen les dos formes:
   cada llengua es llig del seu diccionari, src/config/idiomes/<codi>.js
   (L1, diccionaris sota demanda), i només si eixe fitxer no hi és, del bloc
   antic dins de TRANSLATIONS a i18n.js. Una llengua sense cap de les dos és
   «idioma absent». La branca antiga s'esborrarà quan L1 estiga assentat. */
const i18n = llig('src/config/i18n.js');
if (i18n) {
  const claus = {};
  for (const lang of IDIOMES) {
    const propi = llig(`src/config/idiomes/${lang}.js`);
    let b = null;
    if (propi !== null) {
      const m = /export\s+default\s*\{/.exec(propi);
      if (m) b = bloc(propi, propi.indexOf('{', m.index));
    } else {
      const m = new RegExp(`\\n\\s{0,4}${lang}\\s*:\\s*\\{`).exec(i18n);
      if (m) b = bloc(i18n, i18n.indexOf('{', m.index));
    }
    if (!b) { registra('LLEI_07_PARITAT_I18N', `idioma absent: ${lang}`); continue; }
    claus[lang] = new Set([...b.matchAll(/['"]([\w.]+)['"]\s*:/g)].map((x) => x[1]));
  }
  const base = claus[IDIOMES[0]] || new Set();
  for (const lang of IDIOMES.slice(1))
    for (const k of base)
      if (claus[lang] && !claus[lang].has(k))
        registra('LLEI_07_PARITAT_I18N', `${lang} li falta '${k}'`);
}

/* LLEI 8 · SUBARBRE ORFE — fitxer que no penja de cap entrada.
   Excepcions documentades: fitxers que entren per alias de build o en temps
   d'execució i que este graf estàtic no pot veure. Tota excepció ha de portar
   raó escrita: si no en té, no és excepció, és codi mort. */
const EXCEPCIONS_ORFE = {
  'src/data/local/adminUsuarisLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · kit R13, arbitratge R7 (R7G-7.3: sense backend fins que es reescriga la migració 2611052345) · revisió del Mestre pendent',
  'src/data/xifratXatActivacio.js': 'biblioteca F2a de l’E2EE (kit R13): encara sense consumidor de producció, perquè la UI dels fils no està cablejada; la cobrix xifratXatActivacio.seguretat.test.js · arbitratge R7 (K2-01: entra només com a biblioteca) · revisió del Mestre pendent',
  'src/data/xifratXatOptin.js': 'magatzem IndexedDB de l’opt-in per fil de l’E2EE (kit R20): biblioteca de l’E2EE sense consumidor de producció; només el llig src/data/xifratXatActivacio.js, que tampoc no en té fins que es cride creaActivacioXat; la cobrix xifratXatOptin.seguretat.test.js · arbitratge R8 (G1-03: entra només com a biblioteca) · revisió del Mestre pendent',
  'src/shims/jsx-runtime.js': 'entra per alias de resolve a vite.config (jsxImportSource)',
  'src/assets/fonts/noto-sans.css': 'es carrega en execució via atribut fonts-href',
  /* Decisió del Mestre (31-10-2026, part C) · Obra no cablejada o pausada: cada
     excepció diu per què i es retira quan el mòdul es connecte o s'esborre. */
  'src/data/activitypub.js': 'el carrega tooling/seo/genera-federacio.mjs (FONTS.activitypub) amb un import() de camí calculat, al build web i al servidor de dev (tooling/vite/federacio-iaia.mjs) · decisió del Mestre 261031 (part C)',
  'src/data/conformitat/kit.js': 'kit de conformitat del port (AGENTS §8): el fan servir només les proves dels adaptadors · decisió del Mestre 261031 (part C)',
  /* Pla 261101_1246 (assalt 10/10), aprovat pel Mestre el 261101. */
  'src/data/federacio/inboxActivityPub.js': 'recepció ActivityPub de la fase 2 (D05/D07): biblioteca pura i provada, sense servei; cap mòdul de src/ no l’importa a posta (no entra al paquet del navegador) i es connectarà quan hi haja runtime (D-T3-5) · pla 261101_1246 aprovat pel Mestre el 261101 (carril T3)',
  'src/data/importaMunicipiOpenData.js': 'restaurador municipal Open Data (D04/D10, T2): el criden les proves i un futur Tauler; sense UI de restauració · especificació T2 del pla 261101_1246 (D-3 només n’autoritza la lectura pública)',
  'src/data/local/adaptadorLocal.js': 'segon adaptador complet del port (D01, T1): cap entrada de producció l’importa a posta (frontera provada a adaptadorLocal.test.js); hi entra per host.injectaBackendDelPaquet o per les proves · pla 261101_1246 (carrils T1 i T2)',
  'src/data/local/compteLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/comunitatLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/contingutLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/conversesLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/dadesObertesLocal.js': 'dades obertes i restauració de l’adaptador local (D04/D10, T2): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/mitjansLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  'src/data/local/notesLocal.js': 'mòdul de l’adaptador local (D01, T1): penja de src/data/local/adaptadorLocal.js, fora del paquet de producció a posta · pla 261101_1246',
  /* v1.2.26 · C26-3 · Mateix motiu que els germans d'ací dalt: el graf de producció no arriba a adaptadorLocal.js a posta,
     i el mòdul nou n'és només una part. Cablejar-lo des d'una entrada trencaria la frontera que prova adaptadorLocal.test.js. */
  'src/data/local/taxonomiaPaginesLocal.js': 'mòdul de l’adaptador local (IDEA-375, C26-3 de Codex): la capacitat taxonomiaPagines del segon adaptador; penja de src/data/local/adaptadorLocal.js (import estàtic), fora del paquet de producció a posta; el proven src/data/local/taxonomiaPaginesLocal.test.js i el kit de conformitat · v1.2.26, revisió del Mestre pendent',
  /* Ordre 261103_0522 (Onades 8-9, Pilar 3) · Biblioteques opt-in desacoblades (Llei de
     l'Enxufabilitat, AGENTS §8): cap entrada les importa a posta i es desendollen sense
     tocar backendPort. Les proven tests/*.test.mjs (node --test), que este graf no compta.
     Gauntlet O7-O9, troballa ENX-01: pendent de ratificació del Mestre; cada excepció es
     retira quan el mòdul es cablege o s'esborre. */
  'src/data/local/persistenciaLocalRural.js': 'instantànies locals IndexedDB/memòria amb SHA-256 (O8-O9, kit Codex): biblioteca opt-in, cap entrada l’importa a posta; la carreguen la cua, l’enxufe i tests/persistencia-local-rural.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/local/cuaOperacionsOffline.js': 'cua d’operacions encadenada amb SHA-256 i HLC/LWW (O8-O9, kit Codex): només per injecció explícita del consumidor, no toca backendPort; la prova tests/cua-operacions-offline.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/local/enxufeBackendOfflineFirst.js': 'envoltori opcional del port amb cau i cua (O8-O9, kit Codex): backendPort no l’importa a posta (desendollable amb destroy()); el prova tests/enxufe-backend-offline-first.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/federacio/portabilitatFediversity.js': 'portabilitat FEP-7628/FEP-8b32 i Paquet de Sobirania Municipal (O8-O9, kit Gemini): biblioteca pura opt-in; la importen pontEmergenciaRural.js, sincronitzadorCarpetaLocal.js i tests/portabilitat-fediversity.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/local/pontEmergenciaRural.js': 'pont d’emergència rural DTN/sneakernet amb deltes signats (O8-O9, kit Gemini): biblioteca opt-in, cap entrada l’importa a posta; la prova tests/pont-emergencia-rural.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/local/sincronitzadorCarpetaLocal.js': 'sincronitzador de Notes amb una carpeta local (O8-O9, kit Gemini): biblioteca opt-in, cap entrada l’importa a posta; la prova tests/sincronitzador-carpeta-local.test.mjs · ordre 261103_0522, pendent del Mestre',
  'src/data/xifratXatParaules.js': 'llista de paraules de la frase de recuperació E2EE (P1-12, DM-2): REVISADA_PEL_MESTRE = false; només la carrega amb import() src/data/xifratXatAlta.js (alta F2a), també sense consumidor, que no genera cap frase mentre la llista no estiga revisada; encendre E2EE_ACTIU_PER_DEFECTE no la cableja · decisió del Mestre 261031 (part C); text posat al dia per l’ordre del Mestre 261101 21:41 (T2: completar F2a), marató 261101_2143 (carril M03-B2d-F2A), reversible',
  'src/data/xifratXatRecuperacio.js': 'recuperació social E2EE del xat (P1-12, IDEA-48): cap mòdul no la importa; encendre E2EE_ACTIU_PER_DEFECTE no la cableja · decisió del Mestre 261031 (part C)',
  'src/data/xifratXatAlta.js': 'alta silenciosa F2a del xat xifrat (P1-12, disseny §5.1-§5.4): motor sense consumidor fins a la cerimònia, que espera les portes del Mestre (llista de paraules DM-2 i captures); encendre E2EE_ACTIU_PER_DEFECTE no la cableja; reversible: l’excepció es retira quan el servei la cablege o s’esborre el fitxer · ordre del Mestre 261101 21:41 (T2: completar F2a), marató 261101_2143 (carril M03-B2d-F2A)',
  'src/pwa/avisosPush.js': 'avisos push web (ordre 261030_0252, Fase 3): pendents de cablejar · decisió del Mestre 261031 (part C)',
  'src/natiu/avisosPushNatius.js': 'avisos push natius (ordre 261030_0252, Fase 3): pendents de cablejar · decisió del Mestre 261031 (part C)',
  'src/components/universal/BotoInstalaApp.jsx': 'pausat durant la beta (App.jsx; pla 261021_2345 §1): es conserva amb les seues proves · decisió del Mestre 261031 (part C)',
  'src/hooks/useInstalacioApp.js': 'pausat durant la beta amb BotoInstalaApp.jsx (pla 261021_2345 §1): es conserva amb les seues proves · decisió del Mestre 261031 (part C)',
  'src/data/adaptadors/sollutia/client.js': 'composició del Model B: activar recursos exigix una captura versionada per la Frontissa; pendent de Sollutia · decisió del Mestre 261031 (part C)',
  'src/apps/bar/loyverseApi.js': 'adaptador d\'importació de Loyverse, encara sense pantalla · decisió del Mestre 261031 (part C)',
  'src/apps/nevera/bring.js': 'importació de Bring! a la Nevera, encara sense pantalla · decisió del Mestre 261031 (part C)',
  'src/apps/nevera/importador.js': 'importador de la Nevera, encara sense pantalla · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/burocracia/nucli/avisos.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/burocracia/nucli/icsTerminis.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/burocracia/nucli/obligacions.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/burocracia/nucli/terminis.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/documents/plaNeteja.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/documents/rebutEsborrat.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/font/handleStore.js': 'nucli de la Gestoria (14-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/identitat/nucli/document.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/identitat/nucli/guardes.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/identitat/nucli/titular.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/projectes/nucli/expedient.js': 'nucli de la Gestoria (carril del 04-10), encara sense interfície · decisió del Mestre 261031 (part C)',
  'src/sections/connectar/organitzacio/BlocAdministrarOrganitzacio.jsx': 'ja no es munta des del 25-10 (1c110f954): el Mestre decidix si s\'esborra o es torna a connectar · decisió del Mestre 261031 (part C)',
  'src/sections/connectar/organitzacio/useAdministrarOrganitzacio.js': 'ja no es munta des del 25-10 amb BlocAdministrarOrganitzacio.jsx: el Mestre decidix si s\'esborra o es torna a connectar · decisió del Mestre 261031 (part C)',
  'src/sections/notes/ConnexioDetall.jsx': 'cap importació des del 30-09: el Mestre decidix si s\'esborra o es torna a connectar · decisió del Mestre 261031 (part C)',
  'src/sections/gestoria/facturar/__fixtures__/idbFals.js': 'fixture duplicada que ningú no importa (la còpia bona és tests/helpers/idbFals.js): proposta d\'esborrat per al Mestre · decisió del Mestre 261031 (part C)',
  /* Ordre del Mestre i MarIA del 261107 (P0-45 / IDEA-176) · /page/anatomia-rural
     hui només mostra el visor del Pou de la Neu del Rentonar, i el visor general
     d'Anatomia Rural (almàssera, molins, forn de calç…) ja no es munta. Es
     conserva amb les seues proves fins que el Mestre decidisca si es torna a
     muntar, quan la resta d'artefactes tinga documentació, o s'esborra: llavors
     es retiren les tres excepcions. */
  'src/components/patrimoni/VisorAnatomiaRural3D.jsx': 'visor general d’Anatomia Rural (IDEA-109): despenjat de /page/anatomia-rural fins que la resta d’artefactes tinga documentació; el cobrix VisorAnatomiaRural3D.test.jsx · ordre del Mestre 261107 (P0-45 / IDEA-176) · revisió del Mestre pendent (tornar a muntar o esborrar)',
  'src/components/patrimoni/anatomiaRuralGeometria.js': 'geometria del visor general d’Anatomia Rural: només la importa VisorAnatomiaRural3D.jsx, despenjat · ordre del Mestre 261107 (P0-45 / IDEA-176) · revisió del Mestre pendent (tornar a muntar o esborrar)',
  'src/data/patrimoni/anatomiaRural.js': 'dades del visor general d’Anatomia Rural: només les importa VisorAnatomiaRural3D.jsx, despenjat (i les proves del Pou i de l’article del Mur) · ordre del Mestre 261107 (P0-45 / IDEA-176) · revisió del Mestre pendent (tornar a muntar o esborrar)',
  'src/data/revisionsEditorialsWpMemoria.js': 'adaptador en memòria del kit de conformitat per a les revisions editorials de WordPress (P0-111, R18)',
  /* Onada R32.15 (Carril 1) · Motors purs de Codex R32.13 integrats a la v1.2.11 (9c67bc396, amb
     --no-verify: el hook no va arribar a esta porta). Cap pantalla els consumix encara (la crònica
     FITA_R32_14 ho declara); només els proven les seues suites. Es retiren quan es cableguen o s'esborren. */
  'src/data/calendari/disponibilitatSenseSolapament.js': 'motor pur de disponibilitat sense solapaments (IDEA-284, Codex R32.13): sense pantalla; el prova disponibilitatSenseSolapament.test.js · integrat a la v1.2.11, revisió del Mestre pendent',
  'src/data/inventari/reposicioAntiDobleComanda.js': 'motor pur de reposició sense doble comanda (IDEA-284, Codex R32.13): sense pantalla, la reserva atòmica és del backend; el prova reposicioAntiDobleComanda.test.js · integrat a la v1.2.11, revisió del Mestre pendent',
  'src/data/crdtRuralRemot.js': 'pont del transport CRDT remot per a creaSessioRural (PF-03, Codex R32.13): ACK opcional sense consumidor de producció fins que el SQL R32.13 es faça servir; el prova crdtRuralRemot.r3213.test.js · integrat a la v1.2.11, revisió del Mestre pendent',
  /* Decisió del Mestre (24-11-2026, xat del commit v1.2.24) · Sis mòduls dels kits dels carrils sense consumidor
     de producció: entren com a biblioteques o façanes amb prova, a l'espera que se n'enllace o se'n retire l'ús. */
  'src/data/gestioDiariEditorial.js': 'manteniment diferit i extracció paginada del diari editorial (R32.70, Codex): API sense pantalla; la prova tests/revisions-editorials-capacitat.r3270.test.mjs per la fixture · integrat a la v1.2.24, revisió del Mestre pendent',
  'src/data/local/portabilitatLocal.js': 'portabilitat del segon adaptador local (R32.56/R32.74, Codex): només la importa adaptadorLocal.js, que és excepció a posta; la prova portabilitatLocal.r3256.test.js · integrat a la v1.2.24, revisió del Mestre pendent',
  'src/data/portabilitatCompte.js': 'paquet de compte portable (R32.56/R32.74, Codex): el carrega portabilitatLocal.js; la proven portabilitatCompte.r3256.test.js i conformitat.r54.test.js · integrat a la v1.2.24, revisió del Mestre pendent',
  'src/data/menjarIBeure/alergensMercatBotiga.js': 'façana pública dels al·lèrgens comercials (R32.78, Codex): la lògica viu a src/utils/alergensComercials.js; la paritat la fixa alergensCompartits.r3278.test.js · integrat a la v1.2.24, revisió del Mestre pendent (consumidor o retirada)',
  'src/sections/mercat/alergensMercat.js': 'façana del Mercat sobre alergensMercatBotiga.js (R32.52/R32.74, Codex): sense consumidor de producció; la proven alergensCompartits.r3278.test.js i tests/alergens-mercat-botiga.r3252.test.mjs · integrat a la v1.2.24, revisió del Mestre pendent',
  'src/sections/text/CreditsComunitatS23.jsx': 'tros dels crèdits S23 de /legal, despenjat per IDEA-340 (R32.61) en passar a /page/reconeixements: encara el munta la canari CanarisSanejamentTelladoFitxa14.r32_48.test.jsx · v1.2.24, revisió del Mestre pendent (retirar-lo amb la canari)',
  /* Guàrdia #6 de MarIA (261125 11:00) · D-LLEI08: la integració C1→C16 de Codex porta set biblioteques sense
     consumidor de producció; retenir-les no és viable perquè C9, C11 i C12 les reescriuen. Segueix el precedent de
     l'ordre 261103_0522: cada excepció diu qui la proveïx, per què encara no té consumidor i quina prova la cobrix,
     i es retira quan el mòdul es cablege o s'esborre. Queden a la Bústia per a la ratificació del Mestre. */
  /* v1.2.25 · Port de la cerca del xat (costures 8 i 9, autoritzat pel Mestre el 261125 a les 14:20): xatCerca.js ix d'esta llista perquè src/data/supabase/index.js ja l'importa, darrere de VITE_SDP_XAT_CERCA. */
  'src/data/xat/cercaConversa.js': 'motor pur de la cerca dins d’una conversa (C1, Codex; controlador asíncron de C11): índex local, fusió amb els resultats remots i salt al missatge vigent; sense consumidor de producció perquè la Conversa encara no connecta onCanviaConsulta ni la cerca remota (costura 15, després del port de la cerca); el cobrixen src/data/xat/cercaConversa.controlador.test.js i src/data/xat/v1225.motors.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  'src/data/xat/restauraCopiaSeguretat.js': 'hidratació completa i restauració local de la còpia de seguretat del xat (C1, Codex): magatzem IndexedDB per compte i poble, guarda síncrona de sessió i àmbit; només la importa src/data/xat/costuraCopiaSeguretat.js, que tampoc no té consumidor, perquè la pantalla de restauració encara no hi és (C1-04); la cobrixen src/data/xat/v1225.motors.test.js i src/data/xat/costuraCopiaSeguretat.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  'src/data/xat/costuraCopiaSeguretat.js': 'adaptador de confirmació en dos passos de la còpia de seguretat del xat (C6, Codex, sobre restauraCopiaSeguretat.js de C1): substituirà la ruta de restauració del fallback de G1, que silencia els errors d’IndexedDB; sense consumidor de producció fins que la UI de restauració el cablege (C6-R01); el cobrix src/data/xat/costuraCopiaSeguretat.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  'src/apps/lector/destinacioServei.js': 'destinació del Curador sobre el servei real de notícies (C2, Codex): el servei neutral s’injecta des de la plataforma i no consulta VITE_SDP_LECTOR_LLAVOR; sense consumidor de producció perquè el cablatge de la plataforma és de les costures del G2 nou de micro-apps i el Mestre encara ha de decidir què fa el Curador sense connexió (C2-03); el cobrix src/apps/lector/destinacioServei.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  'src/data/calendari/subscripcionsAgricoles.js': 'subscripcions i avisos del Calendari Agrícola (C2, Codex; rebuts parcials de C12): simulador sense IA i enviament al Xat intern amb UUID idempotent per xat_envia; sense consumidor de producció perquè la pantalla és de les costures del G2 nou de micro-apps i la migració 20261125013000 no està aplicada; el cobrix src/data/calendari/subscripcionsAgricoles.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  'src/sections/multimedia/fontArxiusOpfs.js': 'volum privat del navegador per a /multimedia (C2, Codex; panys de C6 i àmbit de sessió de C9): OPFS amb IndexedDB de reserva, sense tocar els originals del dispositiu; sense consumidor de producció perquè connectar creaVolumOpfs a /multimedia, amb el compte, el poble i la guarda de sessió que demana C9, és la costura 18, pendent de la decisió del Mestre (C6-R07: sense Web Locks, el volum és de només lectura); el cobrix src/sections/multimedia/fontArxiusOpfs.test.js · Guàrdia #6 de MarIA (261125 11:00): integració C1→C16; es retira quan es cablege · pendent del Mestre',
  /* v1.2.26 · C26-3 · Via del precedent 261103_0522 per a una biblioteca preparada per a un consumidor futur: qui la
     proveïx, per què encara no té consumidor i quina prova la cobrix. El contracte del port no declara cap capacitat de
     mencions; la costura és de la vista, no del port. */
  'src/data/taxonomia/mencionsEntitats.js': 'biblioteca pura del graf de mencions (IDEA-368, C26-3 de Codex; esmenes #8 del Gauntlet C26-3): parser lineal @Entitat, desvinculació amb autoritat i persistència injectades, graf tancat fins que està preparat i filtre dels marcadors de mur_public_eligible; sense consumidor de producció perquè la pestanya «Mencions / On ens citen» de la pàgina d’entitat és la costura declarada per a G26-2 i encara no hi és; el cobrix src/data/taxonomia/mencionsEntitats.test.js · v1.2.26; es retira quan la vista el cablege o s’esborre · pendent del Mestre',
};
/* Decisió del Mestre (30-10-2026) · Una fixture (dins de __fixtures__/) que una
   prova importa és part de la prova, amb el criteri de la línia de les proves.
   La que cap prova no importa continua sent codi mort. */
const PROVES = arbre('src', ['.js', '.jsx']).filter((f) => /\.test\.[jt]sx?$/.test(f));
/* Part C (proposta 261031) · Una fixture de BUILD (un mòdul que la prova
   compila amb Vite, com __fixtures__/modulDeProva) no s'importa: la prova
   en nomena el camí ('src/…/__fixtures__/…'). Eixe camí, fitxer o carpeta, i
   el que importen els seus fitxers, també són de la prova. */
const nomenades = [...new Set(PROVES.flatMap((f) => [...(llig(f) ?? '').matchAll(/['"`](src\/[\w./-]*__fixtures__\/[\w./-]+?)\/?['"`]/g)].map((m) => m[1])))];
const deLaCarpeta = (c) => [...JSX, ...CSS_TOTS].filter((f) => f === c || f.startsWith(c + '/'));
const deLesProves = grafDesDe([...PROVES, ...nomenades.flatMap(deLaCarpeta)]);
const esFixtureDeProva = (f) => /(?:^|\/)__fixtures__\//.test(f) && deLesProves.has(f);
/** Les ordres Node declarades als scripts npm també són entrades reals de L08.
 * Només compta una invocació directa inicial a tooling/; una prova, un comentari, una
 * cadena echo o un fitxer solt de tooling no pot amagar un orfe de src/.
 * No s'executa cap ordre: el graf continua sent lectura estàtica.
 */
const scriptsNpm = JSON.parse(llig('package.json') ?? '{}').scripts ?? {};
const entradesCli = Object.entries(scriptsNpm)
  .filter(([nom]) => nom !== 'test' && !nom.startsWith('test:'))
  .flatMap(([, ordre]) => typeof ordre !== 'string' ? []
    : [...ordre.matchAll(/^\s*node\s+(tooling\/[\w./-]+\.(?:mjs|js))(?=\s|$)/g)].map((m) => m[1]));
const delBuild = grafDesDe([...ENTRADES_DE_BUILD, ...ENTRADES_DE_SERVIDOR, ...entradesCli]);
for (const f of [...JSX, ...CSS_TOTS])
  if (!accessible.has(f) && !delBuild.has(f) && f !== FULL_OMBRA && !EXCEPCIONS_ORFE[f] && !/\.test\.[jt]sx?$/.test(f) && !esFixtureDeProva(f)) // les proves són entrades de vitest
    registra('LLEI_08_SUBARBRE_ORFE', f);

/* ─────────────────────── Criquet i veredicte ──────────────────────── */

const DURES = new Set(['LLEI_03_COLOR_EN_LINIA', 'LLEI_04_VIDA', 'LLEI_05_PORTA_UNICA']);
const actual = Object.fromEntries(Object.entries(infraccions).map(([k, v]) => [k, v.length]));
const identitats = Object.fromEntries(
  Object.entries(infraccions).map(([k, v]) => [k, [...new Set(v.map(identitat))].sort()]));
const totes = [
  'LLEI_01_CLASSE_ORFENA', 'LLEI_02_TOKEN_FANTASMA', 'LLEI_03_ESTIL_EN_LINIA',
  'LLEI_03_COLOR_EN_LINIA', 'LLEI_04_VIDA', 'LLEI_05_PORTA_UNICA',
  'LLEI_06_ENCAPSULAMENT', 'LLEI_07_PARITAT_I18N', 'LLEI_08_SUBARBRE_ORFE'
];
for (const l of totes) actual[l] ??= 0;

if (BASELINE) {
  const congelat = {};
  for (const l of totes) {
    const dur = DURES.has(l);
    congelat[l] = { max: dur ? 0 : actual[l], coneguts: dur ? [] : (identitats[l] ?? []) };
  }
  writeFileSync(DEUTE_PATH, JSON.stringify(congelat, null, 2) + '\n');
  console.log('Deute congelat a .pedra-seca-deute.json:');
  for (const l of totes) console.log(`  ${l.padEnd(28)} ${String(congelat[l].max).padStart(4)}`);
  console.log('\nLes lleis dures queden a 0: fallaran sempre que es violen.');
  console.log('El deute registra identitats: una infracció NOVA es detecta encara');
  console.log('que el total no puge (una fora, una dins no compensa).');
  process.exit(0);
}

const previ = existsSync(DEUTE_PATH) ? JSON.parse(readFileSync(DEUTE_PATH, 'utf8')) : null;
if (!previ) {
  console.error('No hi ha .pedra-seca-deute.json. Executa `--baseline` una vegada.\n');
}

let fallada = false;
console.log('\n══ TRACTOR PEDRA SECA ══════════════════════════════════════\n');
for (const l of totes) {
  const n = actual[l];
  const dur = DURES.has(l);
  const registre = previ?.[l] ?? { max: n, coneguts: [] };
  const max = registre.max ?? 0;
  /* Part C (proposta 261031) · A la LLEI 1 el deute és la CLASSE: el fitxer de
     la primera ocurrència és on mirar, no qui és. Si eixa ocurrència se'n va
     (un comentari que ja no compta, un fitxer esborrat), la mateixa classe
     òrfena no és nova. */
  const clau = l === 'LLEI_01_CLASSE_ORFENA' ? (i) => i.split(/\s+→\s+/)[0] : (i) => i;
  const coneguts = new Set((registre.coneguts ?? []).map(clau));
  const nous = (identitats[l] ?? []).filter((i) => !coneguts.has(clau(i)));
  const malament = dur ? n > 0 : (n > max || (previ && nous.length > 0));
  if (malament) fallada = true;
  const marca = malament ? '✗' : n < max ? '↓' : '·';
  const nota = dur ? '(DURA)' : `màx ${max}`;
  console.log(`${marca} ${l.padEnd(28)} ${String(n).padStart(4)}  ${nota}`);
  if (nous.length && previ && !dur) {
    console.log(`      ── INFRACCIONS NOVES (${nous.length}) ──`);
    for (const i of nous.slice(0, DETALL ? 999 : 15)) console.log(`      + ${i}`);
    if (!DETALL && nous.length > 15) console.log(`      … i ${nous.length - 15} més (--detall)`);
  } else if ((DETALL || (malament && dur)) && infraccions[l]) {
    for (const m of infraccions[l].slice(0, DETALL ? 999 : 12)) console.log(`      ${m}`);
    if (!DETALL && infraccions[l].length > 12) console.log(`      … i ${infraccions[l].length - 12} més (--detall)`);
  }
}

console.log('\n────────────────────────────────────────────────────────────');
if (fallada) {
  console.error('PARAT. El deute puja o s\'ha trencat una llei dura.');
  process.exit(1);
}
console.log('PASSA. El deute no puja.');
process.exit(0);
