/**
 * T2 · D04/D10 (assalt 261101) · llegixDadesObertes a l'adaptador de
 * Supabase: una sola petició ANÒNIMA a app_content (feedPosts i events del
 * tenant), mai section_submissions ni notes; memoria i memoriaOral null; seed i
 * local sense xarxa.
 */
import { beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ request: vi.fn(), ambServidor: true, tenant: '00000000-0000-4000-8000-000000000000' }));
vi.mock('./runtime.js', () => ({
  request: m.request,
  getResolvedConfig: (config = {}) => ({ tenantId: m.tenant, hasSupabaseConfig: m.ambServidor, runtimeDataMode: config.dataMode || 'remote' }),
  buildSeedAppData: async () => ({ feedPosts: [{ id: 'llavor-noticia' }], events: [{ id: 'llavor-acte' }] })
}));
import { llegixDadesObertes } from './dadesObertes.js';
import { LIMIT_DADES_OBERTES } from '../contracte.js';

const POBLE = Object.freeze({ slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
const RUTA = '/rest/v1/app_content?select=key,payload&key=in.(feedPosts,events)&tenant_id=eq.00000000-0000-4000-8000-000000000000';

beforeEach(() => {
  m.request.mockReset();
  m.ambServidor = true;
  m.tenant = '00000000-0000-4000-8000-000000000000';
});

test('remot: una sola petició anònima a app_content del tenant, amb el senyal; memoria i memoriaOral null', async () => {
  const noticia = { id: 'ban', title: 'Ban', author_org_id: 'ajuntament' };
  const acte = { id: 'festa', title: 'Festa' };
  m.request.mockResolvedValueOnce([{ key: 'events', payload: [acte] }, { key: 'feedPosts', payload: [noticia] }]);
  const control = new AbortController();
  const config = { dataMode: 'remote', jwt: 'no-ha-de-viatjar' };
  await expect(llegixDadesObertes({ poble: POBLE, signal: control.signal }, config))
    .resolves.toEqual({ noticies: [noticia], agenda: [acte], memoria: null, memoriaOral: null });
  expect(m.request).toHaveBeenCalledTimes(1);
  expect(m.request).toHaveBeenCalledWith(RUTA, config, { signal: control.signal, anonim: true });
  expect(m.request.mock.calls[0][0]).not.toMatch(/section_submissions|notes|marketItems|xat/);
});

test('remot: el senyal de config si el filtre no en porta; una clau absent (o amb payload null) dona [], i una clau aliena no hi entra', async () => {
  const control = new AbortController();
  m.request.mockResolvedValueOnce([{ key: 'feedPosts', payload: null }, { key: 'towns', payload: [{ id: 'colat' }] }]);
  await expect(llegixDadesObertes({ poble: POBLE }, { signal: control.signal }))
    .resolves.toEqual({ noticies: [], agenda: [], memoria: null, memoriaOral: null });
  expect(m.request.mock.calls[0][2]).toEqual({ signal: control.signal, anonim: true });
});

test('Gauntlet D-03 · un payload que no és cap llista (un objecte, un text, un nombre) és un TypeError, sense avís ni paquet buit', async () => {
  const avis = vi.spyOn(console, 'warn');
  try {
    for (const payload of [{}, { id: 'no-llista' }, 'text', 0, false]) {
      m.request.mockResolvedValueOnce([{ key: 'events', payload: [] }, { key: 'feedPosts', payload }]);
      await expect(llegixDadesObertes({ poble: POBLE }, {}), JSON.stringify(payload))
        .rejects.toThrow(new TypeError('app_content «feedPosts» no és cap llista: el paquet no es fa amb una font malmesa.'));
    }
    expect(avis).not.toHaveBeenCalled();
  } finally { avis.mockRestore(); }
});

test('remot: una resposta que no és llista, una clau repetida o una llista per damunt del sostre s’aturen', async () => {
  m.request.mockResolvedValueOnce({ key: 'feedPosts' });
  await expect(llegixDadesObertes({ poble: POBLE }, {})).rejects.toThrow(TypeError);
  m.request.mockResolvedValueOnce([{ key: 'events', payload: [] }, { key: 'events', payload: [] }]);
  await expect(llegixDadesObertes({ poble: POBLE }, {})).rejects.toThrow(/dues files/);
  m.request.mockResolvedValueOnce([{ key: 'feedPosts', payload: Array.from({ length: LIMIT_DADES_OBERTES + 1 }, (_, i) => ({ id: `n-${i}` })) }]);
  await expect(llegixDadesObertes({ poble: POBLE }, {})).rejects.toThrow(RangeError);
});

test('sense servidor o sense tenant: error clar i cap petició', async () => {
  m.ambServidor = false;
  await expect(llegixDadesObertes({ poble: POBLE }, {})).rejects.toThrow('Falta configuració de dades del poble.');
  m.ambServidor = true;
  m.tenant = null;
  await expect(llegixDadesObertes({ poble: POBLE }, {})).rejects.toThrow('Falta configuració de dades del poble.');
  expect(m.request).not.toHaveBeenCalled();
});

test('seed: la llavor sense xarxa; local: tot null sense xarxa', async () => {
  await expect(llegixDadesObertes({ poble: POBLE }, { dataMode: 'seed' }))
    .resolves.toEqual({ noticies: [{ id: 'llavor-noticia' }], agenda: [{ id: 'llavor-acte' }], memoria: null, memoriaOral: null });
  await expect(llegixDadesObertes({ poble: POBLE }, { dataMode: 'local' }))
    .resolves.toEqual({ noticies: null, agenda: null, memoria: null, memoriaOral: null });
  expect(m.request).not.toHaveBeenCalled();
});

test('un poble que no és { slug, nom } de text no buit és un TypeError, sense petició', async () => {
  for (const filtre of [{}, { poble: null }, { poble: { slug: 'x' } }, { poble: { slug: ' ', nom: 'X' } }, { poble: { slug: 'x', nom: 3 } }]) {
    await expect(llegixDadesObertes(filtre, {}), JSON.stringify(filtre)).rejects.toThrow(TypeError);
  }
  expect(m.request).not.toHaveBeenCalled();
});
