import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), user: { id: 'audit-user' } }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => m.user, request: m.request,
  getResolvedConfig: (cfg = {}) => ({ tenantId: '00000000-0000-4000-8000-000000000000', supabaseUrl: 'https://audit.invalid', hasSupabaseConfig: true, runtimeDataMode: cfg.dataMode || 'remote' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, getDefaultUserId: () => 'convidat-seed', capturaSessio: () => () => {}, entradaSessio: () => ({}) }));
import { creaComunitatLocal } from '../local/comunitatLocal.js';
import { listPublicOrganizations } from './organizations.js';
import { createLocalXatAdapter } from '../localXat.js';
import { construeixBrainTaxonomia, idEtiquetaBrain, projectaBrainTaxonomia } from '../taxonomia/brainTaxonomia.js';

const raw = 'aa' + '\u0315'.repeat(16383) + '\u0300'.repeat(16384);
const compat = ('\u0315\uff9e').repeat(13107) + ' ';
const watch = () => vi.spyOn(String.prototype, 'normalize');
const noWhole = (spy) => expect(spy.mock.contexts.every((s) => String(s).length < 1000)).toBe(true);
beforeEach(() => { m.request.mockReset(); m.request.mockResolvedValue([{ id: 'server-row', name: 'Café' }]); });
afterEach(() => vi.restoreAllMocks());

test('composed local directory rejects a compatibility query before fallback, preserving restored data', async () => {
  const fallback = vi.fn(() => [{ id: 'all-rows' }]);
  const state = { entitats: new Map() };
  const service = creaComunitatLocal({ perfils: { listPublicOrganizations: fallback }, dadesObertes: { estat: state }, copia: structuredClone });
  const filter = Object.freeze({ consulta: compat }), spy = watch();
  await expect(service.listPublicOrganizations(filter)).rejects.toMatchObject({ code: 'UNICODE_MARK_LIMIT' });
  noWhole(spy); expect(fallback).not.toHaveBeenCalled(); expect(filter.consulta).toBe(compat); expect(state.entitats.size).toBe(0);
});

test('Supabase directory rejects before whole NFC and request; admitted query keeps its exact transport filter', async () => {
  const spy = watch();
  await expect(listPublicOrganizations({ consulta: raw })).rejects.toMatchObject({ code: 'UNICODE_MARK_LIMIT' });
  noWhole(spy); expect(m.request).not.toHaveBeenCalled();
  expect(await listPublicOrganizations({ consulta: 'Café' })).toEqual([{ id: 'server-row', name: 'Café' }]);
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(decodeURIComponent(m.request.mock.calls[0][0])).toContain('name.ilike."*__f_*"');
});

test('local chat member query rejects without widening to all members or changing threads', async () => {
  const service = createLocalXatAdapter(), config = { dataMode: 'local', tenantId: '00000000-0000-4000-8000-000000000001' };
  const before = await service.loadFils(config), spy = watch();
  await expect(service.carregaMembres(raw, config)).rejects.toMatchObject({ code: 'UNICODE_MARK_LIMIT' });
  noWhole(spy); expect(await service.loadFils(config)).toEqual(before);
  expect(Array.isArray(await service.carregaMembres('Javi', config))).toBe(true);
});

test('Brain records an invalid alias/label without throwing during model construction or creating a blank identity', () => {
  const input = Object.freeze({ skos: [{ name: 'Herbari', useFor: [compat] }], publicacions: [{ id: 'a', labels: [compat] }] });
  const spy = watch(); let result;
  expect(() => { result = construeixBrainTaxonomia(input); }).not.toThrow();
  expect(result.cobertura.incidencies.some((e) => e.code === 'UNICODE_MARK_LIMIT')).toBe(true);
  expect(result.documents[0].nodes).toEqual([]);
  expect(result.cobertura.nomsNoCanonics).not.toContain(compat);
  expect(input.skos[0].useFor[0]).toBe(compat); noWhole(spy);
});

test('Brain rejects the complete rename/fusion proposal as a model result, preserving original ids and labels', () => {
  const model = construeixBrainTaxonomia({ publicacions: [{ id: 'a', labels: ['Herbari', 'Llavors'] }] });
  const original = structuredClone(model), baseline = projectaBrainTaxonomia(model);
  const noms = Object.freeze({ [idEtiquetaBrain('Herbari')]: compat, [idEtiquetaBrain('Llavors')]: raw }), spy = watch();
  let result;
  expect(() => { result = projectaBrainTaxonomia(model, { noms, fusio: { origen: idEtiquetaBrain('Herbari'), desti: idEtiquetaBrain('Llavors') } }); }).not.toThrow();
  expect(result.valid).toBe(false); expect(result.incidencies.some((e) => e.code === 'UNICODE_MARK_LIMIT')).toBe(true);
  expect(result.documents).toEqual(baseline.documents); expect(result.collisions).toEqual(baseline.collisions); expect(result.afectats).toEqual([]);
  expect(model).toEqual(original); expect(noms[idEtiquetaBrain('Herbari')]).toBe(compat); noWhole(spy);
});
