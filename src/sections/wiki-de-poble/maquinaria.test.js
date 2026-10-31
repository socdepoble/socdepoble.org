// @vitest-environment node
/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   Qui veu la carpeta «Maquinària de la IAIA» de la Wiki (i la Consola
   incrustada): en desenvolupament o qui és superadmin. Només un true literal
   obri, com feia consolaDemanaSessio (guardaConsola.js, retirada el
   31-10-2026). */
import { expect, test } from 'vitest';
import { esperaElRol, maquinariaALaVista } from './maquinaria.js';

/* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · Proves actualitzades a
   propòsit: la Consola incrustada és a la vista de tothom, en qualsevol
   entorn i sense sessió. Derogat: «en un build, només qui és superadmin» i
   «qualsevol valor que no siga un true literal tanca». Que les eines amb
   botons continuen només de DEV ho proven WikiDePobleSection.produccio.test.jsx
   i destinsEmoji.test.js (modulsLocalsActius). */
test('a la vista de tothom: en desenvolupament, en un build, amb sessió o sense', () => {
  for (const entorn of [
    { DEV: true }, { DEV: true, esSuperadmin: false }, { DEV: false, esSuperadmin: true },
    { DEV: false, esSuperadmin: false }, { DEV: false }, undefined, null, {}, { DEV: 'true' }, { esSuperadmin: 1 }
  ]) {
    expect([entorn, maquinariaALaVista(entorn)]).toEqual([entorn, true]);
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
