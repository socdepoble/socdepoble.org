#!/usr/bin/env node
/**
 * tractor-cadena.mjs — la porta que vigila les portes.
 *
 * PER QUÈ EXISTIX
 * ───────────────
 * Totes les portes de `tooling/gates/` vigilen el codi. Cap vigila la CADENA
 * que les executa. L'auditoria 260831 (Seient Núm. 5) va trobar tres forats
 * que cap porta individual pot veure perquè només són visibles des de dalt:
 *
 *   1. `npm run porta` és un `&&` en cadena. El segon baladre és
 *      `porta:promesa`, que s'atura amb codi 1 si no hi ha '.agents/deute/.promesa-deute.json'
 *      («PARAT. Executa una vegada: --baseline»). Eixe fitxer no existix. Per
 *      tant les 24 portes següents NO S'HAN EXECUTAT MAI en eixa cadena, i
 *      `npm run build` —que crida `npm run gate`— mor abans de construir.
 *      Una cadena que peta al segon baladre dóna la mateixa sensació de
 *      seguretat que una que passa: roig és roig, i s'acaba ignorant.
 *
 *   2. `tooling/gates/rossec.mjs` existix al disc i cap script l'invoca. Una
 *      porta que ningú obri no és una porta: és un fitxer.
 *
 *   3. `porta:baseline` i `porta:build` estan definides i fora de la cadena.
 *      Pot ser deliberat (són d'inicialització), però ha de ser DECLARAT, no
 *      deduït per qui llija el `package.json` a les tres de la matinada.
 *
 * LLEIS
 *   C1  ORFE          porta al disc que cap script del package.json invoca
 *   C2  MORTA         script que invoca un fitxer de porta inexistent
 *   C3  PRERREQUISIT  la cadena exigix un fitxer de baseline que no existix
 *   C4  FORA          porta definida com a script i absent de la cadena, sense excusa declarada
 *   C5  DEPENDENCIA   una porta importa un paquet extern (viola Pedra Seca)
 *   C6  ORDRE         una porta que necessita baseline va abans de qui el genera
 *
 * EXCUSES DECLARADES
 * Una porta pot quedar fora de la cadena si es llista ací amb motiu. Això
 * convertix una omissió silenciosa en una decisió signada.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, eixida per stdout.
 *
 *   node tooling/gates/tractor-cadena.mjs
 *   node tooling/gates/tractor-cadena.mjs --json
 *   node tooling/gates/tractor-cadena.mjs --arrel=/ruta
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { arrelSegura, R, rel } from '../lib/arrel.mjs';

const JSON_OUT = process.argv.includes('--json');

let ARREL;
try {
  ARREL = arrelSegura();
} catch (e) {
  console.error(e.informe ? e.informe() : String(e));
  process.exit(1);
}

/* ═══════════════════════════ Configuració ═══════════════════════════ */

/** Script que constituïx la cadena canònica de portes. */
const CADENA = 'porta';

/**
 * Portes que poden quedar fora de la cadena, amb motiu. Editar ací és barat;
 * el que no pot passar és que una porta desaparega de la cadena sense que
 * ningú se n'adone.
 */
const EXCUSES = new Map([
  ['porta:baseline', 'Inicialització: genera baselines de deute. Es corre a mà una vegada, no a cada commit.'],
  ['porta:build', 'Preflight de build: el crida `npm run build`, no la cadena de portes.'],
]);

/**
 * Fitxers de deute que una porta pot exigir abans de poder certificar res.
 * Es descobrixen mecànicament al codi de cada porta; ací només es declara el
 * patró perquè la descoberta no depenga d'una llista escrita a mà.
 */
const PATRO_DEUTE = /['"`](\.[a-z0-9-]+-deute\.json)['"`]/gi;

/* ═══════════════════════════ Lectura ═══════════════════════════ */

/**
 * Passos declarats pel runner. S'importen; no es parsegen. Si el fitxer no
 * exporta res encara, la llista queda buida i les lleis C1/C4 ho diran.
 */
let PASSOS_RUNNER = [];
try {
  const mod = await import(pathToFileURL(R('tooling/gates/run-portes.mjs')).href);
  if (Array.isArray(mod.passos)) PASSOS_RUNNER = mod.passos;
} catch { /* runner absent o no importable: C1/C4 ho reportaran */ }

const problemes = [];
const avisos = [];
const falla = (llei, subjecte, missatge) => problemes.push({ llei, subjecte, missatge });
const avisa = (llei, subjecte, missatge) => avisos.push({ llei, subjecte, missatge });

const CAMI_PKG = R('package.json');
if (!fs.existsSync(CAMI_PKG)) {
  console.error('\n❌ [CADENA] Falta package.json. No hi ha cadena que auditar.\n');
  process.exit(1);
}

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(CAMI_PKG, 'utf8'));
} catch (e) {
  console.error(`\n❌ [CADENA] package.json no és JSON vàlid: ${e.message}\n`);
  process.exit(1);
}

const scripts = pkg.scripts || {};
const DIR_PORTES = R('tooling/gates');
const portesDisc = fs.existsSync(DIR_PORTES)
  ? fs.readdirSync(DIR_PORTES).filter((f) => f.endsWith('.mjs')).sort()
  : [];

/* ═════════════ Expansió de la cadena (resol `npm run X` recursiu) ═════════════ */

/**
 * Expandix un script resolent les crides `npm run X` fins a profunditat
 * limitada. Retorna la llista ordenada de baladres reals.
 */
function expandix(nom, vist = new Set(), profunditat = 0) {
  if (profunditat > 12 || vist.has(nom)) return [];
  vist.add(nom);
  const cos = scripts[nom];
  if (!cos) return [{ tipus: 'inexistent', nom }];

  const passos = [];
  
  /**
   * La cadena la declara `run-portes.mjs` i ací es LLIG IMPORTANT-LA, no
   * llegint-ne el text amb una expressió regular.
   *
   * V7.1: fins ara açò buscava el literal `args: ['run', 'X']` dins d'un
   * `const passos = [...]`. Qualsevol refactor del runner —canviar el nom de
   * la variable, passar a `{ script: 'porta:X' }`, partir la línia en dues—
   * deixava el parser sense trobar res i la cadena semblava buida. Un auditor
   * que depén de com estan escrites les cometes del fitxer auditat no és un
   * auditor. Ara `run-portes.mjs` exporta `passos` i és font única.
   */
  if (cos.includes('run-portes.mjs')) {
    for (const p of PASSOS_RUNNER) {
      const nom = p?.script ?? (Array.isArray(p?.args) && p.args[0] === 'run' ? p.args[1] : null);
      if (nom) {
        passos.push({ tipus: 'script', nom, ordre: passos.length });
        passos.push(...expandix(nom, vist, profunditat + 1));
      } else if (p?.cmd) {
        passos.push({ tipus: 'ordre', ordre: `${p.cmd} ${(p.args ?? []).join(' ')}` });
      }
    }
    if (PASSOS_RUNNER.length) return passos;
  }

  for (const tros of cos.split(/&&|\|\||;/).map((s) => s.trim()).filter(Boolean)) {
    const run = /^npm\s+run\s+([a-z0-9:_-]+)/i.exec(tros);
    if (run) {
      passos.push({ tipus: 'script', nom: run[1], ordre: passos.length });
      passos.push(...expandix(run[1], vist, profunditat + 1));
      continue;
    }
    passos.push({ tipus: 'ordre', ordre: tros });
  }
  return passos;
}

if (!scripts[CADENA]) {
  console.error(`\n❌ [CADENA] No hi ha script \`${CADENA}\` al package.json. La cadena canònica no existix.\n`);
  process.exit(1);
}

const passos = expandix(CADENA);
const cosCadena = passos.map((p) => p.ordre || '').join(' ') + ' ' + (scripts[CADENA] || '');

/** Portes efectivament invocades per la cadena (per nom de fitxer). */
const invocadesCadena = new Set();
for (const p of passos) {
  const font = p.tipus === 'script' ? (scripts[p.nom] || '') : String(p.ordre || '');
  for (const m of font.matchAll(/tooling\/gates\/([a-z0-9_-]+\.mjs)/gi)) invocadesCadena.add(m[1]);
}

/** Portes invocades per QUALSEVOL script (encara que siga fora de la cadena). */
const invocadesTot = new Map(); // fitxer → [scripts]
for (const [nom, cos] of Object.entries(scripts)) {
  for (const m of String(cos).matchAll(/tooling\/gates\/([a-z0-9_-]+\.mjs)/gi)) {
    if (!invocadesTot.has(m[1])) invocadesTot.set(m[1], []);
    invocadesTot.get(m[1]).push(nom);
  }
}

/* ═══════════════════ C1 · portes òrfenes ═══════════════════ */

for (const f of portesDisc) {
  if (invocadesTot.has(f)) continue;
  const abs = path.join(DIR_PORTES, f);
  const cos = fs.readFileSync(abs, 'utf8');
  // Una llibreria interna sense CLI no és una porta òrfena.
  const teCLI = /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/.test(cos)
    || /process\.exit\(/.test(cos);
  if (!teCLI) continue;
  falla('C1', `tooling/gates/${f}`,
    'Porta al disc que cap script del package.json invoca. Una porta que ningú obri no és una porta: és un fitxer que envelleix.');
}

/* ═══════════════════ C2 · scripts que apunten a no res ═══════════════════ */

for (const [f, quins] of invocadesTot) {
  if (portesDisc.includes(f)) continue;
  falla('C2', f, `Invocada per \`${quins.join('`, `')}\` i no existix a tooling/gates/. La cadena petarà en arribar-hi.`);
}

/* ═══════════════════ C7 · scripts declarats inexistents a package.json ═══════════════════ */

for (const p of PASSOS_RUNNER) {
  if (p.script && !scripts[p.script]) {
    falla('C7', p.script, `El runner de portes l'invoca explícitament (script: '${p.script}'), però no existix al package.json.`);
  }
}

/* ═══════════════════ C4 · definides i fora de la cadena ═══════════════════ */

for (const [nom, cos] of Object.entries(scripts)) {
  if (!nom.startsWith('porta:')) continue;
  const enCadena = passos.some((p) => p.tipus === 'script' && p.nom === nom);
  if (enCadena) continue;
  if (EXCUSES.has(nom)) {
    avisa('C4', nom, `Fora de la cadena amb motiu declarat: ${EXCUSES.get(nom)}`);
    continue;
  }
  falla('C4', nom, `Definida com a script i absent de \`npm run ${CADENA}\`, sense motiu declarat. O entra a la cadena o s'apunta a EXCUSES amb el perquè.`);
}

/* ═══════════════════ C3/C6 · prerequisits de baseline ═══════════════════ */

/*
 * Per a cada porta de la cadena, es busca al seu codi quins fitxers de deute
 * exigix. Si el fitxer no existix, eixa porta s'aturarà i decapitarà tota la
 * resta de la cadena (`&&`). Es reporta amb la posició exacta perquè es veja
 * quantes portes queden decapitades darrere.
 */
const ordreCadena = [];
for (const p of passos) {
  const font = p.tipus === 'script' ? (scripts[p.nom] || '') : String(p.ordre || '');
  for (const m of font.matchAll(/tooling\/gates\/([a-z0-9_-]+\.mjs)/gi)) {
    if (!ordreCadena.includes(m[1])) ordreCadena.push(m[1]);
  }
}

for (const [i, f] of ordreCadena.entries()) {
  const abs = path.join(DIR_PORTES, f);
  if (!fs.existsSync(abs)) continue;
  const cos = fs.readFileSync(abs, 'utf8');
  const exigits = new Set();
  for (const m of cos.matchAll(PATRO_DEUTE)) exigits.add(m[1]);

  for (const deute of exigits) {
    if (fs.existsSync(R(deute))) continue;
    const darrere = ordreCadena.length - i - 1;
    falla('C3', f,
      `Exigix \`${deute}\` i eixe fitxer no existix. La porta s'atura amb codi 1 i, com que la cadena és \`&&\`, decapita les ${darrere} portes que van darrere. Genera'l una vegada o fes que la porta distingisca «sense baseline» de «infracció».`);
  }
}

/* ═══════════════════ C5 · dependències externes ═══════════════════ */

/*
 * Pedra Seca és explícita: zero dependències a les eines. Una porta que importa
 * un paquet de node_modules deixa de poder córrer en un clon net i converteix
 * una comprovació en una loteria d'instal·lació.
 */
/*
 * Els mòduls natius s'accepten en forma `node:x`. La forma antiga (`fs`,
 * `child_process`) també és nativa: no és un incompliment de Pedra Seca, però
 * sí una ambigüitat —un paquet de node_modules amb eixe nom la segrestaria—
 * així que es reporta com a avís, no com a infracció. Confondre les dues coses
 * faria que la porta cridara el llop i acabara ignorada.
 */
const NATIUS_LEGACY = new Set([
  'assert', 'buffer', 'child_process', 'crypto', 'events', 'fs', 'http', 'https',
  'os', 'path', 'process', 'readline', 'stream', 'string_decoder', 'timers',
  'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

for (const f of portesDisc) {
  const cos = fs.readFileSync(path.join(DIR_PORTES, f), 'utf8');
  const externs = new Set();
  for (const m of cos.matchAll(/^\s*import\s+[^'"]*from\s+['"]([^'"]+)['"]/gm)) {
    const esp = m[1];
    if (/^node:/.test(esp) || esp.startsWith('.') || esp.startsWith('/') || esp === '@babel/parser') continue;
    externs.add(esp);
  }
  for (const e of externs) {
    const arrelPaquet = e.startsWith('@') ? e.split('/').slice(0, 2).join('/') : e.split('/')[0];
    if (NATIUS_LEGACY.has(arrelPaquet)) {
      avisa('C5', `tooling/gates/${f}`,
        `Importa \`${e}\` en forma antiga. És natiu, però \`node:${e}\` no es pot segrestar amb un paquet homònim a node_modules.`);
      continue;
    }
    falla('C5', `tooling/gates/${f}`,
      `Importa \`${e}\`, un paquet extern. La doctrina Pedra Seca declara zero dependències al tooling: en un clon sense \`npm install\` esta porta peta amb un stack trace cru en compte de dir què passa.`);
  }
}

/* ═══════════════════════════ Eixida ═══════════════════════════ */

if (JSON_OUT) {
  console.log(JSON.stringify({
    porta: 'tractor-cadena',
    arrel: ARREL,
    cadena: ordreCadena,
    portesDisc,
    problemes,
    avisos,
    ok: problemes.length === 0,
  }, null, 2));
  process.exit(problemes.length === 0 ? 0 : 1);
}

console.log('\n⛓️  TRACTOR DE LA CADENA');
console.log('─'.repeat(72));
console.log(`   Portes al disc: ${portesDisc.length} · a la cadena: ${ordreCadena.length}`);

for (const a of avisos) console.log(`   ℹ️  ${a.llei} · ${a.subjecte}: ${a.missatge}`);

if (problemes.length === 0) {
  console.log('\n✅ [CADENA] Totes les portes són a la cadena i la cadena pot arribar al final.\n');
  process.exit(0);
}

const perLlei = new Map();
for (const p of problemes) {
  if (!perLlei.has(p.llei)) perLlei.set(p.llei, []);
  perLlei.get(p.llei).push(p);
}
for (const [llei, llista] of [...perLlei].sort()) {
  console.log(`\n  ── ${llei} (${llista.length}) ${'─'.repeat(28)}`);
  for (const p of llista) console.log(`   · ${p.subjecte}\n     ↳ ${p.missatge}`);
}

console.log(`\n❌ [CADENA] ${problemes.length} problemes. La cadena de portes no és de fiar.\n`);
process.exit(1);
