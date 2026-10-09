// @vitest-environment node
/** Corredor del laboratori 261009_1245_onada7_claude (Onada 7, front d'incidències de
 *  taxonomia i d'higiene).
 *
 *  T1 · deliverContext (turns.mjs) rebutja el nom d'un prompt o d'un pla que no és de la ruta
 *       abans d'emetre cap rebut, i handoffDocument no el torna a lligar a un nom d'una altra
 *       ruta. La porta de plantilla viva diu el prefix del nom i, en recuperar, proposa un nom
 *       que context admet. Un id de ruta usat com a categoria («planificacio_x», O13 del 261002)
 *       es vigila i no admet cap ruta.
 *  T2 · draft-write ancora les actes de fora del primer nivell a la seua secció, i no al final
 *       de l'índex, que ara és «## Arxivat amb la Porta Olivera». import.mjs passa per la
 *       mateixa àncora.
 *
 *  El paquet viu a `02_investigacio_ia/261009_1245_onada7_claude/`: substitucions exactes sobre
 *  els fitxers instal·lats (nous/substitucions.json), còpies de lectura (nous/<ruta>.txt) i
 *  prepara-pla.mjs. L'aplicarà el Mestre amb executor-mutacio.mjs i una lease. Mentre no
 *  s'aplique, este corredor:
 *    · comprova que cada substitució casa una sola vegada amb el disc d'ara, que les còpies de
 *      lectura en són el resultat (byte a byte, llevat d'un espai final que l'eina d'escriptura
 *      no conserva i que es declara) i que prepara-pla.mjs fa un pla que l'executor valida i
 *      una Petorreta que el seal accepta;
 *    · passa node --check i l'ESLint del repositori pel codi resultant;
 *    · munta dues còpies del repositori a os.tmpdir() (base i paquet), hi reproduïx les dues
 *      incidències amb la CLI real ([DEFECTE] a la base, reparada al paquet) i hi executa amb
 *      `node --test` la bateria del circuit documental: cap fallada nova i les proves noves verdes.
 *  Patró: tests/laboratori-olivera-261006.test.js i tests/laboratori-higiene-261009.test.js.
 *  Cap prova escriu fora d'os.tmpdir(); de 90_arxiu_historic no es copia res. Es retira sol
 *  (skip) si el laboratori ja no hi és (arxivat), si l'executor n'ha deixat la transacció
 *  (operationId `sdp-onada7-taxonomia-261009-*`) o si tots els fitxers ja són els del paquet.
 *  Amb deriva no es retira: la segona prova ix roja i diu quin fitxer i el seu sha, perquè el
 *  paquet s'ha de refer abans d'aplicar-lo, i les que en depenen se salten.
 */
import { afterAll, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1245_onada7_claude';
const LAB = path.join(REPO, REL_LAB);
const HI_HA_LAB = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));
const pla = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;
const llig = (abs) => fs.readFileSync(abs, 'utf8');
const url = (abs) => pathToFileURL(abs).href;

let ERROR_PAQUET = null;
let SUBST = [];
let ESTAT = [];
const TRANSACCIO = HI_HA_LAB ? pla.transaccio(REPO) : null;
if (HI_HA_LAB && !TRANSACCIO) {
  try {
    SUBST = pla.substitucions();
    ESTAT = pla.estat(REPO, { subst: SUBST });
  } catch (error) { ERROR_PAQUET = error; }
}
const APLICAT = ESTAT.length > 0 && ESTAT.every((f) => f.estat === 'aplicat');
const ACTIU = HI_HA_LAB && !TRANSACCIO && !APLICAT;
/** Amb deriva o amb un paquet il·legible, les dues primeres proves ixen roges i diuen per què; la resta
 *  depén d'un paquet que no s'aplica i se salta, perquè petaria sense dir res de nou. */
const ambPaquet = test.skipIf(Boolean(ERROR_PAQUET) || ESTAT.some((f) => f.estat === 'deriva'));

const DESK = '_wiki_de_poble/04_escriptori';
const INDEX = `${DESK}/00_index_escriptori.md`;
/** El cas real de MarIA (261009): un nom de «planificacio» amb la ruta pla.implementacio. */
const NOM_DOLENT = `${DESK}/261009_1203_pla_onada7.md`;
const temporals = [];
afterAll(() => { for (const d of temporals) fs.rmSync(d, { recursive: true, force: true }); });

function nouDir(prefix) {
  const d = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
  temporals.push(d);
  return d;
}
function posa(arrel, rel, contingut) {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), contingut);
}
/** Entorn per als processos fills: sense les variables de vitest ni una arrel imposada. */
function entorn() {
  return Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(?:VITEST|SDP_ARREL$|CLAUDE_PROJECT_DIR$|NODE_OPTIONS$|NODE_ENV$|TEST$|NODE_TEST_CONTEXT$)/.test(k)));
}

/* ── Còpies del repositori (base i paquet) ─────────────────────────────────── */

const WIKI = ['00_index.md', '01_ser', '02_saber', '03_actuar', '10_actes'];
const ARREL_SOLTS = ['AGENTS.md', 'CLAUDE.md', 'package.json', 'eslint.config.js', '.gitignore'];
/** El nucli de tractors que una prova de laboratori contrasta amb el seu. */
const CODI = ['src/sections/tractors', 'src/data'];
const INVESTIGACIO = `${DESK}/02_investigacio_ia`;

/** Aplica el paquet sobre una còpia: les substitucions de cada fitxer, amb la mateixa funció que el pla. */
function aplicaPaquet(dir) {
  for (const s of SUBST) {
    const abs = path.join(dir, s.ruta);
    fs.writeFileSync(abs, pla.aplicaCanvis(s.ruta, llig(abs), s.canvis).contingut);
  }
}

/**
 * Còpia del repositori per a la bateria: tooling/, tests/, scripts/, .agents/ sense els
 * registres de runtime, .claude, .codex i .husky, la part viva de la Wiki (mai l'arxiu ni els
 * documents de l'Escriptori, només les carpetes de laboratori que lligen les proves, sense este),
 * node_modules enllaçat i un git propi perquè els hooks de Codex es localitzen.
 */
function construeix(prefix, ambPaquet) {
  const dir = nouDir(prefix);
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store|\.git)$/.test(src) && !src.includes(`${path.sep}.agents${path.sep}runtime`);
  const copia = (rel) => {
    if (!fs.existsSync(path.join(REPO, rel))) return;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.cpSync(path.join(REPO, rel), path.join(dir, rel), { recursive: true, filter: fora, verbatimSymlinks: true });
  };
  for (const rel of ['tooling', 'tests', 'scripts', '.agents', '.claude', '.codex', '.husky', ...ARREL_SOLTS, ...CODI]) copia(rel);
  for (const rel of WIKI) copia(`_wiki_de_poble/${rel}`);
  fs.mkdirSync(path.join(dir, INVESTIGACIO), { recursive: true });
  for (const e of fs.readdirSync(path.join(REPO, INVESTIGACIO), { withFileTypes: true })) {
    if (e.isDirectory() && `${INVESTIGACIO}/${e.name}` !== REL_LAB) copia(`${INVESTIGACIO}/${e.name}`);
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  if (ambPaquet) aplicaPaquet(dir);
  return dir;
}
let BASE = null;
let PAQUET = null;
const laBase = () => { BASE ??= construeix('sdp-onada7-261009-base-', false); return BASE; };
const elPaquet = () => { PAQUET ??= construeix('sdp-onada7-261009-paquet-', true); return PAQUET; };

/**
 * Mas documental mínim (com tests/helpers/documental.mjs): el contracte del repositori, l'índex
 * que es passa, el marcador d'arrel i un torn obert escrit a mà. Torna { arrel, torn }.
 */
function mas(index) {
  const arrel = nouDir('sdp-onada7-261009-mas-');
  const router = JSON.parse(llig(path.join(REPO, '.agents/protocolledge.json')));
  for (const rel of ['.agents/protocolledge.json', 'tooling/wiki/schema.json', ...router.rutes.map((r) => r.plantilla)]) posa(arrel, rel, fs.readFileSync(path.join(REPO, rel)));
  posa(arrel, '.agents/AGENTS.md', '# marcador\n');
  posa(arrel, '.agents/ESTAT.md', '# Estat\n');
  posa(arrel, '.agents/LEDGER.md', '# Ledger\n');
  posa(arrel, INDEX, index);
  const torn = `torn_${randomUUID()}`;
  const ara = Date.now();
  posa(arrel, `.agents/runtime/turns/${torn}.json`, `${JSON.stringify({
    schema: 'sdp.turn.v1', turn_id: torn, actor: 'prova', scope: 'documents', state: 'opened', revision: 0,
    createdAt: new Date(ara).toISOString(), updatedAt: new Date(ara).toISOString(),
    expiresAt: new Date(ara + 3600000).toISOString(), receipts: {}, initial: {}, history: [],
  }, null, 2)}\n`);
  return { arrel, torn };
}
const registre = (m) => JSON.parse(llig(path.join(m.arrel, `.agents/runtime/turns/${m.torn}.json`)));
/** La CLI real de document.mjs d'una còpia, sobre un mas. */
const documentCli = (copia, m, args) => spawnSync(process.execPath, [path.join(copia, 'tooling/wiki/document.mjs'), ...args, `--arrel=${m.arrel}`, `--turn-id=${m.torn}`],
  { cwd: m.arrel, env: entorn(), encoding: 'utf8', timeout: 30000 });

/* ── La bateria ────────────────────────────────────────────────────────────── */

/** Bateria fixa (la de l'encàrrec) més qualsevol prova que toque el circuit documental, i les del paquet. */
const FIXES = ['documental', 'porta-olivera-v3', 'cognitive-preflight', 'document-command-policy', 'porta-taxonomia',
  'plantilla-viva-escriptori', 'hooks-local', 'plantilla-viva-installacio', 'antigravity-hook'].map((n) => `tests/${n}.test.mjs`);
function bateria() {
  const patro = /deliverContext|createDraft|writeIndexedDraft|handoffDocument|importDocument|porta-plantilla-viva|helpers\/documental|documental\/(?:core|turns|draft-write|import)\.mjs/;
  const trobades = fs.readdirSync(path.join(REPO, 'tests')).filter((n) => n.endsWith('.test.mjs'))
    .filter((n) => patro.test(llig(path.join(REPO, 'tests', n)))).map((n) => `tests/${n}`);
  const delPaquet = SUBST.map((s) => s.ruta).filter((r) => r.startsWith('tests/'));
  return [...new Set([...FIXES, ...trobades, ...delPaquet])].filter((f) => fs.existsSync(path.join(REPO, f))).sort();
}

/** El reporter TAP escapa «#» i «\» dels noms; les claus es comparen amb el nom de la prova. */
const desescapa = (nom) => nom.replace(/\\([\\#])/g, '$1');

/** Resultats TAP per prova: clau «pare › fill» i estat pass, fail, skip o todo. */
function llegeixTap(text, arrel) {
  const resultats = new Map();
  const vistos = new Map();
  const pila = [];
  for (const linia of text.split('\n')) {
    const sub = /^( *)# Subtest: (.*)$/.exec(linia);
    if (sub) { pila.length = Math.floor(sub[1].length / 4); pila.push(desescapa(sub[2])); continue; }
    const m = /^( *)(not ok|ok) \d+ - (.*)$/.exec(linia);
    if (!m) continue;
    let nom = m[3];
    let estat = m[2] === 'ok' ? 'pass' : 'fail';
    const directiva = / # (SKIP|TODO)\b.*$/.exec(nom);
    if (directiva) { nom = nom.slice(0, directiva.index); estat = directiva[1] === 'SKIP' ? 'skip' : 'todo'; }
    nom = desescapa(nom);
    const clau = [...pila.slice(0, Math.floor(m[1].length / 4)), nom].join(' › ').split(arrel).join('<arrel>');
    const n = (vistos.get(clau) ?? 0) + 1;
    vistos.set(clau, n);
    resultats.set(n > 1 ? `${clau} #${n}` : clau, estat);
  }
  return resultats;
}

function corre(arrel, fitxer) {
  return new Promise((resolve) => {
    const fill = spawn(process.execPath, ['--test', '--test-reporter=tap', fitxer], { cwd: arrel, env: entorn(), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    fill.stdout.on('data', (tros) => { out += tros; });
    fill.stderr.on('data', (tros) => { err += tros; });
    const rellotge = setTimeout(() => fill.kill('SIGKILL'), 5 * 60 * 1000);
    fill.on('close', (codi) => { clearTimeout(rellotge); resolve({ fitxer, codi, resultats: llegeixTap(out, arrel), err, out }); });
  });
}

/** El diagnòstic YAML de les proves que fallen (TAP), per a dir per què sense tornar-les a córrer. */
function caigudes(eixida, limit = 3000) {
  const linies = eixida.out.split('\n');
  const trossos = [];
  linies.forEach((l, i) => {
    if (!/^ *not ok \d+ - /.test(l)) return;
    const final = linies.findIndex((m, j) => j > i && /^ *(?:ok|not ok) \d+ - |^ *# Subtest: /.test(m));
    trossos.push(linies.slice(i, final < 0 ? undefined : final).join('\n'));
  });
  return trossos.join('\n').slice(0, limit);
}

/** Executa totes les tasques amb un límit de processos alhora. */
async function enPiscina(tasques, limit) {
  const eixida = new Array(tasques.length);
  let seguent = 0;
  const treballador = async () => {
    while (seguent < tasques.length) {
      const i = seguent++;
      eixida[i] = await tasques[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasques.length) }, treballador));
  return eixida;
}

const compte = (execucions) => {
  const c = { pass: 0, fail: 0, skip: 0, todo: 0 };
  for (const e of execucions) for (const estat of e.resultats.values()) c[estat] += 1;
  return c;
};

/** Regressió: el que passava ja no passa, o el que no fallava (skip, todo) ara falla. */
const regressa = (base, paquet) => (base === 'pass' && paquet !== 'pass') || (base !== 'fail' && paquet === 'fail');

/** Regressions i proves noves d'un fitxer de la bateria. */
function compara(f, b, p, ambProvesNoves) {
  const out = { regressions: [], noves: [] };
  for (const [clau, estat] of b) {
    if (regressa(estat, p.get(clau))) out.regressions.push(`${f} :: ${clau} (${estat}) → ${p.get(clau) ?? 'absent'}`);
  }
  for (const [clau, estat] of p) {
    if (b.has(clau)) continue;
    if (ambProvesNoves.has(f)) out.noves.push(`${estat} · ${f} :: ${clau}`);
    else if (estat === 'fail') out.regressions.push(`${f} :: ${clau} → fail (nova al paquet)`);
  }
  return out;
}

/** Les proves que porta el paquet: han d'aparéixer i passar a la còpia amb el paquet. */
const PROVES_NOVES = [
  'tests/documental.test.mjs :: nom i ruta: el motiu diu el prefix que ha de portar el nom, no un id de ruta com si fóra una categoria',
  'tests/documental.test.mjs :: nom i ruta: el nom que admet la ruta conserva data, hora i títol, i no se n’inventa cap si no en pot fer un de bo',
  'tests/documental.test.mjs :: O13 del 261002: un id de ruta usat com a categoria («planificacio_x») es vigila, no rep cap rebut i la porta diu el prefix',
  'tests/documental.test.mjs :: el relleu no lliga el rebut a un nom d’una altra ruta; el remei d’un rebut vell i l’arxivat amb el mateix nom sí que passen',
  'tests/documental.test.mjs :: la porta de plantilla viva, davant d’un rebut d’una altra ruta, recomana un nom que context admet i el reanomenat amb relleu',
  'tests/documental.test.mjs :: context i create rebutgen el nom d’un prompt o d’un pla que no és de la ruta, sense emetre cap rebut; el nom bo passa',
  'tests/documental.test.mjs :: la porta de plantilla viva para un rebut d’abans de la guarda i diu el prefix del nom',
  'tests/cognitive-preflight.test.mjs :: Onada 7 (261009) · fora del primer nivell, l’àncora no cau dins de «## Arxivat amb la Porta Olivera» i sobreviu a la poda',
  'tests/cognitive-preflight.test.mjs :: Onada 7 (261009) · import ancora com create: al primer nivell, a «Activitat en curs», i fora, a la seua secció; mai dins dels arxivats',
];

describe.skipIf(!ACTIU)('laboratori 261009_1245_onada7_claude', () => {
  /* ── El paquet ──────────────────────────────────────────────────────────── */

  test('el paquet es llig sencer: només .txt, .json i .mjs, cap .md, i cada fitxer és de la superfície declarada', () => {
    expect(ERROR_PAQUET?.message ?? null).toBeNull();
    const tots = [];
    (function recorre(rel) {
      for (const e of fs.readdirSync(path.join(LAB, rel), { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) recorre(r); else tots.push(r);
      }
    })('');
    expect(tots.filter((f) => /\.md$/i.test(f))).toEqual([]);
    expect(tots.filter((f) => !/\.(?:txt|mjs|json)$/.test(f) && path.basename(f) !== '.DS_Store')).toEqual([]);
    expect(SUBST.map((s) => s.ruta).sort()).toEqual([
      'tests/cognitive-preflight.test.mjs', 'tests/documental.test.mjs', 'tests/plantilla-viva-installacio.test.mjs', 'tests/porta-olivera-v3.test.mjs',
      'tooling/documental/core.mjs', 'tooling/documental/draft-write.mjs', 'tooling/documental/import.mjs', 'tooling/documental/turns.mjs',
      'tooling/gates/porta-plantilla-viva.mjs',
    ]);
    // Cap còpia de lectura d'un fitxer que no és del paquet.
    const copies = tots.filter((f) => f.startsWith('nous/') && f.endsWith('.txt')).map((f) => f.slice('nous/'.length, -'.txt'.length));
    expect(copies.filter((r) => !SUBST.some((s) => s.ruta === r))).toEqual([]);
  });

  test('cada substitució casa una sola vegada amb el disc d’ara: estat pendent i cap deriva', () => {
    const deriva = ESTAT.filter((f) => f.estat !== 'pendent').map((f) => `${f.ruta}: ${f.estat} · ${f.motiu ?? ''} · sha actual ${f.before}`);
    expect(deriva, deriva.join('\n')).toEqual([]);
    expect(ESTAT.map((f) => f.ruta).sort()).toEqual(SUBST.map((s) => s.ruta).sort());
    for (const s of SUBST) {
      const ara = llig(path.join(REPO, s.ruta));
      for (const c of s.canvis) expect(pla.ocurrencies(ara, c.abans), `${s.ruta}: ${c.motiu}`).toBe(1);
      // Aplicar dues vegades no canvia res: el segon pas ho veu aplicat.
      const una = pla.aplicaCanvis(s.ruta, ara, s.canvis);
      const dues = pla.aplicaCanvis(s.ruta, una.contingut, s.canvis);
      expect([una.pendents, dues.pendents, dues.aplicats], s.ruta).toEqual([s.canvis.length, 0, s.canvis.length]);
      expect(dues.contingut, s.ruta).toBe(una.contingut);
    }
    // Deriva de veres: un ancoratge que ja no hi és, o que hi és dues vegades, i una aplicació a mitges.
    const [primer] = SUBST;
    const ara = llig(path.join(REPO, primer.ruta));
    expect(() => pla.aplicaCanvis(primer.ruta, ara.replace(primer.canvis[0].abans, ''), primer.canvis)).toThrow(/refeu el paquet/);
    expect(() => pla.aplicaCanvis(primer.ruta, `${ara}${primer.canvis[0].abans}`, primer.canvis)).toThrow(/refeu el paquet/);
    const ambDos = SUBST.find((s) => s.canvis.length > 1);
    const mig = pla.aplicaCanvis(ambDos.ruta, llig(path.join(REPO, ambDos.ruta)), ambDos.canvis.slice(0, 1)).contingut;
    expect(() => pla.aplicaCanvis(ambDos.ruta, mig, ambDos.canvis)).toThrow(/a mitges/);
  });

  ambPaquet('les còpies de lectura són el resultat de les substitucions, byte a byte llevat d’un espai final declarat (els cinc fitxers de tooling en porten)', () => {
    const divergents = [];
    for (const f of ESTAT.filter((x) => x.lectura === 'DIFERIX')) {
      const copia = llig(path.join(pla.NOUS, `${f.ruta}.txt`)).split('\n');
      const nou = f.contingut.split('\n');
      const i = nou.findIndex((l, n) => l !== copia[n]);
      divergents.push(`${f.ruta}: línia ${i + 1}\n  còpia: ${JSON.stringify(copia[i])}\n  paquet: ${JSON.stringify(nou[i])}`);
    }
    expect(divergents, divergents.join('\n')).toEqual([]);
    // Cada fitxer de tooling porta còpia. L'única diferència tolerada és la que l'eina d'escriptura no
    // pot conservar: l'espai final de la línia en blanc de turns.mjs (quatre espais, la 381 amb el paquet).
    const lectures = Object.fromEntries(ESTAT.filter((f) => f.ruta.startsWith('tooling/')).map((f) => [f.ruta, f.lectura]));
    expect(lectures).toEqual({
      'tooling/documental/core.mjs': 'coincidix',
      'tooling/documental/draft-write.mjs': 'coincidix',
      'tooling/documental/import.mjs': 'coincidix',
      'tooling/documental/turns.mjs': 'coincidix llevat dels espais finals (línies 381)',
      'tooling/gates/porta-plantilla-viva.mjs': 'coincidix',
    });
    for (const f of ESTAT) expect(pla.mostra(REPO, f.ruta), f.ruta).toBe(f.contingut);
  });

  ambPaquet('el codi resultant passa node --check i l’ESLint del repositori sense missatges nous, i turns.mjs no importa la porta (cap cicle)', async () => {
    const { ESLint } = await import('eslint');
    const eslint = new ESLint({ cwd: REPO });
    const missatges = async (text, rel) => (await eslint.lintText(text, { filePath: path.join(REPO, rel) }))[0].messages
      .map((m) => `${rel}:${m.line} ${m.severity === 2 ? 'error' : 'avís'} ${m.ruleId} ${m.message}`);
    const problemes = [];
    const generats = nouDir('sdp-onada7-261009-check-');
    for (const f of ESTAT) {
      posa(generats, f.ruta, f.contingut);
      const r = spawnSync(process.execPath, ['--check', path.join(generats, f.ruta)], { encoding: 'utf8' });
      if (r.status !== 0) problemes.push(`${f.ruta}: ${r.stderr}`);
      const ara = await missatges(f.contingut, f.ruta);
      const abans = await missatges(llig(path.join(REPO, f.ruta)), f.ruta);
      problemes.push(...ara.filter((m) => / error /.test(m)));
      if (ara.length > abans.length) problemes.push(`${f.ruta}: avisos nous\n${ara.join('\n')}`);
    }
    // També els corredors vells que este front ha tocat: les seues proves d'ESLint salten per superació.
    const delFront = [`${REL_LAB}/prepara-pla.mjs`, 'tests/laboratori-onada7-261009.test.js', 'tests/olivera-arxiva-261002.test.mjs',
      'tests/laboratori-higiene-261006.test.js', 'tests/laboratori-olivera-261006.test.js'];
    for (const rel of delFront) problemes.push(...await missatges(llig(path.join(REPO, rel)), rel));
    expect(problemes, problemes.join('\n')).toEqual([]);
    // Cap cicle: core.mjs no guanya cap import, i turns.mjs només en guanya de ./core.mjs. import.mjs en
    // guanya un de ./draft-write.mjs, que no importa ni turns.mjs ni import.mjs.
    const imports = (text) => [...text.matchAll(/^import\s[\s\S]*?\sfrom\s+'([^']+)';/gm)].map((m) => m[1]).sort();
    const nou = (ruta) => ESTAT.find((f) => f.ruta === ruta).contingut;
    for (const ruta of ['tooling/documental/core.mjs', 'tooling/documental/turns.mjs', 'tooling/documental/draft-write.mjs']) {
      expect(imports(nou(ruta)), ruta).toEqual(imports(llig(path.join(REPO, ruta))));
    }
    expect(imports(nou('tooling/documental/import.mjs'))).toEqual([...imports(llig(path.join(REPO, 'tooling/documental/import.mjs'))), './draft-write.mjs'].sort());
    expect(imports(nou('tooling/documental/draft-write.mjs'))).not.toContain('./turns.mjs');
    expect(nou('tooling/documental/turns.mjs')).not.toMatch(/porta-plantilla-viva/);
  }, 180000);

  ambPaquet('prepara-pla.mjs: pla que l’executor valida, Petorreta que el seal accepta, manifest sense dades sensibles, i es nega si el paquet ja hi és', async () => {
    const { plan, targets, scopes } = await pla.preparaPla(REPO);
    expect(plan.schema).toBe('sdp.mutation.v1');
    expect(plan.operationId.startsWith(pla.OPERACIO)).toBe(true);
    expect(targets.sort()).toEqual(ESTAT.map((f) => f.ruta).sort());
    expect(scopes.length).toBeGreaterThan(0);
    for (const f of plan.files) {
      const e = ESTAT.find((x) => x.ruta === f.path);
      expect(f.before, f.path).toBe(e.before);
      expect(f.content, f.path).toBe(e.contingut);
    }
    const { validatePetorreta } = await import(url(path.join(REPO, 'tooling/wiki/reflex_petorreta.mjs')));
    const text = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: '0'.repeat(64), rulesSha256: '0'.repeat(64), planSha256: '0'.repeat(64), targets });
    expect(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/x', pla.NOM_PETORRETA), text)).toEqual([]);
    const fonts = JSON.parse(pla.manifest()).sources;
    for (const f of fonts) expect(fs.existsSync(path.join(REPO, f.path)), f.path).toBe(true);
    expect([...pla.sensibles(text), ...pla.sensibles(pla.manifest()), ...fonts.flatMap((f) => pla.sensibles(llig(path.join(REPO, f.path))))]).toEqual([]);
    // Es nega amb la transacció del paquet, i quan el disc ja és el del paquet.
    const fet = nouDir('sdp-onada7-261009-fet-');
    posa(fet, `.agents/seal-transactions/${randomUUID()}.json`, JSON.stringify({ id: 't', state: 'accepted', operationId: `${pla.OPERACIO}abcd1234`, files: [] }));
    await expect(pla.preparaPla(fet, { validar: false })).rejects.toThrow(/ja aplicat per la transacció/);
    const aplicat = nouDir('sdp-onada7-261009-aplicat-');
    for (const f of ESTAT) posa(aplicat, f.ruta, f.contingut);
    expect(pla.estat(aplicat, { subst: SUBST }).every((f) => f.estat === 'aplicat')).toBe(true);
    await expect(pla.preparaPla(aplicat, { validar: false })).rejects.toThrow(/Res a aplicar/);
  }, 120000);

  /* ── Les dues incidències, amb la CLI real ──────────────────────────────── */

  ambPaquet('T1 · document.mjs context i create: a la base, el nom del 261009_1203 rep rebut [DEFECTE]; amb el paquet, cap rebut i el motiu diu el prefix', () => {
    const args = ['--route=pla.implementacio', `--file=${NOM_DOLENT}`];
    const indexBuit = '---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n';
    // [DEFECTE] reproduït a la base: el rebut naix lligat al nom dolent.
    const b = mas(indexBuit);
    const ctxBase = documentCli(laBase(), b, ['context', ...args]);
    expect(ctxBase.status, ctxBase.stderr).toBe(0);
    expect(Object.values(registre(b).receipts).map((r) => [r.route, r.file])).toEqual([['pla.implementacio', NOM_DOLENT]]);
    // Amb el paquet: context i create ixen amb 1, no emeten cap rebut ni deixen cap fitxer.
    const p = mas(indexBuit);
    const abans = registre(p);
    const motiu = 'Nom i ruta incoherents (cap rebut emés): un nom «pla_…» és de la ruta «planificacio». Per a «pla.implementacio» el nom ha de començar per «aammdd_hhmm_pla_implementacio_…»';
    const ctx = documentCli(elPaquet(), p, ['context', ...args]);
    expect([ctx.status, ctx.stderr.trim()]).toEqual([1, motiu]);
    const crea = documentCli(elPaquet(), p, ['create', ...args, '--title=Pla', '--description=Pla de l’Onada 7']);
    expect([crea.status, crea.stderr.trim()]).toEqual([1, motiu]);
    expect(registre(p)).toEqual(abans);
    expect(fs.existsSync(path.join(p.arrel, NOM_DOLENT))).toBe(false);
    expect(llig(path.join(p.arrel, INDEX))).toBe(indexBuit);
    // El nom bo, amb la mateixa ruta, naix: el pla de l'Onada 7 que MarIA va acabar fent.
    const bo = documentCli(elPaquet(), p, ['create', '--route=pla.implementacio', `--file=${DESK}/261009_1216_pla_implementacio_onada7.md`, '--title=Pla', '--description=Pla de l’Onada 7']);
    expect(bo.status, bo.stderr).toBe(0);
    expect(Object.values(registre(p).receipts).map((r) => r.file)).toEqual([`${DESK}/261009_1216_pla_implementacio_onada7.md`]);

    // La recuperació que imprimix la porta davant del document del 261009_1203, amb el seu rebut.
    const recupera = (copia, m) => {
      const r = spawnSync(process.execPath, [path.join(copia, 'tooling/gates/porta-plantilla-viva.mjs'), '--fitxer', NOM_DOLENT],
        { cwd: m.arrel, env: { ...entorn(), SDP_ARREL: m.arrel }, encoding: 'utf8', timeout: 30000 });
      expect(r.status, r.stderr).toBe(1);
      return r.stderr;
    };
    // [DEFECTE] a la base: torna a proposar context amb el nom vell, que el paquet rebutja.
    expect(documentCli(laBase(), b, ['create', ...args, '--title=Pla', '--description=Pla de l’Onada 7']).status).toBe(0);
    expect(recupera(laBase(), b)).toContain(`--route pla.implementacio --file ${NOM_DOLENT}`);
    // Amb el paquet, sobre un rebut d'abans de la guarda (naix amb la ruta del nom i es reescriu com el
    // del 261009_1203): el nom que context admet, i primer el reanomenat amb relleu.
    const v = mas(indexBuit);
    expect(documentCli(elPaquet(), v, ['create', '--route=planificacio', `--file=${NOM_DOLENT}`, '--title=Pla', '--description=Pla de l’Onada 7']).status).toBe(0);
    const tornV = path.join(v.arrel, `.agents/runtime/turns/${v.torn}.json`);
    const vell = JSON.parse(llig(tornV));
    for (const r of Object.values(vell.receipts)) if (r.file === NOM_DOLENT) r.route = 'pla.implementacio';
    fs.writeFileSync(tornV, `${JSON.stringify(vell, null, 2)}\n`);
    const nomBo = `${DESK}/261009_1203_pla_implementacio_onada7.md`;
    const consell = recupera(elPaquet(), v);
    expect(consell).toContain(`node tooling/gates/porta-olivera.mjs --renomena ${path.basename(NOM_DOLENT)} --a ${path.basename(nomBo)}`);
    expect(consell).toContain(`node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${nomBo}`);
    expect(consell).not.toContain(`--file ${NOM_DOLENT}`);
    const segueix = documentCli(elPaquet(), v, ['context', '--route=pla.implementacio', `--file=${nomBo}`]);
    expect(segueix.status, segueix.stderr).toBe(0);
  }, 300000);

  ambPaquet('T2 · document.mjs create d’una acta: a la base, l’àncora cau dins dels arxivats i la poda la perd [DEFECTE]; amb el paquet, va a la seua secció', () => {
    const arxivats = '## Arxivat amb la Porta Olivera\n\n- [[../90_arxiu_historic/250101_0900_auditoria_vella]]\n';
    const index = `---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n\n## Activitat en curs\n\n${arxivats}`;
    const acta = '_wiki_de_poble/10_actes/261009_1216_acta_marmota.md';
    const ancora = '- [[../10_actes/261009_1216_acta_marmota]]';
    const args = ['create', '--route=acta', `--file=${acta}`, '--title=Acta', '--description=Acta viva de prova'];
    const poda = (text) => text.replace(/^## Arxivat amb la Porta Olivera\n\n(?:- [^\n]*\n)*/m, '');
    const b = mas(index);
    const base = documentCli(laBase(), b, args);
    expect(base.status, base.stderr).toBe(0);
    const ambBase = llig(path.join(b.arrel, INDEX));
    expect(ambBase).toBe(`${index}${ancora}\n`);
    expect(poda(ambBase)).not.toContain(ancora);
    const p = mas(index);
    const paquet = documentCli(elPaquet(), p, args);
    expect(paquet.status, paquet.stderr).toBe(0);
    const ambPaquet = llig(path.join(p.arrel, INDEX));
    expect(ambPaquet).toBe(`${index}\n## Actes i documents fora de la taula\n\n${ancora}\n`);
    expect(poda(ambPaquet)).toContain(ancora);
  }, 300000);

  ambPaquet('T2 · document.mjs import: a la base, l’àncora del document importat cau dins dels arxivats [DEFECTE]; amb el paquet, va on la posa create', () => {
    const arxivats = '## Arxivat amb la Porta Olivera\n\n- [[../90_arxiu_historic/250101_0900_auditoria_vella]]\n';
    const index = `---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n\n## Activitat en curs\n\n${arxivats}`;
    const llegat = `${DESK}/261009_1250_auditoria_llegat.md`;
    const ancora = '- [[261009_1250_auditoria_llegat]]';
    const args = ['import', '--route=auditoria', `--file=${llegat}`, '--title=Llegat', '--description=Importació de prova'];
    const antic = '---\ntype: document\nstatus: esborrany\ndescription: Document antic de prova\n---\n# Antic\n\nText antic.\n';
    /** Secció («## …») on cau una línia de l'índex. */
    const seccioDe = (text, linia) => {
      const i = text.indexOf(`\n${linia}\n`);
      return i < 0 ? null : [...text.slice(0, i).matchAll(/^## (.+)$/gm)].pop()?.[1] ?? null;
    };
    const b = mas(index);
    posa(b.arrel, llegat, antic);
    const base = documentCli(laBase(), b, args);
    expect(base.status, base.stderr).toBe(0);
    const ambBase = llig(path.join(b.arrel, INDEX));
    expect(ambBase).toBe(`${index}\n${ancora}\n`);
    expect(seccioDe(ambBase, ancora)).toBe('Arxivat amb la Porta Olivera');
    const p = mas(index);
    posa(p.arrel, llegat, antic);
    const paquet = documentCli(elPaquet(), p, args);
    expect(paquet.status, paquet.stderr).toBe(0);
    const ambPaquet = llig(path.join(p.arrel, INDEX));
    expect(ambPaquet).toBe(index.replace('## Activitat en curs\n\n', `## Activitat en curs\n\n${ancora}\n`));
    expect(seccioDe(ambPaquet, ancora)).toBe('Activitat en curs');
  }, 300000);

  /* ── La bateria ─────────────────────────────────────────────────────────── */

  ambPaquet('la bateria del circuit documental: cap fallada nova respecte de la còpia sense paquet i les proves noves verdes', async () => {
    const fitxers = bateria();
    const base = laBase();
    const paquet = elPaquet();
    const tasques = fitxers.flatMap((f) => [() => corre(base, f), () => corre(paquet, f)]);
    const eixides = await enPiscina(tasques, 3);
    const deBase = new Map(eixides.filter((_, i) => i % 2 === 0).map((e) => [e.fitxer, e]));
    const delPaquet = new Map(eixides.filter((_, i) => i % 2 === 1).map((e) => [e.fitxer, e]));
    const ambProvesNoves = new Set(SUBST.map((s) => s.ruta).filter((r) => r.startsWith('tests/')));
    const dubtosos = (f) => {
      const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
      return c.regressions.length > 0 || c.noves.some((n) => !n.startsWith('pass'));
    };
    // Una caiguda del paquet es repetix una sola vegada, en sèrie, abans de declarar-la:
    // un timeout per càrrega no és una regressió. La segona execució mana.
    const repetits = fitxers.filter(dubtosos);
    for (const f of repetits) delPaquet.set(f, await corre(paquet, f));
    const regressions = [];
    const noves = [];
    for (const f of fitxers) {
      const c = compara(f, deBase.get(f).resultats, delPaquet.get(f).resultats, ambProvesNoves);
      regressions.push(...c.regressions);
      noves.push(...c.noves);
    }
    const cb = compte([...deBase.values()]);
    const cp = compte([...delPaquet.values()]);
    const resum = `Bateria de ${fitxers.length} fitxers. Base: ${cb.pass} pass · ${cb.fail} fail · ${cb.skip} skip. Paquet: ${cp.pass} pass · ${cp.fail} fail · ${cp.skip} skip. Proves noves: ${noves.length}. Repetits en sèrie: ${repetits.length ? repetits.join(', ') : 'cap'}.`;
    const detall = fitxers.map((f) => {
      const [b, p] = [compte([deBase.get(f)]), compte([delPaquet.get(f)])];
      return `${f}: base ${b.pass}/${b.fail}/${b.skip} · paquet ${p.pass}/${p.fail}/${p.skip} (pass/fail/skip)`;
    });
    console.log(`[laboratori onada7 261009] ${resum}`);
    for (const l of [...detall, ...noves.map((n) => `nova: ${n}`)]) console.log(`[laboratori onada7 261009]   ${l}`);
    // Vitest no mostra la consola d'una prova verda: el resum queda també a os.tmpdir().
    try { fs.writeFileSync(path.join(os.tmpdir(), 'sdp-laboratori-onada7-261009.txt'), `${[resum, ...detall, ...noves].join('\n')}\n`); } catch { /* el resum no decidix res */ }
    expect(fitxers.every((f) => deBase.get(f).resultats.size > 0), 'cada fitxer ha de produir resultats a la base').toBe(true);
    const perque = [...new Set([...regressions, ...noves.filter((n) => !n.startsWith('pass'))].map((r) => /tests\/[^ ]+\.test\.mjs/.exec(r)[0]))]
      .map((f) => `${f}\n${caigudes(delPaquet.get(f))}`).join('\n');
    expect(regressions, `${resum}\n${regressions.join('\n')}\n${perque}`).toEqual([]);
    expect(noves.filter((n) => !n.startsWith('pass')), `${resum}\n${perque}`).toEqual([]);
    for (const nom of PROVES_NOVES) expect(noves, nom).toContain(`pass · ${nom}`);
  }, 20 * 60 * 1000);
});
