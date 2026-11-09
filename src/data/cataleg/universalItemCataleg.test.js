// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { universalItemCataleg as compatible } from './universalItemCataleg.js';
import { TIPUS_ITEM_CATALEG, universalItemCataleg } from '../../utils/productes/producteUniversal.js';

const font = Object.freeze({ document: 'Font sintètica de prova', sha256: 'a'.repeat(64) });
const item = (tipus) => ({ id: 'referencia-1', tipus, nom: '  Nom literal  ', font, dades: { notes: ['Nota literal'] } });

describe('una sola forma comuna a producteUniversal', () => {
  test('la ruta R14 reexporta la mateixa funció, sense segon model', () => {
    expect(compatible).toBe(universalItemCataleg);
    expect(TIPUS_ITEM_CATALEG).toEqual(['producte', 'recepta', 'llavor', 'planta', 'article']);
  });
  test.each(TIPUS_ITEM_CATALEG)('%s conserva identitat, font i dades sense inventar preu o al·lèrgens', (tipus) => {
    const entrada = item(tipus), resultat = universalItemCataleg(entrada);
    expect(resultat).toMatchObject({ id: entrada.id, tipus, nom: 'Nom literal', font, dades: entrada.dades, connexions: [] });
    expect(resultat.dades.notes).toEqual(['Nota literal']);
    expect(resultat).not.toHaveProperty('preuCents');
    expect(resultat).not.toHaveProperty('alergens');
    expect(Object.isFrozen(resultat)).toBe(true);
    expect(entrada.nom).toBe('  Nom literal  ');
  });
  test('una relació candidata amb un article no es promociona a confirmada', () => {
    const resultat = universalItemCataleg({ ...item('planta'), connexions: [{ id: 'article-1', tipus: 'article', estat: 'candidat' }] });
    expect(resultat.connexions[0]).toEqual({ id: 'article-1', tipus: 'article', estat: 'candidat', motiu: '' });
  });
  test.each([
    { ...item('inexistent') },
    { ...item('recepta'), font: { document: 'Sense empremta' } },
    { ...item('recepta'), font: { ...font, sha256: [font.sha256] } },
    { ...item('recepta'), font: { ...font, document: '   ' } },
    { ...item('planta'), connexions: [{ id: 'article-1', tipus: 'article', estat: 'aprovat' }] }
  ])('refusa tipus, procedència o estat no acreditats', (entrada) => {
    expect(() => universalItemCataleg(entrada)).toThrow(TypeError);
  });
});
