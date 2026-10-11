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
  expect(presents).toEqual(expect.arrayContaining(['compte', 'consentiment', 'cicleNotes']));
  expect(teCapacitat('cicleNotes')).toBe(true);
  /* T43 (ordre del Mestre, 260928) · administrar organitzacions i el seu correu. */
  expect(presents).toEqual(expect.arrayContaining(['reclamacions', 'contacteOrganitzacio']));
  /* T63.2 i T67 · el xat comú d'una Pàgina Universal (migració 2609282100). */
  expect(presents).toEqual(expect.arrayContaining(['xatDePagina']));
  expect(teCapacitat('xatDePagina')).toBe(true);
  /* T2 i T4 (ordre del Mestre, 260930) · la salut del node abans de canviar de mode. */
  expect(presents).toEqual(expect.arrayContaining(['salut']));
  expect(teCapacitat('salut')).toBe(true);
  expect(typeof supabase.comprovaServidor).toBe('function');
  /* R (Onada 3, 261003) · recuperar la contrasenya perduda. */
  expect(presents).toEqual(expect.arrayContaining(['recuperacioContrasenya']));
  expect(teCapacitat('recuperacioContrasenya')).toBe(true);
  for (const nom of CAPACITATS.recuperacioContrasenya) expect(typeof supabase[nom], nom).toBe('function');
  /* Ordre del Mestre (261008, grup C) · els membres d'una organització (migració 2610081402). */
  expect(presents).toEqual(expect.arrayContaining(['membresOrganitzacio']));
  expect(teCapacitat('membresOrganitzacio')).toBe(true);
  for (const nom of CAPACITATS.membresOrganitzacio) expect(typeof supabase[nom], nom).toBe('function');
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · el segon factor del superadmin i la personalització del poble. */
  expect(presents).toEqual(expect.arrayContaining(['segonFactor', 'personalitzacio']));
  expect(teCapacitat('segonFactor')).toBe(true);
  expect(teCapacitat('personalitzacio')).toBe(true);
  for (const nom of [...CAPACITATS.segonFactor, ...CAPACITATS.personalitzacio]) expect(typeof supabase[nom], nom).toBe('function');
});

test('cap mètode de compte o consentiment es perd per ambigüitat entre mòduls', () => {
  /* Dos `export *` amb el mateix nom s'anul·len en silenci: el mètode
     desapareix i la capacitat queda parcial. registraConsentiment viu a
     auth.js i només allí. */
  for (const nom of [...CAPACITATS.compte, ...CAPACITATS.consentiment]) {
    expect(typeof supabase[nom], nom).toBe('function');
  }
});
