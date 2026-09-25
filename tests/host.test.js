import { expect, test, vi } from 'vitest';
vi.mock('../src/PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../src/config/runtimePolicy.js', () => ({ setRuntimePolicy: vi.fn(), getRuntimePolicy: () => ({}), esOrigenParePermes: origin => origin === 'https://pare.example.test' }));
vi.mock('../src/data/identitat.js', () => ({ adoptaSessioExterna: vi.fn(() => true), esborraSessio: vi.fn() }));
vi.mock('../src/utils/sanitize.js', () => ({ sanitizeHtml: x => x }));
import { CONTRACTE_NUCLI } from '../src/data/contracte.js';
import { setBackendImplementation } from '../src/data/backendPort.js';
import { exposaGlobal, arrenca, configura, quanLlest } from '../src/host.js';
test('Model B, 1.000 ordres drenades i esperes cancel·lables abans d’arrencar', async () => {
  expect(() => configura({ backend: {} })).toThrow('Model B');
  window.SocDePobleCua = [['sessio', { access_token: 'synthetic' }]];
  exposaGlobal({});
  for (let i = 0; i < 1000; i++) expect(window.SocDePobleCua.push(['sessio', { access_token: 'synthetic' }])).toBe(0);
  expect(window.SocDePobleCua).toHaveLength(0);
  const controller = new AbortController();
  const pending = quanLlest({ signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  setBackendImplementation(Object.fromEntries(CONTRACTE_NUCLI.map(key => [key, vi.fn()])));
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
