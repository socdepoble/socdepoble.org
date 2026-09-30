/* Torn torn_d8024ad3 (260930) · Assaig en sec del generador de lease del
   laboratori 260930_0040_governanca_claude: el pla es construïx contra el disc
   real i el valida l'executor; la Petorreta passa el validador del Reflex.
   Cap escriptura. Fa skip si el laboratori ja s'ha arxivat. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ARREL = path.resolve(import.meta.dirname, '..');
const LEASE = path.join(ARREL, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/lease.mjs');
const hiEs = fs.existsSync(LEASE);
const sha = (v) => createHash('sha256').update(v).digest('hex');

test('el pla es construïx sencer, sense rutes repetides, i el valida l’executor', { skip: !hiEs }, async () => {
  const { preparaPla } = await import(pathToFileURL(LEASE).href);
  const { plan, scopes, targets } = await preparaPla(ARREL);
  assert.equal(plan.schema, 'sdp.mutation.v1');
  assert.equal(new Set(plan.files.map((f) => f.path)).size, plan.files.length);
  for (const f of plan.files) {
    const abs = path.join(ARREL, f.path);
    assert.equal(f.before, fs.existsSync(abs) ? sha(fs.readFileSync(abs)) : null, f.path);
    assert.notEqual(f.content, fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null, f.path);
  }
  for (const s of scopes) assert.ok(fs.existsSync(path.join(ARREL, s)), `scope inexistent: ${s}`);
  for (const t of targets) assert.ok(scopes.some((s) => t === s || t.startsWith(`${s}/`)), `target fora de scope: ${t}`);
  console.log(`TARGETS=${JSON.stringify(targets)}`);
  console.log(`SCOPES=${JSON.stringify(scopes)}`);
});

test('el relleu porta el torn a ESTAT i LEDGER, i el LEDGER queda ben signat', { skip: !hiEs }, async () => {
  const { preparaPla } = await import(pathToFileURL(LEASE).href);
  const { ledgerStatus } = await import(pathToFileURL(path.join(ARREL, 'tooling/documental/ledger.mjs')).href);
  const { plan } = await preparaPla(ARREL);
  const de = (ruta) => plan.files.find((f) => f.path === ruta).content;
  assert.ok(de('.agents/ESTAT.md').indexOf('torn_d8024ad3') < de('.agents/ESTAT.md').indexOf('## ESTAT_ACTUAL · 2026-09-29 21:58'));
  assert.equal(ledgerStatus(de('.agents/LEDGER.md')).valid, true);
  assert.match(de('.agents/LEDGER.md'), /torn_d8024ad3/);
  const pkg = JSON.parse(de('package.json'));
  for (const b of ['enxufe-plugin', 'enxufe-empaqueta', 'porta-olivera-v3', 'antigravity-hook', 'fonts-vigilancia', 'mapa-consola']) {
    assert.match(pkg.scripts['test:node'], new RegExp(`tests/${b}\\.test\\.mjs`));
  }
  assert.equal(de('.agents/AGENTS.md'), de('AGENTS.md'));
});

test('la Petorreta i el manifest passarien el seal del Reflex', { skip: !hiEs }, async () => {
  const { preparaPla, construeixPetorreta, sensibles, NOM_PETORRETA, PLA_DOC } = await import(pathToFileURL(LEASE).href);
  const { validatePetorreta, editorialPart } = await import(pathToFileURL(path.join(ARREL, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const sessio = '12345678-9abc-4def-8123-456789abcdef';
  const { plan, targets } = await preparaPla(ARREL, { sessio });
  const planSha256 = sha(JSON.stringify(plan));
  const text = construeixPetorreta({ sessio, intentSha256: 'a'.repeat(64), rulesSha256: 'b'.repeat(64), planSha256, targets });
  assert.deepEqual(validatePetorreta(`/tmp/${NOM_PETORRETA}`, text), []);
  const editorial = editorialPart(text);
  for (const marca of [`Reflex-Session: ${sessio}`, `Intent-SHA256: ${'a'.repeat(64)}`, `Rules-SHA256: ${'b'.repeat(64)}`]) assert.ok(editorial.includes(marca), marca);
  assert.match(editorial, new RegExp(`^Plan-SHA256:\\s*${planSha256}\\s*$`, 'm'));
  assert.deepEqual(sensibles(text), []);
  assert.deepEqual(sensibles(fs.readFileSync(path.join(ARREL, PLA_DOC), 'utf8')), []);
});
