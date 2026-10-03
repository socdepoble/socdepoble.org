// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { zipAmbDeflate } from './__fixtures__/zipAmbDeflate.js';
import { crc32, creaZip, llegeixZip } from './zip.js';

const text = (bytes) => new TextDecoder().decode(bytes);
const vista = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

describe('crc32', () => {
  test('el valor de control de l’estàndard i el buit', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32('123456789')).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
  });

  test('rebutja el que no són bytes', () => {
    expect(() => crc32(12)).toThrow(TypeError);
  });
});

describe('creaZip i llegeixZip', () => {
  const ENTRADES = [
    { nom: 'a.txt', dades: 'Hola' },
    { nom: 'carpeta/b.xml', dades: new TextEncoder().encode('<b/>') },
    { nom: 'canço.txt', dades: new Uint8Array([1, 2, 3]).buffer }
  ];

  test('anada i tornada, en ordre i amb el contingut sencer', () => {
    const fitxers = llegeixZip(creaZip(ENTRADES));
    expect(fitxers.map((f) => f.nom)).toEqual(['a.txt', 'carpeta/b.xml', 'canço.txt']);
    expect(text(fitxers[0].dades)).toBe('Hola');
    expect(text(fitxers[1].dades)).toBe('<b/>');
    expect([...fitxers[2].dades]).toEqual([1, 2, 3]);
  });

  test('determinista: data DOS fixa (1980-01-01 00:00) i els mateixos bytes cada vegada', () => {
    const a = creaZip(ENTRADES);
    expect(creaZip(ENTRADES)).toEqual(a);
    const v = vista(a);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint16(8, true)).toBe(0); // STORE
    expect(v.getUint16(10, true)).toBe(0); // hora
    expect(v.getUint16(12, true)).toBe(0x0021); // data
  });

  test('un nom que no és ASCII porta el bit UTF-8; un ASCII, no', () => {
    const zip = creaZip([{ nom: 'a.txt', dades: '' }, { nom: 'canço.txt', dades: '' }]);
    const v = vista(zip);
    expect(v.getUint16(6, true)).toBe(0);
    const segona = 30 + 'a.txt'.length;
    expect(v.getUint16(segona + 6, true)).toBe(0x0800);
  });

  test('rebutja noms buits, absoluts, amb barra inversa, amb .. o repetits', () => {
    for (const nom of ['', '/a.txt', 'a\\b.txt', '../a.txt', 'x/../a.txt', 12]) {
      expect(() => creaZip([{ nom, dades: '' }]), String(nom)).toThrow(TypeError);
    }
    expect(() => creaZip([{ nom: 'a', dades: '' }, { nom: 'a', dades: '' }])).toThrow(RangeError);
    expect(() => creaZip('a')).toThrow(TypeError);
  });

  test('llegeixZip rebutja un CRC que no quadra i el que no és un ZIP', () => {
    const zip = creaZip([{ nom: 'a.txt', dades: 'Hola' }]);
    const malmes = zip.slice();
    malmes[30 + 'a.txt'.length] ^= 0xff;
    expect(() => llegeixZip(malmes)).toThrow(/CRC/);
    expect(() => llegeixZip(new Uint8Array(10))).toThrow(TypeError);
  });
});

describe('llegeixZip amb ZIP d’altres eines', () => {
  const XML = '<sheetData>' + '<row r="1"><c r="A1"><v>1</v></c></row>'.repeat(200) + '</sheetData>';

  test('DEFLATE (mètode 8) i STORE barrejats, amb noms en UTF-8', () => {
    const zip = zipAmbDeflate([
      { nom: 'xl/worksheets/sheet1.xml', dades: XML },
      { nom: 'buida.txt', dades: '' },
      { nom: 'canço.txt', dades: 'sense comprimir', metode: 0 }
    ]);
    const fitxers = llegeixZip(zip);
    expect(fitxers.map((f) => f.nom)).toEqual(['xl/worksheets/sheet1.xml', 'buida.txt', 'canço.txt']);
    expect(text(fitxers[0].dades)).toBe(XML);
    expect(fitxers[0].dades.length).toBeGreaterThan(zip.length);
    expect(fitxers[1].dades.length).toBe(0);
    expect(text(fitxers[2].dades)).toBe('sense comprimir');
  });

  test('el registre final es troba des del final, també amb un comentari que porta la seua signatura', () => {
    const entrades = [{ nom: 'a.txt', dades: 'Hola' }];
    expect(text(llegeixZip(zipAmbDeflate(entrades, { comentari: 'Exportat amb una eina qualsevol' }))[0].dades)).toBe('Hola');
    /* Una signatura falsa dins del comentari, prou lluny del final per a ser candidata: el seu comentari no hi cabria. */
    const signatura = String.fromCharCode(0x50, 0x4b, 0x05, 0x06);
    expect(text(llegeixZip(zipAmbDeflate(entrades, { comentari: `abans ${signatura}${'z'.repeat(30)}` }))[0].dades)).toBe('Hola');
    const ambBrossa = new Uint8Array([...creaZip(entrades), 1, 2, 3]);
    expect(text(llegeixZip(ambBrossa)[0].dades)).toBe('Hola');
  });

  test('nomes: les entrades que no es volen ni es descomprimixen (una malmesa no molesta)', () => {
    const zip = zipAmbDeflate([
      { nom: 'xl/workbook.xml', dades: '<workbook/>' },
      { nom: 'xl/media/image1.png', dades: 'no és un PNG', crues: new Uint8Array([0xff, 0xff, 0xff]) },
      { nom: 'xl/charts/chart1.xml', dades: '<chart/>' }
    ]);
    expect(() => llegeixZip(zip)).toThrow(/Dades comprimides malmeses: xl\/media\/image1\.png/);
    const vistos = [];
    const fitxers = llegeixZip(zip, { nomes: (nom) => vistos.push(nom) && !/^xl\/(?:media|charts)\//.test(nom) });
    expect(fitxers.map((f) => f.nom)).toEqual(['xl/workbook.xml']);
    expect(vistos).toEqual(['xl/workbook.xml', 'xl/media/image1.png', 'xl/charts/chart1.xml']);
    expect(() => llegeixZip(zip, { nomes: ['xl/workbook.xml'] })).toThrow(TypeError);
  });

  test('noms en CP437 (sense el bit 11, com els d’una eina antiga de Windows): es lligen, també els que no es volen', () => {
    /* «cafè.txt» en CP437 (è és 0x8A), i els extrems de la taula: 0x80 Ç, 0xA5 Ñ, 0xB0 ░ i 0xFF l'espai dur. */
    const cafe = new Uint8Array([0x63, 0x61, 0x66, 0x8a, 0x2e, 0x74, 0x78, 0x74]);
    const zip = zipAmbDeflate([
      { bytesNom: cafe, bitUtf8: false, dades: 'Hola' },
      { bytesNom: new Uint8Array([0x80, 0xa5, 0xb0, 0xff]), bitUtf8: false, dades: 'no cal', crues: new Uint8Array([0xff, 0xff, 0xff]) }
    ]);
    expect(llegeixZip(zip, { nomes: (nom) => nom === 'cafè.txt' }).map((f) => [f.nom, text(f.dades)])).toEqual([['cafè.txt', 'Hola']]);
    const vistos = [];
    llegeixZip(zip, { nomes: (nom) => vistos.push(nom) < 0 });
    expect(vistos).toEqual(['cafè.txt', String.fromCharCode(0xc7, 0xd1, 0x2591, 0xa0)]);
    /* Un nom en UTF-8 sense el bit (moltes eines no el posen) continua sent UTF-8. */
    expect(llegeixZip(zipAmbDeflate([{ nom: 'canço.txt', dades: 'x', bitUtf8: false }]))[0].nom).toBe('canço.txt');
    /* Amb el bit 11 i uns bytes que no són UTF-8: malmés, amb el missatge en valencià. */
    expect(() => llegeixZip(zipAmbDeflate([{ bytesNom: cafe, dades: 'x', bitUtf8: true }]))).toThrow(/Nom d'entrada malmés dins del ZIP/);
  });

  test('rebutja ZIP64, el xifrat i els altres mètodes, amb el missatge en valencià', () => {
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'a.txt', dades: 'x', zip64: true }]))).toThrow(/ZIP64 no admés/);
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'a.txt', dades: 'x' }], { localitzadorZip64: true }))).toThrow(/ZIP64 no admés/);
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'secret.xml', dades: 'x', xifrat: true }]))).toThrow(/xifrat.*: secret\.xml/);
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'a.txt', dades: 'x', metode: 12 }]))).toThrow(/Mètode de compressió 12 no admés: a\.txt/);
  });

  test('rebutja una mida declarada que no quadra i un fitxer tallat', () => {
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'a.xml', dades: XML, mida: 100 }]))).toThrow(/Mida descomprimida que no quadra: a\.xml/);
    expect(() => llegeixZip(zipAmbDeflate([{ nom: 'a.xml', dades: XML, mida: XML.length + 1 }]))).toThrow(/CRC/);
    const zip = zipAmbDeflate([{ nom: 'a.xml', dades: XML }]);
    expect(() => llegeixZip(zip.subarray(0, 40))).toThrow(TypeError);
  });

  test('maxEixida: un sostre per a tot el que es descomprimix (bombes)', () => {
    const zip = zipAmbDeflate([{ nom: 'a.xml', dades: XML }, { nom: 'b.xml', dades: XML }]);
    expect(llegeixZip(zip, { maxEixida: 2 * XML.length })).toHaveLength(2);
    expect(() => llegeixZip(zip, { maxEixida: 2 * XML.length - 1 })).toThrow(RangeError);
    expect(llegeixZip(zip, { maxEixida: XML.length, nomes: (nom) => nom === 'b.xml' })).toHaveLength(1);
    expect(() => llegeixZip(zip, { maxEixida: -1 })).toThrow(RangeError);
  });
});
