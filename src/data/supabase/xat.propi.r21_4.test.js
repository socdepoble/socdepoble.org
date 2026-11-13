import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaFilDirecte, loadFils, enviaMissatge, loadMissatges } from './xat.js';
import { createLocalXatAdapter, reiniciaLocalXat } from '../localXat.js';

const fixture = vi.hoisted(() => ({ user: { id: '11111111-1111-4111-8111-111111111111', user_metadata: { full_name: 'Persona de prova' } }, client: null }));
vi.mock('./config.js', () => ({ getClient: async () => fixture.client }));
vi.mock('../identitat.js', () => ({ versioSessio: 0, usuariDeSessio: () => fixture.user, getDefaultUserId: () => 'guest-fixture' }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => ({ ...config, runtimeDataMode: config.dataMode || 'remote' }), generateUUID: () => '22222222-2222-4222-8222-222222222222' }));
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '33333333-3333-4333-8333-333333333333';
const remote = { dataMode: 'remote', tenantId: '44444444-4444-4444-8444-444444444444' };
const local = { dataMode: 'local', tenantId: '44444444-4444-4444-8444-444444444444' };
const row = extra => ({ id: 'own-thread', tipus: 'directe', participants: 1, altres: [{ id: USER, nom: 'Persona de prova', tipus: 'persona', avatarUrl: null, slug: null }], altres_noms: ['Persona de prova'], ...extra });
beforeEach(() => { reiniciaLocalXat(); fixture.user = { id: USER, user_metadata: { full_name: 'Persona de prova' } }; });
afterEach(() => vi.restoreAllMocks());

describe('R21.4 remote self-chat DTO', () => {
  test('same-user creation delegates to the existing RPC, and the single own person maps esPropi:true', async () => {
    fixture.client = { rpc: vi.fn((name) => Promise.resolve({ data: name === 'crea_fil_directe' ? 'own-thread' : [row()], error: null })) };
    expect(await creaFilDirecte(USER, null, remote)).toBe('own-thread');
    expect(fixture.client.rpc).toHaveBeenCalledWith('crea_fil_directe', { p_tenant_id: remote.tenantId, p_altre_usuari: USER, p_titol: null });
    expect((await loadFils(remote)).find(f => f.id === 'own-thread')).toMatchObject({ esPropi: true, participants: 1, altres: [{ id: USER, tipus: 'persona' }] });
  });
  test.each([
    { altres: [] }, { altres: [{ id: OTHER, tipus: 'persona' }] }, { participants: 2 },
    { tipus: 'grup' }, { altres: [{ id: USER, tipus: 'entitat' }] },
    { subjecte_tipus: 'pagina', subjecte_id: '/iaia' }, { org_id: 'own-org' },
    { com_entitat: true }, { altres: [{ id: USER, tipus: 'persona' }, { id: OTHER, tipus: 'persona' }] }
  ])('does not turn an ambiguous or ordinary singleton into self-chat: %j', async extra => {
    fixture.client = { rpc: vi.fn(async () => ({ data: [row(extra)], error: null })) };
    expect((await loadFils(remote)).find(f => f.id === 'own-thread').esPropi).not.toBe(true);
  });
  test('a response for a different current account is not labeled as self', async () => {
    fixture.user = { id: OTHER };
    fixture.client = { rpc: vi.fn(async () => ({ data: [row()], error: null })) };
    expect((await loadFils(remote)).find(f => f.id === 'own-thread').esPropi).not.toBe(true);
  });
});

describe('R21.4 local self-chat behavior', () => {
  test('creates one distinct self participant, reuses it, sends idempotently and preserves read marks with no network', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw new Error('fixture forbids network'); });
    const a = createLocalXatAdapter();
    const ordinary = await a.creaFilDirecte('0001', null, local);
    const own = await a.creaFilDirecte(USER, 'My notes', local);
    expect(own).not.toBe(ordinary);
    expect(await a.creaFilDirecte(USER, 'Other title', local)).toBe(own);
    const first = await a.enviaMissatge(own, { id: 'own-message', text: 'Reminder' }, local);
    expect(await a.enviaMissatge(own, { id: 'own-message', text: 'Reminder' }, local)).toEqual(first);
    expect(await a.loadMissatges(own, local)).toHaveLength(1);
    const mapped = (await a.loadFils(local)).find(f => f.id === own);
    expect(mapped).toMatchObject({ esPropi: true, tipus: 'directe', titol: 'My notes', participants: 1, noLlegits: 0, ultimSeq: 1, llegitFinsSeq: 1, altresNoms: ['Persona de prova'], altres: [{ id: USER, tipus: 'persona' }] });
    expect(mapped).not.toHaveProperty('propiUsuariId');
    expect((await a.loadFils(local)).find(f => f.id === ordinary).esPropi).not.toBe(true);
    expect(network).not.toHaveBeenCalled();
  });
  test('self threads and contents remain isolated by account and tenant; anonymous self-chat is refused', async () => {
    const a = createLocalXatAdapter();
    const own = await a.creaFilDirecte(USER, null, local);
    await a.enviaMissatge(own, { id: 'private-own', text: 'private' }, local);
    fixture.user = { id: OTHER };
    expect(await a.loadFils(local)).not.toContainEqual(expect.objectContaining({ id: own }));
    await expect(a.loadMissatges(own, local)).rejects.toMatchObject({ code: 'SDP-XAT-005' });
    const second = await a.creaFilDirecte(OTHER, null, local);
    expect(second).not.toBe(own);
    fixture.user = { id: USER };
    const anotherTown = { ...local, tenantId: '55555555-5555-4555-8555-555555555555' };
    expect(await a.loadFils(anotherTown)).toEqual([]);
    expect(await a.creaFilDirecte(USER, null, anotherTown)).not.toBe(own);
    fixture.user = null;
    await expect(a.creaFilDirecte('guest-fixture', null, local)).rejects.toMatchObject({ code: 'SDP-XAT-001' });
  });
  test('Supabase seed/local delegation exposes the same esPropi DTO without an RPC', async () => {
    fixture.client = { rpc: vi.fn(() => { throw new Error('fixture forbids RPC'); }) };
    const own = await creaFilDirecte(USER, null, local);
    await enviaMissatge(own, { id: 'delegated-own', text: 'Self reminder' }, local);
    expect((await loadFils(local)).find(f => f.id === own)).toMatchObject({ esPropi: true, participants: 1 });
    expect(await loadMissatges(own, local)).toHaveLength(1);
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });
});
