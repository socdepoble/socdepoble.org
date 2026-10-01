/* Fase visual del calendari (prompt 261001_0445) · L'amplada del contenidor,
   mesurada abans de pintar; null mentre no es coneix (jsdom no fa layout). */
import { act, cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { esEstret, useAmpladaContenidor } from './useAmpladaContenidor.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function Sonda() {
  const ref = useRef(null);
  const { amplada, em } = useAmpladaContenidor(ref);
  return <div ref={ref} data-testid="caixa">{`${amplada}|${em}`}</div>;
}

test('sense layout (jsdom), l’amplada és null i l’em, el de per defecte', () => {
  const { getByTestId } = render(<Sonda />);
  expect(getByTestId('caixa').textContent).toBe('null|16');
});

test('mesura en muntar i torna a mesurar quan el ResizeObserver avisa', () => {
  let avisa = null;
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { avisa = callback; }
    observe() {}
    disconnect() { disconnect(); }
  });
  let ample = 375;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: ample }));
  const { getByTestId, unmount } = render(<Sonda />);
  expect(getByTestId('caixa').textContent).toBe('375|16');
  ample = 1024;
  act(() => { avisa(); });
  expect(getByTestId('caixa').textContent).toBe('1024|16');
  unmount();
  expect(disconnect).toHaveBeenCalledTimes(1);
});

test('sense ResizeObserver, escolta el resize de la finestra i el lleva en desmuntar', () => {
  vi.stubGlobal('ResizeObserver', undefined);
  const lleva = vi.spyOn(window, 'removeEventListener');
  const { unmount } = render(<Sonda />);
  unmount();
  expect(lleva).toHaveBeenCalledWith('resize', expect.any(Function));
});

test('esEstret: només amb una amplada coneguda per davall del llindar en em', () => {
  expect(esEstret({ amplada: 375, em: 16 }, 41.5)).toBe(true);
  expect(esEstret({ amplada: 664, em: 16 }, 41.5)).toBe(false);
  expect(esEstret({ amplada: 600, em: 20 }, 41.5)).toBe(true);
  expect(esEstret({ amplada: null, em: 16 }, 41.5)).toBe(false);
  expect(esEstret({ amplada: 0, em: 16 }, 41.5)).toBe(false);
  expect(esEstret(undefined, 41.5)).toBe(false);
});
