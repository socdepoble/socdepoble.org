/**
 * Fase D (261020, tasca 4.1) · L1 · UIProvider amb diccionaris sota demanda.
 *  · Una llengua demanada sense diccionari pinta el valencià a l'acte (cap
 *    cadena buida, cap clau crua): language és la demanada i llenguaDelText,
 *    el valencià. Quan el diccionari arriba, t(), locale i llenguaDelText canvien.
 *  · Triar en i de seguida gl no pinta mai l'anglés després de la tria del
 *    gallec, arribe primer el tros que arribe.
 *  · Un tros que no arriba deixa el text en valencià i en queda rastre a
 *    autocuracio (tipus 'tros', on 'idioma-<codi>').
 * Este fitxer NO importa tests/helpers/diccionaris.js (vegeu i18n.diferit.test.js).
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { UIProvider, useUIActions, useUIState } from './UIContext.jsx';
import { LANGUAGE_STORAGE_KEY, carregaDiccionari } from '../../config/i18n.js';
import { delVal } from '../../config/storage.js';
import { _reiniciaAutocuracio, incidents } from '../../utils/autocuracio.js';

/* El tros del basc es perd: l'import() literal d'i18n.js rebutja. */
vi.mock('../../config/idiomes/eu.js', () => { throw new Error('tros perdut'); });

const pintats = [];
let accions = null;

function Sonda() {
  const { language, llenguaDelText, locale, t } = useUIState();
  accions = useUIActions();
  const text = t('common.back');
  pintats.push({ language, llenguaDelText, text });
  return <p data-testid="sonda" data-lang={language} data-text={llenguaDelText} data-locale={locale}>{text}</p>;
}

const sonda = () => screen.getByTestId('sonda');
const atributs = () => ['data-lang', 'data-text', 'data-locale'].map((nom) => sonda().getAttribute(nom));

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
  pintats.length = 0;
  _reiniciaAutocuracio();
});

afterEach(() => {
  cleanup();
  delVal(LANGUAGE_STORAGE_KEY);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('UIProvider · L1', () => {
  test('amfitrió en castellà sense diccionari: valencià a l’acte, castellà quan arriba; lang i locale seguixen el text', async () => {
    render(<UIProvider externalConfig={{ language: 'es' }}><Sonda /></UIProvider>);
    expect(pintats[0]).toEqual({ language: 'es', llenguaDelText: 'ca', text: 'Torna' });
    expect(sonda().getAttribute('data-locale')).toBe('ca-ES');
    await act(async () => { await carregaDiccionari('es'); });
    expect(sonda().textContent).toBe('Volver');
    expect(atributs()).toEqual(['es', 'es', 'es-ES']);
    expect(pintats.every((p) => p.text.length > 0 && p.text !== 'common.back')).toBe(true);
  });

  test('triar en i de seguida gl: després de la tria del gallec no es pinta mai l’anglés', async () => {
    render(<UIProvider externalConfig={{}}><Sonda /></UIProvider>);
    act(() => { accions.setLanguage('en'); accions.setLanguage('gl'); });
    const desDeLaTria = pintats.length;
    expect(sonda().getAttribute('data-lang')).toBe('gl');
    await act(async () => { await carregaDiccionari('en'); });
    /* Els dos trossos són en vol a la vegada: el gallec pot haver arribat ja. */
    expect(['Torna', 'Voltar']).toContain(sonda().textContent);
    await act(async () => { await carregaDiccionari('gl'); });
    expect(sonda().textContent).toBe('Voltar');
    expect(atributs()).toEqual(['gl', 'gl', 'gl-ES']);
    expect(pintats.slice(desDeLaTria).map((p) => p.text).filter((text) => text === 'Back')).toEqual([]);
  });

  test('un tros que no arriba: el text continua en valencià i en queda rastre a autocuracio', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<UIProvider externalConfig={{ language: 'eu' }}><Sonda /></UIProvider>);
    await act(async () => { await expect(carregaDiccionari('eu')).resolves.toBe(false); });
    expect(sonda().textContent).toBe('Torna');
    expect(atributs()).toEqual(['eu', 'ca', 'ca-ES']);
    expect(incidents()).toEqual([expect.objectContaining({ tipus: 'tros', on: 'idioma-eu', accio: 'fallada' })]);
    expect(pintats.every((p) => p.text === 'Torna')).toBe(true);
  });
});
