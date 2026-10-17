import React from 'react';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
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
/* Gauntlet 261016 (Bloc 3.5.1) · Les tres rutes canòniques obrin la fitxa de /gent, /empresa i /grup:
   la mateixa reserva, i indexables com elles. */
test.each(['/javillinares', '/socdepoble', '/rentonar'])('la ruta canònica %s té la reserva de la fitxa, «Perfil», i és indexable', (ruta) => {
  render(tree());
  act(() => navigate(ruta));
  expect(document.title).toBe('Perfil | Sóc de Poble');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]').href).toMatch(new RegExp(`${ruta}$`));
});
/* Gauntlet 261016_1530 (Bloc 3.6.3; F64 i F65) · /iaia és la fitxa de la IAIA MarIA: la reserva de les
   fitxes, «Perfil», indexable i amb la seua URL. El manifest, a /anima, no en té cap: el títol el posa
   la seua pàgina (TextSection), com quan vivia a /iaia. */
test('Bloc 3.6.3 · /iaia té la reserva de la fitxa, «Perfil», i és indexable; /anima, cap reserva', () => {
  render(tree());
  act(() => navigate('/iaia'));
  expect(document.title).toBe('Perfil | Sóc de Poble');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]').href).toMatch(/\/iaia$/);
  act(() => navigate('/anima'));
  expect(document.title).not.toBe('Perfil | Sóc de Poble');
  expect(document.querySelector('meta[name="robots"]')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]').href).toMatch(/\/anima$/);
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

/* Bloc 3.5.5 (Gauntlet 261016) · La targeta de WhatsApp. WhatsApp i les xarxes
   no executen JavaScript: només compta l'HTML que servix el lloc, i eixe HTML és
   index.html per a totes les rutes. Ací es fixa el conjunt que han de llegir
   sense JS, i que useSEO no el desfà quan el navegador sí que l'executa.
   Correcció del Gauntlet (261016): esta prova exigia un og:url fix a la
   portada. Era un defecte: Facebook, Messenger i LinkedIn prenen og:url com
   l'URL canònica de l'objecte, i amb un HTML servit per a totes les rutes
   plegaven cada enllaç profund a la portada. Ara n'exigix l'absència, com el
   canonical: el rastrejador pren l'URL que ha demanat, i useSEO el posa per
   ruta al navegador (última prova del bloc). */
const ARREL = process.cwd();
const INDEX = readFileSync(path.join(ARREL, 'index.html'), 'utf8');
const capcaleraEstatica = () => new DOMParser().parseFromString(INDEX, 'text/html').head;
const ETIQUETES_XARXES = ['description', 'og:title', 'og:description', 'og:image', 'og:image:type', 'og:image:width',
  'og:image:height', 'og:image:alt', 'og:type', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
const etiquetesDe = (head, clau) => [...head.querySelectorAll(`meta[property="${clau}"], meta[name="${clau}"]`)];
const etiquetesXarxes = () => Object.fromEntries(ETIQUETES_XARXES.map(clau => [clau, valor(clau)]));

test('Bloc 3.5.5 · la capçalera estàtica porta, sense JS, títol, descripció, og:* amb la imatge absoluta de 1200×630 i la targeta gran, sense og:url ni canonical', () => {
  const head = capcaleraEstatica();
  expect(head.querySelector('title').textContent.trim()).toBe('Sóc de Poble');
  for (const clau of ETIQUETES_XARXES) {
    const nodes = etiquetesDe(head, clau);
    expect(nodes, clau).toHaveLength(1);
    expect(nodes[0].content.trim(), clau).not.toBe('');
  }
  const contingut = clau => etiquetesDe(head, clau)[0].content;
  const imatge = new URL(contingut('og:image'));
  expect(imatge.origin).toBe('https://socdepoble.org');
  expect(existsSync(path.join(ARREL, 'public', imatge.pathname)), imatge.pathname).toBe(true);
  expect([contingut('og:image:width'), contingut('og:image:height')]).toEqual(['1200', '630']);
  expect(contingut('twitter:image')).toBe(imatge.href);
  expect(contingut('twitter:card')).toBe('summary_large_image');
  // Ni og:url ni canonical estàtics: este HTML es servix a totes les rutes i els posa useSEO (comentari d'index.html).
  expect(etiquetesDe(head, 'og:url')).toHaveLength(0);
  expect(head.querySelector('link[rel="canonical"]')).toBeNull();
});

/* Les reescriptures de Vercel van després dels fitxers que existixen, però un
   actiu absent (una imatge que no ha entrat al build, un chunk d'un build vell)
   rebia index.html amb un 200 i text/html. És el que va respondre socdepoble.org
   per a la imatge OG el 261016 (Firebase Hosting, desplegament del 260611, amb
   la mateixa regla de captura total). Les carpetes d'actius ja no passen per
   l'SPA: un absent hi és un 404. Amb un sol grup sense nom, el patró de
   path-to-regexp és la mateixa expressió regular ancorada. */
test('Bloc 3.5.5 · la reescriptura de l’SPA (vercel.json) porta les rutes a index.html i no captura els actius estàtics', () => {
  const { rewrites } = JSON.parse(readFileSync(path.join(ARREL, 'vercel.json'), 'utf8'));
  const capturen = ruta => rewrites.filter(({ source }) => new RegExp(`^${source}$`).test(ruta)).map(r => r.destination);
  for (const ruta of ['/', '/mur', '/mur/123', '/javillinares', '/socdepoble', '/rentonar', '/gent/javi.llinares', '/assetsx']) {
    expect(capturen(ruta), ruta).toEqual(['/index.html']);
  }
  for (const ruta of ['/assets/system/ui/og-socdepoble-1200x630.png', '/assets/system/ui/no-hi-es.png', '/assets/index-BGERpNWR.js',
    '/fonts/noto-sans.css']) {
    expect(capturen(ruta), ruta).toEqual([]);
  }
});

test('Bloc 3.5.5 · sobre la capçalera real, useSEO conserva el conjunt de les xarxes, reescriu og:url per ruta i en desmuntar el torna intacte', () => {
  // Títol i meta de la capçalera real; els fulls i els scripts no fan res en jsdom.
  document.head.replaceChildren(...[...capcaleraEstatica().children]
    .filter(node => ['TITLE', 'META'].includes(node.tagName)).map(node => document.importNode(node, true)));
  const abans = etiquetesXarxes();
  const view = render(tree());
  act(() => navigate('/mur'));
  for (const clau of ETIQUETES_XARXES) expect(valor(clau), clau).toBeTruthy();
  for (const clau of ['og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:image', 'twitter:card']) {
    expect(valor(clau), clau).toBe(abans[clau]);
  }
  expect(valor('og:url')).toMatch(/\/mur$/);
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelector('link[rel="canonical"]').href).toBe(valor('og:url'));
  // Una ruta privada no declara cap URL canònica, però la targeta continua sencera.
  act(() => navigate('/notes'));
  expect(valor('og:url')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect([valor('og:image'), valor('twitter:card')]).toEqual([abans['og:image'], abans['twitter:card']]);
  view.unmount();
  expect(etiquetesXarxes()).toEqual(abans);
  expect(valor('og:url')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.title).toBe('Sóc de Poble');
});
