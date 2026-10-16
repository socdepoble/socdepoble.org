/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre) · Les tres rutes canòniques
   netes de les identitats que controla el Mestre: /javillinares (la persona),
   /socdepoble (l'organització i portal central) i /rentonar (el grup de
   treball de l'associació ecologista). Abans acabaven a NotFoundPage («Ací no
   hi ha res»). L'app sencera, en llavor i amb el router del navegador, obri
   a cadascuna la fitxa pública de sempre (PerfilPublicSection) pel slug
   declarat de la identitat, amb el seu poble, i les rutes d'abans obrin la
   MATEIXA fitxa: un sol perfil per identitat. El directori el fa el magatzem
   local de la llavor (localPerfils.js), sense sessió; cap xarxa (fetch
   llança). */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { oblidaEntitatDelProjecte, RUTES_CANONIQUES } from '../config/navigation.js';
import { createLocalPerfilsAdapter } from '../data/localPerfils.js';
import { AGENTS_MAP } from '../data/agentsSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, PERSONA_PILOT, POBLE_FUNDACIONAL } from '../data/identitatsSeed.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async importOriginal => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  oblidaEntitatDelProjecte();
});

/* Munta l'app sencera a `ruta`, sense sessió, en llavor. */
async function munta(ruta, cos) {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn(query => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async url => { throw new Error('Xarxa inesperada: ' + url); }));
  const perfils = createLocalPerfilsAdapter();
  const loadPerfilPublic = vi.fn(async (clau) => perfils.loadPerfilPublic(clau, null));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'seed',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => [],
    loadPerfilPublic
  });
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser', dataMode: 'seed' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos({ loadPerfilPublic });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* Ruta → [el nom de l'H1, l'id de la fitxa única, el slug declarat]. */
const IDENTITATS = Object.freeze([
  ['/javillinares', AGENTS_MAP.JAVI.name, AGENTS_MAP.JAVI.id, PERSONA_PILOT.slug],
  ['/socdepoble', AGENTS_MAP.SOCDEPOBLE.name, ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG],
  ['/rentonar', 'Rentonar', ENTITAT_RENTONAR_SLUG, ENTITAT_RENTONAR_SLUG]
]);

test('RUTES_CANONIQUES són exactament les tres rutes netes del Mestre', () => {
  expect(Object.values(RUTES_CANONIQUES)).toEqual(['/javillinares', '/socdepoble', '/rentonar']);
  expect(IDENTITATS.map(([ruta, , , clau]) => [ruta, RUTES_CANONIQUES[clau]])).toEqual(IDENTITATS.map(([ruta]) => [ruta, ruta]));
});

test.each(IDENTITATS)('%s obri la fitxa pública de %s, amb el seu poble, i no la pàgina 404', async (ruta, nom, id, clau) => {
  await munta(ruta, async ({ loadPerfilPublic }) => {
    expect(await screen.findByRole('heading', { level: 1, name: nom }, { timeout: 4000 })).toBeTruthy();
    expect(loadPerfilPublic).toHaveBeenCalledWith(clau, expect.anything());
    expect((await loadPerfilPublic.mock.results.at(-1).value).id).toBe(id);
    expect(screen.queryByText('Ací no hi ha res')).toBeNull();
    expect(screen.getAllByText(POBLE_FUNDACIONAL).length).toBeGreaterThan(0);
  });
});

/* Les rutes d'abans (el prefix orienta, l'identificador mana) i els àlies de
   la persona pilot obrin la mateixa fitxa: cap segon perfil. */
test.each([
  ['/gent/0001', AGENTS_MAP.JAVI.name, AGENTS_MAP.JAVI.id],
  ['/gent/javi', AGENTS_MAP.JAVI.name, AGENTS_MAP.JAVI.id],
  ['/gent/javi-llinares', AGENTS_MAP.JAVI.name, AGENTS_MAP.JAVI.id],
  ['/empresa/socdepoble', AGENTS_MAP.SOCDEPOBLE.name, ENTITAT_PILOT_ID],
  ['/grup/rentonar', 'Rentonar', ENTITAT_RENTONAR_SLUG]
])('la ruta d’abans %s obri la mateixa fitxa única de %s', async (ruta, nom, id) => {
  await munta(ruta, async ({ loadPerfilPublic }) => {
    expect(await screen.findByRole('heading', { level: 1, name: nom }, { timeout: 4000 })).toBeTruthy();
    expect((await loadPerfilPublic.mock.results.at(-1).value).id).toBe(id);
  });
});

test('una ruta de primer nivell que no és cap identitat continua sent la pàgina 404', async () => {
  await munta('/javillinares-de-mentida', async ({ loadPerfilPublic }) => {
    expect(await screen.findByText('Ací no hi ha res', {}, { timeout: 4000 })).toBeTruthy();
    expect(loadPerfilPublic).not.toHaveBeenCalled();
  });
});
