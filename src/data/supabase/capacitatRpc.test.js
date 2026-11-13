import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ store: new Map(), epoch: 0, entrada: 0 }));
vi.mock('../../config/publicCredentials.js', () => ({ validatePublicCredentials: () => {} }));
vi.mock('../../utils/sanitize.js', () => ({ permetOrigenMitjans: () => {} }));
vi.mock('../appSeed.js', () => ({ APP_SEED: {}, APP_SEED_VERSION: 'synthetic', getDefaultUserId: () => 'A' }));
vi.mock('../../config/storage.js', () => ({ getEfimer: (key, fallback = null) => m.store.get(key) ?? fallback }));
vi.mock('../identitat.js', () => ({
  CLAU_USUARI: 'user', usuariDeSessio: () => m.store.get('user') ?? null,
  jwtPerBackend: () => m.store.get('jwt') ?? null,
  get versioSessio() { return m.epoch; },
  capturaSessio: () => {
    const entrada = m.entrada, actor = m.store.get('user')?.id;
    return () => {
      if (entrada !== m.entrada || actor !== m.store.get('user')?.id) throw new DOMException('Sessió canviada.', 'AbortError');
    };
  }
}));

import { configuraRefrescSessio, rpc } from './runtime.js';
import { reiniciaCapacitatsRpc, rpcOpcional } from './capacitatRpc.js';

const CONFIG = { supabaseUrl: 'https://api.example.test', supabaseAnonKey: 'sb_publishable_synthetic',
  tenantId: '11000000-0000-4000-8000-000000000001', dataMode: 'remote' };
const NOM = 'llig_publicadors_registrats';
const COS = { p_tenant_id: CONFIG.tenantId, p_tipus: 'pagina', p_recurs_id: 'fediversity' };
const OPCIONS = { disponible: true };
const resposta = (status, body) => ({ ok: status < 400, status, text: async () => JSON.stringify(body),
  json: async () => body, headers: { get: () => null } });
const absent = () => resposta(404, { code: 'PGRST202', message: 'Funció absent de la memòria de l’esquema.' });
const crida = (cos = COS, config = CONFIG, opcions = OPCIONS) => rpcOpcional(NOM, cos, config, opcions);
const diferida = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

beforeEach(() => {
  reiniciaCapacitatsRpc();
  m.store.clear(); m.epoch++; m.entrada++;
  m.store.set('user', { id: 'actor-A' });
  m.store.set('jwt', 'synthetic-token-A');
});
afterEach(() => {
  reiniciaCapacitatsRpc();
  configuraRefrescSessio(async () => false);
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks();
});

test('la declaració apagada i un senyal ja avortat no fan xarxa ni fingixen una resposta', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  await expect(crida(COS, CONFIG, {})).rejects.toMatchObject({ codi: 'capacitat-no-disponible' });
  const control = new AbortController(); control.abort();
  await expect(crida(COS, CONFIG, { signal: control.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
});

test('quatre consultes concurrents absents compartixen només la sonda i no repetixen POST durant el TTL', async () => {
  const fetch = vi.fn().mockResolvedValue(absent()); vi.stubGlobal('fetch', fetch);
  const resultats = await Promise.allSettled(['fediversity', 'receptes', 'herbari', 'patrimoni'].map(id => crida({ ...COS, p_recurs_id: id })));
  expect(resultats.every(r => r.status === 'rejected' && r.reason.codi === 'capacitat-no-disponible')).toBe(true);
  await expect(crida()).rejects.toMatchObject({ codi: 'capacitat-no-disponible' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('un servidor disponible retorna cada recurs pel seu compte, sense compartir dades entre concurrents', async () => {
  const fetch = vi.fn(async (_url, opcions) => resposta(200, { id: JSON.parse(opcions.body).p_recurs_id }));
  vi.stubGlobal('fetch', fetch);
  const ids = ['fediversity', 'receptes', 'herbari', 'patrimoni'];
  expect(await Promise.all(ids.map(id => crida({ ...COS, p_recurs_id: id })))).toEqual(ids.map(id => ({ id })));
  expect(fetch).toHaveBeenCalledTimes(4);
});

test('la lectura optativa conserva l’autoritat de l’àmbit i no accepta capçaleres alternatives', async () => {
  const fetch = vi.fn().mockResolvedValue(resposta(200, [])); vi.stubGlobal('fetch', fetch);
  await crida(COS, CONFIG, { ...OPCIONS, headers: { Authorization: 'Bearer actor-forjat', apikey: 'clau-forjada' } });
  expect(fetch.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer synthetic-token-A', apikey: CONFIG.supabaseAnonKey });
});

test('el TTL, el rellotge endarrerit, la reconnexió, el relleu i la redescoberta explícita recuperen el servidor', async () => {
  vi.useFakeTimers(); vi.setSystemTime(100_000);
  const fetch = vi.fn().mockResolvedValue(absent()); vi.stubGlobal('fetch', fetch);
  await crida().catch(() => {});
  fetch.mockResolvedValue(resposta(200, ['real']));
  vi.setSystemTime(160_000);
  await expect(crida()).resolves.toEqual(['real']);
  fetch.mockResolvedValue(absent()); await crida().catch(() => {});
  vi.setSystemTime(159_000); fetch.mockResolvedValue(resposta(200, ['clock']));
  await expect(crida()).resolves.toEqual(['clock']);
  for (const reobre of [() => window.dispatchEvent(new Event('online')),
    () => window.dispatchEvent(new Event('sdp:rpc-capacitats-refresca')),
    () => reiniciaCapacitatsRpc()]) {
    fetch.mockResolvedValue(absent()); await crida().catch(() => {});
    fetch.mockResolvedValue(resposta(200, ['reobert'])); reobre();
    await expect(crida()).resolves.toEqual(['reobert']);
  }
  fetch.mockResolvedValue(absent()); await crida().catch(() => {});
  fetch.mockResolvedValue(resposta(200, ['forçat']));
  await expect(crida(COS, CONFIG, { ...OPCIONS, redescobreix: true })).resolves.toEqual(['forçat']);
});

test('URL, clau pública, tenant, actor, versió, rol anònim i signatura no compartixen una absència', async () => {
  const fetch = vi.fn().mockResolvedValue(absent()); vi.stubGlobal('fetch', fetch);
  await crida().catch(() => {});
  fetch.mockResolvedValue(resposta(200, ['altra-capacitat']));
  for (const config of [
    { ...CONFIG, supabaseUrl: 'https://other.example.test' },
    { ...CONFIG, supabaseAnonKey: 'sb_publishable_other' },
    { ...CONFIG, tenantId: '11000000-0000-4000-8000-000000000002' }
  ]) await expect(crida(COS, config)).resolves.toEqual(['altra-capacitat']);
  await expect(crida(COS, CONFIG, { ...OPCIONS, anonim: true })).resolves.toEqual(['altra-capacitat']);
  await expect(crida({ ...COS, p_extra: 1 })).resolves.toEqual(['altra-capacitat']);
  m.epoch++;
  await expect(crida()).resolves.toEqual(['altra-capacitat']);
  m.store.set('user', { id: 'actor-B' });
  await expect(crida()).resolves.toEqual(['altra-capacitat']);
  expect(fetch).toHaveBeenCalledTimes(8);
});

test.each([
  [404, { message: 'Not found' }],
  [404, { code: 'PGRST205', message: 'Taula absent.' }],
  [404, { code: 'XX000', message: 'Text PGRST202 enganyós.' }],
  [403, { code: 'PGRST202', message: 'Prohibit.' }],
  [500, { code: 'XX000', message: 'Error intern.' }]
])('un error inesperat %s no es degrada ni entra a la memòria d’absències (%j)', async (status, body) => {
  const fetch = vi.fn().mockResolvedValue(resposta(status, body)); vi.stubGlobal('fetch', fetch);
  for (let i = 0; i < 2; i++) await expect(crida()).rejects.toMatchObject({ status });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('ni una fallada de xarxa ni una RPC obligatòria participen en la memòria optativa', async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('synthetic offline')); vi.stubGlobal('fetch', fetch);
  for (let i = 0; i < 2; i++) await expect(crida()).rejects.toMatchObject({ status: 0, codi: 'backend-inabastable' });
  fetch.mockResolvedValue(absent());
  await crida().catch(() => {});
  for (let i = 0; i < 2; i++) await expect(rpc(NOM, COS, CONFIG)).rejects.toMatchObject({ status: 404, postgrestCode: 'PGRST202' });
  expect(fetch).toHaveBeenCalledTimes(5);
});

test('una sessió nova anul·la la resposta antiga i una absència tardana no contamina la nova', async () => {
  const antiga = diferida();
  const fetch = vi.fn().mockReturnValueOnce(antiga.promise).mockResolvedValue(resposta(200, ['nova']));
  vi.stubGlobal('fetch', fetch);
  const peticio = crida();
  const comprova = expect(peticio).rejects.toMatchObject({ name: 'AbortError' });
  m.entrada++; m.epoch++;
  antiga.resolve(absent()); await comprova;
  await expect(crida()).resolves.toEqual(['nova']);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('avortar un lector pendent no avorta la sonda d’un altre lector', async () => {
  const primer = diferida();
  const fetch = vi.fn().mockReturnValueOnce(primer.promise); vi.stubGlobal('fetch', fetch);
  const p = crida();
  const control = new AbortController();
  const espera = crida(COS, CONFIG, { ...OPCIONS, signal: control.signal });
  const comprova = expect(espera).rejects.toMatchObject({ name: 'AbortError' });
  control.abort(); await comprova;
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
  primer.resolve(absent());
  await expect(p).rejects.toMatchObject({ codi: 'capacitat-no-disponible' });
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('si s’avorta la sonda, un lector independent encara pot consultar el servidor', async () => {
  const fetch = vi.fn((_url, opcions) => new Promise((_resolve, reject) => {
    opcions.signal.addEventListener('abort', () => reject(new DOMException('Abortat.', 'AbortError')));
  })).mockImplementationOnce((_url, opcions) => new Promise((_resolve, reject) => {
    opcions.signal.addEventListener('abort', () => reject(new DOMException('Abortat.', 'AbortError')));
  })).mockResolvedValueOnce(resposta(200, ['segon']));
  vi.stubGlobal('fetch', fetch);
  const control = new AbortController();
  const primer = crida(COS, CONFIG, { ...OPCIONS, signal: control.signal });
  const comprova = expect(primer).rejects.toMatchObject({ name: 'AbortError' });
  const segon = crida();
  control.abort(); await comprova;
  await expect(segon).resolves.toEqual(['segon']);
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('un canvi de desplegament no deixa que una sonda antiga repose una absència', async () => {
  const antiga = diferida(); const fetch = vi.fn().mockReturnValueOnce(antiga.promise).mockResolvedValue(resposta(200, ['nou']));
  vi.stubGlobal('fetch', fetch);
  const vella = crida(); reiniciaCapacitatsRpc();
  antiga.resolve(absent()); await vella.catch(() => {});
  await expect(crida()).resolves.toEqual(['nou']);
});
