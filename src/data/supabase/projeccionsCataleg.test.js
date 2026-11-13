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
  title: 'Timonet', ...(audiencia === 'publica' ? { catalog_font: 'herbari', catalog_id: 'timonet', catalog_destins: ['herbari'] } : {}), payload: { title: 'Timonet', projeccioCataleg: { v: 1, font: 'herbari', id: 'timonet', destins: [audiencia === 'publica' ? 'herbari' : 'bar'], audiencia } } });
beforeEach(() => { vi.clearAllMocks(); m.user = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5'; m.generation = 0; m.mode = 'remote'; request.mockResolvedValue([]); });
describe('P0-59/R21 · RPC pública filtrada i RLS privada', () => {
  test.each(['mur', 'arbres-monumentals', 'herbari', 'receptes', 'pagina'])('R21 · el lector preserva %s sense transportar identitat interna', async destinacio => {
    m.user = null;
    const row = fila();
    row.payload = { title: 'Catàleg d’arbres', ownerUserId: ID, destinacio_workspace: destinacio,
      projeccioCataleg: { v: 1, font: 'importacio-wp', id: '619', destins: [destinacio], audiencia: 'publica' } };
    Object.assign(row, { catalog_font: 'importacio-wp', catalog_id: '619', catalog_destins: [destinacio], destinacio_workspace: destinacio });
    request.mockResolvedValueOnce([row]);
    const result = await loadProjeccionsCataleg();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ ownerUserId: null, sectionId: 'mur', destinacio_workspace: destinacio });
    expect(result.items[0].projeccioCataleg.id).toBe('619');
    expect(request.mock.calls[0][0]).toContain('/rest/v1/rpc/llig_mur_public?');
    expect(request.mock.calls[0][2].anonim).toBe(true);
    // dades-05 · El servidor filtra les projeccions abans del LIMIT.
    expect(new URL(request.mock.calls[0][0], 'https://servidor.invalid').searchParams.get('p_nomes_projeccions')).toBe('true');
  });
  test('privada sempre filtra uid, notes, poble i marcador; cursor de conjunt de claus, sense tall silenciós', async () => {
    request.mockResolvedValueOnce([fila('privada')]);
    const first = await loadProjeccionsCataleg({ audiencia: 'privada', limit: 100 });
    expect(first.items).toHaveLength(1); expect(first.cursor).toBeTypeOf('string');
    const url = new URL(request.mock.calls[0][0], 'https://servidor.invalid');
    expect(url.searchParams.get('owner_user_id')).toBe(`eq.${m.user}`); expect(url.searchParams.get('section_id')).toBe('eq.notes');
    expect(url.searchParams.has('p_nomes_projeccions')).toBe(false);
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
    m.user = null;
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

test('R21: un marcador públic filtrat no es pot convertir en referència privada sense propietari', async () => {
  m.user = null;
  const row = fila(); Object.assign(row, { catalog_destins: ['bar'] });
  request.mockResolvedValueOnce([row]);
  expect((await loadProjeccionsCataleg()).items).toEqual([]);
});

test('R21 v2 · projecció pública de membres manté mitjans i metadades sense forçar anon', async () => {
  const row = fila(); row.payload.image = '/clean.webp';
  request.mockResolvedValueOnce({ lectura: 'membre', files: [row] });
  const result = await loadProjeccionsCataleg();
  expect(result.items[0]).toMatchObject({ ownerUserId: m.user, image: '/clean.webp', _murMembre: true });
  expect(request.mock.calls[0][0]).toContain('/llig_mur_membres?');
  expect(request.mock.calls[0][2]).not.toHaveProperty('anonim');
  expect(new URL(request.mock.calls[0][0], 'https://servidor.invalid').searchParams.get('p_nomes_projeccions')).toBe('true');
});

test('dades-05 · la pàgina següent conserva el filtre del servidor i el cursor de conjunt de claus', async () => {
  request.mockResolvedValueOnce({ lectura: 'membre', files: [fila()] });
  const first = await loadProjeccionsCataleg();
  request.mockResolvedValueOnce({ lectura: 'membre', files: [] });
  expect(await loadProjeccionsCataleg({ cursor: first.cursor })).toEqual({ items: [], cursor: null });
  const segona = new URL(request.mock.calls[1][0], 'https://servidor.invalid');
  expect(segona.pathname).toBe('/rest/v1/rpc/llig_mur_membres');
  expect(Object.fromEntries(segona.searchParams)).toEqual({ p_tenant_id: '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7', p_section_id: 'mur', p_limit: '100',
    p_before_created_at: ARA, p_before_id: ID, p_nomes_projeccions: 'true' });
});

/* Gauntlet R22 (dades-01) · Un servidor sense les RPC de R21 (404 PGRST202) no deixa les referències de catàleg en error. */
describe('dades-01 · degradació honesta sense les RPC de R21', () => {
  const absent = () => Object.assign(new Error('Supabase 404'), { status: 404, postgrestCode: 'PGRST202' });
  test('visitant sense llig_mur_public: la lectura filtrada de section_submissions d’abans', async () => {
    const filaDAbans = fila(); // owner_user_id de la columna, com la servia el servidor d'abans
    m.user = null;
    // dades-05 · Abans de la taula, la llig_mur_public sense filtre (la de 2611121430): també absent ací.
    request.mockRejectedValueOnce(absent()).mockRejectedValueOnce(absent()).mockResolvedValueOnce([filaDAbans]);
    const result = await loadProjeccionsCataleg();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].projeccioCataleg.id).toBe('timonet');
    expect(result.items[0].ownerUserId).toBe(filaDAbans.owner_user_id);
    expect(request).toHaveBeenCalledTimes(3);
    const sensePublica = new URL(request.mock.calls[1][0], 'https://servidor.invalid');
    expect(sensePublica.pathname).toBe('/rest/v1/rpc/llig_mur_public');
    expect(sensePublica.searchParams.has('p_nomes_projeccions')).toBe(false);
    const url = new URL(request.mock.calls[2][0], 'https://servidor.invalid');
    expect(url.pathname).toBe('/rest/v1/section_submissions');
    expect(url.searchParams.get('payload->projeccioCataleg->>audiencia')).toBe('eq.publica');
    expect(url.searchParams.get('section_id')).toBe('eq.mur');
    expect(url.searchParams.has('p_nomes_projeccions')).toBe(false);
  });
  test('membre sense llig_mur_membres: llig_mur_public com a visitant, sense passar per la taula', async () => {
    request.mockRejectedValueOnce(absent()).mockResolvedValueOnce([fila()]);
    expect((await loadProjeccionsCataleg()).items).toHaveLength(1);
    expect(request.mock.calls[1][0]).toContain('/rest/v1/rpc/llig_mur_public?');
    expect(request.mock.calls[1][2].anonim).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
    // dades-05 · Sense llig_mur_membres no hi ha 2611122200: la llig_mur_public d'eixe servidor no té el filtre.
    expect(new URL(request.mock.calls[0][0], 'https://servidor.invalid').searchParams.get('p_nomes_projeccions')).toBe('true');
    expect(new URL(request.mock.calls[1][0], 'https://servidor.invalid').searchParams.has('p_nomes_projeccions')).toBe(false);
  });
  test('visitant amb només 2611121430: la llig_mur_public sense filtre, i el client continua filtrant', async () => {
    m.user = null;
    const senseMarca = { ...fila(), id: '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e', catalog_font: null, catalog_id: null, catalog_destins: null };
    request.mockRejectedValueOnce(absent()).mockResolvedValueOnce([fila(), senseMarca]);
    const result = await loadProjeccionsCataleg();
    expect(result.items.map(item => item.id)).toEqual([ID]);
    expect(request).toHaveBeenCalledTimes(2);
    const [filtrada, sense] = request.mock.calls.map(([url]) => new URL(url, 'https://servidor.invalid'));
    expect(filtrada.pathname).toBe('/rest/v1/rpc/llig_mur_public');
    expect(filtrada.searchParams.get('p_nomes_projeccions')).toBe('true');
    expect(sense.pathname).toBe('/rest/v1/rpc/llig_mur_public');
    expect([...sense.searchParams.keys()].sort()).toEqual(['p_limit', 'p_section_id', 'p_tenant_id']);
    expect(request.mock.calls[1][2].anonim).toBe(true);
  });
  test('un altre error de la crida filtrada no es reintenta sense filtre', async () => {
    m.user = null;
    const error = Object.assign(new Error('Supabase 400'), { status: 400, postgrestCode: '22P02' });
    request.mockRejectedValueOnce(error);
    await expect(loadProjeccionsCataleg()).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });
  test('cap altre error no cau a la lectura d’abans', async () => {
    m.user = null;
    const error = Object.assign(new Error('Supabase 404'), { status: 404, postgrestCode: 'PGRST205' });
    request.mockRejectedValueOnce(error);
    await expect(loadProjeccionsCataleg()).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
