/**
 * P0-24b (Onada R21, verificació adversària) · Dues instàncies del
 * PedraSecaEmbed de veritat, cadascuna a la seua arrel ombra (targetNode, com
 * les munta <soc-de-poble>), comparteixen la pila de l'Arrere
 * (config/pilaEnrere.js). Cada una és el seu àmbit de capes: un menú obert
 * en la segona no deixa mort l'Escape de la primera, que no li arriba mai.
 * Es substituïxen l'App (un menú emergent amb el hook real) i els proveïdors
 * de sessió i d'identitat, que parlarien amb el backend, com a
 * PedraSecaEmbed.router.test.jsx.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import PedraSecaEmbed from './PedraSecaEmbed.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from './config/pilaEnrere.js';

vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID']) vi.stubEnv(variable, '');
});
vi.mock('./host.js', () => ({ arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));
vi.mock('./app/App.jsx', async () => {
  const { useRef, useState } = await import('react');
  const { useMenuEmergent } = await import('./components/PedraSeca/hooks/useMenuEmergent.js');
  function Llista({ boto, onTanca }) {
    const { ref } = useMenuEmergent({ files: '[role="menuitem"]', onTria: () => {}, onTanca, botoRef: boto });
    return <div ref={ref} role="menu"><button type="button" role="menuitem">Opció</button></div>;
  }
  function AppDeProva() {
    const [obert, setObert] = useState(false);
    const boto = useRef(null);
    return (
      <>
        <button type="button" ref={boto} onClick={() => setObert(true)}>Opcions</button>
        {obert ? <Llista boto={boto} onTanca={() => setObert(false)} /> : null}
      </>
    );
  }
  return { default: AppDeProva };
});

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
});
afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
  _reiniciaPilaEnrere();
  vi.unstubAllGlobals();
});

/** Una instància com la de _render(): l'arrel ombra tancada és el targetNode. */
async function instancia(primera) {
  const host = document.createElement('soc-de-poble');
  document.body.appendChild(host);
  const ombra = host.attachShadow({ mode: 'closed' });
  const punt = document.createElement('div');
  punt.className = 'sdp-root';
  ombra.appendChild(punt);
  await act(async () => {
    render(<PedraSecaEmbed config={{ routerType: 'memory' }} isFirstInstance={primera} targetNode={ombra} />, { container: punt });
  });
  return ombra;
}
const obert = (ombra) => ombra.querySelector('[role="menu"]') !== null;

test('dues instàncies, un menú obert a cadascuna: l’Escape de la primera tanca el seu', async () => {
  const a = await instancia(true);
  const b = await instancia(false);
  fireEvent.click(a.querySelector('button'));
  fireEvent.click(b.querySelector('button'));
  expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([true, true, 2]);

  fireEvent.keyDown(a.querySelector('[role="menuitem"]'), { key: 'Escape' });
  expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([false, true, 1]);
  expect(a.activeElement?.textContent).toBe('Opcions');

  fireEvent.keyDown(b.querySelector('[role="menuitem"]'), { key: 'Escape' });
  expect([obert(a), obert(b), capesEnrereObertes()]).toEqual([false, false, 0]);
});

test('la SPA (sense targetNode): una sola instància, i l’Escape i l’Arrere tanquen el mateix menú', async () => {
  await act(async () => { render(<PedraSecaEmbed config={{ routerType: 'memory' }} isFirstInstance />); });
  const obre = () => fireEvent.click(document.querySelector('button'));
  obre();
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.keyDown(document.querySelector('[role="menuitem"]'), { key: 'Escape' });
  expect([document.querySelector('[role="menu"]'), capesEnrereObertes()]).toEqual([null, 0]);
  obre();
  let consumit;
  act(() => { consumit = tancaCapaSuperior(10_000); });
  expect(consumit).toBe(true);
  expect([document.querySelector('[role="menu"]'), capesEnrereObertes()]).toEqual([null, 0]);
});
