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
import { ATRIBUT_SSR, CAP_SOCIAL_BASE, ORIGEN_SOCIAL_PER_DEFECTE } from '../config/imatgeSocial.js';
import { origenPublic } from '../config/origenPublic.js';
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
  const samarreta = router.currentPath === '/mercat/samarreta-socdepoble';
  return <><RouteSEO />{samarreta && <Samarreta />}{!samarreta && router.currentPath.startsWith('/mercat/') && <Product />}
    {router.currentPath.startsWith('/foto/') && <Foto />}</>;
}
function Product() { useSEO({ title: 'Producte', description: 'Descripció producte', jsonLd: { name: 'Producte' } }); return null; }
/* Pla 261027_1154 (P1-61) · S3. La fitxa de la samarreta amb la primera foto
   de la galeria de producció (app_content.marketItems: 7 fotos, la primera
   01-chica-jersey.png; imageSrc i avatar_url són el logotip SVG). */
const CAMI_SAMARRETA = '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png';
const DESCRIPCIO_SAMARRETA = 'Mapa del tresor sobre cotó resistent. La imatge complementa el text, no el substituïx.';
function Samarreta() {
  useSEO({ title: 'Samarreta Sóc de Poble', description: DESCRIPCIO_SAMARRETA, image: { url: CAMI_SAMARRETA, alt: 'Samarreta Sóc de Poble' },
    type: 'Product', ogType: 'product', jsonLd: { name: 'Samarreta Sóc de Poble' } });
  return null;
}
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
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
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
  /* Pla 261027_1154 (P1-61) · S3. La descripció de reserva és la genèrica
     (CAP_SOCIAL_BASE), no la del head capturat: abans esperava la del
     document ('Descripció base'). Desmuntar-ho tot sí que torna la del
     document (headDeLAmfitrio). */
  expect(document.querySelector('meta[name="description"]').content).toBe(CAP_SOCIAL_BASE.description);
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
/* Pla 261027_1154 (P1-61) · S3. La targeta genèrica és CAP_SOCIAL_BASE.image
   sencera: URL sobre origenPublic() (en jsdom, l'origen de la pàgina), MIME,
   mides i alt, també a twitter:*. Abans seoHead la saltava i quedava el
   conjunt del document (CONJUNT_BASE, amb un alt de prova i sense MIME);
   les proves d'S6 que esperaven CONJUNT_BASE fixaven eixe salt i ara esperen
   la targeta. CONJUNT_BASE continua al head per provar que no s'hereta.
   Revisió adversarial (261027) · Sobre origenPublic() només si és https; si
   no (jsdom, http://localhost:3000, com el dev), la d'index.html, a
   socdepoble.org: la mateixa regla que la imatge triada. */
const origenDeLaTargeta = () => (/^https:\/\//i.test(origenPublic()) ? origenPublic() : ORIGEN_SOCIAL_PER_DEFECTE);
const targetaGenerica = () => {
  const url = new URL(CAP_SOCIAL_BASE.image.url, origenDeLaTargeta()).href;
  const { type, width, height, alt } = CAP_SOCIAL_BASE.image;
  return { 'og:image': url, 'og:image:type': type, 'og:image:width': width, 'og:image:height': height, 'og:image:alt': alt,
    'twitter:image': url, 'twitter:image:alt': alt };
};
const esLaTargetaGenerica = () => {
  const files = conjuntImatge();
  expect(new Set(files.map(([clau]) => clau)).size, 'cap propietat duplicada').toBe(files.length);
  expect(Object.fromEntries(files)).toEqual(targetaGenerica());
  expect(files.map(([clau]) => clau).find(clau => clau.startsWith('og:image'))).toBe('og:image');
  expect(valor('twitter:card')).toBe('summary_large_image');
};

test('S6 · una imatge pròpia sense mides ni alt no hereta les del logotip, i en canviar de ruta torna la targeta genèrica sencera', () => {
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
  esLaTargetaGenerica();
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
  'S6 · una SVG o una URL que les xarxes no baixen (%j) no és imatge social: queda la targeta genèrica', imatge => {
    ambConjuntBase();
    imatgeDeLaVista = imatge;
    render(tree());
    act(() => navigate('/foto/1'));
    esLaTargetaGenerica();
  });
/* Onada 8 (261009) · La marca de Sóc de Poble no és mai imatge social. Abans
   era SVG i ja eixia el conjunt base; ara és PNG i ha de continuar eixint.
   El logo_url de l'entitat pilot és el que la fitxa /empresa/socdepoble passa
   a useSEO (identitatsSeed.js → localPerfils.js → PerfilPublicSection.jsx). */
test.each([ENTITATS_SEED[0].logo_url, DEFAULT_AUTHOR.avatarUrl, DEFAULT_AUTHOR.logo.clar, DEFAULT_AUTHOR.logo.fosc,
  ...Object.values(MARQUES_SVG_ANTIGUES), 'https://example.org/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  { url: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png', width: 985, height: 256, type: 'image/png', alt: 'Logotip' }])(
  'Onada 8 · la marca de l’entitat (%j) no és imatge social: queda la targeta genèrica', imatge => {
    ambConjuntBase();
    imatgeDeLaVista = imatge;
    render(tree());
    act(() => navigate('/foto/1'));
    // Ni l'URL ni les mides (985x256) ni l'alt de la marca: la targeta sencera.
    esLaTargetaGenerica();
  });
/* Si tornara a ser SVG, la prova d'amunt la passaria el filtre dels SVG i no
   la guarda de la marca. */
test('Onada 8 · el logo_url de l’entitat pilot és la marca en PNG', () => {
  expect(ENTITATS_SEED[0].logo_url).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
});
test('S6 · la imatge base passada a mà (TextSection) dona la targeta genèrica sencera', () => {
  ambConjuntBase();
  imatgeDeLaVista = '/assets/system/ui/og-socdepoble-1200x630.png';
  render(tree());
  act(() => navigate('/foto/1'));
  esLaTargetaGenerica();
});
/* Pla 261027_1154 (P1-61) · S3. IMATGE_BASE de useSEO.js és la mateixa
   targeta que CAP_SOCIAL_BASE (el literal el fixa pwa/manifest.test.js contra
   index.html). */
test('S3 · la targeta de useSEO és CAP_SOCIAL_BASE.image', () => {
  render(tree());
  act(() => navigate('/mur'));
  expect(new URL(valor('og:image')).pathname).toBe(CAP_SOCIAL_BASE.image.url);
  esLaTargetaGenerica();
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

/* Bloc 3.5.5 (Gauntlet 261016) · La targeta d'un enllaç compartit en una app de
   missatgeria. Les apps de missatgeria i les xarxes no executen JavaScript:
   només compta l'HTML que servix el lloc, i eixe HTML és index.html per a
   totes les rutes. Ací es fixa el conjunt que han de llegir
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
  /* Pla 261027_1154 (P1-61) · S3. A l'origen de producció, que és el que
     servix index.html. Abans passava a l'origen de jsdom perquè seoHead
     saltava la targeta i deixava la d'index.html; ara l'escriu sencera sobre
     origenPublic(), i a socdepoble.org és la mateixa, byte a byte. */
  vi.stubEnv('VITE_CANONICAL_URL', ORIGEN_SOCIAL_PER_DEFECTE);
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

/* Pla 261027_1154 (P1-61) · S3 (AT8). Entrada directa per la samarreta amb
   el head que servirà el prerender: index.html amb el bloc de la ruta
   substituït, cada node propi marcat amb ATRIBUT_SSR i el JSON-LD Product
   també amb data-sdp-seo. Abans, seoHead en feia la base (baseline ||=
   capture()) i la foto, la descripció, l'og:type i el JSON-LD del producte
   quedaven a /mur, /xat i a totes les rutes següents. */
const FOTO_SAMARRETA = new URL(CAMI_SAMARRETA, ORIGEN_SOCIAL_PER_DEFECTE).href;
const CLAUS_DE_LA_RUTA = new Set(['description', 'og:title', 'og:description', 'og:type', 'og:image', 'og:image:type',
  'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description',
  'twitter:image', 'twitter:image:alt']);
const BLOC_SERVIT = `
  <title ${ATRIBUT_SSR}>Samarreta Sóc de Poble | Sóc de Poble</title>
  <meta name="description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <link rel="canonical" href="https://socdepoble.org/mercat/samarreta-socdepoble" ${ATRIBUT_SSR}>
  <meta property="og:url" content="https://socdepoble.org/mercat/samarreta-socdepoble" ${ATRIBUT_SSR}>
  <meta property="og:title" content="Samarreta Sóc de Poble | Sóc de Poble" ${ATRIBUT_SSR}>
  <meta property="og:description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta property="og:type" content="product" ${ATRIBUT_SSR}>
  <meta property="og:image" content="${FOTO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta property="og:image:type" content="image/jpeg" ${ATRIBUT_SSR}>
  <meta property="og:image:width" content="1024" ${ATRIBUT_SSR}>
  <meta property="og:image:height" content="1024" ${ATRIBUT_SSR}>
  <meta property="og:image:alt" content="Samarreta Sóc de Poble" ${ATRIBUT_SSR}>
  <meta property="product:price:amount" content="15.00" ${ATRIBUT_SSR}>
  <meta property="product:price:currency" content="EUR" ${ATRIBUT_SSR}>
  <meta name="twitter:card" content="summary_large_image" ${ATRIBUT_SSR}>
  <meta name="twitter:title" content="Samarreta Sóc de Poble | Sóc de Poble" ${ATRIBUT_SSR}>
  <meta name="twitter:description" content="${DESCRIPCIO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta name="twitter:image" content="${FOTO_SAMARRETA}" ${ATRIBUT_SSR}>
  <meta name="twitter:image:alt" content="Samarreta Sóc de Poble" ${ATRIBUT_SSR}>
  <script type="application/ld+json" data-sdp-seo="true" ${ATRIBUT_SSR}>{"@context":"https://schema.org","@type":"Product","name":"Samarreta Sóc de Poble","image":"${FOTO_SAMARRETA}"}</script>`;
/* Les metes i el JSON-LD WebSite d'index.html que no són de la ruta (sense marca) més el bloc servit. */
function ambHeadServitDeLaSamarreta() {
  const delLloc = [...capcaleraEstatica().querySelectorAll('meta, script[type="application/ld+json"]')]
    .filter(node => !CLAUS_DE_LA_RUTA.has(node.getAttribute('property') || node.getAttribute('name')));
  const servit = new DOMParser().parseFromString(`<head>${BLOC_SERVIT}</head>`, 'text/html').head;
  document.head.replaceChildren(...[...delLloc, ...servit.children].map(node => document.importNode(node, true)));
}
/* Totes les metes amb nom o propietat, ordenades; cada etiqueta de la ruta, una sola vegada. */
const metesDe = head => {
  const files = [...head.querySelectorAll('meta[name], meta[property]')]
    .map(node => `${node.getAttribute('property') || node.getAttribute('name')}=${node.content}`).sort();
  const claus = files.map(fila => fila.split('=')[0]).filter(clau => CLAUS_DE_LA_RUTA.has(clau) || clau === 'robots' || clau === 'og:url');
  expect(new Set(claus).size, 'cap etiqueta de la ruta duplicada').toBe(claus.length);
  return files;
};
const jsonLd = () => [...document.head.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)['@type']);
const senseRastreDelProducte = () => {
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`), 'cap node servit').toBeNull();
  expect(document.head.querySelector('meta[property^="product:"]')).toBeNull();
  expect(document.head.querySelector('script[data-sdp-seo]')).toBeNull();
  expect(jsonLd()).toEqual(['WebSite']);
  expect(['description', 'og:description', 'twitter:description'].map(valor)).toEqual(Array(3).fill(CAP_SOCIAL_BASE.description));
  expect(valor('og:type')).toBe('website');
  esLaTargetaGenerica();
};

test('S3 · AT8 · entrada amb el head servit de la samarreta → /mur → /xat → arrere → desmuntar: cap rastre del producte', () => {
  vi.stubEnv('VITE_CANONICAL_URL', ORIGEN_SOCIAL_PER_DEFECTE);
  ambHeadServitDeLaSamarreta();
  const servit = document.head.innerHTML;
  const view = render(<MemoryRouter rutaInicial="/mercat/samarreta-socdepoble"><Page /></MemoryRouter>);
  /* Revisió adversarial (261027) · A la ruta que declara el head servit (el
     seu canonical), el head és el del servidor, byte a byte: la primera foto
     amb el seu MIME i mides reals, l'og:type 'product', product:price i el
     JSON-LD Product. Ni RouteSEO ni la fitxa no el substituïxen. */
  expect(document.head.innerHTML).toBe(servit);
  expect(document.title).toBe('Samarreta Sóc de Poble | Sóc de Poble');
  expect([valor('og:image'), valor('twitter:image')]).toEqual([FOTO_SAMARRETA, FOTO_SAMARRETA]);
  expect([valor('og:image:alt'), valor('og:image:type'), valor('og:image:width')]).toEqual(['Samarreta Sóc de Poble', 'image/jpeg', '1024']);
  expect([valor('og:type'), valor('product:price:amount')]).toEqual(['product', '15.00']);
  expect(valor('description')).toBe(DESCRIPCIO_SAMARRETA);
  expect(jsonLd().sort()).toEqual(['Product', 'WebSite']);
  metesDe(document.head);
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  // /mur, sense imatge pròpia: la targeta genèrica sencera, la descripció genèrica, website i cap JSON-LD Product.
  act(() => navigate('/mur'));
  expect(document.title).toBe('Sóc de Poble');
  senseRastreDelProducte();
  expect(valor('og:url')).toBe('https://socdepoble.org/mur');
  expect(document.querySelector('link[rel="canonical"]').href).toBe('https://socdepoble.org/mur');
  metesDe(document.head);
  // /xat, privada: noindex i la targeta genèrica; ni canonical ni og:url.
  act(() => navigate('/xat'));
  expect(document.title).toBe('Xat | Sóc de Poble');
  expect(valor('robots')).toBe('noindex, nofollow');
  senseRastreDelProducte();
  expect(valor('og:url')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  // Arrere: /mur torna genèrica, sense la foto de cap ruta anterior.
  act(() => navigate(-1));
  expect(valor('robots')).toBeNull();
  senseRastreDelProducte();
  // Desmuntar-ho tot: el head genèric, el mateix que servix index.html (CAP_SOCIAL_BASE), i res de la ruta.
  view.unmount();
  expect(metesDe(document.head)).toEqual(metesDe(capcaleraEstatica()));
  expect(document.title).toBe(CAP_SOCIAL_BASE.title);
  expect(document.head.querySelectorAll('title')).toHaveLength(1);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}], link[rel="canonical"], script[data-sdp-seo], meta[name="robots"], meta[property="og:url"]`))
    .toBeNull();
  expect(jsonLd()).toEqual(['WebSite']);
});

/* Pla 261027_1154 (P1-61) · Revisió adversarial (261027) · Entrada directa
   amb dades lentes o que no arriben. La fitxa es registra de seguida, sense
   títol ni imatge, mentre espera (ItemDetailSection), i RouteSEO hi posa la
   seua reserva. Abans, eixos dos registres substituïen el head servit pel
   genèric durant tota l'espera, i una càrrega fallida hi deixava «No trobat».
   A la ruta servida, el head és el del servidor; en eixir-ne, cap rastre; i en
   tornar-hi, el del client. */
let dadesDeLaFitxa = null;
function FitxaQueEspera() {
  useSEO(dadesDeLaFitxa || { title: null, description: '', image: null });
  return null;
}
function PaginaQueEspera() {
  const router = useRouter(); navigate = router.navigate;
  return <><RouteSEO />{router.currentPath === '/mercat/samarreta-socdepoble' && <FitxaQueEspera />}</>;
}
const arbreQueEspera = () => <MemoryRouter rutaInicial="/mercat/samarreta-socdepoble"><PaginaQueEspera /></MemoryRouter>;

test('Revisió 261027 · amb el head servit, ni la reserva de la ruta ni la fitxa que espera, ni «No trobat», no el toquen a la seua ruta', () => {
  vi.stubEnv('VITE_CANONICAL_URL', ORIGEN_SOCIAL_PER_DEFECTE);
  ambHeadServitDeLaSamarreta();
  const servit = document.head.innerHTML;
  dadesDeLaFitxa = null;
  const view = render(arbreQueEspera());
  expect(document.head.innerHTML).toBe(servit);
  dadesDeLaFitxa = { title: 'No trobat', description: '', image: null };
  view.rerender(arbreQueEspera());
  expect(document.head.innerHTML).toBe(servit);
  dadesDeLaFitxa = { title: 'Samarreta Sóc de Poble', description: DESCRIPCIO_SAMARRETA, image: { url: CAMI_SAMARRETA, alt: 'Samarreta Sóc de Poble' } };
  view.rerender(arbreQueEspera());
  expect(document.head.innerHTML).toBe(servit);
  expect([valor('og:type'), valor('og:image:type'), valor('product:price:amount')]).toEqual(['product', 'image/jpeg', '15.00']);
  // En eixir de la ruta servida, cap rastre del producte.
  act(() => navigate('/mur'));
  senseRastreDelProducte();
  // En tornar-hi, el <head> és el del client: la mateixa primera foto, sense cap node servit.
  act(() => navigate(-1));
  expect(document.title).toBe('Samarreta Sóc de Poble | Sóc de Poble');
  expect([valor('og:image'), valor('twitter:image'), valor('og:image:alt')]).toEqual([FOTO_SAMARRETA, FOTO_SAMARRETA, 'Samarreta Sóc de Poble']);
  expect(document.head.querySelector(`[${ATRIBUT_SSR}]`)).toBeNull();
  expect(document.head.querySelector('meta[property^="product:"]')).toBeNull();
  metesDe(document.head);
  view.unmount();
  dadesDeLaFitxa = null;
});

test('Revisió 261027 · desmuntar-ho tot sense eixir de la ruta servida deixa el head del servidor', () => {
  vi.stubEnv('VITE_CANONICAL_URL', ORIGEN_SOCIAL_PER_DEFECTE);
  ambHeadServitDeLaSamarreta();
  const servit = document.head.innerHTML;
  dadesDeLaFitxa = null;
  render(arbreQueEspera()).unmount();
  expect(document.head.innerHTML).toBe(servit);
  // Un muntatge nou hi torna a trobar el head servit, i a la seua ruta no el toca.
  const view = render(arbreQueEspera());
  expect(document.head.innerHTML).toBe(servit);
  act(() => navigate('/mur'));
  senseRastreDelProducte();
  view.unmount();
});

/* Revisió adversarial (261027) · L'origen de la targeta genèrica és el de la
   imatge triada: origenPublic() si és https (amb la base de l'amfitrió); si
   no, la d'index.html. El canònic i og:url continuen sent d'origenPublic(). */
test('Revisió 261027 · al servidor de dev (http) la targeta genèrica és la d’index.html; a un amfitrió https, la seua, amb la seua base', () => {
  ambConjuntBase();
  imatgeDeLaVista = null;
  const view = render(tree());
  act(() => navigate('/mur'));
  expect(origenPublic()).toMatch(/^http:\/\//);
  expect(valor('og:image')).toBe(new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_SOCIAL_PER_DEFECTE).href);
  expect(valor('twitter:image')).toBe(valor('og:image'));
  expect(valor('og:url')).toBe(`${origenPublic()}/mur`);
  // La targeta passada a mà sobre l'origen de la pàgina (com TextSection) també és la base.
  imatgeDeLaVista = new URL(CAP_SOCIAL_BASE.image.url, origenPublic()).href;
  act(() => navigate('/foto/1'));
  esLaTargetaGenerica();
  expect(valor('og:image')).toBe(new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_SOCIAL_PER_DEFECTE).href);
  view.unmount();
  vi.stubEnv('VITE_CANONICAL_URL', 'https://amfitrio.example');
  state.asset = (cami) => `/wp-content/plugins/socdepoble/dist${cami}`;
  try {
    const altra = render(tree());
    act(() => navigate('/mur'));
    expect(valor('og:image')).toBe(`https://amfitrio.example/wp-content/plugins/socdepoble/dist${CAP_SOCIAL_BASE.image.url}`);
    expect(valor('og:image:type')).toBe(CAP_SOCIAL_BASE.image.type);
    altra.unmount();
  } finally {
    state.asset = (cami) => cami;
  }
});

test('Revisió 261027 · una URL d’imatge que no s’analitza no penja la vista: la targeta genèrica', () => {
  imatgeDeLaVista = 'http://[';
  render(tree());
  act(() => navigate('/foto/1'));
  esLaTargetaGenerica();
});
