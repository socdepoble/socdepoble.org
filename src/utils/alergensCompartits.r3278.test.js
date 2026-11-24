// @vitest-environment node
import { describe, expect, test } from 'vitest';
import * as matriuPublica from '../data/menjarIBeure/allergens.js';
import * as comercialPublic from '../data/menjarIBeure/alergensMercatBotiga.js';
import * as matriuPura from './alergens.js';
import * as comercialPur from './alergensComercials.js';
import { ALERGENS, NOMS_ALERGENS } from './productes/producteUniversal.js';

const identiques = (publica, pura) => {
  expect(Object.keys(publica).sort()).toEqual(Object.keys(pura).sort());
  for (const nom of Object.keys(publica)) expect(publica[nom], nom).toBe(pura[nom]);
};

describe('R32.78 · un sol domini compartit d’al·lèrgens', () => {
  test('les dues façanes públiques reexporten els mateixos objectes i funcions', () => {
    identiques(matriuPublica, matriuPura);
    identiques(comercialPublic, comercialPur);
    expect(matriuPura.ALERGENS).toBe(ALERGENS);
    expect(matriuPura.NOMS_ALERGENS).toBe(NOMS_ALERGENS);
    expect(Object.isFrozen(ALERGENS)).toBe(true);
    expect(Object.isFrozen(NOMS_ALERGENS)).toBe(true);
  });

  test('la fila comercial no acredita declaracions ni l’origen pel seu contingut', () => {
    const fila = ['oli-prova', 'Oli', 'olis', 'Marca', 'Botella', 1, 'l', 495];
    const abans = [...fila];
    const producte = comercialPur.producteBotigaAmbAlergens(fila);
    expect(producte.acreditatPerAlConsum).toBe(false);
    expect(producte.procedenciaAlergens.origenVerificat).toBe(false);
    expect(producte.fontAlergens).toBeNull();
    for (const camp of ['alergens', 'tracesAlergens', 'alergensAbsents']) {
      expect(producte[camp]).toEqual([]);
      expect(Object.isFrozen(producte[camp])).toBe(true);
    }
    expect(Object.values(comercialPur.matriuProducteBotiga(fila))).toEqual(ALERGENS.map(() => ({ estat: 'desconegut', simbol: '?', font: null })));
    expect(fila).toEqual(abans);
  });

  test('les declaracions explícites mantenen la procedència i l’agregació conservadora', () => {
    const matriu = matriuPura.matriuDeProducte({ alergens: ['llet'], tracesAlergens: ['gluten'], alergensAbsents: ['ous'], fontAlergens: 'Fitxa de prova' });
    expect(matriu.llet).toEqual({ estat: 'ingredient', simbol: '•', font: 'Fitxa de prova' });
    expect(matriu.gluten.estat).toBe('traca');
    expect(matriu.ous.estat).toBe('absent');
    expect(matriuPura.agregaMatrius([matriu, matriuPura.matriuAlergens()], true).ous.estat).toBe('desconegut');
  });
});
