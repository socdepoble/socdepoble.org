/**
 * Onada 10 (261010; decisió del Mestre del 261010) · A /iaia, dins del bloc
 * blanc de l'H1, el botó gran «Anar al xat», que entra directe al xat amb la
 * IAIA MarIA. Es prova amb l'app de veres (PedraSecaEmbed), perquè la ruta és
 * TextRoute, d'App.jsx:
 *
 *  · el botó és la porta gran i blava de Pedra Seca (PortaDePagina), dins de
 *    header.page-title > div.page-title-accio i darrere de l'H1;
 *  · el destí és el de la fila «IAIA MarIA» de la llista del Xat en cada mode
 *    de dades (sections/xat/useObriXatPerDefecte.js · rutaDelXatDeLaIAIA);
 *  · en llavor, el clic acaba a la conversa «IAIA MarIA» de la llavor (el
 *    port del xat és ací el magatzem local, que en eixe mode fa de servidor);
 *  · cap altra pàgina de text guanya el bloc de l'acció (Llei del Píxel).
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 6) ·
 *  · D2 · en remot i sense sessió, el clic acaba a la conversa de mostra de la
 *    IAIA (/xat/fake-iaia), la fila que el convidat veu a la llista. DEROGADA
 *    la prova [DEFECTE] que reproduïa l'entrada (/registre).
 *  · D4 · el botó va DALT I AL FINAL, com «Obrir…» de /page/consola: el mateix
 *    enllaç repetit dins de div.sdp-pagina-accio, l'últim fill del cos.
 *    DEROGAT «un sol enllaç amb eixe nom» i «cap div.sdp-pagina-accio nou».
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { createTranslator } from '../config/i18n.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { BENVINGUDA_IAIA, IAIA_ID } from '../data/identitatsSeed.js';
import { localXat, reiniciaLocalXat } from '../data/localXat.js';
import { XAT_SEED_IDS } from '../data/xatSeed.js';
import { RUTA_XAT_DE_MOSTRA_DE_LA_IAIA } from '../sections/xat/useObriXatPerDefecte.js';
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

describe('/iaia · el botó «Anar al xat» dins del bloc de l’H1 i al final del cos', () => {
  /* Sense sessió en cap dels tres modes (el backend fals no en té): en remot,
     la conversa de mostra (D2); en llavor i en local, el directe de sempre. */
  test.each([
    ['seed', DIRECTE],
    ['local', DIRECTE],
    ['remote', RUTA_XAT_DE_MOSTRA_DE_LA_IAIA]
  ])('amb dataMode %s: la porta gran i blava, darrere de l’H1 i repetida al final, cap a %s', async (dataMode, desti) => {
    await muntaLApp('/iaia', { dataMode }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const fills = fillsDe(capcalera);
      expect(fills.filter((fill) => fill === 'DIV.page-title-accio')).toHaveLength(1);
      expect(fills.indexOf('DIV.page-title-accio')).toBeGreaterThan(fills.indexOf('H1'));
      const bloc = capcalera.querySelector(':scope > .page-title-accio');
      expect(bloc.children).toHaveLength(1);
      const boto = bloc.querySelector(':scope > a');
      /* En remot, el destí es decidix quan la sessió ja està comprovada (senseSessio). */
      await waitFor(() => expect(boto.getAttribute('href')).toBe(desti), ESPERA);
      expect([boto.className, boto.getAttribute('href'), boto.textContent]).toEqual([CLASSE, desti, 'Anar al xat']);
      expect(boto.hasAttribute('style')).toBe(false);
      /* D4 · Dos controls amb el mateix nom que porten al mateix lloc (WCAG
         2.4.4): el de dalt i el del final, dins de div.sdp-pagina-accio, que
         és l'últim fill del cos, just darrere de l'article del text. */
      const finals = document.querySelectorAll('.sdp-pagina-accio');
      expect(finals).toHaveLength(1);
      const [final] = finals;
      expect(final.children).toHaveLength(1);
      const botoFinal = final.querySelector(':scope > a');
      expect([botoFinal.className, botoFinal.getAttribute('href'), botoFinal.textContent]).toEqual([CLASSE, desti, 'Anar al xat']);
      expect(screen.getAllByRole('link', { name: 'Anar al xat' })).toEqual([boto, botoFinal]);
      expect(final.parentElement.lastElementChild).toBe(final);
      expect(final.previousElementSibling).toBe(document.querySelector('article.cms-preview'));
      expect(capcalera.contains(final)).toBe(false);
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

  /* Onada 11 (261010; prompt 261010_1730, tasca 6, D2) · Girada la prova
     [DEFECTE] de la revisió de l'Onada 10: en remot i sense sessió, la fila
     «IAIA MarIA» que el convidat veu a la llista del Xat és la conversa de
     mostra (FakeChatOnboarding), i el botó de /iaia hi porta. Ja no passa per
     l'entrada (/registre) ni pel xat públic de la pàgina. */
  test('D2 · en remot i sense sessió, el clic acaba a la conversa de mostra de la IAIA, no a l’entrada', async () => {
    const t = createTranslator('ca');
    await muntaLApp('/iaia', { dataMode: 'remote' }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const boto = capcalera.querySelector('.page-title-accio > a');
      await waitFor(() => expect(boto.getAttribute('href')).toBe(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA), ESPERA);
      fireEvent.click(boto);
      await waitFor(() => expect(window.location.pathname).toBe(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA), ESPERA);
      expect(window.location.search).toBe('');
      /* La conversa oberta és la de mostra: les dues bombolles de la IAIA del xat de mostra. */
      await waitFor(() => {
        const bombolles = [...document.querySelectorAll('.sdp-xat-bombolla__text')].map((bombolla) => bombolla.textContent);
        expect(bombolles).toEqual([t('section.xat.fake.iaia1'), t('section.xat.fake.iaia2')]);
      }, ESPERA);
      expect(window.location.pathname).not.toBe('/registre');
      expect(document.body.textContent).not.toContain('Ací no hi ha res');
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
     (TextSection.test.jsx, T8). Onada 11 (D4) · I el botó del final, com a
     fill de TextSection, decidit també amb una funció pura
     (accioDeTextAlFinal): per a la resta de pàgines, null. */
  test('TextRoute decidix amb accioDeLaPaginaDeText i accioDeTextAlFinal, i no passa res més a TextSection', () => {
    const codi = fontApp.replace(/\/\*[\s\S]*?\*\//g, '');
    const inici = codi.indexOf('function TextRoute(');
    const ruta = codi.slice(inici, codi.indexOf('\nexport default function App', inici));
    expect(inici).toBeGreaterThan(-1);
    expect(ruta).toContain('const accioPrincipal = accioDeLaPaginaDeText(pageKey) ? <AccioDeLaPaginaDeText pageKey={pageKey} /> : null;');
    expect(ruta).toContain('{accioDeTextAlFinal(pageKey) ? <AccioDeLaPaginaDeText pageKey={pageKey} lloc="baix" /> : null}');
    expect(ruta.match(/<TextSection [^>]*>/g)).toEqual(['<TextSection page={page} pageKey={pageKey} accioPrincipal={accioPrincipal}>']);
    expect(ruta.match(/accioDeLaPaginaDeText|AccioDeLaPaginaDeText/g)).toHaveLength(3);
    expect(ruta.match(/accioDeTextAlFinal/g)).toHaveLength(1);
  });
});
