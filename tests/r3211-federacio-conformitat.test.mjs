import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verificaManifestOpenData, verificaPerfilFederat } from '../tooling/gates/conformitat-federacio.mjs';
import { preparaFederacio } from '../tooling/seo/genera-federacio.mjs';
import { spawnSync, execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = path.join(root, 'public/opendata');

test('R32.11 · every real manifest resource matches its exact bytes', () => {
  const before = fs.readFileSync(path.join(source, 'manifest.json'));
  const report = verificaManifestOpenData(source);
  assert.equal(report.valid, true); assert.equal(report.resources.length, 10);
  assert.equal(report.authenticity, 'not-verified');
  assert.deepEqual(fs.readFileSync(path.join(source, 'manifest.json')), before);
});

test('independent review: invalid UTF-8 and special resource files cannot receive integrity approval', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-od-special-'));
  try {
    fs.cpSync(source, directory, { recursive: true });
    const file = path.join(directory, 'manifest.json'), bytes = fs.readFileSync(file);
    const position = bytes.indexOf(Buffer.from('agenda-ics')); assert.ok(position > 0);
    const invalid = Buffer.from(bytes); invalid[position] = 0xff; fs.writeFileSync(file, invalid);
    assert.throws(() => verificaManifestOpenData(directory));
    fs.writeFileSync(file, bytes);
    const manifest = JSON.parse(bytes), resource = path.join(directory, manifest.resources[0].path);
    fs.unlinkSync(resource); execFileSync('mkfifo', [resource]);
    const moduleUrl = new URL('../tooling/gates/conformitat-federacio.mjs', import.meta.url).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e',
      `const {verificaManifestOpenData}=await import(${JSON.stringify(moduleUrl)}); try{verificaManifestOpenData(${JSON.stringify(directory)});process.exitCode=2;}catch(e){process.stdout.write(e.code);}`], { encoding: 'utf8', timeout: 2000 });
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
    assert.equal(result.stdout, 'OD_FILE_INVALID');
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('R32.11 · real federation generator conforms without remote probing', async () => {
  const prepared = await preparaFederacio({ arrel: root, origen: 'https://socdepoble.org', identitat: null });
  const report = verificaPerfilFederat({ origen: prepared.origen, actors: prepared.actors });
  assert.equal(report.valid, true); assert.ok(report.documents.length > 4);
  assert.equal(report.remoteInteropVerified, false);
});

for (const scenario of ['bytes', 'hash', 'duplicate', 'traversal', 'symlink', 'hardlink', 'missing', 'size']) {
  test(`R32.11 · manifest refuses ${scenario} before claiming integrity`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-od-'));
    try {
      fs.cpSync(source, directory, { recursive: true });
      const file = path.join(directory, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(file));
      const resource = manifest.resources[0], target = path.join(directory, resource.path);
      if (scenario === 'bytes') fs.appendFileSync(target, 'tampered');
      if (scenario === 'hash') resource.hash = `sha256:${'0'.repeat(64)}`;
      if (scenario === 'duplicate') manifest.resources.push({ ...resource });
      if (scenario === 'traversal') resource.path = '../outside';
      if (scenario === 'symlink') { fs.unlinkSync(target); fs.symlinkSync(path.join(source, resource.path), target); }
      if (scenario === 'hardlink') { fs.renameSync(target, `${target}.held`); fs.linkSync(`${target}.held`, target); }
      if (scenario === 'missing') fs.unlinkSync(target);
      if (scenario === 'size') resource.bytes++;
      fs.writeFileSync(file, JSON.stringify(manifest));
      assert.throws(() => verificaManifestOpenData(directory));
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
  });
}

test('independent review: manifest rewritten during resource read cannot receive a valid report', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3211-od-race-'));
  const originalOpen = fs.openSync, originalRead = fs.readFileSync;
  try {
    fs.cpSync(source, directory, { recursive: true });
    const file = path.join(directory, 'manifest.json'), first = JSON.parse(fs.readFileSync(file));
    const fds = new Map(); let changed = false;
    fs.openSync = function (file, ...args) { const fd = originalOpen.call(this, file, ...args); fds.set(fd, String(file)); return fd; };
    fs.readFileSync = function (fd, ...args) {
      const bytes = originalRead.call(this, fd, ...args);
      if (!changed && fds.get(fd) === path.join(directory, first.resources[0].path)) {
        changed = true; first.resources[0].hash = `sha256:${'0'.repeat(64)}`;
        fs.writeFileSync(file, JSON.stringify(first));
      }
      return bytes;
    };
    assert.throws(() => verificaManifestOpenData(directory), { code: 'OD_MANIFEST_CHANGED' });
    assert.equal(changed, true);
  } finally {
    fs.openSync = originalOpen; fs.readFileSync = originalRead;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
