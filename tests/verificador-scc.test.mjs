import test from 'node:test';
import assert from 'node:assert';
import { writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

test('SCC falla si hi ha un fitxer no ancorat a l\'escriptori i passa si es neteja', () => {
  const garbagePath = join('_wiki_de_poble', '04_escriptori', 'brossa_temporal_test.md');
  
  // 1. Injectar fitxer brut
  writeFileSync(garbagePath, '# Brossa\n', 'utf8');
  
  // 2. Verificar que SCC falla
  let failed = false;
  try {
    execSync('node tooling/gates/verificador-scc.mjs', { stdio: 'ignore' });
  } catch {
    failed = true;
  }
  
  // Netejar immediatament
  unlinkSync(garbagePath);
  
  assert.strictEqual(failed, true, "La prova de fallada forçada SCC ha fallat: SCC ha retornat verd amb brossa a l'escriptori.");
  
  // 3. Verificar que SCC passa un cop net
  try {
    execSync('node tooling/gates/verificador-scc.mjs', { stdio: 'ignore' });
    assert.ok(true);
  } catch {
    assert.fail("SCC hauria de passar un cop l'escriptori està net.");
  }
});
