// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const ID = '10000000-0000-4000-8000-000000000001';
const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), user: null }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, request: m.request,
  getResolvedConfig: () => ({ runtimeDataMode: 'remote', supabaseUrl: 'https://backend.example.test' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => m.user, jwtPerBackend: () => 'test' }));
import { bytesAdjuntXat } from './xatXifrat.js';

const ajornada = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const resposta = (parts, cap = null) => ({ ok: true, status: 200, headers: { get: () => cap },
  body: new ReadableStream({ start(control) { for (const part of parts) control.enqueue(part); control.close(); } }),
  arrayBuffer: vi.fn(async () => { const bytes = new Uint8Array(parts.reduce((n,p) => n+p.length, 0)); let pos=0; for(const p of parts){bytes.set(p,pos);pos+=p.length;} return bytes.buffer; }) });
beforeEach(() => {
  m.user = { id: A }; m.rpc.mockReset(); m.request.mockReset();
  m.rpc.mockResolvedValue([{ ruta: ID }]);
  m.request.mockResolvedValue({ signedURL: `/object/sign/xat_adjunts/${ID}?token=sintetic` });
});
afterEach(() => vi.unstubAllGlobals());

test('sense Content-Length, un cos en chunks de la mida exacta es baixa sense arrayBuffer global', async () => {
  const r = resposta([new Uint8Array(40).fill(1), new Uint8Array(24).fill(2)]);
  vi.stubGlobal('fetch', vi.fn(async () => r));
  const bytes = await bytesAdjuntXat(ID, { midaEsperada: 64 });
  expect(bytes).toHaveLength(64); expect(bytes[63]).toBe(2);
  expect(r.arrayBuffer).not.toHaveBeenCalled();
});

test('sense reader es rebutja abans de reservar un arrayBuffer sense sostre', async () => {
  const arrayBuffer = vi.fn(async () => new ArrayBuffer(64));
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, headers: { get: () => '64' }, arrayBuffer })));
  await expect(bytesAdjuntXat(ID, { midaEsperada: 64 })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
  expect(arrayBuffer).not.toHaveBeenCalled();
});

test('sense mida esperada es conserva el sostre dur de 20 MB', async () => {
  const read = vi.fn(async () => ({ value: new Uint8Array(20_000_001), done: false })), cancel = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, headers: { get: () => null }, body: { getReader: () => ({ read, cancel, releaseLock: vi.fn() }) } })));
  await expect(bytesAdjuntXat(ID)).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
  expect(read).toHaveBeenCalledOnce(); expect(cancel).toHaveBeenCalledOnce();
});

test.each([-1, 0, 63, 20_000_001, Infinity, NaN, '64'])('una mida esperada invàlida %s no reserva ni signa cap URL', async (midaEsperada) => {
  await expect(bytesAdjuntXat(ID, { midaEsperada })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(m.request).not.toHaveBeenCalled();
});

test('el primer chunk que supera el sostre interromp la lectura i cancel·la el stream', async () => {
  const cancel = vi.fn(), read = vi.fn().mockResolvedValueOnce({ value: new Uint8Array(65), done: false });
  const r = { ok: true, headers: { get: () => null }, body: { getReader: () => ({ read, cancel, releaseLock: vi.fn() }) }, arrayBuffer: vi.fn(async () => new ArrayBuffer(65)) };
  vi.stubGlobal('fetch', vi.fn(async () => r));
  await expect(bytesAdjuntXat(ID, { midaEsperada: 64 })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
  expect(read).toHaveBeenCalledOnce(); expect(cancel).toHaveBeenCalledOnce(); expect(r.arrayBuffer).not.toHaveBeenCalled();
});

test.each(['-1', '20000001', 'x', '65'])('Content-Length invàlid o incoherent %s falla abans de llegir cap cos', async cap => {
  const r = resposta([new Uint8Array(64)], cap); const reader = vi.spyOn(r.body, 'getReader');
  vi.stubGlobal('fetch', vi.fn(async () => r));
  await expect(bytesAdjuntXat(ID, { midaEsperada: 64 })).rejects.toMatchObject({ codi: 'adjunt-incoherent' });
  expect(reader).not.toHaveBeenCalled(); expect(r.arrayBuffer).not.toHaveBeenCalled();
});

test('una cancel·lació quan el cos encara està arribant talla i no lliura bytes', async () => {
  const pendent = ajornada(), cancel = vi.fn(), signal = new AbortController();
  const read = vi.fn(() => pendent.promise);
  const r = { ok: true, headers: { get: () => null }, body: { getReader: () => ({ read, cancel, releaseLock: vi.fn() }) }, arrayBuffer: vi.fn(() => pendent.promise) };
  vi.stubGlobal('fetch', vi.fn(async () => r));
  const feina = bytesAdjuntXat(ID, { midaEsperada: 64, signal: signal.signal });
  const resultat = feina.then(value => ({ value }), error => ({ error }));
  await vi.waitFor(() => expect(read).toHaveBeenCalledOnce());
  signal.abort(); pendent.resolve({ value: new Uint8Array(64), done: false });
  expect(await resultat).toMatchObject({ error: { name: 'AbortError' } });
  expect(cancel).toHaveBeenCalled();
});

test('canviar de persona mentre arriba un chunk no lliura el cos a la nova sessió', async () => {
  const pendent = ajornada(), cancel = vi.fn(), read = vi.fn(() => pendent.promise);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, headers: { get: () => null }, body: { getReader: () => ({ read, cancel, releaseLock: vi.fn() }) } })));
  const feina = bytesAdjuntXat(ID, { midaEsperada: 64 }), resultat = feina.then(value => ({ value }), error => ({ error }));
  await vi.waitFor(() => expect(read).toHaveBeenCalledOnce());
  m.user = { id: 'bbbbbbbb-2222-4222-8222-222222222222' }; pendent.resolve({ value: new Uint8Array(64), done: false });
  expect(await resultat).toMatchObject({ error: { name: 'AbortError' } }); expect(cancel).toHaveBeenCalled();
});
