// @vitest-environment-options {"url": "https://gentdelatorre.net/una/pagina?x=1"}
/* v1.2.19 · Gauntlet R1 (L1-01) · R2 amb el runtime de veres. /auth/v1/verify i el PUT /auth/v1/user de
   «Desa» no van en nom de la sessió d'esta pestanya: el principal és el token d'un sol ús i la sessió
   privada de recuperació. Si la sessió d'abans cau mentre són en vol, la resposta no es pot perdre.
   auth.recuperacio.test.js no ho podia vore perquè falseja runtime.js i capturaSessio: ací runtime.js,
   auth.js, identitat.js i recuperacioPendent.js són els de veres, i només es falsegen realtime.js,
   config.js i fetch. La sessió d'abans cau pel camí real (logout amb abast 'pestanya', el `tanca`
   d'una renovació fallida). */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('./realtime.js', () => ({ tancaRealtime: vi.fn(async () => {}) }));
vi.mock('./config.js', () => ({ resetClient: vi.fn() }));
import { definixContrasenyaNova, logout, recullTornadaOAuth } from './auth.js';
import { configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio } from '../identitat.js';
import { ESTAT_ENLLAC, estatEnllacDeRecuperacio, oblidaRecuperacioPendent } from '../recuperacioPendent.js';

const CONFIG = Object.freeze({ supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'sb_publishable_synthetic', dataMode: 'remote' });
const HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c';
const PRIVADA = Object.freeze({ access_token: 'jwt-recuperacio', refresh_token: 'rt-privada', user: { id: '11111111-1111-4111-8111-111111111111', email: 'ana@poble.test' } });
const SESSIO_A = Object.freeze({ access_token: 'jwt-A-abans', refresh_token: 'rt-A', user: { id: '22222222-2222-4222-8222-222222222222', email: 'a@poble.test' } });
const NOVA = 'contrasenya-nova-llarga';
const resposta = (status, body) => ({ ok: status < 400, status, headers: { get: () => null },
  text: async () => (body === undefined ? '' : JSON.stringify(body)), json: async () => body });
/* Les crides de fetch, en ordre: «POST /auth/v1/verify», «PUT /auth/v1/user»… amb l'Authorization. */
let crides;
const servidor = (respon) => vi.fn(async (url, opcions) => {
  const u = new URL(url);
  crides.push({ ruta: `${opcions?.method ?? 'GET'} ${u.pathname}${u.search}`, autoritzacio: opcions?.headers?.Authorization });
  return respon(u.pathname, opcions);
});
const rutes = () => crides.map((c) => c.ruta);
const quantes = (ruta) => rutes().filter((r) => r === ruta).length;

beforeEach(() => {
  crides = [];
  oblidaRecuperacioPendent();
  configuraBackendSessio(CONFIG);
  /* P0-63 · El navegador ja té la sessió d'A quan s'obri l'enllaç. */
  expect(desaSessio(SESSIO_A)).toBe(true);
  expect(usuariDeSessio()?.id).toBe(SESSIO_A.user.id);
  window.history.replaceState(null, '', `/una/pagina?x=1#token_hash=${HASH}&type=recovery`);
});
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/una/pagina?x=1');
  oblidaRecuperacioPendent();
  esborraSessio({ abast: 'tot' });
  sessionStorage.clear();
  localStorage.clear();
});

test('v1.2.19 · Gauntlet R1 (L1-01) · la sessió d’abans cau durant /verify: TORNA_A_DESAR, el token no es crema i el segon «Desa» no torna a verificar', async () => {
  await expect(recullTornadaOAuth(CONFIG)).resolves.toEqual({ recuperacio: true });
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  vi.stubGlobal('fetch', servidor(async (ruta) => {
    if (ruta === '/auth/v1/verify') {
      /* Un servidor de veres: el mateix token, la segona vegada, és otp_expired. */
      if (quantes('POST /auth/v1/verify') > 1) return resposta(403, { code: 403, error_code: 'otp_expired', msg: 'Token has expired or is invalid' });
      await logout(CONFIG, { abast: 'pestanya' });          // la sessió d'abans cau mentre /verify és en vol
      return resposta(200, PRIVADA);
    }
    if (ruta === '/auth/v1/user') return resposta(200, { id: PRIVADA.user.id, email: PRIVADA.user.email });
    if (ruta === '/auth/v1/logout') return resposta(204);
    return resposta(200, []);
  }));
  const primer = await definixContrasenyaNova(NOVA, CONFIG).catch((e) => e);
  expect(primer.name).not.toBe('AbortError');
  expect(primer.message).toMatch(/ha canviat mentre es desava.*l’enllaç encara val/);
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
  expect(usuariDeSessio()).toBeNull();
  await expect(definixContrasenyaNova(NOVA, CONFIG)).resolves.toBe(true);
  expect(quantes('POST /auth/v1/verify')).toBe(1);           // cap segon /verify
  expect(quantes('PUT /auth/v1/user')).toBe(1);
  expect(crides.find((c) => c.ruta === 'PUT /auth/v1/user').autoritzacio).toBe(`Bearer ${PRIVADA.access_token}`);
  expect(rutes().filter((r) => r.startsWith('POST /auth/v1/logout'))).toEqual([]);   // la privada és ara la sessió
  expect(usuariDeSessio()?.id).toBe(PRIVADA.user.id);
  expect(estatEnllacDeRecuperacio()).toBeNull();
});

test('v1.2.19 · Gauntlet R1 (L1-01) · la sessió d’abans cau durant el PUT: DESADA_SESSIO_CANVIADA, la privada es revoca i el segon «Desa» no repetix el PUT', async () => {
  await expect(recullTornadaOAuth(CONFIG)).resolves.toEqual({ recuperacio: true });
  vi.stubGlobal('fetch', servidor(async (ruta) => {
    if (ruta === '/auth/v1/verify') return resposta(200, PRIVADA);
    if (ruta === '/auth/v1/user') {
      /* La contrasenya ja és la nova: un segon PUT seria same_password. */
      if (quantes('PUT /auth/v1/user') > 1) return resposta(422, { code: 422, error_code: 'same_password', msg: 'New password should be different from the old password.' });
      await logout(CONFIG, { abast: 'pestanya' });          // la sessió d'abans cau mentre el PUT és en vol
      return resposta(200, { id: PRIVADA.user.id, email: PRIVADA.user.email });
    }
    if (ruta === '/auth/v1/logout') return resposta(204);
    return resposta(200, []);
  }));
  const primer = await definixContrasenyaNova(NOVA, CONFIG).catch((e) => e);
  expect(primer.name).not.toBe('AbortError');
  expect(primer.message).toMatch(/ja està desada.*ha canviat mentre es desava.*contrasenya nova/);
  const segon = await definixContrasenyaNova(NOVA, CONFIG).catch((e) => e);
  expect(segon.message).toBe(primer.message);               // el mateix avís, sense xarxa: mai same_password
  expect(quantes('POST /auth/v1/verify')).toBe(1);
  expect(quantes('PUT /auth/v1/user')).toBe(1);
  /* La sessió privada es revoca al servidor (millor esforç), amb la seua Authorization. */
  const revocacions = crides.filter((c) => c.ruta === 'POST /auth/v1/logout?scope=local');
  expect(revocacions).toEqual([{ ruta: 'POST /auth/v1/logout?scope=local', autoritzacio: `Bearer ${PRIVADA.access_token}` }]);
  expect(usuariDeSessio()).toBeNull();
  expect(estatEnllacDeRecuperacio()).toBe(ESTAT_ENLLAC.PENDENT);
});
