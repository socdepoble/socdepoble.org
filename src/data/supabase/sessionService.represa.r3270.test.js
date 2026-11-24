import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Custom auth/runtime/identity and the installed Supabase SDK are real. Only
   the backend port delegates and fetch is a synthetic server, never a socket. */
const m = vi.hoisted(() => ({ auth: null, identity: null, policy: null }));
vi.mock("../../config/runtimePolicy.js", () => ({ getRuntimePolicy: () => m.policy }));
vi.mock("../backendPort.js", () => ({
  getCurrentUser: () => m.identity.usuariDeSessio(), teCapacitat: () => true,
  elMeuRol: (...args) => m.auth.elMeuRol(...args),
  refrescaSessio: (...args) => m.auth.refreshSession(...args),
  logout: (...args) => m.auth.logout(...args),
  enviaMissatge: vi.fn(), loadFils: vi.fn(async () => []),
}));
vi.mock("../../host.js", () => ({ quanLlest: async () => undefined }));
import * as auth from "./auth.js";
import * as identity from "../identitat.js";
import { getClient, resetClient } from "./config.js";
import { configuraRefrescSessio } from "./runtime.js";
import { setSessionConfig, sincronitza } from "../sessionService.js";
import { getVal } from "../../config/storage.js";
import { backendScope } from "../../config/backendConfig.js";
import { enviaMissatge as enviaReal } from "./xat.js";
import { creaServeiXat } from "../xat/serveiXat.js";
import { creaCuaSincronitzacioRural, construeixAmbitCuaRural } from "../xat/estatSincronitzacioRural.js";
m.auth = auth; m.identity = identity;

const A = '11111111-2222-4333-8444-555555555555';
const B = '22222222-2222-4333-8444-555555555555';
const ISS = 'https://fixture.invalid/auth/v1';
const CONFIG = Object.freeze({ backendId: 'supabase', supabaseUrl: 'https://fixture.invalid', supabaseAnonKey: 'sb_publishable_fixture', dataMode: 'remote' });
const b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
let nonce = 0;
const jwt = (seconds, sub = A) => `${b64({ alg: 'none' })}.${b64({ sub, iss: ISS, aud: 'authenticated', nonce: ++nonce, exp: Math.floor(Date.now() / 1000) + seconds })}.c2ln`;
const flush = async () => { for (let i = 0; i < 35; i++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
let release, cached, initial, renewals, rejected, gate, mode, rpcCalls, writes, tokens, delayRpcMs;
function enter(sub = A, seconds = 300) {
  const token = jwt(seconds, sub); tokens.set(token, { sub, until: Date.now() + seconds * 1000 });
  expect(identity.desaSessio({ access_token: token, refresh_token: `synthetic-${sub}`, user: { id: sub } })).toBe(true);
  return token;
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-24T00:00:00Z'));
  m.policy = { auth: { issuer: ISS, audiences: ['authenticated'], persistencia: 'local' } };
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  identity.configuraBackendSessio(CONFIG); configuraRefrescSessio(auth.refreshSession, auth.refrescSessioEnCurs);
  renewals = 0; rejected = 0; gate = null; mode = 'success'; rpcCalls = []; writes = new Set(); tokens = new Map(); delayRpcMs = 0;
  initial = enter();
  vi.stubGlobal('fetch', vi.fn(async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin !== CONFIG.supabaseUrl) throw new Error('Synthetic server refuses external origin');
    if (url.pathname === '/auth/v1/token') {
      renewals++;
      if (gate) await gate.promise;
      if (mode === 'network') throw new TypeError('synthetic offline');
      if (mode === 'denied') return json({ error: 'invalid_refresh_token' }, 401);
      const token = jwt(3600); tokens.set(token, { sub: A, until: Date.now() + 3600000 });
      return json({ access_token: token, refresh_token: 'synthetic-rotated', user: { id: A } });
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    if (url.pathname.startsWith('/rest/v1/rpc/') && delayRpcMs) { vi.setSystemTime(new Date(Date.now() + delayRpcMs)); delayRpcMs = 0; }
    const headers = new Headers(options.headers || input.headers);
    const authorization = headers.get('Authorization');
    const token = authorization?.replace(/^Bearer /, '');
    const known = tokens.get(token);
    if (known && known.until <= Date.now()) { rejected++; return json({ code: 'PGRST301', message: 'JWT expired' }, 401); }
    if (url.pathname === '/rest/v1/user_platform_roles') return json([{ role: 'usuari' }]);
    if (!url.pathname.startsWith('/rest/v1/rpc/')) throw new Error('Unexpected synthetic route');
    const body = options.body ? JSON.parse(options.body) : null;
    rpcCalls.push({ route: url.pathname, authorization, body });
    if (url.pathname.endsWith('/synthetic_write')) writes.add(body.operationId);
    if (url.pathname.endsWith('/xat_envia')) { writes.add(body.p_id); return json([{ id: body.p_id, seq: 11 }]); }
    return json([{ id: 'synthetic-read' }]);
  }));
});
afterEach(async () => {
  gate?.resolve(); release?.(); release = null;
  identity.esborraSessio({ abast: 'tot' }); sincronitza(); await flush(); resetClient();
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); delete document.visibilityState; m.policy = null;
  configuraRefrescSessio(auth.refreshSession, auth.refrescSessioEnCurs);
});
async function suspend(seconds = 3600) {
  release = setSessionConfig(CONFIG, Symbol()); await vi.dynamicImportSettled(); await flush();
  cached = await getClient(CONFIG);
  vi.setSystemTime(new Date(Date.now() + seconds * 1000));
}
const read = client => client.rpc('synthetic_read');

test('native resume refreshes without visibilitychange, including a still-hidden document', async () => {
  await suspend();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  document.dispatchEvent(new Event('resume')); await flush();
  expect(renewals).toBe(1);
  expect((await read(await getClient(CONFIG))).error).toBeNull();
  expect(rejected).toBe(0);
});

test('control: visible foreground uses the same real refresh and SDK', async () => {
  await suspend(); document.dispatchEvent(new Event('visibilitychange')); await flush();
  expect((await read(await getClient(CONFIG))).error).toBeNull();
  expect(renewals).toBe(1); expect(rejected).toBe(0);
});

test('resume, visibility, online and five cached-client RPCs share the pending refresh', async () => {
  await suspend(); gate = deferred();
  document.dispatchEvent(new Event('resume')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('online'));
  const pending = Array.from({ length: 5 }, () => read(cached));
  const settled = Promise.all(pending); await flush();
  expect(renewals).toBe(1); expect(rpcCalls).toHaveLength(0); expect(rejected).toBe(0);
  gate.resolve(); const results = await settled;
  expect(results.every(r => r.error === null)).toBe(true);
  expect(rpcCalls).toHaveLength(5); expect(renewals).toBe(1);
  expect(rpcCalls.every(r => r.authorization !== `Bearer ${initial}`)).toBe(true);
});

test('getClient for an expired JWT waits before publishing another SDK client', async () => {
  await suspend(); gate = deferred(); let ready = false;
  const pending = getClient(CONFIG).then(value => { ready = true; return value; });
  await flush(); expect(ready).toBe(false); expect(renewals).toBe(1);
  gate.resolve(); expect((await read(await pending)).error).toBeNull(); expect(rejected).toBe(0);
});

for (const change of ['logout', 'account-switch', 'same-account-reentry']) test(`old client cannot fetch after ${change} during refresh`, async () => {
  await suspend(); gate = deferred();
  const pending = read(cached); const result = Promise.resolve(pending); await flush(); expect(renewals).toBe(1);
  if (change === 'logout') await auth.logout(CONFIG);
  else {
    identity.esborraSessio({ abast: 'tot' }); enter(change === 'account-switch' ? B : A, 3600);
    auth.emetCanvi(identity.usuariDeSessio());
  }
  gate.resolve(); const outcome = await result; await flush();
  expect(outcome.error).not.toBeNull(); expect(rpcCalls).toHaveLength(0); expect(writes.size).toBe(0);
  expect(identity.usuariDeSessio()?.id ?? null).toBe(change === 'logout' ? null : change === 'account-switch' ? B : A);
});

test('a cached authenticated client is fenced even after logout completes before the RPC', async () => {
  cached = await getClient(CONFIG); await auth.logout(CONFIG);
  const outcome = await cached.rpc('synthetic_write', { operationId: 'must-not-run' });
  expect(outcome.error).not.toBeNull(); expect(rpcCalls).toHaveLength(0); expect(writes.size).toBe(0);
});

for (const failure of ['network', 'denied']) test(`failed ${failure} refresh does not send or replay a queued SDK mutation`, async () => {
  cached = await getClient(CONFIG); vi.setSystemTime(new Date(Date.now() + 3600000)); mode = failure;
  const outcome = await cached.rpc('synthetic_write', { operationId: 'not-confirmed' });
  expect(outcome.error).not.toBeNull(); expect(renewals).toBe(1); expect(rpcCalls).toHaveLength(0); expect(writes.size).toBe(0);
  expect(failure === 'network' ? getVal(identity.CLAU_PERSISTENT, null) : null).toEqual(failure === 'network' ? expect.objectContaining({ sub: A }) : null);
});

test('a valid near-expiry JWT does not call a refresh callback that would return false', async () => {
  vi.setSystemTime(new Date(Date.now() + 270000)); const refresh = vi.fn(async () => false); configuraRefrescSessio(refresh);
  const client = await getClient(CONFIG); expect((await read(client)).error).toBeNull();
  expect(refresh).not.toHaveBeenCalled(); expect(renewals).toBe(0); expect(rejected).toBe(0);
});

test('anonymous clients never refresh or borrow a later login', async () => {
  identity.esborraSessio({ abast: 'tot' }); const anonymous = await getClient(CONFIG);
  expect((await read(anonymous)).error).toBeNull(); enter(B, 3600); auth.emetCanvi(identity.usuariDeSessio());
  expect((await read(anonymous)).error).toBeNull(); expect(renewals).toBe(0);
  expect(rpcCalls.every(r => !tokens.has(r.authorization?.replace(/^Bearer /, '')))).toBe(true);
});

test('one successful SDK mutation has exactly one transport and one synthetic server effect', async () => {
  await suspend(); const result = await cached.rpc('synthetic_write', { operationId: 'single-operation' });
  expect(result.error).toBeNull(); expect(renewals).toBe(1); expect(rpcCalls).toHaveLength(1); expect(writes.size).toBe(1); expect(rejected).toBe(0);
});

test.each([3600, 280])('resume overlap after %ss drains the real Outbox and Xat provider once with the same message UUID', async seconds => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const fil = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await suspend(seconds); gate = deferred(); document.dispatchEvent(new Event('resume')); await flush();
  if (seconds === 280) delayRpcMs = 30000;
  const ambit = construeixAmbitCuaRural({ backend: backendScope(CONFIG), tenantId: null, usuariId: A, actorOrgId: null });
  const queue = creaCuaSincronitzacioRural({ ambitInicial: ambit });
  await queue.encua({ filId: fil, client_msg_id: id, text: 'One queued message' });
  const service = creaServeiXat({ enviaMissatge: enviaReal, refreshSession: auth.refreshSession });
  try {
    const send = (f, payload) => service.enviaMissatge(f, payload, CONFIG);
    const first = queue.drenaPendents(send), overlap = queue.drenaPendents(send);
    await flush(); expect(rpcCalls).toHaveLength(0); gate.resolve();
    const [result] = await Promise.all([first, overlap]);
    expect(result).toHaveLength(1); expect(result[0].ok).toBe(true);
    expect(queue.llistaMissatges()[0]).toMatchObject({ client_msg_id: id, estat: 'enviat_servidor', seq: 11 });
    expect(rpcCalls.filter(r => r.route.endsWith('/xat_envia'))).toHaveLength(1);
    expect(rpcCalls.find(r => r.route.endsWith('/xat_envia')).body.p_id).toBe(id);
    expect(writes.size).toBe(1); expect(rejected).toBe(0); expect(renewals).toBe(1);
  } finally { gate.resolve(); service.tanca(); }
});

test('a valid twenty-second JWT waits for the proactive refresh already in flight before a delayed SDK transport', async () => {
  await suspend(280); gate = deferred(); document.dispatchEvent(new Event('visibilitychange')); await flush();
  expect(renewals).toBe(1); delayRpcMs = 30000; let settled = false;
  const pending = read(cached).then(result => { settled = true; return result; });
  try { await flush(); expect(settled).toBe(false); expect(rejected).toBe(0); }
  finally { gate.resolve(); await pending; await flush(); }
});

for (const activeGetter of [null, undefined]) test(`optional active getter ${activeGetter} preserves the single-callback API`, async () => {
  vi.setSystemTime(new Date(Date.now() + 280000));
  const refresh = vi.fn(async () => false); configuraRefrescSessio(refresh, activeGetter);
  expect((await read(await getClient(CONFIG))).error).toBeNull();
  expect(refresh).not.toHaveBeenCalled(); expect(rejected).toBe(0);
});

test('an already pending refresh resolving false does not invalidate a still-valid JWT', async () => {
  vi.setSystemTime(new Date(Date.now() + 280000));
  const refresh = vi.fn(async () => false), active = deferred();
  configuraRefrescSessio(refresh, () => active.promise); cached = await getClient(CONFIG);
  const pending = read(cached); const outcome = Promise.resolve(pending); await flush(); active.resolve(false);
  expect((await outcome).error).toBeNull(); expect(refresh).not.toHaveBeenCalled(); expect(rejected).toBe(0);
});

test('a rejected existing refresh is consumed and prevents SDK transport', async () => {
  cached = await getClient(CONFIG); let reject; const active = new Promise((_, fail) => { reject = fail; });
  const refresh = vi.fn(); configuraRefrescSessio(refresh, () => active);
  const outcome = Promise.resolve(read(cached)); await flush(); reject(new Error('synthetic refresh failure'));
  expect((await outcome).error).not.toBeNull(); expect(rpcCalls).toHaveLength(0); expect(refresh).not.toHaveBeenCalled();
});

test('the read-only active-refresh getter is scoped by epoch, origin and public key', async () => {
  gate = deferred(); const pending = auth.refreshSession(CONFIG);
  expect(auth.refrescSessioEnCurs(CONFIG)).toBe(pending);
  expect(auth.refrescSessioEnCurs({ ...CONFIG, supabaseAnonKey: 'sb_publishable_other' })).toBeNull();
  expect(auth.refrescSessioEnCurs({ ...CONFIG, supabaseUrl: 'https://other.invalid' })).toBeNull();
  identity.esborraSessio({ abast: 'tot' }); auth.emetCanvi(null);
  expect(auth.refrescSessioEnCurs(CONFIG)).toBeNull(); gate.resolve();
  expect(await pending).toBe(false); expect(identity.usuariDeSessio()).toBeNull();
});
