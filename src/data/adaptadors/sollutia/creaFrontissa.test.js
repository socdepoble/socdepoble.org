import { expect, test, vi } from 'vitest';
import { creaFrontissa } from './creaFrontissa.js';
import { llig } from './client.js';
const descriptor = () => ({ enabled: true, captureId: 'synthetic-test-v1', path: '/sample', params: ['q'], maxBytes: 128,
  timeoutMs: 30, decode: raw => { if (typeof raw.name !== 'string') throw new Error(); return { name: raw.name }; } });
const setup = (fetchImpl, resource = descriptor()) => creaFrontissa({ apiOrigin: 'https://api.example.test', allowedOrigins: ['https://api.example.test'], resources: { sample: resource }, fetchImpl });
const response = body => new Response(body, { headers: { 'content-type': 'application/json' } });
test('només DTO del catàleg, descriptors copiats i transport sense credencials', async () => {
  const fetch = vi.fn(async () => response('{"name":"A","secret":"extra"}'));
  const resource = descriptor(); const read = setup(fetch, resource);
  resource.path = '/other'; resource.params.push('alien');
  expect(await read('sample', { q: 'x' })).toEqual({ name: 'A' });
  expect(fetch.mock.calls[0][0]).toBe('https://api.example.test/sample?q=x');
  expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', redirect: 'error', method: 'GET', headers: { Accept: 'application/json' } });
  await expect(read('sample', { alien: 'x' })).rejects.toMatchObject({ code: 'INVALID_QUERY' });
  for (const name of ['https://evil.test/', '//evil.test/', 'missing']) await expect(read(name)).rejects.toMatchObject({ code: 'UNKNOWN_RESOURCE' });
});
test('catàleg de producció tancat; no convertix issuer en API', async () => {
  await expect(llig('/perfil')).rejects.toMatchObject({ code: 'UNKNOWN_RESOURCE' });
  expect(() => setup(vi.fn(), { ...descriptor(), path: '//evil.test/x' })).toThrow('INVALID_RESOURCE');
});
test('cos gran, JSON invàlid, DTO incompatible i MIME incorrecte fallen', async () => {
  await expect(setup(async () => response('x'.repeat(129)))('sample')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  await expect(setup(async () => response('{'))('sample')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  await expect(setup(async () => response('{}'))('sample')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  await expect(setup(async () => new Response('html'))('sample')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});
test('cancel·lació prèvia evita xarxa; timeout inclou la descàrrega del cos', async () => {
  const controller = new AbortController(); controller.abort(); const fetch = vi.fn();
  await expect(setup(fetch)('sample', {}, { signal: controller.signal })).rejects.toMatchObject({ code: 'CANCELLED' });
  expect(fetch).not.toHaveBeenCalled();
  const read = setup(async (_url, { signal }) => new Response(new ReadableStream({ start(controller) {
    signal.addEventListener('abort', () => controller.error(new DOMException('Abort', 'AbortError')));
  } }), { headers: { 'content-type': 'application/json' } }));
  await expect(read('sample')).rejects.toMatchObject({ code: 'TIMEOUT' });
});
