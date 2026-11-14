import assert from 'node:assert/strict';
import test from 'node:test';
import { BANDERES_DE_CAPACITAT, defineDeLesBanderes } from './banderes-de-capacitat.mjs';

test('la co-publicació només s’activa amb una declaració de desplegament exacta', () => {
  assert.ok(BANDERES_DE_CAPACITAT.includes('VITE_SDP_COPUBLICACIO'));
  for (const valor of [undefined, '', 'true', ' 1', 'yes', '0']) {
    assert.equal(defineDeLesBanderes({ VITE_SDP_COPUBLICACIO: valor })['import.meta.env.VITE_SDP_COPUBLICACIO'], '""');
  }
  assert.equal(defineDeLesBanderes({ VITE_SDP_COPUBLICACIO: '1' })['import.meta.env.VITE_SDP_COPUBLICACIO'], '"1"');
});

/* R24 · CODEX-R24-03 · El consens del joc «D'on parles?» depén de migracions R23 encara no
   aplicades: la seua bandera es plega a un literal en compilar, perquè apagada Rollup deixe fora
   src/data/supabase/consensIsoglosses.js i el paquet no crida cap RPC absent. */
test('el consens d’isoglosses només s’activa amb una declaració de desplegament exacta', () => {
  assert.ok(BANDERES_DE_CAPACITAT.includes('VITE_SDP_CONSENS_ISOGLOSSES'));
  for (const valor of [undefined, '', 'true', ' 1', 'yes', '0']) {
    assert.equal(defineDeLesBanderes({ VITE_SDP_CONSENS_ISOGLOSSES: valor })['import.meta.env.VITE_SDP_CONSENS_ISOGLOSSES'], '""');
  }
  assert.equal(defineDeLesBanderes({ VITE_SDP_CONSENS_ISOGLOSSES: '1' })['import.meta.env.VITE_SDP_CONSENS_ISOGLOSSES'], '"1"');
});
