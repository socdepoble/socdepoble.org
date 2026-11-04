/**
 * Retirada del panell Node 0 i Mastodon (decisió de l'àrbitre, fusió del kit
 * v3.0.0 de Gemini sobre 8f4559b3b; Gauntlet G3: G3-posse-privacitat-01,
 * G3-posse-privacitat-02, G3-posse-privacitat-03, G3-ah-conformitat-01 i
 * G3-pedra-seca-i18n-01) · /fedivers torna a ser la pàgina de text de sempre.
 * El kit hi incrustava, per a qualsevol visitant i sense sessió, el panell del
 * Node 0 amb la safata POSSE: en muntar-se consultava socdepoble.cat tot sol i
 * oferia «Confirmar i publicar a Mastodon» sobre peces inventades. Es prova amb
 * l'app de veres (PedraSecaEmbed), com App.fediversity.test.jsx: el panell
 * arribava per una ruta diferida d'App.jsx, i només muntant App es veu.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';

/* Com a App.fediversity.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
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

const ESPERA = { timeout: 8000 };

/* Backend fals sense sessió; la xarxa queda registrada i mai respon. */
async function muntaSenseSessio(ruta, cos) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const xarxa = vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  });
  vi.stubGlobal('fetch', xarxa);
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
    await cos(xarxa);
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

test('/fedivers és la pàgina de text, sense el panell del Node 0: cap consulta a socdepoble.cat i cap botó de publicar a Mastodon', async () => {
  await muntaSenseSessio('/fedivers', async (xarxa) => {
    await waitFor(() => {
      expect(document.querySelector('header.page-title h1')?.textContent).toBe(PAGE_COPY.fedivers.title);
    }, ESPERA);
    /* Les rutes diferides (lazyRoute) acaben de carregar i React torna a pintar. */
    await vi.dynamicImportSettled();
    await new Promise((resolt) => { setTimeout(resolt, 50); });
    await vi.dynamicImportSettled();
    await waitFor(() => expect(document.querySelector('header.page-title h1')).not.toBeNull());

    const aSocDePobleCat = xarxa.mock.calls.map(([url]) => String(url)).filter((url) => url.includes('socdepoble.cat'));
    expect(aSocDePobleCat).toEqual([]);
    expect(screen.queryByRole('button', { name: /mastodon/i })).toBeNull();
    /* El text de /fedivers ja parla del Node 0 (8f4559b3b); el que no hi ha
       d'haver són els encapçalaments propis del panell ni les seues classes. */
    expect(screen.queryAllByRole('heading', { name: /mastodon|posse|resiliència/i })).toEqual([]);
    expect(document.querySelector('[class*="sdp-node0"]')).toBeNull();
  });
});
