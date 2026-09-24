import test from 'node:test';
import assert from 'node:assert/strict';
import { findDistSecrets } from '../tooling/lib/dist-secrets.mjs';
test('documentary role names are not credentials', () => {
  assert.deepEqual(findDistSecrets('Do not expose service_role keys in a browser.'), []);
});
for (const [name, value] of [
  ['secret key', 'sb_secret_' + 'syntheticfixtureonly'],
  ['publishable key', 'sb_publishable_' + 'syntheticfixtureonly'],
  ['JWT', 'eyJ' + 'a'.repeat(24) + '.' + 'b'.repeat(24) + '.fixture'],
  ['project URL', 'https://' + 'a'.repeat(20) + '.supabase.co']
]) test(`detects ${name} without leaking it in diagnostics`, () => {
  const findings = findDistSecrets(`service_role ${value} ${value}`);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].count, 2);
  assert.ok(!JSON.stringify(findings).includes(value));
});
