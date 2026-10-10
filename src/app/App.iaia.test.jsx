/**
 * Onada 10 (261010; decisió del Mestre del 261010) · A /iaia, dins del bloc
 * blanc de l'H1, el botó gran «Anar al xat», que entra directe al xat amb la
 * IAIA MarIA. Es prova amb l'app de veres (PedraSecaEmbed), perquè la ruta és
 * TextRoute, d'App.jsx:
 *
 *  · el botó és la porta gran i blava de Pedra Seca (PortaDePagina), un sol
 *    enllaç amb eixe nom, dins de header.page-title > div.page-title-accio i
 *    darrere de l'H1; cap div.sdp-pagina-accio nou;
 *  · el destí és el de la fila «IAIA MarIA» de la llista del Xat en cada mode
 *    de dades (sections/xat/useObriXatPerDefecte.js · rutaDelXatDeLaIAIA);
 *  · en llavor, el clic acaba a la conversa «IAIA MarIA» de la llavor (el
 *    port del xat és ací el magatzem local, que en eixe mode fa de servidor);
 *  · [DEFECTE] en remot i sense sessió, el clic acaba a l'entrada i no a la
 *    conversa de mostra que el convidat veu a la llista: pendent del Mestre;
 *  · cap altra pàgina de text guanya el bloc de l'acció (Llei del Píxel).
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { BENVINGUDA_IAIA, IAIA_ID } from '../data/identitatsSeed.js';
import { localXat, reiniciaLocalXat } from '../data/localXat.js';
import { XAT_SEED_IDS } from '../data/xatSeed.js';
import { RUTA_XAT_DE_LA_IAIA } from '../sections/xat/useObriXatPerDefecte.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import fontApp from './App.jsx?raw';

/* Com a App.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  reiniciaLocalXat();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const CLASSE = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';
const DIRECTE = `/xat?amb=${IAIA_ID}`;
/* Cada espera caduca abans que la prova: si falla, falla amb la seua asserció. */
const ESPERA = { timeout: 8000 };
const LIMIT_DE_PROVA = 30000;
/* Els mètodes del xat del port: en llavor i en local els servix el magatzem local. */
const METODES_DEL_XAT = [
  'loadFils', 'loadMissatges', 'enviaMissatge', 'marcaLlegit', 'creaFilDirecte', 'obriFilDePagina',
  'carregaMembres', 'subscribeToXat', 'unsubscribeFromXat'
];

/* Backend fals sense sessió ni xarxa, com muntaSenseSessio d'App.test.jsx. */
async function muntaLApp(ruta, config, cos, backendExtra = {}) {
  vi.stubGlobal('innerWidth', 1280);
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
    getRuntimeDataMode: () => config.dataMode,
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    ...backendExtra
  });
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser', ...config }} />);
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* El bloc blanc del títol de la pàgina, quan ja porta eixe H1. */
async function capcaleraDe(titol) {
  let capcalera = null;
  await waitFor(() => {
    capcalera = document.querySelector('header.page-title');
    expect(capcalera?.querySelector('h1')?.textContent).toBe(titol);
  }, ESPERA);
  return capcalera;
}

const fillsDe = (capcalera) => [...capcalera.children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
const ubicacio = () => window.location.pathname + window.location.search;

describe('/iaia · el botó «Anar al xat» dins del bloc de l’H1', () => {
  test.each([
    ['seed', DIRECTE],
    ['local', DIRECTE],
    ['remote', RUTA_XAT_DE_LA_IAIA]
  ])('amb dataMode %s: la porta gran i blava, darrere de l’H1, cap a %s', async (dataMode, desti) => {
    await muntaLApp('/iaia', { dataMode }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const fills = fillsDe(capcalera);
      expect(fills.filter((fill) => fill === 'DIV.page-title-accio')).toHaveLength(1);
      expect(fills.indexOf('DIV.page-title-accio')).toBeGreaterThan(fills.indexOf('H1'));
      const bloc = capcalera.querySelector(':scope > .page-title-accio');
      expect(bloc.children).toHaveLength(1);
      const boto = bloc.querySelector(':scope > a');
      expect([boto.className, boto.getAttribute('href'), boto.textContent]).toEqual([CLASSE, desti, 'Anar al xat']);
      expect(boto.hasAttribute('style')).toBe(false);
      /* Un sol control amb eixe nom a tota l'app, i cap botó repetit al final. */
      expect(screen.getAllByRole('link', { name: 'Anar al xat' })).toEqual([boto]);
      expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
      /* El cos de la pàgina és el de sempre. */
      expect(document.querySelector('article.cms-preview h3').textContent).toBe('El Despertar de la Nina de Silici');
    });
  }, LIMIT_DE_PROVA);

  test('en llavor, el clic acaba a la conversa «IAIA MarIA» de la llista del Xat', async () => {
    const xatLocal = Object.fromEntries(METODES_DEL_XAT.map((nom) => [nom, vi.fn((...args) => localXat[nom](...args))]));
    await muntaLApp('/iaia', { dataMode: 'seed' }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const boto = capcalera.querySelector('.page-title-accio > a');
      /* La llista del xat ja porta la fila de la IAIA: és el fil de la llavor. */
      await waitFor(() => expect(xatLocal.loadFils).toHaveBeenCalled(), ESPERA);
      fireEvent.click(boto);
      await waitFor(() => expect(ubicacio()).toBe(`/xat/${XAT_SEED_IDS.filIaia}`), ESPERA);
      expect(xatLocal.creaFilDirecte.mock.calls.map(([id, titol]) => [id, titol])).toEqual([[IAIA_ID, null]]);
      expect(xatLocal.obriFilDePagina).not.toHaveBeenCalled();
      /* La conversa oberta és la seua: la bombolla de benvinguda de la IAIA de la llavor. */
      await waitFor(() => {
        const bombolles = [...document.querySelectorAll('.sdp-xat-bombolla__text')].map((bombolla) => bombolla.textContent);
        expect(bombolles).toEqual([BENVINGUDA_IAIA]);
      }, ESPERA);
      expect(document.body.textContent).not.toContain('Ací no hi ha res');
    }, xatLocal);
  }, LIMIT_DE_PROVA);

  /* [DEFECTE] Revisió de l'Onada 10 (261010) · En remot i sense sessió, la
     fila «IAIA MarIA» que el convidat veu a la llista del Xat és la conversa
     de mostra (FakeChatOnboarding), però el botó de /iaia no hi porta: va pel
     xat públic de la pàgina, i l'efecte ?sobre= de XatSection l'envia a
     l'entrada, com «Comentar». Esta prova reproduïx el que passa hui perquè
     quede escrit. Quan el Mestre trie (l'entrada, o la conversa de mostra),
     es gira o es queda sense l'etiqueta. */
  test('[DEFECTE] en remot i sense sessió, el clic acaba a l’entrada i no a la conversa de mostra de la IAIA', async () => {
    await muntaLApp('/iaia', { dataMode: 'remote' }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const boto = capcalera.querySelector('.page-title-accio > a');
      expect(boto.getAttribute('href')).toBe(RUTA_XAT_DE_LA_IAIA);
      fireEvent.click(boto);
      await waitFor(() => expect(window.location.pathname).toBe('/registre'), ESPERA);
      const consulta = new URLSearchParams(window.location.search);
      expect(consulta.get('mode')).toBe('entrar');
      /* La tornada és la ruta del botó: el xat públic de /iaia, no /xat/fake-iaia. */
      const tornada = new URL(consulta.get('tornar'), 'http://localhost');
      expect([tornada.pathname, tornada.searchParams.get('sobre'), tornada.searchParams.get('ruta')]).toEqual(['/xat', 'pagina:/iaia', '/iaia']);
    });
  }, LIMIT_DE_PROVA);
});

describe('la resta de pàgines de text no canvien', () => {
  test.each([
    ['/projecte', 'projecte'],
    ['/constitucio', 'constitucio'],
    ['/roadmap', 'roadmap']
  ])('%s no porta cap bloc d’acció davall de l’H1', async (ruta, clau) => {
    await muntaLApp(ruta, { dataMode: 'seed' }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY[clau].title);
      expect(fillsDe(capcalera)).not.toContain('DIV.page-title-accio');
      expect(document.querySelector('.page-title-accio')).toBeNull();
      expect(screen.queryByRole('link', { name: 'Anar al xat' })).toBeNull();
    });
  }, LIMIT_DE_PROVA);

  /* Per text: TextRoute decidix amb la funció pura i passa UNA sola prop nova,
     que TextSection no fa arribar a la UniversalPage quan és null
     (TextSection.test.jsx, T8). */
  test('TextRoute decidix amb accioDeLaPaginaDeText i no passa res més a TextSection', () => {
    const codi = fontApp.replace(/\/\*[\s\S]*?\*\//g, '');
    const inici = codi.indexOf('function TextRoute(');
    const ruta = codi.slice(inici, codi.indexOf('\nexport default function App', inici));
    expect(inici).toBeGreaterThan(-1);
    expect(ruta).toContain('const accioPrincipal = accioDeLaPaginaDeText(pageKey) ? <AccioDeLaPaginaDeText pageKey={pageKey} /> : null;');
    expect(ruta.match(/<TextSection [^>]*>/g)).toEqual(['<TextSection page={page} pageKey={pageKey} accioPrincipal={accioPrincipal}>']);
    expect(ruta.match(/accioDeLaPaginaDeText|AccioDeLaPaginaDeText/g)).toHaveLength(2);
  });
});
