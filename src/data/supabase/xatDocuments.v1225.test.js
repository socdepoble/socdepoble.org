// @vitest-environment node
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { publicaAdjuntXat, urlAdjuntXat } from './xatMultimedia.js';
import { cercaMissatgesFilPaginada, carregaMissatgeFilPerId } from './xatCerca.js';
const F = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', U = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const m = vi.hoisted(() => ({ rpc: vi.fn(), request: vi.fn(), entrada: 1 }));
vi.mock('./runtime.js', () => ({ rpc: m.rpc, request: m.request, getResolvedConfig: () => ({ runtimeDataMode: 'remote', supabaseUrl: 'https://node.invalid', supabaseAnonKey: 'public' }) }));
vi.mock('../identitat.js', () => ({ usuariDeSessio: () => ({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }), entradaSessio: () => m.entrada,
  jwtPerBackend: () => 'fixture', capturaSessio: () => { const entrada = m.entrada; return () => { if (entrada !== m.entrada) throw new DOMException('Canvi de sessió', 'AbortError'); }; } }));
beforeEach(() => {
  m.entrada = 1; vi.clearAllMocks(); vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
  m.rpc.mockImplementation(async (nom, params) => {
    if (nom === 'xat_reserva_adjunt') return { ruta: ID, pujat: false };
    if (nom === 'xat_publica_adjunt') return { id: ID, fil_id: F, seq: 1, tipus: 'document', usuari_id: U, cos: null };
    if (nom === 'xat_llegix_adjunt') return { ruta: params.p_id, tipus: 'document' };
    return [{ id: ID, fil_id: F, seq: '1', cos: 'Café', creat_al: '2026-11-25T02:01:02.123456Z' }];
  });
  m.request.mockResolvedValue({ signedURL: `/object/sign/xat_adjunts/${ID}?token=fixture` });
});
afterEach(() => vi.unstubAllGlobals());
test('document vàlid passa reserva/Storage/publicació; HTML disfressat no reserva res', async () => {
  const entrada = { id: ID, fitxer: new Blob(['Nom,collita\nPepa,oliva'], { type: 'text/csv' }), tipus: 'document' };
  expect((await publicaAdjuntXat(F, entrada)).tipus).toBe('document');
  expect(m.rpc.mock.calls.map(c => c[0])).toEqual(['xat_reserva_adjunt', 'xat_publica_adjunt']);
  vi.clearAllMocks();
  await expect(publicaAdjuntXat(F, { ...entrada, fitxer: new Blob(['<svg onload="alert(1)">'], { type: 'text/plain' }) })).rejects.toMatchObject({ code: 'document-format' });
  expect(m.rpc).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
});
test('documents sempre signats per attachment, inclosa la reutilització de cache', async () => {
  expect(await urlAdjuntXat(ID)).toContain('&download=');
  expect(await urlAdjuntXat(ID)).toContain('&download=');
  expect(m.request).toHaveBeenCalledTimes(1);
});
test('cerca usa cursor v2 de data/seq sense perdre microsegons', async () => {
  const result = await cercaMissatgesFilPaginada(F, 'cafe', { limit: 1 });
  expect(result.seguent).toEqual({ creatAl: '2026-11-25T02:01:02.123456Z', seq: 1 });
  await cercaMissatgesFilPaginada(F, 'cafe', { limit: 1, abansDe: result.seguent });
  expect(m.rpc.mock.calls.at(-1)[1]).toMatchObject({ p_abans_seq: 1, p_abans_de: '2026-11-25T02:01:02.123456Z' });
  expect(m.rpc.mock.calls.at(-1)[0]).toBe('xat_cerca_missatges_fil_v2');
});
test('canvi de sessió i fila d’un altre fil no passen al consumidor', async () => {
  m.rpc.mockImplementationOnce(async () => { m.entrada++; return []; });
  await expect(cercaMissatgesFilPaginada(F, 'cafe')).rejects.toMatchObject({ name: 'AbortError' });
  m.rpc.mockResolvedValueOnce([{ id: ID, fil_id: U, seq: 1 }]);
  await expect(carregaMissatgeFilPerId(F, ID)).rejects.toThrow(/invàlida/);
});
