// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { creaFrontissa } from './creaFrontissa.js';
import { creaServeiNoticies, MAXIM_RESPOSTA, MAXIM_XML } from '../noticies/client.js';

const ORIGEN = 'https://api.example.test';
const descriptor = maxBytes => ({ enabled: true, captureId: 'r3211-contracte-recursos', path: '/sample', params: [],
  maxBytes, timeoutMs: 1000, decode: value => ({ name: value.name }) });
const crea = (maxBytes, fetchImpl, decode) => creaFrontissa({ apiOrigin: ORIGEN, allowedOrigins: [ORIGEN],
  resources: { sample: { ...descriptor(maxBytes), ...(decode ? { decode } : {}) } }, fetchImpl });
const resposta = (body, headers = {}) => new Response(body, { headers: { 'content-type': 'application/json', ...headers } });

test('el pressupost compartit conserva el sobre JSON de Notícies, sense fer E/S en construir', async () => {
  const fetchImpl = vi.fn();
  expect(MAXIM_RESPOSTA).toBe(3 * 1024 * 1024);
  expect(MAXIM_XML).toBe(2 * 1024 * 1024);
  const servei = creaServeiNoticies({ apiOrigin: ORIGEN, fetchImpl });
  expect((await servei.fonts()).fonts.length).toBeGreaterThan(0);
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('un feed admés de més de 2.000.000 bytes continua passant pel GET segur i pel DTO', async () => {
  const xml = `<rss>${'x'.repeat(2_000_000)}</rss>`;
  const feed = { font: 'emowe', xml, obtingut: null, obsoleta: false };
  const fetchImpl = vi.fn(async url => new URL(url).pathname.endsWith('/fonts')
    ? resposta(JSON.stringify({ categories: [], fonts: [] }))
    : resposta(JSON.stringify({ ...feed, secret: 'descartat' }), { 'content-length': '1' }));
  const servei = creaServeiNoticies({ apiOrigin: ORIGEN, fetchImpl });
  const saved = await servei.feed('emowe');
  expect(saved).toEqual(feed);
  expect(Object.isFrozen(saved)).toBe(true);
  for (const [, init] of fetchImpl.mock.calls) expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error' });
});

test.each([0, -1, 1.5, NaN, Infinity, MAXIM_RESPOSTA + 1, Number.MAX_SAFE_INTEGER])('cap descriptor amplia el sostre verificat: %s', maxBytes => {
  const fetchImpl = vi.fn();
  expect(() => crea(maxBytes, fetchImpl)).toThrow('INVALID_RESOURCE');
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('el sostre de 3 MiB és inclusiu i es compta en bytes del transport', async () => {
  const body = JSON.stringify({ name: 'x'.repeat(MAXIM_RESPOSTA - 11) });
  expect(new TextEncoder().encode(body).byteLength).toBe(MAXIM_RESPOSTA);
  const read = crea(MAXIM_RESPOSTA, async () => resposta(body));
  const value = await read('sample');
  expect(value.name.length).toBe(MAXIM_RESPOSTA - 11);
  expect(Object.isFrozen(value)).toBe(true);
  await expect(crea(128, async () => resposta(JSON.stringify({ name: 'é'.repeat(64) })))('sample'))
    .rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
});

test('el límit propi del recurs continua sent menor que el sostre compartit', async () => {
  const resource = descriptor(128), decode = vi.fn(resource.decode);
  resource.decode = decode;
  const fetchImpl = vi.fn(async () => resposta(JSON.stringify({ name: 'x'.repeat(118) }), { 'content-length': '1' }));
  const read = creaFrontissa({ apiOrigin: ORIGEN, allowedOrigins: [ORIGEN], resources: { sample: resource }, fetchImpl });
  resource.maxBytes = MAXIM_RESPOSTA;
  await expect(read('sample')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(decode).not.toHaveBeenCalled();
  expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
});

test('Content-Length excessiu es rebutja abans de demanar el lector o el DTO', async () => {
  const getReader = vi.fn(), decode = vi.fn();
  const fetchImpl = vi.fn(async () => ({ ok: true, headers: new Headers({ 'content-type': 'application/json', 'content-length': String(MAXIM_RESPOSTA + 1) }),
    body: { getReader } }));
  await expect(crea(MAXIM_RESPOSTA, fetchImpl, decode)('sample')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(getReader).not.toHaveBeenCalled();
  expect(decode).not.toHaveBeenCalled();
  expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
});

test.each([undefined, '1'])('el byte 3 MiB + 1 es talla encara que Content-Length siga %s', async declared => {
  const cancel = vi.fn(), decode = vi.fn();
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAXIM_RESPOSTA + 1)); }, cancel });
  const response = resposta(stream, declared ? { 'content-length': declared } : {});
  const fetchImpl = vi.fn(async () => response);
  await expect(crea(MAXIM_RESPOSTA, fetchImpl, decode)('sample')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(decode).not.toHaveBeenCalled();
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(response.body.locked).toBe(false);
  expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
});
