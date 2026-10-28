/* P1-68 (pla 261028_1526, §3.8.2.3; decisió del Mestre 261028: «RPC pròpia
   i camp separat») · updateProfile({ username }) desa l'identificador per la
   RPC desa_el_meu_usuari (2610282100), mai pel PATCH ni a user_metadata; la
   forma es mira abans de cap xarxa; els errors porten el `code` de
   MISSATGES_USERNAME pel prefix SDP-USER; ocupat torna la proposta; en seed i
   local, localPerfils. CAMPS_PERFIL no canvia (perfilUpdatePropi.migracio.test.js). */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: { id: 'A' }, request: vi.fn(), rpc: vi.fn(), changed: vi.fn() }));
vi.mock('../../config/storage.js', () => ({ getEfimer: () => null }));
vi.mock('../recuperacioPendent.js', () => ({
  ESTAT_ENLLAC: Object.freeze({ PENDENT: 'pendent', PERDUT: 'perdut' }),
  marcaRecuperacioPendent: vi.fn(), oblidaRecuperacioPendent: vi.fn(),
  anunciaEnllacDeRecuperacio: vi.fn(), oblidaEnllacDeRecuperacio: vi.fn(),
  estatEnllacDeRecuperacio: () => null, escoltaRecuperacioPendent: () => () => {}
}));
vi.mock('../identitat.js', () => ({
  configuraBackendSessio: vi.fn(), esBackendDeSessio: () => true, jwtPerBackend: () => null,
  CLAU_REFRESC: 'refresh', CLAU_JWT: 'jwt', CLAU_ORIGEN: 'origen', versioSessio: 0,
  triaRefresc: () => null, rotaRegistre: vi.fn(), oblidaRegistre: vi.fn(), desaSessio: () => true,
  capturaSessio: () => () => {}, esborraSessio: vi.fn(), usuariDeSessio: () => m.user, actualitzaUsuariSessio: m.changed,
  caducitatJwt: () => null, MARGE_RENOVACIO_MS: 60_000
}));
vi.mock('../oauthRelay.js', () => ({
  entraAmbGoogle: vi.fn(), gestionaTornada: vi.fn(), exigeixSenseMarcAlie: vi.fn(),
  urlDeTornadaAlta: vi.fn(() => null), urlDeTornadaRecuperacio: vi.fn(() => null), recullMarcaDeRecuperacio: vi.fn(() => null)
}));
vi.mock('./runtime.js', () => ({
  configuraRefrescSessio: vi.fn(), getCurrentUser: () => m.user,
  getResolvedConfig: (config) => ({ supabaseUrl: 'https://example.test', supabaseAnonKey: 'public', runtimeDataMode: config.dataMode || 'remote', ...config }),
  request: m.request, rpc: m.rpc
}));
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { updateProfile } from './auth.js';
import { MISSATGES_USERNAME } from '../../sections/onboarding/onboardingModel.js';

const ARA = '2026-10-28T21:00:00.000Z';

beforeEach(() => {
  m.request.mockReset(); m.rpc.mockReset(); m.changed.mockReset();
  m.user = { id: 'A', user_metadata: { full_name: 'Anna Pérez Soler' } };
});

test('l’identificador va normalitzat a desa_el_meu_usuari, sense PATCH ni GoTrue', async () => {
  m.rpc.mockResolvedValue({ desat: true, usuari: 'anna-perez', confirmat_al: ARA });
  await expect(updateProfile({ username: '@Anna.Pérez' })).resolves.toEqual({ id: 'A', username: 'anna-perez', username_confirmat_at: ARA });
  expect(m.rpc).toHaveBeenCalledWith('desa_el_meu_usuari', { p_usuari: 'anna-perez' }, {});
  expect(m.request).not.toHaveBeenCalled();
  expect(m.changed).not.toHaveBeenCalled();
});

test('una forma dolenta es rebutja abans de cap xarxa (SDP-USER-001)', async () => {
  await expect(updateProfile({ username: 'a' })).rejects.toMatchObject({ code: 'SDP-USER-001', message: MISSATGES_USERNAME['SDP-USER-001'] });
  await expect(updateProfile({ username: '@@' })).rejects.toMatchObject({ code: 'SDP-USER-001' });
  expect(m.rpc).not.toHaveBeenCalled();
});

test('ocupat: l’error porta la proposta del servidor', async () => {
  m.rpc.mockResolvedValue([{ desat: false, motiu: 'ocupat', proposta: 'annaperez-2' }]);
  const error = await updateProfile({ username: 'annaperez' }).catch((e) => e);
  expect(error).toMatchObject({ code: 'ocupat', proposta: 'annaperez-2' });
  expect(error.message).toContain('@annaperez-2');
});

test('els codis del servidor pel prefix SDP-USER, mai per l’estat HTTP; sense la RPC, NO-DISPONIBLE', async () => {
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('Supabase 400: {"message":"SDP-USER-003: has provat massa identificadors seguits."}'), { status: 400 }));
  await expect(updateProfile({ username: 'annaperez' })).rejects.toMatchObject({ code: 'SDP-USER-003', message: MISSATGES_USERNAME['SDP-USER-003'] });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('Supabase 403: {"message":"SDP-USER-002: eixe identificador està reservat."}'), { status: 403 }));
  await expect(updateProfile({ username: 'consola' })).rejects.toMatchObject({ code: 'SDP-USER-002' });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('L\'esquema requerit no està aplicat (falta "desa_el_meu_usuari").'), { status: 404 }));
  await expect(updateProfile({ username: 'annaperez' })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  m.rpc.mockRejectedValueOnce(Object.assign(new Error('Supabase 500: res'), { status: 500 }));
  await expect(updateProfile({ username: 'annaperez' })).rejects.toMatchObject({ code: 'DESCONEGUT' });
});

test('sense sessió no es demana res (SDP-USER-000)', async () => {
  m.user = null;
  await expect(updateProfile({ username: 'annaperez' })).rejects.toMatchObject({ code: 'SDP-USER-000' });
  expect(m.rpc).not.toHaveBeenCalled();
});

test('amb altres camps: la RPC i, després, el PATCH de sempre, sense username', async () => {
  m.rpc.mockResolvedValue({ desat: true, usuari: 'annaperez', confirmat_al: ARA });
  m.request.mockImplementation(async (ruta, _config, opcions) => (opcions?.method === 'PATCH' ? [{ id: 'A', lema: 'Hola' }] : {}));
  await expect(updateProfile({ username: 'annaperez', lema: 'Hola' })).resolves.toMatchObject({ id: 'A', lema: 'Hola', username: 'annaperez' });
  const patch = m.request.mock.calls.find(([, , opcions]) => opcions?.method === 'PATCH');
  expect(patch[2].body).toEqual({ lema: 'Hola' });
});

test('en seed, localPerfils fa de servidor amb les mateixes regles', async () => {
  const usuari = { id: 'local-anna', user_metadata: { full_name: 'Anna Pérez Soler' } };
  m.user = usuari;
  await expect(updateProfile({ username: 'Anna Local' }, { dataMode: 'seed' })).resolves.toMatchObject({ id: 'local-anna', username: 'anna-local' });
  await expect(updateProfile({ username: 'consola' }, { dataMode: 'seed' })).rejects.toMatchObject({ code: 'SDP-USER-002' });
  expect(m.rpc).not.toHaveBeenCalled();
});
