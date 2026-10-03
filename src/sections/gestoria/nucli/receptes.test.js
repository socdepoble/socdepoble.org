// @vitest-environment node
/* Gestoria · nucli · receptes. Factures sintètiques en castellà, valencià i
   anglés; els CIF de prova es calculen ací mateix (cap identificador real de
   persona). Els NIF d'empreses del catàleg són dades públiques. */
import { describe, expect, test } from 'vitest';
import { detectaProveidor, extreuCamps, nifsRecurrents } from './receptes.js';

/* Control de CIF a la manera de l'Agència Tributària, independent del mòdul. */
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return (10 - ((parells + senars) % 10)) % 10;
}
const cif = (lletra, xifres) => `${lletra}${xifres}${controlCif(xifres)}`;

const TITULAR = cif('G', '7654321');
const PROVEIDOR = cif('F', '2468013');
const ALTRE = cif('B', '1357924');
const CLIENT = cif('B', '9081726');
const IVA_UE = `IE${'1234567'}AB`;

const CASTELLA = [
  'Exemple Energia SCCL',
  `CIF: ${PROVEIDOR}`,
  'C/ Major 1, 46000 València',
  'FACTURA',
  'Número de factura: FE-2026-0042',
  'Fecha de la factura: 15/04/2026',
  'Fecha de vencimiento: 15/05/2026',
  'Cliente: Associació Exemple',
  `NIF: ${TITULAR}`,
  'Concepto: Subministrament elèctric abril',
  'Base imponible 1.234,56 €',
  'IVA 21% 259,26 €',
  'Total factura 1.493,82 €'
].join('\n');

const VALENCIA = [
  'Cooperativa Exemple de Serveis, S. Coop. V.',
  `NIF ${ALTRE}`,
  'Núm. factura: 2026/117',
  "Data de la factura: 3 d'abril de 2026",
  'Descripció: Manteniment del web',
  'Base imposable: 500,00 €',
  'Quota IVA (21 %): 105,00 €',
  'Total: 605,00 €'
].join('\n');

const ANGLES = [
  'Invoice',
  'Invoice number INV-0042',
  'Date of issue April 15, 2026',
  'Date due May 15, 2026',
  'Example Cloud Ltd',
  `VAT: ${IVA_UE}`,
  'Bill to',
  'Associacio Exemple',
  'Description Qty Unit price Amount',
  'Hosting plan 1 €100.00 €100.00',
  'Subtotal €100.00',
  'Total excluding tax €100.00',
  'VAT (21% on €100.00) €21.00',
  'Total €121.00',
  'Amount due €121.00'
].join('\n');

describe('extreuCamps: factures completes en tres idiomes', () => {
  test('castellà amb etiquetes i el NIF del titular descartat', () => {
    const r = extreuCamps(CASTELLA, { nifsPropis: [TITULAR] });
    expect(r).toMatchObject({
      num: 'FE-2026-0042',
      data: { a: 2026, m: 4, d: 15 },
      nif: PROVEIDOR,
      contrapart: 'Exemple Energia SCCL',
      descripcio: 'Subministrament elèctric abril',
      subtotal: 123456,
      iva: 25926,
      total: 149382
    });
    expect(r.confianca).toEqual({
      num: 'alta', data: 'alta', nif: 'alta', contrapart: 'mitjana', descripcio: 'mitjana', subtotal: 'alta', iva: 'alta', total: 'alta'
    });
    expect(r.fragments.total).toBe('Total factura 1.493,82 €');
    expect(r.fragments.data).toBe('Fecha de la factura: 15/04/2026');
  });

  test('valencià: «Núm. factura», data textual i quota d’IVA', () => {
    const r = extreuCamps(VALENCIA);
    expect(r).toMatchObject({
      num: '2026/117',
      data: { a: 2026, m: 4, d: 3 },
      nif: ALTRE,
      contrapart: 'Cooperativa Exemple de Serveis, S. Coop. V.',
      descripcio: 'Manteniment del web',
      subtotal: 50000,
      iva: 10500,
      total: 60500
    });
    expect(r.confianca.subtotal).toBe('alta');
    expect(r.confianca.nif).toBe('alta');
  });

  test('anglés: format 1,234.56, IVA europeu, «Amount due» i descripció de taula', () => {
    const r = extreuCamps(ANGLES);
    expect(r).toMatchObject({
      num: 'INV-0042',
      data: { a: 2026, m: 4, d: 15 },
      nif: IVA_UE,
      contrapart: 'Example Cloud Ltd',
      descripcio: 'Hosting plan',
      subtotal: 10000,
      iva: 2100,
      total: 12100
    });
    expect(r.confianca).toMatchObject({ num: 'alta', data: 'alta', nif: 'alta', subtotal: 'alta', total: 'alta', descripcio: 'baixa' });
  });

  test('factura emesa (ingrés): la contrapart és el client', () => {
    const text = [
      'Associació Exemple',
      `NIF: ${TITULAR}`,
      'Factura núm. 2026-007',
      'Data: 10/06/2026',
      'Client: Exemple Distribucions SL',
      `CIF client: ${CLIENT}`,
      'Concepte: Taller de pedra seca',
      'Base imposable 200,00',
      'IVA 21% 42,00',
      'Total 242,00'
    ].join('\n');
    const r = extreuCamps(text, { tipus: 'ingres', nifsPropis: [TITULAR] });
    expect(r).toMatchObject({
      num: '2026-007',
      data: { a: 2026, m: 6, d: 10 },
      nif: CLIENT,
      contrapart: 'Exemple Distribucions SL',
      descripcio: 'Taller de pedra seca',
      subtotal: 20000,
      iva: 4200,
      total: 24200
    });
    expect(r.confianca).toMatchObject({ nif: 'alta', contrapart: 'mitjana', data: 'mitjana', total: 'alta' });
  });
});

describe('extreuCamps: imports', () => {
  test('subtotal i total sense IVA: l’IVA es calcula (mitjana)', () => {
    const r = extreuCamps(['Exemple Serveis SL', 'Factura nº 2026-05', 'Fecha: 02/05/2026', 'Subtotal: 80,00 €', 'Total: 96,80 €'].join('\n'));
    expect(r).toMatchObject({ num: '2026-05', subtotal: 8000, iva: 1680, total: 9680 });
    expect(r.confianca).toMatchObject({ num: 'alta', subtotal: 'mitjana', iva: 'mitjana', total: 'mitjana' });
    expect(r.fragments.iva).toBe('calculat: total − subtotal');
  });

  test('IVA i total sense subtotal, i subtotal i IVA sense total', () => {
    expect(extreuCamps('Cuota IVA 21,00 €\nTotal a pagar 121,00 €')).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(extreuCamps('Base imponible 100,00 €\nIVA 21%: 21,00 €')).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
  });

  test('taula de resum: capçalera en una línia i valors davall', () => {
    const r = extreuCamps('Base imponible IVA Total\n100,00 21,00 121,00');
    expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(r.confianca.total).toBe('alta');
    expect(r.fragments.total).toBe('Base imponible IVA Total ⏎ 100,00 21,00 121,00');
    const ambTipus = extreuCamps('Base imponible % IVA Cuota IVA Total\n100,00 21 21,00 121,00');
    expect(ambTipus).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
  });

  test('una etiqueta sola i l’import a la línia següent', () => {
    expect(extreuCamps('Total\n57,30 €')).toMatchObject({ total: 5730, confianca: { total: 'mitjana' } });
  });

  test('abonament amb negatius i parèntesis', () => {
    const r = extreuCamps(['Factura rectificativa', 'Nº factura: R-2026-003', 'Base imponible: -100,00 €', 'IVA 21%: -21,00 €', 'Total: (121,00) €'].join('\n'));
    expect(r).toMatchObject({ num: 'R-2026-003', subtotal: -10000, iva: -2100, total: -12100 });
  });

  test('retenció d’IRPF: la terna quadra amb la retenció', () => {
    const r = extreuCamps(['Base imponible: 1.000,00 €', 'IVA 21%: 210,00 €', 'Retención IRPF 15%: -150,00 €', 'Total a pagar: 1.060,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000 });
    expect(r.confianca.total).toBe('alta');
    expect(r.confianca.retencio).toBe('alta');
    expect(r.fragments.retencio).toBe('Retención IRPF 15%: -150,00 €');
  });

  test('formats d’import variats', () => {
    expect(extreuCamps('Total factura: EUR 1.000,00').total).toBe(100000);
    expect(extreuCamps('Total (EUR) 1,234.56').total).toBe(123456);
    expect(extreuCamps('Importe total: 12.345,6 €').total).toBe(1234560);
    expect(extreuCamps('Total a pagar 99 €').total).toBe(9900);
    expect(extreuCamps('Total IVA incluido: 30,25€').total).toBe(3025);
    expect(extreuCamps('Total 3 artículos').total).toBeNull();
    const dur = String.fromCharCode(0xa0);
    expect(extreuCamps(`Total${dur}factura:${dur}1.234,56${dur}€`).total).toBe(123456);
  });

  test('els tres imports que no quadren: confiança baixa', () => {
    const r = extreuCamps('Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal factura 150,00 €');
    expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 15000 });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
  });

  test('només total i proveïdor sense IVA habitual (inversió del subjecte passiu)', () => {
    const text = ['Google Cloud EMEA Limited', 'VAT number: IE3668997OH', 'Invoice number: 5550001234', 'Invoice date: 30 Apr 2026', 'Total in EUR €45.67'].join('\n');
    const r = extreuCamps(text);
    expect(r).toMatchObject({
      num: '5550001234', data: { a: 2026, m: 4, d: 30 }, nif: 'IE3668997OH', contrapart: 'Google Cloud EMEA Limited', subtotal: 4567, iva: 0, total: 4567
    });
    expect(r.confianca).toMatchObject({ contrapart: 'alta', nif: 'alta', subtotal: 'mitjana', iva: 'mitjana', total: 'alta' });
  });

  test('només total i el text diu que no porta IVA', () => {
    expect(extreuCamps('Operación exenta de IVA\nTotal: 40,00 €')).toMatchObject({ subtotal: 4000, iva: 0, total: 4000 });
    expect(extreuCamps('Total: 40,00 €')).toMatchObject({ subtotal: null, iva: null, total: 4000 });
  });
});

describe('extreuCamps: retenció d’IRPF', () => {
  const factura = (...linies) => extreuCamps(['Exemple Assessors SL', 'Factura nº 2026-031', 'Fecha: 10/04/2026', ...linies].join('\n'));
  const BASE = 'Base imponible: 1.000,00 €';
  const IVA = 'IVA 21%: 210,00 €';

  test.each([
    'Retención IRPF 15%: -150,00 €',
    'IRPF (15 %) -150,00 €',
    'Retenció d’IRPF 15 %: 150,00 €',
    'I.R.P.F. 15% (150,00)',
    'Withholding tax (15%) -€150.00',
    'Total retenciones: -150,00 €'
  ])('«%s»: dins de la terna, en positiu i amb confiança alta', (linia) => {
    const r = factura(BASE, IVA, linia, 'Total a pagar: 1.060,00 €');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000 });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta', retencio: 'alta' });
    expect(r.fragments.retencio).toBe(linia);
  });

  test.each([
    ['15 %', '-150,00', 15000, 'mitjana'],
    ['7 %', '-70,00', 7000, 'mitjana'],
    ['19 %', '-190,00', 19000, 'mitjana'],
    ['12 %', '-120,00', 12000, 'baixa']
  ])('fora de la terna (%s): el percentatge de la base en dona la confiança', (percentatge, quantitat, retencio, confianca) => {
    const r = factura(BASE, IVA, `Retención IRPF ${percentatge}: ${quantitat} €`, 'Total factura: 1.210,00 €');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000, retencio });
    expect(r.confianca).toMatchObject({ total: 'alta', retencio: confianca });
  });

  test('tres imports que no quadren: la retenció també té confiança baixa', () => {
    const r = factura(BASE, IVA, 'Retención IRPF 15%: -150,00 €', 'Total factura: 999,00 €');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 99900, retencio: 15000 });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa', retencio: 'baixa' });
  });

  test('sense línia d’IVA: l’IVA es calcula comptant la retenció', () => {
    const r = factura(BASE, 'Retención IRPF 15%: -150,00 €', 'Total: 1.060,00 €');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000 });
    expect(r.confianca).toMatchObject({ iva: 'mitjana', retencio: 'mitjana' });
  });

  test('factura exempta d’IVA amb retenció: la base és el total més la retenció', () => {
    const r = factura('Operación exenta de IVA', 'Retención IRPF 15%: -150,00 €', 'Total: 850,00 €');
    expect(r).toMatchObject({ subtotal: 100000, iva: 0, total: 85000, retencio: 15000 });
    expect(r.confianca.retencio).toBe('mitjana');
  });

  test('rectificativa: amb la base negativa, la retenció hi suma', () => {
    const r = factura('Factura rectificativa', 'Base imponible: -1.000,00 €', 'IVA 21%: -210,00 €', 'Retención IRPF 15%: 150,00 €', 'Total: -1.060,00 €');
    expect(r).toMatchObject({ subtotal: -100000, iva: -21000, total: -106000, retencio: 15000 });
    expect(r.confianca.retencio).toBe('alta');
  });

  test('taula de resum amb columna d’IRPF', () => {
    const r = extreuCamps('Base imponible IVA IRPF Total\n1.000,00 210,00 -150,00 1.060,00');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000 });
    expect(r.confianca.retencio).toBe('alta');
    expect(r.fragments.retencio).toBe('Base imponible IVA IRPF Total ⏎ 1.000,00 210,00 -150,00 1.060,00');
  });

  test('la base de la retenció no és la retenció, i una retenció de zero no compta', () => {
    expect(factura(BASE, IVA, 'Base retención IRPF: 1.000,00 €', 'Total factura: 1.210,00 €').retencio).toBeNull();
    const zero = factura(BASE, IVA, 'IRPF 0%: 0,00 €', 'Total factura: 1.210,00 €');
    expect(zero.retencio).toBeNull();
    expect(zero.confianca).not.toHaveProperty('retencio');
  });

  test('sense cap etiqueta de retenció, retencio és null', () => {
    const r = extreuCamps(CASTELLA, { nifsPropis: [TITULAR] });
    expect(r.retencio).toBeNull();
    expect(r.fragments).not.toHaveProperty('retencio');
  });
});

describe('extreuCamps: taules «IVA | BASE | CUOTA» dels tiquets (format-fiscal-01)', () => {
  test('supermercat: el tipus davall d’«IVA» i la quota sense etiqueta no giren la base i l’IVA', () => {
    const text = [
      'SUPERMERCAT EXEMPLE SA',
      'FACTURA SIMPLIFICADA 2026-001-123456',
      '21/07/2026 10:42',
      'TOTAL (€) 100,00',
      'TARGETA BANCÀRIA 100,00',
      'IVA BASE IMPONIBLE (€) CUOTA (€)',
      '21% 82,64 17,36'
    ].join('\n');
    const r = extreuCamps(text);
    expect(r).toMatchObject({ subtotal: 8264, iva: 1736, total: 10000 });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta' });
  });

  test('la capçalera mínima del revisor, amb el tipus etiquetat o sense', () => {
    expect(extreuCamps('IVA BASE CUOTA\n21% 82,64 17,36\nTOTAL 100,00')).toMatchObject({ subtotal: 8264, iva: 1736, total: 10000 });
    expect(extreuCamps('% IVA BASE CUOTA\n21% 82,64 17,36\nTOTAL 100,00')).toMatchObject({ subtotal: 8264, iva: 1736, total: 10000 });
  });

  test('restaurant: «% IVA | BASE | CUOTA» amb el 10 %', () => {
    const text = [
      'RESTAURANT EXEMPLE SL',
      'Factura simplificada R-0815',
      'Data: 02/08/2026',
      '2 MENÚ DEL DIA 50,00',
      'TOTAL 55,00 €',
      '% IVA BASE CUOTA',
      '10% 50,00 5,00'
    ].join('\n');
    expect(extreuCamps(text)).toMatchObject({ subtotal: 5000, iva: 500, total: 5500 });
  });

  test('gasolinera: «BASE IMP. | IVA% | CUOTA IVA | TOTAL», cada valor a la seua columna', () => {
    const text = [
      'ESTACIÓ DE SERVEI EXEMPLE SL',
      'Factura simplificada G-2026-0042',
      'Data 03/08/2026',
      'GASOLINA 95 40,00 €',
      'BASE IMP. IVA% CUOTA IVA TOTAL',
      '33,06 21% 6,94 40,00'
    ].join('\n');
    const r = extreuCamps(text);
    expect(r).toMatchObject({ subtotal: 3306, iva: 694, total: 4000 });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta' });
  });

  test('si les columnes de la capçalera no casen amb els valors, no s’assigna res per posició', () => {
    const r = extreuCamps('IVA BASE CUOTA TOTAL\n21% 82,64 17,36');
    expect(r).toMatchObject({ subtotal: null, iva: null, total: null });
  });

  test('una terna que quadra amb l’IVA més gran que la base no té confiança alta', () => {
    const r = extreuCamps('Base imponible 17,36 €\nIVA 82,64 €\nTotal 100,00 €');
    expect(r).toMatchObject({ subtotal: 1736, iva: 8264, total: 10000 });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'mitjana' });
  });

  test('tiquet amb diversos tipus: cap terna inventada amb confiança alta', () => {
    const text = [
      'TOTAL (€) 30,00',
      'IVA BASE IMPONIBLE (€) CUOTA (€)',
      '10% 18,18 1,82',
      '21% 8,26 1,74',
      'TOTAL 26,44 3,56'
    ].join('\n');
    const r = extreuCamps(text);
    expect(Object.values(r.confianca).filter((nivell) => nivell === 'alta')).toEqual([]);
  });
});

describe('extreuCamps: milers separats per espai (format-fiscal-05)', () => {
  test('«1 020,46» i «1 000,00» no es tallen', () => {
    const r = extreuCamps('Base imponible 1 020,46 €\nIVA 21% 214,30 €\nTotal 1 234,76 €');
    expect(r).toMatchObject({ subtotal: 102046, iva: 21430, total: 123476 });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta' });
    expect(extreuCamps('Base imponible 1 000,00 €\nIVA 21% 210,00 €\nTotal 1 210,00 €')).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
  });

  test('amb l’espai prim o el dur de les factures franceses', () => {
    const prim = String.fromCharCode(0x202f);
    const dur = String.fromCharCode(0xa0);
    expect(extreuCamps(`Total TTC${prim}: 2${prim}500,00${dur}€`).total).toBe(250000);
  });

  test('si el document agrupa els milers amb punt, l’espai separa columnes', () => {
    const r = extreuCamps('Base imponible % IVA Cuota IVA Total\n1.000,00 21 210,00 1.210,00');
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(extreuCamps('Base imponible 1.000,00 €\nIVA 21 210,00 €\nTotal 1.210,00 €')).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
  });
});

describe('extreuCamps: monedes que no són l’euro (format-fiscal-02)', () => {

  test.each(['Payment in euros is also accepted.', 'Reference EUR exchange rate: 0.91'])(
    'una menció a euros fora dels imports no esborra Currency: USD: %s', (peu) => {
      const r = extreuCamps('Currency: USD\nSubtotal 100.00\nTax amount 21.00\nTotal 121.00\n' + peu);
      expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100, moneda: 'USD' });
      expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
    }
  );

  test('dòlars davant dels imports: es lligen, però amb confiança baixa i la moneda', () => {
    const r = extreuCamps('Subtotal $20.00\nVAT (21%) $4.20\nTotal $24.20');
    expect(r).toMatchObject({ subtotal: 2000, iva: 420, total: 2420, moneda: 'USD' });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
  });

  test.each([
    ['Total 24.20 USD', 2420, 'USD'],
    ['Amount due US$24.20', 2420, 'USD'],
    ['Total 24.20USD', 2420, 'USD'],
    ['Total £24.20', 2420, 'GBP'],
    ['Total 24,20 GBP', 2420, 'GBP'],
    ['Total CHF 24.20', 2420, 'CHF'],
    ['Total ¥2420.00', 242000, 'JPY'],
    ['Total (USD) 24.20', 2420, 'USD'],
    ['Total -$24.20', -2420, 'USD']
  ])('«%s»: %i en %s, amb confiança baixa', (text, total, moneda) => {
    const r = extreuCamps(text);
    expect(r).toMatchObject({ total, moneda });
    expect(r.confianca.total).toBe('baixa');
  });

  test('la moneda dita en una altra línia, sense cap euro al document', () => {
    const r = extreuCamps('Currency: USD\nSubtotal 20.00\nTax 4.20\nTotal 24.20');
    expect(r).toMatchObject({ subtotal: 2000, iva: 420, total: 2420, moneda: 'USD' });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
  });

  test('en euros no hi ha moneda al resultat, encara que el text en mencione una altra', () => {
    expect(extreuCamps(CASTELLA, { nifsPropis: [TITULAR] })).not.toHaveProperty('moneda');
    expect(extreuCamps(ANGLES)).not.toHaveProperty('moneda');
    const r = extreuCamps('Total 24,20 €\nPrices in USD available on request');
    expect(r.total).toBe(2420);
    expect(r).not.toHaveProperty('moneda');
    expect(r.confianca.total).not.toBe('baixa');
  });
});

describe('extreuCamps: número, data, NIF i contrapart', () => {
  test('patró de número del catàleg sense etiqueta', () => {
    const r = extreuCamps(['Som Energia, SCCL', 'CIF: F55091367', 'Factura FE2026000123', 'Fecha factura: 05/03/2026', 'Total importe: 61,02 €'].join('\n'));
    expect(r).toMatchObject({ num: 'FE2026000123', nif: 'F55091367', contrapart: 'Som Energia, SCCL', total: 6102, data: { a: 2026, m: 3, d: 5 } });
    expect(r.confianca).toMatchObject({ num: 'alta', contrapart: 'alta', nif: 'alta' });
  });

  test('recursos sense etiquetes: «Factura X», data única i nom amb forma societària', () => {
    const r = extreuCamps(['EXEMPLE TALLERS SL', 'Factura F/2026/88', 'València, 12 de març de 2026', 'Import total 50,00 €'].join('\n'));
    expect(r).toMatchObject({ num: 'F/2026/88', data: { a: 2026, m: 3, d: 12 }, contrapart: 'EXEMPLE TALLERS SL', total: 5000 });
    expect(r.confianca).toMatchObject({ num: 'baixa', data: 'mitjana', contrapart: 'baixa', total: 'alta' });
  });

  test('la data de venciment no passa per data de factura', () => {
    expect(extreuCamps('Fecha de vencimiento: 30/06/2026\nFecha: 01/06/2026').data).toEqual({ a: 2026, m: 6, d: 1 });
    expect(extreuCamps('Due date: June 30, 2026\nDate: June 1, 2026').data).toEqual({ a: 2026, m: 6, d: 1 });
    expect(extreuCamps('Del 01/05/2026 al 31/05/2026').confianca.data).toBe('baixa');
  });

  test('sense nifsPropis i dos NIF: tria el primer amb etiqueta i confiança baixa', () => {
    const r = extreuCamps(CASTELLA);
    expect(r.nif).toBe(PROVEIDOR);
    expect(r.confianca.nif).toBe('baixa');
  });

  test('NIF amb format lliure, prefix ES i la raó social a la mateixa línia', () => {
    const ambGuions = `${ALTRE[0]}-${ALTRE.slice(1, 3)}.${ALTRE.slice(3, 6)}.${ALTRE.slice(6)}`;
    const r = extreuCamps(`Exemple Fusteria SL - CIF: ${ambGuions}\nTotal 10,00 €`);
    expect(r).toMatchObject({ nif: ALTRE, contrapart: 'Exemple Fusteria SL' });
    expect(extreuCamps(`NIF-IVA: ES ${ALTRE}`).nif).toBe(ALTRE);
  });

  test('un IVA europeu sense etiqueta no es pren per NIF; un número de factura que no quadra tampoc', () => {
    const r = extreuCamps('15 DE ABRIL DE 2026\nReferència DE2026001\nFactura nº A1234567');
    expect(r.nif).toBe('');
  });

  test('text buit o absent', () => {
    const buit = {
      num: '', data: null, nif: '', contrapart: '', descripcio: '', subtotal: null, iva: null, total: null, retencio: null, confianca: {}, fragments: {}
    };
    expect(extreuCamps('')).toEqual(buit);
    expect(extreuCamps(null)).toEqual(buit);
    expect(extreuCamps('\n \n')).toEqual(buit);
  });

  test('fragments llargs es retallen', () => {
    const r = extreuCamps(`Concepto: ${'pedra seca '.repeat(40)}`);
    expect(r.fragments.descripcio.length).toBe(200);
    expect(r.fragments.descripcio.endsWith('…')).toBe(true);
  });
});

describe('detectaProveidor', () => {
  test('per NIF, nom de fitxer, domini i text', () => {
    expect(detectaProveidor({ text: 'Emisor B57333601' }).proveidor?.clau).toBe('dondominio');
    expect(detectaProveidor({ text: '', nomFitxer: 'gestoria/2026/factura_FE2026000123.pdf' })).toMatchObject({ puntuacio: 30, motius: ['fitxer'] });
    expect(detectaProveidor({ text: 'Consulta-la a https://www.siteground.es/factures' }).proveidor?.clau).toBe('siteground');
    expect(detectaProveidor({ text: 'Som Energia, cooperativa' }).proveidor?.clau).toBe('som-energia');
  });

  test('puntua i explica els motius', () => {
    const r = detectaProveidor({ text: 'Som Energia, SCCL\nCIF: F55091367\nfactures@somenergia.coop\nFactura FE2026000123', nomFitxer: 'FE2026000123.pdf' });
    expect(r.proveidor.clau).toBe('som-energia');
    expect(r.puntuacio).toBe(50 + 30 + 25 + 25 + 25);
    expect(r.motius).toEqual(['nif:F55091367', 'fitxer', 'domini:somenergia.coop', 'numero', 'text:Som Energia']);
  });

  test('per davall del llindar: proveidor null però amb puntuació', () => {
    expect(detectaProveidor({ text: 'Comprat amb una tauleta Apple' })).toEqual({ proveidor: null, puntuacio: 15, motius: ['text:Apple'] });
    expect(detectaProveidor({ text: 'Exemple Energia SCCL' })).toEqual({ proveidor: null, puntuacio: 0, motius: [] });
    expect(detectaProveidor({ text: 'visita notgoogle.com i google.com.example.org' }).proveidor).toBeNull();
    expect(detectaProveidor()).toEqual({ proveidor: null, puntuacio: 0, motius: [] });
  });

  test('catàleg propi', () => {
    const cataleg = [{ clau: 'exemple', nom: 'Exemple Energia SCCL', nif: PROVEIDOR, dominis: ['example.org'], patronsFitxer: [], patronsNum: [], paraulesText: ['Exemple Energia'] }];
    const r = detectaProveidor({ text: `Exemple Energia SCCL\nCIF: ${PROVEIDOR}\nhola@example.org` }, cataleg);
    expect(r).toMatchObject({ puntuacio: 100, proveidor: { clau: 'exemple' } });
    expect(extreuCamps(`Exemple Energia SCCL\nCIF: ${PROVEIDOR}\nTotal 10,00 €`, { cataleg })).toMatchObject({ contrapart: 'Exemple Energia SCCL', nif: PROVEIDOR });
  });

  test('G3T-12: el NIF d’una altra societat del grup (nifsAlternatius) també identifica el proveïdor', () => {
    const cataleg = [{
      clau: 'exemple-tel', nom: 'Exemple Telefonia SA', nif: PROVEIDOR, nifsAlternatius: [ALTRE], dominis: [], patronsFitxer: [], patronsNum: [], paraulesText: []
    }];
    expect(detectaProveidor({ text: `Exemple Serveis de Telefonia SL\nCIF: ${ALTRE}` }, cataleg))
      .toMatchObject({ puntuacio: 50, motius: [`nif:${ALTRE}`], proveidor: { clau: 'exemple-tel' } });
    expect(detectaProveidor({ text: `Exemple Serveis de Telefonia SL\nCIF: ${CLIENT}` }, cataleg).proveidor).toBeNull();
    /* El NIF de la factura és el del grup que porta el text, encara que n'hi haja un altre. */
    const r = extreuCamps(`Exemple Serveis de Telefonia SL\nCIF: ${ALTRE}\nCIF client: ${CLIENT}\nTotal 10,00 €`, { cataleg });
    expect(r).toMatchObject({ nif: ALTRE, contrapart: 'Exemple Telefonia SA' });
    expect(r.confianca.nif).toBe('alta');
  });
});

/* G3T-06: el número de factura partit per un espai. Números i noms de fitxer inventats. */
describe('extreuCamps: número partit per un espai (G3T-06)', () => {
  test('«A 0001»: es llig sencer, amb el guió quan el nom del fitxer porta la forma A-B', () => {
    expect(extreuCamps('Invoice number QX7KPLMZ 0001', { nomFitxer: 'Invoice-QX7KPLMZ-0001.pdf' }).num).toBe('QX7KPLMZ-0001');
    expect(extreuCamps('Invoice number QX7KPLMZ 0001', { nomFitxer: 'compres/2026_3T/invoice-qx7kplmz-0001.pdf' }).num).toBe('QX7KPLMZ-0001');
    expect(extreuCamps('Invoice number 7AC0412E 5550123', { nomFitxer: 'Invoice-7AC0412E-5550123.pdf' }).num).toBe('7AC0412E-5550123');
  });

  test('sense la forma A-B al nom del fitxer, es conserva l’espai', () => {
    expect(extreuCamps('Invoice number QX7KPLMZ 0001').num).toBe('QX7KPLMZ 0001');
    expect(extreuCamps('Invoice number QX7KPLMZ 0001', { nomFitxer: 'Receipt-1234-5678-9012.pdf' }).num).toBe('QX7KPLMZ 0001');
    expect(extreuCamps('Número de factura: X26 0042', { nomFitxer: 'emesa_X260042.pdf' }).num).toBe('X26 0042');
    /* El nom del fitxer només hi casa amb el número sencer: «…-00012» no és «…-0001». */
    expect(extreuCamps('Invoice number QX7KPLMZ 0001', { nomFitxer: 'Invoice-QX7KPLMZ-00012.pdf' }).num).toBe('QX7KPLMZ 0001');
    expect(extreuCamps('Invoice number QX7KPLMZ 0001', { nomFitxer: 'Invoice-AQX7KPLMZ-0001.pdf' }).num).toBe('QX7KPLMZ 0001');
  });

  test('la capçalera «Número» amb el número a la línia següent', () => {
    const r = extreuCamps('Número Data\nX26 0042 21/07/2026', { nomFitxer: 'emesa_X260042.pdf' });
    expect(r.num).toBe('X26 0042');
    expect(extreuCamps('Invoice number\nQX7KPLMZ 0001', { nomFitxer: 'Invoice-QX7KPLMZ-0001.pdf' }).num).toBe('QX7KPLMZ-0001');
  });

  test('«INV 0001»: un prefix de lletres i el comptador', () => {
    expect(extreuCamps('Invoice number INV 0001').num).toBe('INV 0001');
    expect(extreuCamps('Invoice number INV 0001', { nomFitxer: 'INV-0001.pdf' }).num).toBe('INV-0001');
  });

  test('no s’unix una fitxa curta, una data ni un import', () => {
    expect(extreuCamps('Número de factura: 2026-B.417 5 de març de 2026').num).toBe('2026-B.417');
    expect(extreuCamps('Invoice number QX7KPLMZ 01').num).toBe('QX7KPLMZ');
    expect(extreuCamps('Nº factura: AB12 2026-03-05').num).toBe('AB12');
    expect(extreuCamps('Nº factura: AB12 345,00').num).toBe('AB12');
    expect(extreuCamps('Nº factura: AB12 345 €').num).toBe('AB12');
    expect(extreuCamps('Nº factura: AB12 100%').num).toBe('AB12');
  });

  /* G3T-R05: un codi postal o un telèfon que el PDF posa darrere del número no s'hi ajunta. */
  test('ni un codi postal ni un telèfon de darrere: cal el nom del fitxer, un comptador amb 0 o l’última fitxa', () => {
    expect(extreuCamps('Nº factura: AB12 46870 Vilaexemple').num).toBe('AB12');
    expect(extreuCamps('Nº factura: AB12 963 123 456').num).toBe('AB12');
    /* Amb el nom del fitxer, amb un comptador farcit o sense res darrere, sí. */
    expect(extreuCamps('Nº factura: AB12 46870 Vilaexemple', { nomFitxer: 'AB12-46870.pdf' }).num).toBe('AB12-46870');
    expect(extreuCamps('Nº factura: AB12 04687 Vilaexemple').num).toBe('AB12 04687');
    expect(extreuCamps('Nº factura: AB12 46870').num).toBe('AB12 46870');
    expect(extreuCamps('Nº factura: AB12 46870 Fecha: 21/07/2026').num).toBe('AB12 46870');
  });

  test('un guionet discrecional (U+00AD) no es convertix en guió', () => {
    const discrecional = String.fromCharCode(0xad);
    const r = extreuCamps(`Invoice number QX7KPLMZ${discrecional}0001`, { nomFitxer: 'Invoice-QX7KPLMZ-0001.pdf' });
    expect(r.num).not.toBe('QX7KPLMZ-0001');
  });
});

/* G3T-07: «IVA 21% <base> (BASE IMPOSABLE) <quota>», amb l'etiqueta de la base darrere del seu valor. */
describe('extreuCamps: base i IVA girats per l’etiqueta postposada (G3T-07)', () => {
  test('la quota és el % de la mateixa línia girant la terna: es gira amb confiança mitjana', () => {
    const r = extreuCamps('Total factura 48,40 €\nIVA 21% 40,00 € (BASE IMPOSABLE) 8,40 €');
    expect(r).toMatchObject({ subtotal: 4000, iva: 840, total: 4840 });
    expect(r.confianca).toMatchObject({ subtotal: 'mitjana', iva: 'mitjana', total: 'mitjana' });
    expect(r.fragments.subtotal).toBe('girat: etiqueta de la base postposada');
    expect(r.fragments.iva).toBe('girat: etiqueta de la base postposada');
  });

  test('girada no dona el % de la línia: no es gira', () => {
    const r = extreuCamps('Total factura 100,00 €\nIVA 10% 82,64 € (BASE IMPOSABLE) 17,36 €');
    expect(r).toMatchObject({ subtotal: 1736, iva: 8264, total: 10000 });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa' });
  });

  test('ternes d’altres plantilles no es giren: etiquetes davant del valor i en línies diferents', () => {
    const r = extreuCamps('Base imponible 17,36 €\nIVA 21% 82,64 €\nTotal 100,00 €');
    expect(r).toMatchObject({ subtotal: 1736, iva: 8264, total: 10000 });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'mitjana' });
  });
});

/* G3T-11: l'import subvencionat no és el total de la factura. */
describe('extreuCamps: subvencions i imports a deduir (G3T-11)', () => {
  test('«IMPORTE SUBVENCIONADO» i «A pagar» no passen per total', () => {
    const r = extreuCamps(['Base imponible 1.000,00', 'IVA 21% 210,00', 'Total 1.210,00', 'IMPORTE SUBVENCIONADO: 1.000,00', 'A pagar 210,00'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta' });
  });

  test('sense línia de total, el total es calcula i no és l’import subvencionat', () => {
    const r = extreuCamps(['Base imponible 1.000,00', 'IVA 21% 210,00', 'IMPORTE SUBVENCIONADO: 1.000,00', 'A pagar 210,00'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(r.fragments.total).toBe('calculat: subtotal + IVA');
  });

  test.each([
    'Import subvencionat: 1.000,00 €',
    'Subvención: -1.000,00 €',
    'Subvenció 1.000,00 €',
    'Importe a deducir: 1.000,00 €',
    'Total a deducir 1.000,00 €'
  ])('«%s» no és cap import de la factura', (linia) => {
    const r = extreuCamps(['Base imponible 1.000,00 €', 'IVA 21% 210,00 €', linia].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
  });

  test('«kit digital» no talla la descripció', () => {
    expect(extreuCamps('Concepto: Implantació web Kit Digital\nTotal 10,00 €').descripcio).toBe('Implantació web Kit Digital');
  });

  /* G3T-R08: sense import darrere, la paraula és d'un concepte: ni talla la descripció ni lleva el total. */
  test('«Gestión de subvenciones» és un concepte: «Total a pagar» continua sent el total', () => {
    const r = extreuCamps('Concepto: Gestión de subvenciones\nTotal a pagar 50,00 €');
    expect(r).toMatchObject({ total: 5000, descripcio: 'Gestión de subvenciones' });
    const tramit = extreuCamps(['Concepte: Tràmit de subvencions', 'Base imposable 100,00 €', 'IVA 21% 21,00 €', 'Total a pagar 121,00 €'].join('\n'));
    expect(tramit).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100, descripcio: 'Tràmit de subvencions' });
    expect(tramit.confianca.total).toBe('alta');
  });

  test('l’etiqueta de subvenció d’una capçalera de taula continua comptant: la columna «a pagar» no és el total', () => {
    const r = extreuCamps(['Base imponible 1.000,00 €', 'IVA 21% 210,00 €', 'Subvención Total a pagar', '1.000,00 € 210,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(r.fragments.total).toBe('calculat: subtotal + IVA');
  });

  test('en plural i en valencià, també', () => {
    const r = extreuCamps(['Base imponible 1.000,00 €', 'IVA 21% 210,00 €', 'Subvenciones aplicadas: 1.000,00 €', 'Total subvencionat 1.000,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
  });

  /* La plantilla del Kit Digital: el resum de base i IVA en una taula amb les columnes del recàrrec buides,
     el total sol davall de «Total Factura» i l'«IMPORTE A PAGAR» de després de la subvenció. Imports inventats. */
  const KIT = (resum) => [
    'FACTURA',
    'Nº Factura Fecha Factura D.N.I. o C.I.F. Página',
    `2026-B.417 7 de marzo de 2026 ${CLIENT} 1 / 1`,
    'Concepto Unidades Precio % Dto Importe',
    'Servei de presència avançada a Internet 1 1.500,00 1.500,00',
    'Financiado por el programa Kit Digital.',
    'IMPORTE SUBVENCIONADO :1.500,00 € .-',
    'IMPORTE A PAGAR : 315,00 € .-',
    'Suma: 1.500,00',
    'Vencimiento 07-04-2026: 1.815,00',
    ...resum,
    'Base Retención % Ret Importe Ret Total Factura',
    '1.815,00 €'
  ].join('\n');

  test.each([
    ['la forma de pagament a la línia de la capçalera', ['Forma de Pago: Transferencia Bancaria Base Imponible % IVA Importe IVA % Rec Importe Rec', '1.500,00 21,00 315,00']],
    ['la forma de pagament a la línia dels valors', ['Base Imponible % IVA Importe IVA % Rec Importe Rec', 'Forma de Pago: Transferencia Bancaria 1.500,00 21,00 315,00']]
  ])('Kit Digital (%s): base i IVA de la taula, i l’import a pagar no és el total', (_cas, resum) => {
    const r = extreuCamps(KIT(resum));
    expect(r).toMatchObject({ num: '2026-B.417', subtotal: 150000, iva: 31500, total: 181500 });
    expect(r.confianca).toMatchObject({ subtotal: 'mitjana', iva: 'mitjana', total: 'mitjana' });
    expect(r.fragments.subtotal).toBe(`${resum[0]} ⏎ ${resum[1]}`);
  });

  test('sense subvenció, «Importe a pagar» continua sent el total', () => {
    const r = extreuCamps(['Base imponible 100,00 €', 'IVA 21% 21,00 €', 'IMPORTE A PAGAR : 121,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(r.confianca.total).toBe('alta');
  });

  test('amb subvenció, el total de la factura guanya a qualsevol «a pagar»', () => {
    const r = extreuCamps(['Base imponible 1.000,00 €', 'IVA 21% 210,00 €', 'Total factura 1.210,00 €', 'Subvención -1.000,00 €', 'Importe total a pagar 210,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(r.confianca.total).toBe('alta');
    expect(r.fragments.total).toBe('Total factura 1.210,00 €');
    const senseTotal = extreuCamps(['Base imponible 1.000,00 €', 'IVA 21% 210,00 €', 'Subvención -1.000,00 €', 'Importe total a pagar 210,00 €'].join('\n'));
    expect(senseTotal).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(senseTotal.fragments.total).toBe('calculat: subtotal + IVA');
  });

  test('una taula amb les últimes columnes buides només es llig si la quota és el tipus de la base', () => {
    expect(extreuCamps('Base Imponible % IVA Importe IVA % Rec Importe Rec\n1.500,00 10,00 315,00')).toMatchObject({ subtotal: null, iva: null });
    expect(extreuCamps('Base Imponible % IVA Importe IVA % Rec Importe Rec\n1.500,00 21 315,00')).toMatchObject({ subtotal: 150000, iva: 31500, total: 181500 });
    expect(extreuCamps('Base Imponible Importe IVA Total Pendiente\n100,00 21,00 121,00')).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(extreuCamps('Base Imponible Importe IVA Total Pendiente\n100,00 21,00 150,00')).toMatchObject({ subtotal: null, iva: null, total: null });
    /* Una columna sense etiqueta davant («Unidades») també pot portar valor: s'hi prova l'alineació des del principi. */
    expect(extreuCamps('Unidades Base Imponible % IVA Importe IVA % Rec\n1 1.000,00 21,00 210,00')).toMatchObject({ subtotal: 100000, iva: 21000, total: 121000 });
    expect(extreuCamps('Unidades Base Imponible % IVA Importe IVA % Rec\n1 1.000,00 21,00 350,00')).toMatchObject({ subtotal: null, iva: null });
    /* Un percentatge mai no és la base ni la quota. */
    expect(extreuCamps('Base Imponible Importe IVA Total Pendiente\n21% 21,00 121,00')).toMatchObject({ subtotal: null, iva: null });
  });

  test('una retenció «a deducir» continua sent la retenció', () => {
    const r = extreuCamps(['Base imponible: 1.000,00 €', 'IVA 21%: 210,00 €', 'Retención IRPF 15% a deducir: -150,00 €', 'Total a pagar: 1.060,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000 });
    expect(r.confianca.retencio).toBe('alta');
  });
});

/* G3T-03: la contrapart d'una factura emesa no és la marca pròpia. */
describe('extreuCamps: noms propis i capçalera «Número Facturar a» (G3T-03)', () => {
  const COOP = cif('F', '3579135');
  const EMESA = [
    'Marca Pròpia',
    `NIF: ${TITULAR}`,
    'Número Facturar a Marca Pròpia',
    'X26 0042 Cooperativa Exemple de Serveis Coop. V.',
    `CIF client: ${COOP}`,
    'Base imposable 100,00',
    'IVA 21% 21,00',
    'Total 121,00'
  ].join('\n');

  test('amb nomsPropis, el client és el de la línia següent sense el número', () => {
    const r = extreuCamps(EMESA, { tipus: 'ingres', nifsPropis: [TITULAR], nomsPropis: ['Marca Pròpia'] });
    expect(r).toMatchObject({ num: 'X26 0042', nif: COOP, contrapart: 'Cooperativa Exemple de Serveis Coop. V.', total: 12100 });
  });

  test('sense nomsPropis, la capçalera amb el número buit també pren el client de la línia següent', () => {
    expect(extreuCamps(EMESA, { tipus: 'ingres', nifsPropis: [TITULAR] }).contrapart).toBe('Cooperativa Exemple de Serveis Coop. V.');
  });

  test('un candidat que és un nom propi (amb forma societària o sense) es descarta', () => {
    const text = ['Factura núm. 2026-007', 'Client: Marca Pròpia, S.L.', 'Exemple Distribucions SL', `CIF: ${CLIENT}`, 'Total 242,00'].join('\n');
    expect(extreuCamps(text, { tipus: 'ingres', nomsPropis: ['marca propia'] }).contrapart).toBe('Exemple Distribucions SL');
    expect(extreuCamps(text, { tipus: 'ingres' }).contrapart).toBe('Marca Pròpia, S.L.');
  });

  test('noms propis buits o massa curts no descarten res', () => {
    const r = extreuCamps('Client: Exemple Distribucions SL\nTotal 10,00 €', { tipus: 'ingres', nomsPropis: ['', '  ', 'SL', null] });
    expect(r.contrapart).toBe('Exemple Distribucions SL');
  });
});

/* Abonaments: un document que diu que és un abonament porta els imports en negatiu. */
describe('extreuCamps: abonaments', () => {
  test.each([
    ['Credit note CN-0007', 'Subtotal €100.00\nVAT (21%) €21.00\nTotal €121.00'],
    ['Nota de crèdit NC-2026-004', 'Base imposable 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Nota de crédito NC-2026-004', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['FACTURA DE ABONO A-0003', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Abono nº A-0003', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Tipo de factura: Abono', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Credit note', 'Subtotal €100.00\nVAT (21%) €21.00\nTotal €121.00'],
    ['Nota de crédito nº 12', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Abono: AB-2026-12', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €']
  ])('«%s» amb els imports en positiu: es giren a negatiu', (titol, imports) => {
    const r = extreuCamps(`${titol}\n${imports}`);
    expect(r).toMatchObject({ subtotal: -10000, iva: -2100, total: -12100, abonament: true });
    expect(r.confianca).toMatchObject({ subtotal: 'mitjana', iva: 'mitjana', total: 'mitjana' });
    expect(r.fragments.abonament).toBe(titol);
  });

  /* Una rectificativa també pot corregir a l'alça, i «abonar» també vol dir «pagar»: negatius, però a revisar. */
  test.each([
    ['Factura rectificativa R-2026-003', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €'],
    ['Exemple Serveis SL', 'Base imponible 100,00 €\nIVA 21% 21,00 €\nTotal a abonar: 121,00 €']
  ])('«%s» amb els imports en positiu: negatius i confiança baixa', (titol, imports) => {
    const r = extreuCamps(`${titol}\n${imports}`);
    expect(r).toMatchObject({ subtotal: -10000, iva: -2100, total: -12100, abonament: true });
    expect(r.confianca).toMatchObject({ subtotal: 'baixa', iva: 'baixa', total: 'baixa' });
  });

  test('un camp «Rectificativa: No» no fa abonament', () => {
    const r = extreuCamps('Rectificativa: No\nBase imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €');
    expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(r).not.toHaveProperty('abonament');
  });

  test('un abonament que ja porta els negatius es queda igual, amb la confiança i la retenció', () => {
    const r = extreuCamps(['Factura rectificativa', 'Base imponible: -1.000,00 €', 'IVA 21%: -210,00 €', 'Retención IRPF 15%: 150,00 €', 'Total: -1.060,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: -100000, iva: -21000, total: -106000, retencio: 15000, abonament: true });
    expect(r.confianca).toMatchObject({ subtotal: 'alta', iva: 'alta', total: 'alta', retencio: 'alta' });
  });

  test('retenció en un abonament girat: la terna continua quadrant', () => {
    const r = extreuCamps(['Credit note CN-0008', 'Base imponible: 1.000,00 €', 'IVA 21%: 210,00 €', 'Retención IRPF 15%: -150,00 €', 'Total: 1.060,00 €'].join('\n'));
    expect(r).toMatchObject({ subtotal: -100000, iva: -21000, total: -106000, retencio: 15000 });
  });

  test.each([
    'Número de abonado: 12345',
    'Abonament mensual de serveis',
    'En caso de devolución se emitirá una factura rectificativa.',
    'Any credit note will be issued separately.',
    /* G3T-R04: frases que comencen per la paraula, però no fan de títol. */
    'Abono 3 meses gimnàs',
    'Credit note requests must be sent within 30 days',
    'Nota de crédito disponible en su área de cliente'
  ])('«%s» no fa abonament', (linia) => {
    const r = extreuCamps(`${linia}\nBase imponible 100,00 €\nIVA 21% 21,00 €\nTotal 121,00 €`);
    expect(r).toMatchObject({ subtotal: 10000, iva: 2100, total: 12100 });
    expect(r).not.toHaveProperty('abonament');
  });
});

describe('nifsRecurrents', () => {
  const factura = (emissor) => `Exemple ${emissor} SL\nCIF: ${emissor}\nClient: Associació Exemple\nNIF: ${TITULAR}\nTotal 10,00 €`;

  test('el NIF que apareix en factures de tres proveïdors diferents és el del titular', () => {
    expect(nifsRecurrents([factura(PROVEIDOR), factura(ALTRE), factura(CLIENT)])).toEqual([TITULAR]);
  });

  test('tres factures del mateix proveïdor no fan recurrent ningú', () => {
    expect(nifsRecurrents([factura(PROVEIDOR), factura(PROVEIDOR), factura(PROVEIDOR)])).toEqual([]);
  });

  test('proveïdors del catàleg (detectats o donats) i mínim configurable', () => {
    const textos = [
      { text: `Som Energia, SCCL\nCIF: F55091367\nNIF client: ${TITULAR}` },
      { text: `SiteGround Spain S.L.\nNIF client: ${TITULAR}`, proveidor: 'siteground' },
      { text: `Factura\nNIF: ${TITULAR}`, nomFitxer: 'factura-dondominio-2026.pdf' }
    ];
    expect(nifsRecurrents(textos)).toEqual([TITULAR]);
    expect(nifsRecurrents(textos.slice(0, 2))).toEqual([]);
    expect(nifsRecurrents(textos.slice(0, 2), { minim: 2 })).toEqual([TITULAR]);
  });

  test('G3T-12: cap NIF del proveïdor del catàleg, tampoc els alternatius, compta com a propi', () => {
    const cataleg = [{
      clau: 'exemple-tel', nom: 'Exemple Telefonia SA', nif: PROVEIDOR, nifsAlternatius: [ALTRE], dominis: ['telefonia.example'],
      patronsFitxer: [], patronsNum: [], paraulesText: []
    }];
    const text = `Exemple Telefonia SA\nCIF: ${PROVEIDOR}\nRebut emés per ${ALTRE}\nNIF client: ${TITULAR}\nhola@telefonia.example`;
    expect(nifsRecurrents([text], { cataleg, minim: 1 })).toEqual([TITULAR]);
  });

  test('entrades buides', () => {
    expect(nifsRecurrents([])).toEqual([]);
    expect(nifsRecurrents(null)).toEqual([]);
    expect(nifsRecurrents(['', 'sense NIF'])).toEqual([]);
  });
});
