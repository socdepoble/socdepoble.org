// @vitest-environment node
/* El Bar · nucli/consum.js — el consum teòric d'ingredients d'un torn (Onada
   12, 261011; ordres 261011_0130, punt 6: el lligam TPV → Rebost). Tiquets
   REALS, fets amb el nucli sobre la carta d'exemple, que porta dos escandalls:
   l'entrepà de truita (1 pa, 2 ous, 20 ml d'oli, 150 g de creïlla amb un 20 %
   de minva) i el cafè amb llet en tassa (8 g de cafè, 120 ml de llet). */
import { describe, expect, test } from 'vitest';
import { afegeixPagament, tanca } from './cobrament.js';
import { afegeixProducte, anullaLinia, creaComanda, marxa, totals } from './comanda.js';
import { consumDeVendes } from './consum.js';
import { fullTancament } from './fullTancament.js';
import { llavorCarta } from './llavor.js';
import { creaDevolucio } from './tiquet.js';
import { arqueig, obriTorn, resumTorn, tancaTorn } from './torn.js';
import { notaDeTraspas } from './traspas.js';
import { comprovaModel } from '../../../utils/fulls/index.js';

const ARA = '2026-10-02T10:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };

/* Un tiquet de venda tancat amb estes línies: [[producteId, quantitat, varianteId?]]. */
function venda(linies, { numero = 1, tornId = 'torn-x' } = {}) {
  let c = creaComanda({ id: nouId('c'), tornId, origen: { tipus: 'barra' }, ara: ARA });
  for (const [producteId, quantitat, varianteId] of linies) {
    c = afegeixProducte(c, { producte: P(producteId), ivaPerDefecte: 10, quantitat, ...(varianteId ? { varianteId } : {}) }, { ara: ARA, idLinia: nouId() });
  }
  c = afegeixPagament(c, { metode: 'targeta', importCents: totals(c).pendentCents }, { id: nouId('p'), ara: ARA });
  return tanca(c, { numero, ara: ARA });
}
const perId = (consum) => Object.fromEntries(consum.ingredients.map((i) => [i.ingredientId, [i.quantitat, i.quantitatBruta, i.unitatBase]]));

describe('consumDeVendes', () => {
  test('tres entrepans de truita: la composició per les unitats, i la minva de la creïlla a la quantitat bruta', () => {
    const consum = consumDeVendes([venda([['entrepa-truita', 3]])], CARTA);
    expect(perId(consum)).toEqual({
      'pa-barra': [3, 3, 'u'], ous: [6, 6, 'u'], oli: [60, 60, 'ml'],
      /* 450 g nets; amb un 20 % de minva cal haver-ne comprat 450 / 0,8 = 562,5 → 563. */
      creilles: [450, 563, 'g']
    });
    expect(consum.ingredients.map((i) => i.nom)).toEqual(['Creïlles', 'Oli d’oliva', 'Ous', 'Pa de barra']);
    expect(consum.senseEscandall).toEqual([]);
  });

  test('l’escandall és de la variant: el cafè amb llet en tassa gasta, i en got (sense escandall) va a «sense escandall»', () => {
    const consum = consumDeVendes([venda([['cafe-llet', 2, 'tassa'], ['cafe-llet', 1, 'got']])], CARTA);
    expect(perId(consum)).toEqual({ 'cafe-gra': [16, 16, 'g'], llet: [240, 240, 'ml'] });
    expect(consum.senseEscandall).toEqual([{ producteId: 'cafe-llet', nom: 'Cafè amb llet', unitats: 1 }]);
  });

  test('suma entre tiquets i entre productes que compartixen ingredient; el que no té escandall es diu amb les unitats', () => {
    const consum = consumDeVendes([
      venda([['entrepa-truita', 1], ['olives', 2]], { numero: 1 }), venda([['entrepa-truita', 2], ['olives', 1], ['aigua', 4]], { numero: 2 })
    ], CARTA);
    expect(perId(consum).ous).toEqual([6, 6, 'u']);
    expect(consum.senseEscandall).toEqual([
      { producteId: 'aigua', nom: 'Aigua', unitats: 4 }, { producteId: 'olives', nom: 'Olives', unitats: 3 }
    ]);
  });

  test('una devolució no torna res al rebost, una línia anul·lada no gasta i una comanda oberta no és cap venda', () => {
    const tiquet = venda([['entrepa-truita', 2]]);
    const devolucio = creaDevolucio(tiquet, [{ liniaId: tiquet.linies[0].id, quantitat: 1 }], { motiu: 'Fred', metode: 'efectiu', id: 'k-1', ara: ARA, numero: 2, tornId: 'torn-x' });
    expect(perId(consumDeVendes([tiquet, devolucio], CARTA)).ous).toEqual([4, 4, 'u']);

    let c = creaComanda({ id: 'c-anullada', tornId: 'torn-x', origen: { tipus: 'barra' }, ara: ARA });
    c = afegeixProducte(c, { producte: P('entrepa-truita'), ivaPerDefecte: 10 }, { ara: ARA, idLinia: 'l-a' });
    c = afegeixProducte(c, { producte: P('entrepa-truita'), ivaPerDefecte: 10, nota: 'sense sal' }, { ara: ARA, idLinia: 'l-b' });
    const oberta = c;
    c = anullaLinia(marxa(c, { ara: ARA }), 'l-b', { motiu: 'Error', ara: ARA });
    c = afegeixPagament(c, { metode: 'efectiu', importCents: totals(c).pendentCents }, { id: 'p-a', ara: ARA });
    expect(perId(consumDeVendes([tanca(c, { numero: 3, ara: ARA })], CARTA)).ous).toEqual([2, 2, 'u']);
    expect(consumDeVendes([oberta], CARTA)).toEqual({ ingredients: [], senseEscandall: [] });
  });

  test('un escandall de diverses racions s’arrodoneix una sola vegada, a la meitat cap amunt', () => {
    const carta = {
      ...CARTA,
      escandalls: [{ id: 'olives', producteId: 'olives', racions: 3, altresCostosCents: 0, ingredients: [{ ingredientId: 'oli', quantitat: 10 }] }]
    };
    /* 10 ml per a 3 racions: 1 unitat → 3,33 → 3; 2 → 6,67 → 7; 5 → 16,67 → 17 (no 5 × 3). */
    expect(perId(consumDeVendes([venda([['olives', 1]])], carta)).oli).toEqual([3, 3, 'ml']);
    expect(perId(consumDeVendes([venda([['olives', 2]])], carta)).oli).toEqual([7, 7, 'ml']);
    expect(perId(consumDeVendes([venda([['olives', 5]])], carta)).oli).toEqual([17, 17, 'ml']);
  });

  test('un escandall trencat (un ingredient que no existix) no es conta a mitges: el producte va a «sense escandall»', () => {
    const carta = { ...CARTA, ingredients: CARTA.ingredients.filter((i) => i.id !== 'ous') };
    const consum = consumDeVendes([venda([['entrepa-truita', 2]])], carta);
    expect(consum.ingredients).toEqual([]);
    expect(consum.senseEscandall).toEqual([{ producteId: 'entrepa-truita', nom: 'Entrepà de truita', unitats: 2 }]);
  });

  /* Correccions del refutador (261011, T4). */
  test('T4 · una variant que ja no és a la carta no agafa en silenci l’escandall d’una altra: va a «sense escandall»', () => {
    const tiquet = venda([['cafe-llet', 2, 'got']]);
    const senseGot = { ...CARTA, productes: CARTA.productes.map((p) => (p.id === 'cafe-llet' ? { ...p, variants: p.variants.filter((v) => v.id !== 'got') } : p)) };
    const consum = consumDeVendes([tiquet], senseGot);
    expect(consum.ingredients).toEqual([]);
    expect(consum.senseEscandall).toEqual([{ producteId: 'cafe-llet', nom: 'Cafè amb llet', unitats: 2 }]);
  });

  test('T4 · la quantitat amb minva es calcula des de la quantitat exacta, no des de la neta ja arrodonida (un sol arrodoniment cada una)', () => {
    const carta = {
      ...CARTA,
      escandalls: [{ id: 'olives', producteId: 'olives', racions: 3, altresCostosCents: 0, ingredients: [{ ingredientId: 'creilles', quantitat: 10 }] }]
    };
    /* 2 unitats × 10 g / 3 racions = 6,67 → 7 g nets. Amb un 20 % de minva: 6,67 / 0,8 = 8,33 → 8 g
       (arrodonint dues vegades eixiria 7 / 0,8 = 8,75 → 9). */
    expect(perId(consumDeVendes([venda([['olives', 2]])], carta)).creilles).toEqual([7, 8, 'g']);
  });

  test('un producte que ja no és a la carta, i entrades buides: mai llança', () => {
    const carta = { ...CARTA, productes: CARTA.productes.filter((p) => p.id !== 'entrepa-truita') };
    expect(consumDeVendes([venda([['entrepa-truita', 1]])], carta).senseEscandall).toEqual([{ producteId: 'entrepa-truita', nom: 'Entrepà de truita', unitats: 1 }]);
    expect(consumDeVendes(null, null)).toEqual({ ingredients: [], senseEscandall: [] });
    expect(consumDeVendes([null, {}, { estat: 'tancada', tipus: 'venda' }], {})).toEqual({ ingredients: [], senseEscandall: [] });
  });
});

describe('la fulla «Consum d’ingredients» del tancament', () => {
  function tornTancat() {
    const torn = obriTorn({ id: 'torn-x', per: 'Cambrer 1', fonsInicialCents: 0, ara: ARA });
    const tiquets = [venda([['entrepa-truita', 2], ['olives', 1]])];
    const resum = resumTorn(torn, tiquets, [], { categories: CARTA.categories });
    const traspas = notaDeTraspas({ torn, resum, diferenciaCaixaCents: arqueig({}) - resum.efectiuEsperatCents, ara: ARA });
    return { torn: tancaTorn(torn, { arqueig: { perDenominacio: {} }, resum, traspas, ara: ARA }), tiquets };
  }

  test('amb la carta, una cinquena fulla vàlida: els ingredients i, darrere, el venut sense escandall', () => {
    const { torn, tiquets } = tornTancat();
    const model = fullTancament(torn, tiquets, { hora: () => '12:00', carta: CARTA });
    expect(() => comprovaModel(model)).not.toThrow();
    expect(model.fulles.map((f) => f.nom)).toEqual(['Resum', 'Per producte', 'Moviments', 'Anul·lacions', 'Consum d’ingredients']);
    expect(model.fulles[4].files).toEqual([
      ['Creïlles', 'g', 300, 375, ''], ['Oli d’oliva', 'ml', 40, 40, ''], ['Ous', 'u', 4, 4, ''], ['Pa de barra', 'u', 2, 2, ''],
      ['Olives', 'u', 1, '', 'Venut sense escandall: no se’n sap el consum']
    ]);
  });

  test('sense la carta, les quatre fulles de sempre', () => {
    const { torn, tiquets } = tornTancat();
    expect(fullTancament(torn, tiquets, { hora: () => '12:00' }).fulles.map((f) => f.nom)).toEqual(['Resum', 'Per producte', 'Moviments', 'Anul·lacions']);
  });

  test('els tiquets d’un altre torn no hi entren', () => {
    const { torn, tiquets } = tornTancat();
    const dUnAltre = venda([['entrepa-truita', 5]], { tornId: 'torn-y' });
    const model = fullTancament(torn, [...tiquets, dUnAltre], { hora: () => '12:00', carta: CARTA });
    expect(model.fulles[4].files.find((fila) => fila[0] === 'Ous')).toEqual(['Ous', 'u', 4, 4, '']);
  });
});
