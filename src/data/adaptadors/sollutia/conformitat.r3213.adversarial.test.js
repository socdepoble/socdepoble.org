// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { creaFrontissa } from './creaFrontissa.js';
import { RECURSOS } from './recursos.js';
import { llig } from './client.js';
const origin = 'https://api.example.test';
const desc = extra => ({ enabled: true, captureId: 'LAB-r3213-v1', path: '/perfil', params: ['q'], maxBytes: 4096, timeoutMs: 100, decode: RECURSOS.perfil.traductor, ...extra });
const setup = (fetchImpl, extra = {}) => creaFrontissa({ apiOrigin: origin, allowedOrigins: [origin], resources: { perfil: desc(extra) }, fetchImpl });
const perfil = { id: 'LAB-1', name: 'Veïna', email: 'lab@example.test' };
const res = (body = JSON.stringify(perfil), headers = {}) => new Response(body, { headers: { 'content-type': 'application/json', ...headers } });
afterEach(() => vi.useRealTimers());

test.each(['__proto__', 'constructor', 'prototype'])('JSON no entrega claus perilloses al traductor: %s', async key => {
  const decode = vi.fn(() => ({ id: 'x' }));
  const body = JSON.stringify({ ...perfil, nested: JSON.parse(`{"${key}":{"polluted":true}}`) });
  await expect(setup(async () => res(body), { decode })('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  expect(decode).not.toHaveBeenCalled(); expect({}.polluted).toBeUndefined();
});

test.each([
  '{', '[', 'null', '"x"', '{"id":"x"}',
  '{"id":{},"name":"x","email":"x@example.test"}',
  '{"id":"x","name":[],"email":"x@example.test"}',
  '{"id":"x","name":"x","email":false}'
])('resposta parcial o de forma incorrecta no retorna dades: %s', async body => {
  await expect(setup(async () => res(body))('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('JSON profund es rebutja abans del decoder encara que el DTO final siga menut', async () => {
  const decode = vi.fn(() => ({ name: 'x' }));
  await expect(setup(async () => res('{"x":' + '['.repeat(40) + '0' + ']'.repeat(40) + '}'), { decode })('perfil'))
    .rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  expect(decode).not.toHaveBeenCalled();
});

test('UTF-8 trencat és INVALID_PAYLOAD i cancel·la el lector', async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array([0x7b, 0x22, 0xff])); }, cancel });
  await expect(setup(async () => res(stream))('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  expect(cancel).toHaveBeenCalledOnce();
});

test.each(['headers', 'method', 'body', 'credentials', 'redirect'])('opcions de transport mutadores no acceptades: %s', async key => {
  const fetch = vi.fn();
  await expect(setup(fetch)('perfil', {}, { [key]: key === 'headers' ? { 'X-HTTP-Method-Override': 'DELETE' } : 'POST' }))
    .rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  expect(fetch).not.toHaveBeenCalled();
});

test('els accessors de les opcions no s’executen', async () => {
  const get = vi.fn(), options = {}; Object.defineProperty(options, 'signal', { enumerable: true, get });
  await expect(setup(vi.fn())('perfil', {}, options)).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  expect(get).not.toHaveBeenCalled();
});

test('un nom de recurs objecte no executa coercions', async () => {
  const toString = vi.fn(() => 'perfil'), fetch = vi.fn();
  await expect(setup(fetch)({ toString })).rejects.toMatchObject({ code: 'UNKNOWN_RESOURCE' });
  await expect(llig({ toString })).rejects.toMatchObject({ code: 'UNKNOWN_RESOURCE' });
  expect(toString).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test('descriptors/accessors no s’executen en construir el catàleg', () => {
  const get = vi.fn(() => true), source = desc(); Object.defineProperty(source, 'enabled', { enumerable: true, get });
  expect(() => creaFrontissa({ apiOrigin: origin, allowedOrigins: [origin], resources: { perfil: source }, fetchImpl: vi.fn() })).toThrow('INVALID_RESOURCE');
  expect(get).not.toHaveBeenCalled();
});

test('accessor del config principal i ruta doblement codificada fallen abans de GET', () => {
  const get = vi.fn(() => origin), config = { allowedOrigins: [origin], resources: {} };
  Object.defineProperty(config, 'apiOrigin', { enumerable: true, get });
  expect(() => creaFrontissa(config)).toThrow('INVALID_RESOURCE'); expect(get).not.toHaveBeenCalled();
  expect(() => setup(vi.fn(), { path: '/x/%252e%252e/private' })).toThrow('INVALID_RESOURCE');
});

test.each(['garbage', '-1', '1e5', '9999999999'])('Content-Length malformat/excessiu talla sense DTO: %s', async size => {
  const decode = vi.fn();
  await expect(setup(async () => res(undefined, { 'content-length': size }), { decode })('perfil'))
    .rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(decode).not.toHaveBeenCalled();
});

test('Content-Length mentider no evita comptar bytes reals', async () => {
  const fetch = vi.fn(async () => res(JSON.stringify({ ...perfil, extra: 'é'.repeat(4000) }), { 'content-length': '1' }));
  await expect(setup(fetch)('perfil')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
});

test('un HTTP 206 vàlid no es confon amb un recurs complet', async () => {
  const decode = vi.fn();
  await expect(setup(async () => new Response(JSON.stringify(perfil), { status: 206, headers: { 'content-type': 'application/json' } }), { decode })('perfil'))
    .rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  expect(decode).not.toHaveBeenCalled();
});

test('un transport que ignora redirect:error no pot entregar dades d’un altre origen', async () => {
  const response = res(); Object.defineProperty(response, 'url', { value: 'https://evil.example/secret' });
  await expect(setup(async () => response)('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('la URL de resposta ha de ser exactament el recurs consultat', async () => {
  const response = res(); Object.defineProperty(response, 'url', { value: origin + '/altra-persona' });
  await expect(setup(async () => response)('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('una resposta rebutjada abans de llegir el cos també el cancel·la', async () => {
  const cancel = vi.fn(), stream = new ReadableStream({ start() {}, cancel });
  await expect(setup(async () => res(stream, { 'content-length': '9000' }))('perfil')).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
  expect(cancel).toHaveBeenCalledOnce();
});

test('cancel·lació a mig stream allibera i no retorna el DTO tardà', async () => {
  const c = new AbortController(), cancel = vi.fn(); let controller;
  const stream = new ReadableStream({ start(x) { controller = x; x.enqueue(new TextEncoder().encode('{"id":')); }, cancel });
  const read = setup(async () => res(stream))('perfil', {}, { signal: c.signal });
  await Promise.resolve(); await Promise.resolve(); c.abort();
  await expect(read).rejects.toMatchObject({ code: 'CANCELLED' });
  expect(cancel).toHaveBeenCalledOnce(); expect(() => controller.enqueue(new TextEncoder().encode('null}'))).toThrow();
});

test('cancel·lació síncrona des del guard de context evita GET', async () => {
  const c = new AbortController(), fetch = vi.fn(async () => res());
  const read = creaFrontissa({ apiOrigin: origin, allowedOrigins: [origin], resources: { perfil: desc() }, fetchImpl: fetch,
    capturaContext: () => () => { c.abort(); } });
  await expect(read('perfil', {}, { signal: c.signal })).rejects.toMatchObject({ code: 'CANCELLED' });
  expect(fetch).not.toHaveBeenCalled();
});

test('cancel·lació síncrona durant el traductor no entrega el DTO', async () => {
  const c = new AbortController();
  await expect(setup(async () => res(), { decode: () => { c.abort(); return { name: 'tardà' }; } })('perfil', {}, { signal: c.signal }))
    .rejects.toMatchObject({ code: 'CANCELLED' });
});

test('fuzzing determinista de 1000 payloads no primitius, parcials i claus reservades', async () => {
  let seed = 0x132013;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  const bad = [null, false, 0, {}, [], ['nom'], { toString: 0 }];
  for (let i = 0; i < 1000; i++) {
    const key = ['id', 'name', 'email'][next() % 3];
    const v = { ...perfil, [key]: bad[next() % bad.length] };
    await expect(setup(async () => res(JSON.stringify(v)))('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  }
});
