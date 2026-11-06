import { expect, test, vi } from 'vitest';
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
import { arrenca, configura, injectaBackendDelPaquet } from '../../host.js';
import { fixaCapaDelPaquet } from '../../config/capaDelPaquet.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { CAPACITATS } from '../contracte.js';
import { loadCoreContent, loadMur, appendSectionSubmissionNetworkOnly, teCapacitat, getCurrentUser } from '../backendPort.js';
import { creaAdaptadorNodeZeroHttp } from '../node0/adaptadorNodeZeroHttp.js';

test('Node 0 s’injecta abans d’arrenca, es segella i llig PostgreSQL pel port sense importar sessió remota', async () => {
  const endpoint = 'https://socdepoble.cat/api/v1/node0';
  const tenantId = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
  const calls = [];
  const fetchImpl = vi.fn(async (url, init) => {
    calls.push({ url, init });
    const value = url.endsWith('/core')
      ? { towns: [{ id: 'la-torre', title: 'La Torre' }], pages: [], agents: [] }
      : { feedPosts: [{ id: 'publicacio-postgresql', title: 'La notícia del poble' }], events: [], marketItems: [] };
    return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
  });
  fixaCapaDelPaquet({ backendId: 'sdp-node0-http', supabaseUrl: endpoint, tenantId, dataMode: 'remote' });
  const rebut = injectaBackendDelPaquet(creaAdaptadorNodeZeroHttp({ endpoint, tenantId, fetchImpl }));
  expect(rebut.pendents).toEqual([]);
  expect(configura({}).descartades).toEqual([]);
  await arrenca();
  expect(normalizeBackendConfig()).toMatchObject({ backendId: 'sdp-node0-http', backendUrl: endpoint, tenantId, dataMode: 'remote' });
  expect(getCurrentUser()).toBeNull();
  expect((await loadCoreContent()).towns[0].title).toBe('La Torre');
  expect((await loadMur()).feedPosts[0].id).toBe('publicacio-postgresql');
  expect(Object.keys(CAPACITATS).filter(teCapacitat)).toEqual(['salut','dadesObertes']);
  await expect(appendSectionSubmissionNetworkOnly({ title: 'No s’ha de publicar' })).rejects.toMatchObject({ codi: 'sense-capacitat' });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  expect(calls.every(({ init }) => init.method === 'GET' && init.credentials === 'omit')).toBe(true);
  expect(() => injectaBackendDelPaquet(creaAdaptadorNodeZeroHttp({ endpoint, tenantId, fetchImpl }))).toThrow('arrancada');
  expect(() => configura({})).toThrow('arrancada');
});
