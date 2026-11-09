import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, RouterProvider, useLocation, useNavigate, useRouter, useSearchParams } from './RouterContext.jsx';

const META = '__sdp_router_entry';
let api;
function Probe() {
  api = { location: useLocation(), router: useRouter(), navigate: useNavigate(), setParams: useSearchParams()[1] };
  return <p>{api.location.pathname}</p>;
}
beforeEach(() => { window.history.replaceState({ host: 'CONTROL host' }, '', '/mur'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete document.startViewTransition; });
const browser = () => render(<RouterProvider><Probe /></RouterProvider>);

test('R56 · BrowserRouter distingeix entrades repetides i POP avant/arrere sense perdre l’estat públic', async () => {
  browser(); const initial = api.router.navegacio.clau;
  act(() => api.navigate('/mur', { state: 'CONTROL primera' })); const first = api.router.navegacio.clau;
  act(() => api.navigate('/mur', { state: 'CONTROL segona' })); const second = api.router.navegacio.clau;
  expect(new Set([initial, first, second]).size).toBe(3);
  expect(api.router.navegacio.accio).toBe('PUSH');
  act(() => api.navigate(-1));
  await waitFor(() => expect(api.router.navegacio.clau).toBe(first));
  expect(api.router.navegacio.accio).toBe('POP'); expect(api.location.state).toBe('CONTROL primera');
  act(() => api.navigate(1));
  await waitFor(() => expect(api.router.navegacio.clau).toBe(second));
  expect(api.location.state).toBe('CONTROL segona');
});

test.each([null, 0, false, 'CONTROL', ['CONTROL'], { publicField: 'CONTROL' }])('R56 · useLocation.projecta exactament l’estat públic %j', state => {
  browser();
  act(() => api.navigate('/page/control', { state }));
  expect(api.location.state).toEqual(state);
  expect(window.history.state[META]).toMatchObject({ version: 2, state });
  expect(Object.keys(window.history.state[META]).sort()).toEqual(['key', 'state', 'version']);
  expect(window.history.state.host).toBe('CONTROL host');
});

test('R56 · una col·lisió de namespace desconeguda i els camps host es conserven públicament', () => {
  const unknown = { host: 'CONTROL host', [META]: { version: 99, key: 'desconeguda', state: 'NO INTERPRETAR' } };
  window.history.replaceState(unknown, '', '/mur'); browser();
  expect(api.location.state).toEqual(unknown);
  const state = { [META]: { version: 1, key: 'sdp:control:1', state: 'CONTROL dada pública' }, extra: true };
  act(() => api.navigate('/mur', { state }));
  expect(api.location.state).toEqual(state);
  expect(window.history.state[META]).toMatchObject({ version: 2, hostValue: unknown[META], state });
});

test('R56 · navegar sense state no arrossega el payload públic de la pàgina anterior', () => {
  browser(); act(() => api.navigate('/page/control', { state: { dadaPrivada: 'CONTROL' } }));
  act(() => api.navigate('/pobles'));
  expect(api.location.state).toBeNull();
  expect(JSON.stringify(window.history.state)).not.toContain('dadaPrivada');
  expect(window.history.state.host).toBe('CONTROL host');
});

test('R56 · round-trip JSON de history.state conserva la projecció pública i la identitat', () => {
  browser(); act(() => api.navigate('/page/control?x=1#part', { state: { original: 'CONTROL' } }));
  const saved = JSON.parse(JSON.stringify(window.history.state)), key = api.router.navegacio.clau;
  act(() => api.navigate('/pobles'));
  act(() => { window.history.replaceState(saved, '', '/page/control?x=1#part'); window.dispatchEvent(new PopStateEvent('popstate', { state: saved })); });
  expect(api.location).toEqual({ pathname: '/page/control', search: 'x=1', hash: '#part', state: { original: 'CONTROL' } });
  expect(api.router.navegacio).toEqual({ clau: key, accio: 'POP' });
});

test('R56 · la fosa pendent conserva identitat, estat i fragment de la vista visible', async () => {
  let confirm;
  document.startViewTransition = vi.fn(fn => { confirm = fn; return { ready: Promise.resolve() }; });
  browser(); const first = api.router.navegacio.clau;
  act(() => api.navigate('/page/control#part', { state: 0, transicio: true }));
  expect(api.location.pathname).toBe('/mur'); expect(api.router.navegacio.clau).toBe(first);
  expect(api.location.state).toEqual({ host: 'CONTROL host' });
  await act(async () => confirm());
  expect(api.location.state).toBe(0); expect(api.location.hash).toBe('#part');
  expect(api.router.navegacio.clau).not.toBe(first);
});

test('R56 · MemoryRouter manté hash/consulta, entrades repetides i salts sense tocar l’amfitrió', () => {
  const state = window.history.state, url = window.location.href;
  const push = vi.spyOn(window.history, 'pushState'), replace = vi.spyOn(window.history, 'replaceState');
  render(<MemoryRouter rutaInicial="/mur?filtre=1#part"><Probe /></MemoryRouter>);
  const initial = api.router.navegacio.clau;
  expect(api.location.hash).toBe('#part');
  act(() => api.navigate('/mur?filtre=1#part', { state: false })); const first = api.router.navegacio.clau;
  act(() => api.navigate('/mur?filtre=1#part', { state: 0 })); const second = api.router.navegacio.clau;
  expect(new Set([initial, first, second]).size).toBe(3);
  act(() => api.navigate(-1)); expect(api.router.navegacio.clau).toBe(first); expect(api.location.state).toBe(false);
  act(() => api.navigate(1)); expect(api.router.navegacio.clau).toBe(second); expect(api.location.state).toBe(0);
  act(() => api.setParams({ filtre: '2' })); expect(api.location.hash).toBe('#part'); expect(api.location.search).toBe('filtre=2');
  expect(push).not.toHaveBeenCalled(); expect(replace).not.toHaveBeenCalled();
  expect(window.history.state).toEqual(state); expect(window.location.href).toBe(url);
});

test('R56 · la captura prèvia veu la ruta anterior i es pot desconnectar', () => {
  browser(); const calls = [];
  const stop = api.router.subscriuAbansDeNavegar(() => calls.push(api.location.pathname));
  act(() => api.navigate('/pobles'));
  expect(calls).toEqual(['/mur']); stop();
  act(() => api.navigate('/mercat')); expect(calls).toEqual(['/mur']);
});

test('R56 · fora de la base no afegix metadades a la URL o estat host', () => {
  window.history.replaceState({ host: 'CONTROL fora' }, '', '/host');
  render(<RouterProvider basename="/app"><Probe /></RouterProvider>);
  expect(api.location.pathname).toBe(''); expect(window.history.state).toEqual({ host: 'CONTROL fora' });
});
