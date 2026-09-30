/**
 * T2 (ordre del Mestre, 260930) · Quan les dades del Mur no arriben, la
 * pantalla ho diu amb paraules del poble (mai el missatge de l'adaptador, que
 * només es veu en desenvolupament), deixa tornar-ho a provar i, si este
 * navegador ha passat d'una demostració al servidor, deixa tornar al mode de
 * proves. En mode de proves, el Mur no fa cap petició de xarxa pel seu compte.
 *
 * El proveïdor (MurProvider) i el port (backendPort) són els reals; el backend
 * és un fals complet injectat pel port, com a App.test.jsx. La prova de
 * l'adaptador real en mode seed viu a src/data/supabase/content.test.js (E1 de
 * tractor-enxufe: cap secció importa l'adaptador).
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
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', error: null, pageCopy: {} }) }));
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
import { MurProvider } from './MurContext';
import MurSection from './MurSection.jsx';

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
const errorHttp = () => Object.assign(new Error('Supabase 500: {"message":"relation does not exist"}'), { name: 'ErrorSupabase', status: 500 });

const pinta = (externalConfig) => {
  mocks.externalConfig = externalConfig;
  return render(<MurProvider config={externalConfig}><MurSection /></MurProvider>);
};
const alerta = () => screen.findByRole('alert');

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

test('amb el servidor aturat, el Mur ho diu amb paraules neutrals, sense el missatge de l’adaptador', async () => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain("No s'ha pogut carregar el Mur");
  expect(avis.textContent).toContain(TEXT_INABASTABLE);
  expect(avis.textContent).not.toMatch(/Supabase|backend local|Error de xarxa/);
  expect(avis.querySelector('.sdp-error-pre')).toBeNull();
});

/* Correcció de la revisió (260930) · Abans esta prova fixava «Revisa la
   connexió» per a un 500: era una instrucció falsa, perquè el servidor sí que
   havia respost. Ara un error del servidor ho diu com a tal (error.servidor),
   i «Revisa la connexió» queda per al temps esgotat (prova de baix). */
test('un error del servidor que no és de xarxa diu que ha fallat el servidor, mai «Revisa la connexió» ni «Supabase NNN»', async () => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(errorHttp());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_SERVIDOR);
  expect(avis.textContent).not.toContain(TEXT_XARXA);
  expect(avis.textContent).not.toContain(TEXT_INABASTABLE);
  expect(avis.textContent).not.toMatch(/Supabase|500|relation/);
});

test('un 403 de RLS també és un error del servidor, no de la connexió', async () => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(Object.assign(new Error('Supabase 403: {"message":"permission denied"}'), { name: 'ErrorSupabase', status: 403 }));
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_SERVIDOR);
  expect(avis.textContent).not.toContain(TEXT_XARXA);
  expect(avis.textContent).not.toMatch(/Supabase|403|permission/);
});

test('un temps esgotat, sense resposta del servidor, diu «Revisa la connexió»', async () => {
  vi.stubEnv('DEV', false);
  mocks.load.mockRejectedValue(Object.assign(new Error('signal timed out'), { name: 'TimeoutError' }));
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_XARXA);
  expect(avis.textContent).not.toContain(TEXT_SERVIDOR);
  expect(avis.textContent).not.toContain(TEXT_INABASTABLE);
  expect(avis.textContent).not.toMatch(/timed out/);
});

test('en desenvolupament, el detall tècnic de l’adaptador es veu a part del text neutral', async () => {
  vi.stubEnv('DEV', true);
  mocks.load.mockRejectedValue(errorDeXarxa());
  pinta(CONFIG_REMOT);
  const avis = await alerta();
  expect(avis.textContent).toContain(TEXT_INABASTABLE);
  expect(avis.querySelector('.sdp-error-pre')?.textContent).toBe(MISSATGE_ADAPTADOR);
});

test('«Torna-ho a provar» torna a carregar el Mur (refresh del proveïdor)', async () => {
  mocks.load
    .mockRejectedValueOnce(errorDeXarxa())
    .mockResolvedValueOnce({ feedPosts: [{ id: 'p', type: 'feed', title: 'Ja tornem a tindre servidor', created_at: '2026-09-30T10:00:00.000Z' }], events: [], marketItems: [] });
  pinta(CONFIG_REMOT);
  const boto = await screen.findByRole('button', { name: 'Torna-ho a provar' });
  await act(async () => { boto.click(); });
  expect(await screen.findByText('Ja tornem a tindre servidor')).toBeTruthy();
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

test('si no es pot esborrar l’elecció, el Mur ho diu i no recarrega', async () => {
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

test('en mode de proves, el Mur no fa cap petició de xarxa pel seu compte', async () => {
  const fetch = vi.fn(() => { throw new Error('Xarxa inesperada en mode de proves'); });
  vi.stubGlobal('fetch', fetch);
  const errors = vi.spyOn(console, 'error');
  mocks.load.mockResolvedValue({ feedPosts: APP_SEED.feedPosts, events: APP_SEED.events, marketItems: APP_SEED.marketItems });
  pinta(CONFIG_SEED);
  await waitFor(() => expect(document.querySelectorAll('.sdp-card-grid > *').length).toBeGreaterThan(0));
  expect(mocks.load).toHaveBeenCalledWith('A', expect.objectContaining({ dataMode: 'seed' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(errors).not.toHaveBeenCalled();
});
