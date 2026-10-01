/**
 * T7 (261001) · useEnLinia: escolta 'online' i 'offline' de window, sense cap
 * temporitzador, i retira els oients en desmuntar.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useEnLinia } from './useEnLinia.js';

function Sonda() {
  return <p>{useEnLinia() ? 'en línia' : 'fora de línia'}</p>;
}

/* navigator.onLine és un getter del prototip: es tapa a la instància i es
   restaura després de cada prova. */
const posaEnLinia = (valor) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => valor });

afterEach(() => {
  cleanup();
  delete window.navigator.onLine;
  vi.restoreAllMocks();
});

test('valor inicial: el que diu navigator.onLine', () => {
  posaEnLinia(true);
  const vista = render(<Sonda />);
  expect(screen.getByText('en línia')).toBeTruthy();
  vista.unmount();
  posaEnLinia(false);
  render(<Sonda />);
  expect(screen.getByText('fora de línia')).toBeTruthy();
});

test('canvia amb «offline» i «online», sense recarregar', () => {
  posaEnLinia(true);
  render(<Sonda />);
  act(() => {
    posaEnLinia(false);
    window.dispatchEvent(new Event('offline'));
  });
  expect(screen.getByText('fora de línia')).toBeTruthy();
  act(() => {
    posaEnLinia(true);
    window.dispatchEvent(new Event('online'));
  });
  expect(screen.getByText('en línia')).toBeTruthy();
});

test('en desmuntar retira els dos oients que ha posat', () => {
  const posa = vi.spyOn(window, 'addEventListener');
  const lleva = vi.spyOn(window, 'removeEventListener');
  const vista = render(<Sonda />);
  const posats = posa.mock.calls.filter(([tipus]) => tipus === 'online' || tipus === 'offline');
  expect(posats.map(([tipus]) => tipus).sort()).toEqual(['offline', 'online']);
  vista.unmount();
  for (const [tipus, oient] of posats) expect(lleva).toHaveBeenCalledWith(tipus, oient);
});
