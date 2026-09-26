import { expect, test } from 'vitest';
import { setBackendImplementation, teCapacitat, validaBackendImplementation } from '../backendPort.js';
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';
import * as supabase from './index.js';

/* Viu ací i no a contracte.test.js: E1 de tractor-enxufe només deixa importar
   l'adaptador des de src/data/supabase/. És la mateixa validació que fa
   host.js:arrenca(); si falla, l'aplicació no es munta. */

/* L'spread fa falta: vitest pot exposar els exports del mòdul amb getters, i el
   port rebutja els accessors (no executa getters en validar). */
test('l’adaptador Supabase sencer valida i ofereix compte i consentiment', () => {
  expect(() => validaBackendImplementation({ ...supabase })).not.toThrow();
  setBackendImplementation({ ...supabase });
  for (const nom of CONTRACTE_NUCLI) expect(typeof supabase[nom], nom).toBe('function');
  const presents = Object.keys(CAPACITATS).filter((cap) => teCapacitat(cap));
  expect(presents).toEqual(expect.arrayContaining(['compte', 'consentiment']));
});

test('cap mètode de compte o consentiment es perd per ambigüitat entre mòduls', () => {
  /* Dos `export *` amb el mateix nom s'anul·len en silenci: el mètode
     desapareix i la capacitat queda parcial. registraConsentiment viu a
     auth.js i només allí. */
  for (const nom of [...CAPACITATS.compte, ...CAPACITATS.consentiment]) {
    expect(typeof supabase[nom], nom).toBe('function');
  }
});
