/**
 * Proves deterministes de C3 multi-tema en tooling/gates/tractor-cromatic.mjs (Onada R30.2).
 * Verifica els 4 contextos de Capa 2 (clar, dark, bancal, dark+bancal) sobre --sdp-fons-targeta i --sdp-fons-app.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACTOR = path.join(ARREL, 'tooling/gates/tractor-cromatic.mjs');

function creaFixtureCromatica(t, mutadorTokensCss) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cromatic-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const rel of ['src/css/tokens.css', 'src/css/design-tokens.css', 'src/sections/disseny/DesignSection.jsx']) {
    const dest = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const cru = fs.readFileSync(path.join(ARREL, rel), 'utf8');
    fs.writeFileSync(dest, rel === 'src/css/tokens.css' ? mutadorTokensCss(cru) : cru);
  }
  return dir;
}

test('tractor-cromatic C3: arbre real compleix el mandat AAA en clar, dark, bancal i dark+bancal', () => {
  const r = spawnSync(process.execPath, [TRACTOR, '--nomes', 'C3', '--arrel', ARREL], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /C3 · Mandat Pedra Seca \(text AAA en 4 temes × 2 superfícies\)/);
});

test('tractor-cromatic C3: detecta degradació de contrast dins de [data-theme="dark"]', (t) => {
  const dir = creaFixtureCromatica(t, (css) =>
    css.replace(
      '--sdp-text-suau:   var(--sdp-pedra-300);   /* 12,49:1 */',
      '--sdp-text-suau:   var(--sdp-pedra-600);'
    )
  );
  const r = spawnSync(process.execPath, [TRACTOR, '--nomes', 'C3', '--arrel', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'ha de fallar quan el tema fosc perd el ràtio 7:1');
  assert.match(r.stdout, /tema fosc/);
  assert.match(r.stdout, /--sdp-text-suau/);
});

test('tractor-cromatic C3: detecta la pèrdua del bloc niat [data-theme="dark"][data-contrast="bancal"]', (t) => {
  const dir = creaFixtureCromatica(t, (css) =>
    css.replace(
      /:root\[data-theme="dark"\] \.sdp-root\[data-contrast="bancal"\],[\s\S]*?\n\}/,
      '/* bloc dark+bancal suprimit en prova */'
    )
  );
  const r = spawnSync(process.execPath, [TRACTOR, '--nomes', 'C3', '--arrel', dir], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'sense el bloc niat, bancal clar xafa el fosc i C3 ho ha de bloquejar');
  assert.match(r.stdout, /mode bancal fosc/);
});
