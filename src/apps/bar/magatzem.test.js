// @vitest-environment node
/* El Bar · magatzem.js — amb l'IndexedDB fals de P2: llista blanca, conflicte
   de rev, tiquets que s'escriuen una sola vegada, reconciliació i caiguda a memòria. */
import { afterEach, describe, expect, test } from 'vitest';
import { creaMagatzemBar } from './magatzem.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, creaComanda, totals } from './nucli/comanda.js';
import { creaDevolucio } from './nucli/tiquet.js';
import { obriTorn } from './nucli/torn.js';
import { llavorCarta } from './nucli/llavor.js';

const ARA = '2026-10-02T09:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
const oberts = [];

function magatzemFals(idbFals = creaIdbFals()) {
  const m = creaMagatzemBar({ idb: idbFals.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  oberts.push(m);
  return { m, idbFals };
}

afterEach(() => {
  for (const m of oberts.splice(0)) m.base.tanca();
});

const comanda = () => afegeixProducte(
  creaComanda({ id: 'c-1', tornId: 'torn-1', origen: { tipus: 'barra' }, ara: ARA }),
  { producte: P('tallat'), ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-1' }
);

describe('carrega', () => {
  test('la primera vegada sembra la llavor d’exemple al disc', async () => {
    const { m, idbFals } = magatzemFals();
    const dades = await m.carrega();
    expect(dades.carta.productes.length).toBeGreaterThan(20);
    expect(dades.carta).not.toHaveProperty('id');
    expect(dades.sala.taules).toHaveLength(10);
    expect(dades.establiment).toMatchObject({ ivaPerDefecte: 10 });
    expect(dades).toMatchObject({ tornActual: null, comandes: [], tiquets: [], traspas: null, tancament: null });
    expect(idbFals.registre.obertes).toBe(0);
    expect(m.base.persistent).toBe(true);
  });

  test('una comanda que ja té tiquet es reconcilia (tancament tallat pel mig)', async () => {
    const { m } = magatzemFals();
    const torn = obriTorn({ id: 'torn-1', per: 'x', fonsInicialCents: 0, ara: ARA });
    await m.desaTorn(torn);
    await m.desaMeta('tornActual', torn.id);
    const desada = await m.desaComanda(comanda());
    const tiquet = tanca(afegeixPagament(desada, { metode: 'targeta', importCents: totals(desada).pendentCents }, { id: 'p-1', ara: ARA }), { numero: 1, ara: ARA });
    /* Simula el tall: el tiquet s'escriu, la comanda no s'esborra. */
    await m.base.desa('tiquets', tiquet);
    const dades = await m.carrega();
    expect(dades.comandes).toEqual([]);
    expect(dades.tiquets.map((t) => t.id)).toEqual(['c-1']);
    expect(await m.base.obte('comandes', 'c-1')).toBeUndefined();
  });
});

describe('comandes: concurrència optimista', () => {
  test('rev puja en cada desament i un rev desfasat és un CONFLICTE', async () => {
    const { m } = magatzemFals();
    const primera = await m.desaComanda(comanda());
    expect(primera.rev).toBe(1);
    const segona = await m.desaComanda(primera);
    expect(segona.rev).toBe(2);
    await expect(m.desaComanda(primera)).rejects.toMatchObject({ codi: 'CONFLICTE' });
    await expect(m.desaComanda(comanda())).rejects.toMatchObject({ codi: 'CONFLICTE' });
  });

  test('la llista blanca descarta els camps que no són de la comanda', async () => {
    const { m } = magatzemFals();
    await m.desaComanda({ ...comanda(), nomClient: 'No s’ha de desar', targetaClient: '0000' });
    const disc = await m.base.obte('comandes', 'c-1');
    expect(disc).not.toHaveProperty('nomClient');
    expect(disc).not.toHaveProperty('targetaClient');
    expect(Object.keys(disc).sort()).toEqual(['atesPer', 'estat', 'historial', 'id', 'linies', 'obertaA', 'origen', 'pagaments', 'rev', 'tornId']);
  });

  test('només es descarta una comanda buida', async () => {
    const { m } = magatzemFals();
    await expect(m.descartaComanda(comanda())).rejects.toMatchObject({ codi: 'NO_DESCARTABLE' });
    const buida = creaComanda({ id: 'c-buida', tornId: 'torn-1', origen: { tipus: 'barra' }, ara: ARA });
    await m.desaComanda(buida);
    await m.descartaComanda(buida);
    expect(await m.base.obte('comandes', 'c-buida')).toBeUndefined();
  });
});

describe('tiquets i torns: una sola escriptura (invariant 2)', () => {
  test('tancar escriu el tiquet i esborra la comanda; tornar-lo a escriure és JA_TANCAT', async () => {
    const { m } = magatzemFals();
    const desada = await m.desaComanda(comanda());
    const tiquet = tanca(afegeixPagament(desada, { metode: 'efectiu', importCents: 130, lliuratCents: 200 }, { id: 'p-1', ara: ARA }), { numero: 1, ara: ARA });
    await m.tancaComanda(tiquet);
    expect(await m.base.obte('comandes', 'c-1')).toBeUndefined();
    expect(await m.tiquetsDelTorn('torn-1')).toHaveLength(1);
    await expect(m.tancaComanda(tiquet)).rejects.toMatchObject({ codi: 'JA_TANCAT' });
    const dev = creaDevolucio(tiquet, [{ liniaId: 'l-1', quantitat: 1 }], { motiu: 'Fred', metode: 'efectiu', id: 'k-1', ara: ARA, numero: 2, tornId: 'torn-1' });
    await m.desaDevolucio(dev);
    await expect(m.desaDevolucio(dev)).rejects.toMatchObject({ codi: 'JA_TANCAT' });
    expect((await m.tiquetsDelTorn('torn-1')).map((t) => t.numero)).toEqual([1, 2]);
  });

  test('cap funció del magatzem esborra ni reescriu tiquets', () => {
    const { m } = magatzemFals();
    const noms = Object.keys(m).filter((nom) => nom !== 'base');
    expect(noms.filter((nom) => /esborra|edita|buida|reinicia/i.test(nom))).toEqual([]);
  });

  test('un torn tancat no es reescriu', async () => {
    const { m } = magatzemFals();
    const torn = obriTorn({ id: 'torn-1', per: 'x', fonsInicialCents: 0, ara: ARA });
    await m.desaTorn(torn);
    await m.desaTorn({ ...torn, estat: 'tancat' });
    await expect(m.desaTorn(torn)).rejects.toMatchObject({ codi: 'TORN_TANCAT' });
  });

  test('una carta o una sala invàlides no arriben al disc', async () => {
    const { m } = magatzemFals();
    const carta = llavorCarta();
    carta.productes[0].categoriaId = 'inventada';
    await expect(m.desaCarta(carta)).rejects.toThrow(/carta no és vàlida/);
    await expect(m.desaSala({ zones: [], taules: [{ id: 'T 1' }] })).rejects.toThrow(/sala no és vàlida/);
    await expect(m.desaMeta('secret', 1)).rejects.toThrow(/Clau de meta desconeguda/);
  });
});

describe('sense IndexedDB', () => {
  test('cau a memòria, ho declara i continua funcionant la sessió', async () => {
    const m = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
    oberts.push(m);
    expect(m.base.persistent).toBe(false);
    const dades = await m.carrega();
    expect(dades.carta.categories).toHaveLength(11);
    const desada = await m.desaComanda(comanda());
    expect(desada.rev).toBe(1);
    expect(await m.base.obte('comandes', 'c-1')).toMatchObject({ rev: 1 });
  });

  test('si el navegador no deixa obrir la base la primera vegada, també passa a memòria', async () => {
    const { m } = magatzemFals(creaIdbFals({ fallaObrir: true }));
    await m.carrega();
    expect(m.base.persistent).toBe(false);
  });
});
