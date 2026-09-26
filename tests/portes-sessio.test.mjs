/**
 * Portes de la cadena en mode lectura, per a agents engabiats (el hook local
 * no admet `npm run porta`). Executa una a una les portes de
 * tooling/gates/run-portes.mjs, sense parar a la primera roja, i falla si en
 * cau alguna que no consta com a roja heretada. No executa la Porta Build
 * (pot llançar `npm run build` i escriure dist/) ni les dues suites de
 * proves (Vitest i node --test es passen a banda).
 *
 * ROGES_HERETADES és el relleu d'ESTAT del 2026-09-25 (Codex, «Pendents
 * Reflex, Pedra Seca, Fitxa, Crom, Frontmatter, Nomenclatura, Inline Styles i
 * Catàleg»). Una porta que ix d'eixa llista no s'hi torna a posar per a
 * fabricar un verd: es resol o es documenta.
 *
 * Ús:  node --test tests/portes-sessio.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { passos } from '../tooling/gates/run-portes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORA = new Set(['Porta Build', 'Proves NodeJS', 'Proves']);
const ROGES_HERETADES = new Set([
  'Porta Reflex', 'Tractor Pedra Seca', 'Porta Fitxa Gestor', 'Porta Crom (closca immutable)',
  'Porta Frontmatter', 'Porta Nomenclatura', 'Porta Inline-Styles (Salfumà)', 'Porta Catàleg'
]);

const cua = (text, n = 12) => String(text || '').trim().split('\n').slice(-n).map((l) => `      ${l}`).join('\n');

test('portes de la cadena (lectura)', () => {
  const resultats = [];
  for (const pas of passos.filter((p) => !FORA.has(p.nom))) {
    const r = spawnSync(pas.cmd, pas.args, {
      cwd: ROOT, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, SDP_DINS_DE_PORTA: '1' }
    });
    const verd = !r.error && r.status === 0;
    resultats.push({ nom: pas.nom, verd, eixida: `${r.stdout || ''}\n${r.stderr || ''}${r.error ? `\n${r.error.message}` : ''}` });
  }
  const noves = resultats.filter((r) => !r.verd && !ROGES_HERETADES.has(r.nom));
  const informe = resultats.map((r) => {
    const marca = r.verd ? '✅' : (ROGES_HERETADES.has(r.nom) ? '🟠 heretada' : '❌ NOVA');
    return `${marca} ${r.nom}${r.verd ? '' : `\n${cua(r.eixida)}`}`;
  });
  const verdes = resultats.filter((r) => r.verd).length;
  process.stdout.write(`${informe.join('\n')}\n\n${verdes}/${resultats.length} portes verdes · ${noves.length} roges noves\n`);
  assert.equal(noves.length, 0, `Portes roges noves: ${noves.map((r) => r.nom).join(', ')}`);
});
