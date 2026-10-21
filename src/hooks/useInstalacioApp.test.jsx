/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · El ganxo de
   l'oferta d'instal·lar a l'ordinador: llig el magatzem (src/pwa/instalacio.js)
   amb useSyncExternalStore. Un magatzem injectat i una finestra de mostra amb
   l'esdeveniment, com a instalacio.test.js. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { INSTALACIO, creaInstalacio } from '../pwa/instalacio.js';
import { useInstalacioApp } from './useInstalacioApp.js';

function magatzemAmbFinestra() {
  const escoltes = new Map();
  const finestra = {
    onbeforeinstallprompt: null,
    isSecureContext: true,
    matchMedia: () => ({ matches: false }),
    addEventListener: (tipus, funcio) => escoltes.set(tipus, funcio),
    removeEventListener: () => {}
  };
  finestra.self = finestra;
  finestra.top = finestra;
  const magatzem = creaInstalacio();
  expect(magatzem.captura({ finestra, navegador: {} }).escolta).toBe(true);
  return { magatzem, escoltes };
}

const oferta = () => ({ preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve({ outcome: 'accepted' })) });

afterEach(cleanup);

test('sense oferta no es pot; quan arriba, sí; instal·lada, ja no', () => {
  const { magatzem, escoltes } = magatzemAmbFinestra();
  const { result } = renderHook(() => useInstalacioApp(magatzem));
  expect(result.current.pot).toBe(false);
  act(() => { escoltes.get('beforeinstallprompt')(oferta()); });
  expect(result.current.pot).toBe(true);
  act(() => { escoltes.get('appinstalled')({}); });
  expect(result.current.pot).toBe(false);
});

test('instala delega en demana(): prompt() dins de la mateixa crida, i el botó se\'n va', async () => {
  const { magatzem, escoltes } = magatzemAmbFinestra();
  const e = oferta();
  const { result } = renderHook(() => useInstalacioApp(magatzem));
  act(() => { escoltes.get('beforeinstallprompt')(e); });
  let promesa;
  act(() => { promesa = result.current.instala(); });
  expect(e.prompt).toHaveBeenCalledTimes(1);
  expect(result.current.pot).toBe(false);
  await expect(promesa).resolves.toBe('accepted');
});

test('instala és estable entre pintats; en desmuntar es dona de baixa', () => {
  const { magatzem } = magatzemAmbFinestra();
  // El magatzem és congelat: es vigila amb una còpia que embolica subscriu.
  const baixes = [];
  const vigilat = { ...magatzem, subscriu: vi.fn((escolta) => { const baixa = vi.fn(magatzem.subscriu(escolta)); baixes.push(baixa); return baixa; }) };
  const { result, rerender, unmount } = renderHook(() => useInstalacioApp(vigilat));
  const primera = result.current.instala;
  rerender();
  expect(result.current.instala).toBe(primera);
  expect(vigilat.subscriu).toHaveBeenCalled();
  unmount();
  expect(baixes.length).toBeGreaterThan(0);
  expect(baixes.every((baixa) => baixa.mock.calls.length === 1)).toBe(true);
});

test('sense magatzem injectat llig el de la pàgina, que a jsdom no té oferta', () => {
  const { result } = renderHook(() => useInstalacioApp());
  expect(result.current.pot).toBe(INSTALACIO.pot());
  expect(result.current.pot).toBe(false);
});
