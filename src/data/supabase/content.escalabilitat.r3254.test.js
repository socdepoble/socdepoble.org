import { beforeEach, expect, test, vi } from 'vitest';

const remote = vi.hoisted(() => ({ rows: [], range: null, calls: [] }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '00000000-0000-4000-8000-000000000001', runtimeDataMode: 'remote' }),
  request: vi.fn(async (url, _config, options = {}) => {
    remote.calls.push({ url, options });
    options.onResponseMetadata?.({ contentRange: remote.range });
    return structuredClone(remote.rows);
  }),
  buildSeedAppData: vi.fn(), generateUUID: vi.fn(), getCurrentUser: () => null, mapContentRowsToData: vi.fn()
}));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
import { loadSeccioPage } from './content.js';

const row = n => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, created_at: '2026-11-23T12:00:00.123456Z', title: 'Pública', public_content: 'Contingut' });
beforeEach(() => { remote.rows = []; remote.range = null; remote.calls = []; });

test('R32.54 · max-rows curt de PostgREST no amaga la cua de Mur/Mercat', async () => {
  for (const seccio of ['mur', 'mercat', 'events']) {
    remote.rows = Array.from({ length: 10 }, (_, i) => row(100 - i));
    remote.range = '0-9/50';
    const page = await loadSeccioPage({ seccio, limit: 50 });
    expect(page.complete).toBe(false);
    expect(JSON.parse(page.nextCursor).at(-1)).toBe(row(91).id);
    expect(remote.calls.at(-1).options.headers).toEqual({ Prefer: 'count=exact' });
  }
});

test('R32.54 · sense rang confirmat continua fins a pàgina buida', async () => {
  remote.rows = [row(3)];
  expect(await loadSeccioPage({ seccio: 'mur' })).toMatchObject({ complete: false });
  remote.rows = [];
  expect(await loadSeccioPage({ seccio: 'mur' })).toEqual({ elements: [], complete: true, nextCursor: null });
});

test('R32.54 · rang curt acreditat acaba; rang d’una RPC SQL plena no acaba', async () => {
  remote.rows = [row(3)]; remote.range = '0-0/1';
  expect(await loadSeccioPage({ seccio: 'mur' })).toMatchObject({ complete: true });
  expect(await loadSeccioPage({ seccio: 'mur', limit: 1 })).toMatchObject({ complete: false });
});

test('R32.54 · cursor conserva els microsegons també amb un any llunyà vàlid', async () => {
  remote.rows = [
    { ...row(1), created_at: '9999-11-23T12:00:00.123456Z' },
    { ...row(2), created_at: '9999-11-23T12:00:00.123455Z' }
  ];
  remote.range = '0-1/2';
  const page = await loadSeccioPage({ seccio: 'mur', limit: 2 });
  expect(page.elements).toHaveLength(2);
  expect(JSON.parse(page.nextCursor)[2]).toBe('9999-11-23T12:00:00.123455Z');
});

test('R32.54 · recorre 2.005 files empatades amb max-rows 7, sense repeticions ni N+1', async () => {
  const { request } = await import('./runtime.js');
  const all = Array.from({ length: 2005 }, (_, i) => row(3000 - i));
  request.mockImplementation(async (url, _config, options) => {
    remote.calls.push({ url, options });
    const params = new URL(url, 'http://local').searchParams;
    const cursor = params.get('p_before_id');
    const matching = all.filter(r => cursor === null || r.id < cursor).slice(0, 50);
    const slice = matching.slice(0, 7);
    options.onResponseMetadata?.({ contentRange: slice.length ? `0-${slice.length - 1}/${matching.length}` : '*/0' });
    return slice;
  });
  let cursor = null; const seen = [];
  for (let pages = 0; pages < 400; pages++) {
    const page = await loadSeccioPage({ seccio: 'mercat', cursor });
    seen.push(...page.elements.map(r => r.id)); cursor = page.nextCursor;
    if (page.complete) break;
  }
  expect(seen).toEqual(all.map(r => r.id));
  expect(remote.calls).toHaveLength(Math.ceil(all.length / 7));
});
