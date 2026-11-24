import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { EIXIDA } from '../scripts/botigues/entorn.mjs';
import { main as publica, comprovaDisponibilitat, escriuManifestVersio, resumOmnicanal } from '../scripts/botigues/publica-tot.mjs';
import { main as ios, notesDeFitxer, preparaRevisioIos, referenciaPujadaIos } from '../scripts/botigues/puja-ios.mjs';
import { mainEstat } from '../scripts/botigues/estat.mjs';

const SHA = 'a'.repeat(64);
const VERSION = '1.2.24';
const BUILD = '29';
const CONFIRMA = `produccio:${VERSION}+${BUILD}@${SHA.slice(0, 12)}`;
const ROOT = path.resolve(import.meta.dirname, '..');
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-asc-contract-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'repo'), builds = path.join(temp, 'builds');
  fs.mkdirSync(root); fs.mkdirSync(builds);
  const receipt = path.join(builds, 'pujades.jsonl');
  const entry = { plataforma: 'ios', canal: 'produccio', versio: VERSION, build: BUILD, sha256: SHA };
  fs.writeFileSync(receipt, JSON.stringify(entry) + '\n', { mode: 0o600 });
  return { root, builds, receipt, entry, valors: { SDP_BUILDS_DIR: builds, SDP_APP_ID: 'org.socdepoble.app' } };
}
async function capture(fn) {
  const lines = [];
  const out = process.stdout.write, err = process.stderr.write;
  process.stdout.write = (s) => { lines.push(String(s)); return true; };
  process.stderr.write = (s) => { lines.push(String(s)); return true; };
  try { return { code: await fn(), text: lines.join('') }; }
  finally { process.stdout.write = out; process.stderr.write = err; }
}
test('ASC integration: notes JSON/text are bounded and errors never echo file contents', (t) => {
  const f = fixture(t), txt = path.join(f.root, 'notes.txt'), json = path.join(f.root, 'notes.json');
  fs.writeFileSync(txt, ' Millores de fiabilitat. ');
  assert.equal(notesDeFitxer(txt), 'Millores de fiabilitat.');
  fs.writeFileSync(json, JSON.stringify({ ca: 'Millores', es: 'Mejoras' }));
  assert.deepEqual(notesDeFitxer(json), { ca: 'Millores', es: 'Mejoras' });
  fs.writeFileSync(json, '{PRIVATE_NOTES_CANARY');
  assert.throws(() => notesDeFitxer(json), (e) => !e.message.includes('PRIVATE_NOTES_CANARY') && !e.message.includes(f.root));
  fs.writeFileSync(txt, 'x'.repeat(128 * 1024 + 1)); assert.throws(() => notesDeFitxer(txt));
  fs.writeFileSync(txt, '-----BEGIN PRIVATE KEY-----\nSYNTHETIC_ONLY\n-----END PRIVATE KEY-----');
  assert.throws(() => notesDeFitxer(txt));
  const p8 = path.join(f.root, 'notes.p8'); fs.writeFileSync(p8, 'Not even a key'); assert.throws(() => notesDeFitxer(p8));
  fs.rmSync(txt); fs.symlinkSync(json, txt); assert.throws(() => notesDeFitxer(txt));
});
test('ASC integration: review reuses an unambiguous post-upload digest, never a guessed SHA', (t) => {
  const f = fixture(t), args = { arrel: f.root, valors: f.valors, versio: VERSION, build: BUILD };
  assert.equal(referenciaPujadaIos(args), SHA);
  for (const receipt of [
    { ...f.entry, build: '28' }, { ...f.entry, sha256: undefined },
    [{ ...f.entry }, { ...f.entry, sha256: 'b'.repeat(64) }]
  ]) {
    fs.writeFileSync(f.receipt, (Array.isArray(receipt) ? receipt : [receipt]).map(JSON.stringify).join('\n') + '\n');
    assert.throws(() => referenciaPujadaIos(args));
  }
  fs.writeFileSync(f.receipt, JSON.stringify(f.entry) + '\nINVALID\n'); assert.throws(() => referenciaPujadaIos(args));
});
test('ASC integration: wrong production confirmation refuses before ANY ASC request', async (t) => {
  const f = fixture(t); let calls = 0;
  await assert.rejects(preparaRevisioIos({ arrel: f.root, valors: f.valors, versio: VERSION, build: BUILD,
    confirma: CONFIRMA.replace('aaaaaaaaaaaa', 'bbbbbbbbbbbb'), asc: { client: { request() { calls++; throw new Error('should not run'); } } } }));
  assert.equal(calls, 0);
});
test('ASC integration: new CLI flags require production and explicit digest confirmation', async () => {
  for (const flags of [ ['--prepara-revisio'], ['--canal', 'produccio', '--notes-fitxer', 'notes.txt'], ['--canal', 'produccio', '--envia-revisio', '--compila'] ]) {
    const r = await capture(() => ios(['--versio', VERSION, '--build', BUILD, ...flags])); assert.equal(r.code, EIXIDA.US);
  }
  const r = await capture(() => ios(['--versio', VERSION, '--build', BUILD, '--canal', 'produccio', '--envia-revisio']));
  assert.equal(r.code, EIXIDA.CONFIRMACIO);
});
test('ASC integration: WAITING/IN_REVIEW cannot advance ard; READY_FOR_SALE can', async (t) => {
  const f = fixture(t), manifest = path.join(f.root, 'ard.json');
  const original = JSON.stringify({ version: '1.2.23', iosBuild: 1, entries: [] });
  fs.writeFileSync(manifest, original);
  const valors = { ...f.valors, SDP_ASC_KEY_ID: 'SYNTHETIC0', SDP_ASC_ISSUER_ID: '00000000-0000-4000-8000-000000000000', SDP_ASC_KEY_PATH: 'unused.p8' };
  const requests = [];
  const client = { async request(method, resource) { requests.push({ method, resource }); return { data: [{ id: '6826441844', attributes: { bundleId: f.valors.SDP_APP_ID } }] }; } };
  for (const state of ['WAITING_FOR_REVIEW', 'IN_REVIEW', 'READY_FOR_SALE']) {
    const result = await comprovaDisponibilitat({ arrel: f.root, valors, iosBuild: BUILD, versio: VERSION, opcionsAsc: { client },
      consultaAsc: async (args) => { assert.equal(args.versio, VERSION); assert.equal(args.build, BUILD); return { readyForSale: state === 'READY_FOR_SALE', appStoreState: state }; } });
    if (result.codi === EIXIDA.BE) {
      assert.equal(state, 'READY_FOR_SALE');
      assert.equal(escriuManifestVersio({ arrel: f.root, cami: manifest, versio: VERSION, versioPaquet: VERSION, iosBuild: BUILD, maximBuild: 29 }).codi, 0);
    } else { assert.equal(result.codi, EIXIDA.ARBRE); assert.equal(fs.readFileSync(manifest, 'utf8'), original); }
  }
  assert.equal(JSON.parse(fs.readFileSync(manifest)).iosBuild, 29);
  assert.ok(requests.every((r) => r.method === 'GET'));
});
test('ASC integration: partial credentials and failed lookup fail closed; no-ASC legacy remains explicit', async (t) => {
  const f = fixture(t), args = { arrel: f.root, valors: f.valors, iosBuild: BUILD };
  assert.equal((await comprovaDisponibilitat(args)).codi, 0);
  assert.equal((await comprovaDisponibilitat({ ...args, valors: { ...f.valors, SDP_ASC_KEY_ID: 'PARTIAL_KEY' } })).codi, EIXIDA.FALTA);
  const r = await comprovaDisponibilitat({ ...args, valors: { ...f.valors, SDP_ASC_KEY_ID: 'a', SDP_ASC_ISSUER_ID: 'b', SDP_ASC_KEY_PATH: 'c' },
    opcionsAsc: { client: { request: async () => { throw new Error('PRIVATE_REMOTE_ECHO'); } } } });
  assert.equal(r.codi, EIXIDA.EXTERNA); assert.ok(!JSON.stringify(r).includes('PRIVATE_REMOTE_ECHO'));
});
test('ASC integration: public production plan offers Review and no TestFlight announcement', () => {
  const plan = resumOmnicanal(ROOT, { versio: VERSION, build: BUILD, plataforma: 'ios', canal: 'produccio', env: { SDP_BOTIGUES_ENV: '/nonexistent.env', SDP_RONDA_BETA_TESTERS: '1' } });
  assert.ok(plan.passos.some((p) => p.ordre.includes('--envia-revisio')));
  assert.ok(!plan.passos.some((p) => /TestFlight|sincronitza-proves|testflightIosBuild/.test(p.accio + p.ordre)));
});

test('ASC integration: real environment loading routes positive iOS, omnichannel and status CLI without upload or secret output', async (t) => {
  const f = fixture(t);
  assert.ok(!fs.realpathSync(f.root).startsWith(fs.realpathSync(ROOT) + path.sep), 'credential fixture must be outside the repository under test');
  const uploaded = path.join(f.builds, 'synthetic-upload.ipa');
  fs.writeFileSync(uploaded, 'Synthetic already-uploaded artifact; never passed to a native tool.');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(uploaded)).digest('hex');
  fs.writeFileSync(f.receipt, JSON.stringify({ ...f.entry, sha256: digest }) + '\n', { mode: 0o600 });
  const confirmation = `produccio:${VERSION}+${BUILD}@${digest.slice(0, 12)}`;
  const environment = path.join(f.root, 'stores.txt'), notes = path.join(f.root, 'notes.txt');
  fs.writeFileSync(environment, `SDP_APP_ID=org.socdepoble.app\nSDP_BUILDS_DIR=${f.builds}\n`, { mode: 0o600 });
  fs.chmodSync(environment, 0o600); fs.writeFileSync(notes, 'Notes sintètiques del build ja publicat.');
  const calls = [];
  const validBuild = { type: 'builds', id: 'build-ready', attributes: { version: BUILD, processingState: 'VALID', usesNonExemptEncryption: false } };
  const client = {
    async list(resource) {
      calls.push(['GET', resource]);
      if (resource.startsWith('/v1/apps/6826441844/appStoreVersions?')) return [{ type: 'appStoreVersions', id: 'version-ready', attributes: { platform: 'IOS', versionString: VERSION, appStoreState: 'READY_FOR_SALE', releaseType: 'AFTER_APPROVAL' } }];
      if (resource.startsWith('/v1/builds?')) return [validBuild];
      if (resource === '/v1/appStoreVersions/version-ready/appStoreVersionLocalizations?limit=200') return [];
      assert.fail('Unexpected API collection in positive CLI fixture');
    },
    async request(method, resource) {
      calls.push([method, resource]); assert.equal(method, 'GET', 'already-public glue must not mutate');
      if (resource.startsWith('/v1/apps?filter[bundleId]=')) return { data: [{ type: 'apps', id: '6826441844', attributes: { bundleId: 'org.socdepoble.app' } }] };
      if (resource === '/v1/builds/build-ready/preReleaseVersion') return { data: { type: 'preReleaseVersions', id: 'prerelease-ready', attributes: { version: VERSION, platform: 'IOS' } } };
      if (resource === '/v1/appStoreVersions/version-ready/build') return { data: validBuild };
      if (resource === '/v1/appStoreVersions/version-ready/appStoreReviewDetail') return { data: null };
      assert.fail('Unexpected API operation in positive CLI fixture');
    },
    async espera() { assert.fail('VALID build must not poll'); }
  };
  const env = { SDP_BOTIGUES_ENV: environment }, asc = { client };
  const args = ['--versio', VERSION, '--build', BUILD, '--canal', 'produccio', '--notes-fitxer', notes, '--espera-valid', `--confirma=${confirmation}`];
  const output = [];
  for (const flag of ['--prepara-revisio', '--envia-revisio']) {
    const r = await capture(() => ios([...args, flag], { env, asc }));
    assert.equal(r.code, EIXIDA.BE, 'positive iOS review CLI');
    assert.equal(JSON.parse(r.text).alreadyPublic, true); output.push(r.text);
  }
  // The omnichannel planner only queries native tools. Shadow those queries so
  // this glue canary never invokes actual Xcode, altool, codesign or plutil.
  const bin = path.join(f.root, 'bin'); fs.mkdirSync(bin);
  for (const name of ['xcodebuild', 'xcrun', 'codesign', 'plutil']) fs.writeFileSync(path.join(bin, name), '#!/bin/sh\nexit 1\n', { mode: 0o700 });
  const previousPath = process.env.PATH; process.env.PATH = `${bin}${path.delimiter}${previousPath ?? ''}`;
  try {
    const r = await capture(() => publica([...args, '--plataforma', 'ios', '--envia-revisio'], { env, asc }));
    assert.equal(r.code, EIXIDA.BE, 'omnichannel forwards production review flags, environment and injected ASC client');
    assert.equal(JSON.parse(r.text).alreadyPublic, true); output.push(r.text);
  } finally { if (previousPath === undefined) delete process.env.PATH; else process.env.PATH = previousPath; }
  const status = await capture(() => mainEstat(['--asc'], { arrel: ROOT, env, asc }));
  assert.equal(status.code, EIXIDA.BE); const parsed = JSON.parse(status.text);
  assert.equal(parsed.versions[0].versionString, VERSION); assert.equal(parsed.builds[0].build, BUILD); output.push(status.text);
  assert.ok(calls.length > 0 && calls.every(([method]) => method === 'GET'));
  assert.ok(!calls.some(([, resource]) => /reviewSubmissions|upload|testflight/i.test(new URL(resource, 'https://synthetic.invalid').pathname)));
  for (const text of output) for (const forbidden of [environment, f.root, f.builds, 'PRIVATE KEY', 'Bearer ', 'contactEmail']) assert.ok(!text.includes(forbidden), 'no sensitive data or paths in successful output');
});
