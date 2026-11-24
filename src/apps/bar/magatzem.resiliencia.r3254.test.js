// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { creaIdbCaosRural } from '../../utils/__fixtures__/idbCaosRural.js';
import { creaMagatzemBar } from './magatzem.js';
import { creaComanda, afegeixProducte, totals } from './nucli/comanda.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { llavorCarta } from './nucli/llavor.js';
import { creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
const opened = [], ARA = '2026-11-23T18:00:00.000Z';
const crea = disk => { const m = creaMagatzemBar({ idb: disk.idb, navegador: {}, Canal: null }); opened.push(m); return m; };
const order = () => afegeixProducte(creaComanda({ id: 'c-rural', tornId: 't-rural', origen: { tipus: 'barra' }, ara: ARA }),
  { producte: llavorCarta().productes.find(p => p.id === 'tallat'), ivaPerDefecte: 10 }, { idLinia: 'l-rural', ara: ARA });
afterEach(() => { opened.splice(0).forEach(m => m.base.tanca()); vi.restoreAllMocks(); });
test('Bar: quota després de crear tiquet però abans de suprimir comanda desfà les dues etapes', async () => {
  const net = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  const disk = creaIdbCaosRural(), a = crea(disk), b = crea(disk);
  const original = await a.desaComanda(order());
  const ticket = tanca(afegeixPagament(original, { metode: 'targeta', importCents: totals(original).pendentCents }, { id: 'p-rural', ara: ARA }), { numero: 1, ara: ARA });
  disk.control.errorEscriptura = new DOMException('Disc ple', 'QuotaExceededError'); disk.control.fallaEscriptura = 2;
  await expect(a.tancaComanda(ticket)).rejects.toMatchObject({ name: 'QuotaExceededError' });
  expect(await b.base.obte('comandes', original.id)).toEqual(original);
  expect(await b.tiquetsDelTorn('t-rural')).toEqual([]);
  disk.control.errorEscriptura = null;
  await a.tancaComanda(ticket);
  await expect(b.tancaComanda(ticket)).rejects.toMatchObject({ codi: 'JA_TANCAT' });
  expect(await b.tiquetsDelTorn('t-rural')).toHaveLength(1);
  expect(await b.base.obte('comandes', original.id)).toBeUndefined();
  expect(net).not.toHaveBeenCalled(); expect(disk.registre.obertes).toBe(0);
});
test('Bar: dos desaments simultanis de la mateixa comanda produeixen un sol guanyador', async () => {
  const disk = creaIdbCaosRural(), a = crea(disk), b = crea(disk);
  const original = await a.desaComanda(order());
  const results = await Promise.allSettled([a.desaComanda({ ...original, atesPer: 'A' }), b.desaComanda({ ...original, atesPer: 'B' })]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(r => r.status === 'rejected').reason).toMatchObject({ codi: 'CONFLICTE' });
  expect(await b.base.obte('comandes', original.id)).toEqual(results.find(r => r.status === 'fulfilled').value);
});
test('Bar: còpia JSON truncada rebutjada conserva íntegre el treball actual', async () => {
  const disk = creaIdbCaosRural(), a = crea(disk);
  await a.desaComanda(order()); const before = await a.bolca();
  await expect(a.restauraCopia('{"schema":')).rejects.toThrow();
  expect(await a.bolca()).toEqual(before);
});
test('Bar: l’estat parcial continua llegible, però no es cobra ni impedeix reparar-lo o treballar en una altra comanda', async () => {
  const disk = creaIdbCaosRural(), a = crea(disk);
  await a.carrega(); const saved = await a.desaComanda(order());
  const files = disk.bases.get('sdp-bar').stores.get('comandes').files;
  const candidate = { ...order(), id: 'broken', rev: 1 };
  const broken = { ...candidate, linies: null };
  files.set('broken', broken);
  const before = await a.bolca();
  expect((await a.carrega()).comandes).toEqual(expect.arrayContaining([saved, broken]));
  const ticket = tanca(afegeixPagament(candidate, { metode: 'targeta', importCents: totals(candidate).pendentCents }, { id: 'p-broken', ara: ARA }), { numero: 1, ara: ARA });
  await expect(a.tancaComanda(ticket)).rejects.toMatchObject({ codi: 'DADES_MALMESES' });
  expect(await a.bolca()).toEqual(before);
  await expect(a.desaComanda({ ...saved, atesPer: 'A' })).resolves.toMatchObject({ rev: 2 });
  expect(await a.base.obte('comandes', 'broken')).toEqual(broken);
  await expect(a.desaComanda(candidate)).resolves.toMatchObject({ id: 'broken', rev: 2, linies: candidate.linies });
});

test('Bar: torn incomplet migrat i metadades heretades es lligen intactes també en una pestanya lectora', async () => {
  const disk = creaIdbCaosRural(), locks = creaLocksFals();
  const a = creaMagatzemBar({ idb: disk.idb, navegador: { locks }, Canal: null });
  const b = creaMagatzemBar({ idb: disk.idb, navegador: { locks }, Canal: null }); opened.push(a, b);
  await a.base.obtinBloqueig(); await b.base.obtinBloqueig(); await a.carrega();
  const old = { id: 'old', obertA: '', obertPer: 'Torn antic', estat: 'tancat', tancatA: '' };
  await a.desaTorn(old);
  const inherited = await a.desaComanda({ ...order(), historial: [null] });
  const before = await a.bolca();
  expect(b.base.mode).toBe('lectora');
  const loaded = await b.carrega();
  expect(loaded.torns).toContainEqual(old); expect(loaded.comandes).toContainEqual(inherited);
  expect(await a.bolca()).toEqual(before);
});

test.each([
  { linies: null }, { linies: [null] }, { pagaments: null }, { pagaments: [null] }, { historial: null }
])('Bar: un snapshot actiu malmés no es desa ni pot retirar recursos (%j)', async patch => {
  const disk = creaIdbCaosRural(), a = crea(disk);
  const saved = await a.desaComanda(order()), before = await a.bolca();
  const broken = { ...saved, ...patch };
  await expect(a.desaComanda(broken)).rejects.toMatchObject({ codi: 'DADES_MALMESES' });
  await expect(a.descartaComanda(broken)).rejects.toMatchObject({ codi: 'DADES_MALMESES' });
  await expect(a.tancaComanda({ ...broken, tipus: 'venda' })).rejects.toMatchObject({ codi: 'DADES_MALMESES' });
  expect(await a.bolca()).toEqual(before);
});
