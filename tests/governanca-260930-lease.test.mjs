/* Torn torn_d8024ad3 (260930) · Assaig en sec del generador de lease del
   laboratori 260930_0040_governanca_claude: el pla es construïx contra el disc
   real i el valida l'executor; la Petorreta passa el validador del Reflex.
   Cap escriptura. Fa skip si el laboratori ja s'ha arxivat o si el paquet ja
   s'ha aplicat (preparaPla es nega a construir-lo dues vegades). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ARREL = path.resolve(import.meta.dirname, '..');
const LAB = path.join(ARREL, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude');
const LEASE = path.join(LAB, 'lease.mjs');
const FONTS_LAB = path.join(LAB, 'nous/tooling/brain/fonts-vigilancia.mjs');
const FONTS_REPO = path.join(ARREL, 'tooling/brain/fonts-vigilancia.mjs');
const sha = (v) => createHash('sha256').update(v).digest('hex');

/** El paquet ja és al repo: el fitxer que creava el pegat del Mapa hi és i és idèntic al del laboratori. */
const jaAplicat = fs.existsSync(FONTS_REPO) && fs.existsSync(FONTS_LAB)
  && fs.readFileSync(FONTS_REPO).equals(fs.readFileSync(FONTS_LAB));
const skip = !fs.existsSync(LEASE) ? 'laboratori 260930_0040_governanca_claude absent'
  : jaAplicat ? 'paquet ja aplicat: tooling/brain/fonts-vigilancia.mjs és idèntic al del laboratori'
    : false;

test('el pla es construïx sencer, sense rutes repetides, i el valida l’executor', { skip }, async () => {
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

test('el relleu porta el torn a ESTAT i LEDGER, i el LEDGER queda ben signat', { skip }, async () => {
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

test('la Petorreta i el manifest passarien el seal del Reflex', { skip }, async () => {
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

/* R32 · D-R30-15 · La lease del commit es lliga al SHA-256 del diff preparat. Calculat en flux (gitDiffSha256)
   és el mateix valor que sha256(execFile utf8), i un diff de més de 16 MiB (git rm --cached de centenars de
   registres de torn) ja no topa amb el maxBuffer. */
test('R32 · gitDiffSha256 en flux: mateix hash que el diff en memòria i sense sostre de 16 MiB', async (t) => {
  const { execFileSync } = await import('node:child_process');
  const os = await import('node:os');
  const { gitDiffSha256 } = await import(pathToFileURL(path.join(ARREL, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r32-diff-flux-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const g = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 256 << 20, env: { ...process.env, GIT_AUTHOR_NAME: 'r32', GIT_AUTHOR_EMAIL: 'r32@local.invalid', GIT_COMMITTER_NAME: 'r32', GIT_COMMITTER_EMAIL: 'r32@local.invalid' } });
  g('init', '-q');
  // Text multibyte partit entre trossos del flux, una seqüència UTF-8 invàlida i un fitxer binari.
  const linia = 'Sóc de Poble · àèéíïòóúüç · 🌾 '.repeat(64) + '\n';
  fs.writeFileSync(path.join(dir, 'gran.txt'), linia.repeat(Math.ceil((17 << 20) / Buffer.byteLength(linia))));
  fs.writeFileSync(path.join(dir, 'invalid.txt'), Buffer.from([0x61, 0xc3, 0x28, 0x62, 0x0a]));
  fs.writeFileSync(path.join(dir, 'binari.bin'), Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 37) % 256)));
  g('add', '-A'); g('commit', '-q', '-m', 'base');
  g('rm', '-q', '--cached', 'gran.txt', 'invalid.txt', 'binari.bin');
  const args = ['diff', '--cached', '--binary', '--no-ext-diff', '--no-renames'];
  const enMemoria = createHash('sha256').update(g(...args)).digest('hex');
  assert.ok(Buffer.byteLength(g(...args)) > 16 * 1024 * 1024);
  assert.equal(await gitDiffSha256(args, dir), enMemoria);
  await assert.rejects(gitDiffSha256(['diff', '--opcio-que-no-existix'], dir), /Git ha fallat/);
});
