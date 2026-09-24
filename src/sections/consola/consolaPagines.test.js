import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from '../text/pageContent.js';
import {
  IDS_PAGINES, RUTA_CONSOLA, paginaConsola, paginesConsola, resumPagina, segmentPagina
} from './consolaPagines.js';

describe('catàleg de pàgines de la Consola', () => {
  test('sis pàgines, cadascuna amb ruta pròpia i copy de PAGE_COPY', () => {
    expect(IDS_PAGINES).toHaveLength(6);
    const pagines = paginesConsola();
    expect(pagines.map((p) => p.ruta)).toEqual(IDS_PAGINES.map((id) => `${RUTA_CONSOLA}/${id}`));
    for (const p of pagines) {
      const copy = PAGE_COPY.consola.pagines.find((c) => c.id === p.id);
      expect(copy, `falta el copy de ${p.id}`).toBeTruthy();
      expect(p.title).toBe(copy.title);
      expect(p.lead.length).toBeGreaterThan(20);
    }
  });

  test('una pàgina desconeguda no existix', () => {
    expect(paginaConsola('pestanyes')).toBeNull();
  });
});

describe('segmentPagina', () => {
  test.each([
    [undefined, ''], ['', ''], ['/', ''], ['calendari', 'calendari'], ['/calendari/', 'calendari'],
    ['desconeguda', null], ['calendari/extra', null]
  ])('%s → %s', (comodi, esperat) => {
    expect(segmentPagina(comodi)).toBe(esperat);
  });
});

describe('resumPagina', () => {
  const mapa = {
    nodes: [{ tipus: 'skill' }, { tipus: 'skill' }, { tipus: 'ruta' }, { tipus: 'script' }],
    arestes: [{}, {}, {}],
    tasques: [{ estat: 'viu' }, { estat: 'mort' }, { estat: 'desconegut' }],
    avisos: [{ severitat: 'alta' }, { severitat: 'baixa' }],
    salut: [{}, {}]
  };
  const ambMapa = { mapa, estatMapa: 'ready' };

  test('resumix dades reals del Mapa', () => {
    expect(resumPagina('explorador', ambMapa)).toBe('4 nodes · 3 arestes');
    expect(resumPagina('calendari', ambMapa)).toBe('3 tasques · 1 vives · 1 mortes');
    expect(resumPagina('inventari', ambMapa)).toBe('2 skills al Mapa');
    expect(resumPagina('entrades', ambMapa)).toBe('2 skills · 1 rutes documentals');
    expect(resumPagina('salut', ambMapa)).toBe('2 avisos (1 alts) · 2 mètriques');
  });

  test('sense Mapa diu per què, mai una xifra', () => {
    expect(resumPagina('explorador', { mapa: null, estatMapa: 'loading' })).toBe('Llegint el Mapa…');
    expect(resumPagina('salut', { mapa: null, estatMapa: 'error' })).toBe('No s’ha pogut llegir el Mapa');
    expect(resumPagina('calendari', { mapa: null, estatMapa: 'estrany' })).toBe('Mapa no disponible en este entorn');
  });

  test('el pols llig consola.json', () => {
    const dades = {
      consums: [{}, {}], rebuts: [{}],
      skills: [
        { alDisc: true, alManifest: true, core: true },
        { alDisc: true, alManifest: false, core: false }
      ]
    };
    expect(resumPagina('pols', { dades, estatDades: 'ready' })).toBe('2 registres de consum · 1 rebuts · 2 skills (1 orfes)');
    expect(resumPagina('pols', { dades: null, estatDades: 'absent' })).toBe('Dades no disponibles en este entorn');
  });
});
