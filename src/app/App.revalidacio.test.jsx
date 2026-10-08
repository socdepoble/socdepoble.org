/* Decisió 2 del Mestre (261007) · «El Mur "Carregant": RENOVACIÓ SILENCIOSA» ·
   Revisió adversarial (Relleu 261007) · Una revalidació en segon pla del
   contingut base que falla conserva l'últim contingut bo en 'ready' i deixa
   l'error a banda (errorRevalidacio, useScopedResource.js). AppDataLoader
   (App.jsx) ho diu a la consola, com ja deia un error de càrrega. Sense esta
   prova, la branca de l'avís es podia esborrar sense cap roig. L'app sencera,
   sense sessió i amb un backend fals; la revalidació es demana amb
   sdp:refresh-data (useRecarregaExterna), com després de publicar. Cap xarxa
   (fetch llança). */
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async importOriginal => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const AVIS_REVALIDACIO = "CoreContent degradat: la revalidació en segon pla ha fallat; es conserva l'últim contingut bo.";
const AVIS_CARREGA = "CoreContent degradat: l'aplicació arranca amb dades parcials o sense catàleg.";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Les crides de console.warn amb este missatge. */
const avisos = (espia, missatge) => espia.mock.calls.filter(([text]) => text === missatge);

/* Munta l'app a /mur amb un loadCoreContent que respon bé fins que
   `estat.falla` és cert. Torna quan el contingut base ja és 'ready' (aria-busy
   de #main-content a 'false': l'estat global naix 'loading', UIContext.jsx). */
async function munta(cos) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async url => { throw new Error('Xarxa inesperada: ' + url); }));
  const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const estat = { falla: false };
  const errorDeXarxa = new Error('Revalidació tallada (sonda)');
  const loadCoreContent = vi.fn(async () => {
    if (estat.falla) throw errorDeXarxa;
    return { towns: [], pages: [], agents: [] };
  });
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'remote',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent,
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    loadPerfilPublic: async () => null
  });
  window.history.replaceState(null, '', '/mur');
  try {
    const { container } = render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'remote' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await waitFor(() => expect(container.querySelector('#main-content')?.getAttribute('aria-busy')).toBe('false'));
    await cos({ container, avis, estat, errorDeXarxa, loadCoreContent });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* Demana una revalidació (com després de publicar) i espera que el loader
   s'haja tornat a cridar i que els efectes s'hagen assentat. */
async function revalida(loadCoreContent) {
  const abans = loadCoreContent.mock.calls.length;
  act(() => { window.dispatchEvent(new Event('sdp:refresh-data')); });
  await waitFor(() => expect(loadCoreContent.mock.calls.length).toBeGreaterThan(abans));
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 20)); });
}

test('una revalidació que falla avisa a la consola amb el seu missatge i l’error, i el contingut es conserva', async () => {
  await munta(async ({ container, avis, estat, errorDeXarxa, loadCoreContent }) => {
    expect(avisos(avis, AVIS_REVALIDACIO)).toEqual([]);
    estat.falla = true;
    await revalida(loadCoreContent);
    await waitFor(() => expect(avis).toHaveBeenCalledWith(AVIS_REVALIDACIO, errorDeXarxa));
    // No és un error de càrrega: el contingut continua 'ready' (Decisió 2).
    expect(avisos(avis, AVIS_CARREGA)).toEqual([]);
    expect(container.querySelector('#main-content')?.getAttribute('aria-busy')).toBe('false');
  });
});

test('sense errorRevalidacio no hi ha avís: ni la càrrega bona ni una revalidació bona en diuen res', async () => {
  await munta(async ({ avis, loadCoreContent }) => {
    await revalida(loadCoreContent);
    expect(avisos(avis, AVIS_REVALIDACIO)).toEqual([]);
    expect(avisos(avis, AVIS_CARREGA)).toEqual([]);
  });
});
