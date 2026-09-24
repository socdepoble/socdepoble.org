/**
 * Cap prompt ni pla de l'Escriptori fora de la seua plantilla viva.
 *
 * Passa `inspecciona()` de tooling/gates/porta-plantilla-viva.mjs per tots
 * els documents vigilats del primer nivell de 04_escriptori i imprimix els
 * incompliments. Mode informe per defecte; amb SDP_PORTA_PLANTILLA=1 falla
 * si n'hi ha cap. No escriu res.
 *
 * Ús:  node --test tests/plantilla-viva-escriptori.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { candidats, inspecciona } from '../tooling/gates/porta-plantilla-viva.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('prompts i plans de l’Escriptori contra la plantilla viva (lectura)', () => {
  const informes = candidats(ROOT).map((rel) => inspecciona(ROOT, rel));
  const dolents = informes.filter((i) => i.errors.length);
  for (const i of informes) {
    process.stdout.write(`\n${i.errors.length ? '❌' : '✅'} ${i.fitxer} · ruta ${i.ruta || '?'} · rebut ${i.rebut || 'cap'}\n`);
    for (const e of i.errors) process.stdout.write(`   - ${e}\n`);
  }
  process.stdout.write(`\n${informes.length} revisats · ${dolents.length} fora de plantilla\n`);
  if (process.env.SDP_PORTA_PLANTILLA === '1') assert.equal(dolents.length, 0);
});
