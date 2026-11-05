import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../supabase/index.js', () => { throw new Error('SUPABASE_NO_HA_D_ENTRAR_AL_BUILD_NODE0'); });
beforeEach(() => { vi.resetModules(); vi.stubEnv('VITE_SDP_NODE0_PRIVAT','0'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const carrega = async flag => { vi.stubEnv('VITE_SDP_NODE0_HTTP', flag); return import('./arrencadaNodeZero.js'); };

test.each([undefined, '', '0', 'true', 'yes', '01'])('la bandera %s no activa Node 0, tampoc al seu hostname ni per declaració de l’amfitrió', async flag => {
  const helper = await carrega(flag);
  vi.stubGlobal('SocDePobleConfig', { VITE_SDP_NODE0_HTTP: '1', backendUrl: 'https://evil.invalid/api' });
  const fetchImpl = vi.fn(() => { throw new Error('No hi ha d’haver transport'); });
  expect(helper.NODE_ZERO_HTTP_ACTIU).toBe(false);
  expect(await helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl })).toBeNull();
  expect(fetchImpl).not.toHaveBeenCalled();
  expect((await import('../backendPort.js')).getBackendImplementation()).toEqual({});
  expect((await import('../../config/capaDelPaquet.js')).capaDelPaquet().backendId).not.toBe('sdp-node0-http');
});

test('el pla té origen exacte, tenant local fix i només claus de paquet; cap clau Supabase ni OAuth', async () => {
  const helper = await carrega('1');
  const capa = helper.capaNodeZeroHttp('https://socdepoble.cat');
  expect(capa).toEqual({ backendId: 'sdp-node0-http', supabaseUrl: 'https://socdepoble.cat/api/v1/node0', tenantId: 'ac3bec76-255b-5ca2-8886-28fcceab4267', dataMode: 'remote' });
  expect(Object.isFrozen(capa)).toBe(true);
  expect(helper.capaNodeZeroHttp('http://127.0.0.1:4349').supabaseUrl).toBe('http://127.0.0.1:4349/api/v1/node0');
  for (const value of ['https://socdepoble.cat/', 'https://socdepoble.cat/node0', 'https://socdepoble.cat?x', 'https://token@socdepoble.cat', 'http://socdepoble.cat', '//socdepoble.cat', ' https://socdepoble.cat', 'null']) expect(() => helper.capaNodeZeroHttp(value), value).toThrow(TypeError);
});

test('preparació real → configura → arrenca → lectura pel port, sense importar Supabase ni escriure com a convidat', async () => {
  const helper = await carrega('1');
  const fetchImpl = vi.fn(async (url, init) => {
    expect(url).toBe('https://socdepoble.cat/api/v1/node0/core');
    expect(init.method).toBe('GET'); expect(init.credentials).toBe('omit');
    return new Response(JSON.stringify({ towns: [{ id: 'la-torre', title: 'Node 0 PostgreSQL' }], pages: [], agents: [] }), { headers: { 'Content-Type': 'application/json' } });
  });
  const first = helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl });
  expect(helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl })).toBe(first);
  expect(() => helper.preparaArrencadaNodeZero('https://other.invalid', { fetchImpl })).toThrow('ja està fixat');
  const receipt = await first;
  expect(receipt).toMatchObject({ actiu: true, lecturaPublica: true, escriptura: false, autenticacio: false, xat: false });
  const capa = await import('../../config/capaDelPaquet.js');
  expect(capa.capaDelPaquet()).toEqual(receipt.capa);
  const host = await import('../../host.js');
  const port = await import('../backendPort.js');
  expect((await import('../../hostEstatIntern.js')).estatArrencada._segellat).toBe(false);
  host.configura({ auth: { issuer: 'https://socdepoble.cat/auth', audiences: ['node0'], persistencia: 'pestanya' } });
  await host.arrenca();
  expect((await import('../../config/backendConfig.js')).normalizeBackendConfig()).toMatchObject({ backendId: 'sdp-node0-http', backendUrl: 'https://socdepoble.cat/api/v1/node0', tenantId: helper.TENANT_NODE_ZERO, dataMode: 'remote' });
  expect((await port.loadCoreContent()).towns[0].title).toBe('Node 0 PostgreSQL');
  expect(port.getCurrentUser()).toBeNull();
  expect(port.teCapacitat('salut')).toBe(true); expect(port.teCapacitat('sessio')).toBe(false);
  await expect(port.appendSectionSubmissionNetworkOnly({ title: 'No publicar' })).rejects.toMatchObject({ codi: 'sense-capacitat' });
  expect(() => host.injectaBackendDelPaquet(port.getBackendImplementation())).toThrow('arrancada');
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test('la tria de la bandera queda capturada pel mòdul i una capa prèvia incompatible rebutja sense fallback', async () => {
  const helper = await carrega('1');
  vi.stubEnv('VITE_SDP_NODE0_HTTP', '0');
  expect(helper.NODE_ZERO_HTTP_ACTIU).toBe(true);
  const { fixaCapaDelPaquet } = await import('../../config/capaDelPaquet.js');
  fixaCapaDelPaquet({ backendId: 'existing', dataMode: 'remote' });
  const fetchImpl = vi.fn();
  const pending = helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl });
  await expect(pending).rejects.toThrow('immutable');
  expect(helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl })).toBe(pending);
  expect((await import('../backendPort.js')).getBackendImplementation()).toEqual({});
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('una sessió anterior de Supabase no migra al Node 0 ni reapareix per injectaSessio', async () => {
  const helper = await carrega('1');
  const identity = await import('../identitat.js');
  const oldSession = { access_token: 'fixture-old-supabase-token', user: { id: '12345678-1234-4234-8234-123456789abc', full_name: 'Persona de prova' } };
  identity.configuraBackendSessio({ backendId: 'supabase', backendUrl: 'https://previous.supabase.test', tenantId: '11111111-2222-3333-4444-555555555555', dataMode: 'remote' });
  expect(identity.desaSessio(oldSession)).toBe(true);
  expect(identity.usuariDeSessio()?.id).toBe(oldSession.user.id);
  const fetchImpl = vi.fn();
  await helper.preparaArrencadaNodeZero('https://socdepoble.cat', { fetchImpl });
  const host = await import('../../host.js');
  host.configura({ auth: { issuer: 'https://socdepoble.cat/auth', persistencia: 'pestanya' } });
  expect(identity.usuariDeSessio()).toBeNull();
  expect(host.injectaSessio(oldSession)).toBe(false);
  expect(identity.usuariDeSessio()).toBeNull();
  await host.arrenca();
  expect((await import('../backendPort.js')).getCurrentUser()).toBeNull();
  expect(fetchImpl).not.toHaveBeenCalled();
});
