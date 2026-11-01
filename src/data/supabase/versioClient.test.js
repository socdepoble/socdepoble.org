import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* P0-23 (BOT-A2; Gauntlet Claude 261025_1705; rebasat 261101) · L'adaptador Supabase de la
   versió mínima de l'app nativa (capacitat 'versioClient'): la RPC de
   2611011510 amb la capçalera de sempre (runtime.rpc, sense sessió), cap
   petició fora d'iOS i Android ni sense servidor, la coacció del cos (només un
   enter ≥ 1 i un enllaç https), null sense la migració, el topall de 5 s i la resta
   d'errors tal qual, perquè qui pregunta decidisca (fail-open). El servidor és un fetch de
   mentida: la clau i l'origen són sintètics. */
import { versioMinimaClient } from './versioClient.js';
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';

const ORIGEN = 'https://paquet.supabase.test';
const CLAU = 'sb_publishable_de_proves';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: ORIGEN, supabaseAnonKey: CLAU });
const PLAY = 'https://play.google.com/store/apps/details?id=org.socdepoble.app';
const resposta = (cos, status = 200) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: () => null },
  json: async () => structuredClone(cos),
  text: async () => (cos === null ? '' : JSON.stringify(cos))
});
const servidor = vi.fn();

beforeEach(() => {
  servidor.mockReset();
  servidor.mockResolvedValue(resposta({ versio_minima: 2, enllac: PLAY }));
  vi.stubGlobal('fetch', servidor);
});
afterEach(() => { vi.unstubAllGlobals(); });

test('una plataforma que no és nativa, o sense servidor (seed, local, sense URL): null i cap petició', async () => {
  for (const plataforma of ['web', '', null, undefined, 'IOS', 'wordpress']) {
    expect(await versioMinimaClient(plataforma, REMOT), String(plataforma)).toBeNull();
  }
  expect(await versioMinimaClient('ios', { ...REMOT, dataMode: 'seed' })).toBeNull();
  expect(await versioMinimaClient('android', { ...REMOT, dataMode: 'local' })).toBeNull();
  expect(await versioMinimaClient('android', { dataMode: 'remote' })).toBeNull();
  expect(await versioMinimaClient('android')).toBeNull();
  expect(servidor).not.toHaveBeenCalled();
});

test('la RPC de 2611011510: POST amb p_plataforma, la clau pública i la forma del contracte', async () => {
  expect(await versioMinimaClient('android', REMOT)).toEqual({ versioMinima: 2, enllac: PLAY });
  expect(servidor).toHaveBeenCalledTimes(1);
  const [url, opcions] = servidor.mock.calls[0];
  expect(url).toBe(`${ORIGEN}/rest/v1/rpc/versio_minima_client`);
  expect(opcions.method).toBe('POST');
  expect(JSON.parse(opcions.body)).toEqual({ p_plataforma: 'android' });
  expect(opcions.headers.apikey).toBe(CLAU);
  expect(opcions.redirect).toBe('error');
  servidor.mockResolvedValue(resposta({ versio_minima: 3, enllac: null }));
  expect(await versioMinimaClient('ios', REMOT)).toEqual({ versioMinima: 3, enllac: null });
  expect(JSON.parse(servidor.mock.calls[1][1].body)).toEqual({ p_plataforma: 'ios' });
});

test('coacció del cos: un mínim que no és enter ≥ 1 no és cap mínim, i un enllaç que no és https no és cap enllaç', async () => {
  for (const cos of [null, 2, [], {}, { versio_minima: '2' }, { versio_minima: 0 }, { versio_minima: -1 }, { versio_minima: 2.5 },
    { versio_minima: Number.MAX_SAFE_INTEGER + 1 }, { versio_minima: null, enllac: PLAY }]) {
    servidor.mockResolvedValueOnce(resposta(cos));
    expect(await versioMinimaClient('android', REMOT), JSON.stringify(cos)).toBeNull();
  }
  for (const enllac of ['javascript:alert(1)', 'http://play.google.com/x', 'https://', 'https://play.google.com/a b', { href: PLAY }, 7, `https://${'a'.repeat(2048)}`]) {
    servidor.mockResolvedValueOnce(resposta({ versio_minima: 4, enllac }));
    expect(await versioMinimaClient('android', REMOT), JSON.stringify(enllac)).toEqual({ versioMinima: 4, enllac: null });
  }
  /* Els espais dels extrems es lleven, i cap camp de més no passa. */
  servidor.mockResolvedValueOnce(resposta({ versio_minima: 4, enllac: ` ${PLAY} `, plataforma: 'android', missatge: 'hola' }));
  expect(await versioMinimaClient('android', REMOT)).toEqual({ versioMinima: 4, enllac: PLAY });
});

test('sense la migració (404 o PGRST202): null; un 5xx o la xarxa caiguda: es rebutja tal qual', async () => {
  servidor.mockResolvedValueOnce(resposta({ code: 'PGRST202', message: 'Could not find the function public.versio_minima_client(p_plataforma)' }, 404));
  expect(await versioMinimaClient('ios', REMOT)).toBeNull();
  servidor.mockResolvedValueOnce(resposta({ message: 'error intern' }, 500));
  await expect(versioMinimaClient('ios', REMOT)).rejects.toMatchObject({ status: 500 });
  servidor.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(versioMinimaClient('ios', REMOT)).rejects.toMatchObject({ status: 0, codi: CODI_BACKEND_INABASTABLE });
});

test('una petició penjada es talla als 5 s (TOPALL_VERSIO_MS), no als 12 s de runtime.request', async () => {
  vi.useFakeTimers();
  try {
    /* Un servidor que no respon mai: només el senyal del topall acaba la petició, com un fetch de debò. */
    servidor.mockImplementation((_url, { signal }) => new Promise((_resol, rebutja) => {
      signal.addEventListener('abort', () => rebutja(new DOMException('Avortada', 'AbortError')));
    }));
    let resultat = 'pendent';
    /* Sense esperar la promesa: amb un topall més llarg quedaria penjada, i la prova ha de fallar ací, no per temps. */
    versioMinimaClient('android', REMOT).then(() => { resultat = 'resolta'; }, (error) => { resultat = error; });
    await vi.advanceTimersByTimeAsync(4999);
    expect(resultat).toBe('pendent');
    await vi.advanceTimersByTimeAsync(1);
    expect(resultat).toMatchObject({ name: 'TimeoutError' });
    expect(servidor).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});
