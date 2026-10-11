import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within, act } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { copyConsola, paginaConsola } from '../sections/consola/consolaPagines.js';
import { createTranslator } from '../config/i18n';
import {
  CLAU_FRANJA_TANCADA, desaFranjaTancada, etiquetesDeLaFranja, franjaTancadaPer, textDelNode
} from '../components/universal/MarcaAmfitrio.jsx';
import { STORAGE_PREFIX } from '../config/storage.js';
import {
  CLAU_ENLLAC_OBERT, ESTAT_ENLLAC, anunciaEnllacDeRecuperacio, estatEnllacDeRecuperacio, marcaRecuperacioPendent,
  oblidaRecuperacioPendent, recuperacioPendentPer
} from '../data/recuperacioPendent.js';
import { MemoryRouter } from './contexts/RouterContext.jsx';
import EspecimenShell from '../sections/disseny/cataleg/detalls/EspecimenShell.jsx';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async importOriginal => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

/* A vitest DEV és true. `produccio` fa que App veja un build sense tocar
   l'entorn; la resta de vegades la guarda real rep el DEV que li passa App. */
const guarda = vi.hoisted(() => ({ produccio: false }));
vi.mock('./guards/guardaConsola.js', async importOriginal => {
  const real = await importOriginal();
  return { ...real, consolaDemanaSessio: dev => guarda.produccio || real.consolaDemanaSessio(dev) };
});

/* T7 (261001) · La X de la franja es recorda a sessionStorage: cada prova
   comença sense. Les proves són fora de L2 (tractor-persistencia). */
const CLAU_DESADA = STORAGE_PREFIX + CLAU_FRANJA_TANCADA;

afterEach(() => {
  cleanup();
  guarda.produccio = false;
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.sessionStorage.removeItem(CLAU_DESADA);
  delete window.navigator.onLine;
  /* R · la marca de recuperació pendent viu a localStorage: cap prova l'hereta. */
  oblidaRecuperacioPendent();
});

test('arranca el shell real i carrega els providers sense activar ErrorBoundary', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const peticioExterna = vi.fn(() => { throw new Error('Xarxa inesperada al smoke test'); });
  vi.stubGlobal('fetch', peticioExterna);
  const inesperat = vi.fn(name => { throw new Error('Mètode inesperat: ' + name); });
  const errors = vi.spyOn(console, 'error');
  const anterior = { ...getBackendImplementation() };
  const backend = {
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, (...args) => inesperat(name, ...args)])),
    getCurrentUser: () => ({ id: '123' }),
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => '123',
    recullTornadaOAuth: async () => null,
    loadCoreContent: vi.fn(async () => ({ towns: [], pages: [], agents: [] })),
    loadMur: vi.fn(async () => ({ feedPosts: [], events: [], marketItems: [] })),
    loadNotes: vi.fn(async () => ({ notes: [], noteFolders: [] })),
    loadMultimedia: vi.fn(async () => ({ mediaItems: [], mediaTimelineGroups: [] })),
    loadFils: vi.fn(async () => []),
    /* Amb sessió, la identitat carrega les organitzacions on la persona mana
       (IdentitatContext): és una lectura esperada, no una crida inesperada. */
    listMyOrganizations: vi.fn(async () => [])
  };
  setBackendImplementation(backend);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'memory' }} />);
    await waitFor(() => {
      expect(backend.loadCoreContent).toHaveBeenCalled();
      expect(backend.loadNotes).toHaveBeenCalled();
      expect(backend.loadMur).toHaveBeenCalled();
      expect(backend.loadMultimedia).toHaveBeenCalled();
      expect(backend.loadFils).toHaveBeenCalled();
      expect(backend.listMyOrganizations).toHaveBeenCalled();
      expect(screen.getByRole('main')).toBeTruthy();
    });
    /* La ruta lazy real encara ha de resoldre després dels providers. El
       límit de Testing Library (1 s) no és un pressupost de transformació de
       Vite en fred; manté el botó i totes les guàrdies de xarxa/error exigits. */
    await screen.findByRole('button', { name: 'Nova conversa' }, { timeout: 8000 });
    expect(screen.queryByText("No s'ha pogut carregar Sóc de Poble")).toBeNull();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
    expect(inesperat).not.toHaveBeenCalled();
    expect(peticioExterna).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    /* Onada 11 (261010; prompt 261010_1730, tasca 2) · Llei del Píxel: sense
       estil desat (este loadCoreContent no torna `personalitzacio`),
       EstilDelPoble no afig cap <style> ni cap full al document. */
    expect(document.querySelector('style[data-sdp-estil]')).toBeNull();
    expect(document.adoptedStyleSheets?.length ?? 0).toBe(0);
  } finally {
    cleanup();
    // Si hi havia backend, el restaurem; el cas inicial buit queda aïllat per Vitest.
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}, 10000);

/* ── T43 (ordre del Mestre, 260928) · Identitat activa a la barra negra ──
   Shell real amb sessió: el botó diu amb qui actues, el calaix és germà del
   header (no n'hereta el crom), sense estils en línia, i triar una entitat
   canvia el botó a les SEUES inicials amb l'anell d'entitat. */
test('T43 · la barra negra diu amb qui actues i el calaix d’identitats viu fora del header', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Xarxa inesperada'); }));
  const anterior = { ...getBackendImplementation() };
  const usuari = { id: 'u-t43', user_metadata: { full_name: 'Pepa Soler' } };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => usuari,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => usuari.id,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    listMyOrganizations: async () => [{ id: 'o-forn', name: 'Forn de la Torre', role: 'owner', slug: 'forn', kind: 'company', logo_url: null }]
  });
  try {
    render(<PedraSecaEmbed config={{ routerType: 'memory' }} />);
    // La identitat viu al header: mantenim rol/nom accessibles sense recórrer tot el catàleg.
    const header = await waitFor(() => {
      const trobat = document.querySelector('header.bar-black');
      expect(trobat).not.toBeNull();
      return trobat;
    });
    const boto = await within(header).findByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
    expect(boto.closest('header.bar-black')).not.toBeNull();
    expect(boto.hasAttribute('style')).toBe(false);
    fireEvent.click(boto);
    const dialeg = await screen.findByRole('dialog', { name: 'Amb qui actues?' });
    expect(dialeg.closest('header.bar-black')).toBeNull();
    expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
    const forn = await within(dialeg).findByRole('button', { name: /Forn de la Torre/ });
    expect(within(dialeg).getByRole('button', { name: /Pepa Soler/ }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(forn);
    const entitat = await within(header).findByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
    expect(entitat.classList.contains('sdp-top-bar-avatar--entitat')).toBe(true);
    expect(entitat.querySelector('.sdp-avatar').textContent).toBe('FD');
    /* Deixa la preferència com estava: es torna a actuar com a persona. */
    fireEvent.click(entitat);
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Amb qui actues?' })).getByRole('button', { name: /Pepa Soler/ }));
    await within(header).findByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
});

/* ── Acta 261004_1027 §3 (ordre del Mestre, beta testers) ────────────────
   Shell real amb sessió i sense cap organització: a la barra negra, en lloc
   del Foraster, l'avatar de la persona, gran (Avatar lg) i redó, que porta
   al perfil propi. Sense sessió, el Foraster de sempre («Entrar»). */
test('acta 261004_1027 · amb sessió, l’avatar gran de la barra negra porta a /el-meu-perfil', async () => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Xarxa inesperada'); }));
  const anterior = { ...getBackendImplementation() };
  const usuari = { id: 'u-beta', user_metadata: { full_name: 'Pepa Soler', avatar_url: 'https://lh3.googleusercontent.com/a/pepa.png' } };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => usuari,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => usuari.id,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    listMyOrganizations: async () => []
  });
  window.history.replaceState(null, '', '/mur');
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    const boto = await screen.findByRole('button', { name: 'El teu perfil: Pepa Soler' });
    const header = boto.closest('header.bar-black');
    expect(header).not.toBeNull();
    /* El Foraster ja no hi és: el botó d'entrar de la barra és l'avatar. */
    expect(within(header).queryByRole('button', { name: 'Entrar' })).toBeNull();
    expect(boto.className).toBe('sdp-top-bar-avatar');
    expect(boto.hasAttribute('aria-haspopup')).toBe(false);
    expect(boto.querySelector('.sdp-avatar.sdp-avatar--lg')).not.toBeNull();
    const img = await waitFor(() => {
      const trobada = boto.querySelector('img');
      expect(trobada).not.toBeNull();
      return trobada;
    });
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(header.querySelectorAll('[style]')).toHaveLength(0);
    fireEvent.click(boto);
    await waitFor(() => expect(window.location.pathname).toBe('/el-meu-perfil'));
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
});

/* ── Rutes amb barrera, sense sessió ─────────────────────────────────────
   Router de navegador sobre la URL de jsdom: RequireAuth porta a
   /registre?tornar=… amb replaceState i es llig a window.location. */

/* `backendExtra` (T4) · substituïx mètodes del backend fals, per a espiar-ne un. */
async function muntaSenseSessio(ruta, cos, config = { routerType: 'browser' }, backendExtra = {}, observer = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }) {
  vi.stubGlobal('ResizeObserver', observer ?? undefined);
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  // Fora del middleware de dev, /__iaia/* és 404: la Consola ho diu «no disponible».
  vi.stubGlobal('fetch', vi.fn(async url => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
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
    render(<PedraSecaEmbed config={config} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const tornar = () => new URLSearchParams(window.location.search).get('tornar');

/* Acta 261004_1027 §3 · Sense sessió, el Foraster de sempre a la barra negra:
   la icona de persona amb «Entrar», cap avatar. */
test('acta 261004_1027 · sense sessió, la barra negra porta el Foraster de sempre i cap avatar', async () => {
  await muntaSenseSessio('/mur', async () => {
    const header = await waitFor(() => {
      const trobat = document.querySelector('header.bar-black');
      expect(trobat).not.toBeNull();
      return trobat;
    });
    const entrar = await within(header).findByRole('button', { name: 'Entrar' });
    expect(entrar.className).toBe('icon sdp-top-bar-btn');
    expect(entrar.getAttribute('title')).toBe('Entrar');
    expect(entrar.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(header.querySelector('.sdp-top-bar-avatar, .sdp-avatar')).toBeNull();
    expect(within(header).queryByRole('button', { name: /El teu perfil/ })).toBeNull();
  });
});

test('a vite serve el tauler de la Consola es pinta sense sessió i no porta a /registre', async () => {
  await muntaSenseSessio('/consola', async () => {
    // Import real de la Consola: el primer transform de Vite pot superar 1s.
    // Esperem el resultat accessible amb límit, sense substituir el lazy per un mock.
    expect(await screen.findByRole('heading', { name: copyConsola().title }, { timeout: 8000 })).toBeTruthy();
    expect(window.location.pathname).toBe('/consola');
    expect(screen.getByRole('navigation', { name: 'Pàgines de la Consola' })).toBeTruthy();
  });
}, 10000);

test('a vite serve una pàgina de la Consola (/consola/pols) es pinta sense sessió', async () => {
  await muntaSenseSessio('/consola/pols', async () => {
    expect(await screen.findByRole('heading', { name: paginaConsola('pols').title }, { timeout: 8000 })).toBeTruthy();
    expect(window.location.pathname).toBe('/consola/pols');
    // 404 de /__iaia/consola.json → la pàgina ho diu, no inventa dades.
    expect(await screen.findByText('Consola no disponible')).toBeTruthy();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
  });
}, 10000);

test('en un build (DEV false) /consola/pols sense sessió continua portant a /registre', async () => {
  guarda.produccio = true;
  await muntaSenseSessio('/consola/pols', async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(tornar()).toBe('/consola/pols');
  });
});

/* ── Lliscar per recarregar ──────────────────────────────────────────────
   Les regles del gest es proven a hooks/usePullToRefresh.test.js; ací només
   el cablejat al shell real: indicador accessible i contenidor intern. */
function toca(el, tipus, punts = []) {
  const ev = new Event(tipus, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: punts.map(([x, y]) => ({ clientX: x, clientY: y })) });
  el.dispatchEvent(ev);
  return ev;
}

test('lliscar per recarregar: indicador accessible i cap gest amb un contenidor intern desplaçat', async () => {
  await muntaSenseSessio('/consola', async () => {
    const main = await screen.findByRole('main');
    const indicador = main.querySelector('.sdp-ptr-indicator');
    expect(indicador.getAttribute('role')).toBe('status');
    expect(indicador.getAttribute('aria-live')).toBe('polite');
    expect(indicador.hasAttribute('aria-hidden')).toBe(false);
    expect(indicador.dataset.estat).toBe('repos');
    expect(indicador.textContent).toBe('');

    const contingut = main.querySelector('.app-main__content');
    const objectiu = contingut.firstElementChild || contingut;

    // Contenidor intern a mitja llista: el dit que baixa vol pujar, no recarregar.
    Object.defineProperty(objectiu, 'scrollTop', { configurable: true, value: 1200 });
    toca(objectiu, 'touchstart', [[100, 100]]);
    expect(toca(objectiu, 'touchmove', [[100, 400]]).defaultPrevented).toBe(false);
    expect(indicador.dataset.estat).toBe('repos');
    toca(objectiu, 'touchend');

    // A dalt de tot s'arma; touchcancel el desfà sense recarregar.
    Object.defineProperty(objectiu, 'scrollTop', { configurable: true, value: 0 });
    toca(objectiu, 'touchstart', [[100, 100]]);
    toca(objectiu, 'touchmove', [[100, 160]]);
    expect(indicador.dataset.estat).toBe('estirant');
    expect(indicador.textContent).not.toBe('');
    toca(objectiu, 'touchcancel');
    expect(indicador.dataset.estat).toBe('repos');
    expect(contingut.style.transform).toBe('');
  });
});

/* ── Punt de tall de la barra lateral (ordre del Mestre, 260926) ─────────
   A 1024px la barra es veu com a columna fixa; a 1023px i menys és el calaix
   (Dialeg) de sempre. layout.css talla al mateix número; l'ample al contingut
   i el topall de 260px són CSS i es comproven al navegador, no a jsdom. */
test('a 1024px la barra lateral és columna fixa, fora del calaix', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/consola', async () => {
    const barra = await screen.findByRole('navigation', { name: 'Navegació principal' });
    expect(barra.closest('dialog')).toBeNull();
    expect(barra.classList.contains('app-sidebar--oberta')).toBe(true);
    expect(screen.getByRole('button', { name: 'Obrir o tancar menú Sóc de Poble' }).getAttribute('aria-expanded')).toBe('true');
  });
});

test('a 1023px la barra lateral continua dins del calaix compacte', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/consola', async () => {
    await screen.findByRole('main');
    const barra = document.getElementById('app-sidebar');
    expect(barra.closest('dialog.sdp-dialeg-sidebar')).not.toBeNull();
    expect(barra.classList.contains('app-sidebar--oberta')).toBe(false);
  });
});

/* /realitat ja no porta guarda de sessió: el Selector de Realitat es va
   desbloquejar el 260927 (informe de vistes 0050) i s'obri sense registre. */
test.each(['/admin', '/el-meu-perfil'])('%s continua portant a /registre sense sessió també a vite serve', async ruta => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(tornar()).toBe(ruta);
  });
});

/* ── T61 (decisió del Mestre, 260928) · Cap fals actiu a les barres ───────
   El perfil propi és un espai de la identitat activa (s'hi arriba des de la
   barra negra), no una filla de Pobles: a /el-meu-perfil no s'encén cap
   entrada, ni a la barra lateral ni a la mòbil. Les filles legítimes de T27
   continuen encenent el seu pare. A 1024px la barra lateral és columna fixa i
   la mòbil sempre és al DOM: totes dues es poden llegir alhora. */

/* Què diu «estic ací» dins d'una barra: href dels enllaços, nom dels botons. */
const actius = nav => [...nav.querySelectorAll('[aria-current], .active')]
  .map(el => el.getAttribute('href') ?? el.getAttribute('aria-label'));

async function barres() {
  const principal = await screen.findByRole('navigation', { name: 'Navegació principal' });
  const mobil = screen.getByRole('navigation', { name: 'Navegació mòbil' });
  /* Sense Pobles pintat, «cap actiu» seria cert per buit. */
  for (const nav of [principal, mobil]) expect(nav.querySelector('a[href="/pobles"]')).not.toBeNull();
  return [principal, mobil];
}

/* Shell real amb sessió i router de navegador. La sessió se sincronitza abans
   de muntar: l'estat de sessionService és de mòdul i una prova anterior el pot
   haver deixat en 'fora', i RequireAuth portaria a /registre abans d'hora. */
async function muntaAmbSessio(ruta, cos) {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Xarxa inesperada'); }));
  const anterior = { ...getBackendImplementation() };
  const usuari = { id: 'u-t61', user_metadata: { full_name: 'Pepa Soler' } };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => usuari,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => usuari.id,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    listMyOrganizations: async () => [{ id: 'o-1', name: 'Forn de la Torre', role: 'owner', slug: 'forn', kind: 'company', logo_url: null }]
  });
  sincronitza();
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('dins'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

test.each(['/el-meu-perfil', '/el-meu-perfil?organitzacio=o-1'])('T61 · a %s no s’encén cap entrada de la barra lateral ni de la mòbil', async ruta => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaAmbSessio(ruta, async () => {
    const [principal, mobil] = await barres();
    /* La guarda ha deixat passar: és el perfil propi, no /registre.
       PerfilShell és un chunk lazy(): amb la suite sencera la càrrega passa
       del segon per defecte de waitFor (1.068-1.345 ms mesurats el 260929). */
    await waitFor(() => expect(document.querySelector('.sdp-gestor-pagina')).not.toBeNull(), { timeout: 3000 });
    expect(window.location.pathname + window.location.search).toBe(ruta);
    for (const nav of [principal, mobil]) {
      const pobles = nav.querySelector('a[href="/pobles"]');
      expect(pobles.hasAttribute('aria-current')).toBe(false);
      expect(pobles.classList.contains('active')).toBe(false);
      expect(actius(nav)).toEqual([]);
    }
  });
});

test.each([
  ['/pobles', '/pobles'],
  ['/poblacio', '/pobles'],
  ['/control-xat', '/xat']
])('T61 · no-regressió: %s encén %s i només eixa entrada a totes dues barres', async (ruta, entrada) => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio(ruta, async () => {
    const navs = await barres();
    expect(window.location.pathname).toBe(ruta);
    for (const nav of navs) {
      const enllac = nav.querySelector(`a[href="${entrada}"]`);
      expect(enllac.getAttribute('aria-current')).toBe('page');
      expect(enllac.classList.contains('active')).toBe(true);
      expect(actius(nav)).toEqual([entrada]);
    }
  });
});

/* Onada 3B · Les vistes del rail del Xat (?vista=) són /xat: les barres
   continuen encenent només «Xat», i és el rail del Xat qui marca la vista. */
test('3B · /xat?vista=comunitats encén només /xat a les barres i el rail del Xat marca «Comunitats»', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/xat?vista=comunitats', async () => {
    const navs = await barres();
    expect(window.location.pathname).toBe('/xat');
    expect(window.location.search).toBe('?vista=comunitats');
    for (const nav of navs) expect(actius(nav)).toEqual(['/xat']);
    await waitFor(() => expect(document.getElementById('app-grid-list')?.textContent).toContain('Encara no formes part de cap comunitat'));
    const columna = document.getElementById('app-grid-list');
    expect(columna.querySelector('aside[aria-label="Comunitats"]')).not.toBeNull();
    expect(columna.querySelector('input[name="xatSearch"]')).toBeNull();
    const marcades = [...document.getElementById('app-grid-sidebar').querySelectorAll('[aria-current="page"]')];
    expect(marcades.map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual(['Comunitats']);
  });
});

test('T61 · no-regressió: a /control l’únic actiu és el botó CONTROL de la barra lateral', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/control', async () => {
    const [principal, mobil] = await barres();
    expect(window.location.pathname).toBe('/control');
    expect(within(principal).getByRole('button', { name: 'Panell de control' }).getAttribute('aria-current')).toBe('page');
    expect(actius(principal)).toEqual(['Panell de control']);
    expect(actius(mobil)).toEqual([]);
  });
});

/* ── T3 (ordre del Mestre, 260930; esmena del 261006) · Barra inferior mòbil ──
   Ordre explícit (ja no ix de tallar SECTIONS). Telefonades n'ha eixit per
   decisió del Mestre (261006, «Sí, fora de la barra»): l'avís de D17 viu a
   la vista Telefonades del rail del Xat (/xat?vista=telefonades), no a la
   barra. Onada 5 (ordre del Mestre, 261008): Xat, Mur, el botó central
   «Panell de Control», Mercat i Pobles, el mateix ordre que les quatre
   primeres de la barra lateral, que conserva el seu. */
const AVIS_D17 = 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.';
const casellaMobil = (el) => el.getAttribute('href') ?? el.getAttribute('aria-label') ?? el.textContent;

test('T3 · la barra mòbil porta Xat, Mur, Panell de Control, Mercat i Pobles, en eixe ordre, i res més', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/mur', async () => {
    const [principal, mobil] = await barres();
    expect([...mobil.children].map(casellaMobil)).toEqual(['/xat', '/mur', 'Panell de Control', '/mercat', '/pobles']);
    expect([...mobil.children].map((el) => el.getAttribute('aria-label') ?? el.textContent))
      .toEqual(['Xat', 'Mur', 'Panell de Control', 'Mercat', 'Pobles']);
    expect([...mobil.children].map((el) => el.tagName)).toEqual(['A', 'A', 'BUTTON', 'A', 'A']);
    /* La barra mòbil és germana directa del <main> i l'últim node de la
       closca: cap embolcall ni cap node buit al voltant (MobileNav). */
    expect(mobil.previousSibling).toBe(document.getElementById('main-content'));
    expect(mobil.nextSibling).toBeNull();
    /* La barra lateral no canvia: continua amb l'ordre de SECTIONS. */
    expect([...principal.querySelectorAll('a.nav-item')].slice(0, 4).map((a) => a.getAttribute('href')))
      .toEqual(['/xat', '/mur', '/mercat', '/pobles']);
    /* Onada 5 · Coherència: els enllaços de la barra mòbil són, en el mateix
       ordre, les quatre primeres de la lateral. Els arrays continuen separats
       (T3): si algú en canvia un sense l'altre, ho diu esta línia. */
    expect([...mobil.querySelectorAll('a.nav-item')].map((a) => a.getAttribute('href')))
      .toEqual([...principal.querySelectorAll('a.nav-item')].slice(0, 4).map((a) => a.getAttribute('href')));
    /* Telefonades no és cap ruta, ni a la barra mòbil ni a la lateral. */
    for (const nav of [principal, mobil]) expect(nav.querySelector('a[href*="telefonades"]')).toBeNull();
    expect(actius(mobil)).toEqual(['/mur']);
  });
});

test('T3 · el botó central es diu «Panell de Control», no té text visible ni estat actiu, i porta a /control', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/mur', async () => {
    const [, mobil] = await barres();
    const central = within(mobil).getByRole('button', { name: 'Panell de Control' });
    expect(central.classList.contains('mobile-nav__cta')).toBe(true);
    expect(central.textContent).toBe('');
    expect(central.hasAttribute('aria-current')).toBe(false);
    fireEvent.click(central);
    await waitFor(() => expect(window.location.pathname).toBe('/control'));
    /* Garantia de T61: a /control la barra mòbil no encén res. */
    expect(central.hasAttribute('aria-current')).toBe(false);
    expect(actius(mobil)).toEqual([]);
  });
});

test('T3 · Telefonades no és a la barra mòbil; l’avís de D17 s’obri des del rail del Xat, sense xarxa, i les barres només encenen Xat', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/mur', async () => {
    const [principal, mobil] = await barres();
    /* Decisió del Mestre (261006): ni botó ni rètol Telefonades a la barra
       mòbil, ni el diàleg de D17 que obria. L'únic botó és el central. */
    expect(within(mobil).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Panell de Control']);
    expect(within(mobil).queryByRole('button', { name: 'Telefonades' })).toBeNull();
    expect(within(mobil).queryByText('Telefonades')).toBeNull();
    expect(mobil.querySelector('[aria-haspopup]')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Telefonades' })).toBeNull();
    expect(screen.queryByText(AVIS_D17)).toBeNull();
    const peticions = globalThis.fetch.mock.calls.length;

    /* L'avís de D17 continua accessible: Xat (barra mòbil) → Menú (obri el
       rail del Xat, que fora d'«ample» és un panell tancat) → Telefonades. */
    fireEvent.click(within(mobil).getByRole('link', { name: 'Xat' }));
    await waitFor(() => expect(window.location.pathname).toBe('/xat'));
    const obriRail = await waitFor(() => {
      const trobat = document.getElementById('app-grid-list')?.querySelector('.sdp-xat-obri-rail');
      expect(trobat).toBeTruthy();
      return trobat;
    });
    expect(obriRail.getAttribute('aria-controls')).toBe('app-grid-sidebar');
    fireEvent.click(obriRail);
    const rail = document.getElementById('app-grid-sidebar');
    await waitFor(() => expect(rail.getAttribute('data-obert')).toBe('true'));
    fireEvent.click(within(rail).getByRole('button', { name: 'Telefonades' }));
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe('/xat?vista=telefonades'));
    const columna = await screen.findByRole('complementary', { name: 'Telefonades' });
    const targeta = within(columna).getByRole('region', { name: 'En construcció' });
    expect(targeta.querySelector('.sdp-xat-construccio__avis').textContent).toBe(AVIS_D17);
    expect([...rail.querySelectorAll('[aria-current="page"]')].map((el) => el.getAttribute('aria-label') ?? el.textContent))
      .toEqual(['Telefonades']);
    /* És una vista del Xat, no una ruta pròpia: les dues barres encenen només Xat. */
    for (const nav of [principal, mobil]) expect(actius(nav)).toEqual(['/xat']);
    expect(screen.queryByRole('dialog', { name: 'Telefonades' })).toBeNull();
    expect(globalThis.fetch.mock.calls.length).toBe(peticions);
  });
});

/* ── T4 (ordre del Mestre, 260930) · Àlies d'entrada ─────────────────────
   /login, /accedir i /entrar obrin /registre en mode Entrar; /crear-compte,
   en mode Crear. La consulta rebuda es conserva, però el ?tornar només passa
   si és intern i no torna a l'entrada (tornadaSegura). */
const consulta = () => Object.fromEntries(new URLSearchParams(window.location.search));

test.each([
  ['/login?tornar=%2Fmur', { mode: 'entrar', tornar: '/mur' }],
  ['/accedir?tornar=%2Fmercat', { mode: 'entrar', tornar: '/mercat' }],
  ['/entrar?tornar=%2Fpobles', { mode: 'entrar', tornar: '/pobles' }],
  ['/entrar', { mode: 'entrar' }],
  ['/crear-compte', { mode: 'crear' }],
  ['/crear-compte?tornar=%2Fxat%3Fvista%3Dcomunitats', { mode: 'crear', tornar: '/xat?vista=comunitats' }]
])('T4 · %s porta a /registre amb el mode de l’àlies i el tornar intern', async (ruta, esperat) => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(consulta()).toEqual(esperat);
  });
});

test.each([
  '/login?tornar=%2F%2Fdolent.example',
  '/login?tornar=https%3A%2F%2Fdolent.example%2Fmur',
  '/login?tornar=%2Fregistre%3Fmode%3Dcrear',
  '/login?tornar=%2Fmur%5Cx'
])('T4 · %s descarta un tornar extern, amb barra inversa o que torna a l’entrada', async (ruta) => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(consulta()).toEqual({ mode: 'entrar' });
  });
});

/* Correcció de la revisió (260930) · Totes les portes porten a Entrar, i ni
   Onboarding ni UniversalPage registren SEO propi: el títol de la pestanya és
   la reserva de RouteSEO, que no ha de dir «Crear compte» sobre el formulari
   d'Entrar. manageDocumentHead fa que el títol s'escriga de veres. */
test.each(['/login', '/crear-compte'])('T4 · a %s la pestanya diu «Entrar o crear compte», mai només un dels dos modes', async (ruta) => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    await waitFor(() => expect(document.title).toBe('Entrar o crear compte | Sóc de Poble'));
  }, { routerType: 'browser', manageDocumentHead: true });
});

test('T4 · el mode de l’àlies mana sobre un ?mode rebut i la resta de la consulta es conserva', async () => {
  await muntaSenseSessio('/crear-compte?mode=entrar&tornar=%2Fmur&origen=cartell', async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(consulta()).toEqual({ mode: 'crear', tornar: '/mur', origen: 'cartell' });
  });
});

/* Onada 5 (ordre del Mestre, 261008) · Àlies «chat» → «xat», amb el patró
   de /ia → /iaia: un enllaç copiat amb la paraula anglesa aterra al Xat i
   conserva la consulta. Abans /chat era NotFound i /chat/<fil>, «Element no
   trobat». El fil es torna a codificar: una barra dins de l'identificador
   no talla la ruta en dos. */
test.each([
  ['/chat', '/xat', {}],
  ['/chat?vista=comunitats', '/xat', { vista: 'comunitats' }],
  ['/chat/abc', '/xat/abc', {}],
  ['/chat/fil%2F1?vista=comunitats', '/xat/fil%2F1', { vista: 'comunitats' }]
])('Onada 5 · l’àlies %s porta a %s i conserva la consulta', async (ruta, desti, esperat) => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe(desti));
    expect(consulta()).toEqual(esperat);
  });
});

/* T4 · La tornada d'OAuth només es recull en mode remot. En llavor o local
   l'adaptador la rebutja sempre i, en un build, cada càrrega pintava el toast
   «L’entrada real…». El cas remot és el control: sense ell, «no es crida»
   podria ser cert per buit. */
test.each([
  ['seed', 0],
  ['local', 0],
  ['remote', 1]
])('T4 · amb dataMode %s, recullTornadaOAuth es crida %i vegades', async (dataMode, vegades) => {
  vi.stubGlobal('innerWidth', 1024);
  const recull = vi.fn(async () => null);
  await muntaSenseSessio('/mur', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(vegades);
    expect(screen.queryByText(/L’entrada real/)).toBeNull();
  }, { routerType: 'browser', dataMode }, { recullTornadaOAuth: recull });
});

/* Ordre del Mestre (261002) · Google per redirecció: una tornada d'OAuth que
   porta sessió aterra al propi perfil encara que el relé no torne a /registre
   (router en memòria dins d'una pàgina amfitriona, o un sdp_path que
   callback.html rebutja i porta a l'arrel). La sessió arriba com en
   oauthRelay.bescanvia: primer l'avís sdp:auth-change, després la promesa. */
test('261002 · una tornada d’OAuth amb sessió aterra a /el-meu-perfil des de qualsevol ruta', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  let resol = null;
  const recull = vi.fn(() => new Promise((r) => { resol = r; }));
  await muntaSenseSessio('/mur', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe('/mur');
    usuari = { id: 'u-261002', user_metadata: { full_name: 'Pepa Soler' } };
    await act(async () => {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
      resol({ access_token: 'sintetic', user: usuari });
    });
    await waitFor(() => expect(window.location.pathname).toBe('/el-meu-perfil'));
    expect(window.location.search).toBe('');
  }, { routerType: 'browser', dataMode: 'remote' },
  { recullTornadaOAuth: recull, getCurrentUser: () => usuari, listMyOrganizations: async () => [] });
});

test('261002 · una tornada d’OAuth sense sessió no mou la ruta', async () => {
  vi.stubGlobal('innerWidth', 1024);
  const recull = vi.fn(async () => null);
  await muntaSenseSessio('/mur', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(1);
    await act(async () => { await Promise.resolve(); });
    expect(window.location.pathname).toBe('/mur');
  }, { routerType: 'browser', dataMode: 'remote' }, { recullTornadaOAuth: recull });
});

/* R (Onada 3, 261003) · La tornada d'un enllaç de recuperació de contrasenya
   (`recuperacio: true`, contracte.js) aterra a l'entrada, on la secció demana
   la contrasenya nova; ni el perfil ni el toast de benvinguda. Amb el port
   real i la capacitat al backend fals.
   R2 (decisió del Mestre, 261003) · Arriba SENSE sessió: l'enllaç espera
   «Desa» (data/recuperacioPendent.js). Este backend fals no l'anuncia: ho fa
   App.jsx en rebre `recuperacio: true`. «Desa» (definixContrasenyaNova) és qui
   obri la sessió. */
const TITOL_NOVA = 'Definix la contrasenya nova';
const TITOL_PERDUT = 'Torna a obrir l’enllaç del correu';
const NOVA = 'contrasenya-nova-llarga';
const ambRecuperacio = (usuariDe, extra = {}) => ({
  getCurrentUser: () => usuariDe(), listMyOrganizations: async () => [],
  demanaRecuperacioContrasenya: async () => ({ enviat: true }), definixContrasenyaNova: async () => true,
  ...extra
});
const omplIDesa = async () => {
  fireEvent.change(screen.getByLabelText('Contrasenya nova'), { target: { name: 'password', value: NOVA } });
  fireEvent.change(screen.getByLabelText('Confirmar contrasenya nova'), { target: { name: 'confirmPassword', value: NOVA } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desa la contrasenya nova' })); });
};

test('R2 · una tornada de recuperació arriba sense sessió: /registre amb la pantalla genèrica, cap compte ni perfil', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let resol = null;
  const recull = vi.fn(() => new Promise((r) => { resol = r; }));
  await muntaSenseSessio('/mur', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(1);
    await act(async () => { resol({ recuperacio: true }); });
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
    expect(screen.queryByText(/Compte:/)).toBeNull();
    expect(getSessionState().estat).toBe('fora');
    expect(screen.queryByText('Benvingut de nou!')).toBeNull();
  }, { routerType: 'browser', dataMode: 'remote' },
  { recullTornadaOAuth: recull, ...ambRecuperacio(() => null) });
});

/* R2 · Sense sessió, la guarda també porta qualsevol ruta a la pantalla; «Desa»
   (el port verifica i definix) obri la sessió, oblida l'enllaç i l'entrada és
   la normal, al perfil, sense tornar enrere. */
test('R2 · amb l’enllaç pendent, navegar a /mur torna a la pantalla; «Desa» obri la sessió i porta al perfil, i s’hi queda', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  const desa = vi.fn(async () => {
    usuari = { id: 'u-r2-desa', email: 'ana@poble.test' };
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
    return true;
  });
  await muntaSenseSessio('/registre?mode=entrar', async () => {
    const [principal] = await barres();
    await act(async () => { anunciaEnllacDeRecuperacio(); });
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();

    await act(async () => { fireEvent.click(principal.querySelector('a[href="/mur"]')); });
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
    expect(getSessionState().estat).toBe('fora');

    await omplIDesa();
    expect(desa).toHaveBeenCalledWith(NOVA, expect.objectContaining({ dataMode: 'remote' }));
    await waitFor(() => expect(window.location.pathname).toBe('/el-meu-perfil'));
    expect(estatEnllacDeRecuperacio()).toBeNull();
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(window.location.pathname).toBe('/el-meu-perfil');
  }, { routerType: 'browser', dataMode: 'remote' },
  { ...ambRecuperacio(() => usuari, { definixContrasenyaNova: desa }) });
});

/* R2 · Incrustació (router en memòria): una recàrrega perd la memòria del
   document, i amb ella el token, però no la marca de la pestanya. La pantalla
   diu que cal tornar a obrir l'enllaç, i la URL de l'amfitrió no es toca. */
test('R2 · MEMÒRIA: després de recarregar sense el token, la pantalla demana tornar a obrir l’enllaç sense tocar la URL de l’amfitrió', async () => {
  vi.stubGlobal('innerWidth', 1024);
  window.sessionStorage.setItem(STORAGE_PREFIX + CLAU_ENLLAC_OBERT, '{"v":1}');
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await screen.findByRole('main');
    expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PERDUT);
    expect(await screen.findByRole('heading', { name: TITOL_PERDUT })).toBeTruthy();
    expect(screen.queryByLabelText('Contrasenya nova')).toBeNull();
    expect(window.location.pathname).toBe('/pagina-de-lamfitrio');
  }, { routerType: 'memory', dataMode: 'remote' }, ambRecuperacio(() => null));
});

/* Compatibilitat (correcció de la revisió de R) · Un backend que torna una
   sessió amb l'enllaç (el contracte d'abans de R2): la sessió és completa i,
   fins que es definix la contrasenya nova, cap altra ruta. Una navegació des de
   la barra lateral torna a l'entrada; desar la contrasenya nova esborra la marca
   i l'entrada és la normal, al perfil, sense tornar enrere. */
test('R · compatibilitat: una tornada amb sessió es marca i aterra a /registre amb el compte, no al perfil', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  let resol = null;
  const recull = vi.fn(() => new Promise((r) => { resol = r; }));
  await muntaSenseSessio('/mur', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(1);
    usuari = { id: 'u-r261003', email: 'ana@poble.test', user_metadata: { full_name: 'Ana Puig' } };
    await act(async () => {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
      resol({ access_token: 'sintetic', user: usuari, recuperacio: true });
    });
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(recuperacioPendentPer('u-r261003')).toBe(true);
    expect(estatEnllacDeRecuperacio()).toBeNull();
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
    expect(screen.getByText('ana@poble.test')).toBeTruthy();
    expect(window.location.pathname).toBe('/registre');
    expect(screen.queryByText('Benvingut de nou!')).toBeNull();
  }, { routerType: 'browser', dataMode: 'remote' },
  { recullTornadaOAuth: recull, ...ambRecuperacio(() => usuari) });
});

test('R · compatibilitat: amb una sessió marcada, navegar a /mur torna a la pantalla nova; desar-la porta al perfil i s’hi queda', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  const desa = vi.fn(async () => true);
  await muntaSenseSessio('/registre?mode=entrar', async () => {
    const [principal] = await barres();
    usuari = { id: 'u-r-guarda', email: 'ana@poble.test' };
    await act(async () => {
      marcaRecuperacioPendent(usuari.id);
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
    });
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();

    await act(async () => { fireEvent.click(principal.querySelector('a[href="/mur"]')); });
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Contrasenya nova'), { target: { name: 'password', value: 'contrasenya-nova-llarga' } });
    fireEvent.change(screen.getByLabelText('Confirmar contrasenya nova'), { target: { name: 'confirmPassword', value: 'contrasenya-nova-llarga' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desa la contrasenya nova' })); });
    expect(desa).toHaveBeenCalledWith('contrasenya-nova-llarga', expect.objectContaining({ dataMode: 'remote' }));
    await waitFor(() => expect(window.location.pathname).toBe('/el-meu-perfil'));
    expect(recuperacioPendentPer('u-r-guarda')).toBe(false);
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(window.location.pathname).toBe('/el-meu-perfil');
  }, { routerType: 'browser', dataMode: 'remote' },
  { ...ambRecuperacio(() => usuari, { definixContrasenyaNova: desa }) });
});

/* Correcció de la revisió · El cas de l'app independent: l'enllaç torna a la
   mateixa pàgina on s'ha demanat el correu, /registre?mode=entrar, amb
   OnboardingSection ja muntada. L'adaptador posa la marca ABANS d'avisar de la
   sessió (com auth.js): la secció no salta mai al perfil, ni un moment. */
test('R · app independent: la tornada a /registre?mode=entrar mostra la pantalla nova sense passar mai pel perfil', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  let resol = null;
  const recull = vi.fn(() => new Promise((r) => { resol = r; }));
  await muntaSenseSessio('/registre?mode=entrar', async () => {
    await barres();
    expect(recull).toHaveBeenCalledTimes(1);
    const camins = [];
    const apunta = (_estat, _titol, url) => { camins.push(String(url ?? '')); };
    const original = { push: window.history.pushState, replace: window.history.replaceState };
    vi.spyOn(window.history, 'pushState').mockImplementation(function (...args) { apunta(...args); return original.push.apply(this, args); });
    vi.spyOn(window.history, 'replaceState').mockImplementation(function (...args) { apunta(...args); return original.replace.apply(this, args); });
    usuari = { id: 'u-r-independent', email: 'ana@poble.test' };
    await act(async () => {
      marcaRecuperacioPendent(usuari.id);
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
      resol({ access_token: 'sintetic', user: usuari, recuperacio: true });
    });
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
    expect(window.location.pathname).toBe('/registre');
    expect(camins.some((cami) => cami.includes('/el-meu-perfil'))).toBe(false);
  }, { routerType: 'browser', dataMode: 'remote' },
  { recullTornadaOAuth: recull, ...ambRecuperacio(() => usuari) });
});

/* Correcció de la revisió · Incrustació (router en memòria): una recàrrega
   perd l'estat del router, però no la marca. La sessió restaurada torna a la
   pantalla nova, i la URL de l'amfitrió no es toca. */
test('R · MEMÒRIA: després de recarregar, la sessió restaurada torna a la pantalla nova sense tocar la URL de l’amfitrió', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await screen.findByRole('main');
    usuari = { id: 'u-r-memoria', email: 'ana@poble.test' };
    await act(async () => {
      marcaRecuperacioPendent(usuari.id);
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
    });
    expect(await screen.findByRole('heading', { name: TITOL_NOVA })).toBeTruthy();
    expect(window.location.pathname).toBe('/pagina-de-lamfitrio');
  }, { routerType: 'memory', dataMode: 'remote' }, ambRecuperacio(() => usuari));
});

test('R · sense la marca, una sessió restaurada no passa per la pantalla nova', async () => {
  vi.stubGlobal('innerWidth', 1024);
  let usuari = null;
  await muntaSenseSessio('/mur', async () => {
    await barres();
    usuari = { id: 'u-r-sense-marca', email: 'ana@poble.test' };
    await act(async () => {
      window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuari } }));
    });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(window.location.pathname).toBe('/mur');
    expect(screen.queryByRole('heading', { name: TITOL_NOVA })).toBeNull();
  }, { routerType: 'browser', dataMode: 'remote' }, ambRecuperacio(() => usuari));
});

test('R · un enllaç de recuperació que ja no val: la frase en un toast i a l’entrada, on se’n demana un altre', async () => {
  vi.stubGlobal('innerWidth', 1024);
  const frase = 'L’enllaç per a restablir la contrasenya ja no val: ha caducat o ja s’ha fet servir.';
  const recull = vi.fn(async () => { throw Object.assign(new Error(frase), { recuperacio: true }); });
  await muntaSenseSessio('/mur', async () => {
    await barres();
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(window.location.search).toBe('?mode=entrar');
    expect(await screen.findByText(frase)).toBeTruthy();
  }, { routerType: 'browser', dataMode: 'remote' }, { recullTornadaOAuth: recull });
});

/* ── Enxufe universal, T2 (260929) · Marca de l'amfitrió ─────────────────
   Amb nomPoble, escriptori (contenidor de 1024px) el diu a la barra negra i
   compacte (1023px) en una franja davall d'ella. Sense nomPoble, el DOM de la
   barra és el de sempre: cap node, cap classe, cap embolcall. */
const NOM = 'Gent de la Torre';
const MEMORIA_AMB_NOM = Object.freeze({ routerType: 'memory', nomPoble: NOM });
/* T7 (261001) · El verd només amb servidor de veres: el backend fals de
   muntaSenseSessio fa de servidor i el contingut core arriba 'ready'. */
const MEMORIA_REMOTA = Object.freeze({ ...MEMORIA_AMB_NOM, dataMode: 'remote' });
const TANCA = 'Tancar l’avís del node';
const franjaDe = (main) => main.querySelector('.sdp-amfitrio-franja');
const esperaText = (main, text) => waitFor(() => expect(franjaDe(main)?.querySelector('.sdp-amfitrio-franja__text')?.textContent).toBe(text));

test('T2 · escriptori: el nom de l’amfitrió és el primer fill de la barra negra, sense estils en línia', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await screen.findByRole('main');
    const header = document.querySelector('header.bar-black');
    const titol = header.firstElementChild;
    expect(titol.tagName).toBe('P');
    expect(titol.classList.contains('sdp-amfitrio-titol')).toBe(true);
    expect(titol.textContent).toBe(`| ${NOM}`);
    expect(titol.querySelector('span').getAttribute('aria-hidden')).toBe('true');
    expect(header.textContent).toContain(NOM);
    expect(header.querySelectorAll('[style]')).toHaveLength(0);
    expect(header.hasAttribute('style')).toBe(false);
    expect(document.querySelector('.sdp-amfitrio-franja')).toBeNull();
    /* T7 · el títol d'escriptori no canvia: ni pilot ni X a la barra negra. */
    expect(document.querySelector('.sdp-pilot')).toBeNull();
    expect(screen.queryByRole('button', { name: TANCA })).toBeNull();
  }, MEMORIA_REMOTA);
});

/* T7 (ordre del Mestre, 261001) · La franja diu l'estat de veres: només el
   verd diu «Connectat», enllaça amb /fedivers i porta una X germana. */
test('T2/T7 · compacte: franja «Connectat al node de …» amb pilot verd, enllaç a /fedivers i X, entre la barra negra i l’indicador', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
    const franja = franjaDe(main);
    expect(franja.tagName).toBe('DIV');
    expect(franja.previousElementSibling.matches('header.bar-black')).toBe(true);
    expect(franja.nextElementSibling.classList.contains('sdp-ptr-indicator')).toBe(true);
    const pilot = franja.querySelector('.sdp-pilot');
    expect(pilot.getAttribute('data-estat')).toBe('connectat');
    expect(pilot.getAttribute('aria-hidden')).toBe('true');
    // Dos germans: l'enllaç i la X; mai un botó dins de l'enllaç.
    expect([...franja.children].map((el) => el.tagName)).toEqual(['A', 'BUTTON']);
    const enllac = within(franja).getByRole('link', { name: `Connectat al node de ${NOM} Què és un node?` });
    expect(enllac.getAttribute('href')).toBe('/fedivers');
    expect(enllac.querySelector('button')).toBeNull();
    for (const icona of franja.querySelectorAll('svg')) {
      expect(icona.getAttribute('aria-hidden')).toBe('true');
      expect(icona.getAttribute('focusable')).toBe('false');
    }
    const tanca = within(franja).getByRole('button', { name: TANCA });
    expect(tanca.getAttribute('type')).toBe('button');
    expect(franja.querySelectorAll('[style]')).toHaveLength(0);
    expect(franja.hasAttribute('style')).toBe(false);
    expect(document.querySelector('.sdp-amfitrio-titol')).toBeNull();
  }, MEMORIA_REMOTA);
});

test('T7 · groc: en mode de proves (llavor) la franja diu «Sense connexió amb el node de …»', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Sense connexió amb el node de ${NOM}`);
    expect(franjaDe(main).querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('desconnectat');
    expect(main.textContent).not.toContain('Connectat al node');
  }, { ...MEMORIA_AMB_NOM, dataMode: 'seed' });
});

test('T7 · groc: si el contingut del servidor no carrega, «Sense connexió», mai verd', async () => {
  vi.stubGlobal('innerWidth', 1023);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Sense connexió amb el node de ${NOM}`);
    expect(franjaDe(main).querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('desconnectat');
  }, MEMORIA_REMOTA, { loadCoreContent: async () => { throw new Error('Servidor caigut'); } });
});

test('T7 · el dispositiu es queda sense xarxa: la franja passa a «Sense connexió» sense recarregar, i torna', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false });
      window.dispatchEvent(new Event('offline'));
    });
    await esperaText(main, `Sense connexió amb el node de ${NOM}`);
    expect(franjaDe(main).querySelector('.sdp-pilot').getAttribute('data-estat')).toBe('desconnectat');
    act(() => {
      Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => true });
      window.dispatchEvent(new Event('online'));
    });
    await esperaText(main, `Connectat al node de ${NOM}`);
  }, MEMORIA_REMOTA);
});

test('T7 · la X amaga la franja, ho recorda a sessionStorage per a eixe node, porta el focus a main i no navega', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
    const abans = window.location.href;
    fireEvent.click(within(franjaDe(main)).getByRole('button', { name: TANCA }));
    await waitFor(() => expect(franjaDe(main)).toBeNull());
    expect(JSON.parse(window.sessionStorage.getItem(CLAU_DESADA))).toEqual({ v: 1, nom: NOM });
    expect(document.activeElement).toBe(main);
    expect(window.location.href).toBe(abans);
    expect(screen.queryByRole('heading', { level: 1, name: 'Nodes i Fedivers' })).toBeNull();
  }, MEMORIA_REMOTA);
});

test('T7 · amb la franja ja tancada per a este node no es pinta; per a un altre node, sí', async () => {
  vi.stubGlobal('innerWidth', 1023);
  window.sessionStorage.setItem(CLAU_DESADA, JSON.stringify({ v: 1, nom: NOM }));
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await waitFor(() => expect(main.querySelector('.sdp-ptr-indicator')).not.toBeNull());
    expect(franjaDe(main)).toBeNull();
  }, MEMORIA_REMOTA);
  window.sessionStorage.setItem(CLAU_DESADA, JSON.stringify({ v: 1, nom: 'Un altre poble' }));
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
  }, MEMORIA_REMOTA);
});

test('T7 · si sessionStorage no deixa escriure, la X l’amaga igual i sense errors a la consola', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
    const errors = vi.spyOn(console, 'error');
    const escriu = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    fireEvent.click(within(franjaDe(main)).getByRole('button', { name: TANCA }));
    await waitFor(() => expect(franjaDe(main)).toBeNull());
    escriu.mockRestore();
    expect(window.sessionStorage.getItem(CLAU_DESADA)).toBeNull();
    expect(errors).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(main);
  }, MEMORIA_REMOTA);
});

/* T8 (ordre del Mestre, 261001) · La franja porta a /fedivers dins de l'app:
   en memòria, sense tocar la URL de l'amfitrió. */
test('T8 · en memòria, l’enllaç de la franja obri /fedivers sense tocar la URL de l’amfitrió i passa a aria-current', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    await esperaText(main, `Connectat al node de ${NOM}`);
    const abans = window.location.href;
    const empenta = vi.spyOn(window.history, 'pushState');
    expect(fireEvent.click(within(franjaDe(main)).getByRole('link'))).toBe(false);
    expect(await screen.findByRole('heading', { level: 1, name: 'Nodes i Fedivers' }, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Com es connecten els pobles?' })).toBeTruthy();
    expect(window.location.href).toBe(abans);
    expect(empenta).not.toHaveBeenCalled();
    expect(within(franjaDe(main)).getByRole('link').getAttribute('aria-current')).toBe('page');
  }, MEMORIA_REMOTA);
});

test.each([1024, 1023])('T2 · sense nomPoble (%ipx) la barra negra té els fills de sempre i no hi ha cap marca', async (ample) => {
  vi.stubGlobal('innerWidth', ample);
  await muntaSenseSessio('/xat', async () => {
    await screen.findByRole('main');
    const header = document.querySelector('header.bar-black');
    expect([...header.children].map((el) => el.className)).toEqual(['mobile-logo-wrapper sdp-unstyled-btn', 'right-icons']);
    expect(document.querySelector('.sdp-amfitrio-titol, .sdp-amfitrio-franja, [class*="sdp-amfitrio"]')).toBeNull();
    expect(screen.getByRole('main').querySelector('.sdp-ptr-indicator').previousElementSibling.matches('header.bar-black')).toBe(true);
  });
});

test('T2 · un nom amb invisibles o bidi es saneja abans de pintar-se', async () => {
  vi.stubGlobal('innerWidth', 1024);
  const nomBrut = '  Gent\u{202E} de la\u{200B} Torre\u{2066}  ';
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await screen.findByRole('main');
    expect(document.querySelector('.sdp-amfitrio-titol').textContent).toBe(`| ${NOM}`);
  }, { routerType: 'memory', nomPoble: nomBrut });
});

/* T7 (261001) · MarcaAmfitrio, unitat: el text per estat, les etiquetes i
   la memòria de la X (capa efímera de storage.js). La paritat de les claus
   a les cinc llengües la guarda i18n.claus.test.js. */
test('T7 · textDelNode: un text per estat, traduït, sense reinterpretar el nom, i la reserva valenciana sense traductor', () => {
  const ca = createTranslator('ca');
  const en = createTranslator('en');
  expect(['connectat', 'connectant', 'desconnectat'].map((estat) => textDelNode(ca, NOM, estat))).toEqual([
    `Connectat al node de ${NOM}`, `Connectant amb el node de ${NOM}…`, `Sense connexió amb el node de ${NOM}`
  ]);
  expect(['connectat', 'connectant', 'desconnectat'].map((estat) => textDelNode(en, NOM, estat))).toEqual([
    `Connected to the ${NOM} node`, `Connecting to the ${NOM} node…`, `No connection to the ${NOM} node`
  ]);
  // Un estat desconegut mai diu «Connectat».
  expect(textDelNode(ca, NOM, 'verd')).toBe(`Sense connexió amb el node de ${NOM}`);
  // «$&» dins del nom és text, no un patró de substitució.
  expect(textDelNode(ca, 'Poble $& $1', 'connectat')).toBe('Connectat al node de Poble $& $1');
  expect(textDelNode(null, NOM, 'connectant')).toBe(`Connectant amb el node de ${NOM}…`);
  expect(etiquetesDeLaFranja(en)).toEqual({ mesInfo: 'What is a node?', tanca: 'Close the node notice' });
  expect(etiquetesDeLaFranja(undefined)).toEqual({ mesInfo: 'Què és un node?', tanca: TANCA });
});

test('T7 · la X es recorda amb {v:1, nom} a sdp_embed_amfitrio-franja-tancada; un valor mal format no compta', () => {
  expect(CLAU_DESADA).toBe('sdp_embed_amfitrio-franja-tancada');
  expect(franjaTancadaPer()).toBeNull();
  expect(desaFranjaTancada(NOM)).toBe(true);
  expect(JSON.parse(window.sessionStorage.getItem(CLAU_DESADA))).toEqual({ v: 1, nom: NOM });
  expect(franjaTancadaPer()).toBe(NOM);
  for (const dolent of [JSON.stringify({ v: 2, nom: NOM }), JSON.stringify({ v: 1, nom: 42 }), JSON.stringify(NOM), '{trencat', JSON.stringify(null)]) {
    window.sessionStorage.setItem(CLAU_DESADA, dolent);
    expect([dolent, franjaTancadaPer()]).toEqual([dolent, null]);
  }
  expect(desaFranjaTancada('')).toBe(false);
  expect(desaFranjaTancada(undefined)).toBe(false);
});

test('T7 · si sessionStorage llança en escriure, desaFranjaTancada torna false sense llançar', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
  expect(() => desaFranjaTancada(NOM)).not.toThrow();
  expect(desaFranjaTancada(NOM)).toBe(false);
});

test('T2/T7 · el catàleg (Pedra Seca §9) pinta el títol i la franja en els tres estats, i la X de mostra amaga la seua', () => {
  const { container } = render(<MemoryRouter><EspecimenShell /></MemoryRouter>);
  // En muntar, cap mostra s'endú el focus.
  expect(document.activeElement).toBe(document.body);
  const especimen = container.querySelector('section#amfitrio');
  expect(within(especimen).getByRole('heading', { level: 3, name: 'Marca de l’amfitrió' })).toBeTruthy();
  const mostra = within(especimen).getByRole('group', { name: 'Mostra de la barra negra amb el nom de l’amfitrió' });
  expect(mostra.classList.contains('sdp-amfitrio-mostra')).toBe(true);
  expect(mostra.querySelector('p.sdp-amfitrio-titol').textContent).toBe(`| ${NOM}`);
  const franges = () => [...especimen.querySelectorAll('.sdp-amfitrio-franja')];
  expect(franges().map((f) => [f.querySelector('.sdp-amfitrio-franja__text').textContent, f.querySelector('.sdp-pilot').getAttribute('data-estat')])).toEqual([
    [`Connectat al node de ${NOM}`, 'connectat'],
    [`Connectant amb el node de ${NOM}…`, 'connectant'],
    [`Sense connexió amb el node de ${NOM}`, 'desconnectat']
  ]);
  fireEvent.click(within(franges()[0]).getByRole('button', { name: TANCA }));
  expect(franges()).toHaveLength(2);
  const torna = within(especimen).getByRole('button', { name: 'Tornar a mostrar la franja' });
  expect(document.activeElement).toBe(torna);
  fireEvent.click(torna);
  expect(franges()).toHaveLength(3);
  // En reobrir, el focus va a la X de la franja reoberta, no al body (WCAG 2.4.3).
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(within(franges()[0]).getByRole('button', { name: TANCA }));
  expect(window.sessionStorage.getItem(CLAU_DESADA)).toBeNull();
  expect(especimen.querySelectorAll('[style]')).toHaveLength(0);
  expect(container.querySelector('h1')).toBeNull();
});

/* ── Enxufe universal (260929) · Enllaços interns ─────────────────────────
   Els <a> que no són <Link> (HTML de la Wiki, articles) passen al router
   només quan l'app no és ama d'una URL d'arrel neta: en memòria o amb base
   declarada. A socdepoble.org (navegador sense base) el clic és natiu.
   L'enllaç de prova s'injecta al contingut com ho fa dangerouslySetInnerHTML:
   un node sense fibra dins d'un contenidor de React. */
/* La ruta de l'app ja és /xat (el '/' inicial redirigix): una consulta
   relativa es resol sobre ella. */
const xatPintat = () => waitFor(() => expect(document.getElementById('app-grid-list')).not.toBeNull());

function enllacAlContingut(href, pare = document.querySelector('.app-main__content')) {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = 'Enllaç del contingut';
  pare.append(a);
  return a;
}

/* Un desplaçador del contingut com .sdp-workspace-detail, baixat a mitja
   pàgina. jsdom no maqueta: overflow-y el llig getComputedStyle i les mides
   es fixen a mà; scrollTop sí que es guarda. */
function desplacadorAlContingut(posicio = 12242) {
  const caixa = document.createElement('div');
  caixa.style.setProperty('overflow-y', 'auto');
  Object.defineProperty(caixa, 'scrollHeight', { configurable: true, value: 20000 });
  Object.defineProperty(caixa, 'clientHeight', { configurable: true, value: 800 });
  caixa.scrollTop = posicio;
  document.querySelector('.app-main__content').append(caixa);
  return caixa;
}

test('enllaços interns · en memòria, un <a href="?…"> no toca la URL de l’amfitrió i el router hi va', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await xatPintat();
    const abans = window.location.href;
    const empenta = vi.spyOn(window.history, 'pushState');
    const substituix = vi.spyOn(window.history, 'replaceState');

    // '?item=x': el clic natiu recarregaria la pàgina de l'amfitrió amb ?item=x.
    expect(fireEvent.click(enllacAlContingut('?item=x'))).toBe(false);
    expect(window.location.href).toBe(abans);

    // '?vista=comunitats' es resol sobre /xat (la ruta de l'app): el rail canvia de vista.
    expect(fireEvent.click(enllacAlContingut('?vista=comunitats'))).toBe(false);
    await waitFor(() => expect(document.getElementById('app-grid-list')?.textContent).toContain('Encara no formes part de cap comunitat'));
    expect(document.getElementById('app-grid-list').querySelector('aside[aria-label="Comunitats"]')).not.toBeNull();
    expect(window.location.href).toBe(abans);
    expect(empenta).not.toHaveBeenCalled();
    expect(substituix).not.toHaveBeenCalled();
  }, { routerType: 'memory' });
});

test('enllaços interns · en memòria, el desplaçador de l’enllaç torna a dalt i un #fragment es porta a la vista', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await xatPintat();
    const detall = desplacadorAlContingut();

    // Sense fragment: el desplaçador reaprofitat torna a dalt, com un document nou.
    expect(fireEvent.click(enllacAlContingut('?item=x', detall))).toBe(false);
    await waitFor(() => expect(detall.scrollTop).toBe(0));

    // Amb fragment: l'element amb eixe id es porta a la vista i el desplaçador no torna a dalt.
    detall.scrollTop = 12242;
    const preu = document.createElement('h2');
    preu.id = 'preu';
    preu.scrollIntoView = vi.fn();
    detall.append(preu);
    expect(fireEvent.click(enllacAlContingut('?item=y#preu', detall))).toBe(false);
    await waitFor(() => expect(preu.scrollIntoView).toHaveBeenCalledTimes(1));
    expect(detall.scrollTop).toBe(12242);
  }, { routerType: 'memory' });
});

/* Llei del Píxel (C1) · socdepoble.org (main.jsx: navegador, sense base) és
   ama de la URL d'arrel. Abans de l'enxufe, un enllaç del contingut feia una
   recàrrega sencera i la pàgina nova apareixia des de dalt; ha de continuar
   igual: l'arrel no el cancel·la ni el passa al router, i el desplaçador no
   es toca. L'escoltador de window (fase de bombolla, DESPRÉS de React) anota
   què ha deixat l'app i atura el clic perquè jsdom no intente navegar. */
test('enllaços interns · a socdepoble.org (navegador sense base) el clic d’un enllaç del contingut és natiu', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/xat', async () => {
    await barres();
    const detall = desplacadorAlContingut();
    const empenta = vi.spyOn(window.history, 'pushState');
    const substituix = vi.spyOn(window.history, 'replaceState');
    const vistos = [];
    const anotaIAtura = (e) => { vistos.push(e.defaultPrevented); e.preventDefault(); };
    window.addEventListener('click', anotaIAtura);
    try {
      fireEvent.click(enllacAlContingut('?item=x', detall));
      fireEvent.click(enllacAlContingut('/pobles', detall));
      fireEvent.click(enllacAlContingut('/mercat/samarreta#preu', detall));
    } finally {
      window.removeEventListener('click', anotaIAtura);
    }
    expect(vistos).toEqual([false, false, false]);
    // Un fotograma i escaig: cap recol·locació diferida.
    await new Promise((resol) => { requestAnimationFrame(() => requestAnimationFrame(resol)); });
    expect(detall.scrollTop).toBe(12242);
    expect(empenta).not.toHaveBeenCalled();
    expect(substituix).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search).toBe('/xat');
  });
});

test('enllaços interns · un <Link> de la barra lateral continua navegant una sola vegada (l’arrel no el repetix)', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/xat', async () => {
    const [principal] = await barres();
    const empenta = vi.spyOn(window.history, 'pushState');
    expect(fireEvent.click(principal.querySelector('a[href="/pobles"]'))).toBe(false);
    await waitFor(() => expect(window.location.pathname).toBe('/pobles'));
    expect(empenta).toHaveBeenCalledTimes(1);
    expect(empenta.mock.calls[0][2]).toBe('/pobles');
  });
});

/* Base declarada per l'amfitrió: l'app és ama de la URL a partir de
   /comunitat. Els <Link> pinten /comunitat/… i el contingut en pot copiar un:
   el router hi posa la base una sola vegada, mai /comunitat/comunitat/xat. */
const AMB_BASE = Object.freeze({ routerType: 'browser', basename: '/comunitat' });
const actiuALaBarra = (href) => waitFor(() => expect(
  screen.getByRole('navigation', { name: 'Navegació principal' }).querySelector(`a[href="${href}"][aria-current="page"]`)
).not.toBeNull());

test('enllaços interns · amb base, un <a href="/comunitat/xat"> del contingut va a /xat de l’app amb una sola entrada', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/comunitat/pobles', async () => {
    await actiuALaBarra('/comunitat/pobles');
    const empenta = vi.spyOn(window.history, 'pushState');
    expect(fireEvent.click(enllacAlContingut('/comunitat/xat'))).toBe(false);
    await waitFor(() => expect(window.location.pathname).toBe('/comunitat/xat'));
    await actiuALaBarra('/comunitat/xat');
    expect(empenta).toHaveBeenCalledTimes(1);
    expect(empenta.mock.calls[0][2]).toBe('/comunitat/xat');
  }, AMB_BASE);
});

test('enllaços interns · amb base, una ruta de l’app escrita sense base (l’Aplec: /events/…) rep la base una vegada', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/comunitat/xat', async () => {
    await actiuALaBarra('/comunitat/xat');
    const empenta = vi.spyOn(window.history, 'pushState');
    expect(fireEvent.click(enllacAlContingut('/pobles'))).toBe(false);
    await waitFor(() => expect(window.location.pathname).toBe('/comunitat/pobles'));
    await actiuALaBarra('/comunitat/pobles');
    expect(empenta).toHaveBeenCalledTimes(1);
    expect(empenta.mock.calls[0][2]).toBe('/comunitat/pobles');
  }, AMB_BASE);
});

test('enllaços interns · amb base, una consulta es resol sobre la ruta de l’app i una URL completa és de l’amfitrió', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/comunitat/xat', async () => {
    await actiuALaBarra('/comunitat/xat');
    const empenta = vi.spyOn(window.history, 'pushState');
    /* Com a la prova dels natius: l'escoltador de window anota què ha deixat
       l'app i atura el clic perquè jsdom no intente navegar. */
    const vistos = [];
    const anotaIAtura = (e) => { vistos.push(e.defaultPrevented); e.preventDefault(); };
    window.addEventListener('click', anotaIAtura);
    try {
      fireEvent.click(enllacAlContingut('https://exemple.org/comunitat/pobles'));
      // '?…' continua dins de l'app, sota la base.
      fireEvent.click(enllacAlContingut('?vista=comunitats'));
    } finally {
      window.removeEventListener('click', anotaIAtura);
    }
    expect(vistos).toEqual([false, true]);
    await waitFor(() => expect(window.location.search).toBe('?vista=comunitats'));
    expect(window.location.pathname).toBe('/comunitat/xat');
    expect(empenta).toHaveBeenCalledTimes(1);
    expect(empenta.mock.calls[0][2]).toBe('/comunitat/xat?vista=comunitats');
  }, AMB_BASE);
});

test('enllaços interns · un clic amb modificador, un target _blank o un enllaç extern no es toquen', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    await xatPintat();
    /* Qui decidix és el navegador: ací només es mira que l'arrel no l'haja
       cancel·lat. L'escoltador de window (fase de bombolla) arriba DESPRÉS del
       de React: anota què ha deixat l'app i atura el clic perquè jsdom no
       intente navegar. */
    const vistos = [];
    const anotaIAtura = (e) => { vistos.push(e.defaultPrevented); e.preventDefault(); };
    window.addEventListener('click', anotaIAtura);
    try {
      fireEvent.click(enllacAlContingut('?item=x'), { ctrlKey: true });
      const blanc = enllacAlContingut('/pobles');
      blanc.setAttribute('target', '_blank');
      fireEvent.click(blanc);
      fireEvent.click(enllacAlContingut('https://exemple.org/'));
      fireEvent.click(enllacAlContingut('/assets/doc.pdf'));
      // Control: el mateix escoltador sí que veu cancel·lat un intern net.
      fireEvent.click(enllacAlContingut('?item=x'));
    } finally {
      window.removeEventListener('click', anotaIAtura);
    }
    expect(vistos).toEqual([false, false, false, false, true]);
  }, { routerType: 'memory' });
});


/* La barra principal depén de la caixa, encara que el navegador no tinga
   @container. CSS no participa en estes proves de la decisió de React. */
test('AppShell · amplària inicial i canvis fraccionaris del contenidor, sense canviar el viewport', async () => {
  vi.stubGlobal('innerWidth', 1440);
  let ample = 700;
  let notifica;
  const disconnect = vi.fn();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return { width: this.classList.contains('sdp-root') ? ample : 1440, height: 480, top: 0, left: 0, bottom: 480, right: ample };
  });
  class Observer {
    constructor(callback) { notifica = callback; }
    observe() {}
    disconnect() { disconnect(); }
  }
  await muntaSenseSessio('/legal', async () => {
    const root = document.querySelector('.sdp-root');
    expect(root.classList.contains('is-compact')).toBe(true);
    expect(document.querySelector('nav.mobile-nav')).not.toBeNull();
    expect(root.hasAttribute('data-sdp-estret')).toBe(true);
    ample = 720;
    act(() => notifica());
    expect(root.hasAttribute('data-sdp-estret')).toBe(true);
    ample = 720.5;
    act(() => notifica());
    expect(root.hasAttribute('data-sdp-estret')).toBe(false);
    expect(root.classList.contains('is-compact')).toBe(true);
    ample = 1023.5;
    act(() => notifica());
    expect(root.classList.contains('is-compact')).toBe(false);
    expect(document.querySelector('nav.app-sidebar')).not.toBeNull();
    ample = 1023;
    act(() => notifica());
    expect(root.classList.contains('is-compact')).toBe(true);
  }, { routerType: 'browser' }, {}, Observer);
  expect(disconnect).toHaveBeenCalled();
});

test('AppShell · sense ResizeObserver mesura i respon a resize, i retira l’escolta', async () => {
  vi.stubGlobal('innerWidth', 1440);
  let ample = 375;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: ample, height: 320, top: 0, left: 0, bottom: 320, right: ample }));
  const remove = vi.spyOn(window, 'removeEventListener');
  await muntaSenseSessio('/legal', async () => {
    const root = document.querySelector('.sdp-root');
    expect(root.classList.contains('is-compact')).toBe(true);
    ample = 1200;
    fireEvent(window, new Event('resize'));
    expect(root.classList.contains('is-compact')).toBe(false);
    expect(root.hasAttribute('data-sdp-estret')).toBe(false);
  }, { routerType: 'browser' }, {}, null);
  expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
});
