#!/usr/bin/env node
/**
 * tractor-nomenclatura.mjs — PORTA DEL SISTEMA D'ARXIUS
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   Auditoria 260910. La wiki ha canviat d'estructura de carpetes almenys dues
 *   vegades. Cap eina ho va notar. Resultat mesurat sobre el bundle:
 *
 *     · 15 de les 19 rutes `_wiki_de_poble/...` citades al codi apunten a
 *       carpetes que NO existixen. `00_SER_Brain_Identitat` la citen 11
 *       fitxers, entre ells `.agents/consell.json`.
 *     · `01_ser/03_EQUIP_IA.md` és orfe perquè algú el va renumerar des de
 *       `02_` i va deixar 21 referències apuntant al número vell.
 *
 *   La conclusió no és que faltara una norma de majúscules. És que faltava una
 *   mesura que digués «esta ruta ja no existix». Este tractor és eixa mesura.
 *   La llei del snake_case (N1) ve de propina; la que salva el corpus és N2.
 *
 * LLEIS
 *   N1 CAIXA        segment de ruta que no és snake_case i no està exempt
 *   N2 RUTA-MORTA   ruta de wiki citada al codi que no existix al disc
 *   N3 COL·LISIÓ    dos fitxers que col·lapsarien al mateix nom canònic
 *
 *   N2 és la llei que impedix la tercera reorganització silenciosa. Cap norma
 *   escrita ho va evitar en dos migracions; una mesura sí.
 *
 * ÚS
 *   node tooling/wiki/tractor-nomenclatura.mjs --arrel=.
 *   node tooling/wiki/tractor-nomenclatura.mjs --arrel=. --json
 *   node tooling/wiki/tractor-nomenclatura.mjs --arrel=. --baseline   # segella el deute
 *   node tooling/wiki/tractor-nomenclatura.mjs --arrel=. --pla        # pla de migració (no escriu)
 *
 * `--pla` NO toca cap fitxer. Emet el mapa renom + la llista d'enllaços
 * `[[...]]` que caldria reescriure en el MATEIX commit. Migrar sense eixa
 * llista és exactament el que va deixar 21 enllaços penjats l'última vegada.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 */

import fs from 'node:fs';
import {isExecutionEvidence, isCitationFixtureOrCache} from '../lib/corpus-scope.mjs';
import path from 'node:path';
import { CAMINS } from '../lib/arrel.mjs';
const zonaExterna = (file) => ['00_bandeja_d_entrada', '01_produccio', '02_investigacio_ia'].some(folder => file === `${CAMINS.escriptori}/${folder}` || file.startsWith(`${CAMINS.escriptori}/${folder}/`));

/* ─────────────────────────── Arrel i configuració ─────────────────────────── */

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = process.argv.includes('--json');
const BASELINE = process.argv.includes('--baseline');
const PLA = process.argv.includes('--pla');

const CONFIG = path.join(ARREL, 'tooling/wiki/nomenclatura.json');
const DEUTE = path.join(ARREL, '.agents/deute/.nomenclatura-deute.json');

if (!fs.existsSync(CONFIG)) {
  console.error(`❌ [NOMENCLATURA] Falta la configuració: ${CONFIG}`);
  console.error('   Sense exempcions declarades no hi ha llei justa. Fallem tancat.');
  process.exit(2);
}
const C = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));

const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|coverage|90_historic|90_arxiu_historic|\.sdp-paperera)(\/|$)/;
const EXT_CODI = /\.(mjs|js|cjs|jsx|ts|tsx|py|sh|json|md|yaml|yml|sql|php)$/;

/** snake_case estricte: minúscules, dígits, guions baixos com a separador únic. */
const SNAKE = /^[a-z0-9]+(_[a-z0-9]+)*$/;

const EXEMPTS_NOM = new Set(Object.keys(C.exempts_nom ?? {}));
const EXEMPTS_PATRO = (C.exempts_patro ?? []).map((e) => ({ re: new RegExp(e.patro), motiu: e.motiu }));
const ABSENTS_OK = (C.rutes_absents_tolerades ?? []).map((e) => ({ re: new RegExp(e.patro), motiu: e.motiu }));

const exemptNom = (base) =>
  EXEMPTS_NOM.has(base) || EXEMPTS_PATRO.some((e) => e.re.test(base));

/* ─────────────────────────── Recorregut ─────────────────────────── */

function recorre(dir, acc = { fitxers: [], dirs: [] }) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (isExecutionEvidence(rel) || EXCLOU.test(rel)) continue;
    if (e.isDirectory()) { acc.dirs.push(rel); recorre(rel, acc); }
    else acc.fitxers.push(rel);
  }
  return acc;
}

const wiki = C.arrels_wiki.reduce((a, d) => {
  const r = recorre(d);
  a.fitxers.push(...r.fitxers); a.dirs.push(...r.dirs); return a;
}, { fitxers: [], dirs: [] });

if (wiki.fitxers.length === 0) {
  console.error(`❌ [NOMENCLATURA] Cap fitxer a ${C.arrels_wiki.join(', ')} des de ${ARREL}. Usa --arrel=.`);
  process.exit(2);
}

const n = { N1: [], N2: [], N3: [] };

/* ─────────────────────────── N1 · CAIXA ─────────────────────────── */

/** Canonitza un segment: sense accents, no alfanumèric → `_`, minúscules. */
function canonitza(seg) {
  const ext = /\.[a-z0-9]+$/i.exec(seg)?.[0]?.toLowerCase() ?? '';
  const cos = ext ? seg.slice(0, -ext.length) : seg;
  const net = cos
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  return net + ext;
}

for (const d of wiki.dirs) {
  const base = path.basename(d);
  if (base.startsWith('.') || zonaExterna(d)) continue;
  if (!SNAKE.test(base)) n.N1.push({ mena: 'directori', ruta: d, canonic: canonitza(base) });
}
for (const f of wiki.fitxers) {
  const base = path.basename(f);
  if (base.startsWith('.') || zonaExterna(f)) continue;
  if (exemptNom(base)) continue;
  const arrel = base.replace(/\.[a-z0-9]+$/i, '');
  const ext = base.slice(arrel.length);
  if (!SNAKE.test(arrel) || ext !== ext.toLowerCase()) {
    n.N1.push({ mena: 'fitxer', ruta: f, canonic: canonitza(base) });
  }
}

/* ─────────────────────────── N2 · RUTA-MORTA ─────────────────────────── */
/* Esta és la llei que faltava. Una ruta de wiki escrita dins d'un fitxer de
 * codi o d'una skill és una promesa verificable: o el directori hi és, o el
 * fitxer que la cita està mentint.
 * Ordre del Mestre (30-10-2026) · frontera esquerra: l'arrel de la wiki només
 * compta com a nom sencer, no com la cua d'un altre (l'arxiu fred germà,
 * «../_arxiu_» + l'arrel, és fora de l'arbre i no és cap ruta morta). */

const RE_RUTA = new RegExp(`(?<![A-Za-z0-9_])(?:${C.arrels_wiki.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\/[A-Za-z0-9_.\\-]+`, 'g');

const codi = C.arrels_codi.reduce((a, d) => a.concat(recorre(d).fitxers), [])
  .concat(fs.readdirSync(ARREL, { withFileTypes: true })
    .filter((e) => e.isFile() && EXT_CODI.test(e.name)).map((e) => e.name))
  .filter((f) => EXT_CODI.test(f) && !isCitationFixtureOrCache(f));

const citacions = new Map(); /* ruta → Set(fitxers que la citen) */
for (const f of codi) {
  let txt;
  try { txt = fs.readFileSync(path.join(ARREL, f), 'utf8'); } catch { continue; }
  for (const m of txt.match(RE_RUTA) ?? []) {
    const net = m.replace(/[.\-_]+$/, '');
    if (!citacions.has(net)) citacions.set(net, new Set());
    citacions.get(net).add(f);
  }
}

for (const [ruta, qui] of citacions) {
  if (fs.existsSync(path.join(ARREL, ruta)) || (!path.extname(ruta) && fs.existsSync(path.join(ARREL, ruta + '.md')))) continue;
  const tolerada = ABSENTS_OK.find((e) => e.re.test(ruta));
  if (tolerada) continue;
  n.N2.push({ ruta, citada_per: [...qui].sort() });
}
n.N2.sort((a, b) => b.citada_per.length - a.citada_per.length);

/* ─────────────────────────── N3 · COL·LISIÓ ─────────────────────────── */
/* Dos fitxers que després de canonitzar caurien al mateix nom dins la mateixa
 * carpeta. Migrar-los és pèrdua de dades, no un renom. */

const perCarpeta = new Map();
for (const f of wiki.fitxers) {
  const dir = path.posix.dirname(f);
  const base = path.basename(f);
  const nou = exemptNom(base) ? base : canonitza(base);
  const clau = `${dir}/${nou}`;
  if (!perCarpeta.has(clau)) perCarpeta.set(clau, []);
  perCarpeta.get(clau).push(f);
}
for (const [clau, orig] of perCarpeta) {
  if (orig.length > 1) n.N3.push({ canonic: clau, origens: orig.sort() });
}

/* ─────────────────────────── Mode --pla ─────────────────────────── */

if (PLA) {
  const renoms = n.N1.filter((x) => x.mena === 'fitxer')
    .map((x) => ({ de: x.ruta, a: path.posix.join(path.posix.dirname(x.ruta), x.canonic) }));
  const clauVella = new Set(renoms.map((r) => path.basename(r.de).replace(/\.md$/i, '')));

  /* Enllaços [[...]] que citen un nom curt que està a punt de canviar. */
  const ENLLAC = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
  const aReescriure = [];
  for (const f of wiki.fitxers.filter((x) => x.endsWith('.md'))) {
    const linies = fs.readFileSync(path.join(ARREL, f), 'utf8').split('\n');
    let codiBloc = false;
    linies.forEach((ln, i) => {
      if (/^\s*```/.test(ln)) { codiBloc = !codiBloc; return; }
      if (codiBloc) return;
      for (const m of ln.matchAll(ENLLAC)) {
        const curt = path.basename(m[1].trim()).replace(/\.md$/i, '');
        if (clauVella.has(curt)) aReescriure.push({ fitxer: f, linia: i + 1, de: curt, a: canonitza(curt) });
      }
    });
  }
  const pla = {
    generat: new Date().toISOString(),
    renoms_directori: n.N1.filter((x) => x.mena === 'directori')
      .map((x) => ({ de: x.ruta, a: path.posix.join(path.posix.dirname(x.ruta), x.canonic) })),
    renoms_fitxer: renoms,
    enllacos_a_reescriure: aReescriure.length,
    detall_enllacos: aReescriure,
    colisions_bloquejants: n.N3,
  };
  if (JSON_OUT) { console.log(JSON.stringify(pla, null, 1)); process.exit(n.N3.length ? 1 : 0); }
  console.log('\n🗺️  PLA DE MIGRACIÓ — cap fitxer tocat\n' + '─'.repeat(72));
  console.log(`  Directoris a renomenar : ${pla.renoms_directori.length}`);
  console.log(`  Fitxers a renomenar    : ${pla.renoms_fitxer.length}`);
  console.log(`  Enllaços a reescriure  : ${pla.enllacos_a_reescriure}   ← al MATEIX commit`);
  console.log(`  Col·lisions bloquejants: ${pla.colisions_bloquejants.length}`);
  console.log('─'.repeat(72));
  if (pla.colisions_bloquejants.length) {
    console.error('\n❌ Hi ha col·lisions. El renom perdria fitxers. Resol-les primer.\n');
    for (const c of pla.colisions_bloquejants) console.error(`   ${c.canonic} ← ${c.origens.join(' | ')}`);
    process.exit(1);
  }
  console.log('\n  Cap col·lisió. El pla és aplicable en un sol commit atòmic.\n');
  process.exit(0);
}

/* ─────────────────────────── Veredicte ─────────────────────────── */

const compte = Object.fromEntries(Object.entries(n).map(([k, v]) => [k, v.length]));

if (BASELINE) {
  fs.mkdirSync(path.dirname(DEUTE), { recursive: true });
  fs.writeFileSync(DEUTE, JSON.stringify({ generat: new Date().toISOString(), max: compte }, null, 2) + '\n');
  console.log(`🔒 [NOMENCLATURA] Deute segellat a ${DEUTE}`);
  console.log(JSON.stringify(compte));
  console.log('   El deute només pot baixar. Si puja, la porta cau.');
  process.exit(0);
}

const max = fs.existsSync(DEUTE)
  ? JSON.parse(fs.readFileSync(DEUTE, 'utf8')).max
  : { N1: 0, N2: 0, N3: 0 };

if (JSON_OUT) {
  console.log(JSON.stringify({ fitxers: wiki.fitxers.length, compte, max, fallades: n }, null, 1));
} else {
  const NOMS = {
    N1: 'CAIXA — segment que no és snake_case',
    N2: 'RUTA-MORTA — ruta de wiki citada al codi que no existix',
    N3: 'COL·LISIÓ — dos fitxers col·lapsarien al mateix nom',
  };
  console.log('\n🚜 TRACTOR NOMENCLATURA — sistema d\'arxius');
  console.log('─'.repeat(72));
  console.log(`  ${wiki.fitxers.length} fitxers · ${wiki.dirs.length} directoris · ${citacions.size} rutes citades al codi\n`);
  for (const [llei, items] of Object.entries(n)) {
    const sostre = max[llei] ?? 0;
    const icona = items.length > sostre ? '❌' : items.length ? '·' : '✅';
    console.log(`${icona} ${llei} · ${NOMS[llei]} — ${items.length} màx ${sostre}`);
    for (const it of items.slice(0, 6)) {
      if (llei === 'N2') console.log(`      ${it.ruta}  ← ${it.citada_per.length} fitxer(s): ${it.citada_per.slice(0, 2).join(', ')}`);
      else if (llei === 'N3') console.log(`      ${it.canonic} ← ${it.origens.join(' | ')}`);
      else console.log(`      ${it.ruta}  →  ${it.canonic}`);
    }
    if (items.length > 6) console.log(`      … i ${items.length - 6} més`);
  }
  console.log('─'.repeat(72));
}

const pujat = Object.entries(compte).filter(([k, v]) => v > (max[k] ?? 0));
if (pujat.length) {
  console.error(`\n❌ [NOMENCLATURA] El deute ha pujat: ${pujat.map(([k, v]) => `${k} ${max[k] ?? 0}→${v}`).join(', ')}`);
  console.error('   Mira el pla abans de tocar res: --pla');
  process.exit(1);
}
console.log('\n✅ [NOMENCLATURA] Sistema d\'arxius conforme. Deute no ha pujat.');
process.exit(0);
