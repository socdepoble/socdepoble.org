/* Àrbitre R11 (R33-L2-01, R33-L2-03) · El Mur amb revisions de llavor, de la
 * lectura (loadMur) a l'escriptura (desaRevisioEditorialAmbServidor →
 * desaRevisioSeed → RPC), amb la forma real de l'element. L'overlay és
 * opcional: cap fila il·legible ni cap fallada de la lectura buida el Mur. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const servidor = vi.hoisted(() => ({ seed: null, version: 2, rpc: vi.fn() }));
vi.mock('./runtime.js', () => ({
  getResolvedConfig: () => ({ hasSupabaseConfig: true, tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', runtimeDataMode: 'remote' }),
  request: vi.fn(async (url) => {
    if (url.includes('seed_revisions')) { if (servidor.seed instanceof Error) throw servidor.seed; return structuredClone(servidor.seed ?? []); }
    if (url.includes('app_content')) return [{ key: 'feedPosts', payload: [{ id: 'manifest-de-poble', title: 'Manifest de Poble', owner_user_id: 'A' }], version: servidor.version }, { key: 'events', payload: [], version: 1 }];
    return [];
  }),
  rpc: (...args) => servidor.rpc(...args),
  buildSeedAppData: vi.fn(async () => ({ feedPosts: [], events: [], marketItems: [] })),
  generateUUID: vi.fn(), getCurrentUser: () => ({ id: 'A' }), mapContentRowsToData: vi.fn()
}));
vi.mock('./xat.js', () => ({ enviaMissatge: vi.fn() }));
vi.mock('../backendPort.js', () => ({
  teCapacitat: cap => ['revisionsLlavor', 'edicioEditorial'].includes(cap),
  desaRevisioSeed: async (...args) => (await import('./seedRevisions.js')).desaRevisioSeed(...args),
  adminActualitzaPublicacioEditorial: vi.fn()
}));
import { loadMur } from './content.js';
import { _reiniciaRevisionsEditorialsPerAProves, desaRevisioEditorialAmbServidor } from '../revisionsEditorials.js';
const config = { backendId: 'supabase', backendUrl: 'https://backend.example', tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', dataMode: 'remote' };
const manifest = feedPosts => feedPosts.find(item => item.id === 'manifest-de-poble');
let warn;
beforeEach(() => { servidor.seed = null; servidor.version = 2; servidor.rpc.mockReset(); _reiniciaRevisionsEditorialsPerAProves(); warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

test('R33-L2-03 · an unreadable row, a 500 or a timeout serve the canonical Mur instead of emptying it', async () => {
  servidor.seed = [{ section: 'mur', seed_id: 'manifest-de-poble', payload: { title: '😀'.repeat(4000) }, version: 1, source_version: 2 }];
  expect(manifest((await loadMur('U', {})).feedPosts)).toMatchObject({ title: 'Manifest de Poble', _seedFontVersio: 2 });
  for (const error of [Object.assign(new Error('Supabase 500: boom'), { status: 500 }), Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' })]) {
    servidor.seed = error;
    const item = manifest((await loadMur('U', {})).feedPosts);
    expect(item.title).toBe('Manifest de Poble'); expect(item._seedFontVersio).toBeUndefined();
  }
  expect(warn).toHaveBeenCalledTimes(2);
  servidor.seed = Object.assign(new Error('Supabase 404: PGRST205'), { status: 404 });
  expect(manifest((await loadMur('U', {})).feedPosts)._seedFontVersio).toBeUndefined();
  expect(warn).toHaveBeenCalledTimes(2);
});

test('R33-L2-03 · the caller abort still stops the load', async () => {
  const controller = new AbortController(); controller.abort();
  servidor.seed = Object.assign(new Error('Operació cancel·lada.'), { name: 'AbortError' });
  await expect(loadMur('U', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});

test('R33-L2-01 · loadMur → owner save → desa_revisio_seed with the real element shape, also after a source change', async () => {
  servidor.rpc.mockImplementation(async (_name, params) => ({ seccio: params.p_section, id: params.p_seed_id, camps: params.p_payload, versio: params.p_version + 1, fontVersio: params.p_source_version }));
  const first = manifest((await loadMur('U', {})).feedPosts);
  expect([first._editorialVersio, first._seedFontVersio, first._seedRevisioVersio]).toEqual([2, 2, undefined]);
  expect(await desaRevisioEditorialAmbServidor('mur', first, { title: 'Revisat' }, { config, esSuperadmin: false })).toMatchObject({ desti: 'servidor', versio: 1 });
  expect(servidor.rpc.mock.calls[0]).toEqual(['desa_revisio_seed', expect.objectContaining({ p_seed_id: 'manifest-de-poble', p_version: 0, p_source_version: 2, p_payload: { title: 'Revisat' } }), expect.anything(), expect.anything()]);
  servidor.seed = [{ section: 'mur', seed_id: 'manifest-de-poble', payload: { title: 'Revisat' }, version: 1, source_version: 2 }];
  const revised = manifest((await loadMur('U', {})).feedPosts);
  expect(revised).toMatchObject({ title: 'Revisat', _seedRevisioVersio: 1, _seedFontVersio: 2 });
  /* Una edició d'una altra peça puja la versió de la fila: la revisió antiga queda
     oculta (RLS) i el client rebasa des de 0 sobre la font nova (R33-L2-02). */
  servidor.version = 3; servidor.seed = [];
  const rebased = manifest((await loadMur('U', {})).feedPosts);
  expect([rebased.title, rebased._seedFontVersio, rebased._seedRevisioVersio]).toEqual(['Manifest de Poble', 3, undefined]);
  expect(await desaRevisioEditorialAmbServidor('mur', rebased, { title: 'Revisat de nou' }, { config, esSuperadmin: false })).toMatchObject({ desti: 'servidor', versio: 1 });
  expect(servidor.rpc.mock.calls[1][1]).toMatchObject({ p_version: 0, p_source_version: 3 });
});
