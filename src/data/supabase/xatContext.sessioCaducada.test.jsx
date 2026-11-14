/* R22 (A-xat-fluxos-r1-1, Onada R22) · Amb el JWT caducat i la sessió de React
   encara «dins» (la renovació vola: en despertar el mòbil, sessionService només
   crida renovaAra), el sondeig de la llista no pot prendre les files per defecte
   per una lectura bona. El proveïdor REAL (XatContext), l'adaptador REAL de la
   llista (supabase/xat.js · loadFils) i la identitat REAL (identitat.js); només
   se simulen el client de Supabase (config.js) i la sessió de React. Abans: la
   llista es quedava en «Javi» i «IAIA», llistaFresca cert, el comptador a 0 i
   la conversa oberta passava a 404. */
import { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { XatProvider, useXat } from '../../sections/xat/XatContext.jsx';
import { configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio, jwtPerBackend } from '../../data/identitat.js';

const JO = '11111111-1111-4111-8111-111111111111';
const PEPA = '22222222-2222-4222-8222-222222222222';
const FIL = '33333333-3333-4333-8333-333333333333';
const mock = vi.hoisted(() => ({
  session: null, getClient: vi.fn(), showToast: vi.fn(),
  loadMissatges: vi.fn(), marcaLlegit: vi.fn(), subscribeToXat: vi.fn(), unsubscribeFromXat: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mock.session }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorKey: 'persona::jo', identitats: undefined }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/xat' }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mock.showToast }) }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../data/supabase/config.js', () => ({ getClient: mock.getClient }));
vi.mock('../../data/supabase/runtime.js', async (importOriginal) => ({
  ...await importOriginal(),
  getResolvedConfig: (config) => ({ ...config, runtimeDataMode: 'remote', dataMode: 'remote', hasSupabaseConfig: true })
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  const xat = await import('../../data/supabase/xat.js');
  return {
    ...real,
    loadFils: xat.loadFils, // l'adaptador de veres
    loadMissatges: mock.loadMissatges, marcaLlegit: mock.marcaLlegit,
    subscribeToXat: mock.subscribeToXat, unsubscribeFromXat: mock.unsubscribeFromXat,
    teCapacitat: () => true
  };
});

const CONFIG = { backendId: 'supabase', tenantId: '00000000-0000-4000-8000-00000000000a' };
const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwtAmbExp = (expMs) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: JO, exp: Math.floor(expMs / 1000) })}.signatura`;

let value; let client; let query;
function Sonda() { const actual = useXat(); useLayoutEffect(() => { value = actual; }); value = actual; return null; }
const pas = async (ms) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

beforeEach(() => {
  vi.clearAllMocks();
  mock.session = { currentUser: { id: JO }, generacio: 1, estat: 'dins' };
  query = { data: [{ id: FIL, tipus: 'directe', titol: null, altres_noms: ['Pepa'], participants: 2,
    altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona', avatarUrl: null }],
    ultim_text: 'Vens a sopar?', ultim_al: '2026-11-13T10:00:00Z', ultim_autor_id: PEPA, ultim_seq: 3, llegit_fins_seq: 1, no_llegits: 2 }],
    error: null, status: 200, abortSignal: vi.fn().mockReturnThis() };
  client = { rpc: vi.fn().mockReturnValue(query) };
  mock.getClient.mockResolvedValue(client);
  mock.loadMissatges.mockResolvedValue([]);
  mock.marcaLlegit.mockResolvedValue({ llegitFinsSeq: 1, rebutFinsSeq: 1 });
  mock.subscribeToXat.mockResolvedValue({ subscription: 'sub', error: null });
  mock.unsubscribeFromXat.mockResolvedValue(null);
});
afterEach(() => { cleanup(); vi.useRealTimers(); esborraSessio({ abast: 'tot' }); });

it('R22 · amb el JWT caducat i la sessió de React encara «dins», el sondeig conserva la llista i el fil obert (lectura fallida reintentable)', async () => {
  configuraBackendSessio(CONFIG);
  /* El testimoni caduca d'ací a 20 s: la primera llista es carrega amb ell viu. */
  expect(desaSessio({ access_token: jwtAmbExp(Date.now() + 20_000), refresh_token: 'rt-de-prova', user: { id: JO } })).toBe(true);
  expect(usuariDeSessio()?.id).toBe(JO);

  render(<StrictMode><XatProvider config={CONFIG}><Sonda /></XatProvider></StrictMode>);
  await waitFor(() => expect(value.status).toBe('ready'));
  expect(value.chatThreads.map((f) => f.id)).toContain(FIL);
  expect(value.totalNoLlegits).toBe(2);
  const cridesAbans = client.rpc.mock.calls.filter(([nom]) => nom === 'xat_fils_meus').length;
  expect(cridesAbans).toBeGreaterThan(0);

  vi.useFakeTimers();
  act(() => value.obriFil(FIL));
  await pas(0);
  expect(value.filActiu).toBe(FIL);

  /* Passen 25 s: el JWT ja ha caducat (20 s) i cap renovació no ha arribat. */
  await pas(25_000);
  expect(usuariDeSessio()).toBeNull();
  expect(jwtPerBackend(CONFIG)).not.toBeNull();

  /* Cap crida al servidor amb un testimoni caducat… */
  expect(client.rpc.mock.calls.filter(([nom]) => nom === 'xat_fils_meus').length).toBe(cridesAbans);
  /* …i la llista d'abans es conserva, marcada com a no fresca (B04): XatSection
     conserva el fil obert i no decidix cap 404. */
  expect(value.chatThreads.map((f) => f.id)).toContain(FIL);
  expect(value.llistaFresca).toBe(false);
  expect(value.avis).toBeNull();
  expect(value.avisLlista).toBeTruthy();
  expect(value.totalNoLlegits).toBe(2);
  expect(value.filActiu).toBe(FIL);
});
