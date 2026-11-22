import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../backendPort.js', () => ({
  teCapacitat: () => true, desaRevisioEditorialWp: (...args) => m.save(...args)
}));
import { desaRevisio } from './revisioImportacioWpStore.js';
import { desaSessio, esborraSessio } from '../identitat.js';
import { CLAU_STORAGE_REVISIO_WP } from '../../utils/revisioEditorialWp.js';
const session = id => ({ access_token: 'r36-fixture-'+id, user: { id } });
beforeEach(() => { desaSessio(session('A')); m.save.mockReset().mockResolvedValue({ wpId: 619, actualitzatA: 'v1' }); });
afterEach(() => esborraSessio());
function memory() {
  const value = JSON.stringify({ estats: { 619: 'aprovat' }, anotacions: { 619: 'anterior' }, versions: { 619: 'v0' } });
  return { getItem: () => value, setItem: vi.fn() };
}

test.each(['B', 'A'])('metadades reals: canviar d’entrada a %s abans de resoldre-les no escriu local ni remot', async actor => {
  const storage = memory();
  const pending = desaRevisio(619, { estat: 'aprovat', nota: 'intenció anterior' }, { storage });
  esborraSessio(); desaSessio(session(actor));
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(m.save).not.toHaveBeenCalled();
});

test('renovar JWT de la mateixa entrada no cancel·la les metadades ni canvia autoria/destí', async () => {
  const storage = memory();
  const pending = desaRevisio(619, { estat: 'aprovat', nota: 'intenció vàlida' }, { storage });
  desaSessio({ ...session('A'), access_token: 'r36-renewed-fixture' }, { renovacio: true });
  expect(await pending).toMatchObject({ remot: true });
  expect(m.save).toHaveBeenCalledWith(expect.objectContaining({ wpId: 619, nota: 'intenció vàlida', autoria: 'Associació El Rentonar', desti: 'arbres-monumentals' }), {});
  expect(storage.setItem).toHaveBeenCalled();
  expect(storage.setItem.mock.calls[0][0]).toBe(CLAU_STORAGE_REVISIO_WP);
});
