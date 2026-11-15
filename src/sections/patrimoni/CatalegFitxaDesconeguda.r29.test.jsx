/* Onada R29 · R29-02-1b · /page/receptes i /page/banc-de-llavors amb una
   ?fitxa= que no és al catàleg. Els dos catàlegs són estàtics i complets
   (itemsComplete) i no trien cap fitxa de reserva (canAutoSelect): el detall
   diu, net, que l'element no és accessible, sense cap alerta d'error ni cap
   «Reintentar» que torne al mateix lloc. Abans, el model es prenia per parcial
   i el detall pintava «No s’ha pogut obrir l’element. Reintentar». */
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import ReceptesWorkspaceSection from './ReceptesWorkspaceSection.jsx';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', async (original) => ({ ...await original(), useUIActions: () => ui, useUIActionsOpcional: () => ui }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO() {} }));
vi.mock('../../hooks/useSEO', () => ({ useSEO() {} }));

let amplada = 1440;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => amplada);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); amplada = 1440; });

const marcs = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

const CATALEGS = [
  ['Receptes', '/page/receptes', ReceptesWorkspaceSection],
  ['Banc de llavors', '/page/banc-de-llavors', BancLlavorsWorkspaceSection],
];

test.each(CATALEGS.flatMap(([nom, ruta, Seccio]) => [1440, 375].map((ample) => [nom, ample, ruta, Seccio])))(
  '%s a %ipx: una ?fitxa= desconeguda diu «no accessible», sense alerta ni reintent',
  async (_nom, ample, ruta, Seccio) => {
    amplada = ample;
    const { container } = render(
      <MemoryRouter rutaInicial={`${ruta}?fitxa=no-existix`}>
        <Seccio page={{}} />
        <Ubicacio />
      </MemoryRouter>
    );
    await marcs();
    const detall = container.querySelector('#app-grid-main');
    expect(detall.querySelector('[role="alert"]')).toBeNull();
    expect(within(detall).queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(within(detall).getByRole('status').textContent).toBe('L’element no és accessible o ja no existix.');
    /* Cap reserva: l'enllaç no es reescriu cap a una altra fitxa. */
    expect(screen.getByTestId('ubicacio').textContent).toBe(`${ruta}?fitxa=no-existix`);
  }
);
