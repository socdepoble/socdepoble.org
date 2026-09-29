import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { copyConsola, paginaConsola } from '../sections/consola/consolaPagines.js';

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

afterEach(() => {
  cleanup();
  guarda.produccio = false;
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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
    await screen.findByRole('button', { name: 'Nova conversa' });
    expect(screen.queryByText("No s'ha pogut carregar Sóc de Poble")).toBeNull();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
    expect(inesperat).not.toHaveBeenCalled();
    expect(peticioExterna).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  } finally {
    cleanup();
    // Si hi havia backend, el restaurem; el cas inicial buit queda aïllat per Vitest.
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
});

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
    const boto = await screen.findByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
    expect(boto.closest('header.bar-black')).not.toBeNull();
    expect(boto.hasAttribute('style')).toBe(false);
    fireEvent.click(boto);
    const dialeg = await screen.findByRole('dialog', { name: 'Amb qui actues?' });
    expect(dialeg.closest('header.bar-black')).toBeNull();
    expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
    const forn = await within(dialeg).findByRole('button', { name: /Forn de la Torre/ });
    expect(within(dialeg).getByRole('button', { name: /Pepa Soler/ }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(forn);
    const entitat = await screen.findByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
    expect(entitat.classList.contains('sdp-top-bar-btn--entitat')).toBe(true);
    expect(entitat.querySelector('.sdp-avatar').textContent).toBe('FD');
    /* Deixa la preferència com estava: es torna a actuar com a persona. */
    fireEvent.click(entitat);
    fireEvent.click(within(await screen.findByRole('dialog', { name: 'Amb qui actues?' })).getByRole('button', { name: /Pepa Soler/ }));
    await screen.findByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
});

/* ── Rutes amb barrera, sense sessió ─────────────────────────────────────
   Router de navegador sobre la URL de jsdom: RequireAuth porta a
   /registre?tornar=… amb replaceState i es llig a window.location. */

async function muntaSenseSessio(ruta, cos) {
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
    loadFils: async () => []
  });
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const tornar = () => new URLSearchParams(window.location.search).get('tornar');

test('a vite serve el tauler de la Consola es pinta sense sessió i no porta a /registre', async () => {
  await muntaSenseSessio('/consola', async () => {
    await waitFor(() => {
      expect(window.location.pathname).toBe('/consola');
      expect(screen.getByRole('heading', { name: copyConsola().title })).toBeTruthy();
    });
    expect(screen.getByRole('navigation', { name: 'Pàgines de la Consola' })).toBeTruthy();
  });
});

test('a vite serve una pàgina de la Consola (/consola/pols) es pinta sense sessió', async () => {
  await muntaSenseSessio('/consola/pols', async () => {
    await waitFor(() => {
      expect(window.location.pathname).toBe('/consola/pols');
      expect(screen.getByRole('heading', { name: paginaConsola('pols').title })).toBeTruthy();
    });
    // 404 de /__iaia/consola.json → la pàgina ho diu, no inventa dades.
    expect(await screen.findByText('Consola no disponible')).toBeTruthy();
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
  });
});

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
    /* La guarda ha deixat passar: és el perfil propi, no /registre. */
    await waitFor(() => expect(document.querySelector('.sdp-gestor-pagina')).not.toBeNull());
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
