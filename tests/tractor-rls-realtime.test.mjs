import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const gate = fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs', import.meta.url));
function check(sql) {
  const cwd = mkdtempSync(join(tmpdir(), 'sdp-rls-'));
  try {
    mkdirSync(join(cwd, 'supabase'));
    writeFileSync(join(cwd, 'supabase', 'policy.sql'), sql);
    return spawnSync(process.execPath, [gate], { cwd, encoding: 'utf8' });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}

test('R1 reconeix exclusivament realtime.messages com a taula del servei', () => {
  const result = check('create policy own on realtime.messages for select to authenticated using (topic = realtime.topic());');
  assert.equal(result.status, 0, result.stdout);
  const unknown = check('create policy own on realtime.inventada for select to authenticated using (false);');
  assert.equal(unknown.status, 1);
  assert.match(unknown.stdout, /R1.*realtime.inventada/);
});

test('R3 continua rebutjant lectura o escriptura indiscriminada en Realtime', () => {
  for (const clause of ['for select using (true)', 'for insert with check (true)']) {
    const result = check(`create policy open on realtime.messages ${clause};`);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /R3.*messages/);
  }
});
