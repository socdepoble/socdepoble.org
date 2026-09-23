#!/usr/bin/env node
/**
 * tractor-rutes.mjs — LA RUTA ES DECLARA UNA VEGADA O NO ES DECLARA
 *
 * PREMISSA (auditoria 260829):
 * `project_paths.mjs` és una SSOT excel·lent: descobrix l'arrel per
 * estructura, comprova `nlink`, i falla tancada si no en troba exactament
 * una. Però exportava PROJECT_DIR, WIKI_DIR, TOOLING_WIKI_DIR i
 * WIKI_BASELINE_FILE — i prou.
 *
 * NO exportava ESCRIPTORI_DIR.
 *
 * Resultat: 21 fitxers importaven `project_paths` i després ~20 fitxers
 * concatenaven a mà el literal '04_escriptori'. L'única ruta
 * que l'agent s'equivocava cada volta era l'única que no es podia importar.
 *
 * Aquest tractor convertix la regla en física: qualsevol fitxer de tooling/
 * que escriga un literal de ruta canònica sense importar-lo, falla.
 *
 * LLEIS:
 *   R1 · literal-orfe        Literal de directori canònic sense importar project_paths. DURA.
 *   R2 · ssot-incompleta     project_paths no exporta tots els directoris canònics. DURA.
 *   R3 · porta-sense-cli     Un script llistat a `npm run porta` sense entrada CLI. DURA.
 *
 * ÚS:  node tooling/gates/tractor-rutes.mjs [--detall]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ARREL = process.cwd();
const DETALL = process.argv.includes('--detall');
const BASELINE = process.argv.includes('--baseline');
const DEUTE_PATH = join(ARREL, '.agents/deute/.rutes-deute.json');

/**
 * R1 admet deute: hi ha 52 literals escampats i no es poden llevar tots
 * en una tarda. R2 i R3 no: son binaries i ja estan a zero. El dia que
 * l'ultim literal desaparega, esborra .rutes-deute.json i R1 tambe passa
 * a ser dura.
 */
const LLEIS_DURES = new Set(['ssot-incompleta', 'porta-sense-cli']);
const SSOT = 'tooling/wiki/lib/project_paths.mjs';

/** Directoris canònics: literal prohibit -> export que l'ha de substituir. */
const CANONICS = {
  '04_escriptori': 'ESCRIPTORI_DIR',
  '_wiki_de_poble': 'WIKI_DIR'
};

/** Fitxers exempts: la SSOT mateixa i la documentació. */
const EXEMPTS = new Set([SSOT]);
const EXT = ['.mjs', '.js', '.cjs'];
const ABAST = ['tooling'];

const infraccions = [];
const registra = (llei, fitxer, linia, missatge) =>
  infraccions.push({ llei, fitxer, linia, missatge });

function camina(dir, acc = []) {
  const abs = join(ARREL, dir);
  if (!existsSync(abs)) return acc;
  for (const nom of readdirSync(abs)) {
    if (nom === 'node_modules' || nom.startsWith('.')) continue;
    const rel = join(dir, nom);
    if (statSync(join(ARREL, rel)).isDirectory()) camina(rel, acc);
    else if (EXT.includes(extname(nom))) acc.push(rel);
  }
  return acc;
}

/* ─── R2: la SSOT ha de ser completa ─── */
const ssotAbs = join(ARREL, SSOT);
if (!existsSync(ssotAbs)) {
  console.error(`PARAT. No es troba la SSOT de rutes (${SSOT}).`);
  process.exit(1);
}
const ssotText = readFileSync(ssotAbs, 'utf8');
for (const [literal, exportacio] of Object.entries(CANONICS)) {
  if (!new RegExp(`export\\s+const\\s+${exportacio}\\b`).test(ssotText)) {
    registra('ssot-incompleta', SSOT, 1,
      `Falta \`export const ${exportacio}\`. Mentre no existisca, ${literal} s'escriurà a mà per tot arreu.`);
  }
}

/* ─── R1: cap literal orfe ─── */
for (const dir of ABAST) {
  for (const fitxer of camina(dir)) {
    if (EXEMPTS.has(fitxer)) continue;
    const text = readFileSync(join(ARREL, fitxer), 'utf8');
    const importa = /from\s+['"][^'"]*project_paths\.mjs['"]/.test(text);
    if (importa) continue;

    const linies = text.split('\n');
    for (let i = 0; i < linies.length; i++) {
      const net = linies[i].replace(/\/\/.*$/, '');
      if (/^\s*\*/.test(linies[i])) continue; // comentari de bloc
      for (const [literal, exportacio] of Object.entries(CANONICS)) {
        if (net.includes(literal)) {
          registra('literal-orfe', fitxer, i + 1,
            `Literal «${literal}» sense importar la SSOT. Usa \`${exportacio}\` de ${SSOT}.`);
        }
      }
    }
  }
}

/* ─── R3: tot script de la porta ha de tindre entrada CLI ─── */
const pkgPath = join(ARREL, 'package.json');
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const cadena = Object.entries(pkg.scripts || {})
    .filter(([k]) => k === 'porta' || k.startsWith('porta:'))
    .map(([, v]) => v).join(' && ');

  const scripts = [...cadena.matchAll(/node\s+([\w./-]+\.mjs)/g)].map(m => m[1]);
  for (const s of [...new Set(scripts)]) {
    const abs = join(ARREL, s);
    if (!existsSync(abs)) {
      registra('porta-sense-cli', s, 1, 'Declarat a la porta però no existix al disc.');
      continue;
    }
    const t = readFileSync(abs, 'utf8');
    const teCli = /import\.meta\.url/.test(t) || /process\.argv\[1\]/.test(t);
    const teExit = /process\.exit\s*\(/.test(t);
    if (!teCli && !teExit) {
      registra('porta-sense-cli', s, 1,
        'Declarat a `npm run porta` però no té punt d\'entrada CLI: `node ' + s + '` ix amb codi 0 sense fer res.');
    }
  }
}

/* ─── Informe i ratchet ─── */
const perLlei = (ll) => infraccions.filter(i => i.llei === ll);
const NOMS = {
  'literal-orfe': 'R1 literal de ruta orfe',
  'ssot-incompleta': 'R2 SSOT de rutes incompleta',
  'porta-sense-cli': 'R3 script de porta sense CLI'
};

// La identitat ignora el numero de linia: moure codi no crea deute.
const identitat = (i) => `${i.llei}|${i.fitxer}|${i.missatge.slice(0, 40)}`;
const actual = {};
for (const i of infraccions) {
  actual[i.llei] = actual[i.llei] || { max: 0, identitats: [] };
  actual[i.llei].max += 1;
  actual[i.llei].identitats.push(identitat(i));
}
for (const r of Object.values(actual)) r.identitats = [...new Set(r.identitats)].sort();

for (const llei of Object.keys(NOMS)) {
  const t = perLlei(llei);
  console.log(`${NOMS[llei].padEnd(34)}: ${t.length}`);
  if (DETALL || llei !== 'literal-orfe') {
    for (const i of t) console.log(`    ${i.fitxer}:${i.linia}  ${i.missatge}`);
  }
}

if (BASELINE) {
  writeFileSync(DEUTE_PATH, JSON.stringify(actual, null, 2) + '\n', 'utf8');
  console.log('\nDeute de rutes congelat a .rutes-deute.json. Nomes pot baixar.');
  process.exit(0);
}

let trencat = false;
for (const llei of Object.keys(NOMS)) {
  const d = actual[llei] || { max: 0, identitats: [] };
  if (LLEIS_DURES.has(llei)) {
    if (d.max > 0) { console.error(`\nLLEI DURA · ${NOMS[llei]}: ${d.max}`); trencat = true; }
    continue;
  }
  if (d.max === 0) continue;
  if (!existsSync(DEUTE_PATH)) {
    console.error(`\nPARAT. No hi ha .rutes-deute.json i queden ${d.max} literals orfes.`);
    console.error('Executa una vegada: node tooling/gates/tractor-rutes.mjs --baseline\n');
    process.exit(1);
  }
  const previ = JSON.parse(readFileSync(DEUTE_PATH, 'utf8'));
  const base = previ[llei] || { max: 0, identitats: [] };
  const conegudes = new Set(base.identitats);
  const noves = d.identitats.filter(i => !conegudes.has(i));
  if (d.max > base.max || noves.length > 0) {
    console.error(`\nDEUTE PUJA · ${NOMS[llei]}: ${base.max} -> ${d.max}`);
    for (const n of noves) console.error(`    NOVA: ${n}`);
    trencat = true;
  } else if (d.max < base.max) {
    console.log(`  ${NOMS[llei]}: ${base.max} -> ${d.max}  (baixa)`);
  }
}

if (trencat) {
  if (!DETALL) console.log('\n(usa --detall per a vore els literals un per un)');
  console.error('\nPARAT. Les rutes canoniques han de vindre de la SSOT.');
  process.exit(1);
}
console.log('PASSA. Cap ruta canonica nova escrita a ma.');
process.exit(0);
