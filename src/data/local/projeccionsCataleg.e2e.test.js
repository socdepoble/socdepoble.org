import { afterEach, describe, expect, test } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { configuraBackendSessio, desaSessio, esborraSessio, capturaSessio } from '../identitat.js';
import { creaServeiProjeccionsCataleg } from '../projeccionsCatalegServei.js';
import { DESTINS_CATALEG, perDestiCataleg } from '../projeccionsCataleg.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';

const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', ALTRE = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d';
const TENANT = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const FONT = { font: 'receptes', id: '14', title: 'Arròs al forn', subtitle: 'Què dinem?', lead: 'Recepta literal' };
afterEach(() => { esborraSessio({ abast: 'tot' }); });
const entra = (adapter, id = OWNER) => {
  configuraBackendSessio(adapter.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id, user_metadata: {} } })).toBe(true);
};
async function tot(adapter, audiencia) {
  let cursor = null; const rows = [];
  do { const page = await adapter.loadProjeccionsCataleg({ audiencia, limit: 1, cursor }); rows.push(...page.items); cursor = page.cursor; } while (cursor !== null);
  return rows;
}
describe('P0-59 · E2E amb segon adaptador real, font intacta', () => {
  test('tria, desa, sincronitza, llig cada superfície, canvia i revoca sense duplicar', async () => {
    const adapter = creaAdaptadorLocal({ mode: 'local', tenantId: TENANT }); entra(adapter);
    const service = creaServeiProjeccionsCataleg({ abast: { tenantId: TENANT, ownerId: OWNER, backendId: 'sdp-local' },
      idb: null, navegador: null, Canal: null, subtil: webcrypto.subtle, comprovaSessio: capturaSessio(),
      publica: sub => adapter.appendSectionSubmissionNetworkOnly(sub) });
    await service.prepara(); const original = structuredClone(FONT);
    await service.desa(FONT, DESTINS_CATALEG); await service.sincronitza();
    const rows = [...await tot(adapter, 'publica'), ...await tot(adapter, 'privada')];
    expect(rows).toHaveLength(2);
    for (const desti of DESTINS_CATALEG) expect(perDestiCataleg(rows, desti, { ownerId: OWNER }), desti).toHaveLength(1);
    expect((await adapter.loadMur()).feedPosts).toHaveLength(1); // notes private never leaks into Mur
    expect(FONT).toEqual(original);
    await service.desa(FONT, ['herbari']); await service.sincronitza();
    const changed = [...await tot(adapter, 'publica'), ...await tot(adapter, 'privada')];
    expect(changed).toHaveLength(2); expect(perDestiCataleg(changed, 'bar', { ownerId: OWNER })).toEqual([]);
    expect(perDestiCataleg(changed, 'herbari')).toHaveLength(1); expect(perDestiCataleg(changed, 'mur')).toEqual([]);
    await service.desa(FONT, []); await service.sincronitza();
    const revoked = [...await tot(adapter, 'publica'), ...await tot(adapter, 'privada')];
    for (const desti of DESTINS_CATALEG) expect(perDestiCataleg(revoked, desti, { ownerId: OWNER })).toEqual([]);
    service.tanca(); adapter.destroy();
  });
  test('una altra persona no llig notes privades ni sobreescriu la referència', async () => {
    const adapter = creaAdaptadorLocal({ mode: 'local', tenantId: TENANT }); entra(adapter);
    const sub = { id: ALTRE, sectionId: 'notes', payload: { title: 'Privat', projeccioCataleg: { v: 1, font: 'bar', id: 'producte', destins: ['bar'], audiencia: 'privada' } } };
    await adapter.appendSectionSubmissionNetworkOnly(sub); expect((await tot(adapter, 'privada'))).toHaveLength(1);
    entra(adapter, ALTRE); expect(await tot(adapter, 'privada')).toEqual([]);
    await expect(adapter.appendSectionSubmissionNetworkOnly(sub)).rejects.toMatchObject({ status: 403 });
    esborraSessio({ abast: 'tot' }); await expect(adapter.loadProjeccionsCataleg({ audiencia: 'privada' })).rejects.toMatchObject({ codi: 'sense-sessio' }); adapter.destroy();
  });
  test('cursor lligat al poble, compte i audiència; el contracte opcional inclou positius i negatives amb mutants', async () => {
    const adapter = creaAdaptadorLocal({ mode: 'local', tenantId: TENANT }); entra(adapter);
    const ctx = contextDeConformitat({ config: adapter.configuracio, escenaris: { projeccionsOperatives: true } });
    const cases = CASOS.filter(c => c.capacitat === 'projeccionsCataleg'); expect(cases).toHaveLength(3);
    for (const c of cases.slice(0, 2)) expect(await executaCas(c, adapter, ctx)).toMatchObject({ estat: 'ok' });
    esborraSessio({ abast: 'tot' });
    const denied = contextDeConformitat({ config: adapter.configuracio, escenaris: { projeccionsSenseSessio: true } });
    expect(await executaCas(cases[2], adapter, denied)).toMatchObject({ estat: 'ok' });
    expect(await executaCas(cases[1], { loadProjeccionsCataleg: async () => ({ items: null, cursor: 4 }) }, ctx)).toMatchObject({ estat: 'falla' });
    expect(await executaCas(cases[2], { loadProjeccionsCataleg: async () => ({ items: [], cursor: null }) }, denied)).toMatchObject({ estat: 'falla' }); adapter.destroy();
  });
});
