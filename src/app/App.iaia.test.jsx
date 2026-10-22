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
 *
 * Gauntlet 261016_1530 (Bloc 3.6.3; F64 i F65; ordre del Mestre) · Proves
 * actualitzades a posta. El manifest «L'Ànima de la IAIA» passa de /iaia a
 * /anima, amb el mateix botó i el mateix cos; /iaia és ara la fitxa pública
 * de la IAIA MarIA (PerfilPublicSection), i l'àlies històric /ia porta a
 * /anima. El menú «Sistema» hi apunta.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { createTranslator } from '../config/i18n.js';
import { objecteDePagina, rutaXatDePagina } from '../config/objecteConnectable.js';
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

describe('/anima · el botó «Anar al xat» dins del bloc de l’H1 i al final del cos', () => {
  /* Sense sessió en cap dels tres modes (el backend fals no en té): en remot,
     la conversa de mostra (D2); en llavor i en local, el directe de sempre. */
  test.each([
    ['seed', DIRECTE],
    ['local', DIRECTE],
    ['remote', RUTA_XAT_DE_MOSTRA_DE_LA_IAIA]
  ])('amb dataMode %s: la porta gran i blava, darrere de l’H1 i repetida al final, cap a %s', async (dataMode, desti) => {
    await muntaLApp('/anima', { dataMode }, async () => {
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
    await muntaLApp('/anima', { dataMode: 'seed' }, async () => {
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
     mostra (FakeChatOnboarding), i el botó de /anima hi porta. Ja no passa per
     l'entrada (/registre) ni pel xat públic de la pàgina. */
  test('D2 · en remot i sense sessió, el clic acaba a la conversa de mostra de la IAIA, no a l’entrada', async () => {
    const t = createTranslator('ca');
    await muntaLApp('/anima', { dataMode: 'remote' }, async () => {
      const capcalera = await capcaleraDe(PAGE_COPY.anima.title);
      const boto = capcalera.querySelector('.page-title-accio > a');
      await waitFor(() => expect(boto.getAttribute('href')).toBe(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA), ESPERA);
      fireEvent.click(boto);
      await waitFor(() => expect(window.location.pathname).toBe(RUTA_XAT_DE_MOSTRA_DE_LA_IAIA), ESPERA);
      expect(window.location.search).toBe('');
      /* La conversa oberta és la de mostra: les dues bombolles de la IAIA del xat de mostra. */
      await waitFor(() => {
        const bombolles = [...document.querySelectorAll('.sdp-xat-bombolla__text')].map((bombolla) => bombolla.textContent);
        expect(bombolles).toEqual([BENVINGUDA_IAIA, t('section.xat.fake.iaia2')]);
      }, ESPERA);
      expect(window.location.pathname).not.toBe('/registre');
      expect(document.body.textContent).not.toContain('Ací no hi ha res');
    });
  }, LIMIT_DE_PROVA);

  /* Gauntlet 261016 (F65) · /iaia obri la fitxa pública de la IAIA MarIA. */
  test('F65 · /iaia obri la fitxa pública de la IAIA MarIA com a agent', async () => {
    await muntaLApp('/iaia', { dataMode: 'seed' }, async () => {
      const capcalera = await capcaleraDe('IAIA MarIA');
      expect(capcalera.querySelector('h1').textContent).toBe('IAIA MarIA');
      expect(document.body.textContent).toContain('Matriarca Digital');
    });
  }, LIMIT_DE_PROVA);
});

/* Gauntlet 261016_1530 (Bloc 3.6.3; F64 i F65; ordre del Mestre: «La ruta
   /iaia queda reservada per a la pròpia IAIA MarIA […], que és on s'ha
   d'accedir des del xat i des del cercador») · /iaia ja no és el manifest: és
   la fitxa pública de la IAIA, la de PerfilPublicSection, en els tres modes
   (en remot, del paquet: D12). El menú «Sistema» porta el manifest a /anima, i
   a /iaia s'encén Pobles, com a /perfil/<id>. */
describe('Bloc 3.6.3 · /iaia és la fitxa de la IAIA MarIA; el manifest, a /anima', () => {
  test.each(['seed', 'local', 'remote'])('amb dataMode %s, /iaia pinta la fitxa, amb «Parla amb la IAIA», i no el manifest', async (dataMode) => {
    await muntaLApp('/iaia', { dataMode }, async () => {
      const capcalera = await capcaleraDe('IAIA MarIA');
      expect(capcalera.querySelector('.page-title-accio')).toBeNull();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Parla amb la IAIA' })).toBeTruthy(), ESPERA);
      expect(screen.queryByRole('link', { name: 'Anar al xat' })).toBeNull();
      expect([...document.querySelectorAll('h3')].map((h) => h.textContent)).not.toContain('El Despertar de la Nina de Silici');
      expect(window.location.pathname).toBe('/iaia');
      /* La barra: el manifest penja de «Sistema» cap a /anima; a la fitxa s'encén Pobles. */
      const sistema = document.getElementById('app-sidebar-sistema');
      expect(sistema.querySelectorAll('a[href="/anima"]')).toHaveLength(1);
      expect(document.querySelectorAll('.app-sidebar-nav a[href="/iaia"]')).toHaveLength(0);
      expect(document.querySelector('.app-sidebar-nav a[href="/pobles"]').getAttribute('aria-current')).toBe('page');
      expect(sistema.querySelector('a[href="/anima"]').hasAttribute('aria-current')).toBe(false);
    });
  }, LIMIT_DE_PROVA);

  test('a /anima, l’entrada del manifest del menú «Sistema» és l’encesa, i cap altra', async () => {
    await muntaLApp('/anima', { dataMode: 'seed' }, async () => {
      await capcaleraDe(PAGE_COPY.anima.title);
      const encesos = [...document.querySelectorAll('.app-sidebar-nav a[aria-current="page"]')].map((a) => a.getAttribute('href'));
      expect(encesos).toEqual(['/anima']);
      expect(document.getElementById('app-sidebar-sistema').hidden).toBe(false);
    });
  }, LIMIT_DE_PROVA);

  /* «Comentar → En públic» del manifest: abans, a /iaia, obria el xat públic
     de '/iaia' (títol del servidor «L'ànima de la iaia»). /anima no és a
     PAGINES_AMB_XAT i el contracte del servidor no canvia: el manifest
     continua al MATEIX xat, el de la IAIA MarIA, amb la fila activa i el
     mateix destí (objecteDeLaPaginaDeText). Una altra pàgina de text, al de la
     seua ruta, com sempre. */
  test.each([
    ['/anima', PAGE_COPY.anima.title, '/iaia'],
    ['/projecte', PAGE_COPY.projecte.title, '/projecte']
  ])('a %s, «Comentar → En públic» és activa i porta al xat públic de la ruta que toca', async (ruta, titol, rutaDelXat) => {
    await muntaLApp(ruta, { dataMode: 'seed' }, async () => {
      await capcaleraDe(titol);
      const [comentar] = screen.getAllByRole('button', { name: 'Comentar' });
      fireEvent.click(comentar);
      const public_ = await screen.findByRole('menuitem', { name: 'En públic' });
      expect(public_.hasAttribute('aria-disabled')).toBe(false);
      const empeses = vi.spyOn(window.history, 'pushState');
      fireEvent.click(public_);
      const desti = rutaXatDePagina(objecteDePagina({ titol, ruta: rutaDelXat }));
      expect(desti).toBe(`/xat?sobre=pagina:${encodeURIComponent(rutaDelXat)}&titol=${encodeURIComponent(titol)}&ruta=${encodeURIComponent(rutaDelXat)}`);
      await waitFor(() => expect(empeses.mock.calls.map((crida) => String(crida[2]))).toContain(desti), ESPERA);
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
     (accioDeTextAlFinal): per a la resta de pàgines, null.
     Gauntlet 261016_1530 (Bloc 3.6.3; F64) · Actualitzada a posta: TextRoute
     passa una prop més, `objecte`, decidida també amb una funció pura
     (objecteDeLaPaginaDeText): el xat públic del manifest a /anima continua
     sent el de '/iaia'. Per a la resta de pàgines és null i TextSection no
     la fa arribar a la UniversalPage (TextSection.jsx, M3-10). */
  test('TextRoute decidix amb accioDeLaPaginaDeText, accioDeTextAlFinal i objecteDeLaPaginaDeText, i no passa res més a TextSection', () => {
    const codi = fontApp.replace(/\/\*[\s\S]*?\*\//g, '');
    const inici = codi.indexOf('function TextRoute(');
    const ruta = codi.slice(inici, codi.indexOf('\nexport default function App', inici));
    expect(inici).toBeGreaterThan(-1);
    expect(ruta).toContain('const accioPrincipal = accioDeLaPaginaDeText(pageKey) ? <AccioDeLaPaginaDeText pageKey={pageKey} /> : null;');
    expect(ruta).toContain('const objecte = objecteDeLaPaginaDeText(pageKey, page.title);');
    expect(ruta).toContain('{accioDeTextAlFinal(pageKey) ? <AccioDeLaPaginaDeText pageKey={pageKey} lloc="baix" /> : null}');
    expect(ruta.match(/<TextSection [^>]*>/g)).toEqual(['<TextSection page={page} pageKey={pageKey} accioPrincipal={accioPrincipal} objecte={objecte}>']);
    expect(ruta.match(/accioDeLaPaginaDeText|AccioDeLaPaginaDeText/g)).toHaveLength(3);
    expect(ruta.match(/accioDeTextAlFinal/g)).toHaveLength(1);
    expect(ruta.match(/objecteDeLaPaginaDeText/g)).toHaveLength(1);
  });
});

/* Ordre del Mestre (261021, prompt 261021_0015, tasca 7: «Pàgina Única
   Atòmica») · /iaia és la porta única de la IAIA MarIA: la portada del
   catàleg, la fitxa i, al peu de la presentació, el Selector de Realitat dels
   4 nivells. /realitat ja no és cap pantalla solta (hi redirigix), la IAIA de
   la barra negra hi porta, i «L'ànima de la iaia» de «Sistema» porta només a
   l'article de /anima. */
describe('261021 · /iaia, la porta única de la IAIA MarIA, amb el Selector de Realitat al peu', () => {
  test('/realitat porta a /iaia, que pinta la portada, la fitxa i els 4 nivells al peu de la presentació', async () => {
    await muntaLApp('/realitat?origen=prova', { dataMode: 'seed' }, async () => {
      await capcaleraDe('IAIA MarIA');
      expect(ubicacio()).toBe('/iaia?origen=prova');
      expect(document.querySelector('.hero-image img')?.getAttribute('src')).toContain('iaia_maria_avatar.webp');
      await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(4), ESPERA);
      expect(screen.getByRole('radio', { name: 'Nivell 1 Passiva' }).checked).toBe(true);
      const selector = screen.getByRole('heading', { level: 3, name: "Tu decidixes quanta intel·ligència artificial t'acompanya" });
      const presentacio = document.querySelector('article.detail-content');
      expect(presentacio.compareDocumentPosition(selector) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(presentacio.contains(selector)).toBe(false);
      expect(document.querySelectorAll('a[href="/realitat"]')).toHaveLength(0);
      expect(document.getElementById('app-sidebar-sistema').querySelector('a[href="/anima"]').hasAttribute('aria-current')).toBe(false);
    });
  }, LIMIT_DE_PROVA);

  test('la IAIA de la barra negra porta a /iaia i diu el seu nom, no el de l’article de /anima', async () => {
    await muntaLApp('/anima', { dataMode: 'seed' }, async () => {
      await capcaleraDe(PAGE_COPY.anima.title);
      const boto = document.querySelector('.bar-black [data-iaia-activa]');
      expect(boto.getAttribute('aria-label')).toBe('IAIA MarIA');
      fireEvent.click(boto);
      await capcaleraDe('IAIA MarIA');
      expect(window.location.pathname).toBe('/iaia');
    });
  }, LIMIT_DE_PROVA);

  test('a la font: /realitat redirigix i la barra negra ja no hi porta', () => {
    /* La font crua: llevar comentaris amb una expressió regular també es menja
       codi (un path="/app/*" obri un fals comentari). */
    const codi = fontApp;
    expect(codi).toContain('<Route path="/realitat" element={<RedireccioRealitat />} />');
    expect(codi).not.toContain("navigateWithTransition('/realitat')");
    expect(codi).not.toContain('RealitatSection');
  });
});
