import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaContingutLocal } from './contingutLocal.js';
import { canviaEstat, perAmbit, projeccioPayload, seccioDAmbit } from '../../utils/publicacioUniversal.js';
import { publicationSortKey } from '../../utils/publicationDateControl.js';
import { deProducte, dePublicacio } from '../../sections/search/indexCerca.js';
import { facetesDeLEntrada } from '../../sections/search/facetesCerca.js';

let now, actor, api, xarxa;
const ID = '22222222-2222-4222-8222-222222222222';
const OWNER = '11111111-1111-4111-8111-111111111111';
const PRIMER = '2026-11-01T10:00:00.000Z';
const SEGON = '2026-11-08T10:00:00.000Z';
beforeEach(() => {
  now = PRIMER; actor = OWNER;
  xarxa = vi.fn(() => { throw Error('XARXA_PROHIBIDA'); }); vi.stubGlobal('fetch', xarxa);
  api = creaContingutLocal({
    copia: structuredClone, coleccio: () => [], alTancar: () => {}, opcions: {},
    usuari: () => ({ id: actor }), nouId: () => ID, ara: () => new Date(now),
    configuracio: { tenantId: '33333333-3333-4333-8333-333333333333' },
    dadesObertes: { estat: { noticies: new Map(), agenda: new Map(), pobles: new Map() } },
    perfils: { listMyOrganizations: () => [] },
  });
});
afterEach(() => { expect(xarxa).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
const vehicle = () => projeccioPayload({ title: 'CONTROL viatge', content: 'CONTROL', ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'busque_lloc', lloc_eixida: 'Origen', lloc_arribada: 'Destí', data_eixida: '2026-11-12' } });
const publica = (payload = vehicle(), extra = {}) => api.appendSectionSubmissionNetworkOnly({ id: ID, sectionId: 'mur', payload, ...extra });

test('R56 · republicar conserva created_at i l’ordre editorial sense publish_date', async () => {
  await publica();
  now = SEGON;
  await publica(canviaEstat(vehicle(), 'reservat'));
  const { feedPosts } = await api.loadMur();
  expect(feedPosts).toHaveLength(1);
  expect(feedPosts[0]).toMatchObject({ created_at: PRIMER, updated_at: SEGON, estat: 'reservat' });
  expect(publicationSortKey(feedPosts[0])).toBe(Date.parse(PRIMER));
  expect(perAmbit(feedPosts, 'vehicle')).toEqual(feedPosts);
});

test('R56 · createdAt de reintent i created_at del payload no poden redatar la fila existent', async () => {
  await publica(); now = SEGON;
  await publica({ ...vehicle(), created_at: SEGON }, { createdAt: SEGON });
  expect((await api.loadMur()).feedPosts[0].created_at).toBe(PRIMER);
});

test('R56 · canviar mur→mercat al mateix ID falla atòmicament amb SDP-SEC-002', async () => {
  await publica(); const before = await api.loadMur(); now = SEGON;
  await expect(publica(projeccioPayload({ title: 'CONTROL producte', ambit: 'mercat', dades: { preu: '10' } }), { sectionId: 'mercat' }))
    .rejects.toThrow('SDP-SEC-002');
  expect(await api.loadMur()).toEqual(before);
});

test('R56 · dins mur, canviar vehicle→treball actualitza una sola fila i les dues projeccions', async () => {
  await publica(); now = SEGON;
  await publica(projeccioPayload({ title: 'CONTROL ofici', ambit: 'treball', estat: 'complet', dades: { modalitat: 'oferisc_ofici', ofici: 'CONTROL' } }));
  const { feedPosts, marketItems } = await api.loadMur();
  expect(feedPosts).toHaveLength(1); expect(marketItems).toEqual([]);
  expect(perAmbit(feedPosts, 'vehicle')).toEqual([]);
  expect(perAmbit(feedPosts, 'treball')[0]).toMatchObject({ id: ID, estat: 'complet', created_at: PRIMER });
});

test('R56 · la identitat aliena no pot editar ni moure la fila', async () => {
  await publica(); const before = await api.loadMur(); actor = '44444444-4444-4444-8444-444444444444';
  await expect(publica()).rejects.toMatchObject({ status: 403 });
  expect(await api.loadMur()).toEqual(before);
});

test('R56 · publish_date continua sent explícit i no canvia la creació', async () => {
  await publica(); now = SEGON;
  await publica({ ...vehicle(), publish_date: SEGON });
  const [row] = (await api.loadMur()).feedPosts;
  expect(row.created_at).toBe(PRIMER); expect(publicationSortKey(row)).toBe(Date.parse(SEGON));
});

test('R56 · dos reintents del mateix ID conserven una fila i el primer instant', async () => {
  await publica(); now = SEGON;
  await Promise.all([publica(canviaEstat(vehicle(), 'reservat')), publica(canviaEstat(vehicle(), 'complet'))]);
  const { feedPosts } = await api.loadMur();
  expect(feedPosts).toHaveLength(1);
  expect(feedPosts[0]).toMatchObject({ id: ID, created_at: PRIMER, estat: 'complet' });
});

test.each(['vehicle', 'treball', 'habitatge', 'mercat'])('R56 · %s: una fila real alimenta Mur, vertical i facetes després d’editar estat i data', async ambit => {
  const payload = projeccioPayload({ title: `CONTROL ${ambit}`, ambit, estat: 'disponible', publish_date: PRIMER, dades: { preu: '10' } });
  const sectionId = seccioDAmbit(ambit);
  await publica(payload, { sectionId }); now = SEGON;
  await publica({ ...canviaEstat(payload, 'complet'), publish_date: SEGON }, { sectionId });
  const mur = await api.loadMur();
  const files = [...mur.feedPosts, ...mur.marketItems];
  expect(files).toHaveLength(1);
  const [row] = perAmbit(files, ambit);
  expect(row).toMatchObject({ id: ID, estat: 'complet', created_at: PRIMER, publish_date: SEGON });
  const entrada = ambit === 'mercat' ? deProducte(row) : dePublicacio(row);
  expect(entrada.data).toBe(publicationSortKey(row));
  expect(facetesDeLEntrada(entrada, { ara: Date.parse(SEGON), desfasMinuts: 60 }))
    .toEqual(expect.arrayContaining([`tipus:${ambit}`, 'estat:complet', 'data:hui']));
});
