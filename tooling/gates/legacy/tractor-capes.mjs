#!/usr/bin/env node
/**
 * PORTA: ORDRE REAL DE CAPES
 * --------------------------
 * Les portes que hi havia comptaven cadenes de text. Esta resol la
 * cascada com la resol el navegador: seguint els @import en ordre i
 * registrant cada nom de capa la PRIMERA vegada que apareix.
 *
 * Va nàixer perquè `@layer components` s'importava (components.css,
 * línia 2 del monòlit) ABANS de la sentència `@layer reset, sdp,
 * legacy, utilities;` (línia 39). Resultat real:
 *     components < reset < sdp < legacy < utilities
 * és a dir, els components canònics perdien contra `legacy` mentre el
 * capçal del fitxer jurava el contrari. Cap porta ho veia.
 *
 * Ús:  node tooling/gates/tractor-capes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
const ENTRADA = path.join(ARREL, 'src/css/index.css');

/** L'ordre que el Mestre ha decidit. Qualsevol desviació és una fallada. */
const ORDRE_CANONIC = ['reset', 'sdp', 'legacy', 'components', 'utilities'];

const RE_IMPORT = /@import\s+url\(\s*['"]([^'"]+)['"]\s*\)([^;]*);/g;
const RE_LAYER = /@layer\s+([A-Za-z0-9_\s,-]+?)\s*[;{]/g;
const RE_COMENTARI = /\/\*[\s\S]*?\*\//g;

const ordre = [];
const procedencia = new Map();
const vistos = new Set();
const problemes = [];

function registra(nom, fitxer) {
  if (ordre.includes(nom)) return;
  ordre.push(nom);
  procedencia.set(nom, fitxer);
}

/** Recorre el full en ordre de document, entrant als @import. */
function recorre(fitxer) {
  if (vistos.has(fitxer)) return;
  vistos.add(fitxer);
  if (!fs.existsSync(fitxer)) {
    problemes.push(`@import trencat: ${path.relative(ARREL, fitxer)}`);
    return;
  }
  const cru = fs.readFileSync(fitxer, 'utf8').replace(RE_COMENTARI, '');
  const rel = path.relative(ARREL, fitxer);

  // Esdeveniments (posició, tipus) per a recórrer en ordre de document.
  const fets = [];
  for (const m of cru.matchAll(RE_IMPORT)) {
    fets.push({ pos: m.index, tipus: 'import', ruta: m[1], cua: m[2] || '' });
  }
  for (const m of cru.matchAll(RE_LAYER)) {
    fets.push({ pos: m.index, tipus: 'layer', noms: m[1] });
  }
  fets.sort((a, b) => a.pos - b.pos);

  for (const f of fets) {
    if (f.tipus === 'layer') {
      f.noms.split(',').map((n) => n.trim()).filter(Boolean)
        .forEach((n) => registra(n, rel));
    } else {
      // @import ... layer(nom) registra la capa en este punt.
      const ml = f.cua.match(/layer\(\s*([A-Za-z0-9_-]+)\s*\)/);
      if (ml) registra(ml[1], rel);
      recorre(path.resolve(path.dirname(fitxer), f.ruta));
    }
  }
}

recorre(ENTRADA);

console.log('[CAPES] Ordre real resolt:');
ordre.forEach((n, i) =>
  console.log(`   ${i + 1}. ${n.padEnd(12)} ← ${procedencia.get(n)}`));

if (ordre.join('|') !== ORDRE_CANONIC.join('|')) {
  problemes.push(
    `Ordre incorrecte.\n     esperat: ${ORDRE_CANONIC.join(' < ')}\n     obtingut: ${ordre.join(' < ')}`
  );
}

// Una capa declarada i mai usada és un nom mort al contracte.
const usades = new Set();
for (const f of vistos) {
  if (!fs.existsSync(f)) continue;
  const cru = fs.readFileSync(f, 'utf8').replace(RE_COMENTARI, '');
  for (const m of cru.matchAll(/@layer\s+([A-Za-z0-9_-]+)\s*\{/g)) usades.add(m[1]);
}
for (const n of ORDRE_CANONIC) {
  if (!usades.has(n)) problemes.push(`Capa declarada però sense cap bloc: \`${n}\``);
}

if (problemes.length) {
  console.error('\n[CAPES] ❌ FALLADA');
  problemes.forEach((p) => console.error('   · ' + p));
  process.exit(1);
}
console.log('\n[CAPES] ✅ Superada.');
