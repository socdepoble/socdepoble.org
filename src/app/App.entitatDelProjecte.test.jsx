/* T6 en remot (verificació del front «autoria», 261004) · L'app sencera, en
   mode remot i amb el router del navegador, resol l'id de servidor de
   l'entitat pilot UNA sola vegada i a nivell d'app (AppDataLoader,
   useEntitatDelProjecte): /mercat, /mercat/:id i /mur/:id porten la boina del
   pilot a /projecte encara que s'hi entre directament, sense passar pel Mur
   ni per una publicació del MAS. Una altra entitat del servidor continua
   portant al seu perfil. En llavor, cap crida. Els UUID i els continguts són
   sintètics; cap xarxa (fetch llança). */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { oblidaEntitatDelProjecte, RUTA_PROJECTE } from '../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../data/identitatsSeed.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async importOriginal => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const UUID_PILOT = '0b1c2d3e-4f50-4a61-8b72-93a4b5c6d7e8';
const UUID_ALTRA = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a';
const DATA = '2026-09-01T10:00:00.000Z';
const PRODUCTE_PILOT = { id: 'cistella-pilot', type: 'product', title: 'Cistella del projecte', author_name: 'Sóc de Poble', author_org_id: UUID_PILOT, created_at: DATA };
const PRODUCTE_ALTRA = { id: 'banc-forn', type: 'product', title: 'Banc del forn', author_name: 'Forn del Raval', author_org_id: UUID_ALTRA, created_at: DATA };
const AVIS_PILOT = { id: 'avis-pilot', type: 'post', title: 'Avís del projecte', author_name: 'Sóc de Poble', author_org_id: UUID_PILOT, created_at: DATA };

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  oblidaEntitatDelProjecte();
});

/* Munta l'app sencera a `ruta`, sense sessió, amb un backend fals que porta
   el directori (loadPerfilPublic): el servidor diu que l'entitat amb el slug
   del pilot és UUID_PILOT. */
async function munta(ruta, cos, { dataMode = 'remote' } = {}) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async url => { throw new Error('Xarxa inesperada: ' + url); }));
  const loadPerfilPublic = vi.fn(async (clau) => (clau === ENTITAT_PILOT_SLUG
    ? { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' }
    : null));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => dataMode,
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [AVIS_PILOT], events: [], marketItems: [PRODUCTE_PILOT, PRODUCTE_ALTRA] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    loadPerfilPublic
  });
  window.history.replaceState(null, '', ruta);
  try {
    const { container } = render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos({ container, loadPerfilPublic });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* L'enllaç de la boina de la targeta amb este títol, o null. */
const boinaDeLaTargeta = (arrel, titol) => [...arrel.querySelectorAll('article')]
  .find((article) => article.querySelector('.sp-card-title')?.textContent === titol)
  ?.querySelector('header.sp-card-header a.sp-card-author-link')?.getAttribute('href') ?? null;
/* L'enllaç de l'autoria de la barra taronja de la pàgina, o null. */
const autoriaDeLaBarra = (arrel) => arrel.querySelector('.sdp-universal-page-container > section.bar-orange > a.sp-card-author')?.getAttribute('href') ?? null;
/* Les crides al directori per a resoldre el pilot (pel slug declarat, mai pel nom). */
const cridesDelPilot = (espia) => espia.mock.calls.filter(([clau]) => clau === ENTITAT_PILOT_SLUG).length;

test('/mercat, entrant directament: la boina del pilot porta a /projecte; la d’una altra entitat, al seu perfil; una sola crida', async () => {
  await munta('/mercat', async ({ container, loadPerfilPublic }) => {
    await waitFor(() => expect(boinaDeLaTargeta(container, PRODUCTE_PILOT.title)).toBe(RUTA_PROJECTE));
    expect(boinaDeLaTargeta(container, PRODUCTE_ALTRA.title)).toBe(`/empresa/${UUID_ALTRA}`);
    expect(cridesDelPilot(loadPerfilPublic)).toBe(1);
    expect(loadPerfilPublic.mock.calls.every(([clau]) => clau === ENTITAT_PILOT_SLUG)).toBe(true);
  });
});

test('/mercat/:id, entrant directament: la barra taronja del detall porta a /projecte', async () => {
  await munta(`/mercat/${PRODUCTE_PILOT.id}`, async ({ container, loadPerfilPublic }) => {
    await waitFor(() => expect(autoriaDeLaBarra(container)).toBe(RUTA_PROJECTE));
    expect(cridesDelPilot(loadPerfilPublic)).toBe(1);
  });
});

test('/mur/:id, entrant directament: la barra taronja del detall porta a /projecte', async () => {
  await munta(`/mur/${AVIS_PILOT.id}`, async ({ container, loadPerfilPublic }) => {
    await waitFor(() => expect(autoriaDeLaBarra(container)).toBe(RUTA_PROJECTE));
    expect(cridesDelPilot(loadPerfilPublic)).toBe(1);
  });
});

test('/mercat/:id d’una altra entitat: la barra continua portant al seu perfil', async () => {
  await munta(`/mercat/${PRODUCTE_ALTRA.id}`, async ({ container, loadPerfilPublic }) => {
    await waitFor(() => expect(cridesDelPilot(loadPerfilPublic)).toBe(1));
    await waitFor(() => expect(autoriaDeLaBarra(container)).toBe(`/empresa/${UUID_ALTRA}`));
  });
});

test('el disparador és un de sol, a nivell d’app: AppDataLoader, damunt de totes les rutes', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const codi = readFileSync(join(process.cwd(), 'src/app/App.jsx'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(codi.match(/\buseEntitatDelProjecte\(\)/g)).toHaveLength(1);
  const carregador = codi.slice(codi.indexOf('function AppDataLoader()'), codi.indexOf('export class RouteErrorBoundary'));
  expect(carregador).toContain('useEntitatDelProjecte();');
  expect(carregador).toContain('<AppRoutes />');
});

test('en llavor, l’app no demana res al directori per a resoldre el pilot', async () => {
  await munta('/mercat', async ({ container, loadPerfilPublic }) => {
    await waitFor(() => expect(boinaDeLaTargeta(container, PRODUCTE_PILOT.title)).not.toBeNull());
    expect(cridesDelPilot(loadPerfilPublic)).toBe(0);
  }, { dataMode: 'seed' });
});
