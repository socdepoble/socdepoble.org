import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useRouter } from '../app/contexts/RouterContext';
import { routeAllowsIndex, useSEO } from './useSEO';
import { RouteSEO } from './RouteSEO';
import { RouteTelemetria } from './RouteTelemetria';
import { DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES } from '../components/universal/UniversalUtils.js';
import { ENTITATS_SEED } from '../data/identitatsSeed.js';
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
let imatgeDeLaVista;
function Page() {
  const router = useRouter(); navigate = router.navigate;
  return <><RouteSEO />{router.currentPath.startsWith('/mercat/') && <Product />}
    {router.currentPath.startsWith('/foto/') && <Foto />}</>;
}
function Product() { useSEO({ title: 'Producte', description: 'Descripció producte', jsonLd: { name: 'Producte' } }); return null; }
function Foto() { useSEO({ title: 'Foto', description: 'Una foto del mercat', image: imatgeDeLaVista }); return null; }
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

/* S6 · La imatge social és un conjunt. El head base porta el del logotip
   (URL, mides i alt); una vista amb imatge pròpia no l'hereta mai. */
const LOGO = 'https://example.org/assets/system/ui/og-socdepoble-1200x630.png';
const CONJUNT_BASE = [['og:image', LOGO], ['og:image:width', '1200'], ['og:image:height', '630'],
  ['og:image:alt', 'Logotip de prova'], ['twitter:image', LOGO]];
function ambConjuntBase() {
  document.head.append(...CONJUNT_BASE.map(([clau, valor]) => {
    const node = document.createElement('meta');
    node.setAttribute(clau.startsWith('og:') ? 'property' : 'name', clau);
    node.content = valor;
    return node;
  }));
}
const conjuntImatge = () => [...document.head.querySelectorAll('meta[property^="og:image"], meta[name^="twitter:image"]')]
  .map(node => [node.getAttribute('property') || node.name, node.content]);
const valor = clau => document.head.querySelector(`meta[property="${clau}"], meta[name="${clau}"]`)?.content ?? null;

test('S6 · una imatge pròpia sense mides ni alt no hereta les del logotip, i en canviar de ruta torna el conjunt base exacte', () => {
  ambConjuntBase();
  imatgeDeLaVista = '/media/cistella.jpg';
  render(tree());
  act(() => navigate('/foto/1'));
  expect(valor('og:image')).toMatch(/\/media\/cistella\.jpg$/);
  expect(valor('twitter:image')).toBe(valor('og:image'));
  for (const clau of ['og:image:width', 'og:image:height', 'og:image:alt', 'og:image:type', 'twitter:image:alt']) {
    expect(valor(clau)).toBeNull();
  }
  act(() => navigate('/mur'));
  expect(conjuntImatge()).toEqual(CONJUNT_BASE);
});
test('S6 · una imatge pròpia amb el seu conjunt el publica sencer, amb og:image davant de les seues propietats', () => {
  ambConjuntBase();
  imatgeDeLaVista = { url: '/media/cistella.jpg', width: 800, height: 600, alt: 'Cistella de fruita', type: 'image/jpeg' };
  render(tree());
  act(() => navigate('/foto/1'));
  expect(valor('og:image')).toMatch(/\/media\/cistella\.jpg$/);
  expect([valor('og:image:width'), valor('og:image:height'), valor('og:image:type')]).toEqual(['800', '600', 'image/jpeg']);
  expect([valor('og:image:alt'), valor('twitter:image:alt')]).toEqual(['Cistella de fruita', 'Cistella de fruita']);
  const ordre = [...document.head.querySelectorAll('meta[property^="og:image"]')].map(node => node.getAttribute('property'));
  expect(ordre[0]).toBe('og:image');
});
test('S6 · unes mides a mitges no es publiquen: amplària sense altura no és cap mida', () => {
  ambConjuntBase();
  imatgeDeLaVista = { url: '/media/cistella.jpg', width: 800, alt: 'Cistella de fruita' };
  render(tree());
  act(() => navigate('/foto/1'));
  expect([valor('og:image:width'), valor('og:image:height')]).toEqual([null, null]);
  expect(valor('og:image:alt')).toBe('Cistella de fruita');
});
test.each(['/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', '/media/dibuix.SVG?v=2', { url: '/media/dibuix', type: 'image/svg+xml' },
  'data:image/png;base64,AAAA', 'blob:https://example.org/avatar'])(
  'S6 · una SVG o una URL que les xarxes no baixen (%j) no és imatge social: queda el conjunt base', imatge => {
    ambConjuntBase();
    imatgeDeLaVista = imatge;
    render(tree());
    act(() => navigate('/foto/1'));
    expect(conjuntImatge()).toEqual(CONJUNT_BASE);
    expect(valor('twitter:card')).toBe('summary_large_image');
  });
/* Onada 8 (261009) · La marca de Sóc de Poble no és mai imatge social. Abans
   era SVG i ja eixia el conjunt base; ara és PNG i ha de continuar eixint.
   El logo_url de l'entitat pilot és el que la fitxa /empresa/socdepoble passa
   a useSEO (identitatsSeed.js → localPerfils.js → PerfilPublicSection.jsx). */
test.each([ENTITATS_SEED[0].logo_url, DEFAULT_AUTHOR.avatarUrl, DEFAULT_AUTHOR.logo.clar, DEFAULT_AUTHOR.logo.fosc,
  ...Object.values(MARQUES_SVG_ANTIGUES), 'https://example.org/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  { url: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png', width: 985, height: 256, type: 'image/png', alt: 'Logotip' }])(
  'Onada 8 · la marca de l’entitat (%j) no és imatge social: queda el conjunt base', imatge => {
    ambConjuntBase();
    imatgeDeLaVista = imatge;
    render(tree());
    act(() => navigate('/foto/1'));
    expect(conjuntImatge()).toEqual(CONJUNT_BASE);
    expect(valor('og:image:type')).toBeNull();
  });
/* Si tornara a ser SVG, la prova d'amunt la passaria el filtre dels SVG i no
   la guarda de la marca. */
test('Onada 8 · el logo_url de l’entitat pilot és la marca en PNG', () => {
  expect(ENTITATS_SEED[0].logo_url).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
});
test('S6 · la imatge base passada a mà (TextSection) conserva el conjunt base', () => {
  ambConjuntBase();
  imatgeDeLaVista = '/assets/system/ui/og-socdepoble-1200x630.png';
  render(tree());
  act(() => navigate('/foto/1'));
  expect(conjuntImatge()).toEqual(CONJUNT_BASE);
});
test('S6 · desmuntar la vista no deixa cap propietat d’imatge òrfena', () => {
  imatgeDeLaVista = { url: '/media/cistella.jpg', width: 800, height: 600, alt: 'Cistella de fruita', type: 'image/jpeg' };
  const view = render(tree());
  act(() => navigate('/foto/1'));
  expect(valor('og:image:alt')).toBe('Cistella de fruita');
  view.unmount();
  expect(conjuntImatge()).toEqual([]);
  headDeLAmfitrio();
});

/* S5 · Gestoria i la porta de tractors són privades: mai indexables. */
test.each(['/gestoria', '/gestoria/factures', '/tractors', '/tractors/aprovacions'])('S5 · %s porta noindex, nofollow i cap canonical', ruta => {
  render(tree());
  act(() => navigate(ruta));
  expect(valor('robots')).toBe('noindex, nofollow');
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(valor('og:url')).toBeNull();
});
test('S5 · routeAllowsIndex tanca gestoria i tractors també amb consulta o fragment', () => {
  for (const ruta of ['gestoria', '/gestoria/factures', 'gestoria?trimestre=3', '/tractors#aprovacio', 'tractors/']) {
    expect(routeAllowsIndex(ruta)).toBe(false);
  }
  expect(routeAllowsIndex('/mercat/producte')).toBe(true);
  expect(routeAllowsIndex('/gestoriana')).toBe(true);
});
