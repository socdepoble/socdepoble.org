import { describe, expect, test } from 'vitest';
import { PAGE_COPY } from '../text/pageContent.js';
import {
  IDS_PAGINES, RUTA_CONSOLA, paginaConsola, paginesConsola, resumPagina, segmentPagina
} from './consolaPagines.js';

describe('catàleg de pàgines de la Consola', () => {
  test('nou pàgines en l’ordre de les pestanyes d’Emowe, cadascuna amb ruta pròpia', () => {
    expect(IDS_PAGINES).toEqual(['pols', 'explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut']);
    expect(paginesConsola().map((p) => p.ruta)).toEqual(IDS_PAGINES.map((id) => `${RUTA_CONSOLA}/${id}`));
  });

  test('cada pàgina té títol i entradeta; PAGE_COPY mana quan porta la pàgina', () => {
    for (const p of paginesConsola()) {
      expect(p.title, `falta el títol de ${p.id}`).not.toBe(p.id);
      expect(p.lead.length, `falta l'entradeta de ${p.id}`).toBeGreaterThan(20);
      const copy = PAGE_COPY.consola.pagines.find((c) => c.id === p.id);
      if (copy) expect(p.title).toBe(copy.title);
    }
  });

  test('una pàgina desconeguda no existix', () => {
    expect(paginaConsola('pestanyes')).toBeNull();
  });
});

describe('segmentPagina', () => {
  test.each([
    [undefined, ''], ['', ''], ['/', ''], ['calendari', 'calendari'], ['/calendari/', 'calendari'],
    ['actors', 'actors'], ['desconeguda', null], ['calendari/extra', null]
  ])('%s → %s', (comodi, esperat) => {
    expect(segmentPagina(comodi)).toBe(esperat);
  });
});

describe('resumPagina', () => {
  const mapa = {
    nodes: [
      { id: 'skill:a', tipus: 'skill' }, { id: 'skill:b', tipus: 'skill' }, { id: 'ruta:r', tipus: 'ruta' },
      { id: 'script:s', tipus: 'script' }, { id: 'agent:claude-code', tipus: 'agent', atributs: {} },
      { id: 'hook:claude:PreToolUse', tipus: 'hook', atributs: {} }
    ],
    arestes: [
      { de: 'skill:a', a: 'skill:b', tipus: 'crida', confianca: 'inferit' },
      { de: 'agent:claude-code', a: 'hook:claude:PreToolUse', tipus: 'dispara', confianca: 'declarat' },
      { de: 'ruta:r', a: 'skill:a', tipus: 'governa', confianca: 'declarat' }
    ],
    tasques: [{ id: 'v', estat: 'viu', llancador: { tipus: 'launchd' } }, { id: 'm', estat: 'mort' }, { id: 'd', estat: 'desconegut' }],
    avisos: [{ node: 'skill:a', severitat: 'alta' }, { node: 'skill:b', severitat: 'baixa' }],
    salut: [{}, {}]
  };
  const ambMapa = { mapa, estatMapa: 'ready' };

  test('resumix dades reals del Mapa', () => {
    expect(resumPagina('explorador', ambMapa)).toBe('6 nodes · 3 arestes');
    expect(resumPagina('calendari', ambMapa)).toBe('3 tasques · 1 vives · 1 mortes');
    expect(resumPagina('inventari', ambMapa)).toBe('2 skills al Mapa');
    expect(resumPagina('entrades', ambMapa)).toBe('2 skills · 1 rutes documentals');
    expect(resumPagina('salut', ambMapa)).toBe('2 avisos (1 alts) · 2 mètriques');
  });

  test('les vistes noves també resumixen dades, no promeses', () => {
    expect(resumPagina('fluxos', ambMapa)).toBe('0 cadenes declarades · 1 suggeriments de la prosa');
    expect(resumPagina('agents', ambMapa)).toBe('0 agents atòmics · 1 arnesos que conversen');
    expect(resumPagina('actors', ambMapa)).toBe('1 arnesos · 1 candats · 1 tasques programades');
  });

  test('sense Mapa diu per què, mai una xifra', () => {
    expect(resumPagina('explorador', { mapa: null, estatMapa: 'loading' })).toBe('Llegint el Mapa…');
    expect(resumPagina('salut', { mapa: null, estatMapa: 'error' })).toBe('No s’ha pogut llegir el Mapa');
    expect(resumPagina('calendari', { mapa: null, estatMapa: 'estrany' })).toBe('Mapa no disponible en este entorn');
    for (const id of ['fluxos', 'agents', 'actors']) {
      expect(resumPagina(id, { mapa: null, estatMapa: 'absent' })).toBe('Mapa no disponible en este entorn');
    }
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
