// @vitest-environment node
/* Gestoria · nucli · concilia: una prova per regla (R1-R7), les finestres,
   les ambigüitats, el rang i que no es modifica res del que entra. Al final,
   el camí sencer: Norma 43 sintètica → fusió amb el CSV → conciliació.
   Totes les dades són sintètiques: cap data, import, número ni text ve d'un
   extracte real, i la targeta porta el prefix de prova 999999. */
import { describe, expect, test } from 'vitest';
import { llegeixC43 } from './c43.js';
import { CODIS_CONCILIACIO, FINESTRES, REGLES_CONCILIACIO, citaNumero, concilia } from './concilia.js';
import { crearFactura } from './model.js';
import { fusionaMoviments, llegeixMovimentsCsv } from './movimentsBanc.js';
import { aprenProveidors } from './proveidors.js';

const data = (text) => {
  const [a, m, d] = text.split('-').map(Number);
  return { a, m, d };
};
let linies = 0;
/* Un moviment amb la forma dels de llegeixC43. */
function mov(dataOperacio, centims, { valor = dataOperacio, comu = '99', conceptes = [], ref1 = '', ref2 = '', document = '0000000000', ...extra } = {}) {
  linies += 1;
  return {
    linia: linies, oficina: '0001', dataOperacio: data(dataOperacio), dataValor: data(valor), conceptComu: comu, conceptPropi: '000',
    centims, document, ref1, ref2, conceptes: conceptes.map(([codi, a, b = '']) => ({ codi, camps: [a, b] })), ...extra
  };
}
const factura = (camps) => crearFactura({ tipus: 'despesa', origen: { fitxer: `factures/${camps.num ?? 'sense-numero'}.pdf`, metode: 'pdf' }, ...camps });
const sepa = (cif) => ({ esquema: 'CORE', creditor: 'SUBMINISTRAMENTS SINTETICS SL', idCreditor: `ES12000${cif}`, cif, mandat: 'MANDAT-0001' });
const resum = (parelles) => parelles.map((p) => [p.regla, p.confianca, p.moviments.map((m) => m.linia), p.factures.map((f) => f.num), p.diferencia]);
const codis = (r) => r.incidencies.map((i) => i.codi);

function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    for (const fill of Object.values(valor)) congela(fill);
  }
  return valor;
}

describe('citaNumero', () => {
  test('paraules senceres i seguides, sense comptar espais, guions ni barres', () => {
    expect(citaNumero('ABONO FACTURA Q27 0815', 'Q270815')).toBe(true);
    expect(citaNumero('Telefonia.exemple:/SI00000000000042/', 'SI00000000000042')).toBe(true);
    expect(citaNumero('REF/Q27-0815/', 'Q27 0815')).toBe(true);
    expect(citaNumero('Factura Ñandú-0042', 'NANDU-0042')).toBe(true);
    expect(citaNumero('PAGO XQ270815', 'Q270815')).toBe(false);
    expect(citaNumero('PAGO Q2708151', 'Q270815')).toBe(false);
  });

  test('un número massa curt no es cita mai', () => {
    expect(citaNumero('NUM 12345', '12345')).toBe(false);
    expect(citaNumero('NUM 123456', '123456')).toBe(true);
    expect(citaNumero('A 12', 'A12')).toBe(false);
    expect(citaNumero('A 123', 'A-123')).toBe(true);
    expect(citaNumero('', '')).toBe(false);
  });

  test('un tros d’un grup de xifres enganxades no és cap cita: una data no cita la factura «2099-07»', () => {
    expect(citaNumero('PERIODE 2099-07-15', '2099-07')).toBe(false);
    expect(citaNumero('PERIODE 15.2099/07', '2099-07')).toBe(false);
    expect(citaNumero('FRA Q27-0815-2', 'Q27-0815')).toBe(false);
    expect(citaNumero('LLOGUER 2099/07', '2099-07')).toBe(true);
    expect(citaNumero('DIA 15 2099-07', '2099-07')).toBe(true);
    expect(citaNumero('FRA Q27-0815 15/07/2099', 'Q27-0815')).toBe(true);
  });
});

describe('R1 · el moviment cita el número de la factura', () => {
  test('alta i sense diferència', () => {
    const f = factura({ num: 'SINT-2099-0042', data: '2099-07-10', contrapart: 'Proveidora Exemple', total: 13417 });
    const m = mov('2099-07-20', -13417, { comu: '04', conceptes: [['01', 'TRANSFERENCIA EMESA', 'FRA SINT 2099 0042']] });
    const r = concilia({ moviments: [m], factures: [f] });
    expect(r.parelles).toEqual([{ moviments: [m], factures: [f], regla: 'R1', confianca: 'alta', diferencia: 0 }]);
    expect(r).toMatchObject({ movimentsSenseFactura: [], facturesSensePagament: [], incidencies: [] });
  });

  test('un import que no quadra: la parella es fa mitjana, amb la diferència i una incidència', () => {
    const f = factura({ num: 'SINT-2099-0043', data: '2099-07-10', total: 13417 });
    const m = mov('2099-07-20', -13317, { ref2: 'SINT-2099-0043' });
    const r = concilia({ moviments: [m], factures: [f] });
    expect(resum(r.parelles)).toEqual([['R1', 'mitjana', [m.linia], ['SINT-2099-0043'], 100]]);
    expect(r.incidencies).toEqual([expect.objectContaining({ codi: 'IMPORT_DIFERENT', severitat: 'mitjana', linia: m.linia })]);
  });

  test('si un altre moviment la paga exacta, la citació sense l’import no se l’endú', () => {
    const f = factura({ num: 'SINT-2099-0050', data: '2099-07-10', contrapart: 'Proveidora Exemple', total: 13417 });
    const cita = mov('2099-07-12', -13317, { ref2: 'SINT-2099-0050' });
    const paga = mov('2099-07-15', -13417, { comu: '04', conceptes: [['01', 'TRANSFERENCIA EMESA']] });
    const r = concilia({ moviments: [cita, paga], factures: [f] });
    expect(resum(r.parelles)).toEqual([['R3', 'mitjana', [paga.linia], ['SINT-2099-0050'], 0]]);
    expect(r.movimentsSenseFactura).toEqual([cita]);
    expect(r.incidencies).toEqual([]);
  });

  test('una data dels conceptes no cita la factura «2099-07»: la paga el moviment de l’import exacte', () => {
    const f = factura({ num: '2099-07', data: '2099-07-10', contrapart: 'Lloguers Exemple', total: 6158 });
    const periode = mov('2099-07-15', -1373, { comu: '03', conceptes: [['03', 'PERIODE 2099-07-15']] });
    const paga = mov('2099-07-16', -6158, { comu: '04', conceptes: [['01', 'TRANSFERENCIA EMESA']] });
    const r = concilia({ moviments: [periode, paga], factures: [f] });
    expect(resum(r.parelles)).toEqual([['R3', 'mitjana', [paga.linia], ['2099-07'], 0]]);
    expect(r.movimentsSenseFactura).toEqual([periode]);
    expect(r.incidencies).toEqual([]);
  });

  test('un ingrés cobrat per transferència; el signe ha de quadrar', () => {
    const emesa = factura({ tipus: 'ingres', num: 'Q270815', data: '2099-08-03', contrapart: 'Client Exemple', total: 61743 });
    const cobrament = mov('2099-08-19', 61743, { comu: '02', conceptes: [['01', 'TRANSFERENCIA DE CLIENT EXEMPLE', 'ABONO FACTURA Q27 0815']] });
    const carrec = mov('2099-08-20', -61743, { conceptes: [['01', 'Q27 0815']] });
    const r = concilia({ moviments: [carrec, cobrament], factures: [emesa] });
    expect(resum(r.parelles)).toEqual([['R1', 'alta', [cobrament.linia], ['Q270815'], 0]]);
    expect(r.movimentsSenseFactura).toEqual([carrec]);
  });
});

describe('R4 · diverses factures', () => {
  const q1 = factura({ num: 'QT-2099-01', data: '2099-07-20', contrapart: 'Gestora Exemple', total: 31157 });
  const q2 = factura({ num: 'QT-2099-02', data: '2099-07-20', contrapart: 'Gestora Exemple', total: 44629 });
  const q3 = factura({ num: 'QT-2099-03', data: '2099-07-20', contrapart: 'Gestora Exemple', total: 31157 });
  const quotes = (centims) => mov('2099-07-25', centims, { comu: '04', conceptes: [['01', 'TRANSFERENCIA EMESA', 'QUOTES QT-2099-01 I QT-2099-02']] });

  test('una transferència que cita dues quotes i en paga la suma exacta: R4 alta', () => {
    const m = quotes(-75786);
    const r = concilia({ moviments: [m], factures: [q3, q2, q1] });
    expect(resum(r.parelles)).toEqual([['R4', 'alta', [m.linia], ['QT-2099-02', 'QT-2099-01'], 0]]);
    expect(r.facturesSensePagament).toEqual([q3]);
  });

  test('si en cita dues però només en paga una, és R1 amb la que quadra', () => {
    const m = quotes(-31157);
    expect(resum(concilia({ moviments: [m], factures: [q1, q2, q3] }).parelles)).toEqual([['R1', 'alta', [m.linia], ['QT-2099-01'], 0]]);
  });

  test('si cap subconjunt quadra, les citades amb la diferència (mitjana)', () => {
    const m = quotes(-70786);
    const r = concilia({ moviments: [m], factures: [q1, q2] });
    expect(resum(r.parelles)).toEqual([['R4', 'mitjana', [m.linia], ['QT-2099-01', 'QT-2099-02'], 5000]]);
    expect(codis(r)).toEqual(['IMPORT_DIFERENT']);
  });

  test('per proveïdor: un rebut SEPA que paga dues factures del mateix creditor (mitjana)', () => {
    const agost = factura({ num: 'SUB-A', data: '2099-08-01', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
    const setembre = factura({ num: 'SUB-B', data: '2099-09-01', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
    const altre = factura({ num: 'ALT-C', data: '2099-09-01', nif: 'A12345674', contrapart: 'Altra Exemple', total: 4319 });
    const m = mov('2099-09-05', -8638, { comu: '03', sepa: sepa('B76543214') });
    const r = concilia({ moviments: [m], factures: [setembre, altre, agost] });
    expect(resum(r.parelles)).toEqual([['R4', 'mitjana', [m.linia], ['SUB-A', 'SUB-B'], 0]]);
    expect(r.facturesSensePagament).toEqual([altre]);
  });
});

describe('R2 · rebut SEPA: NIF del creditor i import', () => {
  const juliol = factura({ num: 'SUB-07', data: '2099-07-01', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
  const agost = factura({ num: 'SUB-08', data: '2099-08-01', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
  const altre = factura({ num: 'ALT-07', data: '2099-07-01', nif: 'A12345674', contrapart: 'Altra Exemple', total: 4319 });

  test('cada rebut amb la factura del seu mes, encara que les quotes siguen iguals', () => {
    const mJul = mov('2099-07-05', -4319, { comu: '03', sepa: sepa('B76543214') });
    const mAgo = mov('2099-08-04', -4319, { comu: '03', sepa: sepa('B76543214') });
    const r = concilia({ moviments: [mAgo, mJul], factures: [agost, altre, juliol] });
    expect(resum(r.parelles)).toEqual([['R2', 'alta', [mJul.linia], ['SUB-07'], 0], ['R2', 'alta', [mAgo.linia], ['SUB-08'], 0]]);
    expect(r.facturesSensePagament).toEqual([altre]);
  });

  test('quotes iguals amb el rebut de 25 a 30 dies després: cada rebut, la factura ja emesa', () => {
    const sub07 = factura({ num: 'SUB-07B', data: '2099-07-28', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
    const sub08 = factura({ num: 'SUB-08B', data: '2099-08-27', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
    const rAgo = mov('2099-08-25', -4319, { comu: '03', sepa: sepa('B76543214') });
    const rSet = mov('2099-09-24', -4319, { comu: '03', sepa: sepa('B76543214') });
    const r = concilia({ moviments: [rSet, rAgo], factures: [sub08, sub07] });
    expect(resum(r.parelles)).toEqual([['R2', 'alta', [rAgo.linia], ['SUB-07B'], 0], ['R2', 'alta', [rSet.linia], ['SUB-08B'], 0]]);
    expect(r).toMatchObject({ movimentsSenseFactura: [], facturesSensePagament: [] });
  });

  test('un rebut que arriba uns dies abans de la factura també la troba', () => {
    const m = mov('2099-07-29', -4319, { comu: '03', sepa: sepa('B76543214') });
    expect(resum(concilia({ moviments: [m], factures: [agost] }).parelles)).toEqual([['R2', 'alta', [m.linia], ['SUB-08'], 0]]);
  });

  test('G3T-12: el creditor SEPA és una altra societat del mateix grup (nifsAlternatius): parella R2', () => {
    const proveidors = aprenProveidors([], {
      cataleg: [{
        clau: 'exemple-tel', nom: 'Exemple Telefonia SA', nif: 'B76543214', nifsAlternatius: ['A12345674'], dominis: [], patronsFitxer: [],
        patronsNum: [], paraulesText: []
      }]
    });
    const tel = factura({ num: 'TEL-07', data: '2099-07-01', nif: 'B76543214', contrapart: 'Exemple Telefonia SA', total: 2995 });
    const m = mov('2099-07-14', -2995, { comu: '03', sepa: sepa('A12345674') });
    expect(resum(concilia({ moviments: [m], factures: [tel], proveidors }).parelles)).toEqual([['R2', 'alta', [m.linia], ['TEL-07'], 0]]);
    /* Sense saber que són del mateix grup, dos NIF diferents no casen. */
    expect(concilia({ moviments: [m], factures: [tel] }).parelles).toEqual([]);
    /* Un creditor que no és del grup tampoc. */
    const aliena = mov('2099-07-14', -2995, { comu: '03', sepa: sepa('B12345674') });
    expect(concilia({ moviments: [aliena], factures: [tel], proveidors }).parelles).toEqual([]);
  });

  test('fora de la finestra del rebut no hi ha parella', () => {
    const vella = factura({ num: 'SUB-05', data: '2099-05-01', nif: 'B76543214', contrapart: 'Subministraments Exemple', total: 4319 });
    const m = mov('2099-07-05', -4319, { comu: '03', sepa: sepa('B76543214') });
    expect(FINESTRES.rebut.despres).toBeLessThan(65);
    const r = concilia({ moviments: [m], factures: [vella] });
    expect(r.parelles).toEqual([]);
    expect(r.movimentsSenseFactura).toEqual([m]);
  });
});

describe('R3 · import exacte, finestra i contrapart contra el registre de proveïdors', () => {
  const allotjament = factura({ num: 'SG-2099-77', data: '2099-07-10', contrapart: 'SiteGround Spain S.L.', total: 1373 });

  test('el comerç és el proveïdor de la factura: alta', () => {
    const m = mov('2099-07-12', -1373, { comu: '12', comerc: 'SITEGROUND PROVA - POBLE' });
    expect(resum(concilia({ moviments: [m], factures: [allotjament] }).parelles)).toEqual([['R3', 'alta', [m.linia], ['SG-2099-77'], 0]]);
  });

  test('sense saber qui és, l’única candidata: mitjana', () => {
    const f = factura({ num: 'FER-0001', data: '2099-08-03', contrapart: 'Ferreteria Exemple', total: 2687 });
    const m = mov('2099-08-05', -2687, { comu: '12' });
    expect(resum(concilia({ moviments: [m], factures: [f] }).parelles)).toEqual([['R3', 'mitjana', [m.linia], ['FER-0001'], 0]]);
  });

  test('un altre proveïdor, o fora de la finestra: cap parella', () => {
    const altre = mov('2099-07-11', -1373, { comu: '12', comerc: 'AMAZON PROVA1 - POBLE' });
    const tard = mov('2099-07-25', -1373, { comu: '12', comerc: 'SITEGROUND PROVA - POBLE' });
    const r = concilia({ moviments: [altre, tard], factures: [allotjament] });
    expect(r.parelles).toEqual([]);
    expect(r.movimentsSenseFactura).toEqual([altre, tard]);
    expect(FINESTRES.compra).toEqual({ abans: 3, despres: 10 });
  });

  test('dues candidates que no es poden distingir: cap parella i una incidència', () => {
    const a = factura({ num: 'EXA-0001', data: '2099-08-03', contrapart: 'Primera Exemple', total: 2687 });
    const b = factura({ num: 'EXB-0001', data: '2099-08-04', contrapart: 'Segona Exemple', total: 2687 });
    const m = mov('2099-08-05', -2687, { comu: '12' });
    const r = concilia({ moviments: [m], factures: [a, b] });
    expect(r.parelles).toEqual([]);
    expect(r.incidencies).toEqual([expect.objectContaining({ codi: 'AMBIGUITAT', linia: m.linia })]);
  });
});

describe('R5 · factura en una altra moneda', () => {
  const ambOperacio = (n) => [['01', 'OP.TARJ.COMPRA COMERCIO', `999999      0000         ${n}`]];
  const comissioDe = (dataOperacio, centims, n) => mov(dataOperacio, centims, { comu: '17', ref1: 'COMIS.COMPRA', conceptes: [['01', 'COMIS.COMPRA EXTRANJERO', `${' '.repeat(25)}${n}`]] });

  test('amb el registre 24: alta, amb la comissió enllaçada pel número d’operació i el tipus derivat', () => {
    const usd = factura({ num: 'INV-EXEMPLE-0007', data: '2099-07-28', contrapart: 'Servei Estranger Exemple', moneda: 'USD', subtotal: 2150, iva: 0, total: 2150 });
    const carrec = mov('2099-08-01', -1978, {
      valor: '2099-07-30', comu: '12', ref1: 'OP.TARJ.COMP', document: '0000000777', conceptes: ambOperacio('9900000000001'),
      divisa: { codi: '840', moneda: 'USD', centims: -2150 }
    });
    const comissio = comissioDe('2099-08-01', -61, '9900000000001');
    const altra = comissioDe('2099-08-01', -37, '9900000000099');
    const r = concilia({ moviments: [comissio, carrec, altra], factures: [usd] });
    expect(r.parelles).toEqual([{
      moviments: [carrec, comissio], factures: [usd], regla: 'R5', confianca: 'alta', diferencia: 0, tipusCanvi: 0.92, comissio: -61
    }]);
    expect(r.movimentsSenseFactura).toEqual([altra]);
  });

  test('amb el 24, només dins de la finestra de la factura; una factura sense càrrec no desplaça les altres', () => {
    const usd = (num, dia) => factura({ num, data: dia, contrapart: 'Servei Estranger Exemple', moneda: 'USD', total: 2150 });
    const carrec = (dia) => mov(dia, -1978, { comu: '12', divisa: { codi: '840', moneda: 'USD', centims: -2150 } });
    const [juny, juliol, agost, setembre] = [
      usd('INV-EX-06', '2099-06-15'), usd('INV-EX-07', '2099-07-15'), usd('INV-EX-08', '2099-08-15'), usd('INV-EX-09', '2099-09-15')
    ];
    const [cJul, cAgo, cSet] = [carrec('2099-07-16'), carrec('2099-08-16'), carrec('2099-09-16')];
    const r = concilia({ moviments: [cJul, cAgo, cSet], factures: [juny, juliol, agost, setembre] });
    expect(resum(r.parelles)).toEqual([
      ['R5', 'alta', [cJul.linia], ['INV-EX-07'], 0], ['R5', 'alta', [cAgo.linia], ['INV-EX-08'], 0], ['R5', 'alta', [cSet.linia], ['INV-EX-09'], 0]
    ]);
    expect(r.facturesSensePagament).toEqual([juny]);
    const lluny = concilia({ moviments: [carrec('2099-01-10')], factures: [setembre] });
    expect(lluny.parelles).toEqual([]);
    expect(lluny.facturesSensePagament).toEqual([setembre]);
  });

  test('sense 24: l’únic càrrec de la setmana amb comissió de compra a l’estranger (baixa)', () => {
    const usd = factura({ num: 'INV-EXEMPLE-0010', data: '2099-09-10', contrapart: 'Servei Estranger Exemple', moneda: 'USD', total: 1375 });
    const carrec = mov('2099-09-11', -1265, { comu: '12', conceptes: ambOperacio('9900000000002') });
    const comissio = comissioDe('2099-09-11', -29, '9900000000002');
    const nacional = mov('2099-09-12', -1265, { comu: '12', conceptes: ambOperacio('9900000000003') });
    const r = concilia({ moviments: [carrec, comissio, nacional], factures: [usd] });
    expect(r.parelles).toEqual([{
      moviments: [carrec, comissio], factures: [usd], regla: 'R5', confianca: 'baixa', diferencia: null, tipusCanvi: 0.92, comissio: -29
    }]);
  });

  test('sense 24: el comerç del mateix proveïdor (mitjana); dos càrrecs possibles, incidència', () => {
    const usd = factura({ num: 'INV-PIXELARIA-1', data: '2099-09-10', contrapart: 'Pixelaria Inc', moneda: 'USD', total: 1725 });
    const delProveidor = mov('2099-09-12', -1427, { comu: '12', comerc: 'PIXELARIA - SAN FRANCISCO' });
    expect(resum(concilia({ moviments: [delProveidor], factures: [usd] }).parelles)).toEqual([['R5', 'mitjana', [delProveidor.linia], ['INV-PIXELARIA-1'], null]]);
    const unAltre = mov('2099-09-13', -1439, { comu: '12', comerc: 'PIXELARIA - SAN FRANCISCO' });
    const r = concilia({ moviments: [delProveidor, unAltre], factures: [usd] });
    expect(r.parelles).toEqual([]);
    expect(r.incidencies).toEqual([expect.objectContaining({ codi: 'AMBIGUITAT', facturaId: usd.id })]);
  });
});

describe('R6 · el rebut cita la factura', () => {
  const f = factura({ num: 'SINT-INV-0009', data: '2099-07-07', contrapart: 'Servei Exemple', total: 1291 });

  test('pel text del rebut; la factura seguix sense pagament al banc', () => {
    const rebut = { ruta: 'rebuts/Receipt-SINT-0001.pdf', text: 'Receipt number SINT-0001\nInvoice number SINT-INV-0009\nAmount paid 12,91', import: 1291 };
    const r = concilia({ factures: [f], rebuts: [rebut] });
    expect(r.parelles).toEqual([{ moviments: [], factures: [f], rebuts: [rebut], regla: 'R6', confianca: 'alta', diferencia: 0 }]);
    expect(r.facturesSensePagament).toEqual([f]);
  });

  test('pel nom del fitxer; un import diferent baixa la confiança; dues citades, incidència', () => {
    const pelNom = { ruta: 'rebuts/Receipt-SINT-INV-0009.pdf', import: 1391 };
    const r = concilia({ factures: [f], rebuts: [pelNom] });
    expect(resum(r.parelles)).toEqual([['R6', 'mitjana', [], ['SINT-INV-0009'], 100]]);
    expect(codis(r)).toEqual(['IMPORT_DIFERENT']);
    const g = factura({ num: 'SINT-INV-0010', data: '2099-07-08', total: 1291 });
    const dues = concilia({ factures: [f, g], rebuts: [{ ruta: 'rebuts/doble.pdf', text: 'SINT-INV-0009 i SINT-INV-0010' }] });
    expect(dues.parelles).toEqual([]);
    expect(dues.incidencies).toEqual([expect.objectContaining({ codi: 'AMBIGUITAT', fitxer: 'rebuts/doble.pdf' })]);
  });
});

describe('R7 · anul·lacions (concepte comú 98)', () => {
  test('l’anul·lació es menja el càrrec anterior del mateix import, no el que ve després', () => {
    const primer = mov('2099-08-10', -3719, { comu: '12' });
    const anullacio = mov('2099-08-10', 3719, { comu: '98' });
    const segon = mov('2099-08-10', -3719, { comu: '12' });
    const orfe = mov('2099-08-14', 2273, { comu: '98', valor: '2099-06-02' });
    const r = concilia({ moviments: [primer, anullacio, segon, orfe] });
    expect(r.parelles).toEqual([{ moviments: [primer, anullacio], factures: [], regla: 'R7', confianca: 'alta', diferencia: 0 }]);
    expect(r.movimentsSenseFactura).toEqual([segon, orfe]);
    expect(r.incidencies).toEqual([expect.objectContaining({ codi: 'ANULLACIO_SENSE_CARREC', severitat: 'baixa', linia: orfe.linia })]);
  });

  test('si n’hi ha diversos, el de la mateixa data valor; i el càrrec anul·lat ja no paga cap factura', () => {
    const vell = mov('2099-07-14', -6158, { comu: '12' });
    const bo = mov('2099-07-21', -6158, { comu: '12' });
    const anullacio = mov('2099-07-29', 6158, { comu: '98', valor: '2099-07-21' });
    const f = factura({ num: 'BOT-0001', data: '2099-07-12', total: 6158 });
    const r = concilia({ moviments: [vell, bo, anullacio], factures: [f] });
    expect(resum(r.parelles)).toEqual([['R7', 'alta', [bo.linia, anullacio.linia], [], 0], ['R3', 'mitjana', [vell.linia], ['BOT-0001'], 0]]);
  });

  test('sense la mateixa data valor, un càrrec de fins a 3 dies abans: l’anul·la', () => {
    const carrec = mov('2099-07-10', -2591, { comu: '12' });
    const anullacio = mov('2099-07-16', 2591, { comu: '98', valor: '2099-07-12' });
    expect(resum(concilia({ moviments: [carrec, anullacio] }).parelles)).toEqual([['R7', 'alta', [carrec.linia, anullacio.linia], [], 0]]);
  });

  test('una data valor llunyana no anul·la la subscripció d’un altre mes, que seguix pagant la seua factura', () => {
    const juliol = mov('2099-07-10', -2591, { comu: '12' });
    const agost = mov('2099-08-10', -2591, { comu: '12' });
    const anullacio = mov('2099-08-12', 2591, { comu: '98', valor: '2099-05-04' });
    const f = factura({ num: 'SUBS-0008', data: '2099-08-10', contrapart: 'Subscripcio Exemple', total: 2591 });
    const r = concilia({ moviments: [juliol, agost, anullacio], factures: [f] });
    expect(resum(r.parelles)).toEqual([['R3', 'mitjana', [agost.linia], ['SUBS-0008'], 0]]);
    expect(r.movimentsSenseFactura).toEqual([juliol, anullacio]);
    expect(codis(r)).toEqual(['ANULLACIO_SENSE_CARREC']);
  });
});

describe('contracte', () => {
  test('no modifica res del que entra: moviments, factures, rebuts i la proposta del tractor', () => {
    const proposta = congela({
      ingressos: [factura({ tipus: 'ingres', num: 'Q270815', data: '2099-08-03', total: 61743 })],
      despeses: [factura({ num: 'SINT-2099-0042', data: '2099-07-10', total: 13417 }), factura({ num: 'QT-2099-01', data: '2099-07-20', total: 31157 })]
    });
    const moviments = congela([
      mov('2099-07-20', -13417, { conceptes: [['01', 'FRA SINT 2099 0042']] }),
      mov('2099-08-19', 61743, { conceptes: [['01', 'ABONO FACTURA Q27 0815']] }),
      mov('2099-08-10', -3719, { comu: '12' }), mov('2099-08-10', 3719, { comu: '98' })
    ]);
    const rebuts = congela([{ ruta: 'rebuts/r.pdf', text: 'QT-2099-01' }]);
    const abans = JSON.stringify({ proposta, moviments, rebuts });
    const r = concilia({ moviments, factures: [...proposta.ingressos, ...proposta.despeses], rebuts });
    expect(JSON.stringify({ proposta, moviments, rebuts })).toBe(abans);
    expect(r.parelles.map((p) => p.regla).sort()).toEqual(['R1', 'R1', 'R6', 'R7']);
    expect(r.facturesSensePagament).toEqual([proposta.despeses[1]]);
  });

  test('el rang: el que cau fora no ix a les llistes «sense»; una factura sense data, sí', () => {
    const juny = mov('2099-06-30', -113);
    const juliol = mov('2099-07-01', -229);
    const octubre = factura({ num: 'OCT-0001', data: '2099-10-01', total: 1013 });
    const senseData = factura({ num: 'SD-0001', total: 1011 });
    const r = concilia({ moviments: [juny, juliol], factures: [octubre, senseData], rang: { inici: data('2099-07-01'), fi: data('2099-09-30') } });
    expect(r.movimentsSenseFactura).toEqual([juliol]);
    expect(r.facturesSensePagament).toEqual([senseData]);
  });

  test('moviments illegibles, entrades buides, i només codis i regles publicats', () => {
    const r = concilia({ moviments: [null, { centims: null, dataOperacio: data('2099-07-01') }, mov('2099-07-02', 0)], factures: [null] });
    expect(r.incidencies).toEqual([expect.objectContaining({ codi: 'MOVIMENT_ILLEGIBLE', severitat: 'baixa' })]);
    expect(r.movimentsSenseFactura).toHaveLength(1);
    expect(concilia()).toEqual({ parelles: [], movimentsSenseFactura: [], facturesSensePagament: [], incidencies: [] });
    expect(CODIS_CONCILIACIO).toContain('AMBIGUITAT');
    expect(REGLES_CONCILIACIO).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
  });
});

describe('el camí sencer: Norma 43 → fusió amb el CSV → conciliació', () => {
  const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
  const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
  const r22 = (op, valor, comu, centims) => `22${text('', 4)}0001${op}${valor}${comu}0001${xifres(centims, 14)}${xifres(0, 10)}${text('', 28)}`;
  const r23 = (codi, cos) => `23${codi}${text(cos, 76)}`;
  const C43 = [
    `11999900010000004321990701990930200000000123456978${'4'}${text('TITULAR EXEMPLE', 29)}`,
    r22('990712', '990711', '12', 1373),
    r23('01', `${text('OP.TARJ.COMPRA COMERCIO', 38)}999999      0000         9900000000005`),
    r22('990801', '990801', '03', 4319),
    r23('01', 'CORESUBMINISTRAMENTS EXEMPLE SL'),
    r23('02', `${text('ES12000B76543214', 35)}MANDAT-0001`),
    r23('03', '        Factura SINT-2099-0042 Juliol'),
    `33999900010000004321${xifres(2, 5)}${xifres(5692, 14)}${xifres(0, 5)}${xifres(0, 14)}2${xifres(117764, 14)}978${text('', 4)}`,
    `88${'9'.repeat(18)}${xifres(8, 6)}${text('', 54)}`
  ].join('\r\n');
  const CSV = 'Fecha,F. valor,Concepto,Importe,Saldo\r\n2099-07-12,2099-07-11,"OP.TARJ.COMPRA COMERCIO\n999999******0000 SITEGROUND PROVA - POBLE",-13.73,1220.83\r\n';

  test('la lectura quadra, la fusió porta el comerç i la conciliació troba les dues factures', () => {
    const lectura = llegeixC43(C43);
    expect(lectura.avisos.map((a) => a.codi)).toEqual(['MODALITAT']);
    const { moviments, senseParella } = fusionaMoviments(lectura, llegeixMovimentsCsv(CSV));
    expect(senseParella.csv).toEqual([]);
    expect(moviments[0].comerc).toBe('SITEGROUND PROVA - POBLE');
    const llum = factura({ num: 'SINT-2099-0042', data: '2099-07-25', nif: 'B76543214', contrapart: 'Subministraments Exemple SL', total: 4319 });
    const allotjament = factura({ num: 'SG-2099-78', data: '2099-07-10', contrapart: 'SiteGround Spain S.L.', total: 1373 });
    const r = concilia({ moviments, factures: [llum, allotjament] });
    expect(resum(r.parelles)).toEqual([['R3', 'alta', [2], ['SG-2099-78'], 0], ['R1', 'alta', [4], ['SINT-2099-0042'], 0]]
      .sort((x, y) => (x[0] < y[0] ? -1 : 1)));
    expect(r).toMatchObject({ movimentsSenseFactura: [], facturesSensePagament: [], incidencies: [] });
  });
});
