import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { getProfile } from './auth.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const CONFIG = Object.freeze({ dataMode: 'remote', supabaseUrl: 'https://autopsy.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const barrera = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
const entra = (id = A, renovacio = false) => {
  configuraBackendSessio(CONFIG);
  expect(desaSessio({ access_token: `token-${id}`, user: { id, user_metadata: { full_name: 'Nom de fixture A', town_name: 'Tibi' } } }, { renovacio })).toBe(true);
};
const revoca = (canvi, original = A) => {
  esborraSessio({ abast: 'tot' });
  if (canvi !== 'eixida') entra(canvi === 'B' ? B : original);
};
afterEach(() => {
  esborraSessio({ abast: 'tot' });
  sessionStorage.clear(); localStorage.clear();
  vi.unstubAllGlobals(); vi.restoreAllMocks();
});

for (const canvi of ['B', 'eixida', 'nova entrada A']) {
  test(`R32.31 · getProfile no torna la reserva antiga després de ${canvi}`, async () => {
    entra();
    const dins = barrera(), cos = barrera();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetch = vi.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, json: () => { dins.resolve(); return cos.promise; } }));
    vi.stubGlobal('fetch', fetch);
    const lectura = getProfile(CONFIG);
    const resultat = lectura.then(value => ({ value }), error => ({ error }));
    await dins.promise;
    revoca(canvi);
    cos.resolve([{ id: A, username: 'fixture-a', bio: 'bio privada A' }]);
    expect(await resultat).toMatchObject({ error: { name: 'AbortError' } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}

for (const [index, canvi] of ['B', 'eixida', 'nova entrada A'].entries()) {
  test(`R32.31 · reparació del poble en vol no torna la fila anterior després de ${canvi}`, async () => {
    const id = `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb${index}`;
    entra(id);
    const dins = barrera(), cos = barrera();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fila = { id, full_name: 'Nom A', bio: 'bio privada A', town_name: '' };
    const fetch = vi.fn(async (_url, options) => options.method === 'PATCH'
      ? { ok: true, status: 200, headers: { get: () => null }, json: () => { dins.resolve(); return cos.promise; } }
      : { ok: true, status: 200, headers: { get: () => null }, json: async () => [fila] });
    vi.stubGlobal('fetch', fetch);
    const lectura = getProfile(CONFIG);
    const resultat = lectura.then(value => ({ value }), error => ({ error }));
    await dins.promise;
    revoca(canvi, id);
    cos.resolve([{ ...fila, town_name: 'Tibi' }]);
    expect(await resultat).toMatchObject({ error: { name: 'AbortError' } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
}

test('R32.31 · la renovació del mateix llinatge conserva la fila confirmada', async () => {
  entra();
  const dins = barrera(), cos = barrera();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, json: () => { dins.resolve(); return cos.promise; } })));
  const lectura = getProfile(CONFIG);
  await dins.promise;
  entra(A, true);
  const fila = { id: A, username: 'fixture-a', full_name: 'Nom A', bio: 'bio privada A' };
  cos.resolve([fila]);
  await expect(lectura).resolves.toEqual(fila);
});

test('R32.31 · una fallada de xarxa amb sessió vigent conserva la reserva explícita', async () => {
  entra();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Network fixture unavailable'); }));
  await expect(getProfile(CONFIG)).resolves.toMatchObject({ reserva: true, id: A, full_name: 'Nom de fixture A', town_name: 'Tibi' });
});

for (const status of [404, 503]) {
  test(`R32.31 · HTTP ${status} amb sessió vigent conserva la reserva explícita`, async () => {
    entra();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status, text: async () => '{}' })));
    await expect(getProfile(CONFIG)).resolves.toMatchObject({ reserva: true, id: A });
  });
}

test('R32.31 · fila absent i RPC absent conserven la reserva de la sessió vigent', async () => {
  const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbba';
  entra(id);
  const fetch = vi.fn(async url => url.includes('/rpc/')
    ? { ok: false, status: 404, text: async () => '{"code":"PGRST202"}' }
    : { ok: true, status: 200, headers: { get: () => null }, json: async () => [] });
  vi.stubGlobal('fetch', fetch);
  await expect(getProfile(CONFIG)).resolves.toMatchObject({ reserva: true, id });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('R32.31 · una reparació d’alta pendent no rellegeix amb la sessió que entra després', async () => {
  const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  entra(id);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const dins = barrera(), cos = barrera();
  const fetch = vi.fn(async url => url.includes('/rpc/')
    ? { ok: true, status: 200, headers: { get: () => null }, json: () => { dins.resolve(); return cos.promise; } }
    : { ok: true, status: 200, headers: { get: () => null }, json: async () => [] });
  vi.stubGlobal('fetch', fetch);
  const lectura = getProfile(CONFIG).then(value => ({ value }), error => ({ error }));
  await dins.promise;
  revoca('B');
  cos.resolve({ poble_nou: false });
  expect(await lectura).toMatchObject({ error: { name: 'AbortError' } });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('R32.31 · un PATCH que falla amb la mateixa sessió conserva la fila confirmada', async () => {
  const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbc';
  entra(id);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const fila = { id, full_name: 'Nom A', town_name: '', bio: 'bio privada A' };
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'PATCH'
    ? { ok: false, status: 503, text: async () => '{}' }
    : { ok: true, status: 200, headers: { get: () => null }, json: async () => [fila] }));
  await expect(getProfile(CONFIG)).resolves.toEqual(fila);
});

test('R32.31 · renovar el mateix llinatge durant el PATCH conserva el poble confirmat', async () => {
  const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbd';
  entra(id);
  const dins = barrera(), cos = barrera();
  const fila = { id, full_name: 'Nom A', town_name: '', bio: 'bio privada A' };
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => options.method === 'PATCH'
    ? { ok: true, status: 200, headers: { get: () => null }, json: () => { dins.resolve(); return cos.promise; } }
    : { ok: true, status: 200, headers: { get: () => null }, json: async () => [fila] }));
  const lectura = getProfile(CONFIG);
  await dins.promise;
  entra(id, true);
  cos.resolve([{ ...fila, town_name: 'Tibi' }]);
  await expect(lectura).resolves.toEqual({ ...fila, town_name: 'Tibi' });
});

for (const dataMode of ['seed', 'local']) {
  for (const canvi of ['B', 'nova entrada A']) {
    test(`R32.31 · la càrrega diferida del perfil ${dataMode} no torna l’entrada revocada per ${canvi}`, async () => {
      entra();
      const fetch = vi.fn(() => { throw new Error('La lectura local no pot fer xarxa.'); });
      vi.stubGlobal('fetch', fetch);
      // import() sempre cedeix; la revocació ocorre abans de resoldre’l, sense rellotges.
      const lectura = getProfile({ ...CONFIG, dataMode }).then(value => ({ value }), error => ({ error }));
      revoca(canvi);
      expect(await lectura).toMatchObject({ error: { name: 'AbortError' } });
      expect(fetch).not.toHaveBeenCalled();
    });
  }
}
