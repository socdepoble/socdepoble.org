import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { copyConsola, paginaConsola } from '../sections/consola/consolaPagines.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../config/i18n';
import { textDelServidor } from '../components/universal/MarcaAmfitrio.jsx';
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

/* `backendExtra` (T4) · substituïx mètodes del backend fals, per a espiar-ne un. */
async function muntaSenseSessio(ruta, cos, config = { routerType: 'browser' }, backendExtra = {}) {
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

/* ── T3 (ordre del Mestre, 260930) · Barra inferior mòbil de sis caselles ──
   Ordre explícit (ja no ix de tallar SECTIONS): Xat, Mur, el botó central
   «Panell de Control», Pobles, Mercat i Telefonades. Telefonades és un botó
   que obri l'avís de D17: no és una ruta ni una secció, no navega i no
   s'encén. La barra lateral conserva el seu ordre. */
const AVIS_D17 = 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.';
const casellaMobil = (el) => el.getAttribute('href') ?? el.getAttribute('aria-label') ?? el.textContent;

test('T3 · la barra mòbil porta Xat, Mur, Panell de Control, Pobles, Mercat i Telefonades, en eixe ordre', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/mur', async () => {
    const [principal, mobil] = await barres();
    expect([...mobil.children].map(casellaMobil)).toEqual(['/xat', '/mur', 'Panell de Control', '/pobles', '/mercat', 'Telefonades']);
    expect([...mobil.children].map((el) => el.getAttribute('aria-label') ?? el.textContent))
      .toEqual(['Xat', 'Mur', 'Panell de Control', 'Pobles', 'Mercat', 'Telefonades']);
    expect([...mobil.children].map((el) => el.tagName)).toEqual(['A', 'A', 'BUTTON', 'A', 'A', 'BUTTON']);
    /* La barra lateral no canvia: continua amb l'ordre de SECTIONS. */
    expect([...principal.querySelectorAll('a.nav-item')].slice(0, 4).map((a) => a.getAttribute('href')))
      .toEqual(['/xat', '/mur', '/mercat', '/pobles']);
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

test('T3 · Telefonades obri l’avís de D17 en un diàleg, sense navegar, sense xarxa ni actius, i torna el focus en tancar', async () => {
  vi.stubGlobal('innerWidth', 1024);
  await muntaSenseSessio('/mur', async () => {
    const [, mobil] = await barres();
    const boto = within(mobil).getByRole('button', { name: 'Telefonades' });
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect(boto.classList.contains('nav-item')).toBe(true);
    expect(screen.queryByRole('dialog', { name: 'Telefonades' })).toBeNull();
    const peticions = globalThis.fetch.mock.calls.length;

    /* Correcció de la revisió (260930) · Sense boto.focus() previ: Safari no
       dona el focus a un botó tocat, i el clic de jsdom tampoc. El focus ha
       de ser en un altre lloc abans del clic perquè la prova de retorn de
       baix no passe per casualitat. */
    expect(document.activeElement).not.toBe(boto);
    fireEvent.click(boto);
    const dialeg = await screen.findByRole('dialog', { name: 'Telefonades' });
    expect(dialeg.hasAttribute('open')).toBe(true);
    expect(dialeg.closest('nav')).toBeNull();
    expect(within(dialeg).getByText(AVIS_D17)).toBeTruthy();
    expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
    expect(window.location.pathname + window.location.search).toBe('/mur');
    expect(actius(mobil)).toEqual(['/mur']);
    expect(boto.hasAttribute('aria-current')).toBe(false);
    expect(boto.classList.contains('active')).toBe(false);
    expect(globalThis.fetch.mock.calls.length).toBe(peticions);

    /* «Entesos» el tanca i el focus torna a Telefonades (no es queda a dins). */
    const entesos = within(dialeg).getByRole('button', { name: 'Entesos' });
    entesos.focus();
    fireEvent.click(entesos);
    await waitFor(() => expect(dialeg.hasAttribute('open')).toBe(false));
    expect(document.activeElement).toBe(boto);

    /* La creu també el tanca, i es pot tornar a obrir. */
    fireEvent.click(boto);
    await waitFor(() => expect(dialeg.hasAttribute('open')).toBe(true));
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
    await waitFor(() => expect(dialeg.hasAttribute('open')).toBe(false));
    expect(window.location.pathname + window.location.search).toBe('/mur');
    expect(actius(mobil)).toEqual(['/mur']);
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

/* ── Enxufe universal, T2 (260929) · Marca de l'amfitrió ─────────────────
   Amb nomPoble, escriptori (contenidor de 1024px) el diu a la barra negra i
   compacte (1023px) en una franja davall d'ella. Sense nomPoble, el DOM de la
   barra és el de sempre: cap node, cap classe, cap embolcall. */
const NOM = 'Gent de la Torre';
const MEMORIA_AMB_NOM = Object.freeze({ routerType: 'memory', nomPoble: NOM });

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
  }, MEMORIA_AMB_NOM);
});

test('T2 · compacte: franja «Estàs al servidor de …» just després de la barra negra i abans de l’indicador', async () => {
  vi.stubGlobal('innerWidth', 1023);
  await muntaSenseSessio('/pagina-de-lamfitrio', async () => {
    const main = await screen.findByRole('main');
    const franja = main.querySelector('.sdp-amfitrio-franja');
    expect(franja).not.toBeNull();
    expect(franja.textContent.trim()).toBe(`Estàs al servidor de ${NOM}`);
    expect(franja.querySelector('span').textContent).toBe(`Estàs al servidor de ${NOM}`);
    expect(franja.previousElementSibling.matches('header.bar-black')).toBe(true);
    expect(franja.nextElementSibling.classList.contains('sdp-ptr-indicator')).toBe(true);
    const icona = franja.querySelector('svg');
    expect(icona.getAttribute('aria-hidden')).toBe('true');
    expect(icona.getAttribute('focusable')).toBe('false');
    expect(franja.hasAttribute('style')).toBe(false);
    expect(document.querySelector('.sdp-amfitrio-titol')).toBeNull();
  }, MEMORIA_AMB_NOM);
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

test('T2 · la clau amfitrio.servidor existix a les cinc llengües i el nom no es reinterpreta', () => {
  const esperat = {
    ca: 'Estàs al servidor de {nom}',
    es: 'Estás en el servidor de {nom}',
    en: 'You are on the {nom} server',
    eu: '{nom} zerbitzarian zaude',
    gl: 'Estás no servidor de {nom}'
  };
  expect(SUPPORTED_LANGUAGES.map(({ code }) => code).sort()).toEqual(Object.keys(esperat).sort());
  for (const { code } of SUPPORTED_LANGUAGES) {
    expect([code, createTranslator(code)('amfitrio.servidor')]).toEqual([code, esperat[code]]);
  }
  expect(textDelServidor(createTranslator('en'), NOM)).toBe(`You are on the ${NOM} server`);
  // «$&» dins del nom és text, no un patró de substitució.
  expect(textDelServidor(createTranslator('ca'), 'Poble $& $1')).toBe('Estàs al servidor de Poble $& $1');
  expect(textDelServidor(null, NOM)).toBe(`Estàs al servidor de ${NOM}`);
});

test('T2 · el catàleg (Pedra Seca §9) pinta en viu les dues peces de la marca de l’amfitrió', () => {
  const { container } = render(<MemoryRouter><EspecimenShell /></MemoryRouter>);
  const especimen = container.querySelector('section#amfitrio');
  expect(within(especimen).getByRole('heading', { level: 3, name: 'Marca de l’amfitrió' })).toBeTruthy();
  const mostra = within(especimen).getByRole('group', { name: 'Mostra de la barra negra amb el nom de l’amfitrió' });
  expect(mostra.classList.contains('sdp-amfitrio-mostra')).toBe(true);
  expect(mostra.querySelector('p.sdp-amfitrio-titol').textContent).toBe(`| ${NOM}`);
  expect(especimen.querySelector('p.sdp-amfitrio-franja span').textContent).toBe(`Estàs al servidor de ${NOM}`);
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
