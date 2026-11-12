import { beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ user: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', generation: 0, mode: 'remote' }));
vi.mock('./runtime.js', () => ({
  getCurrentUser: () => m.user ? { id: m.user } : null,
  getResolvedConfig: () => ({ tenantId: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', runtimeDataMode: m.mode, hasSupabaseConfig: true }),
  request: vi.fn(async () => [])
}));
vi.mock('../identitat.js', () => ({ capturaSessio: () => { const captured = m.generation; return () => { if (captured !== m.generation) throw new DOMException('Canvi de compte', 'AbortError'); }; } }));
import { request } from './runtime.js';
import { loadProjeccionsCataleg } from './projeccionsCataleg.js';
const ID = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d', ARA = '2026-11-09T16:00:00.000000+00:00';
const fila = (audiencia = 'publica') => ({ id: ID, owner_user_id: m.user, section_id: audiencia === 'publica' ? 'mur' : 'notes', created_at: ARA,
  title: 'Timonet', payload: { title: 'Timonet', projeccioCataleg: { v: 1, font: 'herbari', id: 'timonet', destins: [audiencia === 'publica' ? 'herbari' : 'bar'], audiencia } } });
beforeEach(() => { vi.clearAllMocks(); m.user = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5'; m.generation = 0; m.mode = 'remote'; request.mockResolvedValue([]); });
describe('P0-59 · lector Supabase, RLS existent sense migració', () => {
  test.each(['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina'])('R18 · el lector preserva %s i continua deduint l’autoria de les columnes', async destinacio => {
    const row = fila();
    row.payload = { title: 'Catàleg d’arbres', ownerUserId: ID, destinacio_workspace: destinacio,
      projeccioCataleg: { v: 1, font: 'importacio-wp', id: '619', destins: [destinacio], audiencia: 'publica' } };
    request.mockResolvedValueOnce([row]);
    const result = await loadProjeccionsCataleg();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ ownerUserId: m.user, sectionId: 'mur', destinacio_workspace: destinacio });
    expect(result.items[0].projeccioCataleg.id).toBe('619');
  });
  test('privada sempre filtra uid, notes, poble i marcador; cursor de conjunt de claus, sense tall silenciós', async () => {
    request.mockResolvedValueOnce([fila('privada')]);
    const first = await loadProjeccionsCataleg({ audiencia: 'privada', limit: 100 });
    expect(first.items).toHaveLength(1); expect(first.cursor).toBeTypeOf('string');
    const url = new URL(request.mock.calls[0][0], 'https://servidor.invalid');
    expect(url.searchParams.get('owner_user_id')).toBe(`eq.${m.user}`); expect(url.searchParams.get('section_id')).toBe('eq.notes');
    expect(url.searchParams.get('tenant_id')).toBe('eq.7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7');
    request.mockResolvedValueOnce([]);
    expect(await loadProjeccionsCataleg({ audiencia: 'privada', cursor: first.cursor })).toEqual({ items: [], cursor: null });
    expect(new URL(request.mock.calls[1][0], 'https://servidor.invalid').searchParams.get('or')).toContain('created_at.lt.2026-11-09');
    await expect(loadProjeccionsCataleg({ audiencia: 'publica', cursor: first.cursor })).rejects.toMatchObject({ codi: 'projeccio-invalida' });
  });
  test('lectura pública sense sessió; privada, modeprova o paràmetres hostils no fan xarxa', async () => {
    m.user = null; expect(await loadProjeccionsCataleg()).toEqual({ items: [], cursor: null }); expect(request).toHaveBeenCalledTimes(1);
    await expect(loadProjeccionsCataleg({ audiencia: 'privada' })).rejects.toMatchObject({ codi: 'sense-sessio' });
    await expect(loadProjeccionsCataleg({ limit: 1000 })).rejects.toMatchObject({ codi: 'projeccio-invalida' });
    m.mode = 'seed'; await expect(loadProjeccionsCataleg()).rejects.toMatchObject({ codi: 'no-disponible' }); expect(request).toHaveBeenCalledTimes(1);
  });
  test('el payload no suplanta propietari/secció; fila privada aliena o cursor repetit es rebutgen', async () => {
    const row = fila('privada'); row.owner_user_id = ID; request.mockResolvedValueOnce([row]);
    await expect(loadProjeccionsCataleg({ audiencia: 'privada' })).rejects.toMatchObject({ codi: 'resposta-invalida' });
    request.mockResolvedValueOnce([fila()]); const first = await loadProjeccionsCataleg();
    request.mockResolvedValueOnce([fila()]); await expect(loadProjeccionsCataleg({ cursor: first.cursor })).rejects.toMatchObject({ codi: 'cursor-sense-progres' });
  });
  test('logout/canvi de compte en vol, avortament i resposta malformada no ixen com una llista buida reeixida', async () => {
    request.mockImplementationOnce(async () => { m.generation++; return [fila()]; });
    await expect(loadProjeccionsCataleg()).rejects.toMatchObject({ name: 'AbortError' });
    const controller = new AbortController(); controller.abort(); await expect(loadProjeccionsCataleg({}, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    request.mockResolvedValueOnce({ items: [] }); await expect(loadProjeccionsCataleg()).rejects.toMatchObject({ codi: 'resposta-invalida' });
  });
});
