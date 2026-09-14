#!/usr/bin/env node
/**
 * llaurador_indexs.mjs — EL FORAT NEGRE D'ORFES S'ACABA ACÍ
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   Portem mesos escrivint la norma «enllaça el document des d'un índex» i
 *   mesos generant satèl·lits. La norma no falla: falla el fet que enllaçar
 *   siga una acció humana voluntària. Una llei que depén de recordar-la no
 *   és una llei, és una preferència.
 *
 *   El llaurador invertix la càrrega. En compte de demanar-te que enllaces,
 *   ell enllaça i tu decidixes on va. Cap document pot nàixer orfe perquè
 *   l'adopció és automàtica i el tancament de la porta és mecànic.
 *
 * COM FUNCIONA
 * ────────────
 *   1. Resol el graf dirigit amb semàntica d'Obsidian (lib/resolutor.mjs).
 *   2. Calcula QUÈ S'ABASTA des de l'àncora seguint les fletxes cap avant.
 *      Abastable ≠ «està al mateix nuvolet»: si des de l'índex no pots
 *      arribar-hi clicant, el document no existix per a qui llig.
 *   3. Tot document inabastable s'adopta al seu índex més pròxim, dins d'un
 *      bloc gestionat i delimitat.
 *   4. Els índexs de carpeta s'encadenen cap amunt fins a l'arrel, així que
 *      l'adopció sempre acaba penjant de l'àncora.
 *
 * LA PROPIETAT IMPORTANT — EL BLOC S'AUTOESBORRA
 * ──────────────────────────────────────────────
 *   El bloc `LLAURADOR:ADOPCIONS` només conté el que ENCARA no s'abasta per
 *   cap altre camí. Quan mous l'enllaç a la secció temàtica que li toca, el
 *   document passa a ser abastable i el llaurador el lleva del bloc tot sol.
 *   L'automatisme és una bastida, no una crossa: com més bé cosim a mà,
 *   més menut es fa el bloc, fins a desaparéixer.
 *
 *   No toquem mai l'interior del document orfe. Només escrivim als índexs.
 *
 * ÚS
 *   node tooling/wiki/llaurador_indexs.mjs            # informe, no escriu
 *   node tooling/wiki/llaurador_indexs.mjs --escriu   # adopta
 *   node tooling/wiki/llaurador_indexs.mjs --check    # PORTA: ix 1 si hi ha orfes
 *   node tooling/wiki/llaurador_indexs.mjs --json
 *
 * Pedra Seca: zero dependències, ESM, fail-closed, idempotent.
 */

import fs from 'node:fs';
import path from 'node:path';
import { construeixIndex, resol } from './lib/resolutor.mjs';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const ESCRIU = process.argv.includes('--escriu');
const CHECK = process.argv.includes('--check');
const JSON_OUT = process.argv.includes('--json');

/* L'àncora ha de ser l'ARREL del coneixement, no l'escriptori de sessió.
 * Mesura 260901: des de `00_INDEX_ESCRIPTORI` només s'abasten 4 de 96
 * documents. Des de `00_INDEX`, 81. L'escriptori és una fulla, no una arrel. */
const ANCORES = (ARG('ancores') ?? '_wiki_de_poble/00_index.md').split(',');
const ARRELS = (ARG('arrels') ?? '_wiki_de_poble,.agents').split(',');
const EXCLOU = /(^|\/)(node_modules|\.git|\.obsidian|dist|build|90_historic|90_arxiu_historic|\.quarantena-260830|\.agents\/deute|\.sdp-paperera)(\/|$)/;

const INICI = '<!-- LLAURADOR:ADOPCIONS:INICI -->';
const FI = '<!-- LLAURADOR:ADOPCIONS:FI -->';

/* ───────────────────────────── Recollida ───────────────────────────── */

function md(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (EXCLOU.test(rel)) continue;
    if (e.isDirectory()) md(rel, acc);
    else if (e.name.match(/\.(md|mjs|json|png|jpg|jpeg|gif|svg|pdf|docx|txt|html|css|js)$/i)) acc.push(rel);
  }
  return acc;
}

const NODES = ARRELS.flatMap((d) => md(d)).sort();
if (NODES.length === 0) {
  console.error(`❌ [LLAURADOR] Cap document a ${ARRELS.join(', ')} des de ${ARREL}. Usa --arrel=.`);
  process.exit(2);
}
const idx = construeixIndex(NODES);

/* ─────────────── Lectura: arestes reals + bloc gestionat ─────────────── */

const ENLLAC = /\[\[([^\]]+)\]\]/g;
/* DOS GRAFS, A POSTA.
 *   `out`     — arestes escrites a mà. Decidix QUÈ ha d'anar al bloc.
 *               Si el bloc es comptara ací, es donaria la raó a si mateix
 *               i no s'autoesborraria mai.
 *   `outReal` — totes les arestes, bloc inclòs. És el graf que veu qui llig,
 *               i per tant l'únic vàlid per a dictar el veredicte de la porta.
 * Separar-los és el que fa que el bloc siga bastida i no crossa. */
const out = new Map(NODES.map((n) => [n, new Set()]));
const outReal = new Map(NODES.map((n) => [n, new Set()]));
const penjats = [];
const ambigus = [];

function talla(txt) {
  const a = txt.indexOf(INICI);
  const b = txt.indexOf(FI);
  if (a < 0 || b < 0 || b < a) return { fora: txt, dins: '' };
  return { fora: txt.slice(0, a) + txt.slice(b + FI.length), dins: txt.slice(a, b) };
}

function arestes(n, txt, desti, registra) {
  let dinsCodi = false;
  txt.split('\n').forEach((ln, i) => {
    if (/^\s*```/.test(ln)) { dinsCodi = !dinsCodi; return; }
    if (dinsCodi) return;
    for (const m of ln.matchAll(ENLLAC)) {
      const r = resol(idx, m[1]);
      if (r.ok) { if (r.node !== n) desti.get(n).add(r.node); }
      else if (!registra) continue;
      else if (r.motiu === 'ambigu') ambigus.push({ font: n, linia: i + 1, desti: m[1], candidats: r.candidats });
      else penjats.push({ font: n, linia: i + 1, desti: m[1] });
    }
  });
}

for (const n of NODES) {
  // S'exclouen els fitxers de l'arxiu (05_ARXIU) dels índexs actius
  if (!n.endsWith('.md') || n.includes('/05_ARXIU/')) continue;
  const brut = fs.readFileSync(path.join(ARREL, n), 'utf8');
  const { fora, dins } = talla(brut);
  arestes(n, fora, out, true);
  arestes(n, fora, outReal, false);
  if (dins) arestes(n, dins, outReal, false);
}

/* ─────────────────── Abast dirigit des de les àncores ─────────────────── */

function abast(arrels, graf = out) {
  const vist = new Set();
  const cua = arrels.filter((a) => graf.has(a));
  cua.forEach((a) => vist.add(a));
  while (cua.length) {
    for (const d of graf.get(cua.pop())) if (!vist.has(d)) { vist.add(d); cua.push(d); }
  }
  return vist;
}

const ancoresReals = ANCORES.filter((a) => out.has(a));
if (ancoresReals.length === 0) {
  console.error(`❌ [LLAURADOR] Cap àncora existix: ${ANCORES.join(', ')}`);
  console.error('   Sense àncora no es pot decidir què és orfe. Usa --ancores=<ruta.md>');
  process.exit(2);
}

/* ──────────────── A quin índex li toca adoptar cada orfe ──────────────── */

const esIndex = (n) => /(^|\/)(00_INDEX|README|index)[^/]*\.md$/i.test(n);
const INDEXS = NODES.filter(esIndex);

function indexAdoptant(n) {
  let dir = path.posix.dirname(n);
  for (;;) {
    const propi = INDEXS.find((i) => path.posix.dirname(i) === dir && i !== n);
    if (propi) return propi;
    if (dir === '.' || dir === '' || !dir.includes('/')) break;
    dir = path.posix.dirname(dir);
  }
  return ancoresReals[0];
}

/* Títol curt per a l'enllaç: description del frontmatter, si no el primer H1. */
function retol(n) {
  if (!n.endsWith('.md')) return '';
  const txt = fs.readFileSync(path.join(ARREL, n), 'utf8');
  let desc = null;
  if (txt.startsWith('---')) {
    const fi = txt.indexOf('\n---', 3);
    if (fi > 0) {
      const m = txt.slice(4, fi).match(/^description:\s*(.+)$/m);
      if (m) desc = m[1].trim().replace(/^["']|["']$/g, '');
    }
  }
  if (!desc) desc = txt.split('\n').find((l) => /^#\s+/.test(l))?.replace(/^#\s+/, '').trim() ?? '';
  return desc.slice(0, 110);
}

/* ─────────────────────── Càlcul de punt fix ─────────────────────── */

/* Adoptar un orfe el fa abastable, cosa que pot fer abastables els seus fills.
 * Iterem fins que no queda res per adoptar: així el bloc conté el MÍNIM
 * conjunt d'enllaços que tanca el graf, no un llistat de tot el que no
 * penjava directament. */
const adopcions = new Map(); /* index → Set(orfe) */
const abastablesInicials = abast(ancoresReals).size;
let vist = abast(ancoresReals);
let voltes = 0;

/* Adoptem D'UN EN UN i recalculem. Adoptar-los tots de colp seria golafre:
 * si `.agents/index.md` està orfe i alhora enllaça a mà `BOOTSTRAP`, adoptar
 * només l'índex ja reconnecta el BOOTSTRAP. El bloc ha de contindre el MÍNIM
 * conjunt que tanca el graf, perquè si no s'endú el mèrit del que ja estava
 * cosit a mà i no s'autoesborra mai.
 *
 * Ordre: primer els índexs, després per profunditat. Un índex adoptat sol
 * arrossegar tot el seu subarbre. */
const prioritat = (n) => (esIndex(n) ? 0 : 1) * 1000 + n.split('/').length;
for (;;) {
  const pendents = NODES.filter((n) => !vist.has(n)).sort((a, b) => prioritat(a) - prioritat(b) || a.localeCompare(b));
  if (pendents.length === 0) break;
  if (++voltes > NODES.length + 1) break; /* cinturó anti-bucle */
  const orfe = pendents[0];
  const ix = indexAdoptant(orfe);
  if (!adopcions.has(ix)) adopcions.set(ix, new Set());
  adopcions.get(ix).add(orfe);
  out.get(ix).add(orfe);
  vist = abast(ancoresReals);
}

/* ──────────────────────────── Escriptura ──────────────────────────── */

function blocPer(ix) {
  const items = [...adopcions.get(ix)].sort();
  const linies = [
    INICI,
    '',
    '## Adopcions del Llaurador',
    '',
    '> Bloc generat per `tooling/wiki/llaurador_indexs.mjs`. No l\'edites a mà.',
    '> Mou cada enllaç a la secció temàtica que li toque i el llaurador el',
    '> llevarà d\'ací tot sol a la següent passada. Si el bloc queda buit,',
    '> desapareix: vol dir que la wiki està cosida a mà.',
    '',
    ...items.map((n) => {
      const r = retol(n);
      const nom = path.posix.basename(n, '.md');
      let obsPath = n.replace(/\.md$/, '');
      if (obsPath.startsWith('_wiki_de_poble/')) obsPath = obsPath.slice(15);
      return `- [[${obsPath}|${nom}]]${r ? ` — ${r}` : ''}`;
    }),
    '',
    FI,
  ];
  return linies.join('\n');
}

function aplica(ix) {
  const abs = path.join(ARREL, ix);
  const orig = fs.readFileSync(abs, 'utf8');
  const bloc = adopcions.has(ix) && adopcions.get(ix).size ? blocPer(ix) : '';
  const a = orig.indexOf(INICI);
  const b = orig.indexOf(FI);
  let nou;
  if (a >= 0 && b > a) {
    const abans = orig.slice(0, a).replace(/\n+$/, '');
    const despres = orig.slice(b + FI.length).replace(/^\n+/, '');
    nou = bloc
      ? `${abans}\n\n${bloc}\n${despres ? `\n${despres}` : ''}`
      : `${abans}\n${despres ? `\n${despres}` : ''}`;
  } else if (bloc) {
    nou = `${orig.replace(/\n+$/, '')}\n\n${bloc}\n`;
  } else return false;
  if (!nou.endsWith('\n')) nou += '\n';
  if (nou === orig) return false;
  if (ESCRIU) fs.writeFileSync(abs, nou);
  return true;
}

const tocats = [];
for (const ix of new Set([...adopcions.keys(), ...INDEXS])) if (aplica(ix)) tocats.push(ix);

/* Veredicte: el graf REAL (bloc inclòs) ha de cobrir tots els documents,
 * i els blocs de disc han d'estar al dia. Si falta escriure, la porta cau. */
const abastReal = abast(ancoresReals, outReal);
const inabastablesReals = NODES.filter((n) => !abastReal.has(n));
const blocsDesactualitzats = tocats;

/* ──────────────────────────── Informe ──────────────────────────── */

const totalOrfes = [...adopcions.values()].reduce((a, s) => a + s.size, 0);

if (JSON_OUT) {
  console.log(JSON.stringify({
    documents: NODES.length,
    abastables: vist.size,
    adoptats: totalOrfes,
    adopcions: Object.fromEntries([...adopcions].map(([k, v]) => [k, [...v]])),
    penjats, ambigus,
    indexsTocats: tocats,
    escrit: ESCRIU,
  }, null, 1));
} else {
  console.log('\n🚜 LLAURADOR D\'ÍNDEXS — adopció automàtica d\'orfes');
  console.log('─'.repeat(72));
  console.log(`  ${NODES.length} documents · àncora: ${ancoresReals.join(', ')}`);
  console.log(`  abastables abans d'adoptar: ${abastablesInicials}/${NODES.length}`);
  console.log(`  a adoptar: ${totalOrfes} (en ${voltes} volta/es fins a punt fix)\n`);
  for (const [ix, set] of [...adopcions].sort()) {
    console.log(`  📌 ${ix}`);
    for (const o of [...set].sort()) console.log(`       + ${o}`);
  }
  if (ambigus.length) {
    console.log(`\n  ⚠️  ENLLAÇOS AMBIGUS — ${ambigus.length} (el resolutor antic se'ls inventava)`);
    for (const a of ambigus.slice(0, 8)) {
      console.log(`       ${a.font}:${a.linia}  [[${a.desti}]] → ${a.candidats.length} candidats`);
    }
  }
  if (penjats.length) console.log(`\n  ⚠️  ENLLAÇOS PENJATS — ${penjats.length}`);
  console.log('\n' + '─'.repeat(72));
  if (ESCRIU) console.log(`✍️  Escrits ${tocats.length} índex(s).`);
  else if (totalOrfes) console.log(`Res escrit. Executa amb --escriu per a adoptar.`);
}

if (CHECK) {
  if (inabastablesReals.length > 0) {
    console.error(`\n❌ [LLAURADOR] ${inabastablesReals.length} document(s) no s'abasten des de l'àncora ni pel bloc.`);
    inabastablesReals.slice(0, 100).forEach((n) => console.error(`     · ${n}`));
    process.exit(1);
  }
  if (blocsDesactualitzats.length > 0) {
    console.error(`\n❌ [LLAURADOR] ${blocsDesactualitzats.length} índex(s) amb el bloc d'adopcions desactualitzat:`);
    blocsDesactualitzats.forEach((n) => console.error(`     · ${n}`));
    console.error('   Arregla-ho: node tooling/wiki/llaurador_indexs.mjs --escriu');
    process.exit(1);
  }
  console.log(`\n✅ [LLAURADOR] ${NODES.length}/${NODES.length} documents s'abasten des de l'àncora. Zero orfes.`);
  if (totalOrfes) console.log(`   (${totalOrfes} encara penja del bloc automàtic: cus-los a mà quan pugues)`);
  process.exit(0);
}
