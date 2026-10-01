import test from 'node:test';
import assert from 'node:assert/strict';
import { findDistSecrets, findDeepLSecrets } from '../tooling/lib/dist-secrets.mjs';
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


const uuidDeProva = ['00000000', '1111', '2222', '3333', '444444444444'].join('-');
test('DeepL Free i Pro: detecta credencials, no UUIDs de dades', () => {
  assert.deepEqual(findDeepLSecrets(uuidDeProva), []);
  for (const text of [`${uuidDeProva}:fx`, `DeepL-Auth-Key ${uuidDeProva}`, `DEEPL_API_KEY="${uuidDeProva}"`, `define('DEEPL_API_KEY', '${uuidDeProva}')`]) {
    const r = findDeepLSecrets(text);
    assert.equal(r.length, 1);
    assert.ok(!JSON.stringify(r).includes(uuidDeProva));
  }
});
