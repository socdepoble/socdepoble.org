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
  /* Pla 261018_1605 (Tasca 4, D8) · la biblioteca de fotos pròpies, sense tombar la pujada ('mitjans'). */
  expect(presents).toEqual(expect.arrayContaining(['mitjans', 'mitjansPropis']));
  expect(teCapacitat('mitjansPropis')).toBe(true);
  expect(teCapacitat('mitjans')).toBe(true);
  for (const nom of CAPACITATS.mitjansPropis) expect(typeof supabase[nom], nom).toBe('function');
  /* Fase D (261020, tasca 2) · la moderació i les normes de convivència (migració 2610201500). */
  expect(presents).toEqual(expect.arrayContaining(['moderacio', 'normesConvivencia']));
  expect(teCapacitat('moderacio')).toBe(true);
  expect(teCapacitat('normesConvivencia')).toBe(true);
  for (const nom of [...CAPACITATS.moderacio, ...CAPACITATS.normesConvivencia]) expect(typeof supabase[nom], nom).toBe('function');
  /* T6b (IDEA-14; decisió del Mestre, 261024) · «Connectar / Seguir» (migració 2610241430). */
  expect(presents).toEqual(expect.arrayContaining(['seguiments']));
  expect(teCapacitat('seguiments')).toBe(true);
  for (const nom of CAPACITATS.seguiments) expect(typeof supabase[nom], nom).toBe('function');
  /* IDEA-22, punt 2 (pla 261025_0200) · la titular que ha triat mostrar-se i la seua tria (migració 2610250300). */
  expect(presents).toEqual(expect.arrayContaining(['titularPublic', 'consentimentTitular']));
  for (const nom of [...CAPACITATS.titularPublic, ...CAPACITATS.consentimentTitular]) expect(typeof supabase[nom], nom).toBe('function');
  /* Fase D (261020, tasca 1) · entrar amb el testimoni del full natiu d'Apple o de Google. */
  expect(presents).toEqual(expect.arrayContaining(['entradaAmbToken']));
  expect(teCapacitat('entradaAmbToken')).toBe(true);
  expect(typeof supabase.entraAmbTokenDeProveidor).toBe('function');
});

test('cap mètode de compte o consentiment es perd per ambigüitat entre mòduls', () => {
  /* Dos `export *` amb el mateix nom s'anul·len en silenci: el mètode
     desapareix i la capacitat queda parcial. registraConsentiment viu a
     auth.js i només allí. */
  for (const nom of [...CAPACITATS.compte, ...CAPACITATS.consentiment]) {
    expect(typeof supabase[nom], nom).toBe('function');
  }
});
