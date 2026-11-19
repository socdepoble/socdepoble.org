// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { creaFrontissa } from './creaFrontissa.js';
import { RECURSOS } from './recursos.js';
const descriptor = extra => ({ enabled: true, captureId: 'LAB-synthetic-v1', path: '/lab/perfil', params: ['q'], maxBytes: 4096, timeoutMs: 20,
  decode: RECURSOS.perfil.traductor, ...extra });
const setup = (fetchImpl, extra = {}, options = {}) => creaFrontissa({ apiOrigin: 'https://lab.example.test', allowedOrigins: ['https://lab.example.test'], resources: { perfil: descriptor(extra) }, fetchImpl, ...options });
const fixture = { id: 'LAB-persona', email: 'persona@example.test', name: 'Persona LAB', tenant: 'foreign', is_admin: true };
const response = () => new Response(JSON.stringify(fixture), { headers: { 'content-type': 'application/json' } });
afterEach(() => vi.useRealTimers());

test.each(['fetch','stream'])('Sollutia LAB: timeout retorna encara que %s ignore AbortSignal', async fase => {
  vi.useFakeTimers();
  const fetch = vi.fn(async () => fase === 'fetch' ? new Promise(() => {}) : { ok: true, headers: new Headers({ 'content-type': 'application/json' }), body: { getReader: () => ({ read: () => new Promise(() => {}), cancel: () => new Promise(() => {}), releaseLock() {} }) } });
  let estat = null;
  const resultat = setup(fetch)('perfil').then(() => { estat = 'SUCCESS'; }, e => { estat = e.code; });
  await vi.advanceTimersByTimeAsync(25);
  expect(estat).toBe('TIMEOUT'); await resultat;
});

test('Sollutia LAB: DTO és síncron i no admet un decoder async', async () => {
  await expect(setup(async () => response(), { decode: async raw => raw })('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('Sollutia LAB: la instantània DTO queda separada i congelada també en camps fills', async () => {
  const dto = { name: 'LAB', detall: { etiqueta: 'abans' } };
  const resultat = await setup(async () => response(), { decode: () => dto })('perfil');
  dto.detall.etiqueta = 'després';
  expect(resultat.detall.etiqueta).toBe('abans'); expect(Object.isFrozen(resultat.detall)).toBe(true);
});

test('Sollutia LAB: canvi de sessió/tenant durant HTTP no lliura el DTO al consumidor', async () => {
  let context = 'tenant-A/session-1';
  const capturaContext = () => { const capturat = context; return () => { if (context !== capturat) throw new Error('STALE_CONTEXT'); }; };
  const fetch = vi.fn(async () => { context = 'tenant-B/session-2'; return response(); });
  await expect(setup(fetch, {}, { capturaContext })('perfil')).rejects.toMatchObject({ code: 'CONTEXT_CHANGED' });
});

test.each([{ captureId: {} }, { captureId: ' ' }, { params: ['q', 'q'] }, { params: [{}] }, { path: '/lab/%2e%2e/perfil' }, { path: '/lab/%00' }])('Sollutia LAB: descriptor sense captura o ruta inequívoca falla %j', invalida => {
  expect(() => setup(vi.fn(), invalida)).toThrow('INVALID_RESOURCE');
});

test('Sollutia LAB: query no executa accessors ni coaccions d’objectes', async () => {
  const get = vi.fn(() => 'secret'), params = {}; Object.defineProperty(params, 'q', { enumerable: true, get });
  const fetch = vi.fn();
  await expect(setup(fetch)('perfil', params)).rejects.toMatchObject({ code: 'INVALID_QUERY' });
  expect(get).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});

test.each([{ id: '', email: 'x@example.test', name: 'Nom' }, { id: 'x', email: ' ', name: 'Nom' }, { id: 'x', email: 'x@example.test', name: '' }])('Sollutia LAB: perfil incomplet no és DTO vàlid %j', forma => {
  expect(() => RECURSOS.perfil.traductor(forma)).toThrow();
});

test('Sollutia LAB: GET no transporta credencials/autoritat i camps afegits no travessen el traductor', async () => {
  const fetch = vi.fn(async () => response());
  const dto = await setup(fetch)('perfil', { q: 'poble' });
  expect(dto).toEqual({ id: fixture.id, email: fixture.email, name: fixture.name, display_name: fixture.name });
  expect(fetch.mock.calls[0]).toEqual(['https://lab.example.test/lab/perfil?q=poble', expect.objectContaining({ method: 'GET', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json' } })]);
  for (const params of [{ tenant: 'B' }, { is_admin: true }, { q: { toString: 0 } }]) await expect(setup(fetch)('perfil', params)).rejects.toMatchObject({ code: 'INVALID_QUERY' });
});

test('Sollutia LAB: decoder async rebutjat no deixa una promesa rebutjada sense consumidor', async () => {
  await expect(setup(async () => response(), { decode: async () => { throw new Error('privat'); } })('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('Sollutia LAB: perfil/getter i DTO/getter es rebutgen sense executar-los', async () => {
  const get = vi.fn(() => 'secret'), raw = { ...fixture }; Object.defineProperty(raw, 'id', { enumerable: true, get });
  expect(() => RECURSOS.perfil.traductor(raw)).toThrow(); expect(get).not.toHaveBeenCalled();
  const dto = {}; Object.defineProperty(dto, 'name', { enumerable: true, get });
  await expect(setup(async () => response(), { decode: () => dto })('perfil')).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });
  expect(get).not.toHaveBeenCalled();
});

test.each([401,403,429])('Sollutia LAB: HTTP%s no retorna autoritat ni executa decoder', async status => {
  const decode = vi.fn();
  await expect(setup(async () => new Response(null, { status }), { decode })('perfil')).rejects.toMatchObject({ status });
  expect(decode).not.toHaveBeenCalled();
});

test('Sollutia LAB: cancel·lació del consumidor limita fetch que ignora signal i no retorna dades tardanes', async () => {
  const c = new AbortController(); let resol;
  const lectura = setup(() => new Promise(r => { resol = r; }))('perfil', {}, { signal: c.signal });
  c.abort(); await expect(lectura).rejects.toMatchObject({ code: 'CANCELLED' });
  resol(response()); await Promise.resolve();
});
