// @vitest-environment node
/* El Bar · els moviments a mitges (correcció del refutador, 261011, T2;
   decisió de la mateixa nit: «DETECTA I AVISA», sense escriure res al disc).
   «Mou» i «Dividix» escriuen dues comandes en dues transaccions: primer el
   destí (amb les línies) i després l'origen (sense). Un tall entremig deixa
   les línies a les DUES comandes. Ací es simula eixe tall sobre l'IndexedDB
   fals de P2 (s'escriu el destí i prou) i es comprova que `carrega()`:
     · NO toca el disc (ni retalla ni descarta res);
     · torna el moviment a `migsMoviments`, amb les comandes i les línies;
     · no cau mai, tampoc amb dades malmeses (motiu ERROR).
   La reparació (acabaOrigen) es queda provada i DESENDOLLADA. */
import { afterEach, describe, expect, test } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaMagatzemBar } from './magatzem.js';
import { afegeixPagament, tanca } from './nucli/cobrament.js';
import { afegeixProducte, aplicaDescompte, canviaQuantitat, creaComanda, heretaHistorial, mouLinies, totals } from './nucli/comanda.js';
import { divideixPerLinies } from './nucli/divisio.js';
import { llavorCarta } from './nucli/llavor.js';
import { acabaOrigen, detectaMigsMoviments, movimentsRebuts, teOperacio } from './nucli/migMoviment.js';
import { obriTorn } from './nucli/torn.js';

const ARA = '2026-10-02T09:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
const oberts = [];
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-n${n}`; };

function magatzemFals(navegador = { idb: creaIdbFals(), locks: creaLocksFals(), canal: creaCanalFals() }) {
  const m = creaMagatzemBar({ idb: navegador.idb.idb, navegador: { locks: navegador.locks }, Canal: navegador.canal.Canal });
  oberts.push(m);
  return m;
}
async function ambTorn(m) {
  const torn = obriTorn({ id: 'torn-1', per: 'Cambrer 1', fonsInicialCents: 0, ara: ARA });
  await m.desaTorn(torn);
  await m.desaMeta('tornActual', torn.id);
}

afterEach(() => {
  for (const m of oberts.splice(0)) m.base.tanca();
});

const nova = (id, origen = { tipus: 'barra' }) => creaComanda({ id, tornId: 'torn-1', origen, ara: ARA, per: 'Cambrer 1' });
const amb = (comanda, producteId, quantitat, idLinia) => afegeixProducte(comanda, { producte: P(producteId), ivaPerDefecte: 10, quantitat }, { ara: ARA, idLinia });
const moure = (origen, desti, seleccio, op) => mouLinies(origen, desti, seleccio, { ara: ARA, nouIdLinia: () => nouId(), op });
const TAULA_1 = { tipus: 'taula', taulaId: 't1' };
const cobra = (comanda, numero = 1) => tanca(afegeixPagament(comanda, { metode: 'targeta', importCents: totals(comanda).pendentCents }, { id: nouId('p'), ara: ARA }), { numero, ara: ARA });
/* El que es mira d'un avís: motiu, comandes i línies. */
const resum = (migs) => migs.map((m) => [m.motiu, m.origenId, m.destiId, m.linies.map((l) => `${l.quantitat} × ${l.nom}`)]);

describe('nucli · la marca del moviment', () => {
  test('amb `op`, mouLinies deixa a les dues bandes la mateixa marca i, al destí, de quina línia ve i quantes en tenia', () => {
    const origen = amb(nova('c-o'), 'olives', 3, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1', quantitat: 2 }], 'm-1');
    expect(r.origen.historial.at(-1)).toMatchObject({ tipus: 'mou', liniaId: 'l-1', abans: 3, despres: 1, altra: 'c-d', op: 'm-1' });
    expect(r.desti.historial.at(-1)).toMatchObject({ tipus: 'mou', despres: 2, altra: 'c-o', op: 'm-1', deLinia: 'l-1', abans: 3 });
    expect(movimentsRebuts(r.desti)).toEqual([{ op: 'm-1', origenId: 'c-o', esdeveniments: [r.desti.historial.at(-1)] }]);
    expect(teOperacio(r.origen, 'm-1')).toBe(true);
    expect(teOperacio(origen, 'm-1')).toBe(false);
  });

  test('sense `op` (els moviments d’abans), cap marca: res a detectar', () => {
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const r = mouLinies(origen, nova('c-d'), [{ liniaId: 'l-1' }], { ara: ARA, nouIdLinia: () => nouId() });
    expect(r.desti.historial.at(-1)).not.toHaveProperty('op');
    expect(movimentsRebuts(r.desti)).toEqual([]);
    expect(detectaMigsMoviments([origen, r.desti], [])).toEqual([]);
  });

  /* T7 · L'historial de la comanda que es descarta passa al destí, marcat. */
  test('heretaHistorial: el destí guarda l’historial de l’origen descartat (marcat amb `de`) i qui i quan la va obrir; no compta com a moviment propi', () => {
    let origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    origen = aplicaDescompte(origen, 'l-1', { tipus: 'percent', valor: 10, motiu: 'Client' }, { ara: ARA, per: 'Encarregada' });
    const previ = moure(amb(nova('c-x'), 'cafe-sol', 1, 'l-9'), origen, [{ liniaId: 'l-9' }], 'm-0').desti;
    const r = moure(previ, nova('c-d', TAULA_1), previ.linies.map((l) => ({ liniaId: l.id })), 'm-1');
    const desti = heretaHistorial(r.desti, previ, { ara: ARA });
    const heretats = desti.historial.filter((e) => e.de === 'c-o');
    expect(heretats.map((e) => e.tipus)).toEqual(previ.historial.map((e) => e.tipus));
    expect(heretats.find((e) => e.tipus === 'descompte')).toMatchObject({ per: 'Encarregada', motiu: 'Client' });
    expect(desti.historial.find((e) => e.tipus === 'absorbix')).toEqual({ moment: ARA, tipus: 'absorbix', altra: 'c-o', obertaA: ARA, per: 'Cambrer 1' });
    expect(movimentsRebuts(desti).map((m) => m.op)).toEqual(['m-1']);
    expect(teOperacio(desti, 'm-0')).toBe(false);
    expect(desti.linies).toEqual(r.desti.linies);
  });
});

describe('nucli · detectaMigsMoviments (pura: només mira)', () => {
  test('destí amb la marca i origen sense, tots dos oberts: A_MITGES, amb les comandes i les unitats que poden estar dues vegades', () => {
    const origen = amb(amb(nova('c-o'), 'olives', 3, 'l-1'), 'cafe-sol', 1, 'l-2');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1', quantitat: 2 }], 'm-1');
    const migs = detectaMigsMoviments([origen, r.desti], []);
    expect(migs).toEqual([{
      op: 'm-1',
      motiu: 'A_MITGES',
      origenId: 'c-o',
      destiId: 'c-d',
      origen: { id: 'c-o', origen: { tipus: 'barra' }, obertaA: ARA, numero: null },
      desti: { id: 'c-d', origen: TAULA_1, obertaA: ARA, numero: null },
      linies: [{ nom: 'Olives', quantitat: 2 }]
    }]);
    /* No toca res del que rep. */
    expect(detectaMigsMoviments(Object.freeze([Object.freeze(origen), Object.freeze(r.desti)]), Object.freeze([]))).toEqual(migs);
  });

  test('un moviment complet no avisa; i l’avís se’n va sol quan algú lleva de l’origen el que sobrava', () => {
    const origen = amb(nova('c-o'), 'olives', 3, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1', quantitat: 2 }], 'm-1');
    expect(detectaMigsMoviments([r.origen, r.desti], [])).toEqual([]);
    expect(resum(detectaMigsMoviments([origen, r.desti], []))).toEqual([['A_MITGES', 'c-o', 'c-d', ['2 × Olives']]]);
    /* La persona en lleva una: encara en sobra una. En lleva dues: ja quadra. La lleva tota: també. */
    expect(resum(detectaMigsMoviments([canviaQuantitat(origen, 'l-1', 2, { ara: ARA }), r.desti], []))).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
    expect(detectaMigsMoviments([canviaQuantitat(origen, 'l-1', 1, { ara: ARA }), r.desti], [])).toEqual([]);
    expect(detectaMigsMoviments([canviaQuantitat(origen, 'l-1', 0, { ara: ARA }), r.desti], [])).toEqual([]);
    /* O la lleva del destí. */
    expect(detectaMigsMoviments([origen, { ...r.desti, linies: [] }], [])).toEqual([]);
  });

  test('ORIGEN_COBRAT: l’origen ja és un tiquet del torn sense la marca i el destí encara porta les línies', () => {
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1');
    const migs = detectaMigsMoviments([r.desti], [cobra(origen, 4)]);
    expect(resum(migs)).toEqual([['ORIGEN_COBRAT', 'c-o', 'c-d', ['1 × Olives']]]);
    expect(migs[0].origen.numero).toBe(4);
    /* Cobrat DESPRÉS d'anotar el moviment (el tiquet porta la marca): cap dubte. */
    const parcial = moure(amb(nova('c-o'), 'olives', 2, 'l-1'), nova('c-d', TAULA_1), [{ liniaId: 'l-1', quantitat: 1 }], 'm-2');
    expect(detectaMigsMoviments([parcial.desti], [cobra(parcial.origen)])).toEqual([]);
  });

  /* D · El destí ja cobrat. */
  test('DESTI_COBRAT: el destí ja és un tiquet del torn i l’origen encara porta les línies', () => {
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1');
    const migs = detectaMigsMoviments([origen], [cobra(r.desti, 7)]);
    expect(resum(migs)).toEqual([['DESTI_COBRAT', 'c-o', 'c-d', ['1 × Olives']]]);
    expect(migs[0].desti.numero).toBe(7);
    /* Tots dos cobrats: ja no hi ha res a evitar ací. */
    expect(detectaMigsMoviments([], [cobra(r.desti, 7), cobra(origen, 8)])).toEqual([]);
  });

  test('el destí absorbit per una altra comanda abans de recarregar: les línies són a la que l’ha absorbit, i s’avisa', () => {
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const mig = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1').desti;
    const segon = moure(mig, nova('c-x', { tipus: 'taula', taulaId: 't2' }), mig.linies.map((l) => ({ liniaId: l.id })), 'm-2');
    const absorbidora = heretaHistorial(segon.desti, mig, { ara: ARA });
    expect(resum(detectaMigsMoviments([origen, absorbidora], []))).toEqual([['A_MITGES', 'c-o', 'c-x', ['1 × Olives']]]);
  });

  /* C · Res no llança. */
  test('dades malmeses: mai llança; el que no s’entén no compta o, si peta, un sol ERROR', () => {
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1');
    const casos = [
      [[{ ...origen, historial: null }, r.desti], []],
      [[origen, { ...r.desti, historial: [null, undefined, 3, 'x', ...r.desti.historial] }], []],
      [[{ ...origen, linies: undefined }, r.desti], []],
      [[{ ...origen, historial: [null] }, { ...r.desti, linies: null }], []],
      [[null, undefined, 7, origen, r.desti], [null, {}]],
      [null, null],
      ['comandes', 42]
    ];
    for (const [comandes, tiquets] of casos) expect(() => detectaMigsMoviments(comandes, tiquets)).not.toThrow();
    expect(resum(detectaMigsMoviments([{ ...origen, historial: null }, r.desti], []))).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
    expect(detectaMigsMoviments([{ ...origen, linies: undefined }, r.desti], [])).toEqual([]);
    /* Si de veres peta (un getter que llança), ERROR i prou. */
    const verinosa = { id: 'c-v', estat: 'oberta', get historial() { throw new Error('malmés'); } };
    expect(detectaMigsMoviments([verinosa], [])).toEqual([{ op: null, motiu: 'ERROR', origenId: null, destiId: null, origen: null, desti: null, linies: [] }]);
  });
});

describe('nucli · acabaOrigen: REPARACIÓ PREPARADA, DESENDOLLADA (cap codi de producció la crida)', () => {
  test('refà EXACTAMENT l’origen que hauria escrit el moviment (també amb un descompte partit)', () => {
    let origen = amb(amb(nova('c-o'), 'olives', 3, 'l-1'), 'cafe-sol', 1, 'l-2');
    origen = aplicaDescompte(origen, 'l-1', { tipus: 'import', valor: 100, motiu: 'Client' }, { ara: ARA });
    const r = moure(origen, nova('c-d'), [{ liniaId: 'l-1', quantitat: 2 }, { liniaId: 'l-2' }], 'm-1');
    const [moviment] = movimentsRebuts(r.desti);
    const acabat = acabaOrigen(origen, r.desti, moviment);
    expect(acabat.ok).toBe(true);
    expect(acabat.origen.linies).toEqual(r.origen.linies);
    expect(acabat.origen.historial).toEqual(r.origen.historial);
    expect(totals(acabat.origen).totalCents + totals(r.desti).totalCents).toBe(totals(origen).totalCents);
  });

  test('davant del dubte no fa res, i amb dades malmeses tampoc llança', () => {
    const origen = amb(nova('c-o'), 'olives', 3, 'l-1');
    const r = moure(origen, nova('c-d'), [{ liniaId: 'l-1', quantitat: 2 }], 'm-1');
    const [moviment] = movimentsRebuts(r.desti);
    expect(acabaOrigen(canviaQuantitat(origen, 'l-1', 4, { ara: ARA }), r.desti, moviment)).toEqual({ ok: false, motiu: 'ORIGEN_CANVIAT' });
    expect(acabaOrigen(origen, { ...r.desti, linies: [] }, moviment)).toEqual({ ok: false, motiu: 'DESTI_CANVIAT' });
    expect(acabaOrigen({ ...origen, linies: undefined }, r.desti, moviment)).toEqual({ ok: false, motiu: 'ORIGEN_CANVIAT' });
    expect(acabaOrigen({ ...origen, historial: null }, r.desti, moviment)).toEqual({ ok: false, motiu: 'ORIGEN_CANVIAT' });
  });

  test('el magatzem i l’estat no la criden: només este fitxer de proves i el seu mòdul la nomenen', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const path = await import('node:path');
    const arrel = path.join(process.cwd(), 'src/apps/bar');
    const fitxers = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fitxers(path.join(dir, e.name)) : [path.join(dir, e.name)]));
    const qui = fitxers(arrel).filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f) && /\bacabaOrigen\b/.test(readFileSync(f, 'utf8')));
    expect(qui.map((f) => path.relative(arrel, f))).toEqual(['nucli/migMoviment.js']);
  });
});

describe('magatzem · carrega() detecta el moviment a mitges i NO toca el disc', () => {
  /* Cada cas: el destí escrit amb la marca i l'origen encara sencer (el tall). */
  const casos = {
    '«Mou» sencer a una comanda nova': async (m) => {
      const origen = await m.desaComanda(amb(nova('c-o'), 'olives', 2, 'l-1'));
      const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1');
      await m.desaComanda(heretaHistorial(r.desti, origen, { ara: ARA }));
      return ['2 × Olives'];
    },
    '«Mou» parcial': async (m) => {
      const origen = await m.desaComanda(amb(amb(nova('c-o'), 'olives', 3, 'l-1'), 'cafe-sol', 1, 'l-2'));
      await m.desaComanda(moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1', quantitat: 2 }], 'm-1').desti);
      return ['2 × Olives'];
    },
    'fusió amb una comanda que ja tenia línies': async (m) => {
      const origen = await m.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
      const taula = await m.desaComanda(amb(nova('c-d', TAULA_1), 'cafe-sol', 1, 'l-2'));
      await m.desaComanda(heretaHistorial(moure(origen, taula, [{ liniaId: 'l-1' }], 'm-1').desti, origen, { ara: ARA }));
      return ['1 × Olives'];
    },
    '«Dividix»': async (m) => {
      const mare = await m.desaComanda(amb(amb(nova('c-o', TAULA_1), 'olives', 2, 'l-1'), 'cafe-sol', 1, 'l-2'));
      const { filla } = divideixPerLinies(mare, [{ liniaId: 'l-1', quantitat: 1 }], { idNova: 'c-d', ara: ARA, nouIdLinia: () => nouId(), op: 'm-1' });
      await m.desaComanda(filla);
      return ['1 × Olives'];
    }
  };

  for (const [nom, talla] of Object.entries(casos)) {
    test(`${nom}: el disc queda EXACTAMENT com estava (cap comanda retallada ni descartada), i el moviment ix a migsMoviments`, async () => {
      const m = magatzemFals();
      await ambTorn(m);
      const duplicades = await talla(m);
      const abans = await m.base.totes('comandes');
      expect(abans.map((c) => c.id).sort()).toEqual(['c-d', 'c-o']);
      const dades = await m.carrega();
      expect(await m.base.totes('comandes')).toEqual(abans);
      expect(dades.comandes).toEqual(abans);
      expect(resum(dades.migsMoviments)).toEqual([['A_MITGES', 'c-o', 'c-d', duplicades]]);
      /* I tornar a carregar diu el mateix: res ha canviat. */
      const altra = await m.carrega();
      expect(altra.migsMoviments).toEqual(dades.migsMoviments);
      expect(await m.base.totes('comandes')).toEqual(abans);
    });
  }

  test('un moviment complet (les dues escriptures) no avisa', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const origen = await m.desaComanda(amb(nova('c-o'), 'olives', 3, 'l-1'));
    const r = moure(origen, nova('c-d'), [{ liniaId: 'l-1', quantitat: 1 }], 'm-1');
    await m.desaComanda(r.desti);
    await m.desaComanda(r.origen);
    expect((await m.carrega()).migsMoviments).toEqual([]);
  });

  test('l’origen cobrat sense saber res del moviment: ORIGEN_COBRAT; el destí cobrat: DESTI_COBRAT', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const origen = await m.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const desti = await m.desaComanda(moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1').desti);
    await m.tancaComanda(cobra(origen, 1));
    expect(resum((await m.carrega()).migsMoviments)).toEqual([['ORIGEN_COBRAT', 'c-o', 'c-d', ['1 × Olives']]]);

    const m2 = magatzemFals();
    await ambTorn(m2);
    const origen2 = await m2.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    const desti2 = await m2.desaComanda(moure(origen2, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1').desti);
    await m2.tancaComanda(cobra(desti2, 1));
    expect(resum((await m2.carrega()).migsMoviments)).toEqual([['DESTI_COBRAT', 'c-o', 'c-d', ['1 × Olives']]]);
    expect(desti.id).toBe(desti2.id);
  });

  /* C · La càrrega del TPV no cau per un historial malmés. */
  test('amb comandes malmeses al disc (historial null, un null dins, origen sense línies) el TPV carrega igual i les deixa intactes', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const origen = amb(nova('c-o'), 'olives', 1, 'l-1');
    const r = moure(origen, nova('c-d', TAULA_1), [{ liniaId: 'l-1' }], 'm-1');
    /* S'escriuen per davall de la llista blanca del magatzem (camps sencers): el que hi haja, hi és. */
    await m.base.desa('comandes', { ...origen, rev: 1, historial: null });
    await m.base.desa('comandes', { ...r.desti, rev: 1, historial: [null, ...r.desti.historial] });
    await m.base.desa('comandes', { ...nova('c-sense'), rev: 1, linies: undefined });
    const abans = await m.base.totes('comandes');
    const dades = await m.carrega();
    expect(dades.comandes).toEqual(abans);
    expect(await m.base.totes('comandes')).toEqual(abans);
    expect(resum(dades.migsMoviments)).toEqual([['A_MITGES', 'c-o', 'c-d', ['1 × Olives']]]);
  });
});

/* G · Cobrar mira el `rev` (defecte anterior a esta nit: és el que convertia una memòria rància
   en un cobrament doble). */
describe('magatzem · tancaComanda comprova el rev de la comanda abans d’escriure el tiquet', () => {
  test('cobrar una comanda que al disc ha canviat des que la memòria la va llegir dona CONFLICTE i no escriu cap tiquet', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const rancia = await m.desaComanda(amb(nova('c-o'), 'olives', 2, 'l-1'));
    /* Al disc, la comanda perd una unitat (un moviment, una altra pestanya…): rev 2. */
    await m.desaComanda(canviaQuantitat(rancia, 'l-1', 1, { ara: ARA }));
    await expect(m.tancaComanda(cobra(rancia))).rejects.toMatchObject({ codi: 'CONFLICTE' });
    expect(await m.base.totes('tiquets')).toEqual([]);
    expect((await m.base.obte('comandes', 'c-o')).linies[0].quantitat).toBe(1);
  });

  test('cobrar una comanda que al disc ja no hi és (les línies se les ha emportat un moviment) dona CONFLICTE', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const rancia = await m.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    await m.base.esborra('comandes', 'c-o');
    await expect(m.tancaComanda(cobra(rancia))).rejects.toMatchObject({ codi: 'CONFLICTE' });
    expect(await m.base.totes('tiquets')).toEqual([]);
  });

  test('amb el rev del disc es cobra com sempre, i una comanda que no s’ha desat mai (rev 0) també', async () => {
    const m = magatzemFals();
    await ambTorn(m);
    const desada = await m.desaComanda(amb(nova('c-o'), 'olives', 1, 'l-1'));
    await expect(m.tancaComanda(cobra(desada, 1))).resolves.toMatchObject({ id: 'c-o' });
    expect(await m.base.obte('comandes', 'c-o')).toBeUndefined();
    await expect(m.tancaComanda(cobra(amb(nova('c-mai'), 'olives', 1, 'l-1'), 2))).resolves.toMatchObject({ id: 'c-mai' });
    expect((await m.base.totes('tiquets')).map((t) => t.id).sort()).toEqual(['c-mai', 'c-o']);
  });
});
