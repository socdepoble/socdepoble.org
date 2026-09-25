import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('E4 exclou mocks de proves però bloqueja la mateixa assignació en producte', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-enxufe-'));
  const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  try {
    write('.agents/AGENTS.md', 'fixture');
    for (const file of ['src/data/backendPort.js', 'src/data/contracte.js', 'src/host.js', 'src/PedraSecaEmbed.jsx']) write(file, fs.readFileSync(file, 'utf8'));
    write('src/example.test.js', 'window.location = {}; Object.defineProperty(window, "parent", {});');
    const run = () => {
      const result = spawnSync(process.execPath, ['tooling/gates/tractor-enxufe.mjs', '--json', `--arrel=${root}`], { encoding: 'utf8' });
      assert.ok([0, 1].includes(result.status), result.stderr);
      return JSON.parse(result.stdout).infraccions.filter(x => x.llei === 'E4');
    };
    assert.deepEqual(run(), []);
    write('src/example.js', fs.readFileSync(path.join(root, 'src/example.test.js'), 'utf8'));
    assert.equal(run().length, 2);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
