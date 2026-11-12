/* R16b · El botó CONTROL de la barra lateral és l'element actiu (aria-current="page") a les filles
   del Panell de Control (esFillaDelPanell, App.jsx): cada plugin (/plugin/<id>) i la pàgina d'acció
   de cada targeta de publicació (DESTINS_CONTROL, destinsControl.js). Les verticals del Mur, com
   /mapa, són seccions pròpies: allí no ho és. La IAIA Sabuda només és filla del Panell amb la
   curadoria cultural encesa, que és quan hi té targeta (ControlSection.jsx).
   App.jsx no importa destinsControl.js (portaria PAGE_COPY al tros d'entrada): estes proves munten
   l'App a cada pàgina de la taula, i si la taula en guanya una que App.jsx no coneix, cauen.
   Shell real (PedraSecaEmbed > App) amb router de navegador i un backend fals sense sessió ni xarxa,
   com App.iaia.test.jsx. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getSessionState, sincronitza } from '../data/sessionService.js';
import { DESTINS_CONTROL, rutaDePagina } from '../sections/control/destinsControl.js';

/* Hermètica davant del .env.local de la màquina (Vitest el carrega): la curadoria cultural, apagada
   llevat de la prova que l'encén. */
vi.hoisted(() => {
  for (const variable of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_DATA_MODE', 'VITE_TENANT_ID',
    'VITE_UMAMI_WEBSITE_ID', 'VITE_UMAMI_HOST', 'VITE_UMAMI_SHARE_URL', 'VITE_SDP_CURADORIA_CULTURAL']) vi.stubEnv(variable, '');
});
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

/* Munta l'App a `ruta` i torna l'aria-current del botó CONTROL en el moment que apareix la barra, amb la ruta
   encara la demanada (una redirecció d'una secció diferida que arribara després no la veuria). */
async function ariaCurrentDeControl(ruta, comprovaPagina) {
  vi.stubGlobal('innerWidth', 1280);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => { throw new Error('Xarxa inesperada: ' + url); }));
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
  sincronitza();
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    const barra = await screen.findByRole('navigation', { name: 'Navegació principal' }, ESPERA);
    const control = within(barra).getByRole('button', { name: 'Panell de control' });
    /* Quan apareix la barra, la ruta encara és la demanada. */
    expect(window.location.pathname).toBe(ruta);
    await comprovaPagina?.();
    return control.getAttribute('aria-current');
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

describe('el botó CONTROL de la barra, a les filles del Panell', () => {
  test('les pàgines d’acció de la taula: les huit de sempre, en el seu ordre', () => {
    expect(DESTINS_CONTROL.map((desti) => rutaDePagina(desti.pagina))).toEqual([
      '/page/publicar_mur', '/page/publicar_mercat', '/page/publicar_calendari', '/page/publicar_mapa',
      '/page/vehicle_compartit', '/page/animalets', '/page/treball', '/page/habitatge'
    ]);
  });

  test.each(['/plugin/gestoria', ...DESTINS_CONTROL.map((desti) => rutaDePagina(desti.pagina))])(
    'a %s, CONTROL porta aria-current="page"',
    async (ruta) => {
      expect(await ariaCurrentDeControl(ruta)).toBe('page');
    },
    15000
  );

  test('la ruta directa de l’Avisador carrega la vista diferida sense sessió', async () => {
    await ariaCurrentDeControl('/page/avisador', async () => {
      expect(await screen.findByRole('heading', { name: 'L’Avisador' }, ESPERA)).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Entra amb el teu compte' }).getAttribute('href')).toContain('avisador');
      expect(screen.queryByRole('combobox')).toBeNull();
    });
  }, 15000);

  test('a /mapa, una vertical del Mur, CONTROL no porta aria-current', async () => {
    expect(await ariaCurrentDeControl('/mapa')).toBeNull();
  }, 15000);

  test('a /page/la-iaia-sabuda, CONTROL només és actiu amb la curadoria cultural encesa', async () => {
    expect(await ariaCurrentDeControl('/page/la-iaia-sabuda')).toBeNull();
    vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '1');
    try {
      expect(await ariaCurrentDeControl('/page/la-iaia-sabuda')).toBe('page');
    } finally {
      vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '');
    }
  }, 20000);
});
