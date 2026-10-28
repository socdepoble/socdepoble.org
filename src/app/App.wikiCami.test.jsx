/**
 * Decisió 2 del Mestre (261028; pla 261028_1526, P1-61 Fase 2) · La forma de
 * camí d'un document de la Wiki, /wikidepoble/<id>, la que envia Compartir i
 * la que el build prerenderitza amb el seu head, porta a
 * /wikidepoble?item=<id> (replace) i obri el document. Es prova amb l'app de
 * veres (PedraSecaEmbed), com App.descarregues.test.jsx: la redirecció viu a
 * ActorRoutes, d'App.jsx, i el seu Routes es queda amb el primer fill que
 * casa; només muntant App es veu que el comodí ':sectionId/:itemId' no se la
 * queda.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';

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

/* Backend fals sense sessió ni xarxa, com muntaSenseSessio d'App.descarregues.test.jsx. */
async function muntaSenseSessio(ruta, cos) {
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

const h1s = () => [...document.querySelectorAll('h1')].map((h1) => h1.textContent);

test('/wikidepoble/<id> porta a /wikidepoble?item=<id> i obri el document', async () => {
  await muntaSenseSessio('/wikidepoble/03_llibre_d_or_memoria_episodica', async () => {
    await waitFor(() => expect(window.location.search).toBe('?item=03_llibre_d_or_memoria_episodica'), ESPERA);
    expect(window.location.pathname).toBe('/wikidepoble');
    await waitFor(() => expect(h1s().some((titol) => titol.includes('Llibre d'))).toBe(true), ESPERA);
    expect(document.body.textContent).not.toContain('Element no trobat');
  });
}, 20000);

test('conserva la resta de la consulta; l’id del camí mana sobre un ?item= de la consulta', async () => {
  await muntaSenseSessio('/wikidepoble/el_projecte?utm_source=whatsapp&item=altre', async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/wikidepoble'), ESPERA);
    expect(new URLSearchParams(window.location.search).getAll('item')).toEqual(['el_projecte']);
    expect(new URLSearchParams(window.location.search).get('utm_source')).toBe('whatsapp');
  });
}, 20000);

test('un id que no valida porta a la Wiki sense document', async () => {
  await muntaSenseSessio('/wikidepoble/amb.punt?item=el_projecte', async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/wikidepoble'), ESPERA);
    expect(new URLSearchParams(window.location.search).has('item')).toBe(false);
  });
}, 20000);
