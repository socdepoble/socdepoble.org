// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { creaMagatzemIdb } from './magatzemLocal.js';
import { creaIdbCaosRural } from './__fixtures__/idbCaosRural.js';

const crea = (disk, navegador = {}) => creaMagatzemIdb({ nom: 'rural-contract', stores: { rows: { clau: 'id' } },
  llistaBlanca: { rows: ['id', 'value'] }, idb: disk.idb, navegador, Canal: null });
test('el doble IDB no mostra canvis fins al commit ni confirma abans de oncomplete', async () => {
  const disk = creaIdbCaosRural(), m = crea(disk);
  await m.prepara(); disk.control.pausaCommit = true;
  let ack = false;
  const pending = m.desa('rows', { id: 'a', value: 1 }).then(() => { ack = true; });
  await new Promise(resolve => setTimeout(resolve, 15));
  expect(ack).toBe(false); expect(disk.files('rural-contract', 'rows')).toEqual([]);
  disk.repren(); await pending;
  expect(ack).toBe(true); expect(disk.files('rural-contract', 'rows')).toEqual([{ id: 'a', value: 1 }]);
  expect(disk.registre.obertes).toBe(0); m.tanca();
});
test('quota en la segona petició del lot avorta tot: cap fila parcial ni avís de canvi', async () => {
  const disk = creaIdbCaosRural(), m = crea(disk);
  await m.desa('rows', { id: 'initial', value: 0 });
  const notify = vi.fn(); m.subscriu(notify);
  disk.control.errorEscriptura = new DOMException('Disc ple', 'QuotaExceededError'); disk.control.fallaEscriptura = 2;
  await expect(m.desaTots('rows', [{ id: 'a', value: 1 }, { id: 'b', value: 2 }])).rejects.toMatchObject({ name: 'QuotaExceededError' });
  expect(disk.files('rural-contract', 'rows')).toEqual([{ id: 'initial', value: 0 }]);
  expect(notify).not.toHaveBeenCalled(); expect(m.persistent).toBe(true);
  disk.control.errorEscriptura = null;
  expect(await m.obte('rows', 'initial')).toEqual({ id: 'initial', value: 0 }); m.tanca();
});
test('getter StorageManager bloquejat: estat desconegut i denegació, sense excepció a la UI', async () => {
  const disk = creaIdbCaosRural();
  const m = crea(disk, { get storage() { throw new DOMException('Bloquejat', 'SecurityError'); } });
  await expect(m.estatPersistencia()).resolves.toEqual({ persistent: true, duradora: null, usat: null, quota: null, mode: 'lliure' });
  await expect(m.demanaPersistencia()).resolves.toBe(false); m.tanca();
});
