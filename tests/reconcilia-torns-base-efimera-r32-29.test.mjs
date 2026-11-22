import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture, validDoc, writeDoc } from './helpers/documental.mjs';
import { reconciliaTornsCaducats, opcionsReconciliacio } from '../tooling/gates/reconcilia-torns-caducats.mjs';
import { verificaTracaCaducitat } from '../tooling/session/saneja_torns_caducats.mjs';
import { observaBaseGitAbsent } from '../tooling/session/base-efimera.mjs';
import { esEsborranyCaducatAcreditat, checkDocuments } from '../tooling/gates/porta-documents.mjs';
import { planificaArxiu } from '../tooling/documental/arxiu-enllacos.mjs';

const NOW = Date.parse('2026-11-21T21:00:00.000Z');
const EXPIRES = '2026-11-21T20:28:59.509Z';
const BASE = 'a'.repeat(40);
const reason = 'Clon efímer declarat; base absent en el repositori local.';
const hash = value => createHash('sha256').update(value).digest('hex');
const CLI = fileURLToPath(new URL('../tooling/gates/reconcilia-torns-caducats.mjs', import.meta.url));
const OLIVERA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const git = (root, ...args) => execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], { cwd: root, encoding: 'utf8' }).trim();

function turnFixture(t) {
  const root = fs.realpathSync(fixture(t));
  git(root, 'init', '-q'); git(root, 'config', 'user.name', 'Prova sintètica'); git(root, 'config', 'user.email', 'prova@example.invalid');
  git(root, 'add', '.'); git(root, 'commit', '-qm', 'base de prova');
  const doc = validDoc(root); writeDoc(root, doc);
  const file = path.join(root, '.agents/runtime/turns', `${doc.turn.turn_id}.json`);
  const turn = JSON.parse(fs.readFileSync(file));
  turn.initial.base = BASE; turn.expiresAt = EXPIRES;
  turn.createdAt = '2026-11-20T20:00:00.000Z'; turn.updatedAt = turn.createdAt;
  turn.history = [{ state: 'opened', action: 'open', at: turn.createdAt }];
  for (const receipt of Object.values(turn.receipts)) receipt.issuedAt = '2026-11-20T20:01:00.000Z';
  fs.writeFileSync(file, JSON.stringify(turn)); fs.chmodSync(file, 0o640);
  const request = () => ({ turnId: turn.turn_id, base: JSON.parse(fs.readFileSync(file)).initial.base, sha256: hash(fs.readFileSync(file)), reason });
  return { root, doc, file, turn, request };
}
function snapshot(root) {
  const rows = {};
  const walk = dir => {
    for (const name of fs.readdirSync(dir)) {
      if (name === '.git') continue;
      const file = path.join(dir, name), stat = fs.lstatSync(file), relative = path.relative(root, file);
      if (stat.isDirectory()) walk(file);
      else rows[relative] = { sha: hash(stat.isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file)), mode: stat.mode, mtime: stat.mtimeMs };
    }
  };
  walk(root); return rows;
}
function mutate(file, change) {
  const value = JSON.parse(fs.readFileSync(file)); change(value); fs.writeFileSync(file, JSON.stringify(value));
}

test('base absent: simulació sense escriptures, tancament administratiu exacte i repetició idempotent', t => {
  const { root, file, turn, request } = turnFixture(t), ephemeral = request();
  const before = fs.readFileSync(file, 'utf8'), original = snapshot(root);
  const dry = reconciliaTornsCaducats(root, { ara: NOW, ephemeral });
  assert.equal(dry.valid, true); assert.equal(dry.tancatsAra, 1); assert.deepEqual(snapshot(root), original);
  assert.equal(dry.diagnostics[0].initialInventory.status, 'unreconstructible_ephemeral_base');
  assert.equal(dry.diagnostics[0].initialInventory.inventoryReconstructed, false);
  const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral });
  assert.equal(result.valid, true); assert.equal(result.tancatsAra, 1); assert.equal(result.traces.length, 1);
  const after = JSON.parse(fs.readFileSync(file)), audit = JSON.parse(fs.readFileSync(path.join(root, after.closure.audit)));
  assert.equal(after.state, 'closed'); assert.equal(after.closure.reason, 'expired');
  assert.equal(after.closure.initialInventory.origin, 'declared_ephemeral_clone');
  assert.equal(after.closure.initialInventory.absence, 'observed_local_git_object_absent');
  assert.equal(after.closure.initialInventory.inventoryVerified, false);
  for (const key of ['initial', 'receipts', 'plan', 'verification']) assert.deepEqual(after[key], turn[key], key);
  assert.equal(fs.statSync(file).mode & 0o777, 0o640);
  assert.equal(audit.preimage, before); assert.equal(audit.preimageSHA256, hash(before));
  assert.equal(audit.postimageSHA256, hash(fs.readFileSync(file)));
  assert.equal(verificaTracaCaducitat(root, after.closure.audit).valid, true);
  const frozen = snapshot(root), repeated = reconciliaTornsCaducats(root, { ara: NOW + 1000, apply: true, ephemeral });
  assert.equal(repeated.valid, true); assert.equal(repeated.tancatsAra, 0); assert.equal(repeated.jaTancats, 1);
  assert.deepEqual(snapshot(root), frozen);
});

test('caducitat estricta: igualtat, futur, renovació i dates impossibles no tanquen', t => {
  for (const expiry of [new Date(NOW).toISOString(), new Date(NOW + 1).toISOString(), '2026-02-30T01:00:00Z', 'invalid']) {
    const { root, file, request } = turnFixture(t); mutate(file, value => { value.expiresAt = expiry; });
    const before = snapshot(root), result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() });
    assert.equal(result.valid, false, expiry); assert.equal(result.tancatsAra, 0); assert.deepEqual(snapshot(root), before);
  }
});

test('cas 37f7d17d sintètic: la seua caducitat exacta no es pot anticipar i el base queda intacte', t => {
  const { root, file, doc } = turnFixture(t);
  const value = JSON.parse(fs.readFileSync(file)), oldId = value.turn_id;
  value.turn_id = 'torn_37f7d17d-2652-4ca1-9883-ff7e303aba3e';
  value.initial.base = '8f13c17d88815188b4a70dc911690d3a8bdd32f9';
  const target = path.join(path.dirname(file), value.turn_id + '.json');
  fs.writeFileSync(target, JSON.stringify(value)); fs.unlinkSync(file);
  fs.writeFileSync(path.join(root, doc.file), doc.content.replaceAll(oldId, value.turn_id));
  const ephemeral = { turnId: value.turn_id, base: value.initial.base, sha256: hash(fs.readFileSync(target)), reason };
  const before = snapshot(root), expiry = Date.parse(EXPIRES);
  const alive = reconciliaTornsCaducats(root, { ara: expiry, apply: true, ephemeral });
  assert.equal(alive.valid, false); assert.equal(alive.tancatsAra, 0); assert.deepEqual(snapshot(root), before);
  const expired = reconciliaTornsCaducats(root, { ara: expiry + 1, apply: true, ephemeral });
  assert.equal(expired.valid, true); assert.equal(expired.tancatsAra, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(target)).initial, value.initial);
  assert.equal(expired.traces[0].initialInventory.status, 'unreconstructible_ephemeral_base');
});

test('una base existent, fins i tot blob, i un repositori absent no es declaren efímers', t => {
  for (const kind of ['commit', 'blob', 'no-git']) {
    const { root, file, request } = turnFixture(t);
    if (kind !== 'no-git') mutate(file, value => { value.initial.base = git(root, 'rev-parse', kind === 'commit' ? 'HEAD' : 'HEAD:.agents/protocolledge.json'); });
    else fs.renameSync(path.join(root, '.git'), path.join(root, '.git-hidden'));
    const before = snapshot(root), result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() });
    assert.equal(result.valid, false, kind); assert.equal(result.tancatsAra, 0); assert.deepEqual(snapshot(root), before);
  }
});

function corruptGit(root, kind, write = fs.writeFileSync) {
  const file = kind === 'loose' ? path.join(root, '.git/objects/aa', 'a'.repeat(38))
    : path.join(root, '.git/objects/info/alternates');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  write.call(fs, file, kind === 'loose' ? 'bad compressed object' : '/ruta/alternativa/inexistent\n');
  return file;
}

test('stderr de Git amb missing: objecte corrupte i alternates trencat bloquegen observació, sec i apply', t => {
  for (const kind of ['loose', 'alternates']) {
    const { root, file, request } = turnFixture(t), ephemeral = request();
    const damaged = corruptGit(root, kind), damagedBytes = fs.readFileSync(damaged);
    const raw = spawnSync('git', ['--no-replace-objects', '--no-lazy-fetch', '-c', 'core.fsmonitor=false',
      'cat-file', '--batch-check=%(objectname) %(objecttype)'], { cwd: root, input: BASE + '\n', encoding: 'utf8' });
    assert.match(raw.stderr, /error:|fatal:/); assert.match(raw.stdout, /missing/);
    t.diagnostic(JSON.stringify({ kind, gitStatus: raw.status, stderr: raw.stderr.trim() }));
    assert.throws(() => observaBaseGitAbsent(root, BASE), /Git local/);
    const before = snapshot(root), preimage = fs.readFileSync(file);
    for (const apply of [false, true]) {
      const result = reconciliaTornsCaducats(root, { ara: NOW, apply, ephemeral });
      assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0); assert.equal(result.traces.length, 0);
      assert.deepEqual(fs.readFileSync(file), preimage); assert.deepEqual(snapshot(root), before);
      assert.equal(fs.existsSync(path.join(root, '.agents/runtime/turn-expiry')), false);
      assert.deepEqual(fs.readFileSync(damaged), damagedBytes, 'no es repara ni es neteja Git');
    }
  }
});

test('un error Git introduït entre l’observació i el preCAS no tanca; la traça preparada no verifica', t => {
  for (const kind of ['loose', 'alternates']) {
    const { root, file, request } = turnFixture(t), ephemeral = request(), before = fs.readFileSync(file);
    const original = fs.writeFileSync; let injected = false;
    fs.writeFileSync = function (target, ...args) {
      const result = original.call(fs, target, ...args);
      if (!injected && String(target).includes('/turn-expiry/')) { injected = true; corruptGit(root, kind, original); }
      return result;
    };
    let result;
    try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); } finally { fs.writeFileSync = original; }
    assert.equal(injected, true); assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
    assert.deepEqual(fs.readFileSync(file), before); assert.match(result.errors.map(error => error.error).join(), /Git local/);
    const traces = fs.readdirSync(path.join(root, '.agents/runtime/turn-expiry'));
    assert.equal(traces.length, 1); assert.throws(() => verificaTracaCaducitat(root, `.agents/runtime/turn-expiry/${traces[0]}`), /Postimatge/);
  }
});

test('scope, rutes, descriptor i preimatge es validen abans d’observar documents', t => {
  const variants = [
    value => { value.scope = 'code'; },
    value => { Object.values(value.receipts)[0].file = '.env'; },
    value => { Object.values(value.receipts)[0].file = '../fora.md'; },
    value => { Object.values(value.receipts)[0].file = '_wiki_de_poble/04_escriptori/01_produccio/261121_0000_auditoria_x.md'; },
    value => { value.ownedPaths = ['src/dades.js']; },
    value => { value.plan = { file: 'src/pla.js', hash: '0'.repeat(64) }; },
    value => { value.initial.format = 'inventari-inventat'; },
    value => { value.closure = { reason: 'evidència anterior desconeguda' }; },
    value => { value.createdAt = '2030-01-01T00:00:00.000Z'; },
  ];
  for (const change of variants) {
    const { root, file, request } = turnFixture(t); mutate(file, change);
    const before = snapshot(root), result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() });
    assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0); assert.deepEqual(snapshot(root), before);
  }
  const { root, request } = turnFixture(t), stale = { ...request(), sha256: '0'.repeat(64) }, before = snapshot(root);
  assert.equal(reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: stale }).valid, false);
  assert.deepEqual(snapshot(root), before);
});

test('el mode específic no toca altres torns i conserva qualsevol verificació anterior', t => {
  const { root, file, request } = turnFixture(t);
  mutate(file, value => { value.verification = { at: value.updatedAt, checks: ['verificació anterior sintètica'], files: { antic: 'f'.repeat(64) } }; });
  const previous = JSON.parse(fs.readFileSync(file)).verification;
  const other = file.replace(/torn_[^.]+/, 'torn_00000000-0000-4000-8000-000000000002');
  fs.writeFileSync(other, 'registre alié il·legible'); const bytes = fs.readFileSync(other);
  const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() });
  assert.equal(result.valid, true); assert.equal(result.total, 1); assert.deepEqual(fs.readFileSync(other), bytes);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)).verification, previous);
});

test('panys, symlinks i hardlinks es refusen sense assumir-ne autoria', t => {
  for (const kind of ['lock', 'symlink', 'hardlink']) {
    const { root, file, request } = turnFixture(t), ephemeral = request();
    if (kind === 'lock') fs.writeFileSync(file + '.lock', 'un altre actor');
    else { fs.renameSync(file, file + '.original'); if (kind === 'symlink') fs.symlinkSync(file + '.original', file); else fs.linkSync(file + '.original', file); }
    const before = snapshot(root), result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral });
    assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0); assert.deepEqual(snapshot(root), before);
  }
});

test('pany substituït abans de publicar: registre immutable, pany alié intacte i audit no verificable', t => {
  for (const stage of ['after-audit', 'after-temporary', 'after-last-preimage-read']) {
    const { root, file, request } = turnFixture(t), ephemeral = request(), before = fs.readFileSync(file);
    const lock = file + '.lock', inode = fs.statSync(file).ino;
    const write = fs.writeFileSync, read = fs.readFileSync;
    let injected = false, descriptorReads = 0;
    const replaceLock = () => {
      injected = true; fs.renameSync(lock, lock + '.held'); write.call(fs, lock, 'pany estranger preservat');
    };
    fs.writeFileSync = function (target, ...args) {
      const result = write.call(fs, target, ...args);
      if (!injected && ((stage === 'after-audit' && String(target).includes('/turn-expiry/'))
          || (stage === 'after-temporary' && typeof target === 'number'))) replaceLock();
      return result;
    };
    fs.readFileSync = function (target, ...args) {
      const result = read.call(fs, target, ...args);
      if (!injected && stage === 'after-last-preimage-read' && typeof target === 'number'
          && fs.fstatSync(target).ino === inode && ++descriptorReads === 2) replaceLock();
      return result;
    };
    let result;
    try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); }
    finally { fs.writeFileSync = write; fs.readFileSync = read; }
    assert.equal(injected, true, stage); assert.equal(result.valid, false, stage); assert.equal(result.tancatsAra, 0, stage);
    assert.deepEqual(fs.readFileSync(file), before, stage); assert.equal(JSON.parse(fs.readFileSync(file)).state, 'context_loaded');
    assert.equal(fs.readFileSync(lock, 'utf8'), 'pany estranger preservat');
    assert.equal(result.traces.length, 0); assert.equal(result.transicions.length, 0);
    const traces = fs.readdirSync(path.join(root, '.agents/runtime/turn-expiry'));
    assert.equal(traces.length, 1);
    assert.throws(() => verificaTracaCaducitat(root, `.agents/runtime/turn-expiry/${traces[0]}`), /Postimatge/);
    assert.match(result.errors.map(error => error.error).join(), /Pany substituït/);
  }
});

test('un plan o ownedPath formal amb symlink/hardlink no amplia l’abast físic', t => {
  for (const field of ['plan', 'ownedPaths']) for (const link of ['symlink', 'hardlink']) {
    const { root, file, request } = turnFixture(t), outside = fixture(t);
    const foreign = path.join(outside, 'document.md'); fs.writeFileSync(foreign, 'bytes aliens');
    const relative = '_wiki_de_poble/04_escriptori/261121_1200_auditoria_altre.md', target = path.join(root, relative);
    if (link === 'symlink') fs.symlinkSync(foreign, target); else fs.linkSync(foreign, target);
    mutate(file, value => { if (field === 'plan') value.plan = { file: relative, hash: hash('bytes aliens') }; else value.ownedPaths = [relative]; });
    const before = snapshot(root), external = snapshot(outside);
    const result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() });
    assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
    assert.deepEqual(snapshot(root), before); assert.deepEqual(snapshot(outside), external);
  }
});

test('substituir el directori de torns per un symlink després de la traça no escriu ni elimina fora', t => {
  const { root, file, request } = turnFixture(t), ephemeral = request(), outside = fs.realpathSync(fixture(t));
  const dir = path.dirname(file), held = dir + '.retirat', name = path.basename(file);
  fs.writeFileSync(path.join(outside, name), 'registre alié'); fs.writeFileSync(path.join(outside, name + '.lock'), 'pany alié');
  const foreign = snapshot(outside), before = fs.readFileSync(file), original = fs.writeFileSync;
  let injected = false;
  fs.writeFileSync = function (target, ...args) {
    const result = original.call(fs, target, ...args);
    if (!injected && String(target).includes('/turn-expiry/')) { injected = true; fs.renameSync(dir, held); fs.symlinkSync(outside, dir); }
    return result;
  };
  let result;
  try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); } finally { fs.writeFileSync = original; }
  assert.equal(injected, true); assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
  assert.deepEqual(snapshot(outside), foreign); assert.deepEqual(fs.readFileSync(path.join(held, name)), before);
  assert.ok(result.errors.some(error => /substituït|regular/.test(error.error)));
});

test('la comprovació més recent detecta una substitució del nom després de llegir el descriptor', t => {
  const { root, file, request } = turnFixture(t), ephemeral = request(), original = fs.readFileSync;
  const inode = fs.statSync(file).ino; let reads = 0, injected = false;
  fs.readFileSync = function (target, ...args) {
    const bytes = original.call(fs, target, ...args);
    if (typeof target === 'number' && fs.fstatSync(target).ino === inode && ++reads === 2) {
      injected = true;
      const other = JSON.parse(original.call(fs, file)); other.concurrent = 'conservat després de lectura';
      fs.renameSync(file, file + '.retirat'); fs.writeFileSync(file, JSON.stringify(other));
    }
    return bytes;
  };
  let result;
  try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); } finally { fs.readFileSync = original; }
  assert.equal(injected, true); assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
  const after = JSON.parse(fs.readFileSync(file)); assert.equal(after.concurrent, 'conservat després de lectura'); assert.notEqual(after.state, 'closed');
  assert.match(result.errors.map(error => error.error).join(), /CAS divergent/);
});

test('una renovació concurrent sota el pany conserva els bytes aliens i refusa el CAS', t => {
  const { root, file, request } = turnFixture(t), ephemeral = request(), original = fs.writeFileSync;
  let injected = false;
  fs.writeFileSync = function (target, ...args) {
    const result = original.call(fs, target, ...args);
    if (!injected && String(target).includes('/turn-expiry/')) {
      injected = true;
      assert.throws(() => fs.openSync(file + '.lock', 'wx'), /EEXIST/);
      const value = JSON.parse(fs.readFileSync(file)); value.expiresAt = new Date(NOW + 10000).toISOString(); value.concurrent = true;
      original.call(fs, file, JSON.stringify(value));
    }
    return result;
  };
  let result;
  try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); } finally { fs.writeFileSync = original; }
  assert.equal(injected, true); assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
  const current = JSON.parse(fs.readFileSync(file)); assert.equal(current.concurrent, true); assert.notEqual(current.state, 'closed');
  assert.equal(fs.existsSync(file + '.lock'), false); assert.match(result.errors.map(e => e.error).join(), /CAS divergent/);
});

test('si la base reapareix després de preparar la traça, no es tanca el torn', t => {
  const { root, file, request } = turnFixture(t);
  const oid = git(root, 'commit-tree', 'HEAD^{tree}', '-p', 'HEAD', '-m', 'base efímera sintètica');
  const object = path.join(root, '.git/objects', oid.slice(0, 2), oid.slice(2)), held = path.join(root, '.base-retirada');
  fs.renameSync(object, held); mutate(file, value => { value.initial.base = oid; });
  const ephemeral = request(), before = fs.readFileSync(file), original = fs.writeFileSync;
  let injected = false;
  fs.writeFileSync = function (target, ...args) {
    const result = original.call(fs, target, ...args);
    if (!injected && String(target).includes('/turn-expiry/')) { injected = true; fs.renameSync(held, object); }
    return result;
  };
  let result;
  try { result = reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral }); } finally { fs.writeFileSync = original; }
  assert.equal(injected, true); assert.equal(result.valid, false); assert.equal(result.tancatsAra, 0);
  assert.deepEqual(fs.readFileSync(file), before); assert.match(result.errors.map(e => e.error).join(), /base existix/);
  const traces = fs.readdirSync(path.join(root, '.agents/runtime/turn-expiry'));
  assert.equal(traces.length, 1, 'un intent interromput deixa la traça preparada visible, no un rebut');
  assert.throws(() => verificaTracaCaducitat(root, `.agents/runtime/turn-expiry/${traces[0]}`), /Postimatge/);
});

test('conservar una traça d’abandó no renta documents ni fabrica un tancament verificat', t => {
  const { root, doc, request } = turnFixture(t);
  assert.equal(reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() }).valid, true);
  assert.equal(esEsborranyCaducatAcreditat(root, doc.content, doc.file, NOW), true);
  const strict = checkDocuments(root, { all: true, ara: NOW });
  assert.equal(strict.valid, false); assert.match(strict.errors.join(), /Artefacte modificat després del tancament/);
});

test('la traça refusa claims d’inventari verificat, origen provat o base diferent encara que es rehashege', t => {
  for (const change of [claim => { claim.inventoryVerified = true; }, claim => { claim.origin = 'proven_ephemeral_clone'; },
    claim => { claim.base = 'b'.repeat(40); }, claim => { claim.status = 'verified'; }]) {
    const { root, file, request } = turnFixture(t);
    assert.equal(reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: request() }).valid, true);
    const current = JSON.parse(fs.readFileSync(file)), tracePath = path.join(root, current.closure.audit);
    const trace = JSON.parse(fs.readFileSync(tracePath));
    change(trace.initialInventory); current.closure.initialInventory = trace.initialInventory;
    fs.writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    trace.postimageSHA256 = hash(fs.readFileSync(file)); fs.writeFileSync(tracePath, JSON.stringify(trace));
    assert.throws(() => verificaTracaCaducitat(root, current.closure.audit), /base efímera|Abast documental/);
  }
});

test('Olivera deixa de reconstruir només el torn administrativament tancat; els vius continuen bloquejant', async t => {
  const { root, file, doc, request } = turnFixture(t), ephemeral = request();
  // A synthetic archival target; no document or receipt of the reconciled turn is rewritten.
  const relative = '_wiki_de_poble/04_escriptori/250101_0000_auditoria_antic.md';
  fs.writeFileSync(path.join(root, relative), '---\ntype: document\nstatus: esborrany\ndescription: Prova\n---\n# Antic\n');
  fs.appendFileSync(path.join(root, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), '\n- [[250101_0000_auditoria_antic]]\n');
  const bruts = [{ rel: relative, nom: path.basename(relative) }];
  mutate(file, value => { value.expiresAt = new Date(Date.now() + 60000).toISOString(); });
  const live = await planificaArxiu(root, { bruts, carpeta: '_wiki_de_poble/90_arxiu_historic', ara: Date.now() });
  assert.ok(live.aturades.some(error => /inventari inicial no es pot reconstruir/.test(error)), live.aturades.join());
  const before = snapshot(root);
  const cli = spawnSync(process.execPath, [OLIVERA, '--arxiva', '--sec', '--nom', path.basename(relative)], {
    env: { ...process.env, SDP_ARREL: root }, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(cli.status, 1, cli.stderr);
  assert.match(cli.stdout, /Un torn viu no es tanca per esquivar este bloqueig/);
  assert.deepEqual(snapshot(root), before, 'el diagnòstic no reconcilia ni arxiva res');
  mutate(file, value => { value.expiresAt = EXPIRES; });
  assert.equal(reconciliaTornsCaducats(root, { ara: NOW, apply: true, ephemeral: { ...ephemeral, sha256: hash(fs.readFileSync(file)) } }).valid, true);
  const closed = await planificaArxiu(root, { bruts, carpeta: '_wiki_de_poble/90_arxiu_historic', ara: NOW });
  assert.ok(!closed.aturades.some(error => error.includes(doc.turn.turn_id)), closed.aturades.join());
});

test('CLI no admet rellotges inventats, arguments parcials, duplicats ni apply implícit', t => {
  const { request } = turnFixture(t), value = request();
  const args = ['--unreconstructible-ephemeral-base', `--turn-id=${value.turnId}`, `--expected-base=${value.base}`,
    `--expected-sha256=${value.sha256}`, `--reason=${reason}`];
  assert.deepEqual(opcionsReconciliacio(args), { apply: false, ephemeral: value });
  assert.equal(opcionsReconciliacio([...args, '--apply']).apply, true);
  for (const bad of [[...args, '--ara=9999999999999'], args.slice(0, -1), [...args, '--apply', '--dry-run'],
    [...args, `--turn-id=${value.turnId}`], args.slice(1)]) assert.throws(() => opcionsReconciliacio(bad));
  const result = spawnSync(process.execPath, [CLI, '--apply', '--ara=9999999999999'], { encoding: 'utf8' });
  assert.equal(result.status, 2); assert.equal(JSON.parse(result.stdout).valid, false);
});

test('la sonda ignora GIT_DIR alié i no confon un error de Git amb absència', t => {
  const { root } = turnFixture(t), previous = process.env.GIT_DIR;
  process.env.GIT_DIR = '/ruta/inexistent/de/prova';
  try { assert.equal(observaBaseGitAbsent(root, BASE).status, 'unreconstructible_ephemeral_base'); }
  finally { if (previous === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = previous; }
  assert.throws(() => observaBaseGitAbsent(root, '--output=/tmp/fictici'), /OID/);
  assert.throws(() => observaBaseGitAbsent(path.join(root, '.agents'), BASE), /arrel exacta/);
});
