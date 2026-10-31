/* Porta Rutes · R1 literal orfe (Ordre del Mestre, 30-10-2026). El literal canònic compta
   només com a nom sencer: l'arxiu fred germà («../_arxiu_» + el nom de la Wiki) no és la Wiki.
   Un literal real (també darrere de «../» o de «/») continua caient. Fixtures temporals,
   sense .rutes-deute.json: qualsevol literal orfe para la porta. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORTA = fileURLToPath(new URL('../tooling/gates/tractor-rutes.mjs', import.meta.url));
const WIKI = ['_wiki', 'de', 'poble'].join('_');
const ESCRIPTORI = '04_escriptori';

function corre(fitxers) {
  const arrel = mkdtempSync(path.join(os.tmpdir(), 'sdp-rutes-'));
  try {
    const tots = {
      'tooling/wiki/lib/project_paths.mjs': `export const ESCRIPTORI_DIR = '${WIKI}/${ESCRIPTORI}';\nexport const WIKI_DIR = '${WIKI}';\n`,
      ...fitxers
    };
    for (const [rel, text] of Object.entries(tots)) {
      mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
      writeFileSync(path.join(arrel, rel), text);
    }
    const r = spawnSync(process.execPath, [PORTA, '--detall'], { cwd: arrel, encoding: 'utf8', env: { PATH: process.env.PATH } });
    return { status: r.status, eixida: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(arrel, { recursive: true, force: true });
  }
}

test('R1: l’arxiu fred germà («../_arxiu_» + el nom de la Wiki) no és un literal de la Wiki', () => {
  const r = corre({ 'tooling/maquinaria/poda.mjs': `const ARXIU = path.resolve(ROOT, '../_arxiu${WIKI}');\nconst LLISTA = ['_arxiu${WIKI}', 'x'];\n` });
  assert.equal(r.status, 0, r.eixida);
  assert.match(r.eixida, /R1 literal de ruta orfe {11}: 0/);
  assert.match(r.eixida, /PASSA/);
});

test('R1: un literal real de la Wiki o de l’Escriptori encara cau, també darrere de «../» o de «/»', () => {
  const r = corre({
    'tooling/maquinaria/poda.mjs': `const ARXIU = path.resolve(ROOT, '../_arxiu${WIKI}');\n`,
    'tooling/eina.mjs': `const A = '${WIKI}/10_actes';\nconst B = path.join(ROOT, '../${WIKI}');\nconst C = 'x/${ESCRIPTORI}/y';\n`
  });
  assert.equal(r.status, 1, r.eixida);
  assert.match(r.eixida, /R1 literal de ruta orfe {11}: 3/);
  assert.match(r.eixida, new RegExp(`tooling/eina\\.mjs:1  Literal «${WIKI}»`));
  assert.match(r.eixida, new RegExp(`tooling/eina\\.mjs:2  Literal «${WIKI}»`));
  assert.match(r.eixida, new RegExp(`tooling/eina\\.mjs:3  Literal «${ESCRIPTORI}»`));
  assert.doesNotMatch(r.eixida, /poda\.mjs/);
});
