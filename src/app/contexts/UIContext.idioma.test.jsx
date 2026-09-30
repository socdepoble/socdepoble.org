/**
 * T1 · Idioma (decisió del Mestre, 260930).
 *
 *  · Precedència: tria explícita desada de l'usuari > `language` vàlida de
 *    l'amfitrió (només ca, es, en, eu, gl) > 'ca'. El lang del document de
 *    l'amfitrió ja no és cap font: un WordPress en-US no força l'anglés.
 *  · Només setLanguage escriu, amb càrrega versionada {v:2, codi} a la mateixa
 *    clau. El valor antic (text cru) s'esborra en llegir-lo.
 *  · La llengua és derivada: un canvi d'externalConfig.language després del
 *    muntatge (element.setLanguage de Sollutia) es veu sense reiniciar.
 *  · Dues instàncies a la mateixa pàgina se sincronitzen per sdp:language-changed.
 *
 * UIProvider real; l'emmagatzematge es toca només per storage.js (tractor L2).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { UIProvider, useUIActions, useUIState } from './UIContext.jsx';
import {
  LANGUAGE_STORAGE_KEY, desaIdiomaTriat, esLlenguaSuportada, llegeixIdiomaTriat, resolIdioma
} from '../../config/i18n.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

/* t('common.back') és diferent en cada llengua: diu quin diccionari hi ha. */
const TORNA = { ca: 'Torna', es: 'Volver', en: 'Back', eu: 'Itzuli', gl: 'Voltar' };

const sondes = {};

function Sonda({ nom = 'a' }) {
  const { language, t } = useUIState();
  const { setLanguage } = useUIActions();
  sondes[nom] = { setLanguage };
  return <p data-testid={`sonda-${nom}`} data-lang={language}>{t('common.back')}</p>;
}

const sonda = (nom = 'a') => screen.getByTestId(`sonda-${nom}`);
const llenguaDe = (nom = 'a') => sonda(nom).getAttribute('data-lang');

function munta(externalConfig, nom = 'a') {
  return render(<UIProvider externalConfig={externalConfig}><Sonda nom={nom} /></UIProvider>);
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
  for (const clau of Object.keys(sondes)) delete sondes[clau];
});

afterEach(() => {
  cleanup();
  delVal(LANGUAGE_STORAGE_KEY);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* ── Funcions pures d'i18n.js ────────────────────────────────────────── */

describe('i18n.js · funcions pures de la llengua', () => {
  test.each([
    ['ca', true], ['es', true], ['en', true], ['eu', true], ['gl', true],
    ['en-US', false], ['ES', false], ['fr', false], [42, false], ['', false], [null, false], [undefined, false], [['es'], false]
  ])('esLlenguaSuportada(%j) → %j', (codi, esperat) => {
    expect(esLlenguaSuportada(codi)).toBe(esperat);
  });

  test.each([
    [{}, 'ca'],
    [{ amfitrio: 'es' }, 'es'],
    [{ amfitrio: 'en-US' }, 'ca'],
    [{ amfitrio: 'fr' }, 'ca'],
    [{ amfitrio: 42 }, 'ca'],
    [{ amfitrio: '' }, 'ca'],
    [{ triat: 'eu', amfitrio: 'es' }, 'eu'],
    [{ triat: 'fr', amfitrio: 'es' }, 'es'],
    [{ triat: null, amfitrio: 'gl' }, 'gl']
  ])('resolIdioma(%j) → %s', (entrada, esperat) => {
    expect(resolIdioma(entrada)).toBe(esperat);
  });

  test('resolIdioma sense arguments torna el valencià', () => {
    expect(resolIdioma()).toBe('ca');
  });

  test('desaIdiomaTriat desa {v:2, codi} i rebutja un codi no suportat', () => {
    expect(desaIdiomaTriat('fr')).toBe(false);
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
    expect(desaIdiomaTriat('gl')).toBe(true);
    expect(getVal(LANGUAGE_STORAGE_KEY)).toEqual({ v: 2, codi: 'gl' });
    expect(llegeixIdiomaTriat()).toBe('gl');
  });

  test.each([
    ['text cru antic', 'en'],
    ['versió antiga', { v: 1, codi: 'es' }],
    ['codi no suportat', { v: 2, codi: 'fr' }],
    ['forma BCP47', { v: 2, codi: 'en-US' }],
    ['llista', ['es']]
  ])('llegeixIdiomaTriat · %s: torna null i esborra la clau', (_, valor) => {
    setVal(LANGUAGE_STORAGE_KEY, valor);
    expect(llegeixIdiomaTriat()).toBeNull();
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  test('llegeixIdiomaTriat sense res desat torna null', () => {
    expect(llegeixIdiomaTriat()).toBeNull();
  });
});

/* ── UIProvider real ─────────────────────────────────────────────────── */

describe('UIProvider · resolució de la llengua', () => {
  test('sense tria ni amfitrió és valencià encara que la pàgina diga lang="en-US" (WordPress)', () => {
    const arrelDocument = document.querySelector('html');
    const langOriginal = arrelDocument.getAttribute('lang');
    arrelDocument.setAttribute('lang', 'en-US');
    try {
      munta({});
      expect(llenguaDe()).toBe('ca');
      expect(sonda().textContent).toBe(TORNA.ca);
    } finally {
      if (langOriginal === null) arrelDocument.removeAttribute('lang');
      else arrelDocument.setAttribute('lang', langOriginal);
    }
  });

  test('muntar no escriu res a l’emmagatzematge, tampoc amb una llengua de l’amfitrió', () => {
    munta({});
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
    cleanup();
    munta({ language: 'es' });
    expect(llenguaDe()).toBe('es');
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  test('una language vàlida de l’amfitrió mana si l’usuari no ha triat', () => {
    munta({ language: 'es' });
    expect(llenguaDe()).toBe('es');
    expect(sonda().textContent).toBe(TORNA.es);
  });

  test.each([['en-US'], ['fr'], [42], ['']])('amfitrió language = %j: valencià', (valor) => {
    munta({ language: valor });
    expect(llenguaDe()).toBe('ca');
    expect(sonda().textContent).toBe(TORNA.ca);
  });

  test('la tria desada {v:2, codi:"eu"} guanya a l’amfitrió, també si l’amfitrió canvia després', () => {
    setVal(LANGUAGE_STORAGE_KEY, { v: 2, codi: 'eu' });
    const { rerender } = munta({ language: 'es' });
    expect(llenguaDe()).toBe('eu');
    expect(sonda().textContent).toBe(TORNA.eu);
    rerender(<UIProvider externalConfig={{ language: 'gl' }}><Sonda /></UIProvider>);
    expect(llenguaDe()).toBe('eu');
  });

  test('el valor antic cru ("en") s’ignora i s’esborra: valencià', () => {
    setVal(LANGUAGE_STORAGE_KEY, 'en');
    munta({});
    expect(llenguaDe()).toBe('ca');
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  test('canviar externalConfig.language després del muntatge (sense tria) actualitza language i t()', () => {
    const { rerender } = munta({ language: 'ca' });
    expect(llenguaDe()).toBe('ca');
    rerender(<UIProvider externalConfig={{ language: 'es' }}><Sonda /></UIProvider>);
    expect(llenguaDe()).toBe('es');
    expect(sonda().textContent).toBe(TORNA.es);
    expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
  });
});

describe('UIProvider · setLanguage', () => {
  test('setLanguage("gl") desa {v:2, codi:"gl"}, canvia t(), emet l’esdeveniment i crida el global de l’amfitrió', () => {
    const emesos = [];
    const escolta = (e) => emesos.push(e.detail);
    const globalAmfitrio = vi.fn();
    vi.stubGlobal('sdp_change_language', globalAmfitrio);
    window.addEventListener('sdp:language-changed', escolta);
    try {
      munta({ language: 'es' });
      act(() => sondes.a.setLanguage('gl'));
      expect(llenguaDe()).toBe('gl');
      expect(sonda().textContent).toBe(TORNA.gl);
      expect(getVal(LANGUAGE_STORAGE_KEY)).toEqual({ v: 2, codi: 'gl' });
      expect(emesos).toEqual([{ language: 'gl' }]);
      expect(globalAmfitrio).toHaveBeenCalledWith('gl');
    } finally {
      window.removeEventListener('sdp:language-changed', escolta);
    }
  });

  test('setLanguage amb un codi no suportat no fa res', () => {
    const emesos = [];
    const escolta = (e) => emesos.push(e.detail);
    window.addEventListener('sdp:language-changed', escolta);
    try {
      munta({});
      for (const codi of ['fr', 'en-US', '', 42, null]) act(() => sondes.a.setLanguage(codi));
      expect(llenguaDe()).toBe('ca');
      expect(getVal(LANGUAGE_STORAGE_KEY)).toBeNull();
      expect(emesos).toEqual([]);
    } finally {
      window.removeEventListener('sdp:language-changed', escolta);
    }
  });

  test('la tria sobreviu a un remuntatge (recàrrega) encara que l’amfitrió diga una altra llengua', () => {
    munta({ language: 'es' });
    act(() => sondes.a.setLanguage('en'));
    cleanup();
    munta({ language: 'es' });
    expect(llenguaDe()).toBe('en');
    expect(sonda().textContent).toBe(TORNA.en);
  });

  test('dues instàncies a la mateixa pàgina se sincronitzen, sense bucle', () => {
    const emesos = [];
    const escolta = (e) => emesos.push(e.detail);
    window.addEventListener('sdp:language-changed', escolta);
    try {
      render(
        <>
          <UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>
          <UIProvider externalConfig={{ language: 'es' }}><Sonda nom="b" /></UIProvider>
        </>
      );
      expect([llenguaDe('a'), llenguaDe('b')]).toEqual(['ca', 'es']);
      act(() => sondes.a.setLanguage('eu'));
      expect([llenguaDe('a'), llenguaDe('b')]).toEqual(['eu', 'eu']);
      expect(sonda('b').textContent).toBe(TORNA.eu);
      // Un sol esdeveniment: l'oient de l'altra instància no reemet.
      expect(emesos).toEqual([{ language: 'eu' }]);
      expect(getVal(LANGUAGE_STORAGE_KEY)).toEqual({ v: 2, codi: 'eu' });
    } finally {
      window.removeEventListener('sdp:language-changed', escolta);
    }
  });

  test('desmuntar retira l’oient de sdp:language-changed', () => {
    const afegits = vi.spyOn(window, 'addEventListener');
    const retirats = vi.spyOn(window, 'removeEventListener');
    const { unmount } = munta({});
    const oient = afegits.mock.calls.find(([tipus]) => tipus === 'sdp:language-changed')?.[1];
    expect(typeof oient).toBe('function');
    unmount();
    expect(retirats).toHaveBeenCalledWith('sdp:language-changed', oient);
  });
});
