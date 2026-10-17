/* Gauntlet 261017 (M07, C07) · La redirecció de /multimedia/town-<slug> a
   /pobles/<slug> amb el router DE VERITAT (RouterContext.jsx), no amb el
   doble de Navigate d'ItemDetailSection.test.jsx:
   · replace: l'historial no creix i «Arrere» torna a la pàgina d'abans, mai
     a la ruta vella (que tornaria a redirigir); «Avant» torna al poble;
   · al navegador (BrowserRouter, també amb base) la consulta i el fragment
     arriben sencers; en memòria (MemoryRouter, l'incrustat) la consulta
     arriba i window.history no es toca;
   · l'App sencera (PedraSecaEmbed amb el router del navegador): amb barra
     final, amb un camí darrere o amb el prefix en una altra caixa, la ruta
     ja no acaba a NotFoundPage (RedireccioMultimedia, App.jsx).
   L'historial és el de jsdom: history.go() hi és asíncron i dispara
   popstate, com al navegador. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation, useRouter } from '../../app/contexts/RouterContext';
import ItemDetailSection from './ItemDetailSection.jsx';
import PedraSecaEmbed from '../../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { getSessionState } from '../../data/sessionService.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

/* Només per a l'App sencera (els mateixos dobles que App.rutesCanoniques.test.jsx). */
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const sonda = { router: null, ubicacio: null };
function Sonda() {
  sonda.router = useRouter();
  sonda.ubicacio = useLocation();
  return null;
}

/* On s'aterra: el camí, la consulta i el fragment que veu l'app. */
function Desti() {
  const { pathname, search, hash } = useLocation();
  return <p data-testid="desti">{`${pathname}|${search}|${hash}`}</p>;
}

/* Les rutes del detall muntat directament: el destí abans del comodí. */
function Arbre() {
  return (
    <>
      <Sonda />
      <Routes>
        <Route path="/pobles/:itemId" element={<Desti />} />
        <Route path="/multimedia" element={<Desti />} />
        <Route path="/mur" element={<Desti />} />
        <Route path="/:sectionId/:itemId" element={<ItemDetailSection />} />
      </Routes>
    </>
  );
}

const onEs = () => window.location.pathname + window.location.search + window.location.hash;
const desti = () => screen.getByTestId('desti').textContent;
const pausa = (ms = 0) => new Promise((resol) => { setTimeout(resol, ms); });

/** Un salt de l'historial del navegador (-1 és «Arrere») i l'espera del seu popstate. */
async function salta(n) {
  await act(async () => {
    const arribat = new Promise((resol) => { window.addEventListener('popstate', resol, { once: true }); });
    window.history.go(n);
    await Promise.race([arribat, pausa(500)]);
    await pausa();
  });
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sonda.router = null;
  sonda.ubicacio = null;
});

describe('BrowserRouter (socdepoble.org)', () => {
  test('en fred: replace amb la consulta i el fragment, l’historial no creix i Arrere/Avant no reboten', async () => {
    window.history.replaceState(null, '', '/mur');
    window.history.pushState(null, '', '/multimedia/town-benifallim?tema=flora&tema=aigua#galeria');
    const llargada = window.history.length;
    const empeny = vi.spyOn(window.history, 'pushState');
    render(<BrowserRouter><Arbre /></BrowserRouter>);

    expect(onEs()).toBe('/pobles/benifallim?tema=flora&tema=aigua#galeria');
    expect(desti()).toBe('/pobles/benifallim|tema=flora&tema=aigua|#galeria');
    expect(window.history.length).toBe(llargada);
    expect(empeny).not.toHaveBeenCalled();

    await salta(-1);
    expect(onEs()).toBe('/mur');
    expect(desti()).toBe('/mur||');
    await salta(1);
    expect(onEs()).toBe('/pobles/benifallim?tema=flora&tema=aigua#galeria');
    expect(desti()).toBe('/pobles/benifallim|tema=flora&tema=aigua|#galeria');
    expect(window.history.length).toBe(llargada);
  });

  test('des de dins (un enllaç): una sola entrada nova, la del poble; Arrere torna a la pàgina d’abans', async () => {
    window.history.replaceState(null, '', '/mur');
    const llargada = window.history.length;
    render(<BrowserRouter><Arbre /></BrowserRouter>);
    expect(desti()).toBe('/mur||');

    await act(async () => { sonda.router.navigate('/multimedia/Town-Benifallim?a=1'); });
    expect(onEs()).toBe('/pobles/benifallim?a=1');
    expect(window.history.length).toBe(llargada + 1);

    await salta(-1);
    expect(desti()).toBe('/mur||');
    await salta(1);
    expect(desti()).toBe('/pobles/benifallim|a=1|');
  });

  test('una foto que no és d’un poble obri l’Arxiu amb el visor, també amb replace i el fragment', () => {
    window.history.replaceState(null, '', '/multimedia/nano-mur?origen=xat#info');
    const llargada = window.history.length;
    render(<BrowserRouter><Arbre /></BrowserRouter>);
    expect(onEs()).toBe('/multimedia?origen=xat&foto=nano-mur#info');
    expect(window.history.length).toBe(llargada);
  });

  test('amb base: la redirecció es queda dins de la base; fora de base, cap redirecció i cap fragment', () => {
    window.history.replaceState(null, '', '/comunitat/multimedia/town-sella?a=1#g');
    const { unmount } = render(<BrowserRouter basename="/comunitat"><Arbre /></BrowserRouter>);
    expect(onEs()).toBe('/comunitat/pobles/sella?a=1#g');
    expect(desti()).toBe('/pobles/sella|a=1|#g');
    unmount();

    window.history.replaceState(null, '', '/pagina-de-l-amfitrio?x=1#ancora');
    render(<BrowserRouter basename="/comunitat"><Arbre /></BrowserRouter>);
    expect(onEs()).toBe('/pagina-de-l-amfitrio?x=1#ancora');
    expect(sonda.ubicacio).toEqual({ pathname: '', search: '', state: null, hash: '' });
  });
});

describe('MemoryRouter (incrustat)', () => {
  test('replace en la llista pròpia: Arrere torna a la pàgina d’abans, Avant al poble, i window.history no es toca', async () => {
    window.history.replaceState(null, '', '/pagina-de-l-amfitrio#seu');
    const llargada = window.history.length;
    render(<MemoryRouter rutaInicial="/mur"><Arbre /></MemoryRouter>);
    expect(sonda.router.index).toBe(0);

    await act(async () => { sonda.router.navigate('/multimedia/town-benifallim?tema=flora&tema=aigua#galeria'); });
    // En memòria el fragment no viatja: l'entrada no el guarda i useLocation el dona buit.
    expect(desti()).toBe('/pobles/benifallim|tema=flora&tema=aigua|');
    expect(sonda.router.index).toBe(1);

    await act(async () => { sonda.router.navigate(-1); });
    expect([desti(), sonda.router.index]).toEqual(['/mur||', 0]);
    await act(async () => { sonda.router.navigate(1); });
    expect([desti(), sonda.router.index]).toEqual(['/pobles/benifallim|tema=flora&tema=aigua|', 1]);
    // La llista té dues entrades, no tres: un altre Avant no mou res.
    await act(async () => { sonda.router.navigate(1); });
    expect(sonda.router.index).toBe(1);

    expect(onEs()).toBe('/pagina-de-l-amfitrio#seu');
    expect(window.history.length).toBe(llargada);
  });

  test('en fred (ruta-inicial vella): s’aterra al poble a la primera entrada', () => {
    render(<MemoryRouter rutaInicial="/multimedia/town-la-torre-de-les-macanes?xat=obert"><Arbre /></MemoryRouter>);
    expect(desti()).toBe('/pobles/la-torre-de-les-macanes|xat=obert|');
    expect(sonda.router.index).toBe(0);
    expect(sonda.ubicacio.hash).toBe('');
  });
});

/* L'App sencera, en llavor i amb el router del navegador, sense sessió ni
   xarxa (fetch llança). */
async function muntaLApp(ruta, cos) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => { throw new Error('Xarxa inesperada: ' + url); }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((name) => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'seed',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    loadPerfilPublic: async () => null
  });
  window.history.replaceState(null, '', '/mur');
  window.history.pushState(null, '', ruta);
  const llargada = window.history.length;
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'seed' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos({ llargada });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
    oblidaEntitatDelProjecte();
  }
}

describe('App sencera (RedireccioMultimedia)', () => {
  test.each([
    ['/multimedia/town-benifallim/?a=1#galeria', '/pobles/benifallim?a=1#galeria'],
    ['/multimedia/town-benifallim/galeria/2?a=1', '/pobles/benifallim?a=1'],
    ['/multimedia/Town-Benifallim', '/pobles/benifallim'],
    ['/multimedia/town-benifallim?tema=flora&tema=aigua#galeria', '/pobles/benifallim?tema=flora&tema=aigua#galeria'],
    ['/multimedia/nano-mur/', '/multimedia?foto=nano-mur']
  ])('%s porta a %s amb replace, sense passar per la 404', async (ruta, esperat) => {
    await muntaLApp(ruta, async ({ llargada }) => {
      await waitFor(() => expect(onEs()).toBe(esperat), { timeout: 4000 });
      expect(window.history.length).toBe(llargada);
      expect(screen.queryByText('Ací no hi ha res')).toBeNull();
      await salta(-1);
      expect(window.location.pathname).toBe('/mur');
    });
  });
});
