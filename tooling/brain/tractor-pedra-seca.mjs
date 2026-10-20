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
import { jsxClassValues } from '../lib/jsx-class-values.mjs';

/* ─────────────────────────── Configuració ─────────────────────────── */

const ARREL = process.cwd();
const DEUTE_PATH = join(ARREL, '.agents/deute/.pedra-seca-deute.json');
const DETALL = process.argv.includes('--detall');
const BASELINE = process.argv.includes('--baseline');

/** L'ÚNICA porta al Shadow DOM. Si un full no entra per ací, no existix. */
const FULL_OMBRA = 'src/css/index.css';

/** Entrades reals del graf de mòduls. */
const ENTRADES = ['src/main.jsx', 'src/wp-standalone.js', 'tooling/brain/mapa-consola.mjs'];

/** Fitxers autoritzats a tocar el document amfitrió. */
const PERMIS_DOCUMENT = ['src/PedraSecaEmbed.jsx', 'src/config/theme.js',
  // Propietari únic SEO: registerSeo exigix manageDocumentHead i rebutja embed/iframe.
  'src/hooks/seoHead.js'];

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

/* ──────────────── Extracció: classes escrites al JSX ──────────────── */

function classesEscrites(fitxers) {
  const mapa = new Map(); // classe -> [ "fitxer:línia" ]
  for (const f of fitxers) {
    const t = llig(f);
    if (t === null) continue;
    const afig = (c, idx) => {
      if (!c || c.includes('$') || c.includes('{')) return;
      if (!mapa.has(c)) mapa.set(c, []);
      mapa.get(c).push(`${f}:${liniaDe(t, idx)}`);
    };
    // className="..."  |  class="..."  |  className: '...'
    for (const m of t.matchAll(/(?:className|class)\s*[=:]\s*["']([^"']*)["']/g))
      m[1].split(/\s+/).forEach((c) => afig(c, m.index));
    // className={`... ${x} ...`}
    for (const m of t.matchAll(/(?:className|class)\s*=\s*\{\s*`([^`]*)`/g))
      m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach((c) => afig(c, m.index));
    // Només valors de les expressions: una comparació amb 'intens' no és una classe.
    for (const { value, index } of jsxClassValues(t))
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
    for (const m of t.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (selector.startsWith('@')) continue;
      selector.match(/\.(-?[_a-zA-Z][\w-]*)/g)?.forEach((c) => classes.add(c.slice(1)));
      regles.push({ selector, cos: m[2], fitxer: r, linia: liniaDe(t, m.index) });
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

function grafAccessible() {
  const vistos = new Set();
  const cua = ENTRADES.filter((e) => existsSync(join(ARREL, e)));
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

/* LLEI 1 · CLASSE ÒRFENA — classe al JSX sense regla a cap full d'estils. */
for (const [c, ocurrencies] of escrites)
  if (!totCss.classes.has(c))
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
for (const [tok, on] of [...totCss.tokensUsats, ...tokensJsx])
  if (!totCss.tokensDefinits.has(tok) && !tok.match(/-$/))
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
  const t = llig(f);
  if (t === null) continue;
  for (const m of t.matchAll(/document\.(documentElement|head|body)/g))
    registra('LLEI_06_ENCAPSULAMENT', `${f}:${liniaDe(t, m.index)}  →  document.${m[1]}`);
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
  'src/shims/jsx-runtime.js': 'entra per alias de resolve a vite.config (jsxImportSource)',
  'src/assets/fonts/noto-sans.css': 'es carrega en execució via atribut fonts-href'
};
for (const f of [...JSX, ...CSS_TOTS])
  if (!accessible.has(f) && f !== FULL_OMBRA && !EXCEPCIONS_ORFE[f] && !/\.test\.[jt]sx?$/.test(f)) // les proves són entrades de vitest
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
  const coneguts = new Set(registre.coneguts ?? []);
  const nous = (identitats[l] ?? []).filter((i) => !coneguts.has(i));
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
