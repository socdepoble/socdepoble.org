/**
 * PS-01 (B7, marató 261101_2143) · La fosa entre vistes passa pel router i
 * fotografia la vista nova.
 *
 * El doble de `document.startViewTransition` fa com el navegador: torna de
 * seguida, i més tard (ací, dins d'un act) fa la foto vella, crida el callback
 * i fa la foto nova amb el DOM tal com queda quan el callback torna. La foto és
 * el text de l'H1 de la vista.
 *
 *  1. Clic a <NavLink transicio> dins de RouterProvider → la foto nova és la
 *     ruta nova, i la vella, la de sempre (hi ha fosa de veres).
 *  2. L'historial ja és el nou abans del callback (pushState en sincronia).
 *  3. Amb moviment reduït o sense API, cap crida a l'API i la ruta canvia.
 *  4. `ready` rebutjat (una fosa tallada) → cap rebuig sense gestionar.
 *  5. Sense `transicio`, cap crida a l'API.
 *  6. MemoryRouter (l'incrustat) amb `transicio` navega sense API.
 *
 * El control fixa que el doble mossega: el patró d'App.jsx a HEAD
 * (startViewTransition(() => navigate(...)), sense flushSync) fotografia la
 * vista vella com a nova.
 *
 * ARB-B7a-01 (àrbitre, corrector): entre el pushState i el callback de la fosa
 * hi ha una finestra on l'historial ja és el nou i la vista, la vella. Dins
 * d'ella, la vista vella es pinta amb el seu estat i el seu fragment, un
 * setSearchParams de la vista vella no desfà la navegació i un Arrere pinta
 * la seua entrada. ARB-B7a-02: la barra negra passa l'estat de recuperació
 * de l'espai d'identitat a la fosa.
 */
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Link, MemoryRouter, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from './RouterContext.jsx';
import { ambTransicioDeVista } from './transicioDeVista.js';

/* R56 · Els oracles raw antics es conserven a WIP_BASELINE_VITEST (21/21).
   L'extensió interna aprovada exigix esquema privat exacte i projecció
   pública original. Les proves de vista visible i MemoryRouter no canvien. */
function estatPublicHistorial() {
  const marker = window.history.state?.__sdp_router_entry;
  expect(Object.keys(marker).sort()).toEqual(['key', 'state', 'version']);
  expect(marker.version).toBe(2);
  expect(marker.key).toMatch(/^sdp:[a-z0-9]{1,16}:[1-9]\d{0,12}$/);
  return marker.state;
}

/* Per a la prova de l'app de veres (la darrera), com a App.test.jsx:
   l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

/* React avisa d'un atribut desconegut una sola vegada per procés: els avisos
   es recullen de tot el fitxer i l'última prova els mira. */
const avisos = [];
const errorOriginal = console.error;
beforeAll(() => {
  console.error = (...args) => { avisos.push(args.map(String).join(' ')); errorOriginal(...args); };
});
afterAll(() => { console.error = errorOriginal; });

afterEach(() => {
  cleanup();
  delete document.startViewTransition;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

const titol = () => document.querySelector('h1')?.textContent ?? null;

/* Doble de l'API: anota la URL i la vista en cridar-la, i deixa pendent la
   fase del navegador (foto vella, callback, foto nova). */
function simulaApi({ ready = () => Promise.resolve() } = {}) {
  const registre = { urlEnCridar: [], fotoVella: [], fotoNova: [], pendents: [] };
  document.startViewTransition = vi.fn((callback) => {
    registre.urlEnCridar.push(window.location.pathname);
    let acabat;
    const updateCallbackDone = new Promise((resol) => { acabat = resol; });
    registre.pendents.push(() => {
      registre.fotoVella.push(titol());
      callback();
      registre.fotoNova.push(titol());
      acabat();
    });
    return { ready: ready(), finished: updateCallbackDone, updateCallbackDone, skipTransition() {} };
  });
  return registre;
}

async function acabaLesFoses(registre) {
  await act(async () => {
    while (registre.pendents.length) registre.pendents.shift()();
  });
}

function movimentReduit(reduit) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: reduit && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })));
}

/* Navega amb opcions, com la barra negra (navigateWithTransition d'App.jsx). */
function BotoAmbOpcions({ to, opcions, children }) {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(to, opcions)}>{children}</button>;
}

/* El patró d'App.jsx a HEAD, per al control. */
function BotoPatroVell() {
  const navigate = useNavigate();
  return <button type="button" onClick={() => document.startViewTransition(() => navigate('/pobles'))}>Patró vell</button>;
}

/* Cada vista, amb el seu H1 dins de la capçalera de pàgina (Regla de les Capçaleres). */
function Vista({ titol: text }) {
  return <header className="page-title"><h1>{text}</h1></header>;
}

function Vistes() {
  return (
    <>
      <nav>
        <NavLink to="/pobles" transicio>Pobles</NavLink>
        <NavLink to="/mercat" transicio>Mercat</NavLink>
        <Link to="/mur">Mur</Link>
        <NavLink to="/xat">Xat</NavLink>
        <BotoAmbOpcions to="/mur" opcions={{ state: { espaiIdentitat: 7 }, transicio: true }}>Amb estat</BotoAmbOpcions>
        <BotoAmbOpcions to="/mercat" opcions={{ replace: true, transicio: true }}>Substituïx</BotoAmbOpcions>
        <BotoPatroVell />
      </nav>
      <Routes>
        <Route path="/" element={<Vista titol="Vista d’inici" />} />
        <Route path="/pobles" element={<Vista titol="Vista de pobles" />} />
        <Route path="/mercat" element={<Vista titol="Vista del mercat" />} />
        <Route path="/mur" element={<Vista titol="Vista del mur" />} />
        <Route path="/xat" element={<Vista titol="Vista del xat" />} />
      </Routes>
    </>
  );
}

function munta(url = '/') {
  window.history.replaceState(null, '', url);
  render(<BrowserRouter><Vistes /></BrowserRouter>);
}

/* ARB-B7a-01 · La finestra de la fosa. El clic de l'enllaç també canvia un
   estat de la closca (com el toggleSidebar de la barra lateral en compacte):
   la vista vella es torna a pintar abans que la fosa pinte la nova. */
const lectures = [];
let escriuParams = null;
function llig(loc) { lectures.push({ pathname: loc.pathname, state: loc.state, hash: loc.hash }); }
function Detall() {
  const loc = useLocation();
  llig(loc);
  return <Vista titol={loc.state?.preloadedItem ?? 'No trobat'} />;
}
function Calendari() {
  const [, setParams] = useSearchParams();
  escriuParams = () => setParams({ vista: 'setmana' }, { replace: true });
  return <Vista titol="Vista del calendari" />;
}
function Pobles() {
  llig(useLocation());
  return <Vista titol="Vista de pobles" />;
}
function Finestra() {
  const [obert, setObert] = useState(true);
  return (
    <>
      <nav data-obert={obert ? 'si' : 'no'}>
        <NavLink to="/pobles#mapa" transicio onClick={() => setObert((o) => !o)}>Pobles</NavLink>
      </nav>
      <Routes>
        <Route path="/detall" element={<Detall />} />
        <Route path="/calendari" element={<Calendari />} />
        <Route path="/pobles" element={<Pobles />} />
      </Routes>
    </>
  );
}
function muntaFinestra(url, estat = null) {
  lectures.length = 0;
  escriuParams = null;
  window.history.replaceState(estat, '', url);
  render(<BrowserRouter><Finestra /></BrowserRouter>);
}

const enllac = (nom) => screen.getByRole('link', { name: nom });
const boto = (nom) => screen.getByRole('button', { name: nom });

describe('RouterProvider amb transicio', () => {
  test('1 · el clic a <NavLink transicio> fotografia la ruta nova, i la vella és la de sempre', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    munta('/');
    fireEvent.click(enllac('Pobles'));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    await acabaLesFoses(registre);
    expect(registre.fotoVella).toEqual(['Vista d’inici']);
    expect(registre.fotoNova).toEqual(['Vista de pobles']);
    expect(titol()).toBe('Vista de pobles');
    expect(enllac('Pobles').getAttribute('aria-current')).toBe('page');
  });

  test('2 · l’historial ja és el nou quan es crida l’API, abans del callback', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    munta('/');
    const push = vi.spyOn(window.history, 'pushState');
    fireEvent.click(enllac('Pobles'));
    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.invocationCallOrder[0]).toBeLessThan(document.startViewTransition.mock.invocationCallOrder[0]);
    expect(registre.urlEnCridar).toEqual(['/pobles']);
    expect(window.location.pathname).toBe('/pobles');
    expect(registre.pendents).toHaveLength(1);
    await acabaLesFoses(registre);
  });

  test('2b · l’estat i el replace de navigate() es conserven amb la fosa', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    munta('/');
    fireEvent.click(boto('Amb estat'));
    await acabaLesFoses(registre);
    expect(estatPublicHistorial()).toEqual({ espaiIdentitat: 7 });
    expect(registre.fotoNova).toEqual(['Vista del mur']);

    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    fireEvent.click(boto('Substituïx'));
    await acabaLesFoses(registre);
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/mercat');
    expect(registre.fotoNova).toEqual(['Vista del mur', 'Vista del mercat']);
  });

  test('3a · amb moviment reduït no es crida l’API i la ruta canvia igual', () => {
    movimentReduit(true);
    simulaApi();
    munta('/');
    fireEvent.click(enllac('Pobles'));
    expect(document.startViewTransition).not.toHaveBeenCalled();
    expect(titol()).toBe('Vista de pobles');
    expect(window.location.pathname).toBe('/pobles');
  });

  test('3b · sense API (ni matchMedia) la ruta canvia igual', () => {
    munta('/');
    expect(document.startViewTransition).toBeUndefined();
    fireEvent.click(enllac('Pobles'));
    expect(titol()).toBe('Vista de pobles');
    expect(window.location.pathname).toBe('/pobles');
  });

  test('4 · una fosa tallada (ready rebutjat) no deixa cap rebuig sense gestionar', async () => {
    movimentReduit(false);
    const rebutjos = [];
    const escolta = (motiu) => { rebutjos.push(motiu); };
    process.on('unhandledRejection', escolta);
    try {
      const registre = simulaApi({ ready: () => Promise.reject(new DOMException('Transició tallada', 'InvalidStateError')) });
      munta('/');
      fireEvent.click(enllac('Pobles'));
      await acabaLesFoses(registre);
      await new Promise((resol) => { setTimeout(resol, 20); });
      expect(rebutjos).toEqual([]);
      expect(titol()).toBe('Vista de pobles');
    } finally {
      process.off('unhandledRejection', escolta);
    }
  });

  test('5 · sense transicio (Link i NavLink de sempre), cap crida a l’API', () => {
    movimentReduit(false);
    simulaApi();
    munta('/');
    fireEvent.click(enllac('Mur'));
    expect(titol()).toBe('Vista del mur');
    fireEvent.click(enllac('Xat'));
    expect(titol()).toBe('Vista del xat');
    expect(document.startViewTransition).not.toHaveBeenCalled();
  });

  test('dues foses seguides: la primera pinta la darrera URL, mai una de vella', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    munta('/');
    fireEvent.click(enllac('Pobles'));
    fireEvent.click(enllac('Mercat'));
    expect(registre.urlEnCridar).toEqual(['/pobles', '/mercat']);
    await acabaLesFoses(registre);
    expect(registre.fotoNova).toEqual(['Vista del mercat', 'Vista del mercat']);
    expect(titol()).toBe('Vista del mercat');
    expect(window.location.pathname).toBe('/mercat');
  });

  test('la prop transicio no arriba a l’<a>', () => {
    munta('/');
    expect(enllac('Pobles').hasAttribute('transicio')).toBe(false);
    expect(enllac('Pobles').getAttribute('href')).toBe('/pobles');
  });

  test('control · el patró vell (sense flushSync) fotografia la vista vella com a nova', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    munta('/');
    fireEvent.click(boto('Patró vell'));
    await acabaLesFoses(registre);
    expect(registre.fotoNova).toEqual(['Vista d’inici']);
    expect(titol()).toBe('Vista de pobles');
  });
});

describe('ARB-B7a-01 · la finestra entre el pushState i el callback de la fosa', () => {
  test('la vista vella es torna a pintar amb el seu estat i el seu fragment, no amb els de la nova', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    muntaFinestra('/detall', { preloadedItem: 'Fira de Tardor' });
    expect(titol()).toBe('Fira de Tardor');
    fireEvent.click(enllac('Pobles'));
    // L'historial ja és el nou; la vista, encara la vella i sencera.
    expect(window.location.pathname + window.location.hash).toBe('/pobles#mapa');
    expect(estatPublicHistorial()).toBeNull();
    expect(lectures.at(-1)).toEqual({ pathname: '/detall', state: { preloadedItem: 'Fira de Tardor' }, hash: '' });
    expect(titol()).toBe('Fira de Tardor');
    await acabaLesFoses(registre);
    expect(registre.fotoVella).toEqual(['Fira de Tardor']);
    expect(registre.fotoNova).toEqual(['Vista de pobles']);
    expect(lectures.at(-1)).toEqual({ pathname: '/pobles', state: null, hash: '#mapa' });
  });

  test('amb dues foses seguides, la vista vella continua amb el seu estat fins que es pinta la nova', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    muntaFinestra('/detall', { preloadedItem: 'Fira de Tardor' });
    fireEvent.click(enllac('Pobles'));
    fireEvent.click(enllac('Pobles'));
    expect(registre.pendents).toHaveLength(2);
    expect(lectures.at(-1)).toEqual({ pathname: '/detall', state: { preloadedItem: 'Fira de Tardor' }, hash: '' });
    expect(titol()).toBe('Fira de Tardor');
    await acabaLesFoses(registre);
    expect(registre.fotoNova).toEqual(['Vista de pobles', 'Vista de pobles']);
    expect(lectures.at(-1)).toEqual({ pathname: '/pobles', state: null, hash: '#mapa' });
  });

  test('un setSearchParams de la vista vella no desfà la navegació', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    muntaFinestra('/calendari');
    fireEvent.click(enllac('Pobles'));
    expect(window.location.pathname).toBe('/pobles');
    act(() => { escriuParams(); }); // el Calendari encara és muntat
    await acabaLesFoses(registre);
    expect(window.location.pathname).toBe('/pobles');
    expect(titol()).toBe('Vista de pobles');
  });

  test('un Arrere dins de la finestra pinta la seua entrada amb el seu estat', async () => {
    movimentReduit(false);
    const registre = simulaApi();
    muntaFinestra('/detall', { preloadedItem: 'Fira de Tardor' });
    fireEvent.click(enllac('Pobles'));
    // El navegador aterra en una altra entrada abans que la fosa pinte.
    act(() => {
      window.history.replaceState({ preloadedItem: 'Aplec de Tardor' }, '', '/detall');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { preloadedItem: 'Aplec de Tardor' } }));
    });
    expect(titol()).toBe('Aplec de Tardor');
    expect(lectures.at(-1)).toEqual({ pathname: '/detall', state: { preloadedItem: 'Aplec de Tardor' }, hash: '' });
    await acabaLesFoses(registre);
    expect(titol()).toBe('Aplec de Tardor');
    expect(window.location.pathname).toBe('/detall');
  });
});

describe('MemoryRouter amb transicio', () => {
  test('6 · l’incrustat navega sense API i sense tocar window.history', () => {
    movimentReduit(false);
    simulaApi();
    window.history.replaceState(null, '', '/amfitrio');
    const push = vi.spyOn(window.history, 'pushState');
    render(<MemoryRouter rutaInicial="/"><Vistes /></MemoryRouter>);
    fireEvent.click(enllac('Pobles'));
    expect(titol()).toBe('Vista de pobles');
    expect(document.startViewTransition).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/amfitrio');
  });
});

describe('ambTransicioDeVista', () => {
  test('sense document ni finestra, actualitza i torna null', () => {
    const actualitza = vi.fn();
    expect(ambTransicioDeVista(actualitza, { doc: undefined, finestra: undefined })).toBeNull();
    expect(actualitza).toHaveBeenCalledTimes(1);
  });

  test('amb moviment reduït, actualitza sense cridar l’API', () => {
    const actualitza = vi.fn();
    const doc = { startViewTransition: vi.fn() };
    const finestra = { matchMedia: () => ({ matches: true }) };
    expect(ambTransicioDeVista(actualitza, { doc, finestra })).toBeNull();
    expect(doc.startViewTransition).not.toHaveBeenCalled();
    expect(actualitza).toHaveBeenCalledTimes(1);
  });

  test('amb API, l’actualització va dins del callback i torna la transició', () => {
    const actualitza = vi.fn();
    const transicio = { ready: Promise.resolve() };
    let callback = null;
    const doc = { startViewTransition: vi.fn((cb) => { callback = cb; return transicio; }) };
    expect(ambTransicioDeVista(actualitza, { doc, finestra: {} })).toBe(transicio);
    expect(actualitza).not.toHaveBeenCalled();
    callback();
    expect(actualitza).toHaveBeenCalledTimes(1);
  });
});

/* L'última del fitxer: cap render d'abans ha fet avisar React (atribut
   `transicio` a l'<a>, actualització fora d'act…). */
test('cap avís de React en tot el fitxer', () => {
  expect(avisos).toEqual([]);
});

/* L'app de veres (PedraSecaEmbed, router de navegador): les entrades de la
   navegació principal (barra lateral i barra mòbil), el botó del Panell i la
   barra negra passen per la fosa. Abans només en passaven les de la barra
   negra i el Panell. Va darrere de la prova d'avisos: l'app en té de seus. */
/* L'app de veres a /mur amb el backend local de prova. `usuari` null: sense
   sessió. Torna la funció que ho desmunta i deixa el backend com estava. */
async function preparaApp(usuari = null, extra = {}) {
  const { getBackendImplementation, setBackendImplementation } = await import('../../data/backendPort.js');
  const { CONTRACTE_NUCLI } = await import('../../data/contracte.js');
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
    getCurrentUser: () => usuari,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => usuari?.id ?? null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    ...extra
  });
  window.history.replaceState(null, '', '/mur');
  return () => {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  };
}

describe('App.jsx · la navegació principal fa la fosa', () => {
  test('barra lateral, barra mòbil, Panell i Cerca criden l’API i acaben a la seua ruta', async () => {
    const { default: PedraSecaEmbed } = await import('../../PedraSecaEmbed');
    const desmunta = await preparaApp();
    const registre = simulaApi();
    try {
      render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'local' }} />);
      const lateral = await waitFor(() => {
        const a = document.querySelector('#app-sidebar a.nav-item[href="/pobles"]');
        expect(a).not.toBeNull();
        return a;
      }, { timeout: 8000 });
      const passos = [
        ['barra lateral', () => lateral, '/pobles'],
        ['barra mòbil', () => document.querySelector('.mobile-nav a.nav-item[href="/mercat"]'), '/mercat'],
        ['Panell', () => document.querySelector('.mobile-nav .mobile-nav__cta'), '/control'],
        ['Cerca', () => document.querySelector('header.bar-black button[aria-label="Cerca"]'), '/cerca']
      ];
      for (const [nom, troba, desti] of passos) {
        const element = troba();
        expect(element, nom).not.toBeNull();
        const abans = document.startViewTransition.mock.calls.length;
        fireEvent.click(element);
        expect(document.startViewTransition.mock.calls.length, nom).toBe(abans + 1);
        expect(window.location.pathname, nom).toBe(desti);
        await acabaLesFoses(registre);
      }
      expect(registre.urlEnCridar).toEqual(['/pobles', '/mercat', '/control', '/cerca']);
    } finally {
      desmunta();
    }
  }, 30000);

  /* ARB-B7a-02 · navigateWithTransition passa les opcions de qui la crida. La
     barra negra hi porta l'estat de recuperació de l'espai d'identitat
     (Encàrrec 261018_1220, useIdentitatDeLaBarra · ambRecuperacio): amb sessió
     i una sola identitat, l'avatar porta al perfil propi amb eixe estat. */
  test('l’avatar de la barra negra fa la fosa i porta l’estat de recuperació de l’espai', async () => {
    const { default: PedraSecaEmbed } = await import('../../PedraSecaEmbed');
    const { CLAU_RECUPERACIO_ESPAI } = await import('../../components/universal/identitat/useIdentitatDeLaBarra.js');
    const usuari = { id: 'u-fosa', user_metadata: { full_name: 'Pepa Soler' } };
    const desmunta = await preparaApp(usuari, { listMyOrganizations: async () => [] });
    const registre = simulaApi();
    try {
      render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'local' }} />);
      const avatar = await screen.findByRole('button', { name: 'El teu perfil: Pepa Soler' }, { timeout: 8000 });
      const abans = document.startViewTransition.mock.calls.length;
      fireEvent.click(avatar);
      expect(document.startViewTransition.mock.calls.length).toBe(abans + 1);
      expect(window.location.pathname).toBe('/el-meu-perfil');
      expect(Number.isInteger(estatPublicHistorial()?.[CLAU_RECUPERACIO_ESPAI])).toBe(true);
      await acabaLesFoses(registre);
      expect(window.location.pathname).toBe('/el-meu-perfil');
    } finally {
      desmunta();
    }
  }, 30000);
});
