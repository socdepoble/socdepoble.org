import { afterEach, expect, test, vi } from 'vitest';
import { RealtimeClient } from '@supabase/realtime-js';
import { getClient, resetClient, clientActual } from './config.js';
import { tancaRealtime } from './realtime.js';
import { logout, emetCanvi } from './auth.js';
import { configuraBackendSessio, desaSessio, esborraSessio, usuariDeSessio } from '../identitat.js';

const CONFIG = { dataMode: 'remote', supabaseUrl: 'https://lifecycle.invalid', supabaseAnonKey: 'sb_publishable_lifecycle' };
const flush = async () => { for (let n = 0; n < 20; n++) await Promise.resolve(); };
let client;
afterEach(async () => { vi.restoreAllMocks(); await client?.removeAllChannels(); resetClient(); client = null; esborraSessio({ abast: 'tot' }); emetCanvi(null); vi.unstubAllGlobals(); });

test('real SDK channel teardown must finish before tancaRealtime resolves', async () => {
  client = await getClient(CONFIG); const channel = client.channel('lifecycle:pending');
  const teardown = vi.spyOn(channel, 'teardown');
  let release; const barrier = new Promise(resolve => { release = resolve; });
  vi.spyOn(channel, 'unsubscribe').mockReturnValue(barrier);
  let closed = false; const closing = tancaRealtime().then(() => { closed = true; });
  try { await flush(); expect(teardown).not.toHaveBeenCalled(); expect(closed).toBe(false); }
  finally { release('ok'); await closing; await flush(); }
  expect(teardown).toHaveBeenCalledTimes(1);
});
test('an asynchronous SDK cleanup rejection is consumed by the close operation', async () => {
  client = await getClient(CONFIG); const channel = client.channel('lifecycle:reject'), failure = new Error('Synthetic unsubscribe failure');
  vi.spyOn(channel, 'unsubscribe').mockRejectedValue(failure);
  // Keep the red calibration from becoming an unhandled-rejection runner failure.
  // The real SDK implementation still runs; this observer does not change its result.
  const realClose = client.removeAllChannels.bind(client);
  vi.spyOn(client, 'removeAllChannels').mockImplementation(() => { const promise = realClose(); promise.catch(() => {}); return promise; });
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await expect(tancaRealtime()).resolves.toBeUndefined(); await flush();
  expect(warning).toHaveBeenCalledWith('Error tancant realtime', failure);
});
test('closing without a published client creates no client and no transport', async () => {
  resetClient(); const fetch = vi.fn(() => { throw Error('Unexpected transport'); }); vi.stubGlobal('fetch', fetch);
  try { await expect(tancaRealtime()).resolves.toBeUndefined(); expect(fetch).not.toHaveBeenCalled(); }
  finally { vi.unstubAllGlobals(); }
});
test('two concurrent closes share one actual SDK unsubscribe until completion', async () => {
  client = await getClient(CONFIG); const channel = client.channel('lifecycle:shared');
  let release; const barrier = new Promise(resolve => { release = resolve; });
  const unsubscribe = vi.spyOn(channel, 'unsubscribe').mockReturnValue(barrier);
  const first = tancaRealtime(), second = tancaRealtime();
  try { await flush(); expect(unsubscribe).toHaveBeenCalledTimes(1); }
  finally { release('ok'); await Promise.all([first, second]); }
});
test('synchronous reset during a pending close shares the SDK teardown and cannot close the replacement client', async () => {
  client = await getClient(CONFIG); const previous = client, channel = client.channel('lifecycle:reset');
  let release; const barrier = new Promise(resolve => { release = resolve; });
  const unsubscribe = vi.spyOn(channel, 'unsubscribe').mockReturnValue(barrier);
  const closing = tancaRealtime(); await flush(); resetClient();
  const replacement = await getClient(CONFIG); client = replacement;
  try { expect(replacement).not.toBe(previous); expect(unsubscribe).toHaveBeenCalledTimes(1); }
  finally { release('ok'); await closing; await flush(); }
  expect(await getClient(CONFIG)).toBe(replacement);
});
test('a synchronous SDK cleanup throw is contained and a later explicit close can retry', async () => {
  client = await getClient(CONFIG); const failure = new Error('Synthetic close throw');
  const close = vi.spyOn(client, 'removeAllChannels').mockImplementationOnce(() => { throw failure; }).mockResolvedValue([]);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await tancaRealtime(); expect(warning).toHaveBeenCalledWith('Error tancant realtime', failure);
  await tancaRealtime(); expect(close).toHaveBeenCalledTimes(2);
});
test.each(['another-account', 'same-account-reentry'])('logout closing A preserves the newer %s client and session', async replacement => {
  const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
  const login = id => {
    const b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${b64({ alg: 'none' })}.${b64({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, iss: CONFIG.supabaseUrl + '/auth/v1', nonce: crypto.randomUUID() })}.c2ln`;
    expect(desaSessio({ access_token: jwt, refresh_token: 'synthetic-refresh', user: { id } })).toBe(true); emetCanvi({ id });
  };
  configuraBackendSessio(CONFIG); login(A); client = await getClient(CONFIG); const previous = client;
  const channel = client.channel('lifecycle:logout'); let release; const barrier = new Promise(resolve => { release = resolve; });
  const unsubscribe = vi.spyOn(channel, 'unsubscribe').mockReturnValue(barrier);
  vi.stubGlobal('fetch', vi.fn(async url => { expect(new URL(url).pathname).toBe('/auth/v1/logout'); return new Response(null, { status: 204 }); }));
  const events = [], listener = event => events.push(event.detail?.user?.id ?? null); window.addEventListener('sdp:auth-change', listener);
  const closing = logout(CONFIG); await flush(); const nextActor = replacement === 'another-account' ? B : A;
  login(nextActor); client = await getClient(CONFIG); const nextClient = client;
  try { expect(nextClient).not.toBe(previous); expect(unsubscribe).toHaveBeenCalledTimes(1); }
  finally { release('ok'); await closing; await flush(); window.removeEventListener('sdp:auth-change', listener); }
  expect(usuariDeSessio()?.id).toBe(nextActor); expect(clientActual() === nextClient).toBe(true);
  expect(events.at(-1)).toBe(nextActor);
});
test('exact same JWT on a new entry invalidates the cached SDK client while keeping the new one usable', async () => {
  const id = '11111111-1111-4111-8111-111111111111', b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${b64({ alg: 'none' })}.${b64({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, iss: CONFIG.supabaseUrl + '/auth/v1' })}.c2ln`;
  const enter = () => { expect(desaSessio({ access_token: jwt, refresh_token: 'synthetic-refresh', user: { id } })).toBe(true); emetCanvi({ id }); };
  configuraBackendSessio(CONFIG); enter(); const previous = await getClient(CONFIG);
  esborraSessio({ abast: 'tot' }); enter(); client = await getClient(CONFIG);
  expect(client !== previous).toBe(true);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ ok: true }]), { headers: { 'Content-Type': 'application/json' } })));
  expect((await previous.rpc('lifecycle_read')).error).not.toBeNull();
  expect((await client.rpc('lifecycle_read')).error).toBeNull(); expect(fetch).toHaveBeenCalledTimes(1);
});
test('a late real SDK factory from an older entry cannot publish over a newer client', async () => {
  const id = '11111111-1111-4111-8111-111111111111', b64 = value => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${b64({ alg: 'none' })}.${b64({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, iss: CONFIG.supabaseUrl + '/auth/v1' })}.c2ln`;
  const enter = () => { expect(desaSessio({ access_token: jwt, refresh_token: 'synthetic-refresh', user: { id } })).toBe(true); emetCanvi({ id }); };
  let release; const barrier = new Promise(resolve => { release = resolve; });
  const actual = RealtimeClient.prototype.setAuth;
  vi.spyOn(RealtimeClient.prototype, 'setAuth').mockImplementationOnce(async function (token) { await barrier; return actual.call(this, token); });
  configuraBackendSessio(CONFIG); enter();
  const first = getClient(CONFIG).then(value => ({ value }), error => ({ error }));
  await flush(); esborraSessio({ abast: 'tot' }); enter();
  let second;
  try { second = await getClient(CONFIG); client = second; }
  finally { release(); }
  const result = await first;
  expect(result.error?.message).toContain('cal reintentar'); expect(clientActual() === second).toBe(true);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ ok: true }]), { headers: { 'Content-Type': 'application/json' } })));
  expect((await second.rpc('lifecycle_read')).error).toBeNull(); expect(fetch).toHaveBeenCalledTimes(1);
});
