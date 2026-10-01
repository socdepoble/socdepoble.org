import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio, jwtPerBackend, usuariDeSessio, CLAU_PERSISTENT } from '../identitat.js';
import { request } from './runtime.js';
import { refreshSession, logout } from './auth.js';
import { setRuntimePolicy } from '../../config/runtimePolicy.js';
import { getVal } from '../../config/storage.js';

setRuntimePolicy({ auth: { issuer: 'https://a.example.test', persistencia: 'local' } });
const A = { supabaseUrl: 'https://a.example.test', supabaseAnonKey: 'sb_publishable_synthetic', tenantId: '00000000-0000-4000-8000-000000000000' };
const B = { ...A, supabaseUrl: 'https://b.example.test' };
const session = { access_token: 'synthetic-jwt-a', refresh_token: 'synthetic-refresh-a', user: { id: '11111111-2222-4333-8444-555555555555' } };
const enter = () => { configuraBackendSessio(A); desaSessio(session); };
afterEach(() => { esborraSessio({ abast: 'tot' }); localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); });

test.each([B, { ...A, tenantId: '00000000-0000-4000-8000-000000000002' }])('JWT and refresh never cross a backend or tenant boundary: %j', async target => {
  enter();
  const fetch = vi.fn(async () => ({ ok: true, status: 204 })); vi.stubGlobal('fetch', fetch);
  expect(jwtPerBackend(A)).toBe(session.access_token);
  await request('/rest/v1/profiles', target);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${A.supabaseAnonKey}`);
  expect(await refreshSession(target)).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(1);
  await logout(target);
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('changing backend clears identity and refuses the previous persistent credential', () => {
  enter();
  expect(getVal(CLAU_PERSISTENT).backend).toContain('a.example.test');
  configuraBackendSessio(B);
  expect(usuariDeSessio()).toBeNull();
  expect(getVal(CLAU_PERSISTENT, null)).toBeNull();
  expect(jwtPerBackend(B)).toBeNull();
  configuraBackendSessio(A);
  expect(jwtPerBackend(A)).toBeNull();
});

test('a late refresh from A cannot restore credentials after switching to B', async () => {
  enter();
  let resolve;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(r => { resolve = r; })));
  const pending = refreshSession(A);
  configuraBackendSessio(B);
  resolve({ ok: true, json: async () => ({ ...session, refresh_token: 'rotated-a' }) });
  expect(await pending).toBe(false);
  expect(usuariDeSessio()).toBeNull();
  expect(getVal(CLAU_PERSISTENT, null)).toBeNull();
});
