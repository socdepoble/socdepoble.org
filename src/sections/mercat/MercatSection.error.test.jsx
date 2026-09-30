/**
 * T2 (ordre del Mestre, 260930) · El Mercat té el mateix contracte d'error que
 * el Mur: text neutral triat pel codi (mai el missatge de l'adaptador, que
 * només es veu en desenvolupament), «Torna-ho a provar» i, si este navegador
 * ha passat d'una demostració al servidor, «Tornar al mode de proves». Els
 * estats normals (carregant, llista, buit) no canvien. En mode de proves, el
 * Mercat no fa cap petició de xarxa pel seu compte.
 *
 * El proveïdor (MurProvider, d'on el Mercat trau els productes) i el port són
 * els reals; el backend és un fals complet injectat pel port, com a
 * App.test.jsx. La prova de l'adaptador real en mode seed viu a
 * src/data/supabase/content.test.js (E1 de tractor-enxufe).
 */
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), t: (_, alternativa) => alternativa, externalConfig: {},
  load: vi.fn(), eleccio: vi.fn(() => false), exit: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, generacio: 1 }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'A', actorKey: 'A' }) }));
/* L'elecció i l'eixida són les del mòdul neutral: la resolució del mode és la
   real; només es fixa si hi ha elecció i s'evita la recàrrega del document. */
vi.mock('../../config/dataMode.js', async (importOriginal) => ({
  ...(await importOriginal()),
  eleccioRemotaActiva: (...args) => mocks.eleccio(...args),
  exitRemoteMode: (...args) => mocks.exit(...args)
}));

import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { setBackendImplementation } from '../../data/backendPort.js';
import { APP_SEED } from '../../data/appSeed.js';
import { MurProvider } from '../mur/MurContext';
import MercatSection from './MercatSection.jsx';

const TENANT = '11111111-2222-3333-4444-555555555555';
const NODE = { supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_proves', tenantId: TENANT };
const CONFIG_REMOT = { ...NODE, dataMode: 'remote' };
const CONFIG_SEED = { ...NODE, dataMode: 'seed' };
const TEXT_INABASTABLE = 'El servidor del poble no respon ara mateix. El contingut no s’ha pogut carregar.';
const TEXT_XARXA = 'Revisa la connexió i torna-ho a provar.';
const TEXT_SERVIDOR = 'El servidor del poble ha tornat un error. Torna-ho a provar més tard.';
const MISSATGE_ADAPTADOR = 'Error de xarxa: No es pot connectar al servidor. Comprova la teua connexió a internet o que el backend local estiga en marxa.';

/* Els errors tal com els llança l'adaptador (runtime.js), sense importar-lo. */
const errorDeXarxa = () => Object.assign(new Error(MISSATGE_ADAPTADOR), { name: 'ErrorSupabase', status: 0, codi: 'backend-inabastable' });
const errorHttp = () => Object.assign(new Error('Supabase 503: {"message":"upstream"}'), { name: 'ErrorSupabase', status: 503 });

const pinta = (externalConfig) => {
  mocks.externalConfig = externalConfig;
  return render(<MurProvider config={externalConfig}><MercatSection /></MurProvider>);
};
const alerta = () => screen.findByRole('alert');
const targetes = () => document.querySelectorAll('.sdp-card-grid > *');

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
beforeEach(() => {
  mocks.load.mockReset();
  mocks.eleccio.mockReset();
  mocks.exit.mockReset();
  const inesperat = (nom) => () => { throw new Error(`Mètode inesperat: ${nom}`); };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, inesperat(nom)])),
    loadMur: (...args) => mocks.load(...args)
  });
});

test('amb el servidor aturat, el Mercat ho diu amb paraules neutrals, sense el missatge de l’adaptador', async () => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain("No s'ha pogut carregar el Mercat");
  expect(avis.textContent).toContain(TEXT_INABASTABLE);
  expect(avis.textContent).not.toMatch(/Supabase|backend local|Error de xarxa/);
  expect(avis.querySelector('.sdp-error-pre')).toBeNull();
});

/* Correcció de la revisió (260930) · Abans esta prova fixava «Revisa la
   connexió» per a un error HTTP del servidor: era una instrucció falsa. Ara
   el 503 i el 500 diuen error.servidor, i mai el text de l'adaptador. */
test.each([
  ['503', errorHttp],
  ['500', () => Object.assign(new Error('Supabase 500: {"message":"relation does not exist"}'), { name: 'ErrorSupabase', status: 500 })]
])('un %s del servidor diu que ha fallat el servidor, mai «Revisa la connexió» ni «Supabase NNN»', async (_, error) => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(error());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_SERVIDOR);
  expect(avis.textContent).not.toContain(TEXT_XARXA);
  expect(avis.textContent).not.toContain(TEXT_INABASTABLE);
  expect(avis.textContent).not.toMatch(/Supabase|503|500|upstream|relation/);
});

test('en desenvolupament, el detall tècnic de l’adaptador es veu a part del text neutral', async () => {
  vi.stubEnv('DEV', true);
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_INABASTABLE);
  expect(avis.querySelector('.sdp-error-pre')?.textContent).toBe(MISSATGE_ADAPTADOR);
});

test('«Torna-ho a provar» torna a carregar els productes (refresh del proveïdor)', async () => {
  mocks.load
    .mockRejectedValueOnce(errorDeXarxa())
    .mockResolvedValueOnce({ feedPosts: [], events: [], marketItems: [{ id: 'mel', type: 'market', title: 'Mel de romer', created_at: '2026-09-30T10:00:00.000Z' }] });
  pinta(CONFIG_REMOT);
  const boto = await screen.findByRole('button', { name: 'Torna-ho a provar' });
  await act(async () => { boto.click(); });
  expect(await screen.findByText('Mel de romer')).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
});

test('amb l’elecció remota activa apareix «Tornar al mode de proves» i crida exitRemoteMode amb el node', async () => {
  mocks.eleccio.mockReturnValue(true);
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_SEED);
  const boto = await screen.findByRole('button', { name: 'Tornar al mode de proves' });
  const node = expect.objectContaining({ backendId: 'supabase', backendUrl: 'http://localhost:54321', tenantId: TENANT });
  expect(mocks.eleccio).toHaveBeenCalledWith(node);
  expect(mocks.exit).not.toHaveBeenCalled();
  act(() => { boto.click(); });
  expect(mocks.exit).toHaveBeenCalledTimes(1);
  expect(mocks.exit).toHaveBeenCalledWith(node);
});

test('si no es pot esborrar l’elecció, el Mercat ho diu i no recarrega', async () => {
  mocks.eleccio.mockReturnValue(true);
  mocks.exit.mockImplementation(() => { throw new Error('No s’ha pogut esborrar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.'); });
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_SEED);
  const boto = await screen.findByRole('button', { name: 'Tornar al mode de proves' });
  act(() => { boto.click(); });
  expect((await alerta()).textContent).toContain('No s’ha pogut esborrar l’elecció.');
});

test('sense elecció remota, l’error no ofereix tornar al mode de proves', async () => {
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_REMOT);
  await screen.findByRole('button', { name: 'Torna-ho a provar' });
  expect(screen.queryByRole('button', { name: 'Tornar al mode de proves' })).toBeNull();
  expect(mocks.eleccio).toHaveBeenCalled();
});

/* Llei del Píxel · els estats normals del Mercat, com abans de T2. */
test('mentre carrega, el Mercat ho anuncia i no pinta cap error', async () => {
  mocks.load.mockReturnValue(new Promise(() => {}));
  pinta(CONFIG_REMOT);
  expect(await screen.findByText('Carregant els productes…')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Torna-ho a provar' })).toBeNull();
});

test('sense productes, el Mercat diu que encara no n’hi ha', async () => {
  mocks.load.mockResolvedValue({ feedPosts: [], events: [], marketItems: [] });
  pinta(CONFIG_REMOT);
  expect(await screen.findByText('Encara no hi ha productes publicats en este poble.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(targetes()).toHaveLength(0);
});

test('en mode de proves, el Mercat no fa cap petició de xarxa pel seu compte', async () => {
  const fetch = vi.fn(() => { throw new Error('Xarxa inesperada en mode de proves'); });
  vi.stubGlobal('fetch', fetch);
  const errors = vi.spyOn(console, 'error');
  mocks.load.mockResolvedValue({ feedPosts: APP_SEED.feedPosts, events: APP_SEED.events, marketItems: APP_SEED.marketItems });
  pinta(CONFIG_SEED);
  await waitFor(() => expect(targetes()).toHaveLength(APP_SEED.marketItems.length));
  expect(APP_SEED.marketItems.length).toBeGreaterThan(0);
  expect(mocks.load).toHaveBeenCalledWith('A', expect.objectContaining({ dataMode: 'seed' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});
