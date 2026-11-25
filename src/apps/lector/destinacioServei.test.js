// @vitest-environment node
import { test, expect, vi } from 'vitest';
import { creaDestinacioServei } from './destinacioServei.js';
import { creaMagatzemLector } from './magatzem.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';

test('destinació de producció sense flag de llavor: persistència real i servei en estat personals=true', async () => {
  const idb = creaIdbFals(); const locks = creaLocksFals(); const canal = creaCanalFals();
  const obriMagatzem = () => creaMagatzemLector({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  const servei = { estat: async () => ({ disponible: true, personals: true }), fonts: async () => ({ categories: [{ id: 'camp', nom: 'Camp', ordre: 1 }], fonts: [] }), feed: vi.fn(), feedPersonal: vi.fn() };
  const destinacio = creaDestinacioServei({ servei, obriMagatzem });
  expect(await destinacio.categories()).toEqual([{ id: 'camp', nom: 'Camp' }]);
  const resultat = await destinacio.afig({ url: 'https://example.org/feed', nom: 'Prova', categoriaId: 'camp' });
  expect(resultat.trams).toEqual(['noticies', 'camp', resultat.id]);
  const m = obriMagatzem(); expect((await m.llegixPersonals()).fonts[0].nom).toBe('Prova'); m.tanca();
  expect(servei.feedPersonal).not.toHaveBeenCalled();
});

test('cap destí sense servei i cap èxit fictici amb personals apagades', async () => {
  expect(creaDestinacioServei()).toBeNull();
  const obriMagatzem = vi.fn();
  const destinacio = creaDestinacioServei({ servei: { estat: async () => ({ disponible: true, personals: false }), fonts() {}, feed() {}, feedPersonal() {} }, obriMagatzem });
  await expect(destinacio.afig({})).rejects.toMatchObject({ codi: 'personals-off' });
  expect(obriMagatzem).not.toHaveBeenCalled();
});
