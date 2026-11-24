import { afterEach, expect, test, vi } from 'vitest';
import { loadSeccioPage } from './content.js';

afterEach(() => vi.unstubAllGlobals());
const config = { dataMode: 'remote', supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'sb_publishable_r3254_fixture', tenantId: '00000000-0000-4000-8000-000000000001' };
const row = n => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, created_at: '2026-11-23T12:00:00.123456Z', title: 'Pública', public_content: 'Contingut' });

test('R32.54 · runtime.request transporta Content-Range de Response fins al cursor públic', async () => {
  const all = Array.from({ length: 15 }, (_, i) => row(100 - i));
  const calls = [];
  // Doble HTTP al límit fetch. runtime.request i Headers/Response són reals;
  // no es contacta cap projecte Supabase ni cap xarxa externa.
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    const parsed = new URL(url); calls.push(parsed);
    expect(parsed.pathname).toBe('/rest/v1/rpc/llig_mur_public');
    expect(options.headers.Prefer).toBe('count=exact');
    expect(options.headers.Authorization).toBe(`Bearer ${config.supabaseAnonKey}`);
    const cursor = parsed.searchParams.get('p_before_id');
    const matching = all.filter(r => cursor === null || r.id < cursor).slice(0, 50);
    const rows = matching.slice(0, 7);
    return new Response(JSON.stringify(rows), { status: rows.length < matching.length ? 206 : 200,
      headers: { 'Content-Type': 'application/json', 'Content-Range': rows.length ? `0-${rows.length - 1}/${matching.length}` : '*/0' } });
  }));
  let cursor = null; const seen = [];
  for (let page = 0; page < 10; page++) {
    const result = await loadSeccioPage({ seccio: 'mercat', cursor }, config);
    seen.push(...result.elements.map(r => r.id)); cursor = result.nextCursor;
    if (result.complete) break;
  }
  expect(seen).toEqual(all.map(r => r.id));
  expect(calls).toHaveLength(3);
});
