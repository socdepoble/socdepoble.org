#!/usr/bin/env node
/**
 * desenterrar.mjs — Protocol de restauració en dues fases.
 *
 * FASE 1 (INSPECCIÓ, no escriu res):
 *   node eines/desenterrar.mjs --ref <sha|tag> --fitxer <ruta>
 *     → imprimeix l'autòpsia del cadàver i emet un SEGELL.
 *
 * FASE 2 (APLICACIÓ, escriu):
 *   node eines/desenterrar.mjs --ref <sha> --fitxer <ruta> --segell <SEGELL>
 *     → crea àncora de rescat, escriu el fitxer, imprimeix el desfer.
 *
 * El SEGELL és sha256(ref_resolt + ruta + blob_antic + blob_actual).
 * No es pot endevinar sense executar la Fase 1, i caduca si el fitxer
 * del disc canvia entremig. Açò fa MECÀNICAMENT impossible el checkout cec.
 *
 * Codis d'eixida: 0 ok · 1 refús/error · 2 ús incorrecte.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const LLINDAR_DIES = 7;      // més vell que això → alarma
const LLINDAR_PERDUA = 0.15; // perdre >15% de línies → alarma

// ─────────────────────────────────────────────────────────── utillatge

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', x: '\x1b[0m', d: '\x1b[2m' }
  : { r: '', g: '', y: '', b: '', x: '', d: '' };

function git(args, opcions = {}) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opcions });
}

function gitSilenciós(args) {
  try { return { ok: true, eixida: git(args, { stdio: ['ignore', 'pipe', 'ignore'] }) }; }
  catch (e) { return { ok: false, eixida: String(e.stdout || e.stderr || e.message) }; }
}

function mor(missatge, codi = 1) {
  console.error(`\n${C.r}${C.b}✖ REFÚS${C.x} ${missatge}\n`);
  process.exit(codi);
}

function args() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const clau = a[i].slice(2);
    o[clau] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return o;
}

/** Identificadors "de valor" que un fitxer JS/JSX exposa o consumeix. */
function símbols(codi) {
  const s = new Set();
  const patrons = [
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|class)\s+([A-Za-z_$][\w$]*)/g,
    /(?:^|\s)(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /(?:^|\s)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\(|async|function|use[A-Z])/g,
    /\b(use[A-Z][\w$]*)\s*\(/g,
  ];
  for (const p of patrons) for (const m of codi.matchAll(p)) s.add(m[1]);
  for (const m of codi.matchAll(/import\s+[^;]*?from\s+['"]([^'"]+)['"]/g)) s.add(`⇠ ${m[1]}`);
  for (const m of codi.matchAll(/<([A-Z][\w$]*)/g)) s.add(`<${m[1]}>`);
  return s;
}

function tallaDiff(text, màxim = 120) {
  const l = text.split('\n');
  if (l.length <= màxim) return text;
  return [...l.slice(0, màxim), `${C.d}… (${l.length - màxim} línies més retallades)${C.x}`].join('\n');
}

// ─────────────────────────────────────────────────────────── àncora

/**
 * Fotografia TOT l'arbre de treball (inclosos els no rastrejats) en un
 * commit orfe penjat de refs/sdp/ancora/*. No toca l'índex ni el worktree.
 */
function creaÀncora(motiu) {
  const arrel = git(['rev-parse', '--show-toplevel']).trim();
  const índexTemporal = join(arrel, '.git', `index-ancora-${process.pid}`);
  const entorn = { ...process.env, GIT_INDEX_FILE: índexTemporal };
  try {
    git(['read-tree', 'HEAD'], { env: entorn });
    git(['add', '-A'], { env: entorn });
    const arbre = git(['write-tree'], { env: entorn }).trim();
    const pare = gitSilenciós(['rev-parse', 'HEAD']);
    const argsCommit = ['commit-tree', arbre, '-m', `ancora: ${motiu}`];
    if (pare.ok) argsCommit.splice(2, 0, '-p', pare.eixida.trim());
    const commit = git(argsCommit, { env: entorn }).trim();
    const marca = new Date().toISOString().replace(/[-:T]/g, '').slice(2, 12);
    const ref = `refs/sdp/ancora/${marca}`;
    git(['update-ref', ref, commit]);
    return { ref, commit };
  } finally {
    try { execFileSync('rm', ['-f', índexTemporal]); } catch { /* igual */ }
  }
}

// ─────────────────────────────────────────────────────────── principal

const o = args();

if (o.ancores) {
  const r = gitSilenciós(['for-each-ref', '--sort=-creatordate',
    '--format=%(refname)  %(creatordate:short)  %(subject)', 'refs/sdp/ancora']);
  console.log(r.eixida.trim() || 'Cap àncora encara.');
  process.exit(0);
}

if (!o.ref || !o.fitxer) {
  console.error(`
${C.b}desenterrar.mjs${C.x} — restauració en dues fases

  Fase 1  node eines/desenterrar.mjs --ref <sha|tag> --fitxer <ruta>
  Fase 2  node eines/desenterrar.mjs --ref <sha|tag> --fitxer <ruta> --segell <SEGELL>
  Àncores node eines/desenterrar.mjs --ancores
`);
  process.exit(2);
}

const ruta = String(o.fitxer);

// 1. El ref existeix?
const refResolt = gitSilenciós(['rev-parse', '--verify', `${o.ref}^{commit}`]);
if (!refResolt.ok) mor(`El ref «${o.ref}» no existeix en este repositori.`);
const sha = refResolt.eixida.trim();

// 2. El fitxer existia en eixe ref?
if (!gitSilenciós(['cat-file', '-e', `${sha}:${ruta}`]).ok) {
  mor(`«${ruta}» NO existeix dins de ${sha.slice(0, 8)}. L'etiqueta del commit menteix o la ruta ha canviat.`);
}

const codiAntic = git(['show', `${sha}:${ruta}`]);
const blobAntic = git(['rev-parse', `${sha}:${ruta}`]).trim();
const existeixActual = existsSync(ruta);
const codiActual = existeixActual ? readFileSync(ruta, 'utf8') : '';
const blobActual = existeixActual
  ? createHash('sha1').update(`blob ${Buffer.byteLength(codiActual)}\0${codiActual}`).digest('hex')
  : 'BUIT';

const segellEsperat = createHash('sha256')
  .update(`${sha}|${ruta}|${blobAntic}|${blobActual}`).digest('hex').slice(0, 16);

// ── metadades del cadàver
const [dataCommit, assumpte, autor] = git(
  ['show', '-s', '--format=%cI%n%s%n%an', sha]).trim().split('\n');
const dies = Math.floor((Date.now() - new Date(dataCommit)) / 86400000);

// Edat REAL del contingut: la data MÉS ANTIGA en què este blob exacte va existir
// en esta ruta, en tota la història. Un commit d'ahir pot transportar un fitxer
// de fa un mes: ací és exactament on ens van enganyar.
let dataContingut = dataCommit;
{
  const històric = gitSilenciós(['log', '--all', '-n', '400', '--format=%H %cI', '--', ruta]);
  if (històric.ok) {
    const files = històric.eixida.trim().split('\n').filter(Boolean).map((l) => l.split(' '));
    const consulta = files.map(([c]) => `${c}:${ruta}`).join('\n') + '\n';
    let blobs = [];
    try {
      blobs = execFileSync('git', ['cat-file', '--batch-check=%(objectname)'],
        { input: consulta, encoding: 'utf8' }).trim().split('\n');
    } catch { blobs = []; }
    for (let n = 0; n < files.length && n < blobs.length; n++) {
      if (blobs[n].trim() === blobAntic && files[n][1] < dataContingut) dataContingut = files[n][1];
    }
  }
}
const diesContingut = Math.floor((Date.now() - new Date(dataContingut)) / 86400000);
const líniesAntic = codiAntic.split('\n').length;
const líniesActual = codiActual.split('\n').length;
const delta = líniesActual ? (líniesActual - líniesAntic) / líniesActual : 0;

const perduts = [...símbols(codiActual)].filter((s) => !símbols(codiAntic).has(s));
const guanyats = [...símbols(codiAntic)].filter((s) => !símbols(codiActual).has(s));

const alarmes = [];
if (blobAntic === blobActual) alarmes.push('El contingut és IDÈNTIC. Esta restauració no fa res.');
if (diesContingut > LLINDAR_DIES) alarmes.push(`El CONTINGUT del fitxer té ${diesContingut} dies (el commit només ${dies}). L'etiqueta diu «${assumpte}», però l'arxiu és d'una altra època.`);
if (diesContingut - dies > LLINDAR_DIES) alarmes.push(`CISMA TERMODINÀMICA: commit recent amb càrrega arcaica. Este commit NO és una còpia de seguretat de l'estat actual.`);
if (delta > LLINDAR_PERDUA) alarmes.push(`Perds ${(delta * 100).toFixed(0)}% de les línies (${líniesActual} → ${líniesAntic}).`);
if (perduts.length) alarmes.push(`Desapareixen ${perduts.length} símbols que ara existeixen.`);
if (!existeixActual) alarmes.push('El fitxer no existix al disc: açò és una creació, no una restauració.');

// ─────────────────────────────────────────── FASE 1: INSPECCIÓ

if (!o.segell) {
  console.log(`
${C.b}╔══ AUTÒPSIA DEL CADÀVER ═════════════════════════════════════${C.x}
  Fitxer     ${ruta}
  Ref        ${sha.slice(0, 8)}  ${C.d}(${o.ref})${C.x}
  Assumpte   «${assumpte}»
  Autor      ${autor}
  Data commit      ${dataCommit.slice(0, 10)}  ${C.d}(fa ${dies} dies)${C.x}
  Data CONTINGUT   ${dataContingut.slice(0, 10)}  ${C.y}(fa ${diesContingut} dies)${C.x}
  Línies     ${líniesActual} (disc)  →  ${líniesAntic} (cadàver)
`);

  if (perduts.length) {
    console.log(`${C.r}  ☠ EL QUE PERDS${C.x}\n     ${perduts.join('\n     ')}\n`);
  }
  if (guanyats.length) {
    console.log(`${C.g}  ✚ EL QUE RECUPERES${C.x}\n     ${guanyats.join('\n     ')}\n`);
  }

  const diff = gitSilenciós(['diff', '--no-index', '--', ruta, '/dev/stdin']);
  const temporal = join('/tmp', `desenterrar-${process.pid}.txt`);
  writeFileSync(temporal, codiAntic);
  const d = gitSilenciós(['diff', '--no-index', '--color', '--', ruta, temporal]);
  console.log(`${C.b}── DIFF (disc → cadàver) ─────────────────────────────────────${C.x}`);
  console.log(tallaDiff(d.eixida.split('\n').slice(4).join('\n')));

  if (alarmes.length) {
    console.log(`${C.r}${C.b}⚠ ALARMES${C.x}`);
    for (const a of alarmes) console.log(`${C.r}   • ${a}${C.x}`);
  } else {
    console.log(`${C.g}   Cap alarma: restauració de baix risc.${C.x}`);
  }

  console.log(`
${C.b}╚══ NO S'HA ESCRIT RES ═══════════════════════════════════════${C.x}

Si el Mestre ho confirma DESPRÉS de llegir açò:

  node eines/desenterrar.mjs --ref ${o.ref} --fitxer ${ruta} --segell ${segellEsperat}

${C.d}El segell caduca si «${ruta}» canvia al disc.${C.x}
`);
  process.exit(0);
}

// ─────────────────────────────────────────── FASE 2: APLICACIÓ

if (String(o.segell) !== segellEsperat) {
  mor(`Segell invàlid.
   Rebut:   ${o.segell}
   Esperat: ${segellEsperat}
   O no has fet la Fase 1, o «${ruta}» ha canviat des de la inspecció.
   Torna a executar la inspecció i torna a demanar confirmació.`);
}

const àncora = creaÀncora(`abans de restaurar ${ruta} des de ${sha.slice(0, 8)}`);
mkdirSync(dirname(ruta), { recursive: true });
writeFileSync(ruta, codiAntic);

console.log(`
${C.g}${C.b}✔ RESTAURAT${C.x}  ${ruta}  ←  ${sha.slice(0, 8)}
   Àncora de rescat: ${àncora.ref}  (${àncora.commit.slice(0, 8)})

${C.b}DESFER-HO TOT${C.x} (torna l'arbre sencer a com estava fa un segon):
   git checkout ${àncora.commit} -- .

${C.d}Recorda el segell per al missatge de commit:${C.x}
   RESTAURACIÓ-VALIDADA: ${segellEsperat}
`);
