/* Ordre del Mestre 260930 (P2) · «Eixir del poble» del Panell de Control
   tenia el mateix defecte que «Tanca la sessió» dels Ajustos del Xat: en
   acabar l'eixida feia window.location.reload(), i a WordPress això
   recarrega la pàgina sencera de l'amfitrió. Ara porta a /registre i prou:
   la sessió tancada ja buida els proveïdors de la persona (generació).

   L'eixida segura se substituïx per a quedar-se el `despres` que el Panell
   li passa, i es crida com ho faria useEixidaSegura després del logout.
   jsdom no deixa substituir location.reload: una recàrrega hi emet un
   `jsdomError` «Not implemented: navigation…» per la consola virtual de la
   finestra, i eixe avís és el que es vigila. */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ despres: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, reserva) => reserva, resolveAsset: (valor) => valor }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: ({ despres } = {}) => {
    estat.despres = despres;
    return { demana: vi.fn(), ocupat: false, avis: null, error: null };
  }
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <section>{children}</section>
}));

import ControlSection from './ControlSection.jsx';

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}

let navegacions = [];
const escoltaJsdom = (error) => {
  if (/Not implemented: navigation/.test(String(error?.message))) navegacions.push(error.message);
};

beforeEach(() => {
  estat.despres = null;
  navegacions = [];
  window._virtualConsole?.on('jsdomError', escoltaJsdom);
});
afterEach(() => {
  cleanup();
  window._virtualConsole?.off('jsdomError', escoltaJsdom);
});

test('Ordre del Mestre · en acabar «Eixir del poble», porta a /registre sense recarregar la pàgina', () => {
  expect(typeof window._virtualConsole?.on).toBe('function');
  render(
    <MemoryRouter rutaInicial="/control">
      <ControlSection />
      <Ubicacio />
    </MemoryRouter>
  );
  expect(typeof estat.despres).toBe('function');
  act(() => { estat.despres(); });
  expect(screen.getByTestId('ubicacio').textContent).toBe('/registre');
  expect(navegacions).toEqual([]);
});
