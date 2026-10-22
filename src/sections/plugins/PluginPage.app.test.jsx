/**
 * P7-A · La ruta /plugin/:id dins de l'App de veres (PedraSecaEmbed): el
 * shell sencer, sense sessió i amb un backend fals sense xarxa. Comprova que
 * App munta la pàgina del plugin (i no ItemDetailSection, que també casaria
 * amb «/:sectionId/:itemId») i que un id desconegut és la 404.
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M2 i
 * M4) · El Rebost i Salut porten el botó «Obrir…» dalt (dins del bloc blanc
 * de l'H1) i al final, i sis blocs de presentació: dins de l'App de veres
 * també. Les consultes de coincidència única passen a demanar-ne exactament
 * dos, amb el mateix destí o el mateix estat inert (Gauntlet 261022_0225,
 * F2: sense destí ja no n'hi ha cap, ni inert).
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3) · Cada
 * bloc és un títol H3 i el seu paràgraf: el cos comença en H3.
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

test('App munta /plugin/rebost: la pàgina del plugin, amb la portada plegable, els sis blocs (H3 i paràgraf) i el botó d’Obrir dalt i al final', async () => {
  await muntaApp('/plugin/rebost', async () => {
    const titol = await screen.findByRole('heading', { level: 1, name: 'Rebost Domèstic' });
    expect(titol).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Amaga la portada' })).toBeTruthy();
    // Onada 10 (M2) · Dos enllaços, el de dalt i el de baix, cap a la mateixa entrada.
    const enllacos = screen.getAllByRole('link', { name: 'Obrir el Rebost' });
    expect(enllacos.map((enllac) => enllac.getAttribute('href'))).toEqual(['/app/nevera/casa', '/app/nevera/casa']);
    const [dalt, baix] = enllacos;
    expect(dalt.parentElement.className).toBe('page-title-accio');
    expect(dalt.closest('header.page-title')).toBe(titol.closest('header.page-title'));
    expect(baix.parentElement.className).toBe('sdp-pagina-accio');
    // Onada 10 (M4) · Els sis blocs, dins de l'article i abans del botó de baix:
    // des del 261021 (tasca 6), cada un un títol H3 i el seu paràgraf.
    const article = baix.closest('article.content-wrapper');
    expect(article.lastElementChild).toBe(baix.parentElement);
    expect(article.querySelectorAll(':scope > article.cms-preview > p')).toHaveLength(6);
    expect(article.querySelectorAll(':scope > article.cms-preview > h3')).toHaveLength(6);
    expect(baix.parentElement.previousElementSibling.className).toBe('cms-preview');
  });
});

/* Onada 10 (M2) · Abans, dos botons inerts, dalt i al final.
   Gauntlet 261022_0225 (F2) · DEROGAT: sense destí, cap «Obrir…», ni dalt ni
   baix; baix, l'estat buit amb «Desactiva esta eina». */
test('App: Salut en un document que no és l’ama (sense manageDocumentHead) no fa cap enllaç ni pinta cap «Obrir…»', async () => {
  await muntaApp('/plugin/salut', async () => {
    const titol = await screen.findByRole('heading', { level: 1, name: 'Salut' });
    expect(screen.queryByRole('link', { name: /Obrir Salut/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Obrir Salut/ })).toBeNull();
    expect(titol.closest('header.page-title').querySelector('.page-title-accio')).toBeNull();
    const desactiva = screen.getByRole('button', { name: 'Desactiva esta eina' });
    expect(desactiva.closest('.sdp-pagina-accio')).not.toBeNull();
  });
});

test('App: /plugin/<id desconegut> és la 404 de sempre', async () => {
  await muntaApp('/plugin/desconegut', async () => {
    expect(await screen.findByRole('heading', { level: 1, name: 'Ací no hi ha res' })).toBeTruthy();
  });
});
