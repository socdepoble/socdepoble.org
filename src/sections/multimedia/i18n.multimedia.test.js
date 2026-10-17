/* Onada 0.3 (Gauntlet 261016) · Les claus i18n noves de l'Arxiu visual (el
   visor, l'apartat «IAIA» i la Cronologia): cada clau que crida el front té
   valor propi en les cinc llengües de SUPPORTED_LANGUAGES, una sola aparició
   per llengua al diccionari, i en valencià coincidix amb la reserva del codi
   (la guarda de paritat d'i18n.claus.test.js, sobre estes claus). */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import fontI18n from '../../config/i18n.js?raw';
import fontSeccio from './MultimediaSection.jsx?raw';
import fontVisor from './VisorDeLArxiu.jsx?raw';
import fontPanell from './panellDeLaFoto.js?raw';

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);
const FONT = `${fontSeccio}\n${fontVisor}\n${fontPanell}`;
const NOVES = /^section\.multimedia\.(?:iaia|senseData|visor\.[\w]+)$/;

/* Les crides del front: t('clau', 'reserva'), tr('clau', 'reserva') o el parell ['clau', 'reserva']. */
const CRIDES = [
  ...FONT.matchAll(/\b(?:t|tr)\(\s*'(section\.multimedia\.[\w.]+)',\s*'([^']*)'\s*\)/g),
  ...FONT.matchAll(/\[\s*'(section\.multimedia\.[\w.]+)',\s*'([^']*)'\s*\]/g)
].map(([, clau, reserva]) => [clau, reserva]).filter(([clau]) => NOVES.test(clau));

/* Noms propis i paraules que són iguals en alguna llengua. */
const IGUALS = Object.freeze({ 'section.multimedia.iaia': ['es', 'en', 'eu', 'gl'], 'section.multimedia.visor.comentar': ['es', 'gl'] });

describe('claus i18n de l’Arxiu visual', () => {
  test('el front en crida una trentena, cap repetida amb dues reserves', () => {
    const claus = [...new Set(CRIDES.map(([clau]) => clau))];
    expect(claus.length).toBeGreaterThanOrEqual(28);
    for (const clau of claus) expect(new Set(CRIDES.filter(([c]) => c === clau).map(([, r]) => r)).size, clau).toBe(1);
  });

  test('en valencià, cada clau és la reserva del codi; en cada llengua, un valor propi', () => {
    const ca = createTranslator('ca');
    for (const [clau, reserva] of CRIDES) {
      expect([clau, ca(clau)]).toEqual([clau, reserva]);
      for (const codi of LLENGUES) {
        const valor = createTranslator(codi)(clau);
        expect([codi, clau, valor === clau]).toEqual([codi, clau, false]);
        if (codi !== 'ca' && !(IGUALS[clau] || []).includes(codi)) expect([codi, clau, valor === reserva]).toEqual([codi, clau, false]);
      }
    }
  });

  test('una sola aparició per llengua al diccionari', () => {
    for (const clau of new Set(CRIDES.map(([c]) => c))) {
      expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, LLENGUES.length]);
    }
  });

  test('la plantilla de la posició conserva {n} i {total} en totes les llengües', () => {
    for (const codi of LLENGUES) {
      const valor = createTranslator(codi)('section.multimedia.visor.posicio');
      expect([codi, valor.includes('{n}') && valor.includes('{total}')]).toEqual([codi, true]);
    }
  });
});
