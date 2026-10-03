// @vitest-environment node
/* El Bar · nucli/fullTancament.js — sdp.bar.tancament.v1 i el full XLSX/CSV del tancament. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_TANCAMENT, exportaTancament, fullTancament, validaTancament } from './fullTancament.js';
import { arqueig, obriTorn, resumTorn, tancaTorn } from './torn.js';
import { notaDeTraspas } from './traspas.js';
import { afegeixPagament, tanca } from './cobrament.js';
import { afegeixProducte, anullaLinia, creaComanda, marxa, totals } from './comanda.js';
import { creaDevolucio } from './tiquet.js';
import { llavorCarta } from './llavor.js';
import { comprovaModel, creaXlsx, fullaACsv, llegeixZip } from '../../../utils/fulls/index.js';

const ARA = '2026-10-02T10:00:00.000Z';
const TANCAT = '2026-10-02T14:00:00.000Z';
const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
let n = 0;
const nouId = (prefix = 'l') => { n += 1; return `${prefix}-${n}`; };
const hora = () => '12:00';

function tornTancat() {
  const torn = obriTorn({ id: 'torn-x', per: 'Cambrer 1', fonsInicialCents: 5000, ara: ARA });
  let c = creaComanda({ id: 'c-1', tornId: torn.id, origen: { tipus: 'barra' }, ara: ARA });
  c = afegeixProducte(c, { producte: P('cafe-sol'), ivaPerDefecte: 10, quantitat: 2 }, { ara: ARA, idLinia: nouId() });
  c = afegeixProducte(c, { producte: P('croquetes'), ivaPerDefecte: 10 }, { ara: ARA, idLinia: nouId() });
  c = marxa(c, { ara: ARA });
  c = anullaLinia(c, c.linies[1].id, { motiu: '=1+1 cremades', ara: ARA });
  c = afegeixPagament(c, { metode: 'efectiu', importCents: totals(c).pendentCents, lliuratCents: 500 }, { id: 'p-1', ara: ARA });
  const tiquet = tanca(c, { numero: 1, ara: ARA });
  const dev = creaDevolucio(tiquet, [{ liniaId: tiquet.linies[0].id, quantitat: 1 }], { motiu: 'Fred', metode: 'efectiu', id: 'k-2', ara: ARA, numero: 2, tornId: torn.id });
  const tiquets = [tiquet, dev];
  const resum = resumTorn(torn, tiquets, [], { categories: CARTA.categories });
  const perDenominacio = { 5000: 1, 100: 1, 20: 1 };
  const traspas = notaDeTraspas({ torn, resum, fonsDeixatCents: 5000, diferenciaCaixaCents: arqueig(perDenominacio) - resum.efectiuEsperatCents, ara: TANCAT });
  return { torn: tancaTorn(torn, { arqueig: { perDenominacio }, resum, traspas, ara: TANCAT }), tiquets };
}

describe('sdp.bar.tancament.v1', () => {
  test('la forma del contracte, que valida i fa el viatge per JSON', () => {
    const { torn } = tornTancat();
    const json = exportaTancament(torn);
    expect(Object.keys(json)).toEqual(['schema', 'tornId', 'obertA', 'tancatA', 'diferenciaCaixaCents', 'resum']);
    expect(Object.keys(json.resum)).toEqual(['vendesPerMetode', 'tiquets', 'tiquetMitjaCents', 'devolucionsCents', 'anullacions',
      'descomptesCents', 'convidadesCents', 'perCategoria', 'perProducte']);
    expect(json).toMatchObject({
      schema: ESQUEMA_TANCAMENT, tornId: 'torn-x', diferenciaCaixaCents: 0,
      resum: { vendesPerMetode: { efectiu: 240, targeta: 0, altre: 0 }, tiquets: 1, devolucionsCents: 120, anullacions: { nombre: 1, importCents: 700 } }
    });
    expect(json.resum.perProducte).toEqual([{ producteId: 'cafe-sol', nom: 'Cafè sol', unitats: 1, importCents: 120, costCents: 20 }]);
    expect(validaTancament(JSON.parse(JSON.stringify(json)))).toEqual({ ok: true, errors: [] });
    expect(validaTancament({ ...json, diferenciaCaixaCents: 0.5 }).ok).toBe(false);
  });

  test('només s’exporta un torn tancat', () => {
    expect(() => exportaTancament(obriTorn({ id: 'torn-y', per: 'x', fonsInicialCents: 0, ara: ARA }))).toThrow(expect.objectContaining({ codi: 'TORN' }));
  });
});

describe('el full del tancament', () => {
  test('quatre fulles vàlides per a utils/fulls, amb anul·lacions i devolucions', () => {
    const { torn, tiquets } = tornTancat();
    const model = fullTancament(torn, tiquets, { hora });
    expect(() => comprovaModel(model)).not.toThrow();
    expect(model.fulles.map((f) => f.nom)).toEqual(['Resum', 'Per producte', 'Moviments', 'Anul·lacions']);
    const anullacions = model.fulles[3].files;
    expect(anullacions).toEqual([
      ['12:00', 'Nota 0001', 'Anul·lació', 'Croquetes', 1, 700, '=1+1 cremades'],
      ['12:00', 'Nota 0002', 'Devolució', 'Cafè sol', 1, -120, 'Fred']
    ]);
    const resum = Object.fromEntries(model.fulles[0].files.map(([concepte, importCents]) => [concepte, importCents]));
    /* fons 50,00 + efectiu venut 2,40 − retornat 1,20 */
    expect(resum).toMatchObject({ 'Efectiu esperat': 5120, 'Efectiu comptat': 5120, 'Diferència de caixa': 0, 'Fons que es deixa': 5000 });
  });

  test('l’XLSX i el CSV s’escriuen, i un motiu que comença per «=» no s’executa com a fórmula', () => {
    const { torn, tiquets } = tornTancat();
    const model = fullTancament(torn, tiquets, { hora });
    const xlsx = creaXlsx(model);
    expect(xlsx).toBeInstanceOf(Uint8Array);
    expect(llegeixZip(xlsx).map((e) => e.nom)).toEqual(expect.arrayContaining(['xl/worksheets/sheet4.xml']));
    const csv = fullaACsv(model.fulles[3]);
    expect(csv).toContain("'=1+1 cremades");
    expect(csv).not.toMatch(/;=1\+1/);
  });
});
