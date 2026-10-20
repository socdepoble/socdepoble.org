/* T7 (P9) · seleccioUrl.js: llegir i escriure carpeta, element i secció,
   i els slugs estables de l'Índex. L'anada i tornada URL → estat → URL ha de
   tornar la mateixa URL. */
import { describe, expect, test } from 'vitest';
import {
  CLAUS_SELECCIO, LLARGARIA_SLUG, SLUG_SENSE_TEXT, escriuSeccio, escriuSeleccio, llegixSeccio,
  llegixSeleccio, rutaAmbConsulta, seccioDelFragment, slugDeSeccio, slugsDeSeccions
} from './seleccioUrl.js';

const NOTES = Object.freeze({ item: 'nota' });

describe('slugs de secció', () => {
  test('fets del text: minúscules, sense diacrítics i amb guions', () => {
    expect(slugDeSeccio('Introducció')).toBe('introduccio');
    expect(slugDeSeccio('  1. Què és «Pedra Seca»?  ')).toBe('1-que-es-pedra-seca');
    expect(slugDeSeccio('L’Ànima de la IAIA')).toBe('l-anima-de-la-iaia');
    expect(slugDeSeccio('Façana i Ñora')).toBe('facana-i-nora');
  });

  test('un encapçalament sense lletres ni xifres té el slug de reserva', () => {
    expect(slugDeSeccio('🌱 🌱')).toBe(SLUG_SENSE_TEXT);
    expect(slugDeSeccio('')).toBe(SLUG_SENSE_TEXT);
    expect(slugDeSeccio(null)).toBe(SLUG_SENSE_TEXT);
  });

  test('estables: el slug d’un slug és ell mateix', () => {
    for (const text of ['Introducció', 'Què és?', 'x'.repeat(200), 'Vincles']) {
      const slug = slugDeSeccio(text);
      expect(slugDeSeccio(slug)).toBe(slug);
      expect(slug.length).toBeLessThanOrEqual(LLARGARIA_SLUG);
    }
  });

  test('els repetits porten sufix en l’ordre del document', () => {
    expect(slugsDeSeccions(['Vincles', 'Notes', 'Vincles', 'vincles'])).toEqual(['vincles', 'notes', 'vincles-2', 'vincles-3']);
    expect(slugsDeSeccions(['Intro', 'Intro 2', 'Intro'])).toEqual(['intro', 'intro-2', 'intro-3']);
    expect(slugsDeSeccions()).toEqual([]);
  });

  test('un repetit llarg continua cabent i es pot tornar a llegir de la URL', () => {
    const [, segon] = slugsDeSeccions(['a'.repeat(200), 'a'.repeat(200)]);
    expect(segon.endsWith('-2')).toBe(true);
    expect(segon.length).toBeLessThanOrEqual(LLARGARIA_SLUG);
    expect(llegixSeccio(escriuSeccio('', segon))).toBe(segon);
  });
});

describe('llegir la selecció', () => {
  test('carpeta, element i secció; absent o buit val null', () => {
    expect(llegixSeleccio('carpeta=f-mur&item=doc&seccio=intro')).toEqual({ carpeta: 'f-mur', item: 'doc', seccio: 'intro' });
    expect(llegixSeleccio('carpeta=&item=')).toEqual({ carpeta: null, item: null, seccio: null });
    expect(llegixSeleccio(null)).toEqual({ carpeta: null, item: null, seccio: null });
    expect(llegixSeleccio(new URLSearchParams('nota=n1'), NOTES)).toEqual({ carpeta: null, item: 'n1', seccio: null });
  });

  test('la secció escrita a mà es normalitza com un slug', () => {
    expect(llegixSeccio('seccio=Introducci%C3%B3')).toBe('introduccio');
    expect(llegixSeccio('seccio=%F0%9F%8C%B1')).toBeNull();
    expect(llegixSeccio('apartat=intro', 'apartat')).toBe('intro');
  });
});

describe('escriure la selecció', () => {
  test('undefined no toca, null esborra, un valor escriu; la resta de paràmetres es conserva', () => {
    const p = new URLSearchParams('mode=desa&nota=n1');
    expect(escriuSeleccio(p, { carpeta: 'f-mur' }, NOTES).toString()).toBe('mode=desa&nota=n1&carpeta=f-mur');
    expect(escriuSeleccio(p, { item: null }, NOTES).toString()).toBe('mode=desa');
    expect(escriuSeleccio(p, {}, NOTES).toString()).toBe('mode=desa&nota=n1');
    /* No muta l'entrada. */
    expect(p.toString()).toBe('mode=desa&nota=n1');
  });

  test('una clau que ja hi era conserva la seua posició: sense canvis, la mateixa cadena', () => {
    const p = new URLSearchParams('nota=n1&carpeta=f-mur&seccio=intro');
    expect(escriuSeleccio(p, { carpeta: 'f-mur', item: 'n1' }, NOTES).toString()).toBe(p.toString());
    expect(escriuSeleccio(p, { carpeta: 'f-mercat', item: 'n1' }, NOTES).toString()).toBe('nota=n1&carpeta=f-mercat&seccio=intro');
  });

  test('canviar d’element oblida la secció de l’anterior, si no se n’escriu una de nova', () => {
    const p = 'carpeta=f-mur&nota=n1&seccio=intro';
    expect(llegixSeleccio(escriuSeleccio(p, { item: 'n2' }, NOTES), NOTES)).toEqual({ carpeta: 'f-mur', item: 'n2', seccio: null });
    expect(llegixSeleccio(escriuSeleccio(p, { item: 'n2', seccio: 'Vincles' }, NOTES), NOTES).seccio).toBe('vincles');
    expect(llegixSeleccio(escriuSeleccio(p, { item: 'n1' }, NOTES), NOTES).seccio).toBe('intro');
    expect(llegixSeleccio(escriuSeleccio(p, { carpeta: 'f-mercat' }, NOTES), NOTES).seccio).toBe('intro');
  });

  test('escriuSeccio escriu o esborra només la secció', () => {
    expect(escriuSeccio('item=doc', 'intro').toString()).toBe('item=doc&seccio=intro');
    expect(escriuSeccio('item=doc&seccio=intro', null).toString()).toBe('item=doc');
    expect(escriuSeccio('item=doc', 'intro', 'apartat').toString()).toBe('item=doc&apartat=intro');
  });

  test('rutaAmbConsulta: camí sol si no hi ha consulta', () => {
    expect(rutaAmbConsulta('/notes', '')).toBe('/notes');
    expect(rutaAmbConsulta('/notes', new URLSearchParams('nota=n1'))).toBe('/notes?nota=n1');
  });
});

describe('anada i tornada URL → estat → URL', () => {
  test.each([
    ['carpeta=f-mur&nota=n1', NOTES],
    ['carpeta=f-mur&nota=n1&seccio=vincles-2', NOTES],
    ['carpeta=__all__&item=doc', undefined],
    ['item=doc&carpeta=wiki&seccio=que-es', undefined],
    ['nota=n1', NOTES]
  ])('%s', (url, claus) => {
    const estat = llegixSeleccio(url, claus);
    const tornada = escriuSeleccio('', estat, claus);
    expect(llegixSeleccio(tornada, claus)).toEqual(estat);
    expect(escriuSeleccio(url, estat, claus).toString()).toBe(new URLSearchParams(url).toString());
  });

  test('les claus per defecte són les del contracte', () => {
    expect(CLAUS_SELECCIO).toEqual({ carpeta: 'carpeta', item: 'item', seccio: 'seccio' });
    expect(Object.isFrozen(CLAUS_SELECCIO)).toBe(true);
  });
});

/* Fase D (261020, tasca 3.2) · /legal#esborra-compte: el fragment del document
   com a secció, només si són paraules i guions. */
describe('seccioDelFragment', () => {
  test('un fragment de paraules i guions és una secció, normalitzada com un slug', () => {
    expect(seccioDelFragment('#esborra-compte')).toBe('esborra-compte');
    expect(seccioDelFragment('esborra-compte')).toBe('esborra-compte');
    expect(seccioDelFragment('#16-els-teus-drets')).toBe('16-els-teus-drets');
    expect(seccioDelFragment('#Esborra-Compte')).toBe('esborra-compte');
    expect(seccioDelFragment('#pl%C3%A0tan')).toBe('platan');
  });

  test('null per a res, per a fragments de paràmetres, mal codificats, amb guions dobles o massa llargs', () => {
    for (const dolent of [undefined, null, '', '#', '#access_token=a&refresh_token=b', '#sdp-ruta=%2Fxat', '#%E0%A4%A',
      '#a--b', '#-a', '#a-', '#a b', '#a%20b', `#${'a'.repeat(LLARGARIA_SLUG + 1)}`, `#${'%C3%A0'.repeat(LLARGARIA_SLUG)}`]) {
      expect(seccioDelFragment(dolent), String(dolent)).toBeNull();
    }
    expect(seccioDelFragment(`#${'a'.repeat(LLARGARIA_SLUG)}`)).toBe('a'.repeat(LLARGARIA_SLUG));
  });
});
