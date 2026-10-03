import { expect, test, vi } from 'vitest';
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../src/config/runtimePolicy.js', () => ({ setRuntimePolicy: vi.fn(), getRuntimePolicy: () => ({}), esOrigenParePermes: origin => origin === 'https://pare.example.test' }));
vi.mock('../src/data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn(), configuraBackendSessio: vi.fn() }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: x => x }));
vi.mock('../src/apps/plataforma/registreApps.js', () => ({ registraAppExterna: vi.fn(() => ({ ok: true, errors: [], manifest: { id: 'reserves' } })) }));
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { setRuntimePolicy } from '../src/config/runtimePolicy.js';
import { adoptaSessioExterna } from '../src/data/identitat.js';
import { registraAppExterna } from '../src/apps/plataforma/registreApps.js';
import { CONTRACTE_AMFITRIO_V1 } from '../src/config/contracteAmfitrio.js';
import { exposaGlobal, arrenca, configura, quanLlest, VERBS_CUA } from '../src/host.js';

/* P0-b (261002): configura() continua llançant en veu alta amb un tenant que
   no és UUID, i no deixa cap política a mitges. Va primer: després de
   configurar, configura() ja no admet res. */
test('configura() amb un tenant que no és UUID llança i no fixa cap política', () => {
  for (const opcions of [{ tenant_id: 'poble' }, { config: { tenantId: 'x' } }, { config: { tenant_id: 42 } }]) {
    expect(() => configura(opcions), JSON.stringify(opcions)).toThrow('Abast invàlid');
  }
  expect(setRuntimePolicy).not.toHaveBeenCalled();
});

test('la cua només executa els verbs classificats; un verb desconegut o heretat d’Object.prototype no fa res', () => {
  expect([...VERBS_CUA].sort()).toEqual(Object.keys(CONTRACTE_AMFITRIO_V1.cua.verbs).sort());
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    window.SocDePobleCua = [['constructor'], ['toString'], ['hasOwnProperty'], ['borra'], 'sessio', null];
    exposaGlobal({});
    expect(window.SocDePobleCua).toHaveLength(0);
    expect(adoptaSessioExterna).not.toHaveBeenCalled();
    expect(setRuntimePolicy).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  } finally {
    error.mockRestore();
    delete window.SocDePobleCua;
  }
});

test('window.SocDePoble.registraApp delega en el registre de la Plataforma d’Apps i en torna el resultat', () => {
  const api = exposaGlobal({});
  expect(Object.keys(api).sort()).toEqual([...CONTRACTE_AMFITRIO_V1.api.claus].sort());
  const manifest = { schema: 'sdp.app.v1', id: 'reserves', element: 'sollutia-reserves' };
  expect(api.registraApp(manifest)).toEqual({ ok: true, errors: [], manifest: { id: 'reserves' } });
  expect(registraAppExterna).toHaveBeenCalledWith(manifest);
});

test('adaptador públic validat, 1.000 ordres drenades i esperes cancel·lables abans d’arrencar', async () => {
  expect(() => configura({ backend: {} })).toThrow('Nucli incomplet');
  window.SocDePobleCua = [['sessio', { access_token: 'synthetic' }]];
  exposaGlobal({});
  for (let i = 0; i < 1000; i++) expect(window.SocDePobleCua.push(['sessio', { access_token: 'synthetic' }])).toBe(0);
  expect(window.SocDePobleCua).toHaveLength(0);
  const controller = new AbortController();
  const pending = quanLlest({ signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  configura({ backend: Object.fromEntries(CONTRACTE_NUCLI.map(key => [key, vi.fn()])),
    backend_url: 'https://wordpress.example.test/wp-json/sdp', tenant_id: 'a1b2c3d4-0000-4000-8000-000000000001' });
  const ready = quanLlest({ signal: new AbortController().signal });
  await arrenca(); await expect(ready).resolves.toMatchObject({ fase: 'segellat' });
  delete window.SocDePobleCua;
});

test('el pont exigix origen exacte i la finestra del pare real', () => {
  const parent = { postMessage: vi.fn() };
  const spy = vi.spyOn(window, 'parent', 'get').mockReturnValue(parent);
  exposaGlobal({});
  parent.postMessage.mockClear();
  const data = { type: 'SDP_HOST_CMD', cmd: 'SDP_PING' };
  for (const [origin, source] of [['https://pare.example.test:444', parent], ['https://altre.example.test', parent], [window.location.origin, parent], ['https://pare.example.test', {}]]) {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data }));
  }
  expect(parent.postMessage).not.toHaveBeenCalled();
  window.dispatchEvent(new MessageEvent('message', { origin: 'https://pare.example.test', source: parent, data }));
  expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SDP_HOST_ACK', ok: true }), 'https://pare.example.test');
  spy.mockRestore();
});
