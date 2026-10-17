// @vitest-environment node
/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   Qui veu la carpeta «Maquinària de la IAIA» de la Wiki (i la Consola
   incrustada): en desenvolupament o qui és superadmin. Només un true literal
   obri, com consolaDemanaSessio (guardaConsola.js). */
import { expect, test } from 'vitest';
import { esperaElRol, maquinariaALaVista } from './maquinaria.js';

test('en desenvolupament sempre; en un build, només qui és superadmin', () => {
  expect(maquinariaALaVista({ DEV: true })).toBe(true);
  expect(maquinariaALaVista({ DEV: true, esSuperadmin: false })).toBe(true);
  expect(maquinariaALaVista({ DEV: false, esSuperadmin: true })).toBe(true);
  expect(maquinariaALaVista({ DEV: false, esSuperadmin: false })).toBe(false);
  expect(maquinariaALaVista({ DEV: false })).toBe(false);
});

test('qualsevol valor que no siga un true literal tanca', () => {
  for (const entorn of [undefined, null, {}, { DEV: 'true' }, { DEV: 1 }, { esSuperadmin: 'true' }, { esSuperadmin: 1 }]) {
    expect([entorn, maquinariaALaVista(entorn)]).toEqual([entorn, false]);
  }
});

/* Revisió adversarial del carril D (261016, problema 2) · El rol arriba tard:
   la Wiki només espera quan la Maquinària encara no és a la vista, el rol és
   pendent i la URL la demana. */
test('esperaElRol: només quan les tres coses són certes', () => {
  expect(esperaElRol({ aLaVista: false, rolPendent: true, demana: true })).toBe(true);
  // Ja a la vista (desenvolupament o superadmin), la URL no demana la Maquinària, o el rol ja se sap.
  expect(esperaElRol({ aLaVista: true, rolPendent: true, demana: true })).toBe(false);
  expect(esperaElRol({ aLaVista: false, rolPendent: true, demana: false })).toBe(false);
  expect(esperaElRol({ aLaVista: false, rolPendent: false, demana: true })).toBe(false);
  // Sense proveïdor de sessió, o amb valors que no són un true literal, no s'espera mai.
  for (const cas of [undefined, null, {}, { rolPendent: 'true', demana: true }, { rolPendent: true, demana: 1 }, { rolPendent: 1, demana: 'true' }]) {
    expect([cas, esperaElRol(cas)]).toEqual([cas, false]);
  }
});
