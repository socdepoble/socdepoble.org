import test from 'node:test';
import { FONTS_PRODUCCIO_R3215 } from '../tooling/gates/verifica-rebut-produccio-r3215.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { reconciliaTornsCaducats } from '../tooling/gates/reconcilia-torns-caducats.mjs';
import { verificaTracaCaducitat } from '../tooling/session/saneja_torns_caducats.mjs';
import { verificaRebutProduccioR3214, REBUT_PRODUCCIO_R3214 } from '../tooling/gates/verifica-rebut-produccio-r3214.mjs';
import { avaluaMatriu, PROVES_MATRIU } from '../tooling/gates/avalua-matriu-d01-d15.mjs';
import { esEsborranyCaducatAcreditat, checkDocuments } from '../tooling/gates/porta-documents.mjs';
import { fixture as documentFixture, validDoc, writeDoc } from './helpers/documental.mjs';
import { construeixMapa } from '../src/sections/consola/mapa/construeixMapa.js';

const NOW = Date.parse('2026-11-19T21:45:00.000Z');
const ID = 'torn_00000000-0000-4000-8000-000000000001';
const hash = b => createHash('sha256').update(b).digest('hex');
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3216-t2-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.agents/runtime/turns'), { recursive: true });
  return root;
}
function turn(root, extra = {}) {
  const record = { schema: 'sdp.turn.v1', turn_id: ID, actor: 'agent-caigut', scope: 'documents', state: 'planned', revision: 4,
    createdAt: '2026-11-18T20:00:00Z', expiresAt: '2026-11-19T20:00:00Z', updatedAt: '2026-11-18T20:01:00Z',
    initial: {}, receipts: { real: { id: 'real', file: 'evidencia-original.md', hash: 'a'.repeat(64) } }, plan: { file: 'pla-original.md' },
    verification: { at: '2026-11-18T20:01:00Z', checks: ['prova genuïna anterior'], files: {} },
    history: [{ state: 'opened', action: 'open', at: '2026-11-18T20:00:00Z' }], ...extra };
  const file = path.join(root, '.agents/runtime/turns', ID + '.json');
  // Noncanonical source whitespace is deliberately retained in the audit preimage.
  fs.writeFileSync(file, JSON.stringify(record)); return { file, record };
}
function snapshot(root) {
  const result = {};
  const walk = dir => { for (const name of fs.readdirSync(dir)) { const f = path.join(dir, name), st = fs.lstatSync(f);
    if (st.isDirectory()) walk(f); else result[path.relative(root, f)] = { hash: hash(fs.readFileSync(f)), mtime: st.mtimeMs }; } };
  walk(root); return result;
}
function copyReceipt(root) {
  const source = fileURLToPath(new URL('../tooling/gates/fixtures/produccio-r3214', import.meta.url));
  fs.cpSync(source, path.join(root, 'tooling/gates/fixtures/produccio-r3214'), { recursive: true });
  const bundle = REBUT_PRODUCCIO_R3214.bundle, target = path.join(root, bundle);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(fileURLToPath(new URL('../' + bundle, import.meta.url)), target);
  for (const { ruta } of FONTS_PRODUCCIO_R3215) { const target = path.join(root, ruta); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(fileURLToPath(new URL('../' + ruta, import.meta.url)), target); }
}
function probes(root) {
  for (const p of PROVES_MATRIU) { const f = path.join(root, p.args.find(a => !a.startsWith('-'))); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, '// immutable fixture\n'); }
  copyReceipt(root);
}
function good(args) {
  const p = PROVES_MATRIU.find(p => JSON.stringify(p.args) === JSON.stringify(args.filter(a => !a.startsWith('--ara='))));
  return { status: 0, stdout: p.tests ? '# tests 1\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n' : p.json ? '{"valid":true}' : p.senyal };
}
test('caducitat canònica preserva rebuts/verification, arxiva preimatge exacta i té replay sense canvis', t => {
  const root = fixture(t), { file, record } = turn(root), before = fs.readFileSync(file, 'utf8'), initial = snapshot(root);
  const dry = reconciliaTornsCaducats(root, { ara: NOW });
  assert.equal(dry.mode, 'dry-run'); assert.equal(dry.tancatsAra, 1); assert.deepEqual(snapshot(root), initial);
  const applied = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
  assert.equal(applied.valid, true); assert.equal(applied.traces.length, 1); assert.equal(applied.tancatsAra, 1);
  const after = JSON.parse(fs.readFileSync(file));
  assert.equal(after.state, 'closed'); assert.equal(after.closure.reason, 'expired'); assert.equal(after.closure.previousState, record.state);
  assert.deepEqual(after.receipts, record.receipts); assert.deepEqual(after.verification, record.verification); assert.deepEqual(after.plan, record.plan);
  const audit = JSON.parse(fs.readFileSync(path.join(root, after.closure.audit)));
  assert.equal(audit.preimage, before); assert.equal(audit.preimageSHA256, hash(before)); assert.equal(audit.postimageSHA256, hash(fs.readFileSync(file)));
  assert.equal(verificaTracaCaducitat(root, after.closure.audit).valid, true);
  const frozen = snapshot(root), repeat = reconciliaTornsCaducats(root, { ara: NOW + 5000, apply: true });
  assert.equal(repeat.valid, true); assert.equal(repeat.tancatsAra, 0); assert.deepEqual(snapshot(root), frozen);
});
test('les fronteres són estrictes: expiresAt igual/futur, absent o impossible no es tanquen', t => {
  for (const expiry of ['2026-11-19T21:45:00.000Z', '2026-11-20T20:00:00Z', '2026-02-30T01:00:00Z', null, 17, 'invalid']) {
    const root = fixture(t), { file } = turn(root, { expiresAt: expiry }), before = fs.readFileSync(file);
    const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
    assert.equal(result.tancatsAra, 0); assert.deepEqual(fs.readFileSync(file), before);
    if (expiry === null || expiry === 17 || expiry === 'invalid' || expiry.includes('02-30')) assert.equal(result.valid, false);
  }
  assert.throws(() => reconciliaTornsCaducats(fixture(t), { ara: NaN, apply: true }), /Rellotge/);
});
test('closed vigent sense rebut continua blocant: cap traça ni rebut fictici', t => {
  const root = fixture(t), { file } = turn(root, { state: 'closed', expiresAt: '2026-11-20T20:00:00Z', receipts: {}, closure: { reason: 'expired' } });
  const before = fs.readFileSync(file); const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
  assert.equal(result.tancatsAra, 0); assert.deepEqual(fs.readFileSync(file), before); assert.equal(result.traces.length, 0);
  const record = JSON.parse(before), mapa = construeixMapa({ torns: [{ id: ID, actor: record.actor, state: record.state, expiresAt: record.expiresAt, rebuts: 0 }] }, { ara: NOW });
  assert.ok(mapa.avisos.some(a => a.codi === 'torns-tancats-sense-rebut'));
});
test('mutants de preimatge, postimatge i rellotge de traça fallen tancats', t => {
  for (const mutant of ['before', 'after', 'clock', 'verification']) {
    const root = fixture(t), { file } = turn(root), applied = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
    assert.equal(applied.valid, true); const rel = applied.traces[0].audit, auditFile = path.join(root, rel), audit = JSON.parse(fs.readFileSync(auditFile));
    if (mutant === 'before') audit.preimage += ' ';
    if (mutant === 'clock') audit.at = '2026-11-18T20:00:00.000Z';
    if (mutant === 'after' || mutant === 'verification') {
      const record = JSON.parse(fs.readFileSync(file));
      if (mutant === 'after') record.state = 'verified'; else record.verification.checks.push('inventada');
      fs.writeFileSync(file, JSON.stringify(record));
      // Even rehashing the mutated postimage cannot turn it into the admitted transition.
      audit.postimageSHA256 = hash(fs.readFileSync(file));
    }
    fs.writeFileSync(auditFile, JSON.stringify(audit));
    assert.throws(() => verificaTracaCaducitat(root, rel));
    assert.equal(reconciliaTornsCaducats(root, { ara: NOW + 1, apply: true }).valid, false);
  }
});
test('els panys, hardlinks i symlinks no autoritzen cap reconciliació', t => {
  for (const mutant of ['lock', 'symlink', 'hardlink', 'audit-dir-symlink']) {
    const root = fixture(t), { file } = turn(root), before = fs.readFileSync(file);
    if (mutant === 'lock') fs.writeFileSync(file + '.lock', 'ocupat');
    if (mutant === 'symlink' || mutant === 'hardlink') { fs.renameSync(file, file + '.original'); if (mutant === 'symlink') fs.symlinkSync(file + '.original', file); else fs.linkSync(file + '.original', file); }
    if (mutant === 'audit-dir-symlink') { const outside = fixture(t); fs.symlinkSync(outside, path.join(root, '.agents/runtime/turn-expiry')); }
    const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
    assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0); assert.deepEqual(fs.readFileSync(file), before);
  }
});
test('rebut Supabase i SQL són pinats per SHA-256, P2 i set definers continuen pendents', t => {
  const root = fixture(t); copyReceipt(root);
  const result = verificaRebutProduccioR3214(root);
  assert.equal(result.valid, true); assert.equal(result.checksPassed, 10); assert.equal(result.checksTotal, 10);
  assert.equal(result.postgresVersion, '17.6'); assert.equal(result.pendents.length, 2); assert.ok(result.pendents.every(p => p.estat === 'no_verificat'));
  assert.equal(result.linees.declarades, 1126); assert.equal(result.linees.saltsLF, 1125);
  for (const relative of [REBUT_PRODUCCIO_R3214.receipt, REBUT_PRODUCCIO_R3214.bundle]) {
    const file = path.join(root, relative), bytes = fs.readFileSync(file); fs.appendFileSync(file, ' ');
    assert.equal(verificaRebutProduccioR3214(root).valid, false); fs.writeFileSync(file, bytes);
    fs.renameSync(file, file + '.copy'); fs.symlinkSync(file + '.copy', file);
    assert.equal(verificaRebutProduccioR3214(root).valid, false); fs.unlinkSync(file); fs.renameSync(file + '.copy', file);
  }
});
test('cada sonda té timeout acotat, SIGKILL i error ETIMEDOUT inequívoc; stdout parcial no acredita res', t => {
  const root = fixture(t); probes(root); const seen = [];
  const ok = avaluaMatriu(root, { ara: NOW, executa: (args, opts) => {
    const p = PROVES_MATRIU.find(p => p.args[0] === args[0] && p.args.at(-1) === args.filter(a => !a.startsWith('--ara=')).at(-1));
    assert.ok(Number.isSafeInteger(opts.timeout) && opts.timeout >= 1000 && opts.timeout <= 120000);
    assert.equal(opts.timeout, p.timeoutMs); assert.equal(opts.killSignal, 'SIGKILL'); assert.equal(opts.shell, false); seen.push(p.id); return good(args);
  } });
  assert.equal(ok.valid, true); assert.equal(new Set(seen).size, 17); assert.equal(ok.rebutsProduccio.valid, true);
  const timeout = avaluaMatriu(root, { ara: NOW, executa: args => ({ ...good(args), error: Object.assign(new Error('expired'), { code: 'ETIMEDOUT' }), signal: 'SIGKILL', status: null }) });
  assert.equal(timeout.valid, false); assert.equal(timeout.resum.senyalsVerificats, 0);
  assert.ok(timeout.proves.every(p => p.motiu === 'temps_sonda_exhaurit' && p.codiError === 'ETIMEDOUT'));
  fs.appendFileSync(path.join(root, REBUT_PRODUCCIO_R3214.receipt), ' ');
  const tampered = avaluaMatriu(root, { ara: NOW, executa: good });
  assert.equal(tampered.resum.senyalsVerificats, 17); assert.equal(tampered.rebutsProduccio.valid, false); assert.equal(tampered.valid, false);
});

function abandonedDocument(t) {
  const root = documentFixture(t), doc = validDoc(root); writeDoc(root, doc);
  const file = path.join(root, '.agents/runtime/turns', doc.turn.turn_id + '.json');
  const record = JSON.parse(fs.readFileSync(file)); record.expiresAt = new Date(Date.now() - 1).toISOString(); fs.writeFileSync(file, JSON.stringify(record));
  const ara = Date.now() + 1000, result = reconciliaTornsCaducats(root, { ara, apply: true });
  assert.equal(result.valid, true); return { root, doc, file, ara };
}
test('instantània inventaria esborrany abandonat sense acreditar cap verificació; porta estricta continua roja', t => {
  const { root, doc, ara } = abandonedDocument(t);
  assert.equal(esEsborranyCaducatAcreditat(root, doc.content, doc.file, ara), true);
  const publicSnapshot = checkDocuments(root, { all: true, instantania: true, ara });
  assert.equal(publicSnapshot.valid, true); assert.equal(publicSnapshot.caducatsNoVerificats.length, 1);
  assert.equal(publicSnapshot.enCurs.length, 0); assert.equal(publicSnapshot.caducatsNoVerificats[0].estat, 'esborrany_abandonat_no_verificat');
  const strict = checkDocuments(root, { all: true });
  assert.equal(strict.valid, false); assert.match(strict.errors.join(' '), /Artefacte modificat després del tancament/);
});
test('instantània no classifica rebut absent/alterat, document posterior ni traça incoherent com abandonament acreditat', t => {
  for (const mutant of ['receipt-missing', 'receipt-changed', 'document-changed', 'trace-changed']) {
    const { root, doc, file, ara } = abandonedDocument(t);
    if (mutant.startsWith('receipt')) {
      const record = JSON.parse(fs.readFileSync(file));
      if (mutant === 'receipt-missing') record.receipts = {};
      else Object.values(record.receipts)[0].templateHash = '0'.repeat(64);
      fs.writeFileSync(file, JSON.stringify(record));
    } else if (mutant === 'document-changed') fs.appendFileSync(path.join(root, doc.file), '\nCanvi posterior sense rebut nou.\n');
    else { const record = JSON.parse(fs.readFileSync(file)), trace = path.join(root, record.closure.audit); fs.appendFileSync(trace, 'invalid'); }
    const content = fs.readFileSync(path.join(root, doc.file), 'utf8');
    assert.equal(esEsborranyCaducatAcreditat(root, content, doc.file, ara), false, mutant);
    const snapshot = checkDocuments(root, { all: true, instantania: true, ara });
    assert.equal(snapshot.valid, false, mutant); assert.equal(snapshot.caducatsNoVerificats.length, 0);
  }
});

test('pressupostos de postimatge i traça es comproven abans d’escriure: preimatge límit intacta', t => {
  for (const mutant of ['postimage', 'trace']) {
    const root = fixture(t), { file, record } = turn(root);
    record.padding = '';
    if (mutant === 'postimage') record.padding = 'x'.repeat(8 * 1024 * 1024 - 32 - Buffer.byteLength(JSON.stringify(record)));
    else record.padding = '"'.repeat(3 * 1024 * 1024);
    fs.writeFileSync(file, JSON.stringify(record)); const before = fs.readFileSync(file);
    assert.ok(before.length < 8 * 1024 * 1024);
    const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true });
    assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0); assert.deepEqual(fs.readFileSync(file), before);
    assert.match(result.errors[0].error, mutant === 'postimage' ? /Postimatge.*pressupost/ : /Traça.*pressupost/);
    assert.equal(fs.existsSync(path.join(root, '.agents/runtime/turn-expiry')), false);
  }
});

test('un rebut amb issuedAt futur al tancament no esdevé original per esperar que el rellotge l’atrape', t => {
  const root = documentFixture(t), doc = validDoc(root); writeDoc(root, doc);
  const file = path.join(root, '.agents/runtime/turns', doc.turn.turn_id + '.json'), record = JSON.parse(fs.readFileSync(file));
  const ara = Date.now() + 1000;
  record.expiresAt = new Date(ara - 1).toISOString();
  Object.values(record.receipts)[0].issuedAt = new Date(ara + 60000).toISOString();
  fs.writeFileSync(file, JSON.stringify(record));
  assert.equal(reconciliaTornsCaducats(root, { ara, apply: true }).valid, true);
  assert.equal(esEsborranyCaducatAcreditat(root, doc.content, doc.file, ara + 120000), false);
});
