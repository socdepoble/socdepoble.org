// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { creaIdbCaosRural } from '../../utils/__fixtures__/idbCaosRural.js';
import { CLAU_ESTAT, NOM_BASE, STORE, creaMagatzemNevera } from './magatzem.js';
import { afig, estatInicial } from './nucli/index.js';
const opened = [];
const crea = disk => { const m = creaMagatzemNevera({ idb: disk.idb, navegador: {}, Canal: null }); opened.push(m); return m; };
afterEach(() => { opened.splice(0).forEach(m => m.tanca()); vi.restoreAllMocks(); });
test('Nevera: quota no perd la llista antiga, no confirma la nova i permet reintent sense duplicar', async () => {
  const net = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  const disk = creaIdbCaosRural(), a = crea(disk), b = crea(disk);
  const initial = await a.desa(afig(estatInicial(), 'casa', 'pa'));
  const next = afig(initial, 'casa', 'llet');
  disk.control.errorEscriptura = new DOMException('Disc ple', 'QuotaExceededError');
  await expect(a.desa(next, initial)).rejects.toMatchObject({ name: 'QuotaExceededError' });
  expect(await b.llegix()).toEqual(initial); expect(a.persistent).toBe(true);
  disk.control.errorEscriptura = null;
  expect(await a.desa(next, initial)).toEqual(next); expect(await b.llegix()).toEqual(next);
  expect(net).not.toHaveBeenCalled(); expect(disk.registre.obertes).toBe(0);
});
test('Nevera: escriptures simultànies sense Web Locks resolen CAS dins de transacció', async () => {
  const disk = creaIdbCaosRural(), a = crea(disk), b = crea(disk), initial = estatInicial();
  const results = await Promise.allSettled([a.desa(afig(initial, 'casa', 'pa'), initial), b.desa(afig(initial, 'casa', 'llet'), initial)]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(r => r.status === 'rejected').reason).toMatchObject({ codi: 'CONFLICTE' });
  expect(await b.llegix()).toEqual(results.find(r => r.status === 'fulfilled').value);
});
test('Nevera: corrupció parcial es normalitza sense escriure ni destruir bytes bons', async () => {
  const disk = creaIdbCaosRural(), a = crea(disk);
  await a.desa(afig(estatInicial(), 'casa', 'pa'));
  const files = disk.bases.get(NOM_BASE).stores.get(STORE).files;
  const damaged = { ...files.get(CLAU_ESTAT), seq: -1, propis: 'trencat' };
  files.set(CLAU_ESTAT, damaged); const commits = disk.registre.commits;
  expect((await a.llegix()).llistes[0].linies.map(row => row.articleId)).toEqual(['pa']);
  expect(disk.registre.commits).toBe(commits + 1); // readonly completes; no data rewrite
  expect(files.get(CLAU_ESTAT)).toEqual(damaged);
});
