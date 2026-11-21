#!/usr/bin/env node
/**
 * tractor-promesa.mjs — LA PORTA CONTRA LA PROMESA ESCRITA
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   L'auditoria 260831 (Seient 5) va trobar que el problema del projecte no és
 *   la pèrdua de context: és que les troballes s'escriuen en prosa en compte
 *   d'escriure's en una porta. Casos verificats al bundle:
 *
 *     · despertar.mjs:47 crida `node eines/ancora.mjs`. `eines/` no existix.
 *       La crida està dins d'un try/catch que imprimix «⚠ Avís» i continua.
 *     · core-restauracio-segellada/SKILL.md:192 DOCUMENTA eixa fallada i diu
 *       «cal fer que despertar.mjs falle tancat». Ningú ho fa complir.
 *     · build_rag_index.mjs:21 exclou 05_Escriptori. despertar.mjs ho avisa
 *       al comentari de capçalera #4. Cap porta ho comprova.
 *
 *   Una promesa escrita en un comentari no és una porta. Esta porta convertix
 *   eixes tres classes de promesa en fallada mecànica.
 *
 * LLEIS
 *   P1 EINA-FANTASMA   una eina invoca (execSync/spawn/import) un camí del
 *                      repositori que no existix
 *   P2 PROMESA-TOVA    una invocació d'eina o porta viu dins d'un try/catch
 *                      que només registra i continua (fail-open silenciós)
 *   P3 AVIS-ETERN      un comentari o document diu «cal fer X», «mentre això
 *                      dure», «TODO», «pendent» sobre un camí que existix i
 *                      cap porta cita eixe camí
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, --json per a CI.
 *
 *   node tooling/gates/tractor-promesa.mjs
 *   node tooling/gates/tractor-promesa.mjs --json
 *   node tooling/gates/tractor-promesa.mjs --baseline   # congela el deute
 */

import fs from 'node:fs';
import path from 'node:path';
import { CAMINS } from '../lib/arrel.mjs';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = process.argv.includes('--json');
const BASELINE = process.argv.includes('--baseline');
const DEUTE = path.join(ARREL, '.agents/deute/.promesa-deute.json');

const DIRS = ['tooling', 'scripts', '.agents'];
const EXT = new Set(['.mjs', '.js', '.cjs', '.sh', '.py']);
const EXCLOU = /(^|\/)(node_modules|\.git|dist|build|coverage|90_historic|90_arxiu_historic)(\/|$)/i;
const exclou = rel => EXCLOU.test(rel) || rel.split('/').some(part => part.toLowerCase() === CAMINS.wiki.toLowerCase());

/* ─────────────────────────── Recollida de fonts ─────────────────────────── */

function fonts(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (exclou(rel)) continue;
    if (e.isDirectory()) fonts(rel, acc);
    else if (EXT.has(path.extname(e.name))) acc.push(rel);
  }
  return acc;
}

const FONTS = DIRS.flatMap((d) => fonts(d));

/* ───────────────────────────────── Lleis ───────────────────────────────── */

const infraccions = [];
const afig = (llei, fitxer, linia, detall) =>
  infraccions.push({ llei, id: `${llei}|${fitxer}|${detall}`, fitxer, linia, detall });

/* Camí del repositori dins d'una cadena executada. Descarta binaris del sistema. */
const CAMI = /(?:^|[\s'"`])((?:tooling|scripts|eines|\.agents|src|wordpress-plugin)\/[\w./-]+\.(?:mjs|js|cjs|sh|py|json))/g;
const EXEC = /\b(?:execSync|execFileSync|exec|spawnSync|spawn|fork)\s*\(/;
const IMPORTA = /\bimport\s*\(\s*['"`]([^'"`]+)['"`]/g;

for (const f of FONTS) {
  const text = fs.readFileSync(path.join(ARREL, f), 'utf8');
  const linies = text.split('\n');

  linies.forEach((ln, i) => {
    const n = i + 1;
    const codi = ln.replace(/\/\*.*?\*\//g, '');
    const esComentari = /^\s*(\/\/|\*|#)/.test(codi);

    /* ── P1 · EINA-FANTASMA ── */
    if (!esComentari && EXEC.test(codi)) {
      for (const m of codi.matchAll(CAMI)) {
        const dest = m[1];
        if (!fs.existsSync(path.join(ARREL, dest))) {
          afig('P1', f, n, `invoca «${dest}», que no existix al repositori`);
        }
      }
    }
    if (!esComentari) {
      for (const m of codi.matchAll(IMPORTA)) {
        const spec = m[1];
        if (!spec.startsWith('.')) continue;
        const base = path.join(ARREL, path.dirname(f), spec);
        const existix = [base, `${base}.mjs`, `${base}.js`, path.join(base, 'index.mjs')]
          .some((c) => fs.existsSync(c));
        if (!existix) afig('P1', f, n, `import() dinàmic de «${spec}», que no resol`);
      }
    }
  });

  /* ── P2 · PROMESA-TOVA ── blocs try que executen eines i el catch només parla */
  const re = /try\s*\{([\s\S]*?)\}\s*catch\s*(?:\([^)]*\))?\s*\{([\s\S]*?)\n\s*\}/g;
  for (const m of text.matchAll(re)) {
    const cos = m[1];
    const rescat = m[2];
    if (!EXEC.test(cos) && !CAMI.test(cos)) continue;
    CAMI.lastIndex = 0;
    const nomesParla = /console\.(log|warn|info|error)/.test(rescat)
      && !/process\.exit|throw|reject|exitCode/.test(rescat);
    const buit = rescat.trim() === '' || /^\s*\/\*[\s\S]*\*\/\s*$/.test(rescat.trim());
    if (nomesParla || buit) {
      const linia = text.slice(0, m.index).split('\n').length;
      const quin = [...cos.matchAll(CAMI)].map((x) => x[1])[0] ?? 'una eina';
      CAMI.lastIndex = 0;
      afig('P2', f, linia,
        `executa «${quin}» i el catch ${buit ? 'no fa res' : 'només registra'}: la fallada es degrada a avís`);
    }
  }
}

/* ── P3 · AVIS-ETERN ── promeses escrites a documents sense porta que les cobrisca */
const PROMESA = /\b(cal fer que|mentre això dure|mentre açò dure|pendent de|TODO|FIXME|caldria|s'hauria de fer)\b/i;
const DOCS = ['.agents', CAMINS.wiki].flatMap((d) => {
  const acc = [];
  (function rec(dir) {
    const abs = path.join(ARREL, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.posix.join(dir, e.name);
      if (exclou(rel)) continue;
      if (e.isDirectory()) rec(rel);
      else if (e.name.endsWith('.md')) acc.push(rel);
    }
  })(d);
  return acc;
});

/* Camins que alguna porta ja cita: eixa promesa ja té amo. */
const PORTES = fonts('tooling/gates').concat(fonts('tooling/wiki').filter((f) => /tractor|guard/.test(f)));
const COBERTS = new Set();
for (const p of PORTES) {
  const t = fs.readFileSync(path.join(ARREL, p), 'utf8');
  for (const m of t.matchAll(CAMI)) COBERTS.add(m[1]);
}

for (const d of DOCS) {
  const linies = fs.readFileSync(path.join(ARREL, d), 'utf8').split('\n');
  /* La promesa i el camí solen viure en línies distintes del mateix paràgraf
   * (cas real: SKILL.md:191 cita el camí, :194 diu «cal fer que...»). Per això
   * l'anàlisi és per bloc, no per línia. */
  let ini = 0;
  const blocs = [];
  linies.forEach((ln, i) => {
    if (ln.trim() === '') { if (i > ini) blocs.push([ini + 1, linies.slice(ini, i)]); ini = i + 1; }
  });
  if (ini < linies.length) blocs.push([ini + 1, linies.slice(ini)]);

  for (const [n, cos] of blocs) {
    const text = cos.join(' ');
    if (!PROMESA.test(text)) continue;
    const vistos = new Set();
    for (const m of text.matchAll(CAMI)) {
      const dest = m[1];
      if (vistos.has(dest)) continue;
      vistos.add(dest);
      if (!fs.existsSync(path.join(ARREL, dest))) continue;
      /* Una troballa amb número de línia («fitxer.mjs:47») és un dictamen
       * d'auditoria, no una menció de passada: eixa sempre exigix porta. */
      const ambLinia = new RegExp(`${dest.replace(/[.]/g, '\\.')}:\\d+`).test(text);
      if (!ambLinia && COBERTS.has(dest)) continue;
      afig('P3', d, n, `promet arreglar «${dest}»${ambLinia ? ' citant línia exacta' : ''} i cap porta ho fa complir`);
    }
  }
}

/* ────────────────────────────── Deute i eixida ────────────────────────────── */

const perLlei = (l) => infraccions.filter((x) => x.llei === l);
const compte = { P1: perLlei('P1').length, P2: perLlei('P2').length, P3: perLlei('P3').length };

if (BASELINE) {
  /* P1 és llei dura: no es congela mai. Escriure-hi un sostre > 0 seria
   * convidar a conviure amb una eina fantasma. */
  const congelat = {
    generat: new Date().toISOString(),
    max: { ...compte, P1: 0 },
    ids: infraccions.filter((i) => i.llei !== 'P1').map((i) => i.id).sort(),
  };
  fs.writeFileSync(DEUTE, `${JSON.stringify(congelat, null, 2)}\n`);
  console.log(`Deute de promeses congelat a ${path.basename(DEUTE)}: P1=${compte.P1} P2=${compte.P2} P3=${compte.P3}`);
  console.log('A partir d\'ara només pot baixar. P1 és llei dura: no admet deute.');
  process.exit(0);
}

const previ = fs.existsSync(DEUTE) ? JSON.parse(fs.readFileSync(DEUTE, 'utf8')) : null;

if (JSON_OUT) {
  const puja = previ ? Object.keys(compte).some((k) => compte[k] > (previ.max[k] ?? 0)) : false;
  console.log(JSON.stringify({ ok: compte.P1 === 0 && !puja, compte, infraccions }, null, 2));
  process.exit(compte.P1 === 0 && !puja ? 0 : 1);
}

const ETIQ = {
  P1: 'EINA-FANTASMA · invoca el que no existix',
  P2: 'PROMESA-TOVA · la fallada es degrada a avís',
  P3: 'AVIS-ETERN · promesa escrita sense porta',
};

console.log('\n🪨 TRACTOR DE LA PROMESA');
console.log('─'.repeat(72));
for (const llei of ['P1', 'P2', 'P3']) {
  const l = perLlei(llei);
  const sostre = previ?.max?.[llei];
  const dur = llei === 'P1';
  const marca = dur ? (l.length === 0 ? '✅' : '❌') : (sostre === undefined || l.length <= sostre ? '·' : '❌');
  console.log(`\n${marca} ${llei} · ${ETIQ[llei]} — ${l.length}${dur ? ' (LLEI DURA)' : ` màx ${sostre ?? '—'}`}`);
  for (const x of l.slice(0, 12)) console.log(`      ${x.fitxer}:${x.linia}\n        ↳ ${x.detall}`);
  if (l.length > 12) console.log(`      … i ${l.length - 12} més`);
}
console.log(`\n${'─'.repeat(72)}`);

const puja = previ ? Object.keys(compte).some((k) => compte[k] > (previ.max[k] ?? 0)) : false;
if (compte.P1 > 0) {
  console.error('PARAT. Hi ha eines que invoquen fitxers inexistents. Això no admet deute.');
  process.exit(1);
}
if (!previ) {
  console.error(`PARAT. No hi ha ${path.basename(DEUTE)}. Executa una vegada: --baseline`);
  process.exit(1);
}
if (puja) {
  console.error('PARAT. El deute de promeses puja. Escriu la porta, no el comentari.');
  process.exit(1);
}
console.log('PASSA. Cap eina fantasma i el deute de promeses no puja.');
process.exit(0);
