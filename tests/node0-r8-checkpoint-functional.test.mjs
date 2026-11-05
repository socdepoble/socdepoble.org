import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('sealed R7 checkpoint bootstrap preserves ordinary HMAC verification and bounded filesystem contracts', t => {
  const fixture = fileURLToPath(new URL('./fixtures/node0-r8-checkpoint-functional.py', import.meta.url));
  const result = spawnSync('python3', ['-I', '-B', fixture], { encoding: 'utf8', timeout: 30000, maxBuffer: 1048576,
    env: { PATH: process.env.PATH, LANG: 'C' } });
  assert.equal(result.status, 0, result.stderr || 'checkpoint_functional_runner_failed');
  const cases = /Ran (\d+) tests/.exec(result.stderr)?.[1];
  assert.equal(cases, '15');
  t.diagnostic('15 synthetic Python functional cases passed; no native mirror, key or Drive read.');
});
