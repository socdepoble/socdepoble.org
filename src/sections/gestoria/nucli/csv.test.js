// @vitest-environment node
/* Gestoria · nucli · csv: lectura tolerant, escriptura amb cometes quan cal,
   protecció de fórmules i decodificació UTF-8 / windows-1252 / UTF-16LE.
   Totes les dades són sintètiques. */
import { describe, expect, test } from 'vitest';
import { decodificaText, decodificaTextDetallat, detectaDelimitador, parseCsv, protegeixFormula, serialitzaCsv } from './csv.js';

const BOM = String.fromCharCode(0xfeff);

describe('parseCsv', () => {
  test('files i camps simples, amb els tres salts de línia', () => {
    const esperat = [['a', 'b', 'c'], ['1', '2', '3']];
    expect(parseCsv('a,b,c\r\n1,2,3\r\n')).toEqual(esperat);
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual(esperat);
    expect(parseCsv('a,b,c\r1,2,3\r')).toEqual(esperat);
    expect(parseCsv('a,b,c\n1,2,3')).toEqual(esperat);
    expect(parseCsv('a,b,c\r\n1,2,3\n')).toEqual(esperat);
  });

  test('cometes: delimitador, cometes doblades i salts dins del camp', () => {
    const text = '"1.234,56 €","Diu ""hola""","línia 1\r\nlínia 2",""\r\nx,"",y\r\n';
    expect(parseCsv(text)).toEqual([['1.234,56 €', 'Diu "hola"', 'línia 1\r\nlínia 2', ''], ['x', '', 'y']]);
  });

  test('el BOM no arriba al primer camp', () => {
    expect(parseCsv(`${BOM}Data,Núm\r\n`)).toEqual([['Data', 'Núm']]);
  });

  test('les línies buides es conserven com a [\'\'] i el salt final no afig cap fila', () => {
    expect(parseCsv('a\r\n\r\nb\r\n')).toEqual([['a'], [''], ['b']]);
    expect(parseCsv('a,\r\n')).toEqual([['a', '']]);
    expect(parseCsv(',,')).toEqual([['', '', '']]);
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv(BOM)).toEqual([]);
  });

  test('tolerància: cometa a mitjan camp, text després de tancar i cometa sense tancar', () => {
    expect(parseCsv('ab"c,d')).toEqual([['ab"c', 'd']]);
    expect(parseCsv('"ab"c,d')).toEqual([['abc', 'd']]);
    expect(parseCsv('a,"sense tancar\nfins al final')).toEqual([['a', 'sense tancar\nfins al final']]);
    expect(parseCsv('""')).toEqual([['']]);
  });

  test('delimitador explícit', () => {
    expect(parseCsv('a;b,c', { delimitador: ';' })).toEqual([['a', 'b,c']]);
    expect(parseCsv('a\tb', { delimitador: '\t' })).toEqual([['a', 'b']]);
    expect(() => parseCsv('a', { delimitador: '"' })).toThrow(RangeError);
    expect(() => parseCsv('a', { delimitador: ';;' })).toThrow(RangeError);
  });

  test('entrada que no és text', () => {
    expect(parseCsv(null)).toEqual([]);
    expect(parseCsv(undefined)).toEqual([]);
  });

  test('el full de la gestoria amb coma (totals de 8 camps)', () => {
    const text = [
      '2026-FACTURACIO-Exemple_Titular,,,,,,,2T',
      '',
      ',,,Exemple Titular - 01/04/2026 - 30/06/2026,,,,',
      '',
      'INGRESSOS,,,,,,,',
      'Data,Núm,Client,NIF - CIF,Descripció,Subtotal,IVA,Total',
      '15/04/26,F-1,"Exemple Energia, SCCL",A12345674,Servei,"1.234,56 €","259,26 €","1.493,82 €"',
      ',,,,Totals,"1.234,56 €","259,26 €","1.493,82 €"',
      ''
    ].join('\r\n');
    const files = parseCsv(`${BOM}${text}`);
    expect(files).toHaveLength(8);
    expect(files[0]).toEqual(['2026-FACTURACIO-Exemple_Titular', '', '', '', '', '', '', '2T']);
    expect(files[1]).toEqual(['']);
    expect(files[2][3]).toBe('Exemple Titular - 01/04/2026 - 30/06/2026');
    expect(files[6]).toEqual(['15/04/26', 'F-1', 'Exemple Energia, SCCL', 'A12345674', 'Servei', '1.234,56 €', '259,26 €', '1.493,82 €']);
    expect(files[7]).toEqual(['', '', '', '', 'Totals', '1.234,56 €', '259,26 €', '1.493,82 €']);
  });

  test('el format antic amb punt i coma i totals de 9 camps', () => {
    const text = [
      'Data;Núm;Proveïdor;NIF - CIF;Descripció;Subtotal;IVA;Total',
      '01/02/26;A-7;Exemple Serveis SL;A12345674;Quota;100,00 €;21,00 €;121,00 €',
      ';;;;;Totals;100,00 €;21,00 €;121,00 €'
    ].join('\n');
    const files = parseCsv(text);
    expect(files[1]).toEqual(['01/02/26', 'A-7', 'Exemple Serveis SL', 'A12345674', 'Quota', '100,00 €', '21,00 €', '121,00 €']);
    expect(files[2]).toHaveLength(9);
    expect(files[2][5]).toBe('Totals');
  });
});

describe('detectaDelimitador', () => {
  test('tria el més freqüent fora de cometes', () => {
    expect(detectaDelimitador('a,b,c\n1,2,3')).toBe(',');
    expect(detectaDelimitador('a;b;c\n1;2,5;3')).toBe(';');
    expect(detectaDelimitador('a\tb\tc\n1\t2\t3')).toBe('\t');
    expect(detectaDelimitador('"1,2,3,4,5";b;c')).toBe(';');
    expect(detectaDelimitador('01/02/26;A-7;Exemple;1.234,56 €;259,26 €;1.493,82 €')).toBe(';');
  });

  test('empat o cap: coma', () => {
    expect(detectaDelimitador('a;b,c')).toBe(',');
    expect(detectaDelimitador('res')).toBe(',');
    expect(detectaDelimitador('')).toBe(',');
  });

  test('només mira les primeres línies no buides', () => {
    const text = `${'a,b\n\n'.repeat(3)}${'x;y;z;w\n'.repeat(50)}`;
    expect(detectaDelimitador(text, { linies: 3 })).toBe(',');
    expect(detectaDelimitador(text, { linies: 20 })).toBe(';');
  });

  test('els salts dins de cometes no conten com a línies', () => {
    expect(detectaDelimitador('"a\nb\nc\nd";x;y\n1;2;3', { linies: 1 })).toBe(';');
  });
});

describe('serialitzaCsv', () => {
  test('per defecte: BOM, coma, CRLF i salt al final', () => {
    expect(serialitzaCsv([['a', 'b'], ['1', '2']])).toBe(`${BOM}a,b\r\n1,2\r\n`);
  });

  test('cometes només quan cal', () => {
    const files = [['1.234,56 €', 'Diu "hola"', 'dues\nlínies', 'retorn\r', 'net', '']];
    expect(serialitzaCsv(files, { bom: false })).toBe('"1.234,56 €","Diu ""hola""","dues\nlínies","retorn\r",net,\r\n');
  });

  test('opcions: punt i coma, LF i sense BOM', () => {
    expect(serialitzaCsv([['1.234,56 €', 'a;b']], { delimitador: ';', salt: '\n', bom: false })).toBe('1.234,56 €;"a;b"\n');
  });

  test('valors absents, números i files buides', () => {
    expect(serialitzaCsv([[null, undefined, 0, 12], [], null], { bom: false })).toBe(',,0,12\r\n\r\n\r\n');
    expect(serialitzaCsv([], { bom: false })).toBe('');
    expect(serialitzaCsv([])).toBe(BOM);
  });

  test('delimitador no vàlid: error', () => {
    expect(() => serialitzaCsv([['a']], { delimitador: '\n' })).toThrow(RangeError);
  });

  test('anada i tornada amb parseCsv per als tres delimitadors', () => {
    const files = [
      ['2026-FACTURACIO-Exemple_Titular', '', '', '', '', '', '', '1T'],
      [''],
      ['15/01/26', 'F-1', 'Exemple, "Coop"', 'A12345674', 'línia 1\r\nlínia 2', '1.234,56 €', '259,26 €', '1.493,82 €'],
      ['', '', '', '', 'Totals', '0,00 €', '0,00 €', '0,00 €']
    ];
    for (const delimitador of [',', ';', '\t']) {
      const text = serialitzaCsv(files, { delimitador });
      expect(parseCsv(text, { delimitador })).toEqual(files);
      expect(parseCsv(text)).toEqual(files);
    }
  });
});

describe('protegeixFormula', () => {
  test.each(['=SUM(A1:A3)', '+34 600', '-12', '@Exemple', '\tamagat', '\rretorn'])('«%s» porta cometa simple davant', (text) => {
    expect(protegeixFormula(text)).toBe(`'${text}`);
  });

  test('la resta no canvia', () => {
    for (const text of ['Exemple Energia SCCL', 'F-1', 'A12345674', ' =espai davant', '']) expect(protegeixFormula(text)).toBe(text);
  });

  test('valors que no són text', () => {
    expect(protegeixFormula(null)).toBe('');
    expect(protegeixFormula(undefined)).toBe('');
    expect(protegeixFormula(5)).toBe('5');
    expect(protegeixFormula(-5)).toBe("'-5");
  });
});

describe('decodificaText', () => {
  const utf8 = (text) => new TextEncoder().encode(text);

  test('UTF-8, amb i sense BOM', () => {
    expect(decodificaText(utf8('Plaça 12 €'))).toBe('Plaça 12 €');
    expect(decodificaText(Uint8Array.from([0xEF, 0xBB, 0xBF, ...utf8('Plaça')]))).toBe('Plaça');
    expect(decodificaTextDetallat(utf8('abc'))).toEqual({ text: 'abc', codificacio: 'utf-8' });
  });

  test('windows-1252 quan no és UTF-8 vàlid: «ç», «€», cometes tipogràfiques i guions', () => {
    const bytes = Uint8Array.from([0x50, 0x6C, 0x61, 0xE7, 0x61, 0x20, 0x31, 0x32, 0x20, 0x80]);
    expect(decodificaTextDetallat(bytes)).toEqual({ text: 'Plaça 12 €', codificacio: 'windows-1252' });
    expect(decodificaText(Uint8Array.from([0x93, 0x61, 0x94, 0x20, 0x96, 0x20, 0x97, 0x20, 0x85]))).toBe('“a” – — …');
    expect(decodificaText(Uint8Array.from([0xC0, 0xE0, 0xC9, 0xE8, 0xED, 0xF2, 0xFA, 0xB7, 0x9C]))).toBe('ÀàÉèíòú·œ');
  });

  test('els cinc bytes sense assignar de windows-1252 es queden com el seu codi', () => {
    expect(decodificaText(Uint8Array.from([0x81, 0x8D, 0x8F, 0x90, 0x9D]))).toBe('\u0081\u008D\u008F\u0090\u009D');
  });

  test('els 256 bytes de windows-1252, un per un', () => {
    const tots = Uint8Array.from({ length: 256 }, (_, i) => i);
    const text = decodificaText(tots);
    expect(text).toHaveLength(256);
    expect(text[0x41]).toBe('A');
    expect(text[0x80]).toBe('€');
    expect(text[0xE7]).toBe('ç');
    expect(text[0xFF]).toBe('ÿ');
  });

  test('fitxers grans en windows-1252', () => {
    const bytes = new Uint8Array(20000).fill(0xE7);
    expect(decodificaText(bytes)).toBe('ç'.repeat(20000));
  });

  test('UTF-16LE amb BOM', () => {
    const bytes = Uint8Array.from([0xFF, 0xFE, 0x61, 0x00, 0xE7, 0x00, 0xAC, 0x20]);
    expect(decodificaTextDetallat(bytes)).toEqual({ text: 'aç€', codificacio: 'utf-16le' });
  });

  test('ArrayBuffer, altres vistes i buit', () => {
    expect(decodificaText(utf8('Plaça').buffer)).toBe('Plaça');
    const amplada = new Uint8Array([0x00, 0x61, 0x62, 0x00]);
    expect(decodificaText(new DataView(amplada.buffer, 1, 2))).toBe('ab');
    expect(decodificaText(new Uint8Array(0))).toBe('');
  });

  test('sense bytes: error', () => {
    expect(() => decodificaText('text')).toThrow(TypeError);
    expect(() => decodificaText(null)).toThrow(TypeError);
  });
});
