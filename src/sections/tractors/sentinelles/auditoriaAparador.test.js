// @vitest-environment node
/* Sentinella 5 · Auditoria d'Aparador amb imatges sintètiques fetes byte a
   byte: només les capçaleres (PNG, JPEG, WebP lossy, lossless i estés) i un
   EXIF TIFF mínim amb l'IFD GPS o sense. Cap foto real ni cap ubicació real. */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_APARADOR, observaAparador } from './auditoriaAparador.js';
import { llegixCapcalera, tiffTeGps } from './imatges.js';

const u16le = (n) => [n & 0xff, (n >> 8) & 0xff];
const u16be = (n) => [(n >> 8) & 0xff, n & 0xff];
const u24le = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
const u32le = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
const u32be = (n) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
const ascii = (text) => [...text].map((c) => c.charCodeAt(0));
const entrada = (etiqueta, tipus, n, valor) => [...u16le(etiqueta), ...u16le(tipus), ...u32le(n), ...u32le(valor)];

/* TIFF little-endian: IFD0 amb el fabricant i, si de cas, el punter a l'IFD GPS. */
function tiff({ gps = null } = {}) {
  if (gps === null) return [...ascii('II'), 0x2a, 0x00, ...u32le(8), ...u16le(1), ...entrada(0x010f, 2, 4, 0), ...u32le(0)];
  const ifd0 = [...u16le(2), ...entrada(0x010f, 2, 4, 0), ...entrada(0x8825, 4, 1, 38), ...u32le(0)];
  const ifdGps = gps === 'ubicacio'
    ? [...u16le(2), ...entrada(0x0000, 1, 4, 0x0202), ...entrada(0x0002, 5, 3, 0), ...u32le(0)]
    : [...u16le(1), ...entrada(0x0000, 1, 4, 0x0202), ...u32le(0)];
  return [...ascii('II'), 0x2a, 0x00, ...u32le(8), ...ifd0, ...ifdGps];
}

const trosPng = (tipus, dades) => [...u32be(dades.length), ...ascii(tipus), ...dades, 0, 0, 0, 0];
function png(amplada, alcada, { exif = null, farciment = 0 } = {}) {
  return new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...trosPng('IHDR', [...u32be(amplada), ...u32be(alcada), 8, 2, 0, 0, 0]),
    ...(exif ? trosPng('eXIf', exif) : []),
    ...(farciment ? trosPng('IDAT', new Array(farciment).fill(0)) : []),
    ...trosPng('IEND', [])
  ]);
}

function jpeg(amplada, alcada, { exif = null } = {}) {
  const app1 = exif ? [0xff, 0xe1, ...u16be(2 + 6 + exif.length), ...ascii('Exif'), 0, 0, ...exif] : [];
  const sof0 = [0xff, 0xc0, ...u16be(17), 8, ...u16be(alcada), ...u16be(amplada), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
  return new Uint8Array([0xff, 0xd8, ...app1, ...sof0, 0xff, 0xda, 0, 2, 0xff, 0xd9]);
}

function webp(trossos) {
  const cos = trossos.flatMap(([tipus, dades]) => [...ascii(tipus), ...u32le(dades.length), ...dades, ...(dades.length % 2 ? [0] : [])]);
  return new Uint8Array([...ascii('RIFF'), ...u32le(4 + cos.length), ...ascii('WEBP'), ...cos]);
}
const vp8x = (amplada, alcada, exif = false) => ['VP8X', [exif ? 0x08 : 0, 0, 0, 0, ...u24le(amplada - 1), ...u24le(alcada - 1)]];
const vp8 = (amplada, alcada) => ['VP8 ', [0, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(amplada), ...u16le(alcada)]];
function vp8l(amplada, alcada) {
  const valor = (amplada - 1) | ((alcada - 1) << 14);
  return ['VP8L', [0x2f, valor & 0xff, (valor >> 8) & 0xff, (valor >> 16) & 0xff, (valor >>> 24) & 0xff]];
}

const codis = (eixida) => eixida.avisos.map((a) => a.codi);
const observa = (...imatges) => observaAparador({ imatges: imatges.map(([nom, bytes]) => ({ nom, bytes })) });

describe('llegixCapcalera, en bytes', () => {
  test('PNG, JPEG i els tres WebP: format i dimensions', () => {
    expect(llegixCapcalera(png(1080, 1080))).toEqual({ format: 'png', amplada: 1080, alcada: 1080, exif: false, gps: false });
    expect(llegixCapcalera(jpeg(1200, 900))).toMatchObject({ format: 'jpeg', amplada: 1200, alcada: 900 });
    expect(llegixCapcalera(webp([vp8(1000, 1000)]))).toMatchObject({ format: 'webp', amplada: 1000, alcada: 1000 });
    expect(llegixCapcalera(webp([vp8l(1024, 768)]))).toMatchObject({ format: 'webp', amplada: 1024, alcada: 768 });
    expect(llegixCapcalera(webp([vp8x(2000, 2000)]))).toMatchObject({ format: 'webp', amplada: 2000, alcada: 2000 });
  });

  test('l’EXIF amb ubicació, sense ubicació o sense GPS, als tres formats', () => {
    expect(llegixCapcalera(jpeg(1080, 1080, { exif: tiff({ gps: 'ubicacio' }) }))).toMatchObject({ exif: true, gps: true });
    expect(llegixCapcalera(jpeg(1080, 1080, { exif: tiff({ gps: 'versio' }) }))).toMatchObject({ exif: true, gps: false });
    expect(llegixCapcalera(jpeg(1080, 1080, { exif: tiff() }))).toMatchObject({ exif: true, gps: false });
    expect(llegixCapcalera(png(1080, 1080, { exif: tiff({ gps: 'ubicacio' }) }))).toMatchObject({ exif: true, gps: true });
    expect(llegixCapcalera(webp([vp8x(1080, 1080, true), ['EXIF', tiff({ gps: 'ubicacio' })]]))).toMatchObject({ exif: true, gps: true });
    expect(llegixCapcalera(webp([vp8x(1080, 1080, true), ['EXIF', [...ascii('Exif'), 0, 0, ...tiff({ gps: 'ubicacio' })]]]))).toMatchObject({ gps: true });
  });

  test('P1-64 · amb dos EXIF, la ubicació de qualsevol compta (no només l’últim)', () => {
    const sof0 = [0xff, 0xc0, ...u16be(17), 8, ...u16be(1080), ...u16be(1080), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
    const app1 = (exif) => [0xff, 0xe1, ...u16be(2 + 6 + exif.length), ...ascii('Exif'), 0, 0, ...exif];
    const jpegDoble = (primer, segon) => new Uint8Array([0xff, 0xd8, ...app1(primer), ...app1(segon), ...sof0, 0xff, 0xda, 0, 2, 0xff, 0xd9]);
    expect(llegixCapcalera(jpegDoble(tiff({ gps: 'ubicacio' }), tiff()))).toMatchObject({ exif: true, gps: true });
    expect(llegixCapcalera(jpegDoble(tiff(), tiff({ gps: 'ubicacio' })))).toMatchObject({ exif: true, gps: true });
    expect(llegixCapcalera(jpegDoble(tiff(), [...ascii('II'), 0x2a, 0, ...u32le(999)]))).toMatchObject({ gps: null });
    expect(llegixCapcalera(webp([vp8x(1080, 1080, true), ['EXIF', tiff({ gps: 'ubicacio' })], ['EXIF', tiff()]]))).toMatchObject({ gps: true });
  });

  test('un TIFF trencat no llança: torna null (no se sap)', () => {
    expect(tiffTeGps(new Uint8Array(ascii('XXXX')), 0, 4)).toBeNull();
    expect(tiffTeGps(new Uint8Array([...ascii('II'), 0x2a, 0, ...u32le(999)]), 0, 8)).toBeNull();
    expect(llegixCapcalera(jpeg(1080, 1080, { exif: [...ascii('II'), 0x2a, 0, ...u32le(999)] }))).toMatchObject({ exif: true, gps: null });
  });

  test('el que no és cap dels tres, o res, no té format', () => {
    expect(llegixCapcalera(new Uint8Array(ascii('GIF89a')))).toMatchObject({ format: null });
    expect(llegixCapcalera(undefined)).toMatchObject({ format: null });
  });
});

describe('observaAparador', () => {
  test('una imatge quadrada, prou gran i sense EXIF: cap avís', () => {
    const eixida = observa(['bona.png', png(1080, 1080)]);
    expect(eixida.avisos).toEqual([]);
    expect(eixida.informe).toContain('- bona.png: PNG 1080×1080');
    expect(eixida.informe).toContain('correcta');
  });

  test('la ubicació GPS és roja; l’EXIF sense ubicació, informatiu', () => {
    expect(observa(['gps.jpg', jpeg(1080, 1080, { exif: tiff({ gps: 'ubicacio' }) })]).avisos)
      .toEqual([expect.objectContaining({ codi: 'AP-GPS', severitat: 'roja', font: 'gps.jpg' })]);
    expect(codis(observa(['exif.jpg', jpeg(1080, 1080, { exif: tiff() })]))).toEqual(['AP-EXIF']);
    expect(codis(observa(['dubte.jpg', jpeg(1080, 1080, { exif: [...ascii('II'), 0x2a, 0, ...u32le(999)] })]))).toEqual(['AP-GPS-DUBTE']);
  });

  test('proporció, resolució, pes i mida: groga o informatiu', () => {
    expect(codis(observa(['ample.jpg', jpeg(1200, 800)]))).toEqual(['AP-PROPORCIO']);
    expect(observa(['ample.jpg', jpeg(1200, 800)]).avisos[0].missatge).toContain('1200×800 (3:2)');
    expect(codis(observa(['xicoteta.png', png(500, 500)]))).toEqual(['AP-RESOLUCIO']);
    expect(codis(observa(['enorme.webp', webp([vp8x(5000, 5000)])]))).toEqual(['AP-MASSA-GRAN']);
    expect(codis(observa(['pesada.png', png(1080, 1080, { farciment: 1600000 })]))).toEqual(['AP-PES']);
  });

  test('un format que no és de l’aparador, o un fitxer tallat: roja', () => {
    expect(codis(observa(['animada.gif', new Uint8Array(ascii('GIF89a'))]))).toEqual(['AP-FORMAT']);
    expect(codis(observa(['tallada.jpg', new Uint8Array([0xff, 0xd8, 0xff])]))).toEqual(['AP-ILLEGIBLE']);
  });

  test('sense imatges: informa; i l’informe diu que no envia res', () => {
    const eixida = observaAparador({ imatges: [] });
    expect(codis(eixida)).toEqual(['AP-SENSE-IMATGES']);
    expect(eixida.informe).toMatch(/no envia cap imatge enlloc/);
  });

  test('prepara passa els bytes triats', () => {
    const bytes = png(1080, 1080);
    expect(SENTINELLA_APARADOR.entrada.prepara([{ nom: 'a.png', bytes }])).toEqual({ imatges: [{ nom: 'a.png', bytes }] });
  });
});
