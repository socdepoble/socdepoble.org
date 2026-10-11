// @vitest-environment node
/* Sentinella 2 · Triturador Financer amb un lot sintètic fet ací: una Norma
   43 amb dos càrrecs (any 2099, compte i entitat de prova), el CSV del banc
   i un full trimestral amb dues factures inventades. Comprova la
   classificació, la fusió, la conciliació, l'IVA i que el carril pot
   importar els mòduls purs de la Gestoria. */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_TRITURADOR, observaTriturador } from './trituradorFinancer.js';

/* ── Norma 43 sintètica, registre a registre (forma de gestoria/nucli/c43.test.js) ── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const camp = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const r11 = ({ dh = '2', saldo = 0 } = {}) => `11${COMPTE.entitat}${COMPTE.oficina}${COMPTE.compte}990701990930${dh}${xifres(saldo, 14)}9783${camp('TITULAR SINTETIC', 26)}${camp('', 3)}`;
const r22 = ({ op, dh = '1', centims }) => `22${camp('', 4)}0001${op}${op}99000${dh}${xifres(centims, 14)}${xifres(0, 10)}${camp('', 12)}${camp('', 16)}`;
const r23 = (a) => `2301${camp(a, 38)}${camp('', 38)}`;
const r33 = ({ nDeure, deure, saldo }) => `33${COMPTE.entitat}${COMPTE.oficina}${COMPTE.compte}${xifres(nDeure, 5)}${xifres(deure, 14)}${xifres(0, 5)}${xifres(0, 14)}1${xifres(saldo, 14)}978${camp('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${camp('', 54)}`;
const LINIES = [
  r11(),
  r22({ op: '990705', centims: 12100 }),
  r23('PAGO FACTURA F-2099-0001 SUBMINISTRES'),
  r22({ op: '990710', centims: 4500 }),
  r23('COMPRA SENSE FACTURA'),
  r33({ nDeure: 2, deure: 16600, saldo: 16600 })
];
const latin1 = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const NORMA43 = latin1(`${[...LINIES, r88(LINIES.length)].join('\r\n')}\r\n`);

const CSV_BANC = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2099-07-10,2099-07-10,COMPRA SENSE FACTURA,-45.00,-166.00',
  '2099-08-01,2099-08-01,ALTRA OPERACIO,-1.00,-167.00'
].join('\n');
const CIF = ['A1234', '5674'].join('');
const FULL = [
  'GASTOS,,,,,,,',
  'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
  `01/07/2099,F-2099-0001,Subministres Sintetics SL,${CIF},Material,"100,00 €","21,00 €","121,00 €"`,
  `02/07/2099,F-2099-0002,Altre Sintetic SL,${CIF},Servei,"100,00 €","10,00 €","130,00 €"`
].join('\r\n');

const fitxer = (nom, contingut) => (typeof contingut === 'string' ? { nom, text: contingut } : { nom, bytes: contingut });
const codis = (eixida) => eixida.avisos.map((a) => a.codi);

describe('un lot complet', () => {
  const eixida = observaTriturador({
    fitxers: [
      fitxer('extracte.n43', NORMA43), fitxer('moviments.csv', CSV_BANC), fitxer('full_3T.csv', FULL),
      fitxer('factura.pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46])), fitxer('notes.docx', new Uint8Array(4)),
      fitxer('altre.csv', 'a,b\n1,2')
    ]
  });

  test('classifica cada fitxer i no llig els PDF', () => {
    expect(codis(eixida)).toEqual(expect.arrayContaining(['TRI-PDF', 'TRI-IGNORAT', 'TRI-NO-RECONEGUT']));
    expect(eixida.informe).toContain('extracte.n43: Norma 43, 2 moviments');
    expect(eixida.informe).toContain('moviments.csv: CSV del banc, 2 files');
    expect(eixida.informe).toContain('full_3T.csv: full trimestral, 2 factures');
  });

  test('la Norma 43 sintètica quadra: cap avís de lectura', () => {
    expect(codis(eixida).filter((c) => c.startsWith('TRI-C43-'))).toEqual([]);
  });

  test('fusiona amb el CSV: la fila sense moviment a la Norma 43 és informativa', () => {
    expect(eixida.avisos.find((a) => a.codi === 'TRI-CSV-SENSE-PARELLA')).toMatchObject({ severitat: 'info' });
  });

  test('concilia: el pagament que cita la factura fa parella; el càrrec sense factura és un assentament proposat', () => {
    expect(eixida.avisos.find((a) => a.codi === 'TRI-ASSENTAMENTS')).toMatchObject({ severitat: 'groga' });
    expect(eixida.informe).toMatch(/Conciliació: 1 parelles proposades, 1 moviments sense factura i 1 factures sense pagament/);
    expect(eixida.informe).toContain('10/07/2099 · -45,00 € · COMPRA SENSE FACTURA');
    expect(eixida.avisos.find((a) => a.codi === 'TRI-SENSE-PAGAMENT')).toMatchObject({ severitat: 'groga' });
  });

  test('l’IVA que no quadra és roja i queda pendent d’Aprovar', () => {
    const iva = eixida.avisos.filter((a) => a.codi.startsWith('TRI-IVA-'));
    expect(iva).toEqual([expect.objectContaining({ codi: 'TRI-IVA-IVA_INCOHERENT', severitat: 'roja', font: 'full_3T.csv' })]);
    expect(iva[0].missatge).toMatch(/F-2099-0002.*pendent d’«Aprovar»/);
  });

  test('l’informe diu que no s’ha anotat, mogut ni esborrat res', () => {
    expect(eixida.informe).toMatch(/Res no s’ha anotat, mogut ni esborrat/);
  });
});

describe('lots parcials', () => {
  test('només el banc: proposa portar el full de factures', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', NORMA43)] });
    expect(codis(eixida)).toEqual(['TRI-SENSE-FACTURES']);
  });

  test('només el CSV del banc: els moviments es concilien igualment', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('moviments.csv', CSV_BANC), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toMatch(/Conciliació: \d+ parelles proposades, 2 moviments sense factura/);
  });

  test('només factures: proposa portar l’extracte', () => {
    expect(codis(observaTriturador({ fitxers: [fitxer('full_3T.csv', FULL)] }))).toEqual(['TRI-IVA-IVA_INCOHERENT', 'TRI-SENSE-BANC']);
  });

  test('una Norma 43 tallada alça les banderes de la lectura amb el fitxer i la línia', () => {
    const tallada = latin1(`${LINIES.slice(0, 3).join('\r\n')}\r\n`);
    const eixida = observaTriturador({ fitxers: [fitxer('tallat.txt', tallada)] });
    expect(codis(eixida)).toEqual(expect.arrayContaining(['TRI-C43-SENSE_PEU', 'TRI-C43-SENSE_FI']));
    expect(eixida.avisos.find((a) => a.codi === 'TRI-C43-SENSE_PEU')).toMatchObject({ severitat: 'roja' });
  });

  test('una Norma 43 en .txt sense salts de línia es llig com la Gestoria (tallada cada 80 caràcters)', () => {
    const seguida = latin1([...LINIES, r88(LINIES.length)].join(''));
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.txt', seguida)] });
    expect(eixida.informe).toContain('extracte.txt: Norma 43, 2 moviments');
    expect(codis(eixida)).not.toContain('TRI-NO-RECONEGUT');
  });

  test('una Norma 43 en .txt amb BOM (bytes o text) també es reconeix', () => {
    const text = `${[...LINIES, r88(LINIES.length)].join('\r\n')}\r\n`;
    const ambBom = Uint8Array.from([0xef, 0xbb, 0xbf, ...latin1(text)]);
    const eixida = observaTriturador({ fitxers: [fitxer('a.txt', ambBom), fitxer('b.txt', `${String.fromCharCode(0xfeff)}${text}`)] });
    expect(eixida.informe).toContain('a.txt: Norma 43, 2 moviments');
    expect(eixida.informe).toContain('b.txt: Norma 43, 2 moviments');
  });

  test('un CSV sense salts que comença per 11 però no fa registres de 80 no és Norma 43', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('x.txt', `11${'0'.repeat(18)}${'x'.repeat(50)}`)] });
    expect(codis(eixida)).toContain('TRI-NO-RECONEGUT');
  });

  test('un CSV del banc desat en windows-1252 conserva els accents del concepte', () => {
    const csv = ['Fecha,F. valor,Concepto,Importe,Saldo', '2099-07-10,2099-07-10,COMPRA FERRETERÍA SINTÈTICA,-45.00,-45.00'].join('\r\n');
    const eixida = observaTriturador({ fitxers: [fitxer('moviments.csv', latin1(csv))] });
    expect(eixida.informe).toContain('moviments.csv: CSV del banc, 1 files');
    expect(eixida.informe).toContain('· COMPRA FERRETERÍA SINTÈTICA');
  });

  test('un CSV del banc en UTF-16LE es reconeix i es llig', () => {
    const csv = `${CSV_BANC}\r\n`;
    const utf16 = Uint8Array.from([0xff, 0xfe, ...[...csv].flatMap((c) => [c.charCodeAt(0) & 0xff, c.charCodeAt(0) >> 8])]);
    const eixida = observaTriturador({ fitxers: [fitxer('moviments.csv', utf16)] });
    expect(eixida.informe).toContain('moviments.csv: CSV del banc, 2 files');
  });

  test('un full trimestral en windows-1252 es llig sencer', () => {
    const windows1252 = (text) => Uint8Array.from(text, (c) => (c === '€' ? 0x80 : c.charCodeAt(0)));
    const eixida = observaTriturador({ fitxers: [fitxer('full_3T.csv', windows1252(FULL))] });
    expect(eixida.informe).toContain('full_3T.csv: full trimestral, 2 factures');
  });

  test('sense fitxers: informa i no peta', () => {
    expect(codis(observaTriturador({ fitxers: [] }))).toEqual(['TRI-SENSE-FITXERS']);
    expect(codis(observaTriturador(null))).toEqual(['TRI-SENSE-FITXERS']);
  });
});

/* Onada 12 (261011; ordres 261011_0130, punt 6): el port dels moviments, l'extracte de la targeta i l'auditoria
   de pagaments per trimestre. */
describe('Onada 12 · el port dels moviments, la targeta i l’auditoria de pagaments', () => {
  const TARGETA = [
    'Extracte de targeta de crèdit', 'Fecha operación;Comercio;Importe', '03/07/2099;FERRETERIA SINTETICA;25,00',
    '04/07/2099;FORN SINTETIC;2,50', '06/07/2099;FERRETERIA SINTETICA;-5,00'
  ].join('\r\n');

  test('el mateix extracte triat dues vegades no duplica els moviments, i ho diu', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('a.n43', NORMA43), fitxer('copia.n43', NORMA43), fitxer('full_3T.csv', FULL)] });
    expect(eixida.avisos.find((a) => a.codi === 'TRI-MOVIMENTS-REPETITS')).toMatchObject({ severitat: 'info' });
    expect(eixida.informe).toMatch(/Conciliació: 1 parelles proposades, 1 moviments sense factura i 1 factures sense pagament/);
    expect(codis(eixida)).not.toContain('TRI-PAGAMENT-DUPLICAT');
  });

  test('l’extracte de la targeta (punt i coma, coma decimal, dd/mm/aaaa) es llig com a extracte, no com a full de factures', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('targeta.csv', TARGETA)] });
    expect(eixida.informe).toContain('targeta.csv: extracte en CSV de targeta (separat per punt i coma), 3 moviments');
    expect(eixida.informe).not.toContain('full trimestral');
    expect(eixida.informe).toContain('03/07/2099 · -25,00 € · FERRETERIA SINTETICA');
    expect(eixida.informe).toContain('06/07/2099 · 5,00 € · FERRETERIA SINTETICA');
    expect(codis(eixida)).toEqual(['TRI-EXTRACTE-SIGNE_INVERTIT', 'TRI-SENSE-FACTURES']);
  });

  test('un CSV de moviments d’un altre banc, amb la columna «Fecha» primer, tampoc es pren per un full', () => {
    const altreBanc = ['Fecha;Concepto;Importe;Saldo', '05/07/2099;PAGO FACTURA F-2099-0001;-121,00;879,00'].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('altre_banc.csv', altreBanc), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toContain('altre_banc.csv: extracte en CSV de compte (separat per punt i coma), 1 moviments');
    expect(eixida.informe).toContain('full_3T.csv: full trimestral, 2 factures');
    expect(eixida.informe).toMatch(/Conciliació: 1 parelles proposades, 0 moviments sense factura i 1 factures sense pagament/);
  });

  test('els moviments de la targeta s’afigen als del compte: no són a la Norma 43 un per un', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', NORMA43), fitxer('targeta.csv', TARGETA), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toMatch(/Conciliació: 1 parelles proposades, 4 moviments sense factura i 1 factures sense pagament/);
    expect(eixida.informe).toContain('Banc: 5 moviments al trimestre.');
  });

  test('amb banc i full, l’informe porta l’auditoria de pagaments del trimestre', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', NORMA43), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toContain('Auditoria de pagaments per trimestre (indicis per a revisar, no veredictes):');
    expect(eixida.informe).toContain('── 3T de 2099 (01/07/2099 - 30/09/2099) · trimestre deduït de les dates de les factures ──');
    expect(eixida.informe).toContain('Despeses: 200,00 € de base, 31,00 € d’IVA suportat i 251,00 € de total (2 factures).');
    expect(eixida.informe).toContain('Banc: 2 moviments al trimestre. Cobrat 0,00 € i pendent de cobrar 0,00 €; pagat 121,00 € i sense pagament al banc 130,00 €.');
    expect(eixida.informe).toContain('Eixides del banc sense factura (1):');
  });

  test('només amb el full, en dona el resum sense inventar res del banc', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toContain('Resum del full per trimestre (sense banc):');
    expect(eixida.informe).not.toContain('Banc:');
  });

  test('una factura pagada dues vegades i una factura fora del trimestre del seu full alcen bandera', () => {
    const linies = [
      r11(),
      r22({ op: '990705', centims: 12100 }), r23('PAGO FACTURA F-2099-0001 SUBMINISTRES'),
      r22({ op: '990805', centims: 12100 }), r23('PAGO FACTURA F-2099-0001 SUBMINISTRES'),
      r33({ nDeure: 2, deure: 24200, saldo: 24200 })
    ];
    const dosPagaments = latin1(`${[...linies, r88(linies.length)].join('\r\n')}\r\n`);
    const full3T = [
      '2099-FACTURACIO-Titular_Sintetic,,,,,,,3T', 'GASTOS,,,,,,,', 'Data,Núm,Proveïdor,NIF - CIF,Descripció,Subtotal,IVA,Total',
      `01/07/2099,F-2099-0001,Subministres Sintetics SL,${CIF},Material,"100,00 €","21,00 €","121,00 €"`,
      `01/10/2099,F-2099-0009,Subministres Sintetics SL,${CIF},Material,"100,00 €","21,00 €","121,00 €"`
    ].join('\r\n');
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', dosPagaments), fitxer('2099-FACTURACIO-3T.csv', full3T)] });
    expect(eixida.avisos.find((a) => a.codi === 'TRI-PAGAMENT-DUPLICAT')).toMatchObject({ severitat: 'groga', font: '3T 2099' });
    expect(eixida.avisos.find((a) => a.codi === 'TRI-FORA-TRIMESTRE')).toMatchObject({ severitat: 'groga', font: '3T 2099' });
    expect(eixida.informe).toContain('── 3T de 2099 (01/07/2099 - 30/09/2099) ──');
    expect(eixida.informe).toContain('Possibles pagaments duplicats (1):');
    expect(eixida.informe).toContain('Factures amb la data fora del trimestre (1):');
  });
});

/* Correccions 261011 (refutador adversari). Cada prova era roja abans del canvi. */
describe('Onada 12 · correccions del refutador', () => {
  const FULL_EMESES = [
    '2099-FACTURACIO-Titular_Sintetic,,,,,,,3T', 'INGRESSOS,,,,,,,', 'Data,Núm,Client,NIF - CIF,Descripció,Subtotal,IVA,Total',
    `01/07/2099,F99-0001,Client Sintetic SL,${CIF},Servei,"1.000,00 €","210,00 €","1.060,00 €"`
  ].join('\r\n');

  test('punt 2 · el CSV del banc de sempre triat dues vegades no compta doble', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('moviments.csv', CSV_BANC), fitxer('moviments (1).csv', CSV_BANC)] });
    expect(eixida.informe).toContain('Moviments del banc: 2.');
    expect(eixida.avisos.find((a) => a.codi === 'TRI-FITXER-REPETIT')).toMatchObject({ severitat: 'info', font: 'moviments (1).csv' });
  });

  test('punt 5 · el mateix full triat dues vegades no dobla la base ni l’IVA', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('full_3T.csv', FULL), fitxer('full_3T copia.csv', FULL)] });
    expect(eixida.informe).toContain('Despeses: 200,00 € de base, 31,00 € d’IVA suportat i 251,00 € de total (2 factures).');
    expect(codis(eixida)).toContain('TRI-FITXER-REPETIT');
  });

  test('punt 2 · dues targetes amb la mateixa subscripció el mateix dia: es conserven els dos càrrecs i s’avisa en groc', () => {
    const targeta = (altre) => ['Fecha;Comercio;Importe', '05/07/2099;SUBSCRIPCIO SINTETICA;-9,99', altre].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('targeta_a.csv', targeta('06/07/2099;FORN SINTETIC;-2,00')), fitxer('targeta_b.csv', targeta('07/07/2099;BAR SINTETIC;-3,00'))] });
    expect(eixida.informe).toContain('Moviments del banc: 4.');
    expect(eixida.avisos.find((a) => a.codi === 'TRI-MOVIMENTS-DUBTOSOS')).toMatchObject({ severitat: 'groga' });
    expect(codis(eixida)).not.toContain('TRI-MOVIMENTS-REPETITS');
  });

  test('punt 2 · el mateix compte en Norma 43 i en un CSV d’un altre format no se suma a cegues: compta una vegada i s’avisa', () => {
    const delMateixCompte = ['Fecha;Concepto;Importe;Saldo', '05/07/2099;PAGAMENT FACTURA;-121,00;-121,00', '10/07/2099;COMPRA;-45,00;-166,00'].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', NORMA43), fitxer('compte.csv', delMateixCompte)] });
    expect(eixida.informe).toContain('Moviments del banc: 2.');
    expect(eixida.avisos.find((a) => a.codi === 'TRI-EXTRACTE-SOLAPAT')).toMatchObject({ severitat: 'groga' });
  });

  test('punt 3 · compres en positiu sense cap senyal: l’avís va DALT de tot i eixos imports no entren com a ingressos', () => {
    const dubtos = ['Fecha;Concepto;Importe', '03/07/2099;FERRETERIA SINTETICA;25,00', '04/07/2099;FORN SINTETIC;2,50'].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('moviments_juliol.csv', dubtos), fitxer('full_3T.csv', FULL_EMESES)] });
    expect(eixida.informe.startsWith('ATENCIÓ')).toBe(true);
    expect(eixida.informe.split('\n')[0]).toContain('moviments_juliol.csv');
    expect(eixida.avisos.find((a) => a.codi === 'TRI-EXTRACTE-SIGNE_DUBTOS')).toMatchObject({ severitat: 'groga' });
    expect(eixida.informe).not.toContain('Entrades del banc sense factura');
    expect(eixida.informe).toContain('Pendents de confirmar el signe (2):');
    expect(codis(eixida)).toContain('TRI-SENSE-BANC');
  });

  test('punt 4 · pel camí de producció (full CSV sense columna de retenció), l’informe no diu «0,00 €»: deduïx la retenció', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('full_3T.csv', FULL_EMESES)] });
    expect(eixida.informe).toContain('Retencions d’IRPF a les factures emeses: 150,00 € (deduïdes de base + IVA − total en una factura: el full no té columna de retenció).');
    expect(eixida.informe).not.toContain('Retencions d’IRPF a les factures emeses: 0,00 €');
  });

  test('punt 7 · un càrrec en dòlars no entra a la conciliació ni als totals: es llista a part', () => {
    const ambDolars = ['Fecha;Concepto;Importe;Moneda', '05/07/2099;SINTETIC INC;-121,00;USD', '06/07/2099;FORN SINTETIC;-2,00;EUR'].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('compte.csv', ambDolars), fitxer('full_3T.csv', FULL)] });
    expect(eixida.avisos.find((a) => a.codi === 'TRI-ALTRA-MONEDA')).toMatchObject({ severitat: 'groga' });
    expect(eixida.informe).toContain('En una altra moneda, fora de la conciliació (1):');
    expect(eixida.informe).toContain('Banc: 1 moviments al trimestre.'.replace('1 moviments', 'un moviment'));
    expect(eixida.informe).toMatch(/Conciliació: 0 parelles proposades, 1 moviments sense factura/);
  });

  test('punt 10 · un extracte amb les dates mm/dd no es llig girat: bandera roja i cap moviment', () => {
    const america = ['Date,Description,Amount', '07/04/2099,SINTETIC INC,-12.50', '07/25/2099,SINTETIC INC,-3.00'].join('\n');
    const eixida = observaTriturador({ fitxers: [fitxer('usa.csv', america)] });
    expect(eixida.avisos.find((a) => a.codi === 'TRI-EXTRACTE-DATES_MES_DIA')).toMatchObject({ severitat: 'roja', font: 'usa.csv' });
    expect(codis(eixida)).not.toContain('TRI-NO-RECONEGUT');
    expect(eixida.informe).not.toContain('Moviments del banc');
  });

  test('punt 12 · amb fulls, només es miren els moviments dels seus trimestres i dels dos veïns; la resta es diu', () => {
    const linies = [
      r11(), r22({ op: '990105', centims: 700 }), r23('QUOTA DE GENER'), r22({ op: '990705', centims: 12100 }), r23('PAGO FACTURA F-2099-0001 SUBMINISTRES'),
      r33({ nDeure: 2, deure: 12800, saldo: 12800 })
    ];
    const ambGener = latin1(`${[...linies, r88(linies.length)].join('\r\n')}\r\n`);
    const eixida = observaTriturador({ fitxers: [fitxer('any.n43', ambGener), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toMatch(/Conciliació: 1 parelles proposades, 0 moviments sense factura/);
    expect(eixida.avisos.find((a) => a.codi === 'TRI-FORA-DEL-PERIODE')).toMatchObject({ severitat: 'info' });
    expect(codis(eixida)).not.toContain('TRI-FONT-NO-CONFORME');
  });

  test('punt 13 · l’informe amb auditoria porta l’avís de límits: és una ajuda per a revisar, no un veredicte', () => {
    const eixida = observaTriturador({ fitxers: [fitxer('extracte.n43', NORMA43), fitxer('full_3T.csv', FULL)] });
    expect(eixida.informe).toContain('ATENCIÓ: açò és una ajuda per a revisar, no un veredicte.');
    expect(eixida.informe).toContain('només casa si arriba entre 3 dies abans i 10 després');
  });
});

describe('el contracte del Triturador', () => {
  test('les fonts declaren també el port, el lector tolerant i l’auditoria de pagaments (Onada 12)', () => {
    expect(SENTINELLA_TRITURADOR.manifest.fonts).toEqual(expect.arrayContaining([
      'src/sections/gestoria/nucli/fontMoviments.js', 'src/sections/gestoria/nucli/extracteCsv.js', 'src/sections/gestoria/nucli/auditoriaPagaments.js'
    ]));
    expect(SENTINELLA_TRITURADOR.manifest.versio).toBe('1.1.0');
  });

  test('la porta humana parla amb les formes del repo: res «ix» d’ací', () => {
    expect(SENTINELLA_TRITURADOR.portaHumana).toMatch(/cap pagament ni enviament ix d’ací/);
  });

  test('prepara passa els fitxers triats tal qual', () => {
    const fitxers = [fitxer('a.n43', NORMA43)];
    expect(SENTINELLA_TRITURADOR.entrada.prepara(fitxers)).toEqual({ fitxers });
  });

  test('les fonts declaren els mòduls purs de la Gestoria que importa', () => {
    expect(SENTINELLA_TRITURADOR.manifest.fonts).toEqual(expect.arrayContaining([
      'src/sections/gestoria/nucli/c43.js', 'src/sections/gestoria/nucli/movimentsBanc.js', 'src/sections/gestoria/nucli/concilia.js',
      'src/sections/gestoria/nucli/fullModel.js', 'src/sections/gestoria/nucli/model.js'
    ]));
  });
});
