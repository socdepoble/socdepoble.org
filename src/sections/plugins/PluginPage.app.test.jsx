/**
 * P7-A · La ruta /plugin/:id dins de l'App de veres (PedraSecaEmbed): el
 * shell sencer, sense sessió i amb un backend fals sense xarxa. Comprova que
 * App munta la pàgina del plugin (i no ItemDetailSection, que també casaria
 * amb «/:sectionId/:itemId») i que un id desconegut és la 404.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import PedraSecaEmbed from '../../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { getSessionState } from '../../data/sessionService.js';

vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function muntaApp(ruta, cos) {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
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

test('App munta /plugin/rebost: la pàgina del plugin, amb la portada plegable i el botó d’Obrir', async () => {
  await muntaApp('/plugin/rebost', async () => {
    const titol = await screen.findByRole('heading', { level: 1, name: 'Rebost Domèstic' });
    expect(titol).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Amaga la portada' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Obrir el Rebost' }).getAttribute('href')).toBe('/app/nevera/casa');
  });
});

test('App: Salut en un document que no és l’ama (sense manageDocumentHead) no fa cap enllaç', async () => {
  await muntaApp('/plugin/salut', async () => {
    await screen.findByRole('heading', { level: 1, name: 'Salut' });
    expect(screen.queryByRole('link', { name: /Obrir Salut/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Obrir Salut (no disponible ací)' }).getAttribute('aria-disabled')).toBe('true');
  });
});

test('App: /plugin/<id desconegut> és la 404 de sempre', async () => {
  await muntaApp('/plugin/desconegut', async () => {
    expect(await screen.findByRole('heading', { level: 1, name: 'Ací no hi ha res' })).toBeTruthy();
  });
});
