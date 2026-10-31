/* P1-44 (pla 261029_0216; Llibre Mestre, fita 8) · L'ordre dels proveïdors a
   l'arrel. El Mestre va vore «Uncaught Error: useSession ha de ser usat dins
   de SessionProvider», llançat des d'IdentitatContext.jsx i de
   ModeracioContext.jsx, en entrar a /multimedia o a /consola.

   Què diu el codi (cartografia del 261029, abans de cap canvi):
   · L'arbre real és PedraSecaEmbed > UIProvider > SessionProvider >
     IdentitatProvider > App > … > AppContent > CoreContentProvider >
     ProveidorModeracio > Mur, Notes, Xat i Multimedia (PedraSecaEmbed.jsx i
     App.jsx). SessionProvider embolcalla els dos proveïdors que criden
     useSession(), i cadascun es munta en UN sol lloc.
   · MultimediaContext (useIdentitat) i la Consola viuen davall de tots.
   Esta prova munta l'arbre real a les dues rutes amb sessió (els dos
   proveïdors llancen només quan useSession no troba el context) i fixa:
   · cap error de proveïdor a la consola ni cap barrera (RouteErrorBoundary ni
     l'ErrorBoundary de l'arrel), i la pàgina de la ruta pintada;
   · els consumidors muntats de veres: IdentitatProvider demana les
     organitzacions i el perfil de la persona (IdentitatContext.jsx), i
     ProveidorModeracio demana els bloquejos quan el port té la capacitat
     'moderacio' (ModeracioContext.jsx · carregaBloquejos); MultimediaProvider
     (useIdentitat) demana l'arxiu;
   · per text: un sol <SessionProvider>, un sol <IdentitatProvider> i un sol
     <ProveidorModeracio> a tota la producció, i el de sessió per fora.
   L'error no es reproduïx amb l'arbre d'esta còpia: dos contextos de sessió
   diferents només ixen de DOS mòduls SessionContext (un tros d'un build vell
   servit per un service worker ranci al costat d'un de nou). La prova queda
   de regressió perquè cap canvi de l'arbre no trenque l'ordre. */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CAPACITATS, CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { copyConsola } from '../sections/consola/consolaPagines.js';
import { oblidaRecuperacioPendent } from '../data/recuperacioPendent.js';

/* Hermètica davant del .env.local de la màquina, com App.appsLocals.test.jsx. */
vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID',
    'VITE_UMAMI_WEBSITE_ID', 'VITE_UMAMI_HOST', 'VITE_UMAMI_SHARE_URL']) vi.stubEnv(variable, '');
});
vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const ARREL = process.cwd();
const USUARI = Object.freeze({ id: 'u-p1-44', user_metadata: Object.freeze({ full_name: 'Pepa Soler' }) });
const MISSATGE_DE_PROVEIDOR = /ha de ser usat dins de/;

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  oblidaRecuperacioPendent();
});

/**
 * Munta l'App sencera a `ruta` amb sessió i un port fals que anota cada
 * mètode cridat (el nucli i la capacitat 'moderacio'). Torna, dins de `cos`,
 * els noms cridats i l'espia de console.error.
 */
async function munta(ruta, cos) {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  /* Fora del middleware de dev, /__iaia/* és 404 (App.test.jsx): la Consola ho diu. */
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  }));
  const errors = vi.spyOn(console, 'error');
  const crides = [];
  const propis = {
    getCurrentUser: () => USUARI,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => USUARI.id,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    listMyOrganizations: async () => [],
    getProfile: async () => null,
    llistaBloquejos: async () => []
  };
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation(Object.fromEntries([...CONTRACTE_NUCLI, ...CAPACITATS.moderacio].map((nom) => [nom, (...args) => {
    crides.push(nom);
    return propis[nom] ? propis[nom](...args) : Promise.resolve(null);
  }])));
  sincronitza();
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'local' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('dins'));
    await cos({ crides, errors });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

function senseCapBarrera() {
  expect(screen.queryByText("No s'ha pogut carregar Sóc de Poble")).toBeNull();
  expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
  expect(screen.queryByText('Accés restringit')).toBeNull();
  expect(screen.getByRole('main')).toBeTruthy();
}

/* Els consumidors de veres dels dos contextos, muntats: cada un demana el que
   només demana amb sessió i amb el seu proveïdor per damunt. */
const esperaElsConsumidors = (crides) => waitFor(() => {
  expect(crides).toContain('listMyOrganizations');
  expect(crides).toContain('getProfile');
  expect(crides).toContain('llistaBloquejos');
  expect(crides).toContain('loadMultimedia');
});

test('a /multimedia, l’arbre real amb sessió munta IdentitatProvider i ProveidorModeracio dins de SessionProvider: cap error de proveïdor, l’Arxiu pintat', async () => {
  /* Bloc E (IDEA-55 + P1-71, Onada 261029_1605) · /multimedia és un
     UniversalWorkspace amb mestre-detall: jsdom mesura 0 px (el mòbil, on va
     primer la navegació). Amb l'amplada de la prova (innerWidth 1024), la
     portada de l'Arxiu és a la vista. */
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1024);
  await munta('/multimedia', async ({ crides, errors }) => {
    expect(await screen.findByRole('heading', { name: 'Arxiu visual' }, { timeout: 8000 })).toBeTruthy();
    await esperaElsConsumidors(crides);
    senseCapBarrera();
    expect(window.location.pathname).toBe('/multimedia');
    expect(errors.mock.calls.filter((args) => args.some((arg) => MISSATGE_DE_PROVEIDOR.test(String(arg?.message ?? arg))))).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });
}, 15000);

test('a /consola, el mateix: cap error de proveïdor, el tauler de la Consola pintat', async () => {
  await munta('/consola', async ({ crides, errors }) => {
    expect(await screen.findByRole('heading', { name: copyConsola().title }, { timeout: 8000 })).toBeTruthy();
    await esperaElsConsumidors(crides);
    senseCapBarrera();
    expect(window.location.pathname).toBe('/consola');
    expect(errors.mock.calls.filter((args) => args.some((arg) => MISSATGE_DE_PROVEIDOR.test(String(arg?.message ?? arg))))).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
  });
}, 15000);

/* Per text · un sol lloc per proveïdor a tota la producció de src/ i el de
   sessió per fora dels altres dos: PedraSecaEmbed munta SessionProvider >
   IdentitatProvider > App, i App.jsx munta ProveidorModeracio dins d'App
   (AppContent), mai cap SessionProvider propi. */
function fitxers(dir, acc = []) {
  for (const e of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) fitxers(rel, acc);
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) acc.push(rel);
  }
  return acc;
}
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');

test('per text: SessionProvider, IdentitatProvider i ProveidorModeracio es munten una sola vegada, i el de sessió per fora', () => {
  const muntatges = {};
  for (const rel of fitxers('src')) {
    const font = llig(rel);
    for (const nom of ['SessionProvider', 'IdentitatProvider', 'ProveidorModeracio']) {
      const n = (font.match(new RegExp(`<${nom}\\b`, 'g')) || []).length;
      if (n) (muntatges[nom] ??= []).push([rel, n]);
    }
  }
  expect(muntatges).toEqual({
    SessionProvider: [['src/PedraSecaEmbed.jsx', 1]],
    IdentitatProvider: [['src/PedraSecaEmbed.jsx', 1]],
    ProveidorModeracio: [['src/app/App.jsx', 1]]
  });
  const embed = llig('src/PedraSecaEmbed.jsx');
  const ordre = ['<SessionProvider', '<IdentitatProvider', '<App ', '</IdentitatProvider>', '</SessionProvider>'].map((tros) => embed.indexOf(tros));
  expect(ordre.every((i) => i > 0)).toBe(true);
  expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  const app = llig('src/app/App.jsx');
  const dinsDAppContent = app.slice(app.indexOf('function AppContent('));
  expect(dinsDAppContent.indexOf('<ProveidorModeracio')).toBeGreaterThan(0);
  expect(app).not.toMatch(/<SessionProvider\b/);
});
