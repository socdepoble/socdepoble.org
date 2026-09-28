import { afterEach, expect, test } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import {
  desaLlicenciaPerDefecte, llegixLlicenciaPerDefecte, llicenciaDeLActor, llicenciaHeretada, sincronitzaLlicenciaPerDefecte,
} from './herencia.js';

/* T39 (ordre del Mestre, 260928) · la llicència per defecte per identitat. */
const IDS = ['u-1', 'u-2', 'org-1', 'org-2'];
afterEach(() => { for (const id of IDS) delVal(`llicencia-per-defecte:${id}`); });

test('desa i llig per identitat; cada identitat té la seua', () => {
  expect(desaLlicenciaPerDefecte('u-1', 'CC BY 4.0')).toBe(true);
  desaLlicenciaPerDefecte('u-2', 'CC0 1.0');
  expect(llegixLlicenciaPerDefecte('u-1')).toBe('CC BY 4.0');
  expect(llegixLlicenciaPerDefecte('u-2')).toBe('CC0 1.0');
  expect(getVal('llicencia-per-defecte:u-1')).toBe('CC BY 4.0');
});

test('un valor buit esborra la preferència', () => {
  desaLlicenciaPerDefecte('u-1', 'CC BY 4.0');
  desaLlicenciaPerDefecte('u-1', '   ');
  expect(llegixLlicenciaPerDefecte('u-1')).toBeNull();
  expect(getVal('llicencia-per-defecte:u-1')).toBeNull();
});

test('es neteja i es talla a 256, en escriure i en llegir', () => {
  desaLlicenciaPerDefecte('u-1', `  ${'a'.repeat(300)}\u0000  `);
  expect(llegixLlicenciaPerDefecte('u-1')).toBe('a'.repeat(256));
  // Un valor posat per un altre script del mateix origen tampoc passa brut.
  setVal('llicencia-per-defecte:u-2', `b\u0007${'c'.repeat(400)}`);
  expect(llegixLlicenciaPerDefecte('u-2')).toBe(`b${'c'.repeat(255)}`);
  setVal('llicencia-per-defecte:u-2', 42);
  expect(llegixLlicenciaPerDefecte('u-2')).toBeNull();
});

test('sense id no fa res', () => {
  expect(desaLlicenciaPerDefecte(null, 'CC BY 4.0')).toBe(false);
  expect(desaLlicenciaPerDefecte('', 'CC BY 4.0')).toBe(false);
  expect(llegixLlicenciaPerDefecte(undefined)).toBeNull();
  expect(sincronitzaLlicenciaPerDefecte(null, 'CC BY 4.0')).toBe(false);
});

/* T39 (correcció de la revisió, 260928) · Sincronitzar no distingix una còpia
   sembrada d'una tria: el valor de la fitxa trepitja sempre la còpia vella. */
test('sincronitzar copia el valor de la fitxa damunt de qualsevol còpia vella; un de buit no esborra', () => {
  expect(sincronitzaLlicenciaPerDefecte('u-1', 'CC BY-SA 4.0')).toBe(true);
  expect(llegixLlicenciaPerDefecte('u-1')).toBe('CC BY-SA 4.0');
  // El mateix valor no torna a escriure.
  expect(sincronitzaLlicenciaPerDefecte('u-1', 'CC BY-SA 4.0')).toBe(false);
  desaLlicenciaPerDefecte('u-1', 'CC BY 4.0');
  expect(sincronitzaLlicenciaPerDefecte('u-1', 'CC0 1.0')).toBe(true);
  expect(llegixLlicenciaPerDefecte('u-1')).toBe('CC0 1.0');
  // Buit o absent (la columna pot faltar): no diu res i no esborra.
  expect(sincronitzaLlicenciaPerDefecte('u-1', '')).toBe(false);
  expect(sincronitzaLlicenciaPerDefecte('u-1', undefined)).toBe(false);
  expect(llegixLlicenciaPerDefecte('u-1')).toBe('CC0 1.0');
  // Net i tallat a 256, com en desar.
  expect(sincronitzaLlicenciaPerDefecte('u-2', `  ${'a'.repeat(300)}  `)).toBe(true);
  expect(llegixLlicenciaPerDefecte('u-2')).toBe('a'.repeat(256));
});

test('llicenciaHeretada: el servidor guanya a la preferència; sense cap dels dos, null', () => {
  desaLlicenciaPerDefecte('org-1', 'CC BY 4.0');
  expect(llicenciaHeretada({ id: 'org-1', servidor: 'CC0 1.0' })).toBe('CC0 1.0');
  expect(llicenciaHeretada({ id: 'org-1', servidor: '' })).toBe('CC BY 4.0');
  expect(llicenciaHeretada({ id: 'org-1' })).toBe('CC BY 4.0');
  expect(llicenciaHeretada({ id: 'org-2' })).toBeNull();
  expect(llicenciaHeretada()).toBeNull();
});

test('llicenciaDeLActor: una entitat pren el copyright de la seua pertinença; una persona, la preferència', () => {
  const memberships = [{ id: 'org-1', copyright: 'CC BY-NC 4.0' }, { id: 'org-2', copyright: '' }];
  desaLlicenciaPerDefecte('org-2', 'CC BY-SA 4.0');
  desaLlicenciaPerDefecte('u-1', 'CC0 1.0');
  expect(llicenciaDeLActor({ id: 'org-1', tipus: 'entitat', memberships })).toBe('CC BY-NC 4.0');
  expect(llicenciaDeLActor({ id: 'org-2', tipus: 'entitat', memberships })).toBe('CC BY-SA 4.0');
  expect(llicenciaDeLActor({ id: 'u-1', tipus: 'persona', memberships })).toBe('CC0 1.0');
  // Sense pertinences (encara carregant), la preferència.
  expect(llicenciaDeLActor({ id: 'org-2', tipus: 'entitat' })).toBe('CC BY-SA 4.0');
  expect(llicenciaDeLActor({ id: 'u-2', tipus: 'persona' })).toBeNull();
});
