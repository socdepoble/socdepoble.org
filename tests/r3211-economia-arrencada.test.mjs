import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mesuraEconomiaArrencada } from '../tooling/gates/tractor-economia-arrencada.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-boot-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents/cervell.json'), JSON.stringify({ entrada: ['AGENTS.md', '.agents/ESTAT.md'] }));
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Contracte\n');
  fs.writeFileSync(path.join(root, '.agents/ESTAT.md'), '# Estat\n\n## ESTAT_ACTUAL · hui\nVigent\n\n## ESTAT_ACTUAL · ahir\nHistòria\n');
  return root;
}

test('P2-15: real declared startup sources fit explicit budgets with no tokenization claim', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const report = mesuraEconomiaArrencada(root);
  assert.equal(report.valid, true);
  assert.equal(report.fonts.length, 7);
  assert.ok(report.totals.bytesFont > report.totals.bytesProjectats);
  assert.equal(report.tokenizerUsed, false); assert.equal(report.actualAgentTokensMeasured, false);
  assert.equal(report.rotationPerformed, false); assert.equal(report.documentsMoved, false);
});

test('P2-15: preserves raw bytes and history; only reports the existing operational projection', (t) => {
  const root = fixture(t), file = path.join(root, '.agents/ESTAT.md'), before = fs.readFileSync(file);
  const report = mesuraEconomiaArrencada(root);
  const estat = report.fonts.find((source) => source.ruta === '.agents/ESTAT.md');
  assert.equal(estat.bytesFont, before.length); assert.ok(estat.bytesProjectats < estat.bytesFont);
  assert.deepEqual(fs.readFileSync(file), before);
  assert.deepEqual(fs.readdirSync(path.join(root, '.agents')).sort(), ['ESTAT.md', 'cervell.json']);
});

test('P2-15: adding content above the budget is a real failure, not a new baseline', (t) => {
  const root = fixture(t), report = mesuraEconomiaArrencada(root);
  const budget = { bytesFont: report.totals.bytesFont, bytesProjectats: report.totals.bytesProjectats };
  fs.appendFileSync(path.join(root, 'AGENTS.md'), '\nUna instrucció nova.');
  const changed = mesuraEconomiaArrencada(root, { pressupost: budget });
  assert.equal(changed.valid, false);
  assert.deepEqual(changed.incidencies, ['BOOT_SOURCE_BUDGET', 'BOOT_PROJECTION_BUDGET']);
});

for (const entry of ['../outside.md', '/absolute.md', 'a/../outside.md', '01_produccio/private.md', '90_arxiu_historic/old.md', '.git/config', 'a\\b.md']) {
  test(`P2-15: forbidden startup path ${entry} is rejected`, (t) => {
    const root = fixture(t);
    fs.writeFileSync(path.join(root, '.agents/cervell.json'), JSON.stringify({ entrada: [entry] }));
    assert.throws(() => mesuraEconomiaArrencada(root), { code: 'BOOT_SOURCE_FORBIDDEN' });
  });
}

test('P2-15: duplicate, missing, symlink and invalid UTF-8 sources never produce valid inventory', (t) => {
  const root = fixture(t), catalogue = path.join(root, '.agents/cervell.json');
  const set = (entrada) => fs.writeFileSync(catalogue, JSON.stringify({ entrada }));
  set(['AGENTS.md', 'AGENTS.md']); assert.throws(() => mesuraEconomiaArrencada(root), { code: 'BOOT_CATALOGUE_INVALID' });
  set(['missing.md']); assert.throws(() => mesuraEconomiaArrencada(root));
  fs.symlinkSync(path.join(root, 'AGENTS.md'), path.join(root, 'alias.md'));
  set(['alias.md']); assert.throws(() => mesuraEconomiaArrencada(root), { code: 'BOOT_SYMLINK' });
  fs.writeFileSync(path.join(root, 'bad.md'), Buffer.from([0xff, 0xfe]));
  set(['bad.md']); assert.throws(() => mesuraEconomiaArrencada(root), { code: 'BOOT_UTF8_INVALID' });
});
