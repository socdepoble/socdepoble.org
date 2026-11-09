import { describe, expect, it } from 'vitest';
import { calculaEscandall, costCompraPack, costConsum, costCopa, fiscalVenda } from './escandall.js';
import { ALERGENS, agregaMatrius, matriuAlergens, matriuDeProducte } from './allergens.js';
import { candidatsCulturals, carregaConnexionsCulturals, carregaReceptes, creaEsborranyTrasllat, dataISOValida, escandallRecepta, mesuraIngredient, validaEsborranyTrasllat, validaReceptari } from './horitzontal.js';
const farina = { id: 'farina', quantitat: 100, unitat: 'g', quantitatCompra: 1, unitatCompra: 'kg', preuCents: 150, minvaPercent: 0 };
describe('Allergen evidence', () => {
  it('empty template is14unknowns', () => { expect(ALERGENS).toHaveLength(14); expect(Object.values(matriuAlergens()).every((x) => x.estat === 'desconegut')).toBe(true); });
  it('requires evidence for absence', () => { expect(() => matriuAlergens({ gluten: { estat: 'absent' } })).toThrow(); expect(matriuDeProducte({ alergensAbsents: ['gluten'] }).gluten.estat).toBe('desconegut'); });
  it('ingredient dominates trace; absence needs preparationreview', () => {
    const a = { gluten: { estat: 'ingredient', font: 'labelA' } }, t = { gluten: { estat: 'traca', font: 'labelB' } }, n = { gluten: { estat: 'absent', font: 'labelC' } };
    expect(agregaMatrius([t, a]).gluten.simbol).toBe('•'); expect(agregaMatrius([t, n]).gluten.simbol).toBe('T'); expect(agregaMatrius([n]).gluten.estat).toBe('desconegut'); expect(agregaMatrius([n], true).gluten.estat).toBe('absent');
  });
});
describe('Recipe and cultural boundaries', () => {
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1000001])('refuses an invalid quantity before constructing a transfer: %s', (quantitat) => {
    expect(() => creaEsborranyTrasllat({ slug: 'test', ingredients: ['100 g de farina'] }, { racions: 8, racionsBase: 2, seleccions: { 0: { quantitat, unitat: 'g' } } })).toThrow(RangeError);
  });
  it('every constructed transfer satisfies the receiving contract', () => {
    const recepta = { slug: 'test', ingredients: ['100 g de farina'] };
    const draft = creaEsborranyTrasllat(recepta, { racions: 8, racionsBase: 2 });
    expect(validaEsborranyTrasllat(draft, 'test')).toBe(true);
    expect(draft.linies[0].quantitat).toBe(100);
    expect(recepta.ingredients).toEqual(['100 g de farina']);
    expect(() => creaEsborranyTrasllat(recepta, { racions: 8, racionsBase: 2, seleccions: { 0: { quantitat: 100, unitat: 'unitat-no-admesa' } } })).toThrow(RangeError);
  });
  it('rejects invalidcalendar dates, malformed drafts and incomplete measure pairs', () => {
    expect(dataISOValida('2026-02-31')).toBe(false); expect(dataISOValida('2024-02-29')).toBe(true);
    expect(validaEsborranyTrasllat({ v: 1, slug: 'test', racions: 4, racionsBase: 4, linies: [null] }, 'test')).toBe(false);
    expect(() => creaEsborranyTrasllat({ slug: 'test', ingredients: ['Oli d’oliva'] }, { racions: 4, racionsBase: 4, seleccions: { 0: { quantitat: 100 } } })).toThrow(/quantitat i unitat/);
  });
  it('never prices unresolved compound lines, even with an enteredquantity', () => {
    for (const text of ['250 g de farina, ou, llet i sucre', 'Clòtxines i tellines (petxines)', 'Oli d’oliva i sal']) {
      expect(mesuraIngredient(text).compost).toBe(true);
      expect(escandallRecepta({ id: 'x', ingredients: [text] }, { racions: 4, racionsBase: 4, seleccions: { 0: { producteId: 'p', quantitat: 100, unitat: 'g', minvaPercent: 0 } }, productes: [{ id: 'p', preuUnitariCentims: 150, unitatPreuUnitari: 'kg' }] }).costTotalCents).toBeNull();
    }
  });
  it('malformed imported data fails before a React consumer', () => { expect(() => validaReceptari({ receptes: [null] })).toThrow(); });
  it('keeps rational serving scale until finalrounding', () => {
    const r = escandallRecepta({ id: 'test', ingredients: ['5 g de sal'] }, { racions: 1, racionsBase: 6, seleccions: { 0: { producteId: 'sal', minvaPercent: 0 } }, productes: [{ id: 'sal', preuUnitariCentims: 3000, unitatPreuUnitari: 'kg' }] }); expect(r.costTotalCents).toBe(3);
  });
  it.each(['un raig d’oli', '1 g - 2 g de sal', '1 a 2 kg de farina', 'sal al gust'])('does not invent measure%s', (text) => { expect(mesuraIngredient(text).quantitat).toBeNull(); });
  it('parses explicit millilitres', () => { expect(mesuraIngredient('700 mil·lilitres aigua tèbia')).toMatchObject({ quantitat: 700, unitat: 'ml' }); });
  it('loads149recipes without fixedprices', async () => {
    const { receptes, items, metadades } = await carregaReceptes(); expect(receptes).toHaveLength(149); expect(items).toHaveLength(149); expect(metadades.preusImportats).toBe(0); expect(receptes.every((r) => r.font.sha256.length === 64 && !r.escandall)).toBe(true);
  });
  it('real125varieties117plants; lexical links are candidates', async () => {
    const c = await carregaConnexionsCulturals(); expect(c.llavors).toHaveLength(125); expect(c.plantes).toHaveLength(117); expect(candidatsCulturals(['tomaca'], { llavors: [{ id: 'x', nom: 'Tomaca valenciana' }] }).llavors[0]).toMatchObject({ estat: 'candidat' });
  });
});
describe('Physical and financial independent examples', () => {
  it('25%yield loss on750g requires1kg bought', () => { expect(costConsum({ ...farina, quantitat: 750, minvaPercent: 25 })).toBe(150); });
  it('70cl bottle at14€ has5cl cost1€', () => { expect(costCopa({ preuBotellaCents: 1400, volumBotellaCl: 70, volumCopaCl: 5 })).toBe(100); });
  it('rounds after accumulation of fractional cents', () => {
    const r = calculaEscandall({ racions: 2, linies: [1, 2, 3].map((id) => ({ ...farina, id, preuCents: 10, quantitat: 40 })) });
    expect(r.linies.map((l) => l.costCents)).toEqual([0, 0, 0]); expect(r.costTotalCents).toBe(1); expect(r.costRacioCents).toBe(1);
  });
  it('missing price/minva never become a full total', () => {
    expect(calculaEscandall({ racions: 4, linies: [farina, { ...farina, preuCents: null }, { ...farina, minvaPercent: null }] })).toMatchObject({ estat: 'parcial', costParcialCents: 15, costTotalCents: null, costRacioCents: null, pendents: 2 });
  });
  it.each([100, -1, NaN, Infinity])('rejects minva%s', (minvaPercent) => { expect(() => costConsum({ ...farina, minvaPercent })).toThrow(); });
  it('does not invent density', () => { expect(() => costConsum({ ...farina, unitat: 'ml' })).toThrow(/Unitats incompatibles/); });
  it('sale11€ has10€base and5€profit', () => { expect(fiscalVenda({ pvpCents: 1100, costCompraCents: 500 })).toMatchObject({ baseImposableCents: 1000, ivaVendaCents: 100, guanyNetCents: 500, margePermil: 500 }); });
  it.each([[4, 50], [10, 140], [21, 520]])('surcharge IVA%s opt-in', (ivaPercent, recarrecCents) => {
    expect(costCompraPack({ preuPackCents: 10000, unitatsPack: 10, ivaPercent })).toMatchObject({ costUnitatCents: 1000, recarrecCents: 0 });
    expect(costCompraPack({ preuPackCents: 10000, unitatsPack: 10, ivaPercent, recarrecEquivalencia: true, ivaDeductible: false })).toMatchObject({ recarrecCents });
  });
  it('rejects stringIVA and unsafe result', () => { expect(() => fiscalVenda({ pvpCents: 1100, costCompraCents: 500, ivaVendaPercent: '10' })).toThrow(); expect(() => fiscalVenda({ pvpCents: 0, costCompraCents: Number.MAX_SAFE_INTEGER, altresCostosCents: 2 })).toThrow(); });
});
