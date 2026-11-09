// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { ARTICLES_PRODUCTES, LIMITS, afig, articlePerNom, estatInicial } from './nucli/index.js';
import { afigIngredientsRecepta } from './trasllatRecepta.js';

describe('recepta → llista: lot explícit i atòmic', () => {
  test('cada nom es resol per separat; les quantitats i els textos desconeguts es conserven', () => {
    const abans = estatInicial();
    const resultat = afigIngredientsRecepta(abans, 'casa', [{ nom: 'Farina', especificacio: '2 kg' }, { nom: 'Sal', especificacio: '40 g' }, { nom: 'herba-sana del test', especificacio: '3 fulles' }]);
    expect(resultat.llistes[0].linies).toEqual([
      { articleId: 'farina', especificacio: '2 kg' }, { articleId: 'sal', especificacio: '40 g' },
      { articleId: articlePerNom(resultat, 'herba-sana del test').id, especificacio: '3 fulles' }
    ]);
    expect(new Set(resultat.llistes[0].linies.map((l) => l.articleId)).size).toBe(3);
    expect(abans.llistes[0].linies).toEqual([]);
  });

  test('conserva les notes d’un article ja comprable i el segon enviament és idempotent', () => {
    const abans = afig(estatInicial(), 'casa', 'sal', { especificacio: 'Un paquet per a casa' });
    const linies = [{ nom: 'Sal', especificacio: '40 g' }, { nom: 'Farina', especificacio: '2 kg' }];
    const resultat = afigIngredientsRecepta(abans, 'casa', linies);
    expect(resultat.llistes[0].linies[0]).toEqual({ articleId: 'sal', especificacio: 'Un paquet per a casa' });
    expect(afigIngredientsRecepta(resultat, 'casa', linies)).toBe(resultat);
  });

  test('un límit a mitjan lot rebutja tot el canvi i no deixa articles orfes', () => {
    let abans = estatInicial();
    for (const p of ARTICLES_PRODUCTES.slice(0, LIMITS.linies - 1)) abans = afig(abans, 'casa', p.id);
    const copia = JSON.stringify(abans);
    expect(() => afigIngredientsRecepta(abans, 'casa', [{ nom: 'Preparat propi A', especificacio: '1 u' }, { nom: 'Preparat propi B', especificacio: '2 u' }])).toThrow(/No hi ha espai/);
    expect(JSON.stringify(abans)).toBe(copia);
    expect(abans.propis).toEqual([]);
  });

  test('no retalla text ni sobreescriu quantitats quan el nom es repetix', () => {
    const abans = estatInicial();
    expect(() => afigIngredientsRecepta(abans, 'casa', [{ nom: 'x'.repeat(61), especificacio: '1 u' }])).toThrow();
    expect(() => afigIngredientsRecepta(abans, 'casa', [{ nom: 'Farina', especificacio: '' }])).toThrow();
    expect(() => afigIngredientsRecepta(abans, 'casa', [{ nom: 'Sal', especificacio: '1 g' }, { nom: 'sal', especificacio: '2 g' }])).toThrow(/mateix nom/);
    expect(abans.llistes[0].linies).toEqual([]);
  });
});
