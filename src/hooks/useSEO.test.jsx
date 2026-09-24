import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useRouter } from '../app/contexts/RouterContext';
import { useSEO } from './useSEO';
import { RouteSEO } from './RouteSEO';
const state = vi.hoisted(() => ({ config: {}, asset: (path) => path }));
vi.mock('../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: state.config }), useUIActions: () => ({ resolveAsset: state.asset }) }));
let navigate;
function Page() {
  const router = useRouter(); navigate = router.navigate;
  return <><RouteSEO />{router.currentPath.startsWith('/mercat/') && <Product />}</>;
}
function Product() { useSEO({ title: 'Producte', description: 'Descripció producte', jsonLd: { name: 'Producte' } }); return null; }
function tree() { return <MemoryRouter><Page /></MemoryRouter>; }
beforeEach(() => {
  state.config = {};
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
  state.config = {}; view.rerender(tree());
  expect(document.title).toBe('Producte | Sóc de Poble');
  state.config = { manageDocumentHead: false }; view.rerender(tree());
  expect(document.title).toBe('Amfitrió');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
});
