/* Onada 0.3 (Gauntlet 261016) · Les claus i18n noves de l'Arxiu visual (el
   visor, l'apartat «IAIA» i la Cronologia) i, des de l'Onada 261029_1605
   (IDEA-54/55), les del Gestor d'arxius locals (textosGestorLocal.js, amb el
   mapa de codis d'error): cada clau que crida el front té
   valor propi en les cinc llengües de SUPPORTED_LANGUAGES, una sola aparició
   per llengua al diccionari, i en valencià coincidix amb la reserva del codi
   (la guarda de paritat d'i18n.claus.test.js, sobre estes claus). */
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import { FONT_DELS_DICCIONARIS as fontI18n } from '../../../tests/helpers/diccionaris.js';
import fontSeccio from './MultimediaSection.jsx?raw';
import fontVisor from './VisorDeLArxiu.jsx?raw';
import fontPanell from './panellDeLaFoto.js?raw';
import fontTextosLocal from './textosGestorLocal.js?raw';
/* Bloc E (IDEA-55 + P1-71) · L'espai de treball de tres columnes. */
import fontTextosEspai from './textosEspaiMultimedia.js?raw';
import fontPagines from './PaginesEspaiMultimedia.jsx?raw';

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);
const FONT = `${fontSeccio}\n${fontVisor}\n${fontPanell}\n${fontTextosLocal}\n${fontTextosEspai}\n${fontPagines}`;
const NOVES = /^section\.multimedia\.(?:iaia|senseData|visor\.[\w]+|local(?:\.[\w]+)+|espai(?:\.[\w]+)+)$/;

/* Les crides del front: t('clau', 'reserva'), tr('clau', 'reserva') o el parell ['clau', 'reserva']. */
const CRIDES = [
  ...FONT.matchAll(/\b(?:t|tr)\(\s*'(section\.multimedia\.[\w.]+)',\s*'([^']*)'\s*\)/g),
  ...FONT.matchAll(/\[\s*'(section\.multimedia\.[\w.]+)',\s*'([^']*)'\s*\]/g)
].map(([, clau, reserva]) => [clau, reserva]).filter(([clau]) => NOVES.test(clau));

/* Noms propis i paraules que són iguals en alguna llengua. */
const IGUALS = Object.freeze({
  'section.multimedia.espai.ambRecompte': ['es', 'en', 'eu', 'gl'],
  /* Gauntlet 261029 (cicle 1, i18n) · «1 mes», «abril» i «octubre» s'escriuen igual. */
  'section.multimedia.espai.mesos.un': ['es', 'gl'],
  'section.multimedia.espai.mes.4': ['es', 'gl'],
  'section.multimedia.espai.mes.10': ['es'],
  'section.multimedia.espai.document': ['en'],
  'section.multimedia.espai.col.data': ['eu', 'gl'],
  'section.multimedia.espai.originalLocal': ['es'],
  'section.multimedia.espai.vistaCarpeta': ['es', 'gl'],
  'section.multimedia.visor.comentar': ['es', 'gl'],
  'section.multimedia.local.pestanya': ['es'],
  'section.multimedia.local.tipus.video': ['es', 'gl'],
  'section.multimedia.local.tipus.document': ['en'],
  'section.multimedia.local.insignia.publicada': ['es', 'gl'],
  'section.multimedia.local.insignia.duplicada': ['es', 'gl'],
  'section.multimedia.local.col.carpeta': ['es'],
  'section.multimedia.local.proposta.comarca': ['es', 'gl'],
  'section.multimedia.local.proposta.ambit.persona': ['es'],
  'section.multimedia.local.proposta.ambit.ia': ['es', 'gl'],
  'section.multimedia.local.ops.creaCarpeta': ['es']
});
const marcadors = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

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

  /* Gauntlet 261029 (cicle 1, IDEA-57) · Les claus de l'Arxiu visual d'abans del
     Bloc E (el selector de mode Galeria/Cronologia, «TOTS» i l'apartat «IAIA»)
     ja no les crida ningú: fora de les cinc llengües. */
  test('cap clau morta de l’Arxiu visual d’abans del Bloc E', () => {
    for (const clau of ['viewMode', 'gallery', 'timeline', 'all', 'iaia'].map((s) => `section.multimedia.${s}`)) {
      expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, 0]);
    }
  });

  test('la plantilla de la posició conserva {n} i {total} en totes les llengües', () => {
    for (const codi of LLENGUES) {
      const valor = createTranslator(codi)('section.multimedia.visor.posicio');
      expect([codi, valor.includes('{n}') && valor.includes('{total}')]).toEqual([codi, true]);
    }
  });

  /* IDEA-54/55 (Onada 261029_1605) · El Gestor d'arxius locals té més de dos
     centenars de claus: totes hi han de ser, i cada traducció conserva els
     mateixos marcadors {nom} que la reserva (si no, omple deixaria un forat). */
  test('Gestor d’arxius locals: les claus hi són i cada llengua conserva els marcadors de la reserva', () => {
    const locals = CRIDES.filter(([clau]) => clau.startsWith('section.multimedia.local.'));
    expect(new Set(locals.map(([clau]) => clau)).size).toBeGreaterThanOrEqual(250);
    for (const [clau, reserva] of locals) {
      for (const codi of LLENGUES) {
        expect([codi, clau, marcadors(createTranslator(codi)(clau))]).toEqual([codi, clau, marcadors(reserva)]);
      }
    }
  });

  /* Bloc E (IDEA-55 + P1-71) · L'espai de treball de tres columnes: les seues
     claus hi són i cada llengua conserva {nom}, {n}, {pes} i {total}. */
  test('espai de treball: les claus hi són i cada llengua conserva els marcadors de la reserva', () => {
    const espai = CRIDES.filter(([clau]) => clau.startsWith('section.multimedia.espai.'));
    expect(new Set(espai.map(([clau]) => clau)).size).toBeGreaterThanOrEqual(20);
    for (const [clau, reserva] of espai) {
      for (const codi of LLENGUES) {
        expect([codi, clau, marcadors(createTranslator(codi)(clau))]).toEqual([codi, clau, marcadors(reserva)]);
      }
    }
  });
});
