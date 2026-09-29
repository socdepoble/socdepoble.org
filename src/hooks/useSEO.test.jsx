import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useRouter } from '../app/contexts/RouterContext';
import { useSEO } from './useSEO';
import { RouteSEO } from './RouteSEO';
import { RouteTelemetria } from './RouteTelemetria';
const AMA = Object.freeze({ manageDocumentHead: true });
const state = vi.hoisted(() => ({ config: {}, asset: (path) => path, foraDeBase: false, registraVisita: vi.fn(), declaraEncastada: vi.fn() }));
vi.mock('../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: state.config }), useUIActions: () => ({ resolveAsset: state.asset }) }));
vi.mock('../data/telemetria.js', () => ({ registraVisita: state.registraVisita, declaraEncastada: state.declaraEncastada }));
/* Fora de base el router nou torna pathname '': ací es força sense tocar el router real. */
vi.mock('../app/contexts/RouterContext', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, useLocation: () => { const loc = real.useLocation(); return state.foraDeBase ? { ...loc, pathname: '' } : loc; } };
});
let navigate;
function Page() {
  const router = useRouter(); navigate = router.navigate;
  return <><RouteSEO />{router.currentPath.startsWith('/mercat/') && <Product />}</>;
}
function Product() { useSEO({ title: 'Producte', description: 'Descripció producte', jsonLd: { name: 'Producte' } }); return null; }
function tree() { return <MemoryRouter><Page /></MemoryRouter>; }
const headDeLAmfitrio = () => {
  expect(document.title).toBe('Amfitrió');
  expect(document.querySelector('meta[name="description"]').content).toBe('Descripció base');
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://host.test/');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
  expect(document.querySelector('meta[property="og:title"]')).toBeNull();
  expect(document.querySelector('script[data-sdp-seo]')).toBeNull();
};
beforeEach(() => {
  state.config = AMA;
  state.foraDeBase = false;
  state.registraVisita.mockReset();
  state.declaraEncastada.mockReset();
  const title = document.createElement('title'); title.textContent = 'Amfitrió';
  const description = document.createElement('meta'); description.name = 'description'; description.content = 'Descripció base';
  const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = 'https://host.test/';
  document.head.replaceChildren(title, description, canonical);
});
afterEach(cleanup);
test('producte → Notes neteja canonical, descripció i JSON-LD i aplica noindex', () => {
  render(tree());
  act(() => navigate('/mercat/a'));
  expect(document.title).toBe('Producte | Sóc de Poble');
  expect(document.querySelector('script[data-sdp-seo]')).not.toBeNull();
  act(() => navigate('/notes?nota=1'));
  expect(document.title).toBe('Notes | Sóc de Poble');
  expect(document.querySelector('meta[name="robots"]').content).toBe('noindex, nofollow');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('script[data-sdp-seo]')).toBeNull();
  expect(document.querySelector('meta[name="description"]').content).toBe('Descripció base');
});
test('les rutes vives sense useSEO propi tenen títol de reserva, no el genèric', () => {
  render(tree());
  act(() => navigate('/traduccions'));
  expect(document.title).toBe('Traduccions i llengua | Sóc de Poble');
  act(() => navigate('/wikidepoble'));
  expect(document.title).toBe('Wiki de Poble | Sóc de Poble');
  act(() => navigate('/gent/7f3c'));
  expect(document.title).toBe('Perfil | Sóc de Poble');
});
test('mateix component i mateix títol recalculen canonical amb pathname', () => {
  render(tree()); act(() => navigate('/mercat/a'));
  expect(document.querySelector('link[rel="canonical"]').href).toContain('/mercat/a');
  act(() => navigate('/mercat/b'));
  expect(document.querySelector('link[rel="canonical"]').href).toContain('/mercat/b');
});
test('head desactivat respecta l’amfitrió i la desactivació restaura baseline', () => {
  state.config = { manageDocumentHead: false };
  const view = render(tree()); act(() => navigate('/mercat/a'));
  expect(document.title).toBe('Amfitrió');
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://host.test/');
  state.config = AMA; view.rerender(tree());
  expect(document.title).toBe('Producte | Sóc de Poble');
  state.config = { manageDocumentHead: false }; view.rerender(tree());
  expect(document.title).toBe('Amfitrió');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
});
/* Opt-in: penjar de #root o no dir res no és cap declaració. L'amfitrió que
   no passa manageDocumentHead: true conserva el seu <head> i no se li compta res. */
test('sense declaració de l’amfitrió ({}) el títol és seu i no es compta cap visita', () => {
  state.config = {};
  render(<MemoryRouter><Page /><RouteTelemetria /></MemoryRouter>);
  act(() => navigate('/mercat/a'));
  act(() => navigate('/notes'));
  headDeLAmfitrio();
  expect(state.registraVisita).not.toHaveBeenCalled();
  expect(state.declaraEncastada).toHaveBeenLastCalledWith(true);
});
test.each([undefined, null, { manageDocumentHead: 'true' }, { manageDocumentHead: 1 }, { manageDocumentHead: undefined }])('només el booleà true dona el head: %j', config => {
  state.config = config;
  render(tree());
  act(() => navigate('/mercat/a'));
  headDeLAmfitrio();
});
test('fora de la base del router (pathname buit) el head torna a l’amfitrió', () => {
  const view = render(tree());
  act(() => navigate('/mercat/a'));
  expect(document.title).toBe('Producte | Sóc de Poble');
  state.foraDeBase = true; view.rerender(tree());
  headDeLAmfitrio();
});
