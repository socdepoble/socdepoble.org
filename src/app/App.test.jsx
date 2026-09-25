import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
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
    loadFils: vi.fn(async () => [])
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

test.each(['/admin', '/realitat'])('%s continua portant a /registre sense sessió també a vite serve', async ruta => {
  await muntaSenseSessio(ruta, async () => {
    await waitFor(() => expect(window.location.pathname).toBe('/registre'));
    expect(tornar()).toBe(ruta);
  });
});
