// @vitest-environment node
/* R16-S (P0-79 / IDEA-210) · El catàleg sencer del selector de la fitxa i el
   nomenclàtor de l'INE (src/data/nomenclator/FONT.md): el JSON de veres,
   carregat amb l'import() del mòdul, cercat com ho fa IdentitatAlPoble. */
import { describe, expect, test } from 'vitest';
import { carregaNomenclatorIne, cercaMunicipisIne, nomsAmbMunicipisIne, nomsCatalegCompletDePobles } from './nomenclatorIne.js';
import { MUNICIPIS_DE_REFERENCIA } from './aliesDePoblesSeed.js';
import { MOCK_TOWNS } from './townsSeed.js';

const clau = (text) => String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

describe('nomsCatalegCompletDePobles', () => {
  test('els pobles vius, la llavor i els municipis de referència, sense repetits i en ordre', () => {
    const vius = [{ id: 'x-1', title: 'Poble de Prova' }, { id: 'x-2', title: MOCK_TOWNS[0].title.toUpperCase() }, null, 'cadena'];
    const noms = nomsCatalegCompletDePobles(vius);
    expect(noms).toContain('Poble de Prova');
    for (const poble of [...MOCK_TOWNS, ...MUNICIPIS_DE_REFERENCIA]) {
      expect(noms.some((nom) => clau(nom) === clau(poble.title))).toBe(true);
    }
    expect(new Set(noms.map(clau)).size).toBe(noms.length);
    expect([...noms].sort((a, b) => a.localeCompare(b, 'ca'))).toEqual(noms);
    expect(Object.isFrozen(noms)).toBe(true);
  });

  test('sense pobles vius, la llavor i les referències', () => {
    expect(nomsCatalegCompletDePobles(undefined)).toEqual(nomsCatalegCompletDePobles([]));
    expect(nomsCatalegCompletDePobles([]).length).toBeGreaterThanOrEqual(MOCK_TOWNS.length);
  });
});

describe('el nomenclàtor de l’INE', () => {
  test('8.132 municipis, cada un amb el seu codi i un valor que no compartix amb cap altre', async () => {
    const { total, municipis } = await carregaNomenclatorIne();
    expect(total).toBe(8132);
    expect(new Set(municipis.map((m) => m.ine)).size).toBe(8132);
    expect(new Set(municipis.map((m) => m.valor)).size).toBe(8132);
    expect(municipis.every((m) => /^\d{5}$/.test(m.ine) && m.provincia)).toBe(true);
    // La mateixa promesa per a totes les crides.
    expect(carregaNomenclatorIne()).toBe(carregaNomenclatorIne());
  });

  test('un homònim porta la província al valor; un nom únic, no', async () => {
    const sada = await cercaMunicipisIne('sada');
    const valors = sada.filter((m) => m.nom === 'Sada').map((m) => m.valor).sort();
    expect(valors).toEqual(['Sada (A Coruña)', 'Sada (Navarra)']);
    const [busot] = await cercaMunicipisIne('Busot');
    expect(busot).toMatchObject({ valor: 'Busot', ine: '03046', provincia: 'Alicante/Alacant' });
  });

  test('sense accents ni majúscules, per l’altra forma oficial i primer els que hi comencen', async () => {
    expect((await cercaMunicipisIne('PENAGUILA')).map((m) => m.valor)).toContain('Penàguila');
    expect((await cercaMunicipisIne('Torremanzanas')).map((m) => m.valor)).toEqual(['La Torre de les Maçanes']);
    const comencen = (await cercaMunicipisIne('torre', { limit: 500 })).map((m) => clau(m.nom).startsWith('torre'));
    expect(comencen.includes(true) && comencen.includes(false)).toBe(true);
    expect(comencen).toEqual([...comencen].sort((a, b) => Number(b) - Number(a)));
  });

  test('com a molt 50 per defecte, o el límit que es demane; buida, cap', async () => {
    expect(await cercaMunicipisIne('a')).toHaveLength(50);
    expect(await cercaMunicipisIne('a', { limit: 3 })).toHaveLength(3);
    expect(await cercaMunicipisIne('   ')).toEqual([]);
    expect(await cercaMunicipisIne(null)).toEqual([]);
    expect(await cercaMunicipisIne('zzzzqqq')).toEqual([]);
  });

  test('nomsAmbMunicipisIne: el catàleg i els valors trobats, sense repetir el que ja hi és', async () => {
    const trobats = (await cercaMunicipisIne('sada')).filter((m) => m.nom === 'Sada');
    const noms = nomsAmbMunicipisIne(['Busot', 'busot', ' Sella '], [...trobats, { valor: 'BUSOT' }, null]);
    expect(noms).toEqual(['Busot', 'Sada (A Coruña)', 'Sada (Navarra)', 'Sella']);
    expect(nomsAmbMunicipisIne(undefined, undefined)).toEqual([]);
  });

  /* R16a · El nom oficial de l'INE d'un poble que el catàleg diu en valencià no el repetix; un àlies
     que només val amb majúscula en un relat («Muro») no amaga l'altre municipi que es diu així. */
  test('nomsAmbMunicipisIne: el nom oficial que el catàleg porta com a àlies no repetix el poble', async () => {
    const trobats = await cercaMunicipisIne('muro');
    expect(trobats.map((m) => m.valor)).toEqual(expect.arrayContaining(['Muro', 'Muro de Alcoy']));
    const noms = nomsAmbMunicipisIne(["Muro d'Alcoi"], trobats);
    expect(noms).toContain("Muro d'Alcoi");
    expect(noms).toContain('Muro');
    expect(noms).not.toContain('Muro de Alcoy');
    /* Sense el poble al catàleg, el municipi de l'INE es pot triar. */
    expect(nomsAmbMunicipisIne(['Sella'], trobats)).toContain('Muro de Alcoy');
  });
});
