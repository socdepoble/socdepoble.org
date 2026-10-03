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

describe('el contracte del Triturador', () => {
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
