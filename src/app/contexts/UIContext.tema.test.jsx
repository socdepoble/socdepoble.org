/**
 * Auditoria 261007 (B) · El tema se sincronitza entre instàncies.
 *
 *  · Dues instàncies a la mateixa pàgina (dos blocs <soc-de-poble>, cada un
 *    amb el seu UIProvider) no divergixen: setTheme i toggleTheme avisen per
 *    ESDEVENIMENT_TEMA (theme.js), com ja fan el contrast i la llengua.
 *  · L'oient només posa l'estat: un sol esdeveniment per tria, cap bucle, i
 *    l'emmagatzematge només l'escriu qui tria.
 *  · toggleTheme avisa fora de l'updater de setState: en StrictMode (updaters
 *    dues vegades) continua eixint un sol avís.
 *  · Un valor desconegut no fa res; desmuntar retira l'oient.
 *
 * UIProvider real; l'emmagatzematge es toca només per storage.js (tractor L2).
 */
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { UIProvider, useUIActions, useUIState } from './UIContext.jsx';
import { ESDEVENIMENT_TEMA, THEME_KEY } from '../../config/theme.js';
import { delVal, getVal, setVal } from '../../config/storage.js';

const sondes = {};

function Sonda({ nom = 'a' }) {
  const { themeMode, themePreference } = useUIState();
  const { setTheme, toggleTheme } = useUIActions();
  sondes[nom] = { setTheme, toggleTheme };
  return <p data-testid={`sonda-${nom}`} data-mode={themeMode} data-preferencia={themePreference} />;
}

const sonda = (nom) => screen.getByTestId(`sonda-${nom}`);
const modes = () => [sonda('a').dataset.mode, sonda('b').dataset.mode];
const preferencies = () => [sonda('a').dataset.preferencia, sonda('b').dataset.preferencia];

const duesInstancies = () => render(
  <>
    <UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>
    <UIProvider externalConfig={{}}><Sonda nom="b" /></UIProvider>
  </>
);

let emesos = [];
const escolta = (event) => emesos.push(event.detail);
let temaDesat = null;
let temaHtml = null;

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  temaDesat = getVal(THEME_KEY);
  delVal(THEME_KEY);
  // readThemePreference encara mira l'<html>: cada prova comença sense tema escrit.
  temaHtml = document.documentElement.getAttribute('data-theme');
  document.documentElement.removeAttribute('data-theme');
  emesos = [];
  window.addEventListener(ESDEVENIMENT_TEMA, escolta);
  for (const clau of Object.keys(sondes)) delete sondes[clau];
});

afterEach(() => {
  cleanup();
  window.removeEventListener(ESDEVENIMENT_TEMA, escolta);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (temaDesat == null) delVal(THEME_KEY);
  else setVal(THEME_KEY, temaDesat);
  if (temaHtml == null) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', temaHtml);
});

describe('UIProvider · el tema entre instàncies (Auditoria 261007 (B))', () => {
  test('setTheme en una instància arriba a l’altra, amb un sol avís i sense bucle', () => {
    duesInstancies();
    expect(modes()).toEqual(['light', 'light']);
    act(() => sondes.a.setTheme('dark'));
    expect(modes()).toEqual(['dark', 'dark']);
    expect(preferencies()).toEqual(['dark', 'dark']);
    // Un sol esdeveniment: l'oient de l'altra instància no reemet.
    expect(emesos).toEqual([{ theme: 'dark' }]);
    expect(getVal(THEME_KEY)).toBe('dark');
  });

  test('«Igual que el sistema» també viatja com a preferència, no com a mode resolt', () => {
    duesInstancies();
    act(() => sondes.b.setTheme('system'));
    expect(preferencies()).toEqual(['system', 'system']);
    expect(emesos).toEqual([{ theme: 'system' }]);
  });

  test('toggleTheme (la barra negra) també sincronitza, i dos clics seguits tornen al clar', () => {
    duesInstancies();
    act(() => sondes.b.toggleTheme());
    expect(modes()).toEqual(['dark', 'dark']);
    expect(getVal(THEME_KEY)).toBe('dark');
    act(() => {
      sondes.a.toggleTheme();
      sondes.a.toggleTheme();
    });
    expect(modes()).toEqual(['dark', 'dark']);
    expect(emesos).toEqual([{ theme: 'dark' }, { theme: 'light' }, { theme: 'dark' }]);
  });

  test('en StrictMode, un clic de toggleTheme emet un sol avís', () => {
    render(<StrictMode><UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider></StrictMode>);
    act(() => sondes.a.toggleTheme());
    expect(sonda('a').dataset.mode).toBe('dark');
    expect(emesos).toEqual([{ theme: 'dark' }]);
  });

  test('un valor desconegut, per setTheme o pel canal, no fa res', () => {
    duesInstancies();
    act(() => sondes.a.setTheme('fosc'));
    expect(emesos).toEqual([]);
    expect(getVal(THEME_KEY)).toBeNull();
    act(() => { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_TEMA, { detail: { theme: 'fosc' } })); });
    act(() => { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_TEMA, { detail: null })); });
    expect(modes()).toEqual(['light', 'light']);
  });

  test('l’oient no desa: el canal d’una altra instància no escriu a l’emmagatzematge', () => {
    render(<UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>);
    act(() => { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_TEMA, { detail: { theme: 'dark' } })); });
    expect(sonda('a').dataset.mode).toBe('dark');
    expect(getVal(THEME_KEY)).toBeNull();
  });

  test('desmuntar retira l’oient del canal del tema', () => {
    const afegits = vi.spyOn(window, 'addEventListener');
    const retirats = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>);
    const oient = afegits.mock.calls.find(([tipus]) => tipus === ESDEVENIMENT_TEMA)?.[1];
    expect(typeof oient).toBe('function');
    unmount();
    expect(retirats).toHaveBeenCalledWith(ESDEVENIMENT_TEMA, oient);
  });
});
