import { beforeEach, expect, test, vi } from 'vitest';
const A = '44000000-0000-4000-8000-000000000001', B = '44000000-0000-4000-8000-000000000002';
const T = '44000000-0000-4000-8000-000000000010', I = '44000000-0000-4000-8000-000000000020', O = '44000000-0000-4000-8000-000000000030';
const state = vi.hoisted(() => ({ user: null, tenant: null, backend: '', rpc: vi.fn(), request: vi.fn(), guard: vi.fn() }));
vi.mock('./runtime.js', () => ({ getCurrentUser: () => state.user ? { id: state.user } : null,
  getResolvedConfig: () => ({ runtimeDataMode: 'remote', hasSupabaseConfig: true, tenantId: state.tenant, supabaseUrl: state.backend }),
  rpc: (...args) => state.rpc(...args), request: (...args) => state.request(...args) }));
vi.mock('../identitat.js', () => ({ capturaSessio: () => state.guard }));
import { llistaRevisionsPagina, desaRevisioPagina, restauraRevisioPagina } from './revisionsPagines.js';
import { desaPublicacioPropia } from './publicacionsPropies.js';
import { capturaCampsPagina, capturaFilaPagina, historialPaginaAContracteLocal } from '../revisionsPagines.js';

const instant = '2026-11-22T22:00:00.123456Z', next = '2026-11-22T22:00:00.123457Z';
const revision = () => ({ id: I, tenant_id: T, section_id: 'mur', slug: null, item_id: I, version_num: 1,
  author_id: A, actor_entity_id: null, payload_jsonb: { content: 'Text', title: 'Títol' }, created_at: instant,
  operation_id: O, restored_from: null, replay: false });
const saveInput = () => ({ seccio: 'mur', id: I, camps: { title: 'Títol', content: 'Text' }, versio: 0, operationId: O });
const publication = () => ({ id: I, sectionId: 'mur', payload: { title: 'Títol', content: 'Text' }, expectedUpdatedAt: null, operationId: O });
const ack = () => ({ id: I, tenant_id: T, owner_user_id: A, author_org_id: null, section_id: 'mur', operation_id: O, created_at: instant, updated_at: next, replay: false });
beforeEach(() => { state.user = A; state.tenant = T; state.backend = 'https://example.invalid'; state.rpc.mockReset(); state.request.mockReset(); state.guard.mockReset(); state.rpc.mockResolvedValue(revision()); state.request.mockResolvedValue(ack()); });

test('desada captura camps, opera només via RPC i valida rebut sense dependre de l’ordre JSONB', async () => {
  const result = await desaRevisioPagina(saveInput());
  expect(result.versio).toBe(1); expect(result.authorId).toBe(A);
  expect(state.rpc.mock.calls[0][0]).toBe('desa_revisio_pagina');
  expect(state.rpc.mock.calls[0][1]).toMatchObject({ p_expected_version: 0, p_item_id: I, p_slug: null, p_payload_jsonb: { title: 'Títol', content: 'Text' } });
});
test('rebutjos primitius no invoquen getters ni transport', async () => {
  const getter = vi.fn(() => 'Text');
  for (const camps of [{ title: {} }, { tags: [{}] }, { mostrarAlMur: 'sí' }, { get content() { return getter(); } }, { author_id: B }, { content: 'x'.repeat(700001) }]) {
    await expect(desaRevisioPagina({ ...saveInput(), camps })).rejects.toBeInstanceOf(TypeError);
  }
  expect(getter).not.toHaveBeenCalled(); expect(state.rpc).not.toHaveBeenCalled();
  for (const value of [{ toString: 0 }, [], undefined]) expect(() => capturaCampsPagina(value)).toThrow(TypeError);
});
test('captura immutable abans del primer await i payload primitiu del rebut', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  state.rpc.mockImplementation(async () => { await gate; return revision(); });
  const input = saveInput(), pending = desaRevisioPagina(input); input.camps.title = 'Canviat'; input.operationId = B; release();
  await expect(pending).resolves.toMatchObject({ operationId: O, camps: { title: 'Títol' } });
  expect(state.rpc.mock.calls[0][1].p_payload_jsonb.title).toBe('Títol');
  state.rpc.mockResolvedValue({ ...revision(), payload_jsonb: { title: {} } });
  await expect(desaRevisioPagina(saveInput())).rejects.toBeInstanceOf(TypeError);
});
test.each(['user', 'tenant', 'backend', 'session', 'abort'])('rebut tardà d’un altre context és refusat: %s', async mode => {
  const controller = new AbortController();
  state.rpc.mockImplementation(async () => { if (mode === 'user') state.user = B; if (mode === 'tenant') state.tenant = B; if (mode === 'backend') state.backend = 'https://altre.invalid'; if (mode === 'session') state.guard.mockImplementation(() => { throw new DOMException('Sessió', 'AbortError'); }); if (mode === 'abort') controller.abort(); return revision(); });
  await expect(desaRevisioPagina(saveInput(), { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
});
test('cap confirmació de recurs/versió/autoria aliens ni camps addicionals', async () => {
  for (const change of [{ tenant_id: B }, { item_id: B }, { section_id: 'events' }, { version_num: 2 }, { author_id: B }, { operation_id: B }, { request_sha256: 'secret' }]) {
    state.rpc.mockResolvedValue({ ...revision(), ...change }); await expect(desaRevisioPagina(saveInput())).rejects.toBeInstanceOf(TypeError);
  }
});
test('llista privada paginada ordenada i conversor explícit al contracte Gemini', async () => {
  const one = revision(), two = { ...one, id: B, version_num: 2, payload_jsonb: { title: 'Segona' }, operation_id: B };
  delete one.replay; delete two.replay; state.rpc.mockResolvedValue([two, one]);
  const rows = await llistaRevisionsPagina({ seccio: 'mur', id: I });
  expect(rows.map(x => x.versio)).toEqual([2, 1]);
  const local = historialPaginaAContracteLocal(rows);
  expect(local[1]).toMatchObject({ versio: 2, campsAnteriors: { title: 'Títol' }, campsNous: { title: 'Segona' }, autorNom: null });
  state.rpc.mockResolvedValue([one, two]); await expect(llistaRevisionsPagina({ seccio: 'mur', id: I })).rejects.toThrow(TypeError);
  expect(() => capturaFilaPagina({ ...revision(), payload_jsonb: { icon: { toString: 0 } } })).toThrow(TypeError);
});
test('restaurar és una RPC amb CAS, nova versió i referència exacta', async () => {
  state.rpc.mockResolvedValue({ ...revision(), version_num: 3, restored_from: 1 });
  const r = await restauraRevisioPagina({ seccio: 'mur', id: I, versio: 2, restauraVersio: 1, operationId: O });
  expect(r.versio).toBe(3); expect(r.restauradaDe).toBe(1);
  expect(state.rpc.mock.calls[0][0]).toBe('restaura_revisio_pagina'); expect(state.rpc.mock.calls[0][1]).toMatchObject({ p_expected_version: 2, p_version_num: 1 });
});
test('absència SQL, conflictes i denegacions mai es degraden a escriptura antiga', async () => {
  /* v1.2.23 · R2D-06 (Gauntlet R2) · Forma real de runtime.js: el SQLSTATE de cinc caràcters va a `sqlstate` i només
     els PGRST### van a `postgrestCode`. El missatge no porta cap SDP-PAGE-00x/429: exercita la branca del sqlstate. */
  for (const [message, error, code] of [['SDP-PAGE', { status: 404, postgrestCode: 'PGRST202' }, 'no-disponible'],
    ['Supabase 409: {}', { sqlstate: '40001' }, 'conflicte-versio'], ['Supabase 409: {}', { sqlstate: '42501' }, 'sense-permis'],
    ['Supabase 409: {}', { sqlstate: '54000' }, 'quota-assolida']]) {
    state.rpc.mockRejectedValue(Object.assign(Error(message), error)); await expect(desaRevisioPagina(saveInput())).rejects.toMatchObject({ code });
  }
  expect(state.rpc).toHaveBeenCalledTimes(4); expect(state.request).not.toHaveBeenCalled();
});
test('CAS propi permet rebut d’entitat amb creadora original i el mateix operationId', async () => {
  state.request.mockResolvedValue({ ...ack(), owner_user_id: B, author_org_id: T });
  const r = await desaPublicacioPropia({ ...publication(), expectedUpdatedAt: instant, actor: { tipus: 'entitat', id: T } });
  expect(r.ownerUserId).toBe(B); expect(r.authorOrgId).toBe(T);
  expect(state.request.mock.calls[0][0]).toBe('/rest/v1/rpc/publica_section_submission_beta_cas');
});
test('CAS propi rebutja signatura usurpada, versió falsa i rebuig SQL sense fallback', async () => {
  for (const change of [{ owner_user_id: B }, { updated_at: 0 }, { author_org_id: B }, { operation_id: B }]) {
    state.request.mockResolvedValue({ ...ack(), ...change }); await expect(desaPublicacioPropia({ ...publication(), actor: { tipus: 'persona' } })).rejects.toBeInstanceOf(TypeError);
  }
  state.request.mockRejectedValue(Object.assign(Error('RPC absent'), { status: 404, postgrestCode: 'PGRST202' }));
  await expect(desaPublicacioPropia(publication())).rejects.toMatchObject({ codi: 'esquema-absent' });
  expect(state.request).toHaveBeenCalledTimes(5);
});

const CASE_UUID = Object.freeze({
  user: 'abcdefab-cdef-4abc-8def-abcdefabcdea',
  tenant: 'ac3bec76-255b-5ca2-8886-28fcceab4267',
  id: 'abcdefab-cdef-4abc-8def-abcdefabcdef',
  operationId: '12345678-abcd-4ef0-8abc-123456abcdef',
  entity: 'f1234567-abcd-4ef0-8abc-123456abcdef'
});
const caseInput = () => ({ ...publication(), id: CASE_UUID.id, operationId: CASE_UUID.operationId });
function canonicalPublicationAck(options) {
  return { ...ack(), id: options.body.p_id.toLowerCase(), tenant_id: CASE_UUID.tenant, owner_user_id: CASE_UUID.user,
    operation_id: options.body.p_operation_id.toLowerCase(), author_org_id: options.body.p_author_org_id?.toLowerCase() ?? null };
}
test.each(['id', 'operationId', 'entity', 'user', 'tenant'])('F03: CAS propi canonicalitza UUID admés en majúscules: %s', async field => {
  state.user = CASE_UUID.user; state.tenant = CASE_UUID.tenant;
  const input = caseInput();
  if (field === 'user' || field === 'tenant') state[field] = CASE_UUID[field].toUpperCase();
  else if (field === 'entity') input.actor = { tipus: 'entitat', id: CASE_UUID.entity.toUpperCase() };
  else input[field] = input[field].toUpperCase();
  const before = structuredClone(input), config = Object.freeze({ tenantId: state.tenant });
  state.request.mockImplementation(async (_url, _cfg, options) => canonicalPublicationAck(options));
  for (let i = 0; i < 2; i++) await expect(desaPublicacioPropia(input, config)).resolves.toMatchObject({ id: CASE_UUID.id, operationId: CASE_UUID.operationId, ownerUserId: CASE_UUID.user });
  const first = state.request.mock.calls[0][2].body;
  expect(first).toMatchObject({ p_id: CASE_UUID.id, p_tenant_id: CASE_UUID.tenant, p_operation_id: CASE_UUID.operationId,
    p_author_org_id: field === 'entity' ? CASE_UUID.entity : null });
  expect(state.request.mock.calls[1][2].body).toEqual(first);
  expect(state.request.mock.calls[0][1].tenantId).toBe(CASE_UUID.tenant);
  expect(config.tenantId).toBe(field === 'tenant' ? CASE_UUID.tenant.toUpperCase() : CASE_UUID.tenant);
  expect(input).toEqual(before);
});
test.each(['user', 'tenant'])('F03: canvi només de caixa del context no canvia identitat de publicació: %s', async field => {
  state.user = CASE_UUID.user.toUpperCase(); state.tenant = CASE_UUID.tenant.toUpperCase();
  state.request.mockImplementation(async (_url, _cfg, options) => { state[field] = state[field].toLowerCase(); return canonicalPublicationAck(options); });
  await expect(desaPublicacioPropia(caseInput())).resolves.toMatchObject({ id: CASE_UUID.id, ownerUserId: CASE_UUID.user });
});
function canonicalRevision(overrides = {}) {
  return { ...revision(), id: CASE_UUID.id, tenant_id: CASE_UUID.tenant, item_id: CASE_UUID.id, author_id: CASE_UUID.user,
    actor_entity_id: CASE_UUID.entity, operation_id: CASE_UUID.operationId, ...overrides };
}
test.each(['desa', 'restaura', 'llista'])('F03: revisions accepten UUID/context en majúscules i retorn PostgreSQL canònic: %s', async method => {
  state.user = CASE_UUID.user.toUpperCase(); state.tenant = CASE_UUID.tenant.toUpperCase();
  const input = { seccio: 'mur', id: CASE_UUID.id.toUpperCase(), versio: 0, operationId: CASE_UUID.operationId.toUpperCase(), actorEntityId: CASE_UUID.entity.toUpperCase() };
  if (method === 'desa') input.camps = { title: 'Títol', content: 'Text' };
  if (method === 'restaura') { input.versio = 2; input.restauraVersio = 1; }
  const callInput = method === 'llista' ? { seccio: input.seccio, id: input.id } : input, before = structuredClone(callInput), config = Object.freeze({ tenantId: state.tenant });
  state.rpc.mockResolvedValue(method === 'llista' ? [canonicalRevision()] : canonicalRevision(method === 'restaura' ? { version_num: 3, restored_from: 1 } : {}));
  const call = method === 'desa' ? desaRevisioPagina : method === 'restaura' ? restauraRevisioPagina : llistaRevisionsPagina;
  const result = await call(callInput, config), row = method === 'llista' ? result[0] : result;
  expect(row).toMatchObject({ id: CASE_UUID.id, tenantId: CASE_UUID.tenant, authorId: CASE_UUID.user, operationId: CASE_UUID.operationId, actorEntityId: CASE_UUID.entity });
  expect(state.rpc.mock.calls[0][1]).toMatchObject({ p_tenant_id: CASE_UUID.tenant, p_item_id: CASE_UUID.id });
  if (method !== 'llista') expect(state.rpc.mock.calls[0][1].p_operation_id).toBe(CASE_UUID.operationId);
  expect(state.rpc.mock.calls[0][2].tenantId).toBe(CASE_UUID.tenant); expect(config.tenantId).toBe(CASE_UUID.tenant.toUpperCase());
  expect(callInput).toEqual(before);
});
test.each(['user', 'tenant'])('F03: canvi només de caixa del context conserva identitat de revisió: %s', async field => {
  state.user = CASE_UUID.user.toUpperCase(); state.tenant = CASE_UUID.tenant.toUpperCase();
  state.rpc.mockImplementation(async () => { state[field] = state[field].toLowerCase(); return canonicalRevision(); });
  await expect(desaRevisioPagina({ seccio: 'mur', id: CASE_UUID.id, camps: { title: 'Títol', content: 'Text' }, versio: 0,
    operationId: CASE_UUID.operationId, actorEntityId: CASE_UUID.entity })).resolves.toMatchObject({ authorId: CASE_UUID.user, tenantId: CASE_UUID.tenant });
});
