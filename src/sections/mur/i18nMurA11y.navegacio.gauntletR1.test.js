// @vitest-environment node
/* v1.2.19 · Gauntlet R1 (L5-08) · Les píndoles «Mercat» i «Mapa» del Mur es
   diuen, en cada llengua, igual que la secció a la navegació (nav.mercat i
   nav.mapa dels diccionaris de la interfície). En basc, «Merkatua», no «Azoka».
   Els diccionaris d'idioma s'importen només ací, a la prova: el Mur no en
   carrega cap de nou. */
import { describe, expect, test } from 'vitest';
import ca from '../../config/idiomes/ca.js';
import en from '../../config/idiomes/en.js';
import es from '../../config/idiomes/es.js';
import eu from '../../config/idiomes/eu.js';
import gl from '../../config/idiomes/gl.js';
import { textosMurA11y } from './i18nMurA11y.js';

const DICCIONARIS = Object.freeze({ ca, es, en, eu, gl });

describe('v1.2.19 · Gauntlet R1 (L5-08) · filtres del Mur = rètols de la navegació', () => {
  test.each(Object.keys(DICCIONARIS))('%s: filtreMercat és nav.mercat i filtreMapa és nav.mapa', (codi) => {
    const tx = textosMurA11y(codi);
    expect(tx.filtreMercat).toBe(DICCIONARIS[codi]['nav.mercat']);
    expect(tx.filtreMapa).toBe(DICCIONARIS[codi]['nav.mapa']);
  });

  test('eu: «Merkatua» i ca intacte com en la v1.2.18', () => {
    expect(textosMurA11y('eu').filtreMercat).toBe('Merkatua');
    expect(textosMurA11y('ca').filtreMercat).toBe('Mercat');
  });
});
