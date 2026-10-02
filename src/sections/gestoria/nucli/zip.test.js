// @vitest-environment node
/* Gestoria · nucli · zip: CRC-32 amb vectors coneguts i un ZIP STORE que un
   lector mínim (ací baix, només per a la prova) recorre pel directori central. */
import { describe, expect, test } from 'vitest';
import { crc32, creaZip } from './zip.js';

const codifica = (text) => new TextEncoder().encode(text);

/* Lector mínim: EOCD → directori central → capçalera local → dades. */
function llegeixZip(zip) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let fi = zip.length - 22;
  while (fi >= 0 && v.getUint32(fi, true) !== 0x06054b50) fi -= 1;
  if (fi < 0) throw new Error('Sense registre final');
  const total = v.getUint16(fi + 10, true);
  const final = {
    disc: v.getUint16(fi + 4, true), entradesDisc: v.getUint16(fi + 8, true), total,
    midaCentral: v.getUint32(fi + 12, true), iniciCentral: v.getUint32(fi + 16, true), comentari: v.getUint16(fi + 20, true)
  };
  const fitxers = [];
  let pos = final.iniciCentral;
  for (let i = 0; i < total; i += 1) {
    if (v.getUint32(pos, true) !== 0x02014b50) throw new Error(`Directori central trencat a ${pos}`);
    const llargNom = v.getUint16(pos + 28, true);
    const central = {
      versioFeta: v.getUint16(pos + 4, true), versio: v.getUint16(pos + 6, true), flags: v.getUint16(pos + 8, true),
      metode: v.getUint16(pos + 10, true), hora: v.getUint16(pos + 12, true), data: v.getUint16(pos + 14, true),
      crc: v.getUint32(pos + 16, true), mida: v.getUint32(pos + 20, true), midaReal: v.getUint32(pos + 24, true),
      desplacament: v.getUint32(pos + 42, true),
      nom: new TextDecoder().decode(zip.subarray(pos + 46, pos + 46 + llargNom))
    };
    const local = central.desplacament;
    if (v.getUint32(local, true) !== 0x04034b50) throw new Error(`Capçalera local trencada a ${local}`);
    const llargNomLocal = v.getUint16(local + 26, true);
    const inici = local + 30 + llargNomLocal + v.getUint16(local + 28, true);
    fitxers.push({
      ...central,
      nomLocal: new TextDecoder().decode(zip.subarray(local + 30, local + 30 + llargNomLocal)),
      crcLocal: v.getUint32(local + 14, true),
      dades: zip.slice(inici, inici + central.mida)
    });
    pos += 46 + llargNom + v.getUint16(pos + 30, true) + v.getUint16(pos + 32, true);
  }
  expect(pos - final.iniciCentral).toBe(final.midaCentral);
  return { final, fitxers };
}

describe('crc32', () => {
  test('vectors coneguts', () => {
    expect(crc32(codifica('123456789'))).toBe(0xcbf43926);
    expect(crc32(codifica(''))).toBe(0);
    expect(crc32(codifica('a'))).toBe(0xe8b7be43);
    expect(crc32(codifica('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
  });

  test('accepta ArrayBuffer i vistes parcials', () => {
    const bytes = codifica('--123456789--');
    expect(crc32(bytes.subarray(2, 11))).toBe(0xcbf43926);
    expect(crc32(codifica('123456789').buffer)).toBe(0xcbf43926);
    expect(() => crc32('123456789')).toThrow(TypeError);
  });
});

describe('creaZip', () => {
  const entrades = [
    { nom: '[Content_Types].xml', dades: codifica('<Types/>') },
    { nom: 'xl/worksheets/sheet1.xml', dades: codifica('<worksheet>Àlgebra i plaça</worksheet>') },
    { nom: 'buit.txt', dades: new Uint8Array(0) },
    { nom: 'carpeta/factura_ç.csv', dades: codifica('a,b\r\n') }
  ];

  test('el lector recupera cada fitxer, amb el CRC i l\'ordre donats', () => {
    const zip = creaZip(entrades);
    const { final, fitxers } = llegeixZip(zip);
    expect(final).toMatchObject({ disc: 0, entradesDisc: 4, total: 4, comentari: 0 });
    expect(fitxers.map((f) => f.nom)).toEqual(entrades.map((e) => e.nom));
    fitxers.forEach((f, i) => {
      expect(f.nomLocal).toBe(f.nom);
      expect(f.dades).toEqual(entrades[i].dades);
      expect(f.crc).toBe(crc32(entrades[i].dades));
      expect(f.crcLocal).toBe(f.crc);
      expect(f.mida).toBe(f.midaReal);
    });
  });

  test('STORE, data DOS 1980-01-01 00:00 i bit 11 només als noms que no són ASCII', () => {
    const { fitxers } = llegeixZip(creaZip(entrades));
    for (const f of fitxers) {
      expect(f.metode).toBe(0);
      expect(f.hora).toBe(0);
      expect([f.data >> 9, (f.data >> 5) & 0x0f, f.data & 0x1f]).toEqual([0, 1, 1]);
      expect(f.versio).toBe(20);
    }
    expect(fitxers.map((f) => (f.flags & 0x0800) !== 0)).toEqual([false, false, false, true]);
  });

  test('determinista: la mateixa entrada, els mateixos bytes', () => {
    expect(creaZip(entrades)).toEqual(creaZip(entrades));
  });

  test('ZIP buit: només el registre final', () => {
    const zip = creaZip([]);
    expect(zip).toHaveLength(22);
    expect(llegeixZip(zip).fitxers).toEqual([]);
  });

  test('entrades no vàlides', () => {
    expect(() => creaZip(null)).toThrow(TypeError);
    expect(() => creaZip([{ nom: '', dades: new Uint8Array(1) }])).toThrow(TypeError);
    expect(() => creaZip([{ nom: '/absolut.xml', dades: new Uint8Array(1) }])).toThrow(TypeError);
    expect(() => creaZip([{ nom: 'a\\b.xml', dades: new Uint8Array(1) }])).toThrow(TypeError);
    expect(() => creaZip([{ nom: 'a.xml', dades: 'text' }])).toThrow(TypeError);
    expect(() => creaZip([{ nom: 'a.xml', dades: new Uint8Array(1) }, { nom: 'a.xml', dades: new Uint8Array(1) }])).toThrow(RangeError);
  });
});
