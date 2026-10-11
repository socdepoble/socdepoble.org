/**
 * Onada 11 (261010; prompt 261010_1730, tasca 6, D15) · L'entradilla del
 * panell «Rebuts» del pols (polsConsola.js) diu el rebut pel que és, com el
 * paràgraf corregit de /page/consola a l'Onada 10: hui cap eina escriu rebuts
 * al diari (matrix.mjs ho declara), i el text no pot dir que «cada vegada que
 * un agent llig» en queda un. El llindar «més d'una setmana» és el del tauler
 * (LLINDAR_REBUTS_RANCIS_DIES). Sense React: dades pures.
 */
import { describe, expect, test } from 'vitest';
import { LLINDAR_REBUTS_RANCIS_DIES } from './consolaPagines.js';
import { IDS_PANELLS, panellPols, panellsPols, rutaPanell } from './polsConsola.js';
import { PAGE_COPY } from '../text/pageContent.js';

const ENTRADILLA = 'Un rebut és la constància que un agent ha llegit senceres les fonts d’un protocol, amb l’empremta de cada fitxer. Obri’l per vore quines fonts va llegir; si fa més d’una setmana que no n’arriba cap, el tauler ho marca.';

describe('polsConsola · el panell «Rebuts»', () => {
  test('D15 · l’entradilla diu el rebut pel que és i el llindar del tauler, no «cada vegada que un agent llig»', () => {
    const rebuts = panellPols('rebuts');
    expect(rebuts.entradilla).toBe(ENTRADILLA);
    expect(rebuts.entradilla).not.toContain('Cada vegada que un agent llig');
    expect(rebuts.entradilla).not.toContain('en queda un rebut');
    /* «Més d'una setmana» és el llindar dels rebuts rancis del pols. */
    expect(LLINDAR_REBUTS_RANCIS_DIES).toBe(7);
    expect(rebuts.entradilla).toContain('si fa més d’una setmana que no n’arriba cap, el tauler ho marca');
    /* La mateixa frase que el paràgraf corregit de /page/consola. */
    expect(PAGE_COPY.consola.html).toContain('si fa més d’una setmana que no n’arriba cap, el tauler ho marca');
    /* Apòstrof tipogràfic, com la resta de textos del pols. */
    expect(rebuts.entradilla).not.toContain("'");
  });

  test('la resta del panell no canvia: id, títol, subtítol, icona i ruta', () => {
    expect(panellPols('rebuts')).toMatchObject({
      id: 'rebuts', titol: 'Rebuts', icona: 'receipt', subtitol: 'Per a comprovar què ha llegit de veritat l’eixam', ruta: '/consola/pols/rebuts'
    });
    expect(rutaPanell('rebuts')).toBe('/consola/pols/rebuts');
    expect(IDS_PANELLS).toEqual(['carrega', 'rebuts', 'skills']);
    expect(panellsPols().map((p) => p.id)).toEqual(IDS_PANELLS);
    expect(panellPols('inexistent')).toBeNull();
  });
});
