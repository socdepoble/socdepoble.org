/* Gauntlet 261017 (F29–F34) · Les famílies del selector d'emojis sobre el
   catàleg de veres: l'ordre i els noms curts del requeriment (amb Persones
   just després de Cares), fora Components, cap emoji perdut ni copiat, i els
   grups que la taula no coneix passen tal qual darrere dels coneguts. */
import { describe, expect, test } from 'vitest';
import { GRUPS_EMOJIS, TOTAL_EMOJIS } from '../disseny/cataleg/dades/emojisUnicode18.js';
import { familiesDelSelector } from './familiesEmojis.js';

const ORDRE = ['Cares', 'Persones', 'Animals', 'Menjar', 'Activitats', 'Viatges', 'Objectes', 'Símbols', 'Banderes'];
const ORIGEN = Object.freeze({
  Cares: 'cares-emocions', Persones: 'persones-cos', Animals: 'animals-natura', Menjar: 'menjar-beguda',
  Activitats: 'activitats', Viatges: 'viatges-llocs', Objectes: 'objectes', Símbols: 'simbols', Banderes: 'banderes'
});
const grupDelCataleg = (id) => GRUPS_EMOJIS.find((grup) => grup.id === id);

describe('familiesDelSelector, amb el catàleg de veres', () => {
  const families = familiesDelSelector(GRUPS_EMOJIS);

  test('nou famílies, en l’ordre i amb els noms del requeriment (Activitats abans de Viatges)', () => {
    expect(families.map((familia) => familia.nom)).toEqual(ORDRE);
    expect(families.map((familia) => familia.id)).toEqual(ORDRE.map((nom) => ORIGEN[nom]));
  });

  test('fora Components; la resta, sencera: 3972 − 9 emojis, cada família amb els del seu grup', () => {
    expect(families.some((familia) => familia.id === 'components')).toBe(false);
    const components = grupDelCataleg('components').emojis.length;
    expect(components).toBe(9);
    expect(families.reduce((suma, familia) => suma + familia.emojis.length, 0)).toBe(TOTAL_EMOJIS - components);
    expect(TOTAL_EMOJIS - components).toBe(3963);
    expect(Object.fromEntries(families.map((familia) => [familia.nom, familia.emojis.length]))).toEqual({
      Cares: 172, Persones: 2430, Animals: 161, Menjar: 132, Activitats: 85, Viatges: 221, Objectes: 268, Símbols: 224, Banderes: 270
    });
  });

  test('res es copia ni es toca: els mateixos emojis, el catàleg intacte i el resultat congelat', () => {
    for (const familia of families) expect(familia.emojis).toBe(grupDelCataleg(familia.id).emojis);
    expect(GRUPS_EMOJIS.map((grup) => grup.nom)).toContain('Cares i emocions');
    expect(GRUPS_EMOJIS).toHaveLength(10);
    expect(Object.isFrozen(families)).toBe(true);
    expect(families.every((familia) => Object.isFrozen(familia))).toBe(true);
  });
});

describe('familiesDelSelector, amb dades sintètiques', () => {
  test('un grup desconegut passa tal qual (el mateix objecte), darrere dels coneguts i en el seu ordre', () => {
    const natura = { id: 'natura', nom: 'Animals i natura', emojis: [['1F33F', '🌿', 'herb']] };
    const menjar = { id: 'menjar', nom: 'Menjar i beguda', emojis: [['1F345', '🍅', 'tomato']] };
    const banderes = { id: 'banderes', nom: 'Banderes', emojis: [['1F3C1', '🏁', 'chequered flag']] };
    const components = { id: 'components', nom: 'Components', emojis: [['1F3FB', '🏻', 'light skin tone']] };
    const cares = { id: 'cares-emocions', nom: 'Cares i emocions', emojis: [['1F600', '😀', 'grinning face']] };
    const resultat = familiesDelSelector([natura, banderes, components, menjar, cares]);
    expect(resultat.map((familia) => familia.id)).toEqual(['cares-emocions', 'banderes', 'natura', 'menjar']);
    expect(resultat.map((familia) => familia.nom)).toEqual(['Cares', 'Banderes', 'Animals i natura', 'Menjar i beguda']);
    expect(resultat[2]).toBe(natura);
    expect(resultat[3]).toBe(menjar);
    // L'original no canvia de nom.
    expect(cares.nom).toBe('Cares i emocions');
  });

  test('només grups desconeguts (les proves del Bloc): l’ordre de sempre', () => {
    const grups = [{ id: 'menjar', nom: 'Menjar i beguda', emojis: [] }, { id: 'natura', nom: 'Animals i natura', emojis: [] }];
    expect(familiesDelSelector(grups)).toEqual(grups);
  });

  test('sense llista, null (la graella ho tracta com un error que es pot reintentar)', () => {
    expect(familiesDelSelector(undefined)).toBeNull();
    expect(familiesDelSelector({})).toBeNull();
    expect(familiesDelSelector([])).toEqual([]);
  });
});
