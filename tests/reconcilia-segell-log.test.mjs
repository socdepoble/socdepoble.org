/* v1.2.26 · Lot C1-0b · Reconciliació governada de .agents/runtime/segell.log.
   Fixtures reals: el donant fa mutacions amb durableMutation (traça + evidència); l'arrel rep les
   evidències per commit (com fa reconcilia_viu.py) però no la traça. Cap prova toca el repositori. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { durableMutation, digest, validaTracaAuditoria } from '../tooling/lib/mutacio-durable.mjs';
import { planifica, aplica } from '../tooling/gates/reconcilia-segell-log.mjs';

const ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'Prova', GIT_AUTHOR_EMAIL: 'prova@example.invalid', GIT_COMMITTER_NAME: 'Prova', GIT_COMMITTER_EMAIL: 'prova@example.invalid' };
const git = (root, ...a) => execFileSync('git', ['-C', root, ...a], { env: ENV, encoding: 'utf8' });
const LEGACY = JSON.stringify({ quan: '2026-09-23T12:34:18.225Z', fitxer: '.agents/skills/x/SKILL.md', anterior: 'a'.repeat(64), nou: 'b'.repeat(64), motiu: 'format antic' });
const journal = (root) => path.join(root, '.agents/runtime/segell.log');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INTERROMPUDA = JSON.parse(fs.readFileSync(path.join(ROOT, '.agents/seal-transactions/8f942f10-1817-4c69-a0aa-8b150e87ad2d.json'), 'utf8'));
const linies = (root) => fs.readFileSync(journal(root), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const escriuLinies = (root, ls) => fs.writeFileSync(journal(root), ls.map((e) => JSON.stringify(e)).join('\n') + '\n', { mode: 0o600 });

async function escenari(fn, { historiques = [] } = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-reconcilia-'));
  const donant = path.join(base, 'donant'), arrel = path.join(base, 'arrel');
  try {
    fs.mkdirSync(donant); fs.mkdirSync(arrel);
    await durableMutation(donant, [{ path: 'a.txt', before: null, content: 'a' }]);
    await durableMutation(donant, [{ path: 'b.txt', before: null, content: 'b' }]);
    fs.mkdirSync(path.join(arrel, '.agents/runtime'), { recursive: true });
    fs.cpSync(path.join(donant, '.agents/seal-transactions'), path.join(arrel, '.agents/seal-transactions'), { recursive: true });
    for (const h of historiques) fs.writeFileSync(path.join(arrel, '.agents/seal-transactions', `${h.id}.json`), JSON.stringify(h, null, 2));
    git(arrel, 'init', '-q'); git(arrel, 'add', '.agents/seal-transactions'); git(arrel, 'commit', '-q', '-m', 'evidencies');
    fs.writeFileSync(journal(arrel), `${LEGACY}\n`, { mode: 0o600 });
    await fn({ base, donant, arrel });
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
}

test('sec: importa les dues seqüències versionades, posa l’esquema antic en quarantena i no escriu res', () => escenari(({ donant, arrel }) => {
  const abans = fs.readFileSync(journal(arrel));
  assert.throws(() => validaTracaAuditoria(arrel));
  const pla = planifica(arrel, donant);
  assert.equal(pla.valida, true, pla.error);
  assert.equal(pla.importats.length, 2);
  assert.deepEqual(pla.importats.map((i) => i.estats), [['prepared', 'verified', 'accepted'], ['prepared', 'verified', 'accepted']]);
  assert.deepEqual(pla.quarantena.map((q) => q.index), [0]);
  assert.equal(pla.refusats.length, 0);
  assert.deepEqual(fs.readFileSync(journal(arrel)), abans);
}));

test('aplica: CAS exacte → traça vàlida, preimatge íntegra, quarantena literal, rebut i idempotència', () => escenari(({ donant, arrel }) => {
  const abans = fs.readFileSync(journal(arrel));
  const r = aplica(arrel, donant, digest(abans));
  assert.equal(r.aplicat, true);
  validaTracaAuditoria(arrel);
  const runtime = path.join(arrel, '.agents/runtime');
  assert.deepEqual(fs.readFileSync(path.join(runtime, `segell.log.preimatge-${digest(abans).slice(0, 12)}`)), abans);
  const q = fs.readFileSync(path.join(runtime, 'segell.quarantena.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(q.length, 1); assert.equal(q[0].linia, LEGACY); assert.equal(q[0].index, 0);
  const rebut = JSON.parse(fs.readFileSync(path.join(runtime, 'segell.reconciliacions.jsonl'), 'utf8').trim());
  assert.equal(rebut.abans, digest(abans)); assert.equal(rebut.despres, digest(fs.readFileSync(journal(arrel))));
  assert.equal(rebut.donantHash, digest(fs.readFileSync(journal(donant)))); assert.match(rebut.head, /^[a-f0-9]{40}$/);
  assert.equal((fs.statSync(journal(arrel)).mode & 0o777), 0o600);
  assert.equal(fs.existsSync(path.join(runtime, 'mutation.lock')), false);
  const segona = aplica(arrel, donant, rebut.despres);
  assert.equal(segona.aplicat, false); assert.equal(segona.importats.length, 0);
}));

test('aplica: després de reconciliar, durableMutation torna a escriure a l’arrel', () => escenari(async ({ donant, arrel }) => {
  await assert.rejects(durableMutation(arrel, [{ path: 'c.txt', before: null, content: 'c' }]));
  aplica(arrel, donant, digest(fs.readFileSync(journal(arrel))));
  await durableMutation(arrel, [{ path: 'c.txt', before: null, content: 'c' }]);
  assert.equal(fs.readFileSync(path.join(arrel, 'c.txt'), 'utf8'), 'c');
}));

test('aplica: un CAS divergent refusa abans d’escriure', () => escenari(({ donant, arrel }) => {
  const abans = fs.readFileSync(journal(arrel));
  assert.throws(() => aplica(arrel, donant, 'f'.repeat(64)), /CAS divergent/);
  assert.deepEqual(fs.readFileSync(journal(arrel)), abans);
  assert.equal(fs.existsSync(path.join(arrel, '.agents/runtime/segell.quarantena.jsonl')), false);
}));

test('una evidència fora de HEAD no s’importa i aplica refusa la traça parcial', () => escenari(({ donant, arrel }) => {
  const nom = fs.readdirSync(path.join(arrel, '.agents/seal-transactions'))[0];
  git(arrel, 'rm', '-q', '--cached', `.agents/seal-transactions/${nom}`); git(arrel, 'commit', '-q', '-m', 'fora');
  const pla = planifica(arrel, donant);
  assert.equal(pla.refusats.length, 1); assert.match(pla.refusats[0].motiu, /no versionada a HEAD/);
  assert.throws(() => aplica(arrel, donant, pla.hashAbans), /refús/);
}));

test('una evidència alterada respecte del blob de HEAD es refusa', () => escenari(({ donant, arrel }) => {
  const nom = fs.readdirSync(path.join(arrel, '.agents/seal-transactions'))[0];
  const f = path.join(arrel, '.agents/seal-transactions', nom);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('"accepted"', '"accepted" '));
  const pla = planifica(arrel, donant);
  assert.ok(pla.refusats.some((r) => /diferent del blob de HEAD/.test(r.motiu)));
}));

test('un terminal del donant diferent de l’evidència es refusa', () => escenari(({ donant, arrel }) => {
  const linies = fs.readFileSync(journal(donant), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const darrer = linies.findLastIndex((e) => e.state === 'accepted');
  linies[darrer].files[0].after = 'c'.repeat(64);
  fs.writeFileSync(journal(donant), linies.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const pla = planifica(arrel, donant);
  assert.ok(pla.refusats.some((r) => /no és idèntic a l’evidència/.test(r.motiu)));
}));

test('una operació pendent o un lock viu bloquegen l’escriptura', () => escenari(({ donant, arrel }) => {
  const hash = digest(fs.readFileSync(journal(arrel)));
  const pending = path.join(arrel, '.agents/runtime/mutation.pending.json');
  fs.writeFileSync(pending, '{}\n');
  assert.throws(() => aplica(arrel, donant, hash), /pendent/);
  fs.unlinkSync(pending);
  const lock = path.join(arrel, '.agents/runtime/mutation.lock');
  fs.writeFileSync(lock, '');
  assert.throws(() => aplica(arrel, donant, hash), /EEXIST/);
  assert.equal(fs.existsSync(lock), true);
}));

test('una seqüència pròpia que el validador refusa passa sencera a la quarantena, i un error d’evidència no', () => escenari(({ donant, arrel }) => {
  const id = '11111111-2222-4333-8444-555555555555';
  const fitxers = [{ path: 'x.txt', before: null, after: 'd'.repeat(64) }];
  const seq = [{ id, state: 'prepared', files: fitxers }, { id, state: 'verified', files: fitxers, afterSeal: 'e'.repeat(64) }, { id, state: 'failed', files: fitxers, error: 'x' }];
  fs.appendFileSync(journal(arrel), seq.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const pla = planifica(arrel, donant);
  assert.deepEqual(pla.quarantena.filter((q) => q.id === id).map((q) => q.state), ['prepared', 'verified', 'failed']);
  assert.equal(pla.valida, true, pla.error);
  const orfe = '99999999-2222-4333-8444-555555555555';
  fs.appendFileSync(journal(arrel), `${JSON.stringify({ id: orfe, state: 'prepared', files: fitxers })}\n${JSON.stringify({ id: orfe, state: 'verified', files: fitxers })}\n${JSON.stringify({ id: orfe, state: 'accepted', files: fitxers })}\n`);
  const pla2 = planifica(arrel, donant);
  assert.equal(pla2.quarantena.some((q) => q.id === orfe), false);
  assert.equal(pla2.valida, false);
  assert.match(pla2.error, /evidència absent/);
}));

/* Gauntlet 261126 (lent A) · P1-1: l'origen d'una evidència històrica només va a quarantena si el seu
   darrer estat és failed i els fitxers coincidixen; si no, es refusa i no s'escriu res. */
function origenDe(estatFinal, files) {
  const id = INTERROMPUDA.recovers;
  const proj = files.map(({ path: p, before, after }) => ({ path: p, before, after }));
  return [{ id, state: 'prepared', files: proj }, { id, state: 'verified', files: proj, afterSeal: 'a'.repeat(64) }, { id, state: estatFinal, files: proj, ...(estatFinal === 'failed' ? { error: 'x' } : {}) }];
}
test('P1-1: un origen failed amb els mateixos fitxers va a quarantena amb la verificació consignada', () => escenari(({ donant, arrel }) => {
  escriuLinies(arrel, [JSON.parse(LEGACY), ...origenDe('failed', INTERROMPUDA.files), { ...INTERROMPUDA, state: 'reviewed-recovery' }, INTERROMPUDA]);
  const pla = planifica(arrel, donant);
  assert.equal(pla.refusats.length, 0, JSON.stringify(pla.refusats));
  const q = pla.quarantena.filter((x) => x.id === INTERROMPUDA.recovers);
  assert.equal(q.length, 3); assert.match(q[0].motiu, /origen verificat .* 8f942f10/);
  assert.equal(pla.valida, true, pla.error);
}, { historiques: [INTERROMPUDA] }));
test('P1-1: un origen amb fitxers divergents es refusa en lloc d’anar a quarantena', () => escenari(({ donant, arrel }) => {
  const altres = INTERROMPUDA.files.map((f) => ({ ...f, after: 'b'.repeat(64) }));
  escriuLinies(arrel, [...origenDe('failed', altres), { ...INTERROMPUDA, state: 'reviewed-recovery' }, INTERROMPUDA]);
  const pla = planifica(arrel, donant);
  assert.ok(pla.refusats.some((r) => r.id === INTERROMPUDA.recovers && /fitxers no coincidixen/.test(r.motiu)));
  assert.equal(pla.quarantena.some((x) => x.id === INTERROMPUDA.recovers), false);
  assert.throws(() => aplica(arrel, donant, pla.hashAbans), /refús/);
}, { historiques: [INTERROMPUDA] }));

/* P1-2: la història pròpia d'una evidència moderna mai no se substituïx per la del donant. */
test('P1-2: una seqüència pròpia invàlida d’una evidència moderna es refusa, no es posa en quarantena', () => escenari(({ donant, arrel }) => {
  const [prep] = linies(donant);
  escriuLinies(arrel, [prep, { ...prep, state: 'verified', afterSeal: 'a'.repeat(64) }, { ...prep, state: 'failed', error: 'local' }]);
  const pla = planifica(arrel, donant);
  assert.ok(pla.refusats.some((r) => r.id === prep.id && /evidència moderna pròpia/.test(r.motiu)));
  assert.equal(pla.quarantena.some((x) => x.id === prep.id), false);
}));

/* P1-3: les línies del donant posteriors al terminal (un publish fallit) també s'importen. */
test('P1-3: s’importa també el failed posterior a l’accepted del donant', () => escenari(({ donant, arrel }) => {
  const ls = linies(donant);
  const darrer = ls.findLast((e) => e.state === 'accepted');
  escriuLinies(donant, [...ls, { ...darrer, state: 'failed', error: 'publish' }]);
  const pla = planifica(arrel, donant);
  assert.deepEqual(pla.importats.find((i) => i.id === darrer.id).estats, ['prepared', 'verified', 'accepted', 'failed']);
  assert.equal(pla.valida, true, pla.error);
}));
