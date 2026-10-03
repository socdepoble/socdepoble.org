// @vitest-environment node
import { describe, expect, test } from 'vitest';
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
