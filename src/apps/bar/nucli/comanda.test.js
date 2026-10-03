// @vitest-environment node
/* El Bar · nucli/comanda.js — invariants 1, 3 i 5 de §A.4 i les línies que congelen. */
import { describe, expect, test } from 'vitest';
import {
  adoptaComanda, afegeixProducte, anullaLinia, aplicaDescompte, canviaNota, canviaQuantitat, comandaObertaDe, convida, creaComanda,
  esDescartable, llevaLinia, marxa, mouLinies, sumaQuantitat, totals
} from './comanda.js';
import { afegeixPagament } from './cobrament.js';
import { resolModificadors } from './cataleg.js';
import { llavorCarta } from './llavor.js';

const ARA = '2026-10-02T08:00:00.000Z';
const DESPRES = '2026-10-02T08:05:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);

let n = 0;
const id = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };
const nova = (origen = { tipus: 'barra' }) => creaComanda({ id: id('c'), tornId: 'torn-1', origen, ara: ARA, per: 'Cambrer 1' });
const afig = (comanda, producteId, opcions = {}) => afegeixProducte(comanda, { producte: P(producteId), ivaPerDefecte: 10, ...opcions }, { ara: ARA, idLinia: id() });

describe('creaComanda', () => {
  test('naix oberta, buida, amb rev 0 i l’àlies curt', () => {
    const c = creaComanda({ id: 'c-1', tornId: 'torn-1', origen: { tipus: 'taula', taulaId: 't5', altra: 'x' }, ara: ARA, per: '  Cambrer   1 ' });
    expect(c).toMatchObject({ id: 'c-1', tornId: 'torn-1', origen: { tipus: 'taula', taulaId: 't5' }, estat: 'oberta', rev: 0, atesPer: 'Cambrer 1', linies: [], pagaments: [] });
    expect(c.origen).toEqual({ tipus: 'taula', taulaId: 't5' });
    expect(esDescartable(c)).toBe(true);
  });

  test('rebutja origen, taula, id i moment dolents', () => {
    expect(() => creaComanda({ id: 'c-1', tornId: 't', origen: { tipus: 'cuina' }, ara: ARA })).toThrow(expect.objectContaining({ codi: 'ORIGEN' }));
    expect(() => creaComanda({ id: 'c-1', tornId: 't', origen: { tipus: 'taula', taulaId: 'T 5' }, ara: ARA })).toThrow(expect.objectContaining({ codi: 'ORIGEN' }));
    expect(() => creaComanda({ id: 'C 1', tornId: 't', origen: { tipus: 'barra' }, ara: ARA })).toThrow(expect.objectContaining({ codi: 'ID' }));
    expect(() => creaComanda({ id: 'c-1', tornId: 't', origen: { tipus: 'barra' }, ara: 'ahir' })).toThrow(expect.objectContaining({ codi: 'MOMENT' }));
  });
});

describe('afegeixProducte', () => {
  test('la línia congela nom, variant, preu, IVA, categoria i cost', () => {
    const c = afig(nova(), 'aigua', { varianteId: 'gran' });
    expect(c.linies).toHaveLength(1);
    expect(c.linies[0]).toMatchObject({
      producteId: 'aigua', varianteId: 'gran', categoriaId: 'refrescs', nomCongelat: 'Aigua', varianteNomCongelat: 'Gran',
      preuUnitariCents: 180, ivaPercent: 10, costUnitariCents: 50, quantitat: 1, estat: 'nova', afegidaA: ARA
    });
    expect(c.historial.at(-1)).toMatchObject({ tipus: 'afegeix', despres: 1 });
  });

  test('canviar la carta després no toca la línia', () => {
    const carta = llavorCarta();
    const producte = carta.productes.find((p) => p.id === 'tallat');
    const c = afegeixProducte(nova(), { producte, ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-x' });
    producte.nom = 'Tallat nou';
    producte.variants[0].preuCents = 999;
    expect(c.linies[0]).toMatchObject({ nomCongelat: 'Tallat', preuUnitariCents: 130 });
  });

  test('tornar a tocar el mateix producte suma 1 a l’última línia idèntica encara nova', () => {
    let c = afig(nova(), 'tallat');
    c = afig(c, 'torrada-tomaca', { modificadors: resolModificadors(P('torrada-tomaca'), CARTA.grups, [{ grupId: 'pa-torrada', opcioId: 'normal' }]) });
    c = afig(c, 'tallat');
    expect(c.linies.map((l) => [l.producteId, l.quantitat])).toEqual([['tallat', 2], ['torrada-tomaca', 1]]);
    c = marxa(c, { ara: DESPRES });
    c = afig(c, 'tallat');
    expect(c.linies.map((l) => [l.producteId, l.quantitat, l.estat])).toEqual([['tallat', 2, 'marxada'], ['torrada-tomaca', 1, 'marxada'], ['tallat', 1, 'nova']]);
  });

  test('variant, modificadors o nota diferents fan una línia nova', () => {
    let c = afig(nova(), 'cafe-llet');
    c = afig(c, 'cafe-llet', { varianteId: 'got' });
    c = afig(c, 'cafe-llet', { modificadors: resolModificadors(P('cafe-llet'), CARTA.grups, [{ grupId: 'llet', opcioId: 'vegetal' }]) });
    c = afig(c, 'cafe-llet', { nota: 'ben calent' });
    expect(c.linies.map((l) => l.preuUnitariCents)).toEqual([150, 170, 170, 150]);
    expect(c.linies[2].modificadors).toEqual([{ grupId: 'llet', opcioId: 'vegetal', nomCongelat: 'Beguda vegetal', deltaCents: 20 }]);
    expect(c.linies[3].nota).toBe('ben calent');
  });

  test('preu obert («Varis») necessita el preu, i un producte normal l’ignora', () => {
    expect(() => afig(nova(), 'varis')).toThrow(expect.objectContaining({ codi: 'PREU' }));
    expect(afig(nova(), 'varis', { preuCents: 350 }).linies[0].preuUnitariCents).toBe(350);
    expect(afig(nova(), 'tallat', { preuCents: 1 }).linies[0].preuUnitariCents).toBe(130);
  });

  test('rebutja quantitats que no són enters d’1 a 999, i una variant que no és seua', () => {
    for (const quantitat of [0, -1, 1.5, 1000, Number.NaN]) {
      expect(() => afig(nova(), 'tallat', { quantitat })).toThrow(expect.objectContaining({ codi: 'QUANTITAT' }));
    }
    expect(() => afig(nova(), 'tallat', { varianteId: 'gerra' })).toThrow(expect.objectContaining({ codi: 'VARIANT' }));
  });

  test('no toca la comanda que rep', () => {
    const c = nova();
    const copia = structuredClone(c);
    afig(c, 'tallat');
    expect(c).toEqual(copia);
  });
});

describe('quantitat, marxar i anul·lar (invariant 3)', () => {
  test('abans de marxar, llevar és lliure; una línia marxada no baixa', () => {
    let c = afig(afig(nova(), 'tallat', { quantitat: 3 }), 'olives');
    c = canviaQuantitat(c, c.linies[0].id, 2, { ara: DESPRES });
    expect(c.linies[0].quantitat).toBe(2);
    c = llevaLinia(c, c.linies[1].id, { ara: DESPRES });
    expect(c.linies).toHaveLength(1);
    c = marxa(c, { ara: DESPRES });
    expect(() => canviaQuantitat(c, c.linies[0].id, 1, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'MARXADA' }));
  });

  test('una línia marxada sense motiu no s’anul·la; amb motiu, sí, i queda a l’historial', () => {
    let c = marxa(afig(nova(), 'calamars'), { ara: DESPRES });
    const liniaId = c.linies[0].id;
    expect(() => anullaLinia(c, liniaId, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'SENSE_MOTIU' }));
    expect(() => anullaLinia(c, liniaId, { ara: DESPRES, motiu: '   ' })).toThrow(expect.objectContaining({ codi: 'SENSE_MOTIU' }));
    c = anullaLinia(c, liniaId, { ara: DESPRES, motiu: 'Cremat', per: 'Encarregada' });
    expect(c.linies[0]).toMatchObject({ estat: 'anullada', motiuAnullacio: 'Cremat' });
    expect(c.historial.at(-1)).toMatchObject({ tipus: 'anulla', motiu: 'Cremat', per: 'Encarregada', abans: 1, despres: 0 });
    expect(totals(c)).toMatchObject({ totalCents: 0, anullatsCents: 900 });
  });

  test('una línia nova no s’anul·la (es lleva) i una anul·lació parcial parteix la línia', () => {
    let c = afig(nova(), 'cervesa-barril', { quantitat: 3 });
    expect(() => anullaLinia(c, c.linies[0].id, { ara: DESPRES, motiu: 'x' })).toThrow(expect.objectContaining({ codi: 'NOVA' }));
    c = marxa(c, { ara: DESPRES });
    c = anullaLinia(c, c.linies[0].id, { ara: DESPRES, motiu: 'Vessada', quantitat: 1, idLinia: 'l-anul' });
    expect(c.linies.map((l) => [l.id === 'l-anul', l.quantitat, l.estat])).toEqual([[false, 2, 'marxada'], [true, 1, 'anullada']]);
    expect(totals(c).totalCents).toBe(360);
  });

  test('la nota d’una línia nova es canvia i es pot buidar', () => {
    let c = afig(nova(), 'tallat');
    c = canviaNota(c, c.linies[0].id, 'curt de cafè', { ara: DESPRES });
    expect(c.linies[0].nota).toBe('curt de cafè');
    c = canviaNota(c, c.linies[0].id, '', { ara: DESPRES });
    expect(c.linies[0]).not.toHaveProperty('nota');
  });
});

describe('sumaQuantitat (BAR-R5: + i − relatius a la comanda d’ara)', () => {
  test('dos + seguits sobre la comanda que ix de cada operació fan dues unitats; − mai baixa de 0', () => {
    const c = afig(nova(), 'tallat');
    const liniaId = c.linies[0].id;
    const dues = sumaQuantitat(sumaQuantitat(c, liniaId, 1, { ara: DESPRES }), liniaId, 1, { ara: DESPRES });
    expect(dues.linies[0].quantitat).toBe(3);
    const llevada = sumaQuantitat(c, liniaId, -1, { ara: DESPRES });
    expect(llevada.linies).toEqual([]);
    /* Un − que arriba quan la línia ja no hi és no canvia res. */
    expect(sumaQuantitat(llevada, liniaId, -1, { ara: DESPRES })).toBe(llevada);
    expect(() => sumaQuantitat(c, liniaId, 0, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'QUANTITAT' }));
    expect(() => sumaQuantitat(marxa(c, { ara: DESPRES }), liniaId, 1, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'MARXADA' }));
  });
});

describe('descomptes, convidades i totals', () => {
  test('descompte en percentatge (a la meitat cap amunt) i en import, sempre amb motiu', () => {
    let c = afig(nova(), 'cafe-llet', { quantitat: 3 });
    const liniaId = c.linies[0].id;
    expect(() => aplicaDescompte(c, liniaId, { tipus: 'percent', valor: 10 }, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'SENSE_MOTIU' }));
    c = aplicaDescompte(c, liniaId, { tipus: 'percent', valor: 15, motiu: 'Client habitual' }, { ara: DESPRES });
    /* 450 × 15 % = 67,5 → 68 */
    expect(totals(c)).toMatchObject({ brutCents: 450, descomptesCents: 68, totalCents: 382 });
    expect(() => aplicaDescompte(c, liniaId, { tipus: 'import', valor: 451, motiu: 'x' }, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'DESCOMPTE' }));
    c = aplicaDescompte(c, liniaId, { tipus: 'import', valor: 50, motiu: 'Promoció' }, { ara: DESPRES });
    expect(totals(c).totalCents).toBe(400);
    c = aplicaDescompte(c, liniaId, null, { ara: DESPRES });
    expect(totals(c).totalCents).toBe(450);
  });

  test('convidar deixa la línia a 0, lleva el descompte i compta a les convidades', () => {
    let c = afig(afig(nova(), 'cava'), 'olives');
    c = aplicaDescompte(c, c.linies[0].id, { tipus: 'percent', valor: 50, motiu: 'x' }, { ara: DESPRES });
    c = convida(c, c.linies[0].id, { motiu: 'Aniversari', ara: DESPRES });
    expect(c.linies[0]).not.toHaveProperty('descompte');
    expect(totals(c)).toMatchObject({ brutCents: 500, descomptesCents: 0, convidadesCents: 300, totalCents: 200 });
  });

  test('el desglossament d’IVA de la comanda: 1,00 € al 10 % → base 0,91 i quota 0,09', () => {
    const c = afig(nova(), 'aigua');
    expect(totals(c).perIva).toEqual([{ ivaPercent: 10, baseCents: 91, quotaCents: 9 }]);
  });

  test('cap operació deixa el pagat per damunt del total', () => {
    let c = afig(nova(), 'tallat', { quantitat: 2 });
    c = afegeixPagament(c, { metode: 'targeta', importCents: 260 }, { id: 'p-1', ara: DESPRES });
    expect(() => canviaQuantitat(c, c.linies[0].id, 1, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'PAGAT_SUPERA' }));
    expect(() => aplicaDescompte(c, c.linies[0].id, { tipus: 'percent', valor: 10, motiu: 'x' }, { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'PAGAT_SUPERA' }));
  });

  test('els diners són sempre cèntims enters i ≥ 0 en una venda (invariant 1)', () => {
    let c = afig(afig(afig(nova(), 'cafe-llet', { quantitat: 7 }), 'aigua', { varianteId: 'gran' }), 'croquetes');
    c = aplicaDescompte(c, c.linies[0].id, { tipus: 'percent', valor: 33, motiu: 'x' }, { ara: DESPRES });
    for (const valor of Object.values(totals(c)).filter((v) => typeof v === 'number')) {
      expect(Number.isSafeInteger(valor)).toBe(true);
      expect(valor).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('mouLinies (invariant 5)', () => {
  const nouIdLinia = () => id('mou');

  test('moure quantitats parcials conserva la suma, també amb descomptes en percentatge que s’arrodonirien diferent', () => {
    let origen = afig(afig(nova({ tipus: 'taula', taulaId: 't1' }), 'cafe-llet', { quantitat: 3, varianteId: 'got' }), 'aigua');
    origen = aplicaDescompte(origen, origen.linies[0].id, { tipus: 'percent', valor: 5, motiu: 'x' }, { ara: DESPRES });
    const desti = nova({ tipus: 'taula', taulaId: 't2' });
    const abans = totals(origen).totalCents + totals(desti).totalCents;
    const r = mouLinies(origen, desti, [{ liniaId: origen.linies[0].id, quantitat: 1 }, { liniaId: origen.linies[1].id }], { ara: DESPRES, nouIdLinia });
    expect(totals(r.origen).totalCents + totals(r.desti).totalCents).toBe(abans);
    expect(r.origen.linies.map((l) => l.quantitat)).toEqual([2]);
    expect(r.desti.linies.map((l) => [l.producteId, l.quantitat])).toEqual([['cafe-llet', 1], ['aigua', 1]]);
    expect(r.origen.historial.at(-1)).toMatchObject({ tipus: 'mou', altra: desti.id });
  });

  test('la mateixa suma en 200 casos de quantitats i percentatges', () => {
    for (let preu = 105; preu < 125; preu += 1) {
      for (const percent of [5, 15, 33, 50, 99]) {
        let origen = afig(nova(), 'varis', { preuCents: preu, quantitat: 3 });
        origen = aplicaDescompte(origen, origen.linies[0].id, { tipus: 'percent', valor: percent, motiu: 'x' }, { ara: DESPRES });
        const abans = totals(origen).totalCents;
        const r = mouLinies(origen, nova(), [{ liniaId: origen.linies[0].id, quantitat: 1 }], { ara: DESPRES, nouIdLinia });
        expect(totals(r.origen).totalCents + totals(r.desti).totalCents, `${preu} ${percent}`).toBe(abans);
      }
    }
  });

  test('no es mou una línia anul·lada, ni més unitats de les que té, ni a la mateixa comanda', () => {
    let c = marxa(afig(nova(), 'tallat', { quantitat: 2 }), { ara: DESPRES });
    expect(() => mouLinies(c, nova(), [{ liniaId: c.linies[0].id, quantitat: 3 }], { ara: DESPRES, nouIdLinia })).toThrow(expect.objectContaining({ codi: 'QUANTITAT' }));
    expect(() => mouLinies(c, c, [{ liniaId: c.linies[0].id }], { ara: DESPRES, nouIdLinia })).toThrow(expect.objectContaining({ codi: 'MATEIXA' }));
    c = anullaLinia(c, c.linies[0].id, { motiu: 'x', ara: DESPRES });
    expect(() => mouLinies(c, nova(), [{ liniaId: c.linies[0].id }], { ara: DESPRES, nouIdLinia })).toThrow(expect.objectContaining({ codi: 'ANULLADA' }));
  });

  test('ajuntar taules: tota la comanda passa al destí i l’origen queda buit', () => {
    const origen = afig(afig(nova(), 'tallat'), 'olives');
    const desti = afig(nova(), 'cava');
    const r = mouLinies(origen, desti, origen.linies.map((l) => ({ liniaId: l.id })), { ara: DESPRES, nouIdLinia });
    expect(r.origen.linies).toEqual([]);
    expect(totals(r.desti).totalCents).toBe(130 + 200 + 300);
  });
});

describe('comandaObertaDe', () => {
  test('barra: la més recent · taula: la primera de la taula · per emportar: cap', () => {
    const a = creaComanda({ id: 'c-a', tornId: 't', origen: { tipus: 'barra' }, ara: '2026-10-02T08:00:00.000Z' });
    const b = creaComanda({ id: 'c-b', tornId: 't', origen: { tipus: 'barra' }, ara: '2026-10-02T09:00:00.000Z' });
    const t1 = creaComanda({ id: 'c-t1', tornId: 't', origen: { tipus: 'taula', taulaId: 't1' }, ara: '2026-10-02T08:30:00.000Z' });
    const t1b = creaComanda({ id: 'c-t1b', tornId: 't', origen: { tipus: 'taula', taulaId: 't1' }, ara: '2026-10-02T09:30:00.000Z' });
    const e = creaComanda({ id: 'c-e', tornId: 't', origen: { tipus: 'emportar' }, ara: ARA });
    const totes = [t1b, b, e, a, t1];
    expect(comandaObertaDe(totes, { tipus: 'barra' }).id).toBe('c-b');
    expect(comandaObertaDe(totes, { tipus: 'taula', taulaId: 't1' }).id).toBe('c-t1');
    expect(comandaObertaDe(totes, { tipus: 'taula', taulaId: 't2' })).toBeNull();
    expect(comandaObertaDe(totes, { tipus: 'emportar' })).toBeNull();
    expect(comandaObertaDe([], { tipus: 'barra' })).toBeNull();
  });
});

describe('adoptaComanda', () => {
  test('passa de torn sense pagaments i ho anota; amb pagaments, no', () => {
    const c = afig(nova(), 'tallat');
    expect(adoptaComanda(c, 'torn-2', { ara: DESPRES })).toMatchObject({ tornId: 'torn-2' });
    const pagada = afegeixPagament(afig(c, 'olives'), { metode: 'efectiu', importCents: 100 }, { id: 'p-9', ara: DESPRES });
    expect(() => adoptaComanda(pagada, 'torn-2', { ara: DESPRES })).toThrow(expect.objectContaining({ codi: 'AMB_PAGAMENTS' }));
  });
});
