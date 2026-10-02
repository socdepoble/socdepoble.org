// @vitest-environment node
/* Gestoria · nucli · classifica: tipus i sentit dels documents pel nom, sèrie
   de factures emeses, duplicats i CSV de factura de Google. Noms de fitxer,
   números i imports sintètics. */
import { describe, expect, test } from 'vitest';
import {
  classificaDocument, classificaDocuments, detectaDuplicats, llegeixCsvFacturaProveidor, sentitPerSerie, serieEmesa,
  TIPUS_DOCUMENT
} from './classifica.js';
import { crearFactura } from './model.js';

const xifres = (n) => '7'.repeat(n);
const tipusDe = (ruta) => classificaDocument({ ruta, mida: 1000 })?.tipus ?? null;

describe('classificaDocument: tipus', () => {
  test.each([
    ['2026_1T/2026-FACTURACIO-Titular_Exemple_-_1T.csv', 'model-trimestral'],
    ['2025_4T/2025-FACTURACIO-Titular_Exemple_-_4T.xlsx', 'model-trimestral'],
    ['2026_1T/account_activities_2026_03.csv', 'extracte'],
    ['2026_1T/extracte_marc.pdf', 'extracte'],
    [`2026_1T/${xifres(10)}.csv`, 'csv-factura'],
    ['2026_1T/Receipt-2345-6789.pdf', 'rebut'],
    ['2026_1T/fal-receipt-ABC-0001.pdf', 'rebut'],
    ['2026_1T/Rebut_lloguer.pdf', 'rebut'],
    ['2026_1T/recibo_marzo.PDF', 'rebut'],
    ['2026_1T/Justificante de pago.pdf', 'rebut'],
    ['2026_1T/ticket recibo.jpg', 'rebut'],
    ['2026_1T/Invoice-ABCD1234-0001.pdf', 'factura'],
    ['2026_1T/factura_rebuda_marc.pdf', 'factura'],
    [`2026_1T/${xifres(10)}.pdf`, 'factura'],
    ['2026_1T/despeses.xlsx', 'full-calcul'],
    ['2026_1T/pressupost.numbers', 'full-calcul'],
    ['2026_1T/antic.xls', 'full-calcul'],
    ['2026_1T/altres.csv', 'full-calcul'],
    ['2026_1T/foto.jpeg', 'imatge'],
    ['2026_1T/IMG_0001.HEIC', 'imatge'],
    ['2026_1T/captura.png', 'imatge'],
    ['2026_1T/notes.txt', 'desconegut'],
    ['2026_1T/sense_extensio', 'desconegut']
  ])('«%s» → %s', (ruta, tipus) => {
    expect(tipusDe(ruta)).toBe(tipus);
  });

  test.each(['2026_1T/.DS_Store', '2026_1T/._factura.pdf', '.carpeta/factura.pdf', '2026_1T/Thumbs.db', '', null])('ocult «%s» → null', (ruta) => {
    expect(classificaDocument({ ruta })).toBeNull();
  });

  test('els tipus tornats són del contracte', () => {
    for (const ruta of ['a.pdf', 'b.csv', 'c.png', 'd.txt', 'Receipt-1.pdf']) expect(TIPUS_DOCUMENT).toContain(tipusDe(ruta));
  });

  test('un rebut porta el motiu que no és una factura', () => {
    expect(classificaDocument({ ruta: 'Receipt-2345-6789.pdf' }).motiu).toMatch(/no és una factura/);
  });
});

describe('classificaDocument: sentit', () => {
  const sentit = (ruta, opcions) => classificaDocument({ ruta }, opcions).sentit;

  test('per la carpeta', () => {
    expect(sentit('2026_1T/Ingressos/client.pdf')).toBe('emesa');
    expect(sentit('2026_1T/Factures emeses/client.pdf')).toBe('emesa');
    expect(sentit('2026_1T/02_Gastos/proveidor.pdf')).toBe('rebuda');
    expect(sentit('2026_1T/Despeses/proveidor.pdf')).toBe('rebuda');
    /* El nom del fitxer no compta com a carpeta. */
    expect(sentit('2026_1T/gastos.pdf')).toBeNull();
  });

  test('per la sèrie pròpia, abans que la carpeta', () => {
    const serie = serieEmesa(['F26 0001', 'F26 0002']);
    expect(sentit('2026_1T/F26 0003 Exemple Client.pdf', { serie })).toBe('emesa');
    expect(sentit('2026_1T/Gastos/F26_0004.pdf', { serie })).toBe('emesa');
    expect(sentit('2026_1T/altra.pdf', { serie })).toBeNull();
  });

  test('pel catàleg de proveïdors', () => {
    expect(sentit('2026_1T/lowi_abril.pdf')).toBe('rebuda');
    expect(classificaDocument({ ruta: 'lowi_abril.pdf' }).motiu).toMatch(/Lowi/);
  });

  test('els rebuts i els CSV de proveïdor són rebuts; el model i els extractes, sense sentit', () => {
    expect(sentit('Receipt-1.pdf')).toBe('rebuda');
    expect(sentit(`${xifres(10)}.csv`)).toBe('rebuda');
    expect(sentit('2026-FACTURACIO-Titular_-_1T.csv')).toBeNull();
    expect(sentit('account_activities_1.csv')).toBeNull();
  });
});

describe('classificaDocuments', () => {
  test('lleva els ocults i conserva els camps del document', () => {
    const llista = classificaDocuments([
      { ruta: '2026_1T/.DS_Store', mida: 6148 },
      { ruta: '2026_1T/factura.pdf', mida: 1000, sha256: 'abc' },
      { ruta: '2026_1T/._factura.pdf', mida: 4096 }
    ]);
    expect(llista).toEqual([
      { ruta: '2026_1T/factura.pdf', mida: 1000, sha256: 'abc', tipus: 'factura', sentit: null, motiu: expect.any(String) }
    ]);
    expect(classificaDocuments(null)).toEqual([]);
  });
});

describe('serieEmesa i sentitPerSerie', () => {
  test('l\'exemple del contracte: «F26 0001»', () => {
    const serie = serieEmesa([crearFactura({ tipus: 'ingres', num: 'F26 0001', data: { a: 2026, m: 1, d: 10 } })]);
    expect(serie).toBeInstanceOf(RegExp);
    expect(serie.flags).toBe('i');
    /* source escapa la barra: «\/». */
    expect(serie.source.replace(/\\\//g, '/')).toContain('F[\\s._/-]*26[\\s._/-]*0*\\d{1,4}');
    for (const nom of ['F26 0007', 'f26 0012', 'F260001', 'F26-0003.pdf', 'Factura_F26_0099_Exemple.pdf', 'F26 12']) {
      expect(sentitPerSerie(nom, serie)).toBe('emesa');
    }
    for (const nom of ['XF26 0001.pdf', 'F25 0001.pdf', 'F26 00012345.pdf', 'FE2604300001.pdf', 'factura.pdf']) {
      expect(sentitPerSerie(nom, serie)).toBeNull();
    }
  });

  test('l\'any que canvia es generalitza; el text constant es queda', () => {
    const serie = serieEmesa(['F25 0011', 'F25 0012', 'F26 0001']);
    expect(serie.test('F27 0001')).toBe(true);
    expect(serie.test('G27 0001')).toBe(false);
  });

  test('lletres diferents i seqüències llargues', () => {
    const serie = serieEmesa(['FV-2026/12', 'RV-2026/123456']);
    expect(serie.test('RV-2026-123456.pdf')).toBe(true);
    expect(serie.test('AB 2026 7')).toBe(true);
    expect(serie.test('ABC 2026 7')).toBe(false);
  });

  test('la forma de la factura més recent mana', () => {
    const ingressos = [
      crearFactura({ tipus: 'ingres', num: '2025-001', data: { a: 2025, m: 3, d: 1 } }),
      crearFactura({ tipus: 'ingres', num: '2025-002', data: { a: 2025, m: 6, d: 1 } }),
      crearFactura({ tipus: 'ingres', num: 'F26 0001', data: { a: 2026, m: 1, d: 5 } })
    ];
    const serie = serieEmesa(ingressos);
    expect(serie.test('F26 0002')).toBe(true);
    expect(serie.test('2025-003')).toBe(false);
  });

  test('sense dates, la forma més repetida', () => {
    expect(serieEmesa(['A-1', 'A-2', '2026/9']).test('A-3')).toBe(true);
  });

  test('una sèrie sense lletres es confondria amb les dates: null', () => {
    expect(serieEmesa(['2026-001', '2026-002'])).toBeNull();
    expect(serieEmesa([])).toBeNull();
    expect(serieEmesa(null)).toBeNull();
    expect(serieEmesa([crearFactura({ tipus: 'despesa', num: 'F26 0001' })])).toBeNull();
    expect(serieEmesa(['F26-A'])).toBeNull();
  });

  test('sentitPerSerie sense sèrie: null', () => {
    expect(sentitPerSerie('F26 0001.pdf', null)).toBeNull();
    expect(sentitPerSerie('', /x/)).toBeNull();
  });
});

describe('detectaDuplicats', () => {
  test('el mateix sha256, en qualsevol carpeta', () => {
    const grups = detectaDuplicats([
      { ruta: '2026_1T/b.pdf', mida: 10, sha256: 's1' },
      { ruta: '2026_2T/a.pdf', mida: 99, sha256: 's1' },
      { ruta: '2026_1T/c.pdf', mida: 10, sha256: 's2' }
    ]);
    expect(grups).toEqual([{ motiu: 'contingut', documents: [
      { ruta: '2026_1T/b.pdf', mida: 10, sha256: 's1' },
      { ruta: '2026_2T/a.pdf', mida: 99, sha256: 's1' }
    ] }]);
  });

  test.each([
    'factura copia.pdf', 'factura - copia.pdf', 'factura còpia.pdf', 'factura copy.pdf', 'factura copy 2.pdf',
    'factura (1).pdf', 'factura - copia (2).pdf', 'Factura (1) copia.PDF'
  ])('«%s» és còpia de «factura.pdf» amb mida a ±1 %%', (copia) => {
    const grups = detectaDuplicats([{ ruta: `2026_1T/${copia}`, mida: 1005 }, { ruta: '2026_1T/factura.pdf', mida: 1000 }]);
    expect(grups).toHaveLength(1);
    expect(grups[0].motiu).toBe('nom');
    expect(grups[0].documents.map((d) => d.ruta)).toEqual(['2026_1T/factura.pdf', `2026_1T/${copia}`]);
  });

  test('no són duplicats: mida massa diferent, una altra carpeta o sense marca de còpia', () => {
    expect(detectaDuplicats([{ ruta: 'a/factura copia.pdf', mida: 1020 }, { ruta: 'a/factura.pdf', mida: 1000 }])).toEqual([]);
    expect(detectaDuplicats([{ ruta: 'b/factura copia.pdf', mida: 1000 }, { ruta: 'a/factura.pdf', mida: 1000 }])).toEqual([]);
    expect(detectaDuplicats([{ ruta: 'a/factura.pdf', mida: 1000 }, { ruta: 'a/factura.PDF', mida: 1000 }])).toEqual([]);
    expect(detectaDuplicats([{ ruta: 'a/factura copia.pdf' }, { ruta: 'a/factura.pdf' }])).toEqual([]);
    expect(detectaDuplicats([{ ruta: 'a/factura.pdf', mida: 1000 }, { ruta: 'a/factura.xlsx', mida: 1000 }])).toEqual([]);
  });

  test('uneix contingut i nom en un sol grup', () => {
    const grups = detectaDuplicats([
      { ruta: 'a/factura.pdf', mida: 1000, sha256: 's1' },
      { ruta: 'a/factura (1).pdf', mida: 1000 },
      { ruta: 'z/altra.pdf', mida: 1000, sha256: 's1' }
    ]);
    expect(grups).toHaveLength(1);
    expect(grups[0].motiu).toBe('nom');
    expect(grups[0].documents.map((d) => d.ruta)).toEqual(['a/factura.pdf', 'z/altra.pdf', 'a/factura (1).pdf']);
  });

  test('entrades buides', () => {
    expect(detectaDuplicats([])).toEqual([]);
    expect(detectaDuplicats(null)).toEqual([]);
    expect(detectaDuplicats([null, { mida: 3 }])).toEqual([]);
  });
});

describe('llegeixCsvFacturaProveidor', () => {
  const csvGoogle = [
    `Número de factura,${xifres(10)}`,
    'Fecha de la factura,30 abr 2026',
    'Importe de la factura,"12,10 €"',
    'ID de facturación,0000-0000-0000',
    '',
    'Descripción,Intervalo,Cantidad,Importe(€)',
    'Google Workspace Business Starter,1 abr 2026 - 30 abr 2026,1,"10,00"',
    'Subtotal en EUR,,,"10,00"',
    'I.V.A. (21%),,,"2,10"',
    'Total en EUR,,,"12,10"'
  ].join('\r\n');

  test('llig les files clau-valor i la taula', () => {
    const f = llegeixCsvFacturaProveidor(csvGoogle);
    expect(f).toEqual({
      tipus: 'despesa',
      data: { a: 2026, m: 4, d: 30 },
      num: xifres(10),
      contrapart: 'Google Cloud EMEA Limited',
      nif: 'IE3668997OH',
      descripcio: 'Google Workspace Business Starter',
      subtotal: 1000,
      iva: 210,
      total: 1210,
      percentatgeIva: 21,
      origen: { fitxer: null, metode: 'csv-proveidor' },
      confianca: { num: 'alta', data: 'alta', total: 'alta', subtotal: 'alta', iva: 'alta', contrapart: 'mitjana', nif: 'mitjana' }
    });
  });

  test('passada per crearFactura és una factura completa', () => {
    const parcial = llegeixCsvFacturaProveidor(csvGoogle);
    const f = crearFactura({ ...parcial, origen: { ...parcial.origen, fitxer: `2026_2T/${xifres(10)}.csv` } });
    expect(f.estat).toBe('completa');
    expect(f.origen).toEqual({ fitxer: `2026_2T/${xifres(10)}.csv`, metode: 'csv-proveidor' });
  });

  test('sense fila d\'IVA, l\'IVA es deduïx del total i el subtotal (confiança mitjana)', () => {
    const f = llegeixCsvFacturaProveidor('Número de factura,1\nImporte de la factura,"12,10"\nDescripción,Importe\nServei,"10,00"\nSubtotal,"10,00"\n');
    expect(f).toMatchObject({ subtotal: 1000, iva: 210, total: 1210, descripcio: 'Servei' });
    expect(f.confianca.iva).toBe('mitjana');
    expect(f.percentatgeIva).toBeUndefined();
  });

  test('sense subtotal, es deduïx del total i l\'IVA', () => {
    const f = llegeixCsvFacturaProveidor('Invoice number,9\nInvoice date,"Apr 30, 2026"\nDescription,Amount\nVAT (21.5%),"2,15"\nTotal in EUR,"12,15"\n');
    expect(f).toMatchObject({ num: '9', data: { a: 2026, m: 4, d: 30 }, subtotal: 1000, iva: 215, total: 1215, percentatgeIva: 21.5 });
    expect(f.confianca.subtotal).toBe('mitjana');
  });

  test('el separador punt i coma i un altre proveïdor', () => {
    const f = llegeixCsvFacturaProveidor('Número de factura;F-1\nImporte de la factura;"5,00"\n', { proveidor: null });
    expect(f).toMatchObject({ num: 'F-1', total: 500, contrapart: '', nif: '' });
    expect(f.confianca.contrapart).toBeUndefined();
  });

  test('un text que no és una factura: null', () => {
    expect(llegeixCsvFacturaProveidor('a,b\nc,d\n')).toBeNull();
    expect(llegeixCsvFacturaProveidor('')).toBeNull();
    expect(llegeixCsvFacturaProveidor(null)).toBeNull();
  });
});
