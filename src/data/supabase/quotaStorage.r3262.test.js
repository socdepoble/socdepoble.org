import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { quotaXat } from './xatMultimedia.js';
import { llistaElsMeusMitjans } from './storage.js';
import { resetClient } from './config.js';
const uid = '62000000-0000-4000-8000-000000000001', tenantId = '62000000-0000-4000-8000-000000000002';
const config = { dataMode: 'remote', tenantId, supabaseUrl: 'https://fixture.invalid', supabaseAnonKey: 'sb_publishable_fixture' };
let response;
beforeEach(() => {
  configuraBackendSessio(config); desaSessio({ access_token: 'c9-token-sintetic', user: { id: uid } });
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    expect(String(url).startsWith('https://fixture.invalid/')).toBe(true);
    return new Response(JSON.stringify(typeof response === 'function' ? response(url, options) : response), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }));
});
afterEach(() => { resetClient(); esborraSessio(); vi.unstubAllGlobals(); });
test.each([null, false, true, [], [0], '', ' ', '01', '1e2', '0x10', '1.0', '-0', -1, 1.5, Number.MAX_SAFE_INTEGER + 1].map(value => [value]))('real quota transport refuses noncanonical/unsafe used bytes: %j', async usats => {
  response = { usats, limit: 250000000 };
  await expect(quotaXat(config)).rejects.toMatchObject({ code: 'sense-capacitat' });
  expect(fetch).toHaveBeenCalledOnce(); expect(String(fetch.mock.calls[0][0])).toContain('/rest/v1/rpc/xat_quota');
});
test.each([0, 42, '0', '42', String(Number.MAX_SAFE_INTEGER)])('real quota transport preserves exact accepted bytes: %s', async usats => {
  response = { usats, limit: '250000000', pendents: [] };
  await expect(quotaXat(config)).resolves.toEqual({ usats: Number(usats), limit: 250000000, pendents: [] });
  expect(fetch).toHaveBeenCalledOnce();
});
test('pending quota rows require primitive UUIDs and retain numeric byte bounds', async () => {
  response = { usats: 64, limit: 20000000, pendents: [{ id: [uid], bytes: 64 }, { id: uid, bytes: 64 }, { id: uid, bytes: '64' }, { id: uid, bytes: 2 ** 53 }] };
  await expect(quotaXat(config)).resolves.toMatchObject({ pendents: [{ id: uid, bytes: 64 }] });
});
test.each([[2 ** 53, 2 ** 53, null], [Number.MAX_SAFE_INTEGER, null, Number.MAX_SAFE_INTEGER], [true, 64, 64], ['64', '64', null]])('real Storage SDK list projects only safe byte sizes %j', async (size, contentLength, expected) => {
  const root = `${tenantId}/${uid}`;
  response = (url, options) => {
    expect(String(url)).toContain('/storage/v1/object/list/mitjans');
    const body = JSON.parse(options.body);
    if (body.prefix === root) return [{ id: null, name: 'avatars', metadata: null }];
    if (body.prefix === `${root}/avatars`) return [{ id: 'file-sintetic', name: 'foto.webp', metadata: { mimetype: 'image/webp', size, contentLength } }];
    return [];
  };
  const rows = await llistaElsMeusMitjans(config);
  expect(rows).toHaveLength(1); expect(rows[0].mida).toBe(expected); expect(fetch).toHaveBeenCalled();
});
