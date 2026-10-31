// @vitest-environment node
/* Onada 11 (261010; prompt 261010_1730) · Refutació del front PS (Pedra Seca
   al navegador): cens dels tokens `var(--sdp-*)` que consumixen els fulls
   contra les seues definicions.
   El defecte que la motiva: modules.css pintava els h2/h3/h4 de l'Índex de la
   Consola amb --sdp-color-primary-main i --sdp-color-secondary-main, dos
   tokens que cap full declarava. Un var() a un token inexistent es resol a
   buit i la propietat hereta: cap porta (design_guard, capes, contracte de
   tokens) ho veia, perquè totes miren tokens.css o base.css, no els fulls
   grans. Esta prova llig la cascada real que cus index.css (tots els fulls
   que @importa) i, per a cada `var(--sdp-nom`, busca una declaració
   `--sdp-nom:`:
     · global: a tokens.css o a design-tokens.css (la capa 0), en qualsevol
       bloc (clar, fosc, Bancal, @media, @supports);
     · pròpia: al mateix full (un token de component declarat al seu full;
       les propietats locals, com --cal-* del Calendari o --visor-*, viuen
       fora de l'espai --sdp-* i esta prova no les compta);
     · d'un altre full de la cascada (informació: un token de component que
       un segon full consumix);
     · del codi: un objecte `style` del JSX (`'--sdp-crom-mostra': ...`), un
       `setProperty('--sdp-…')` o un text CSS dins d'una plantilla. Només
       valen els fitxers de producció de src/ (no proves ni fixtures).
   Un token sense cap de les quatre és un FANTASMA i la llista ha de ser
   buida. Els que viuen només pel codi es fixen en una instantània: un full
   que comence a dependre d'un token que només posa el JSX s'ha de declarar
   ací a consciència.
   Viu al costat dels fulls que vigila (src/css). */
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const ORQUESTRADOR = 'src/css/index.css';
const GLOBALS = new Set(['src/css/tokens.css', 'src/css/design-tokens.css']);
const EXT_CODI = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const DIRS_EXCLOSOS = new Set(['node_modules', '.git', 'dist']);

const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const relatiu = (ple) => path.relative(ARREL, ple).split(path.sep).join('/');
// Decisió del Mestre (30-10-2026) · Les sondes es componen: tractor-tokens (T1-T3) llig src sencer.
const tok = (nom) => ['--sdp', nom].join('-');
const varDe = (nom) => ['var(', tok(nom), ')'].join('');
/* Els comentaris es buiden conservant els salts de línia: les línies del cens
   coincidixen amb les del fitxer. */
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
const liniaDe = (text, index) => text.slice(0, index).split('\n').length;

/* ── La cascada real: els fulls que index.css @importa, en ordre ── */
const IMPORT = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
function fullsDeLaCascada() {
  const text = senseComentaris(llig(ORQUESTRADOR));
  return [...text.matchAll(IMPORT)].map((m) => relatiu(path.resolve(ARREL, path.dirname(ORQUESTRADOR), m[1])));
}
const FULLS = fullsDeLaCascada();

/* ── Usos i declaracions d'un full ── */
const US = /var\(\s*(--sdp-[\w-]+)/g;
const DECLARACIO = /(?<![\w-])(--sdp-[\w-]+)\s*:/g;
/** { usos: Map token → [línies], declarats: Set } d'un text CSS. */
function censa(css) {
  const net = senseComentaris(css);
  const usos = new Map();
  for (const m of net.matchAll(US)) {
    if (!usos.has(m[1])) usos.set(m[1], []);
    usos.get(m[1]).push(liniaDe(net, m.index));
  }
  const declarats = new Set([...net.matchAll(DECLARACIO)].map((m) => m[1]));
  return { usos, declarats };
}

/* ── Tokens que posa el codi en temps d'execució ── */
const esProva = (rel) => /\.test\.[mc]?[jt]sx?$/.test(rel) || rel.includes('/__fixtures__/') || rel.includes('/__mocks__/');
function fitxersDeCodi(dir, eixida = []) {
  for (const nom of readdirSync(dir)) {
    const ple = path.join(dir, nom);
    if (DIRS_EXCLOSOS.has(nom) || nom.startsWith('.')) continue;
    const info = lstatSync(ple);
    if (info.isSymbolicLink()) continue;
    if (info.isDirectory()) fitxersDeCodi(ple, eixida);
    else if (EXT_CODI.has(path.extname(nom)) && !esProva(relatiu(ple))) eixida.push(relatiu(ple));
  }
  return eixida;
}
const DEFINICIONS_CODI = [
  /setProperty\(\s*['"`](--sdp-[\w-]+)/g, // el.style.setProperty('--sdp-x', v)
  /['"`](--sdp-[\w-]+)['"`]\s*:/g, // style={{ '--sdp-x': v }}
  /(?<![\w(-])(--sdp-[\w-]+)\s*:(?!:)/g // text CSS dins d'una plantilla: el nom, dos punts i ${v}
];
/** Map token → [fitxer:línia] dels tokens que el codi de producció escriu. */
function tokensDelCodi(fitxers) {
  const eixida = new Map();
  for (const rel of fitxers) {
    const text = llig(rel);
    for (const patro of DEFINICIONS_CODI) {
      for (const m of text.matchAll(patro)) {
        if (!eixida.has(m[1])) eixida.set(m[1], new Set());
        eixida.get(m[1]).add(`${rel}:${liniaDe(text, m.index)}`);
      }
    }
  }
  return eixida;
}

/* ── Cens ── */
const CENS = new Map(FULLS.map((rel) => [rel, censa(llig(rel))]));
const DECLARATS_GLOBALS = new Set([...GLOBALS].flatMap((rel) => (CENS.has(rel) ? [...CENS.get(rel).declarats] : [...censa(llig(rel)).declarats])));
const CODI = tokensDelCodi(fitxersDeCodi(path.join(ARREL, 'src')));

/** D'on trau la definició un token usat en `full`: 'global', 'propi',
    'altre-full', 'codi' o null (fantasma). */
function origen(token, full) {
  if (DECLARATS_GLOBALS.has(token)) return 'global';
  if (CENS.get(full).declarats.has(token)) return 'propi';
  if ([...CENS.values()].some((c) => c.declarats.has(token))) return 'altre-full';
  if (CODI.has(token)) return 'codi';
  return null;
}

const on = (full, linies) => `${full}:${linies.join(',')}`;
const FANTASMES = [];
const D_ALTRE_FULL = [];
const DEL_CODI = new Map(); // token → [full:línies]
for (const [full, { usos }] of CENS) {
  for (const [token, linies] of usos) {
    const o = origen(token, full);
    if (o === null) FANTASMES.push(`${token} · ${on(full, linies)}`);
    else if (o === 'altre-full') D_ALTRE_FULL.push(`${token} · ${on(full, linies)}`);
    else if (o === 'codi') {
      if (!DEL_CODI.has(token)) DEL_CODI.set(token, []);
      DEL_CODI.get(token).push(on(full, linies));
    }
  }
}
FANTASMES.sort();
D_ALTRE_FULL.sort();

/* ═══ INSTANTÀNIA · tokens que els fulls consumixen i que només posa el codi
   (cens del 261010). Afegir-ne un és declarar que un full depén d'un valor
   que el JSX calcula en temps d'execució. ═══ */
const INSTANTANIA_CODI = new Set([
  /* La geometria del Calendari del Poble (VistaSetmana.jsx, VistaMes.jsx) ja
     no hi és: són propietats locals --cal-*, fora de l'espai --sdp-*
     (ordre del Mestre del 31-10-2026; el criteri del visor del 30-10). */
  /* Desplegable (Dropdown.jsx): amplada mesurada del disparador. */
  '--sdp-desplegable-ample',
  /* Panell del crom (PanellCrom.jsx): la mostra del color triat. */
  '--sdp-crom-mostra',
  /* Fons d'imatge del Xat (PedraSecaEmbed.jsx). */
  '--sdp-xat-fons-imatge'
]);

describe('cens de tokens --sdp-* dels fulls de la cascada contra les seues definicions', () => {
  test('les sondes veuen el que han de vore', () => {
    const { usos, declarats } = censa(['/* ', varDe('dins-comentari'), ' */\n.a { color: var(--sdp-text-cos); ', tok('propi'), ': 1px; }\n.b {\n  margin: var( ', tok('space-2'), ', var(--sdp-space-1) );\n  width: ', varDe('propi'), ';\n}\n'].join(''));
    expect([...usos.entries()]).toEqual([
      ['--sdp-text-cos', [2]],
      ['--sdp-space-2', [4]],
      ['--sdp-space-1', [4]],
      ['--sdp-propi', [5]]
    ]);
    expect([...declarats]).toEqual(['--sdp-propi']);
    /* El defecte d'origen: els dos tokens de l'Índex de la Consola serien fantasmes. */
    for (const mort of ['--sdp-color-primary-main', '--sdp-color-secondary-main']) {
      expect(DECLARATS_GLOBALS.has(mort), mort).toBe(false);
      expect([...CENS.values()].some((c) => c.declarats.has(mort)), mort).toBe(false);
      expect(CODI.has(mort), mort).toBe(false);
    }
    /* Les definicions del codi: les tres formes, i cap var() ni cap prova. */
    const codi = tokensDelCodi([]);
    expect(codi.size).toBe(0);
    const formes = ['el.style.setProperty(\'--sdp-a\', v); const s = { "--sdp-b": x }; const css = `.x { ', tok('c'), ': ${v}; color: ', varDe('d'), '; }`;'].join('');
    const trobats = new Set();
    for (const patro of DEFINICIONS_CODI) for (const m of formes.matchAll(patro)) trobats.add(m[1]);
    expect([...trobats].sort()).toEqual(['--sdp-a', '--sdp-b', '--sdp-c']);
    expect(esProva('src/css/qualitat.tokens.test.js')).toBe(true);
    expect(esProva('src/config/estil.js')).toBe(false);
  });

  test('la cascada d’index.css porta els fulls grans i les definicions globals', () => {
    expect(FULLS).toEqual(expect.arrayContaining(['src/css/base.css', 'src/css/components.css', 'src/css/layout.css', 'src/css/modules.css', 'src/css/sdp.css']));
    expect(FULLS).toEqual(expect.arrayContaining([...GLOBALS]));
    expect(DECLARATS_GLOBALS.size).toBeGreaterThan(200);
    expect(DECLARATS_GLOBALS.has('--sdp-text-cos')).toBe(true);
    expect(DECLARATS_GLOBALS.has('--sdp-touch-min'), 'la capa 0 (design-tokens.css) compta').toBe(true);
    expect([...CENS.values()].reduce((n, c) => n + c.usos.size, 0)).toBeGreaterThan(500);
  });

  test('cap token fantasma: tot var(--sdp-*) dels fulls té una declaració', () => {
    const linies = [
      `FULLS DE LA CASCADA (${FULLS.length}): ${FULLS.join(' ')}`,
      `TOKENS GLOBALS DECLARATS: ${DECLARATS_GLOBALS.size} · TOKENS QUE POSA EL CODI: ${CODI.size}`,
      `FANTASMES (${FANTASMES.length}):`,
      ...FANTASMES.map((f) => `  ${f}`),
      `DECLARATS NOMÉS A UN ALTRE FULL DE LA CASCADA (${D_ALTRE_FULL.length}):`,
      ...D_ALTRE_FULL.map((f) => `  ${f}`),
      `DECLARATS NOMÉS PEL CODI (${DEL_CODI.size}):`,
      ...[...DEL_CODI.keys()].sort().map((t) => `  ${t} · ${DEL_CODI.get(t).join(' ')} · ${[...CODI.get(t)].join(' ')}`)
    ];
    const sobrers = [...INSTANTANIA_CODI].filter((t) => !DEL_CODI.has(t)).sort();
    if (sobrers.length) linies.push(`JA NO DEPENEN NOMÉS DEL CODI (traieu-los de la instantània): ${sobrers.join(' ')}`);
    console.log(linies.join('\n'));
    expect(FANTASMES, 'tokens --sdp-* usats sense cap declaració (tokens.css, el mateix full, un altre full o el codi)').toEqual([]);
  });

  test('instantània: cap dependència nova d’un token que només posa el codi', () => {
    const nous = [...DEL_CODI.keys()].filter((t) => !INSTANTANIA_CODI.has(t)).sort();
    expect(nous, 'tokens que un full consumix i només el JSX declara: afegiu-los a la instantània a consciència').toEqual([]);
  });
});
