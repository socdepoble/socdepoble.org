import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CAMINS } from '../../tooling/lib/arrel.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const GATE = path.join(ROOT, 'tooling/gates/tractor-rutes.mjs');

test('R32.21 rutes: el deute elegible de Wiki i portes desapareix sense una nova exempció', () => {
  const r = spawnSync(process.execPath, [GATE, '--detall'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const findings = r.stdout.split('\n').filter(line => /^\s+tooling\/(?:wiki|gates)\//.test(line));
  assert.deepEqual(findings.filter(line => !line.includes('tooling/gates/antigravity-hook.mjs')), [], findings.join('\n'));
});

test('R32.21 rutes: importar CAMINS no amaga un literal nou escrit a mà', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-r3221-route-'));
  try {
    fs.mkdirSync(path.join(dir, 'tooling/wiki/lib'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'tooling/wiki/lib/project_paths.mjs'), `export const ESCRIPTORI_DIR='${CAMINS.escriptori}';\nexport const WIKI_DIR='${CAMINS.wiki}';\n`);
    fs.writeFileSync(path.join(dir, 'tooling/new.mjs'), `import { CAMINS } from './lib/arrel.mjs';\nconst orphan='${CAMINS.wiki}/inventat';\n`);
    const r = spawnSync(process.execPath, [GATE, '--detall'], { cwd: dir, encoding: 'utf8', env: { PATH: process.env.PATH } });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /tooling\/new\.mjs:2/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
