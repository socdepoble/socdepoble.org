import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Auth, runtime, identity, storage and sessionService are real. Only the host,
   backend-port delegation and the synthetic server are test boundaries. */
const m = vi.hoisted(() => ({ auth: null, identity: null, policy: null }));
vi.mock('../../config/runtimePolicy.js', () => ({ getRuntimePolicy: () => m.policy }));
vi.mock('../backendPort.js', () => ({
  getCurrentUser: () => m.identity.usuariDeSessio(), teCapacitat: () => true,
  elMeuRol: (...args) => m.auth.elMeuRol(...args),
  refrescaSessio: (...args) => m.auth.refreshSession(...args),
  logout: (...args) => m.auth.logout(...args),
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
import * as auth from './auth.js';
import * as identity from '../identitat.js';
import { resetClient } from './config.js';
import { configuraRefrescSessio } from './runtime.js';
import { setSessionConfig, sincronitza } from '../sessionService.js';
m.auth = auth; m.identity = identity;
const A = '11111111-2222-4333-8444-555555555555';
const B = '22222222-2222-4333-8444-555555555555';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://fixture.invalid', supabaseAnonKey: 'sb_publishable_fixture', dataMode: 'remote' });
const b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
let nonce = 0;
const token = (sub, seconds = 3600) => `${b64({ alg: 'none' })}.${b64({ sub, iss: CONFIG.supabaseUrl + '/auth/v1', aud: 'authenticated', nonce: ++nonce, exp: Math.floor(Date.now() / 1000) + seconds })}.c2ln`;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const flush = async () => { for (let i = 0; i < 50; i++) await Promise.resolve(); };
let calls, gate, mode, rows, release, renewals;
const pendingWrites = new Set();
function update(...args) {
  const promise = auth.updateProfile(...args);
  pendingWrites.add(promise);
  // Observe cleanup even if an earlier assertion fails; awaiting still rejects.
  promise.finally(() => pendingWrites.delete(promise)).catch(() => {});
  return promise;
}
function enter(id = A, seconds = 3600, metadata = {}) {
  expect(identity.desaSessio({ access_token: token(id, seconds), refresh_token: 'synthetic-refresh', user: { id, user_metadata: metadata } })).toBe(true);
}
const patches = () => calls.filter(c => c.method === 'PATCH');
const writes = () => calls.filter(c => c.method !== 'GET' && c.path !== '/auth/v1/token');
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-24T04:00:00Z'));
  m.policy = { auth: { issuer: CONFIG.supabaseUrl + '/auth/v1', audiences: ['authenticated'], persistencia: 'local' } };
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  identity.configuraBackendSessio(CONFIG); configuraRefrescSessio(auth.refreshSession, auth.refrescSessioEnCurs);
  calls = []; gate = null; mode = 'ok'; renewals = 0;
  rows = new Map([[A, { id: A, username: null, full_name: 'Initial', lema: 'initial' }], [B, { id: B, username: null, full_name: 'Other' }]]);
  enter();
  vi.stubGlobal('fetch', vi.fn(async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== CONFIG.supabaseUrl) throw new Error('No external network in this fixture');
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ path: url.pathname, search: url.search, method, body });
    if (url.pathname === '/auth/v1/token') { renewals++; return json({ access_token: token(A), refresh_token: 'synthetic-rotated', user: { id: A } }); }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (url.pathname === '/rest/v1/user_platform_roles') return json([{ role: 'usuari' }]);
    if (url.pathname === '/auth/v1/user') {
      if (mode === 'metadata-failure') return json({ message: 'synthetic metadata failure' }, 503);
      return json({ id: identity.usuariDeSessio()?.id, user_metadata: body.data });
    }
    if (url.pathname === '/rest/v1/rpc/completa_la_meua_alta') return json({ code: 'PGRST202', message: 'missing RPC' }, 404);
    if (url.pathname !== '/rest/v1/profiles') throw new Error('Unexpected synthetic route');
    const id = url.searchParams.get('id')?.slice(3);
    if (method === 'GET') return json(rows.has(id) ? [rows.get(id)] : []);
    if (method !== 'PATCH') throw new Error('Unexpected profile write');
    if (gate) await gate.promise;
    if (mode === 'offline') throw new TypeError('synthetic offline');
    if (mode === 'denied') return json({ code: '42501', message: 'synthetic forbidden' }, 403);
    if (mode === 'unconfirmed') return json([]);
    if (mode === 'optional' && Object.hasOwn(body, 'hero_video_url')) return json({ code: 'PGRST204', message: "Could not find the 'hero_video_url' column of 'profiles' in the schema cache" }, 400);
    const row = { ...rows.get(id), ...body }; rows.set(id, row); return json([row]);
  }));
});
afterEach(async () => {
  gate?.resolve(); await Promise.allSettled([...pendingWrites]);
  release?.(); release = null;
  identity.esborraSessio({ abast: 'tot' }); sincronitza(); await flush(); resetClient();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); delete document.visibilityState; m.policy = null;
});

test('32 concurrent identical normalized writes share one confirmed PATCH and metadata PUT', async () => {
  gate = deferred();
  const pending = Array.from({ length: 32 }, (_, i) => update(i % 2 ? { icon: '🌱', full_name: 'Anna' } : { full_name: 'Anna', icon: '🌱' }, { ...CONFIG }));
  await flush(); expect(patches()).toHaveLength(1);
  gate.resolve(); const results = await Promise.all(pending);
  expect(results.every(r => r.id === A && r.full_name === 'Anna' && r.icon === '🌱')).toBe(true);
  expect(calls.filter(c => c.path === '/auth/v1/user')).toHaveLength(1);
});

test('a new call after ACK writes again and does not hide an external change', async () => {
  await update({ lema: 'mine' }, CONFIG);
  rows.set(A, { ...rows.get(A), lema: 'external' });
  expect((await update({ lema: 'mine' }, CONFIG)).lema).toBe('mine');
  expect(patches()).toHaveLength(2);
});

test.each(['offline', 'denied', 'unconfirmed'])('concurrent %s failure releases the entry and a fresh retry really writes', async failure => {
  gate = deferred(); mode = failure;
  const pending = [update({ lema: 'retry' }, CONFIG), update({ lema: 'retry' }, CONFIG)];
  const settled = Promise.allSettled(pending);
  await flush(); expect(patches()).toHaveLength(1); gate.resolve();
  expect((await settled).every(r => r.status === 'rejected')).toBe(true);
  mode = 'ok'; gate = null;
  expect((await update({ lema: 'retry' }, CONFIG)).lema).toBe('retry');
  expect(patches()).toHaveLength(2);
});

test('different patches stay independent; sharing never serializes unrelated fields', async () => {
  gate = deferred(); const pending = [update({ lema: 'a' }, CONFIG), update({ lema: 'b' }, CONFIG)];
  await flush(); expect(patches()).toHaveLength(2); gate.resolve(); await Promise.all(pending);
});

test.each([
  ['unknown transport option', () => ({ ...CONFIG, customTransport: true })],
  ['AbortSignal', () => ({ ...CONFIG, signal: new AbortController().signal })],
  ['custom fetch', () => ({ ...CONFIG, fetch: () => undefined })],
  ['accessor option', () => Object.defineProperty({ ...CONFIG }, 'tenantId', { enumerable: true, get: () => null })],
  ['opaque proxy config', () => new Proxy({ ...CONFIG }, { getPrototypeOf() { throw new Error('opaque config'); } })],
])('%s is conservatively not coalesced', async (_, config) => {
  gate = deferred(); const pending = [update({ lema: 'x' }, config()), update({ lema: 'x' }, config())];
  await flush(); expect(patches()).toHaveLength(2); gate.resolve(); await Promise.all(pending);
});

test('different public credentials and a replaced global fetch do not join an earlier request', async () => {
  gate = deferred(); const first = update({ lema: 'x' }, CONFIG);
  const second = update({ lema: 'x' }, { ...CONFIG, supabaseAnonKey: 'sb_publishable_other_fixture' });
  const original = globalThis.fetch;
  vi.stubGlobal('fetch', (...args) => original(...args));
  const third = update({ lema: 'x' }, CONFIG);
  await flush(); expect(patches()).toHaveLength(3); gate.resolve(); await Promise.all([first, second, third]);
});

test.each([A, B])('logout/reentry for %s fences the pending ACK and cannot join it', async id => {
  gate = deferred(); const first = update({ lema: 'x' }, CONFIG);
  const old = first.catch(error => error);
  await flush(); identity.esborraSessio({ abast: 'tot' }); enter(id);
  const second = update({ lema: 'x' }, CONFIG);
  await flush(); expect(patches()).toHaveLength(2); gate.resolve();
  expect((await old).name).toBe('AbortError'); expect((await second).id).toBe(id);
});

test('shared optional-column fallback preserves unacknowledged fields for each caller', async () => {
  gate = deferred(); mode = 'optional';
  const settled = Promise.all([update({ lema: 'x', hero_video_url: 'https://fixture.invalid/video.mp4' }, CONFIG), update({ hero_video_url: 'https://fixture.invalid/video.mp4', lema: 'x' }, CONFIG)]);
  await flush(); expect(patches()).toHaveLength(1); gate.resolve();
  const [a, b] = await settled;
  expect(patches()).toHaveLength(2); expect(a.campsNoDesats).toEqual(['hero_video_url']); expect(b.campsNoDesats).toEqual(['hero_video_url']);
  expect(a).not.toBe(b); a.campsNoDesats.push('local-mutation'); expect(b.campsNoDesats).toEqual(['hero_video_url']);
});

test('the bounded table does not drop writes beyond 32 different pending patches', async () => {
  gate = deferred(); const pending = Array.from({ length: 40 }, (_, i) => update({ lema: 'different-' + i }, CONFIG));
  await flush(); expect(patches()).toHaveLength(40); gate.resolve(); await Promise.all(pending);
  expect((await update({ lema: 'different-0' }, CONFIG)).lema).toBe('different-0'); expect(patches()).toHaveLength(41);
});

test('500 real native resumes/renewals and profile reads make zero profile writes', async () => {
  release = setSessionConfig(CONFIG, Symbol()); await vi.dynamicImportSettled(); await flush();
  for (let i = 0; i < 500; i++) {
    vi.setSystemTime(new Date(Date.now() + 3600_000));
    document.dispatchEvent(new Event('resume')); await flush();
    expect((await auth.getProfile(CONFIG)).id).toBe(A);
  }
  expect(renewals).toBe(500); expect(writes()).toEqual([]);
  expect(calls.filter(c => c.path === '/rest/v1/profiles' && c.method === 'GET')).toHaveLength(500);
});

test('orphan repair failure is limited to one attempt per document and never creates a confirmed row', async () => {
  const orphan = '33333333-2222-4333-8444-555555555555'; enter(orphan);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const first = await auth.getProfile(CONFIG); const second = await auth.getProfile(CONFIG);
  expect(first).toMatchObject({ id: orphan, reserva: true }); expect(second).toMatchObject({ id: orphan, reserva: true });
  expect(calls.filter(c => c.path.endsWith('/completa_la_meua_alta'))).toHaveLength(1);
  expect(patches()).toHaveLength(0); warn.mockRestore();
});


test('metadata failure is not retained as ACK and a new retry repeats both writes', async () => {
  gate = deferred(); mode = 'metadata-failure';
  const settled = Promise.allSettled([update({ full_name: 'Retry metadata' }, CONFIG), update({ full_name: 'Retry metadata' }, CONFIG)]);
  await flush(); expect(patches()).toHaveLength(1); gate.resolve();
  expect((await settled).every(r => r.status === 'rejected')).toBe(true);
  mode = 'ok'; gate = null;
  expect((await update({ full_name: 'Retry metadata' }, CONFIG)).full_name).toBe('Retry metadata');
  expect(patches()).toHaveLength(2); expect(calls.filter(c => c.path === '/auth/v1/user')).toHaveLength(2);
});

test('config is captured before input accessors can mutate the caller object', async () => {
  gate = deferred(); const config = { ...CONFIG };
  const input = Object.defineProperty({}, 'lema', { enumerable: true, get: () => { config.supabaseAnonKey = 'sb_publishable_other_fixture'; return 'snapshot'; } });
  const first = update(input, config);
  const second = update({ lema: 'snapshot' }, CONFIG);
  await flush(); expect(patches()).toHaveLength(1); gate.resolve(); await Promise.all([first, second]);
});

test('normalized duplicate input cannot forward authority fields or another profile id', async () => {
  gate = deferred();
  const settled = Promise.all([update({ lema: 'safe', id: B, role: 'admin', is_admin: true }, CONFIG), update({ lema: 'safe' }, CONFIG)]);
  await flush(); expect(patches()).toHaveLength(1); expect(patches()[0].body).toEqual({ lema: 'safe' });
  gate.resolve(); expect((await settled).every(row => row.id === A)).toBe(true);
  expect(calls.filter(c => c.path === '/auth/v1/user')).toHaveLength(0);
});

test('expired-session callers share the existing real refresh and then one profile write', async () => {
  vi.setSystemTime(new Date(Date.now() + 3600_000)); gate = deferred();
  const settled = Promise.all([update({ lema: 'renewed' }, CONFIG), update({ lema: 'renewed' }, CONFIG)]);
  await flush(); expect(renewals).toBe(1); expect(patches()).toHaveLength(1); gate.resolve();
  expect((await settled).every(row => row.id === A && row.lema === 'renewed')).toBe(true);
});
