// @vitest-environment node
/* Arbre Genealògic · el validador cronològic: només és contradicció el que és
   impossible fins i tot dins dels marges de precisió. */
import { describe, expect, test } from 'vitest';
import { ANY, complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { detectaContradiccions, estatEfectiu } from './cronologia.js';

const alertes = (c) => detectaContradiccions(c, { anyActual: ANY });
const tipus = (c) => alertes(c).map((a) => a.tipus);
const progenitor = (pare, fill, sexe = 'M') => complet([persona(1, { sexe, ...pare }), persona(2, fill)], [rel(10, 'progenitor', 1, 2)]);

describe('detectaContradiccions', () => {
  test('defunció abans del naixement', () => {
    const c = complet([persona(1, { naixement: '1908', defuncio: '1900' })]);
    expect(alertes(c)).toEqual([{ tipus: 'defuncio-abans-naixement', gravetat: 'contradiccio', personaId: uid(1), altraId: null, valors: { naixement: 1908, defuncio: 1900 } }]);
    expect(tipus(complet([persona(1, { naixement: '~1908', defuncio: '1905' })]))).toEqual([]);
  });

  test('progenitor massa jove (< 13 anys), amb el marge de la precisió', () => {
    expect(tipus(progenitor({ naixement: '1900' }, { naixement: '1910' }))).toEqual(['progenitor-massa-jove']);
    expect(tipus(progenitor({ naixement: '1900' }, { naixement: '1913' }))).toEqual([]);
    expect(tipus(progenitor({ naixement: '1900' }, { naixement: '1910?' }))).toEqual([]);
    expect(tipus(progenitor({ naixement: '~1900' }, { naixement: '1905' }))).toEqual(['progenitor-massa-jove']);
    expect(alertes(progenitor({ naixement: '1900' }, { naixement: '1910' }))[0]).toMatchObject({ personaId: uid(2), altraId: uid(1), valors: { diferencia: 10 } });
  });

  test('generació omesa (> 85) i mare massa gran (> 55) són avisos, no contradiccions', () => {
    const omesa = alertes(progenitor({ naixement: '1800' }, { naixement: '1900' }));
    expect(omesa.map((a) => [a.tipus, a.gravetat])).toEqual([['possible-generacio-omesa', 'avis']]);
    const mare = alertes(progenitor({ naixement: '1840' }, { naixement: '1900' }, 'F'));
    expect(mare.map((a) => [a.tipus, a.gravetat])).toEqual([['mare-massa-gran', 'avis']]);
    expect(tipus(progenitor({ naixement: '~1845' }, { naixement: '1900' }, 'F'))).toEqual([]);
  });

  test('naixement després de la mort del pare (+1 any) o de la mare', () => {
    expect(tipus(progenitor({ naixement: '1870', defuncio: '1900' }, { naixement: '1901' }))).toEqual([]);
    expect(tipus(progenitor({ naixement: '1870', defuncio: '1900' }, { naixement: '1902' }))).toEqual(['naixement-post-defuncio-pare']);
    expect(tipus(progenitor({ naixement: '1870', defuncio: '1900' }, { naixement: '1901' }, 'F'))).toEqual(['naixement-post-defuncio-mare']);
    expect(tipus(progenitor({ naixement: '1870', defuncio: '1900' }, { naixement: '1900' }, 'F'))).toEqual([]);
  });

  test('vida impossible (> 120 anys)', () => {
    expect(tipus(complet([persona(1, { naixement: '1800', defuncio: '1925' })]))).toEqual(['vida-impossible']);
    expect(tipus(complet([persona(1, { naixement: '1900', viva: 'si' })]))).toEqual(['vida-impossible']);
    expect(tipus(complet([persona(1, { naixement: '~1800', defuncio: '1925' })]))).toEqual([]);
  });

  test('més de dos progenitors i cicles', () => {
    const tres = complet([persona(1), persona(2), persona(3), persona(4)], [rel(10, 'progenitor', 1, 4), rel(11, 'progenitor', 2, 4), rel(12, 'progenitor', 3, 4)]);
    expect(alertes(tres)).toEqual([{ tipus: 'mes-de-dos-progenitors', gravetat: 'contradiccio', personaId: uid(4), altraId: null, valors: { nombre: 3 } }]);
    const cicle = complet([persona(1), persona(2), persona(3), persona(4)], [rel(10, 'progenitor', 1, 2), rel(11, 'progenitor', 2, 3), rel(12, 'progenitor', 3, 1), rel(13, 'progenitor', 3, 4)]);
    expect(alertes(cicle).map((a) => [a.tipus, a.personaId])).toEqual([['cicle', uid(1)], ['cicle', uid(2)], ['cicle', uid(3)]]);
  });

  test('una cadena molt llarga no esgota la pila', () => {
    const n = 5000;
    const persones = Array.from({ length: n }, (_, i) => persona(i + 1));
    const relacions = Array.from({ length: n - 1 }, (_, i) => rel(100000 + i, 'progenitor', i + 2, i + 1));
    expect(alertes(complet(persones, relacions))).toEqual([]);
  });

  test('determinista i estatEfectiu', () => {
    const c = complet([persona(1, { naixement: '1900', estat: 'confirmat' }), persona(2, { naixement: '1905' }), persona(3, { estat: 'aproximat' })], [rel(10, 'progenitor', 1, 2)]);
    const a = alertes(c);
    expect(alertes(c)).toEqual(a);
    expect(estatEfectiu(c.persones[0], a)).toBe('contradiccio');
    expect(estatEfectiu(c.persones[1], a)).toBe('contradiccio');
    expect(estatEfectiu(c.persones[2], a)).toBe('aproximat');
    expect(estatEfectiu(c.persones[0], [{ tipus: 'possible-generacio-omesa', gravetat: 'avis', personaId: uid(1), altraId: null }])).toBe('confirmat');
  });
});
