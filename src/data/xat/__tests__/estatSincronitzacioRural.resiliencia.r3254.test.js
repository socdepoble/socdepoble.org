import { expect, test, vi } from 'vitest';
import { construeixAmbitCuaRural, creaCuaSincronitzacioRural } from '../estatSincronitzacioRural.js';
const AMBIT = construeixAmbitCuaRural({ backend: 'rural-fixture', tenantId: 'poble', usuariId: 'persona' });
const FIL = 'ffffffff-eeee-4ddd-8ccc-bbbbbbbbbbbb';
const ID1 = '11111111-2222-4333-8444-555555555555', ID2 = '22222222-2222-4333-8444-555555555555';
const entrada = (id, text = 'Bon dia') => ({ filId: FIL, client_msg_id: id, text });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
test('disc async lent: dos encua simultanis no confirmen snapshots que perden missatges en recarregar', async () => {
  let disk = [];
  const adapter = { desa: async (_scope, rows) => { const snapshot = structuredClone(rows); await pause(rows.length === 1 ? 30 : 1); disk = snapshot; }, carrega: async () => structuredClone(disk) };
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adapter });
  const receipts = await Promise.all([cua.encua(entrada(ID1)), cua.encua(entrada(ID2))]);
  expect(receipts.every(row => row.persistitLocal)).toBe(true);
  const reloaded = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adapter });
  expect((await reloaded.hidrataAmbit()).map(row => row.client_msg_id).sort()).toEqual([ID1, ID2]);
});
test('quota seguida de reintent amb el mateix UUID torna a provar el disc sense duplicar payload', async () => {
  let disk = [];
  const write = vi.fn().mockRejectedValueOnce(new DOMException('Disc ple', 'QuotaExceededError'))
    .mockImplementation(async (_scope, rows) => { disk = structuredClone(rows); });
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: { desa: write } });
  expect(await cua.encua(entrada(ID1))).toMatchObject({ persistitLocal: false, avisPersistencia: 'QuotaExceededError' });
  expect(await cua.encua(entrada(ID1))).toMatchObject({ persistitLocal: true, avisPersistencia: null });
  expect(write).toHaveBeenCalledTimes(2); expect(disk).toHaveLength(1); expect(cua.llistaMissatges()).toHaveLength(1);
});
test('purga mentre una escriptura està en vol: el commit antic no ressuscita dades en disc', async () => {
  let disk = [], release;
  const adapter = { desa: async (_scope, rows) => { await new Promise(resolve => { release = resolve; }); disk = structuredClone(rows); },
    esborra: async () => { disk = []; }, carrega: async () => structuredClone(disk) };
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT, adaptadorPersistencia: adapter });
  const pending = cua.encua(entrada(ID1));
  await vi.waitFor(() => expect(release).toEqual(expect.any(Function)));
  const purge = cua.purgaAmbit(AMBIT); release();
  const receipt = await pending; await purge;
  expect(receipt.persistitLocal).toBe(false); expect(disk).toEqual([]);
  expect(cua.obteAmbitActiu()).toBeNull(); expect(cua.llistaMissatges(AMBIT)).toEqual([]);
});
test('tall després d’acceptar servidor: reintent usa el mateix UUID i no inventa seq sense ACK', async () => {
  const cua = creaCuaSincronitzacioRural({ ambitInicial: AMBIT });
  await cua.encua(entrada(ID1)); const accepted = new Map();
  const send = vi.fn(async (_fil, payload) => {
    if (!accepted.has(payload.client_msg_id)) { accepted.set(payload.client_msg_id, { id: payload.client_msg_id, seq: 9 }); throw new TypeError('ACK perdut'); }
    return accepted.get(payload.client_msg_id);
  });
  expect((await cua.drenaPendents(send))[0]).toMatchObject({ ok: false, registre: { seq: null, estat: 'error_reintentable' } });
  expect((await cua.drenaPendents(send, { forca: true }))[0]).toMatchObject({ ok: true, registre: { seq: 9, estat: 'enviat_servidor' } });
  expect(accepted.size).toBe(1); expect(send).toHaveBeenCalledTimes(2);
});
