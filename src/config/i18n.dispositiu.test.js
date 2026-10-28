// @vitest-environment node
/* Pla 261028_1526 (P1-22, TE-05) · llenguaDelDispositiu: de les etiquetes BCP 47
   del dispositiu (navigator.languages) a un codi del selector, o res. Només la
   subetiqueta primària, només les cinc llengües de l'app, i com a molt les 16
   primeres etiquetes. Pura: no llig ni escriu res. */
import { describe, expect, test } from 'vitest';
import { llenguaDelDispositiu, resolIdioma } from './i18n.js';

describe('llenguaDelDispositiu', () => {
  test.each([
    ['ca-ES-valencia', 'ca'], ['ca-AD', 'ca'], ['ca', 'ca'], ['es-419', 'es'], ['es_ES', 'es'], ['EN-gb', 'en'],
    ['  eu-ES  ', 'eu'], ['gl-ES', 'gl'], ['oc', undefined], ['pt-BR', undefined], ['caa', undefined], ['', undefined]
  ])('%j → %j', (etiqueta, codi) => {
    expect(llenguaDelDispositiu(etiqueta)).toBe(codi);
    expect(llenguaDelDispositiu([etiqueta])).toBe(codi);
  });

  test('la primera de la llista que l’app parla', () => {
    expect(llenguaDelDispositiu(['fr-FR', 'en-GB', 'es-ES'])).toBe('en');
    expect(llenguaDelDispositiu(['', 'oc', 'gl'])).toBe('gl');
    expect(llenguaDelDispositiu(['fr', 'de'])).toBeUndefined();
  });

  test('res que no siga una etiqueta de text: cap llengua', () => {
    for (const cru of [undefined, null, 42, {}, [], [42, null, {}], [['es']]]) expect(llenguaDelDispositiu(cru)).toBeUndefined();
    expect(llenguaDelDispositiu([42, 'es'])).toBe('es');
  });

  test('com a molt les 16 primeres etiquetes', () => {
    const quinze = Array(15).fill('fr');
    expect(llenguaDelDispositiu([...quinze, 'es'])).toBe('es');
    expect(llenguaDelDispositiu([...quinze, 'de', 'es'])).toBeUndefined();
  });

  test('T1 sense canvis: la del dispositiu va com a amfitrió, i la tria explícita guanya', () => {
    expect(resolIdioma({ triat: null, amfitrio: llenguaDelDispositiu(['es-ES']) })).toBe('es');
    expect(resolIdioma({ triat: 'gl', amfitrio: llenguaDelDispositiu(['es-ES']) })).toBe('gl');
    expect(resolIdioma({ triat: null, amfitrio: llenguaDelDispositiu(['fr-FR']) })).toBe('ca');
  });
});
