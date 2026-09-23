#!/usr/bin/env node
/**
 * generar_genoma_v2.mjs — Generador de Genoma byte-fidel (Estratègia del Clon).
 * Destí proposat: 02_ACTUAR_Maquina_Tecnica/scripts/generar_genoma_v2.mjs
 *
 * SUBSTITUEIX generar_bundle_global.mjs, que tenia quatre defectes letals
 * verificats en l'Auditoria 260718 del Seient Núm. 5:
 *   1. Injectava «\n\n» abans de cada separador i una línia buida després:
 *      cap consumidor podia reconstruir bytes exactes → tots els hashes del
 *      sistema (schemaSha256, treeSha256, planDigest) queden invalidats al clon.
 *   2. Filtrava per extensió (.md/.mjs/.js/.json) i silenciava .cjs, .sh,
 *      .yaml, Makefile, .githooks/ i .obsidian/graph.json: el genoma prometia
 *      «tot» i naixia sense òrgans (25/27 tests del Reflex no poden córrer).
 *   3. Cap manifest ni integritat: el clon no pot saber què li falta.
 *   4. Cap porta PII: l'exportació esquivava l'esperit de P-05.
 *
 * FORMAT v2 (llegible i alhora byte-exacte):
 *   ::: FITXER <ruta> bytes=<N> sha256=<hex> [binari=base64]
 *   <exactament N bytes de contingut, sense cap línia afegida>
 *   ::: FI <ruta>
 * La longitud declarada és l'autoritat de lectura (no hi ha col·lisió possible
 * amb continguts que continguen «::: FI»). El peu inclou un MANIFEST amb el
 * cens complet, els exclosos declarats i un genomaSha256 global.
 *
 * Zero dependències. Node >= 20. Fail-closed (P-07).
 *
 * Ús:
 *   node generar_genoma_v2.mjs [--arrel=/ruta/repo] [--eixida=/ruta] [--permet-pii]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isUtf8 } from 'node:buffer';

// ---------- Configuració d'abast (explícita i auditable) ----------
// Arrels relatives al repositori que formen part del genoma transmissible.
const ROOTS = [
  'AGENTS.md',                       // autoritat màxima segons .agents/AGENTS.md
  '.agents',
  '.githooks',                       // sense això, 27/32 tests del Reflex moren al clon
  '.gitignore',
  'package.json',
  'vite.config.js',
  'index.html',
  'src',                             // el cos: sense codi viu no hi ha «zero caixes negres»
  'scripts',
  'tooling/wiki',
  '_wiki_de_poble/01_ser',
  '_wiki_de_poble/02_saber',
  '_wiki_de_poble/03_actuar',
  '_wiki_de_poble/02_saber',
  '_wiki_de_poble/.obsidian/graph.json', // contracte de la Vista Gràfica (pre-commit 2/4)
];
// .sdp-reflex queda FORA per disseny: el propi .gitignore del repositori el
// declara privat. Exportar sessions i bootstraps del Reflex en un genoma
// públic contradiu P-05 i la Llei 1 del GENOTIP.
const SKIP_DIR_NAMES = new Set([
  '.git', 'node_modules', 'dist', 'build', '_build', 'coverage',
  '.sdp-reflex', '.wiki-safety', '.snapshots',
  '90_historic', '04_escriptori',
]);
// Extensions que es transmeten com a binari (base64) si cal; la resta de
// no-UTF8 es declaren al manifest amb sha256 però no s'incrusten.
const BINARI_INLINE_MAX = 64 * 1024;

// Patrons P-05 (rèplica literal dels SENSITIVE_OUTPUT_PATTERNS de
// lib/sdp-skill-cli.mjs, que són privats d'aquell mòdul).
const PII_PATTERNS = [
  ['IBAN', /\b[A-Z]{2}\d{2}(?:[ .-]?\d{4}){4,7}\b/gu],
  ['correu electrònic', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu],
  ['DNI o NIE', /\b(?:(?:\d[ .-]?){8}|[XYZ][ .-]?(?:\d[ .-]?){7})[ .-]?[A-Z]\b/gu],
  ['telèfon personal probable', /(?<![\d_])(?:\+34[ .-]?)?[6789]\d{2}(?:[ .-]?\d{3}){2}(?![\d_])/gu],
];
const PII_EXEMPTS = /example\.|exemple\.|ejemplo\.|exemplo\.|adibidea\.|socdepoble\.org|12\.345\.678|00000000T/i;

const sha256 = (b) => createHash('sha256').update(b).digest('hex');

function parseArgs(argv) {
  const out = { arrel: null, eixida: null, permetPii: false };
  for (const a of argv) {
    if (a.startsWith('--arrel=')) out.arrel = a.slice(8);
    else if (a.startsWith('--eixida=')) out.eixida = a.slice(9);
    else if (a === '--permet-pii') out.permetPii = true;
    else throw new Error(`Argument desconegut: ${a}`);
  }
  return out;
}

function* caminar(abs, rel) {
  const st = fs.lstatSync(abs);
  if (st.isSymbolicLink()) { yield { rel, tipus: 'symlink' }; return; }
  if (st.isFile()) { yield { rel, tipus: 'fitxer', abs, bytes: st.size }; return; }
  if (!st.isDirectory()) return;
  const entrades = fs.readdirSync(abs, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'ca'));
  for (const e of entrades) {
    if (SKIP_DIR_NAMES.has(e.name)) continue;
    yield* caminar(path.join(abs, e.name), path.posix.join(rel, e.name));
  }
}

async function main() {
  const { arrel, eixida, permetPii } = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(arrel ?? process.cwd());

  const fitxers = [];
  const absents = [];
  for (const r of ROOTS) {
    const abs = path.join(repoRoot, r);
    if (!fs.existsSync(abs)) { absents.push(r); continue; }
    for (const f of caminar(abs, r)) fitxers.push(f);
  }

  const parts = [];
  const manifest = { textuals: [], binaris_inline: [], binaris_exclosos: [], symlinks: [] };
  const shaGlobals = createHash('sha256');
  let piiTrobada = [];

  for (const f of fitxers) {
    if (f.tipus === 'symlink') { manifest.symlinks.push(f.rel); continue; }
    const buf = await fs.promises.readFile(f.abs);
    const hash = sha256(buf);
    shaGlobals.update(`${f.rel}\n${hash}\n`);
    if (isUtf8(buf)) {
      const text = buf.toString('utf8');
      for (const [nom, re] of PII_PATTERNS) {
        for (const m of text.match(re) ?? []) {
          if (!PII_EXEMPTS.test(m)) piiTrobada.push(`${f.rel}: ${nom} «${m}»`);
        }
      }
      parts.push(`::: FITXER ${f.rel} bytes=${buf.length} sha256=${hash}\n`, buf, `\n::: FI ${f.rel}\n`);
      manifest.textuals.push({ ruta: f.rel, bytes: buf.length, sha256: hash });
    } else if (buf.length <= BINARI_INLINE_MAX) {
      const b64 = buf.toString('base64');
      parts.push(`::: FITXER ${f.rel} bytes=${b64.length} sha256=${hash} binari=base64\n`, b64, `\n::: FI ${f.rel}\n`);
      manifest.binaris_inline.push({ ruta: f.rel, bytes: buf.length, sha256: hash });
    } else {
      manifest.binaris_exclosos.push({ ruta: f.rel, bytes: buf.length, sha256: hash });
    }
  }

  if (piiTrobada.length && !permetPii) {
    console.error('❌ [P-05] El genoma conté possibles dades personals i no es genera:');
    for (const linia of piiTrobada.slice(0, 20)) console.error('   - ' + linia);
    console.error('Revisa-ho o repeteix amb --permet-pii si és fals positiu verificat.');
    process.exitCode = 2;
    return;
  }

  const genomaSha256 = shaGlobals.digest('hex');
  const capçalera = [
    '# GENOMA SDP v2 — transmissió byte-fidel del Sistema Operatiu de la IAIA MarIA',
    `# arrel=${path.basename(repoRoot)} generat=${new Date().toISOString()}`,
    `# fitxers=${manifest.textuals.length + manifest.binaris_inline.length} genomaSha256=${genomaSha256}`,
    '# Lectura: cada bloc declara bytes=N; l\'hidratador llig exactament N bytes.',
    '',
  ].join('\n');
  const peu = '\n::: MANIFEST\n' + JSON.stringify({
    schema: 'socdepoble.genoma.v2',
    genomaSha256,
    arrels: ROOTS,
    arrels_absents: absents,
    exclusions_directori: [...SKIP_DIR_NAMES],
    ...manifest,
  }, null, 2) + '\n::: FI MANIFEST\n';

  const pad = (n) => String(n).padStart(2, '0');
  const ara = new Date();
  const ts = `${String(ara.getFullYear()).slice(2)}${pad(ara.getMonth() + 1)}${pad(ara.getDate())}_${pad(ara.getHours())}${pad(ara.getMinutes())}`;
  const nom = `${ts}_GENOMA_Sistema_Operatiu_IAIA_MarIA_v2.md`;
  const dirEixida = path.resolve(eixida ?? path.join(repoRoot, '_wiki_de_poble/04_escriptori'));
  fs.mkdirSync(dirEixida, { recursive: true });
  const desti = path.join(dirEixida, nom);

  const fd = fs.openSync(desti, 'wx'); // mai sobreescriu (P-08)
  try {
    fs.writeSync(fd, capçalera);
    for (const p of parts) fs.writeSync(fd, p);
    fs.writeSync(fd, peu);
  } finally { fs.closeSync(fd); }

  console.log(desti);
  console.log(`✓ ${manifest.textuals.length} textuals, ${manifest.binaris_inline.length} binaris inline, ` +
    `${manifest.binaris_exclosos.length} binaris exclosos (declarats), ${absents.length} arrels absents (declarades).`);
  if (piiTrobada.length) console.log(`⚠ ${piiTrobada.length} coincidències PII acceptades amb --permet-pii.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
