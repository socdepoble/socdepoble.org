import { beforeEach, expect, test, vi } from 'vitest';
/* IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla 261025_0200)
   · L'adaptador Supabase de la titular que ha triat mostrar-se (capacitat
   'titularPublic') i de la seua tria ('consentimentTitular'): les RPC de
   2610250300, cap petició sense sessió ni amb un id que no és cap UUID, mai
   cap correu ni cap rol, i els codis SDP-TIT pel prefix. */
const m = vi.hoisted(() => ({ rpc: vi.fn(), user: null, local: {}, bloquejos: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: vi.fn(), rpc: m.rpc,
  getResolvedConfig: (config = {}) => ({ hasSupabaseConfig: true, runtimeDataMode: config.dataMode || 'remote', ...config }) }));
vi.mock('../localPerfils.js', () => ({ localPerfils: m.local }));
vi.mock('./moderacio.js', () => ({ llistaBloquejos: (...args) => m.bloquejos(...args) }));
import { estatTitularPublic, loadTitularPublic, marcaTitularPublic } from './perfils.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';

const ORG = '2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8091';
const PEPA = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const ambCodiPg = (status, message) => Object.assign(new Error(`Supabase ${status}: ${JSON.stringify({ code: '42501', message })}`), { status });

beforeEach(() => {
  vi.clearAllMocks();
  m.user = { id: 'U' };
  m.rpc.mockResolvedValue([]);
  m.bloquejos.mockResolvedValue([]);
  /* El mateix objecte que ha importat perfils.js (una sola volta): només es refan els dobles. */
  Object.assign(m.local, {
    loadTitularPublic: vi.fn(() => null),
    estatTitularPublic: vi.fn(() => ({ titularPublic: false })),
    marcaTitularPublic: vi.fn((_org, valor) => ({ titularPublic: valor }))
  });
});

test('loadTitularPublic · sense sessió, sense id o amb un id que no és cap UUID: null i cap petició', async () => {
  m.user = null;
  expect(await loadTitularPublic(ORG)).toBeNull();
  m.user = { id: 'U' };
  expect(await loadTitularPublic('')).toBeNull();
  expect(await loadTitularPublic('forn-de-la-torre')).toBeNull();
  expect(m.rpc).not.toHaveBeenCalled();
});

test('loadTitularPublic · la fila del servidor, amb la forma del contracte i res més (cap correu ni cap rol)', async () => {
  m.rpc.mockResolvedValue([{ id: PEPA, full_name: 'Pepa Soler', avatar_url: '/fotos/pepa.webp', email: 'pepa@poble.invalid', role: 'owner' }]);
  const titular = await loadTitularPublic(ORG, { signal: new AbortController().signal });
  expect(titular).toEqual({ tipus: 'persona', id: PEPA, nom: 'Pepa Soler', avatar: '/fotos/pepa.webp' });
  expect(m.rpc).toHaveBeenCalledTimes(1);
  const [nom, cos, , opcions] = m.rpc.mock.calls[0];
  expect(nom).toBe('titular_public');
  expect(cos).toEqual({ p_org_id: ORG });
  expect(opcions.signal).toBeInstanceOf(AbortSignal);
});

test('loadTitularPublic · cap fila, una fila sense nom, un 404 (sense la migració) o un 403: null', async () => {
  m.rpc.mockResolvedValue([]);
  expect(await loadTitularPublic(ORG)).toBeNull();
  m.rpc.mockResolvedValue([{ id: PEPA, full_name: '', avatar_url: null }]);
  expect(await loadTitularPublic(ORG)).toBeNull();
  m.rpc.mockRejectedValue(Object.assign(new Error('L’esquema requerit no està aplicat'), { status: 404 }));
  expect(await loadTitularPublic(ORG)).toBeNull();
  m.rpc.mockRejectedValue(ambCodiPg(403, 'permission denied'));
  expect(await loadTitularPublic(ORG)).toBeNull();
});

test('loadTitularPublic · sense xarxa o avortada, es propaga (no és cap «no n’hi ha»)', async () => {
  m.rpc.mockRejectedValue(Object.assign(new Error('Failed to fetch'), { status: 0, codi: CODI_BACKEND_INABASTABLE }));
  await expect(loadTitularPublic(ORG)).rejects.toMatchObject({ status: 0 });
  const control = new AbortController();
  control.abort();
  m.rpc.mockReturnValue(new Promise(() => {}));
  await expect(loadTitularPublic(ORG, { signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
});

test.each(['seed', 'local'])('loadTitularPublic · en %s, localPerfils amb els bloquejos de qui mira, i la forma del contracte', async (dataMode) => {
  m.bloquejos.mockResolvedValue([{ tipus: 'persona', id: 'u-x', nom: null, creatAl: null }]);
  m.local.loadTitularPublic.mockReturnValue({ tipus: 'persona', id: 'u-demo', nom: 'Demo', avatar: '', role: 'owner' });
  expect(await loadTitularPublic('socdepoble', { dataMode })).toEqual({ tipus: 'persona', id: 'u-demo', nom: 'Demo', avatar: '' });
  expect(m.local.loadTitularPublic).toHaveBeenCalledWith('socdepoble', m.user, { bloquejos: [{ tipus: 'persona', id: 'u-x', nom: null, creatAl: null }] });
  expect(m.rpc).not.toHaveBeenCalled();
});

test('la tria · sense sessió SDP-TIT-000 i cap petició; un id que no és UUID, SDP-TIT-001; un valor que no és booleà, SDP-TIT-002', async () => {
  m.user = null;
  await expect(estatTitularPublic(ORG)).rejects.toMatchObject({ code: 'SDP-TIT-000' });
  await expect(marcaTitularPublic(ORG, true)).rejects.toMatchObject({ code: 'SDP-TIT-000' });
  m.user = { id: 'U' };
  await expect(estatTitularPublic('forn')).rejects.toMatchObject({ code: 'SDP-TIT-001' });
  await expect(marcaTitularPublic(ORG, 'sí')).rejects.toMatchObject({ code: 'SDP-TIT-002' });
  await expect(marcaTitularPublic(ORG, null)).rejects.toMatchObject({ code: 'SDP-TIT-002' });
  expect(m.rpc).not.toHaveBeenCalled();
});

test('la tria · les RPC amb p_org_id (i p_public), i el valor que torna el servidor', async () => {
  m.rpc.mockResolvedValueOnce(true);
  expect(await estatTitularPublic(ORG)).toEqual({ titularPublic: true });
  expect(m.rpc).toHaveBeenLastCalledWith('estat_titular_public', { p_org_id: ORG }, {}, { signal: undefined });
  m.rpc.mockResolvedValueOnce(false);
  expect(await marcaTitularPublic(ORG, false)).toEqual({ titularPublic: false });
  expect(m.rpc).toHaveBeenLastCalledWith('marca_titular_public', { p_org_id: ORG, p_public: false }, {}, { signal: undefined });
});

test('la tria · el codi es llig del prefix (SDP-TIT-001 d’una administradora), un 404 és NO-DISPONIBLE, un 401 SDP-TIT-000', async () => {
  m.rpc.mockRejectedValueOnce(ambCodiPg(403, "SDP-TIT-001: només la propietària de l'organització pot triar si es mostra com a titular."));
  await expect(marcaTitularPublic(ORG, true)).rejects.toMatchObject({ code: 'SDP-TIT-001', status: 403 });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('L’esquema requerit no està aplicat'), { status: 404 }));
  await expect(estatTitularPublic(ORG)).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('JWT expired'), { status: 401 }));
  await expect(estatTitularPublic(ORG)).rejects.toMatchObject({ code: 'SDP-TIT-000' });
  /* El text del servidor no arriba mai a la vista: el del contracte. */
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('Supabase 500: boom'), { status: 500 }));
  const error = await estatTitularPublic(ORG).catch((e) => e);
  expect(error).toMatchObject({ code: 'DESCONEGUT' });
  expect(error.message).not.toContain('boom');
});

test.each(['seed', 'local'])('la tria · en %s, localPerfils amb la persona de la sessió', async (dataMode) => {
  expect(await estatTitularPublic('socdepoble', { dataMode })).toEqual({ titularPublic: false });
  expect(await marcaTitularPublic('socdepoble', true, { dataMode })).toEqual({ titularPublic: true });
  expect(m.local.marcaTitularPublic).toHaveBeenCalledWith('socdepoble', true, m.user);
  expect(m.rpc).not.toHaveBeenCalled();
});
