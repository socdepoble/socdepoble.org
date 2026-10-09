/* Onada 6 (tasca 12) · useNivellIaia: el nivell d'IA viu per a qui el pinta en
   React. Arrenca amb el desat, seguix l'esdeveniment de RealitatSection en
   esta pestanya i l'esdeveniment 'storage' d'una altra; un valor fora de 0-3
   cau a Passiva (1), com nivellIaiaDesat. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import useNivellIaia from './useNivellIaia.js';
import { CLAU_NIVELL_IAIA, anunciaNivellIaia } from './nivellIaia.js';
import { STORAGE_PREFIX, setVal } from '../../config/storage.js';

const CLAU = `${STORAGE_PREFIX}${CLAU_NIVELL_IAIA}`;
let vist;
function Sonda() {
  vist = useNivellIaia();
  return null;
}

beforeEach(() => { localStorage.clear(); vist = undefined; });
afterEach(() => { cleanup(); localStorage.clear(); });

test('arrenca amb el nivell desat i, sense res, amb Passiva (1)', () => {
  render(<Sonda />);
  expect(vist).toBe(1);
  cleanup();
  setVal(CLAU_NIVELL_IAIA, 0);
  render(<Sonda />);
  expect(vist).toBe(0);
});

test('seguix el canvi de Realitat en esta pestanya, sense tornar a muntar', () => {
  render(<Sonda />);
  act(() => { setVal(CLAU_NIVELL_IAIA, 0); anunciaNivellIaia(0); });
  expect(vist).toBe(0);
  act(() => { setVal(CLAU_NIVELL_IAIA, 3); anunciaNivellIaia(3); });
  expect(vist).toBe(3);
  /* Un esdeveniment amb un valor que no és cap nivell: el desat. */
  act(() => { window.dispatchEvent(new CustomEvent('sdp:iaia-nivell', { detail: 'res' })); });
  expect(vist).toBe(3);
});

test('seguix un canvi fet en una altra pestanya (storage), i només de la seua clau', () => {
  render(<Sonda />);
  act(() => {
    localStorage.setItem(CLAU, '0');
    window.dispatchEvent(new StorageEvent('storage', { key: 'una-altra-clau' }));
  });
  expect(vist).toBe(1);
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key: CLAU })); });
  expect(vist).toBe(0);
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
  });
  expect(vist).toBe(1);
});

test('un valor desat fora de 0-3 cau a Passiva (1); en desmuntar, no escolta res', () => {
  localStorage.setItem(CLAU, '7');
  const vista = render(<Sonda />);
  expect(vist).toBe(1);
  vista.unmount();
  vist = 'desmuntat';
  act(() => { anunciaNivellIaia(0); });
  expect(vist).toBe('desmuntat');
});
