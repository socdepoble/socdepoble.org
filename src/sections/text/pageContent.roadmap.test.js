/**
 * Onada 4 (F2 de l'auditoria de Codex 261003_1903, P2) · El full de ruta
 * (/roadmap) no depén del domini de producció. Les 39 llavors actives
 * apuntaven a https://socdepoble.org/auditoria/llavor/<slug>: cap ruta de
 * l'app l'entén i, incrustada en un altre amfitrió (WordPress, Sollutia…), el
 * clic eixia de la instal·lació. Ara cada llavor porta una ruta de l'app,
 * relativa a l'arrel, que l'interceptor (hrefInternDeClic) passa al router.
 *
 * Es prova sobre el que pinta TextSection (resolRecursosDeHtml i
 * sanitizeHtml) i amb la funció real de l'interceptor, com la reproducció de
 * l'auditoria: hrefInternDeClic({ button: 0 }, ancora, '/comunitat').
 * La taula slug → destí, amb la justificació de cada llavor, és a
 * _wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_onada4_claude/F2_LLAVORS.txt.
 *
 * SECTIONS és la configuració de la navegació, no el router: les rutes viuen
 * a App.jsx. Per això les últimes proves munten l'app real (PedraSecaEmbed)
 * i hi fan clic: si es retira la ruta, el document de la Wiki o la secció
 * que justifica el destí, ho diuen elles.
 */
import { createElement } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { PAGE_COPY } from './pageContent.js';
import PedraSecaEmbed from '../../PedraSecaEmbed';
import { hrefInternDeClic } from '../../app/enllacosInterns.js';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { SECTIONS } from '../../config/sections.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { wikiManifest } from '../../data/wikiManifest.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

/* Com a App.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Ordre del Mestre (261007) · Bàscula descartada per ara: «anotar-la
   exclusivament a la fulla de ruta (roadmap)». Eren 39; la Bàscula de
   Cooperativa és la 40a llavor activa, i porta al registre de llavors. */
const ACTIVES = 40;
const COMENTADES = 4;
const ORIGEN_FICTICI = 'http://x.invalid';
/* Cap llavor és expressament externa. Si un dia n'hi ha una, va ací amb
   l'href exacte i la raó al F2_LLAVORS.txt; la resta han de ser de l'app. */
const EXTERNES_DECLARADES = Object.freeze(new Set());

const REGISTRE_DE_LLAVORS = '/wikidepoble?item=00_full_de_ruta';
/* Les dues llavors amb pàgina pròpia vigent; la resta van al registre.
   Gauntlet 261016_1530 (Bloc 3.6.3; F64) · Actualitzada a posta: la
   Calculadora de Risc és una secció del manifest, que passa de /iaia a
   /anima (/iaia és ara la fitxa de la IAIA MarIA). */
const DESTINS_PROPIS = Object.freeze({
  'Calculadora de Risc (Maduresa IA)': '/anima',
  'Llei Orgull Rural Visual': '/wikidepoble?item=identitat_visual'
});

/* Absolut: amb esquema (https:, mailto:…) o relatiu al protocol (//host). */
const esAbsolut = (href) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');

/* L'HTML es llig en un document inert (DOMParser): cap script ni recurs del
   document viu, i les <a> es consulten allà mateix. */
// El parseig no passa per sanitizeHtml: lleva els comentaris on viuen les 4 llavors retirades.
const parseja = (html) => new DOMParser().parseFromString(html, 'text/html').body;

/* Les <a> que es pinten: l'HTML tal com el posa TextSection a l'article. */
const ancoresActives = () => [...parseja(sanitizeHtml(resolRecursosDeHtml(PAGE_COPY.roadmap.html))).querySelectorAll('a')];

/* Les <a> de dins dels comentaris HTML: no es pinten, però són la mateixa superfície. */
function ancoresComentades() {
  const arrel = parseja(PAGE_COPY.roadmap.html);
  const recorregut = document.createTreeWalker(arrel, NodeFilter.SHOW_COMMENT);
  const ancores = [];
  while (recorregut.nextNode()) ancores.push(...parseja(recorregut.currentNode.data).querySelectorAll('a'));
  return ancores;
}

const textDe = (ancora) => ancora.textContent.trim();

test(`conserva les ${ACTIVES} llavors actives i les 4 comentades, i cap porta el domini de producció`, () => {
  const actives = ancoresActives();
  const comentades = ancoresComentades();
  expect(actives).toHaveLength(ACTIVES);
  expect(comentades).toHaveLength(COMENTADES);
  expect(PAGE_COPY.roadmap.html.match(/socdepoble\.org[^"\s]*/gi) ?? []).toEqual([]);
  const absolutes = [...actives, ...comentades]
    .map((ancora) => ancora.getAttribute('href'))
    .filter((href) => esAbsolut(href) && !EXTERNES_DECLARADES.has(href));
  expect(absolutes).toEqual([]);
});

test('l’interceptor passa cada llavor activa al router, amb base declarada i sense', () => {
  const rebutjades = ancoresActives()
    .filter((ancora) => hrefInternDeClic({ button: 0 }, ancora, '/comunitat') === null)
    .map(textDe);
  expect(rebutjades).toEqual([]);
  for (const ancora of ancoresActives()) {
    const href = ancora.getAttribute('href');
    expect(hrefInternDeClic({ button: 0 }, ancora, '/comunitat')).toBe(href);
    expect(hrefInternDeClic({ button: 0 }, ancora)).toBe(href);
  }
});

test('cada destí és una ruta de l’app i, si obri la Wiki, un document que existix', () => {
  const rutes = new Set(SECTIONS.map((seccio) => seccio.path));
  const documents = new Set(wikiManifest.items.map((item) => item.id));
  for (const ancora of [...ancoresActives(), ...ancoresComentades()]) {
    const url = new URL(ancora.getAttribute('href'), ORIGEN_FICTICI);
    // Una URL absoluta a un altre origen no és una ruta de l'app, encara que el camí ho pareixca.
    expect(url.origin, textDe(ancora)).toBe(ORIGEN_FICTICI);
    expect(rutes.has(url.pathname), `${textDe(ancora)} → ${url.pathname}`).toBe(true);
    // El sanejador lleva els id: un #fragment no trobaria on parar.
    expect(url.hash).toBe('');
    if (url.pathname === '/wikidepoble') {
      expect([...url.searchParams.keys()]).toEqual(['item']);
      expect(documents.has(url.searchParams.get('item')), url.searchParams.get('item')).toBe(true);
    } else {
      expect(url.search).toBe('');
    }
  }
});

test('el registre de llavors per defecte; pàgina pròpia només on n’hi ha una de vigent', () => {
  const destins = Object.fromEntries(ancoresActives().map((ancora) => [textDe(ancora), ancora.getAttribute('href')]));
  expect(Object.keys(destins)).toHaveLength(ACTIVES);
  for (const [text, href] of Object.entries(destins)) {
    expect(href, text).toBe(DESTINS_PROPIS[text] ?? REGISTRE_DE_LLAVORS);
  }
  // Les comentades són llavors retirades per l'ADR-2026-08: el registre les arxiva.
  expect(ancoresComentades().map((ancora) => ancora.getAttribute('href'))).toEqual(Array(COMENTADES).fill(REGISTRE_DE_LLAVORS));
});

/* ── De punta a punta, amb l'app real ─────────────────────────────────────
   Cada destí distint, amb l'encapçalament que en justifica l'elecció (§2 del
   F2_LLAVORS.txt): el registre de llavors, la secció «3. Llei de l'Orgull
   Rural» d'identitat_visual i «4. El Càlcul del Risc» de l'Ànima (/anima des
   del Bloc 3.6.3; abans /iaia). */
const PAGINA_DEL_DESTI = Object.freeze({
  [REGISTRE_DE_LLAVORS]: '🗺️ Full de ruta de Sóc de Poble',
  '/wikidepoble?item=identitat_visual': "3. Llei de l'Orgull Rural",
  '/anima': '4. El Càlcul del Risc (La Por Orgànica)'
});
/* Cada espera caduca abans que la prova: si falla, falla amb el missatge de
   l'asserció, no amb un «timed out» de vitest. */
const ESPERA = { timeout: 6000 };
const LIMIT_DE_PROVA = 20000;

/* Backend fals sense sessió i sense xarxa, com muntaSenseSessio d'App.test.jsx. */
async function muntaLApp(config, cos) {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
  try {
    render(createElement(PedraSecaEmbed, { config }));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* La primera llavor del full de ruta pintat que porta eixe destí. */
async function llavorCap(desti) {
  let ancora = null;
  await waitFor(() => {
    const pintades = [...document.querySelectorAll('article.cms-preview a')];
    expect(pintades).toHaveLength(ACTIVES);
    ancora = pintades.find((a) => a.getAttribute('href') === desti) ?? null;
    expect(ancora, desti).not.toBeNull();
  }, ESPERA);
  return ancora;
}

/* Un encapçalament amb eixe text exacte, i cap pàgina de «no trobat». */
const paginaPintada = (encapcalament) => waitFor(() => {
  const textos = [...document.querySelectorAll('h1, h2, h3, h4')].map((h) => h.textContent.trim());
  expect(textos).toContain(encapcalament);
  expect(document.body.textContent).not.toContain('Ací no hi ha res');
}, ESPERA);

test.each(Object.entries(PAGINA_DEL_DESTI))('incrustada sense base (router en memòria, com l’enxufe de WordPress), el clic a %s pinta la seua pàgina', async (desti, encapcalament) => {
  await muntaLApp({ routerType: 'memory', rutaInicial: '/roadmap' }, async () => {
    const ancora = await llavorCap(desti);
    // false: l'interceptor l'ha cancel·lat i l'ha passat al router, no a l'amfitrió.
    expect(fireEvent.click(ancora)).toBe(false);
    await paginaPintada(encapcalament);
  });
}, LIMIT_DE_PROVA);

test('amb una base declarada (/comunitat), una llavor porta a /comunitat/wikidepoble?item=00_full_de_ruta amb una sola entrada', async () => {
  window.history.replaceState(null, '', '/comunitat/roadmap');
  await muntaLApp({ routerType: 'browser', basename: '/comunitat' }, async () => {
    const ancora = await llavorCap(REGISTRE_DE_LLAVORS);
    const empenta = vi.spyOn(window.history, 'pushState');
    expect(fireEvent.click(ancora)).toBe(false);
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe('/comunitat' + REGISTRE_DE_LLAVORS), ESPERA);
    expect(empenta).toHaveBeenCalledTimes(1);
    await paginaPintada(PAGINA_DEL_DESTI[REGISTRE_DE_LLAVORS]);
  });
}, LIMIT_DE_PROVA);


/* Gauntlet 261016_1530 (Bloc 3.6.3; F64) · Actualitzada a posta: l'àlies
   històric del manifest porta a /anima, no a /iaia (la fitxa de la IAIA). */
test.each(['/ia', '/ia?origen=full&item=prova'])('l’àlies històric %s conserva la consulta i obri el manifest real, a /anima', async (ruta) => {
  window.history.replaceState(null, '', ruta);
  await muntaLApp({ routerType: 'browser' }, async () => {
    const sufix = ruta.slice('/ia'.length);
    await waitFor(() => expect(window.location.pathname + window.location.search + window.location.hash).toBe('/anima' + sufix), ESPERA);
    await paginaPintada(PAGINA_DEL_DESTI['/anima']);
  });
}, LIMIT_DE_PROVA);
