import { expect, test } from 'vitest';
import { ESTATS } from './EspecimenIdentitat.jsx';
import { ESTATS_ADMINISTRACIO } from '../../../connectar/organitzacio/estatAdministracio.js';

/* T43b-5 (ordre del Mestre, 260928) · el catàleg ensenya tots els estats reals
   d'«Administrar l'organització», cadascun una vegada. */
test('l’espècimen pinta cada estat real d’administrar una sola vegada', () => {
  const pintats = ESTATS.map(([, props]) => props.estat);
  expect(new Set(pintats).size).toBe(pintats.length);
  expect([...pintats].sort()).toEqual([...ESTATS_ADMINISTRACIO].sort());
});
