/**
 * Ordre del Mestre (261026_2126; prompt i pla 261026_2130, tasca 1; P1-38) ·
 * /descarregues, l'adreça curta que obri el botó «Descarrega l'App» de l'accés
 * al Xat, porta a «Descàrregues i Aplicacions» (/page/descarregues). Es prova
 * amb l'app de veres (PedraSecaEmbed), perquè la redirecció viu a ActorRoutes,
 * d'App.jsx, i el seu Routes es queda amb el primer fill que casa: només
 * muntant App es veu que cap ruta d'abans no se la queda.
 * Revisió (261026_2126, segona volta) · Substituïx la redirecció redeclarada
 * de PageDetailSection.descarregues.test.jsx, que passava encara que App.jsx
 * no la tinguera.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { PAGES_SEED } from '../data/appSeed.js';

/* Com a App.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Cada espera caduca abans que la prova: si falla, falla amb la seua asserció. */
const ESPERA = { timeout: 8000 };

/* Backend fals sense sessió ni xarxa, com muntaSenseSessio d'App.test.jsx. */
async function muntaSenseSessio(ruta, cos, { pages = [] } = {}) {
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
    loadCoreContent: async () => ({ towns: [], pages, agents: [] }),
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

test('/descarregues porta a /page/descarregues, amb l’H1 «Descàrregues i Aplicacions»', async () => {
  await muntaSenseSessio('/descarregues', async () => {
    await waitFor(() => {
      expect(document.querySelector('header.page-title h1')?.textContent).toBe('Descàrregues i Aplicacions');
    }, ESPERA);
    expect(window.location.pathname).toBe('/page/descarregues');
    expect(window.location.search).toBe('');
    // És el copy de veres (PAGE_COPY), no cap pàgina buida ni «Ací no hi ha res».
    expect(PAGE_COPY.descarregues.title).toBe('Descàrregues i Aplicacions');
    expect(screen.queryByText('Ací no hi ha res')).toBeNull();
  });
}, 15000);

/* Ordre del Mestre (261027; auditoria Gauntlet R5, G1-01 i G5-01) · Dins de
   l'app nativa (el pont de Capacitor), /descarregues no acaba a la pàgina, i
   el Mur no en porta la targeta: el cos nomena Android, Google Play i l'APK
   (regla 2.3.10 de l'App Store). Amb l'app de veres, com la prova de dalt. */
test('dins de l’app nativa, /descarregues no hi porta, i el Mur no en té la targeta', async () => {
  /* Amb les pàgines de veres (PAGES_SEED), com en remot. Control a la web: el
     mateix Mur sí que porta la targeta. */
  const ambPagines = { pages: PAGES_SEED };
  await muntaSenseSessio('/mur', async () => {
    await waitFor(() => expect(document.body.textContent).toContain('Descàrregues i Aplicacions'), ESPERA);
  }, ambPagines);
  window.Capacitor = { isNativePlatform: () => true };
  try {
    await muntaSenseSessio('/descarregues', async () => {
      await waitFor(() => expect(window.location.pathname).not.toMatch(/descarregues/), ESPERA);
      expect(document.body.textContent).not.toMatch(/Google Play|APK directe/);
    }, ambPagines);
    await muntaSenseSessio('/mur', async () => {
      // El Mur ja pinta les altres pàgines del sistema; Descàrregues, no.
      await waitFor(() => expect(document.body.textContent).toContain(PAGE_COPY['drets-autor'].title), ESPERA);
      expect(window.location.pathname).toBe('/mur');
      expect(document.body.textContent).not.toContain('Descàrregues i Aplicacions');
    }, ambPagines);
  } finally {
    delete window.Capacitor;
  }
}, 30000);
