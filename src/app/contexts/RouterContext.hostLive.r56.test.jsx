import { useRef } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { RouterProvider, useLocation, useNavigate, useRouter } from './RouterContext.jsx';
import { campsHostDeHistorial } from './historialDeRuta.js';
import { useScrollDeNavegacio } from '../../hooks/useScrollDeNavegacio.js';
let api;
function Probe() {
  const contentRef = useRef(null), router = useRouter(), location = useLocation();
  api = { navigate: useNavigate(), router, location, contentRef };
  useScrollDeNavegacio({ contentRef, ...location, navegacio: router.navegacio, subscriuAbansDeNavegar: router.subscriuAbansDeNavegar });
  return <div ref={contentRef}><p>{location.pathname}</p></div>;
}
afterEach(cleanup);
const browser = () => render(<RouterProvider><Probe /></RouterProvider>);

test.each([false, true])('GF4 · camps host vigents després de replaceState es conserven; replace=%s', replace => {
  window.history.replaceState({ host: 'old' }, '', '/mur'); browser();
  act(() => api.navigate('/mercat', { state: { priorPublic: 'private page state' } }));
  window.history.replaceState({ ...window.history.state, host: 'new', added: 'live' }, '', '/mercat');
  act(() => api.navigate('/pobles', { replace }));
  expect(campsHostDeHistorial(window.history.state)).toEqual({ host: 'new', added: 'live' });
  expect(api.location.state).toBeNull();
  expect(JSON.stringify(window.history.state)).not.toContain('priorPublic');
});

test('GF4 · raw extern no marcat conserva camps i namespace opac vigents', () => {
  window.history.replaceState({ host: 'old' }, '', '/mur'); browser();
  const live = { host: 'external', added: 0, __sdp_router_entry: { version: 99, opaque: true } };
  window.history.replaceState(live, '', '/mur');
  act(() => api.navigate('/pobles', { state: { page: 'new' } }));
  expect(campsHostDeHistorial(window.history.state)).toEqual(live);
  expect(api.location.state).toEqual({ page: 'new' });
});

test('GF4 · history.back real a entrada aliena amb URL inicial repetida no reutilitza identitat', async () => {
  window.history.replaceState({ host: 'older' }, '', '/mur');
  window.history.pushState({ host: 'initial' }, '', '/mur'); browser();
  const initial = api.router.navegacio.clau; expect(initial).toBeTruthy();
  act(() => window.history.back());
  await waitFor(() => expect(api.location.state).toEqual({ host: 'older' }));
  expect(api.router.navegacio).toEqual({ clau: null, accio: 'POP' });
  expect(window.history.state).toEqual({ host: 'older' });
});

test('GF4 · POP real no marcat no inventa restauració del scroll inicial', async () => {
  window.history.replaceState({ host: 'older' }, '', '/mur');
  window.history.pushState({ host: 'initial' }, '', '/mur'); browser();
  const content = api.contentRef.current;
  content.scrollTop = 420; content.dispatchEvent(new Event('scroll'));
  act(() => api.navigate('/mercat'));
  content.scrollTop = 55; content.dispatchEvent(new Event('scroll'));
  act(() => window.history.go(-2));
  await waitFor(() => expect(api.location.state).toEqual({ host: 'older' }));
  expect(api.router.navegacio).toEqual({ clau: null, accio: 'POP' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 25)); });
  expect(content.scrollTop).toBe(55);
});
