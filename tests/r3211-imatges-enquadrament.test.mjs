import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as motor from '../src/utils/enquadramentUrl.js';
import { creaMitjansLocal } from '../src/data/local/mitjansLocal.js';
import { CENS_IMATGES } from '../src/sections/multimedia/censImatges.js';
import {
  FONTS, comprovaContracteEnquadrament, inspeccionaAssets, verificaImatgesEnquadrament,
} from '../tooling/gates/tractor-imatges-enquadrament.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = path.join(ROOT, 'tooling/gates/tractor-imatges-enquadrament.mjs');
const fixture = (t) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-crop-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'public/assets'), { recursive: true });
  fs.writeFileSync(path.join(root, 'public/assets/original.png'), 'full original bytes');
  return root;
};

test('P1-29/P1-30: real consumers and image registry produce nonempty read-only evidence', async () => {
  const report = await verificaImatgesEnquadrament({ arrel: ROOT });
  assert.equal(report.valid, true, JSON.stringify(report.incidencies));
  assert.ok(report.canaris.observacions >= 30);
  assert.ok(report.assets.imatges > 0);
  assert.ok(report.assets.referencies > 0);
  assert.ok(report.assets.ambProcedencia > 0);
  assert.equal(report.assets.duplicatsNoAcreditats, 0);
  assert.equal(report.pixelsRenderitzats, false);
  assert.equal(report.purgaFeta, false);
  assert.equal(report.revisioHumanaDuplicatsFeta, false);
});

test('canaries reject a mutant that loses the saved crop fragment', async () => {
  const result = await comprovaContracteEnquadrament({ motor: { ...motor, conservaEnquadrament: (url) => url } });
  assert.equal(result.valid, false);
  assert.ok(result.incidencies.some((x) => x.codi === 'CROP_TRANSFER'));
});

test('canaries reject a mutant that normalizes bounds or decimal numbers incorrectly', async () => {
  const result = await comprovaContracteEnquadrament({ motor: { ...motor, enquadramentNet: (state) => state } });
  assert.equal(result.valid, false);
  assert.ok(result.incidencies.some((x) => x.codi === 'CROP_NUMBERS'));
});

test('canaries reject a backend mutant that destructively crops the uploaded original', async () => {
  const creaMitjans = (e) => {
    const real = creaMitjansLocal(e);
    return { ...real, uploadToStorage: (blob, options) => real.uploadToStorage(blob.slice(1, blob.size, blob.type), options) };
  };
  const result = await comprovaContracteEnquadrament({ creaMitjans });
  assert.equal(result.valid, false);
  assert.ok(result.incidencies.some((x) => x.codi === 'CROP_ORIGINAL_HASH'));
});

test('canaries reject a real local resolver wrapper that loses the fragment', async () => {
  const creaMitjans = (e) => {
    const real = creaMitjansLocal(e);
    return { ...real, resolveAsset: async (ref) => motor.llevaEnquadrament(await real.resolveAsset(ref)) };
  };
  const result = await comprovaContracteEnquadrament({ creaMitjans });
  assert.equal(result.valid, false);
  assert.ok(result.incidencies.some((x) => x.codi === 'CROP_BACKEND_FRAGMENT'));
});

test('asset inspection rejects new unaccredited byte duplicates without deleting either', (t) => {
  const root = fixture(t);
  fs.copyFileSync(path.join(root, 'public/assets/original.png'), path.join(root, 'public/assets/copy.png'));
  const report = inspeccionaAssets(root, [], { cens: [], excloses: {}, correccions: {}, svgs: {}, pares: [], acreditats: [] });
  assert.equal(report.duplicatsNoAcreditats, 1);
  assert.equal(report.imatges, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'public/assets/original.png')), fs.readFileSync(path.join(root, 'public/assets/copy.png')));
});

test('a loaded consumer cannot certify another root with different transitive dependencies', async (t) => {
  const root = fixture(t), src = CENS_IMATGES[0].src;
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# Fixture marker\n');
  for (const source of FONTS) {
    fs.mkdirSync(path.dirname(path.join(root, source)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, source), path.join(root, source));
  }
  const file = path.join(root, 'public', src);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, 'identical full image bytes');
  // These ten direct sources can match while the actual target's policy differs.
  // Running this module's imported policy would certify the wrong consumer.
  fs.writeFileSync(path.join(root, 'src/config/politicaDeMitjans.js'), 'export const bessonesDe = () => [];\n');
  await assert.rejects(verificaImatgesEnquadrament({ arrel: root }), { code: 'CROP_RUNTIME_ROOT_MISMATCH' });
  assert.equal(fs.readFileSync(file, 'utf8'), 'identical full image bytes');
});

test('verification loads fresh consumers even if the caller precached old source', (t) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-crop-runtime-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // A disposable full dependency tree, never the shared checkout. COW copies
  // preserve distinct inodes without rewriting public image originals.
  for (const dir of ['src', 'tooling', '.agents', 'public']) fs.cpSync(path.join(ROOT, dir), path.join(root, dir), { recursive: true, mode: fs.constants.COPYFILE_FICLONE });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(root, 'package.json'));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(root, 'node_modules'));
  const code = `
    import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
    const root=process.argv[1], file=path.join(root,'src/utils/enquadramentUrl.js');
    const source=fs.readFileSync(file,'utf8');
    await import(pathToFileURL(file));
    fs.writeFileSync(file,source.replace('export function conservaEnquadrament(adreca, original) {','export function conservaEnquadrament(adreca, original) { return adreca;'));
    const gate=await import(pathToFileURL(path.join(root,'tooling/gates/tractor-imatges-enquadrament.mjs')));
    console.log(JSON.stringify(await gate.verificaImatgesEnquadrament({arrel:root})));
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', code, root], { cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.valid, false);
  assert.ok(report.incidencies.some(i => i.codi === 'CROP_TRANSFER'));
});

test('a crop reference retains the original asset identity, provenance and literal evidence', (t) => {
  const root = fixture(t), src = '/assets/original.png';
  const sources = [{ fitxer: 'src/example.js', text: `const image = '${motor.ambEnquadrament(src, { format: '4:3', zoom: 2, cx: .4, cy: .6 })}';` }];
  const report = inspeccionaAssets(root, sources, { cens: [{ src, origen: 'foto', ambit: 'poble' }], excloses: {}, correccions: {}, svgs: {} });
  assert.equal(report.imatges, 1);
  assert.equal(report.referencies, 1);
  assert.equal(report.ambProcedencia, 1);
  assert.equal(report.detall[0].assetId, 'cens-original');
  assert.equal(report.detall[0].arrelCens, src);
  assert.equal(report.detall[0].usos[0].evidencia, 'cami');
});

test('empty assets, symlinks and FIFO files cannot masquerade as a successful inventory', (t) => {
  const root = fixture(t), original = path.join(root, 'public/assets/original.png');
  fs.unlinkSync(original);
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_EMPTY_ASSETS' });
  fs.symlinkSync('/etc/hosts', original);
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_FILE_INVALID' });
  fs.unlinkSync(original);
  const fifo = spawnSync('mkfifo', [original]);
  assert.equal(fifo.status, 0);
  const start = Date.now();
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_FILE_INVALID' });
  assert.ok(Date.now() - start < 1000);
});

test('asset inspection rejects symlink ancestors and hardlinks', (t) => {
  const root = fixture(t), original = path.join(root, 'public/assets/original.png');
  fs.linkSync(original, path.join(root, 'public/assets/hard.png'));
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_FILE_INVALID' });
  fs.unlinkSync(path.join(root, 'public/assets/hard.png'));
  fs.renameSync(path.join(root, 'public'), path.join(root, 'outside'));
  fs.symlinkSync(path.join(root, 'outside'), path.join(root, 'public'));
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_FILE_INVALID' });
});

test('casefolded protected folders are never read and a FIFO swapped after pre-stat cannot block', (t) => {
  const root = fixture(t), original = path.join(root, 'public/assets/original.png');
  const protectedDir = path.join(root, 'public/assets/01_PRODUCCIO');
  fs.mkdirSync(protectedDir);
  fs.writeFileSync(path.join(protectedDir, 'private.png'), 'do not read');
  assert.throws(() => inspeccionaAssets(root), { code: 'CROP_PATH_INVALID' });
  fs.rmSync(protectedDir, { recursive: true });
  const open = fs.openSync;
  let raced = false;
  fs.openSync = function (file, flags, ...args) {
    if (file === original && !raced) {
      raced = true;
      assert.ok(flags & fs.constants.O_NONBLOCK);
      fs.unlinkSync(original);
      assert.equal(spawnSync('mkfifo', [original]).status, 0);
    }
    return open.call(fs, file, flags, ...args);
  };
  try { assert.throws(() => inspeccionaAssets(root), { code: 'CROP_FILE_CHANGED' }); }
  finally { fs.openSync = open; }
  assert.equal(raced, true);
});

test('real CLI emits observations and explicit limits; unknown arguments and invalid roots fail', () => {
  const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 20000 });
  const valid = run(['--json', '--arrel', ROOT]);
  assert.equal(valid.status, 0, valid.stderr);
  assert.ok(JSON.parse(valid.stdout).assets.imatges > 0);
  for (const args of [['--purga'], ['--json', '--json'], ['--arrel'], ['/tmp']]) {
    const invalid = run(args);
    assert.equal(invalid.status, 1, JSON.stringify({ args, stdout: invalid.stdout, stderr: invalid.stderr }));
  }
  const invalid = run(['--json'], { SDP_ARREL: '/tmp/not-a-real-sdp-root' });
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stderr).valid, false);
});
