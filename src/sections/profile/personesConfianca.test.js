// @vitest-environment node
/* IDEA-48 (estat previ a F7; pla 261101_1246, T7 · S6) · El model del bloc
   «Persones de confiança»: els estats per a 0, 1, 2, 3 i 5 contactes verificats,
   cap número inventat, els llindars iguals als de la recuperació (k = 3, de 3 a
   255; la recuperació s'importa només ací, mai al paquet) i les reserves iguals
   al valencià del diccionari. */
import { describe, expect, test } from 'vitest';
import { LLINDAR, MAX_AMICS, MIN_AMICS } from '../../data/xifratXatRecuperacio.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { ESTAT_CONFIANCA, LLINDAR_CONFIANCA, MAX_PERSONES_CONFIANCA, TEXTOS_CONFIANCA, estatPersonesConfianca } from './personesConfianca.js';

describe('estatPersonesConfianca', () => {
  test.each([
    [0, ESTAT_CONFIANCA.cap, 3],
    [1, ESTAT_CONFIANCA.falten, 2],
    [2, ESTAT_CONFIANCA.falten, 1],
    [3, ESTAT_CONFIANCA.aPunt, 0],
    [5, ESTAT_CONFIANCA.aPunt, 0]
  ])('%i verificats → %s, en falten %i', (verificats, estat, falten) => {
    expect(estatPersonesConfianca({ verificats })).toEqual({ estat, verificats, falten });
  });

  /* Gauntlet T7b-G08 · teRecuperacio (teCapacitat('recuperacioSocial'), avui sempre fals). */
  test.each([
    [0, ESTAT_CONFIANCA.cap, 3],
    [1, ESTAT_CONFIANCA.falten, 2],
    [2, ESTAT_CONFIANCA.falten, 1],
    [3, ESTAT_CONFIANCA.actiu, 0],
    [5, ESTAT_CONFIANCA.actiu, 0]
  ])('amb la recuperació activa, %i verificats → %s, en falten %i', (verificats, estat, falten) => {
    expect(estatPersonesConfianca({ verificats, teRecuperacio: true })).toEqual({ estat, verificats, falten });
  });

  test('només un true literal activa la recuperació', () => {
    for (const teRecuperacio of [false, undefined, null, 'true', 1, {}]) {
      expect(estatPersonesConfianca({ verificats: 4, teRecuperacio }).estat).toBe(ESTAT_CONFIANCA.aPunt);
    }
  });

  test('un recompte que no és un enter no negatiu compta com a cap', () => {
    for (const verificats of [undefined, null, -1, 2.5, '3', Number.NaN, Infinity]) {
      expect(estatPersonesConfianca({ verificats })).toEqual({ estat: 'cap', verificats: 0, falten: 3 });
    }
    expect(estatPersonesConfianca()).toEqual({ estat: 'cap', verificats: 0, falten: 3 });
  });
});

describe('els llindars i els textos', () => {
  test('els llindars són els de la recuperació social (DM-7: k = 3; n de 3 a 255)', () => {
    expect(LLINDAR_CONFIANCA).toBe(LLINDAR);
    expect(LLINDAR_CONFIANCA).toBe(MIN_AMICS);
    expect(MAX_PERSONES_CONFIANCA).toBe(MAX_AMICS);
  });

  test('onze claus de section.perfil.privacitat.confianca.*, amb la reserva igual al valencià i a les cinc llengües', () => {
    const parells = Object.values(TEXTOS_CONFIANCA);
    expect(parells).toHaveLength(11);
    const marcadors = (text) => (String(text).match(/\{\w+\}/g) || []).sort().join(',');
    for (const [clau, reserva] of parells) {
      expect(clau.startsWith('section.perfil.privacitat.confianca.')).toBe(true);
      expect(CA[clau], clau).toBe(reserva);
      for (const [codi, dic] of Object.entries({ es: ES, en: EN, eu: EU, gl: GL })) {
        expect(typeof dic[clau], `${codi} ${clau}`).toBe('string');
        expect(dic[clau], `${codi} ${clau}`).not.toBe(reserva);
        expect(marcadors(dic[clau]), `${codi} ${clau}`).toBe(marcadors(reserva));
      }
    }
  });
});
