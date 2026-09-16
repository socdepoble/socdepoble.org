#!/usr/bin/env node
/**
 * tractor-lapida.mjs — Porta de commit contra la resurrecció de cadàvers.
 *
 * Detecta dues patologies a l'índex abans que entren a la història:
 *   1. EXHUMACIÓ  — el contingut posat en escena és idèntic byte a byte a una
 *                   versió d'eixa mateixa ruta de fa més de LLINDAR_DIES dies.
 *                   Això només passa amb un `git checkout <sha> -- <ruta>`.
 *   2. AMPUTACIÓ  — el fitxer perd més de LLINDAR_PERDUA de les seues línies.
 *
 * Deixa passar només si el missatge de commit porta el segell:
 *   RESTAURACIÓ-VALIDADA: <segell de desenterrar.mjs>
 *
 * Instal·lació (hook commit-msg, que sí que veu el missatge):
 *   printf '#!/bin/sh\nexec node eines/tractor-lapida.mjs "$1"\n' > .git/hooks/commit-msg
 *   chmod +x .git/hooks/commit-msg
 *
 * Ús manual (CI):  node eines/tractor-lapida.mjs --missatge "text del commit"
 *
 * Codis d'eixida: 0 net · 1 bloquejat.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const LLINDAR_DIES = 7;
const LLINDAR_PERDUA = 0.30;
const EXTENSIONS = /\.(jsx?|mjs|cjs|tsx?|css|json|md|sql|php)$/i;

const C = process.stdout.isTTY
  ? { r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[1m', x: '\x1b[0m', d: '\x1b[2m' }
  : { r: '', g: '', y: '', b: '', x: '', d: '' };

function git(args, opcions = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'], ...opcions }).trim();
  } catch { return null; }
}

// ── missatge de commit
const a = process.argv.slice(2);
let missatge = '';
const idxM = a.indexOf('--missatge');
if (idxM !== -1) missatge = a[idxM + 1] ?? '';
else if (a[0] && existsSync(a[0])) missatge = readFileSync(a[0], 'utf8');

const segellDeclarat = (missatge.match(/RESTAURACI[ÓO]-VALIDADA:\s*([0-9a-f]{16})/i) || [])[1] || null;

// ── fitxers modificats en escena
const escena = (git(['diff', '--cached', '--name-status', '--diff-filter=M']) || '')
  .split('\n').filter(Boolean)
  .map((l) => l.split('\t'))
  .filter(([, ruta]) => EXTENSIONS.test(ruta || ''));

const delictes = [];

for (const [, ruta] of escena) {
  const blobEscena = git(['rev-parse', `:${ruta}`]);
  const blobHead = git(['rev-parse', `HEAD:${ruta}`]);
  if (!blobEscena || blobEscena === blobHead) continue;

  const líniesEscena = (git(['cat-file', '-p', blobEscena]) || '').split('\n').length;
  const líniesHead = blobHead ? (git(['cat-file', '-p', blobHead]) || '').split('\n').length : líniesEscena;

  // 1 · EXHUMACIÓ: ¿este contingut exacte ja va existir fa temps?
  const històric = (git(['log', '--all', '-n', '400', '--format=%H %cI', '--', ruta]) || '')
    .split('\n').filter(Boolean).map((l) => l.split(' '));
  let exhumat = null;
  if (històric.length) {
    let blobs = [];
    try {
      blobs = execFileSync('git', ['cat-file', '--batch-check=%(objectname)'],
        { input: històric.map(([c]) => `${c}:${ruta}`).join('\n') + '\n', encoding: 'utf8' })
        .trim().split('\n');
    } catch { blobs = []; }
    for (let i = 0; i < històric.length && i < blobs.length; i++) {
      if (blobs[i].trim() !== blobEscena) continue;
      const dies = Math.floor((Date.now() - new Date(històric[i][1])) / 86400000);
      if (dies > LLINDAR_DIES && (!exhumat || dies > exhumat.dies)) {
        exhumat = { dies, commit: històric[i][0].slice(0, 8) };
      }
    }
  }
  if (exhumat) {
    delictes.push({
      ruta, tipus: 'EXHUMACIÓ',
      detall: `contingut idèntic a ${exhumat.commit} de fa ${exhumat.dies} dies`,
    });
  }

  // 2 · AMPUTACIÓ
  const pèrdua = líniesHead ? (líniesHead - líniesEscena) / líniesHead : 0;
  if (pèrdua > LLINDAR_PERDUA) {
    delictes.push({
      ruta, tipus: 'AMPUTACIÓ',
      detall: `${líniesHead} → ${líniesEscena} línies (−${(pèrdua * 100).toFixed(0)}%)`,
    });
  }
}

if (!delictes.length) process.exit(0);

if (segellDeclarat) {
  console.log(`${C.y}⚠ tractor-lapida: ${delictes.length} avís(os) coberts pel segell ${segellDeclarat}.${C.x}`);
  for (const d of delictes) console.log(`${C.d}   ${d.tipus}  ${d.ruta}  ${d.detall}${C.x}`);
  process.exit(0);
}

console.error(`
${C.r}${C.b}╔═══ TRACTOR-LÀPIDA: COMMIT BLOQUEJAT ════════════════════════${C.x}`);
for (const d of delictes) {
  console.error(`${C.r}  ${d.tipus.padEnd(10)}${C.x} ${d.ruta}\n              ${C.d}${d.detall}${C.x}`);
}
console.error(`${C.r}${C.b}╚═════════════════════════════════════════════════════════════${C.x}

Estàs a punt d'escriure a la història un fitxer que ja estava mort.
Si és intencionat, passa primer per l'autòpsia:

   node eines/desenterrar.mjs --ref <sha> --fitxer <ruta>

i afig al missatge de commit la línia que t'escupirà:

   RESTAURACIÓ-VALIDADA: <segell>
`);
process.exit(1);
