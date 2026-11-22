/* v1.2.19 · fusió · Codex R32.31: la prova viu dins de src/data/supabase/ perquè exercita l'adaptador real
   (Porta Enxufe E1: només els mòduls de l'adaptador importen src/data/supabase/index.js). */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { creaTransportCrdtRuralRemot } from '../crdtRuralRemot.js';
import { preparaSincronitzacioCrdtRural, estatCrdtRuralBuit, canviaCrdtRural } from '../crdtRural.js';
import { setBackendImplementation } from '../backendPort.js';
import * as supabase from './index.js';

const A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const CONFIG = { dataMode: 'remote', supabaseUrl: 'https://bridge-r3231.example.test',
  supabaseAnonKey: 'sb_publishable_synthetic', tenantId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' };
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
const enter = (id = A, options, config = CONFIG) => {
  configuraBackendSessio(config);
  expect(desaSessio({ access_token: `fixture-${id}-${options?.renovacio ? 'renewed' : 'entry'}`, user: { id } }, options)).toBe(true);
};
const capture = () => preparaSincronitzacioCrdtRural(canviaCrdtRural(estatCrdtRuralBuit(), {
  id: 'note-A', replica: 'A', comptador: 1, nota: { title: 'Private fixture A', content: 'Private capture A' }
}), 'fixture-capture-A');
const response = p => new Response(JSON.stringify({ requestId: p.requestId, sha256: p.sha256,
  frontera: p.frontera, confirmatEl: '2026-11-21T20:00:00.000Z', ack_remot_confirmat: true }),
{ headers: { 'Content-Type': 'application/json' } });
const bridge = (config = CONFIG) => creaTransportCrdtRuralRemot({ autoritat: CONFIG.supabaseUrl, config });
const changes = {
  'A→B': () => { esborraSessio({ abast: 'tot' }); enter(B); },
  logout: () => { esborraSessio({ abast: 'tot' }); },
  'nova entrada A': () => { esborraSessio({ abast: 'tot' }); enter(); },
  'backend de sessió': () => { configuraBackendSessio({ ...CONFIG, supabaseUrl: 'https://other-r3231.example.test' }); }
};
beforeEach(() => {
  esborraSessio({ abast: 'tot' }); localStorage.clear(); sessionStorage.clear();
  setBackendImplementation({ ...supabase }); enter();
});
afterEach(() => {
  esborraSessio({ abast: 'tot' }); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals();
});

for (const [name, change] of Object.entries(changes)) {
  test(`import real: ${name} revoca la intenció abans de delegar`, async () => {
    const p = capture(), fetch = vi.fn(async () => response(p)); vi.stubGlobal('fetch', fetch);
    // Calling an async function reaches its real import() synchronously, then
    // yields even when the imported module is already cached: no timed sleep.
    const pending = bridge().envia(p).then(value => ({ value }), error => ({ error }));
    change();
    const outcome = await pending;
    expect(fetch.mock.calls.map(([, options]) => options.headers.Authorization)).toEqual([]);
    expect(outcome).toMatchObject({ error: { name: 'AbortError' } });
  });
  test(`ACK en vol: ${name} no retorna una confirmació revocada`, async () => {
    const p = capture(), entered = deferred(), release = deferred();
    const fetch = vi.fn(async () => { entered.resolve(); await release.promise; return response(p); });
    vi.stubGlobal('fetch', fetch);
    const pending = bridge().envia(p);
    await entered.promise;
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer fixture-${A}-entry`);
    change(); release.resolve();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
}

test('renovació de la mateixa entrada conserva la petició i usa el token nou', async () => {
  const p = capture(), fetch = vi.fn(async () => response(p)); vi.stubGlobal('fetch', fetch);
  const pending = bridge().envia(p);
  enter(A, { renovacio: true });
  await expect(pending).resolves.toMatchObject({ requestId: p.requestId, ack_remot_confirmat: true });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer fixture-${A}-renewed`);
});

test('configuració i senyal propis queden capturats abans de l’import', async () => {
  const p = capture(), controller = new AbortController(), replaced = new AbortController();
  const config = { ...CONFIG }, options = { signal: controller.signal };
  const fetch = vi.fn(async () => response(p)); vi.stubGlobal('fetch', fetch);
  const transport = bridge(config), pending = transport.envia(p, options);
  config.supabaseUrl = 'https://changed-r3231.example.test'; config.supabaseAnonKey = 'sb_publishable_changed';
  options.signal = replaced.signal; controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled(); expect(replaced.signal.aborted).toBe(false);
});

test('còpia de configuració no envia la càrrega a un destí mutat', async () => {
  const p = capture(), config = { ...CONFIG }, fetch = vi.fn(async () => response(p)); vi.stubGlobal('fetch', fetch);
  const transport = bridge(config); config.supabaseUrl = 'https://changed-r3231.example.test';
  await transport.envia(p);
  expect(fetch.mock.calls[0][0]).toBe(`${CONFIG.supabaseUrl}/rest/v1/rpc/confirma_captura_crdt_rural`);
  expect(JSON.parse(fetch.mock.calls[0][1].body).p_capture).toContain('Private capture A');
});

test('senyal ja avortat i autoritat incompatible rebutgen abans de cap transport', async () => {
  const p = capture(), controller = new AbortController(), fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  controller.abort();
  await expect(bridge().envia(p, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(bridge({ ...CONFIG, backend_url: 'https://other-r3231.example.test' }).envia(p))
    .rejects.toMatchObject({ code: 'RURAL_CRDT_ACK_INVALID' });
  expect(fetch).not.toHaveBeenCalled();
});

test('senyal de configuració es conserva si la crida no el substituïx', async () => {
  const p = capture(), controller = new AbortController(), fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const pending = bridge({ ...CONFIG, signal: controller.signal }).envia(p); controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); expect(fetch).not.toHaveBeenCalled();
});

test('substituir el backend públic durant RPC invalida l’ACK anterior', async () => {
  const p = capture(), entered = deferred(), release = deferred();
  vi.stubGlobal('fetch', vi.fn(async () => { entered.resolve(); await release.promise; return response(p); }));
  const pending = bridge().envia(p); await entered.promise;
  setBackendImplementation({ ...supabase }); release.resolve();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
});

test('cancel·lació durant RPC no retorna un ACK després de la barrera', async () => {
  const p = capture(), controller = new AbortController(), entered = deferred(), release = deferred();
  vi.stubGlobal('fetch', vi.fn(async () => { entered.resolve(); await release.promise; return response(p); }));
  const pending = bridge().envia(p, { signal: controller.signal }); await entered.promise;
  controller.abort(); release.resolve();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
});

test('import fred real rebutja el llinatge revocat abans de consultar el port', async () => {
  vi.resetModules();
  const identity = await import('../identitat.js');
  const { creaTransportCrdtRuralRemot: coldBridge } = await import('../crdtRuralRemot.js');
  identity.configuraBackendSessio(CONFIG);
  expect(identity.desaSessio({ access_token: 'fixture-cold-A', user: { id: A } })).toBe(true);
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const pending = coldBridge({ autoritat: CONFIG.supabaseUrl, config: CONFIG }).envia(capture());
  identity.esborraSessio({ abast: 'tot' });
  expect(identity.desaSessio({ access_token: 'fixture-cold-B', user: { id: B } })).toBe(true);
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
  identity.esborraSessio({ abast: 'tot' });
});
