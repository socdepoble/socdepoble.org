import { afterEach, expect, test, vi } from 'vitest';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
vi.mock('../identitat.js', async original => ({ ...(await original()), usuariDeSessio: () => ({ id: A }), jwtPerBackend: () => 'fixture-opaque-jwt' }));
import { estatXifratXat } from './xatXifrat.js';
afterEach(() => vi.unstubAllGlobals());
const config = { dataMode: 'remote', supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_r3254_fixture', tenantId: '00000000-0000-4000-8000-000000000001', ambMembres: true };

test.each([1, 12])('R32.54 · cost API E2EE conservat i explícit amb %i fils: 1 RPC + N GET', async count => {
  const fils = Array.from({ length: count }, (_, i) => `dddddddd-3333-4333-8333-${String(i).padStart(12, '0')}`);
  const calls = [];
  // Prova de caracterització, no un corrector: batching de rosters implica
  // completitud i autoritat E2EE. La crida productiva actual usa un únic fil.
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    const parsed = new URL(url); calls.push(parsed);
    if (parsed.pathname === '/rest/v1/rpc/xat_estat_xifrat') {
      expect(JSON.parse(options.body).p_fils).toEqual(fils);
      return new Response(JSON.stringify(fils.map(fil_id => ({ fil_id, epoca: 0 }))));
    }
    expect(parsed.pathname).toBe('/rest/v1/xat_participants');
    expect(fils).toContain(parsed.searchParams.get('fil_id').slice(3));
    expect(parsed.searchParams.get('visible_fins_seq')).toBe('is.null');
    return new Response(JSON.stringify([{ usuari_id: A, rol: 'propietari', com_org_id: null }]));
  }));
  expect(await estatXifratXat(fils, config)).toHaveLength(count);
  expect(calls.filter(url => url.pathname.includes('/rpc/'))).toHaveLength(1);
  expect(calls.filter(url => url.pathname === '/rest/v1/xat_participants')).toHaveLength(count);
});
